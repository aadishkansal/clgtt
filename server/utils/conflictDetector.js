import Timetable from "../models/Timetable.js";
import Faculty from "../models/Faculty.js";
import Classroom from "../models/Classroom.js";
import Subject from "../models/Subject.js";
import TimeSlot from "../models/TimeSlot.js";

export const detectConflicts = async (entryData) => {
  const { year, semester, subject, faculty, classroom, timeSlots, entryId } =
    entryData;
  const conflicts = [];

  console.log("\n" + "=".repeat(100));
  console.log("ðŸ” CONFLICT DETECTION STARTED");
  console.log("=".repeat(100));
  console.log("ðŸ“‹ INPUT DATA:");
  console.log(
    JSON.stringify(
      {
        year,
        semester,
        subject,
        faculty,
        classroom,
        timeSlotsCount: timeSlots?.length || 0,
        timeSlotIds: timeSlots?.slice(0, 3), // Show first 3
      },
      null,
      2
    )
  );

  try {
    // ========== 1. FACULTY CONFLICT CHECK ==========
    if (!faculty || !timeSlots || timeSlots.length === 0) {
      console.log(
        "âš ï¸ SKIPPING FACULTY CHECK - Missing faculty or timeSlots"
      );
    } else {
      console.log("\n" + "-".repeat(100));
      console.log("1ï¸âƒ£ CHECKING FACULTY CONFLICTS");
      console.log("-".repeat(100));
      console.log(`Faculty ID to check: ${faculty}`);
      console.log(`Time slots to check: ${timeSlots.length}`);

      // Get ALL timetables in this semester
      const allTimetables = await Timetable.find({
        semester: parseInt(semester),
      }).populate([
        { path: "schedule.facultyID", select: "name facultyID _id" },
        { path: "schedule.timeslotID", select: "day startTime endTime _id" },
        { path: "schedule.subjectCode", select: "subjectCode name _id" },
      ]);

      console.log(
        `Found ${allTimetables.length} existing timetables for semester ${semester}`
      );

      // Check each existing timetable
      for (const existingTimetable of allTimetables) {
        console.log(
          `\n  ðŸ“Œ Checking timetable for Year ${existingTimetable.year}`
        );
        console.log(
          `     Schedule entries: ${existingTimetable.schedule.length}`
        );

        // For each new time slot we want to add
        for (const newTimeSlotId of timeSlots) {
          console.log(`    â° Checking time slot: ${newTimeSlotId}`);

          // Look through existing schedule entries
          for (const existingEntry of existingTimetable.schedule) {
            const existingFacultyId = existingEntry.facultyID?._id?.toString();
            const existingTimeSlotId =
              existingEntry.timeslotID?._id?.toString();

            const facultyMatch = existingFacultyId === faculty.toString();
            const timeSlotMatch =
              existingTimeSlotId === newTimeSlotId.toString();

            if (facultyMatch && timeSlotMatch) {
              const conflictMsg = `Faculty "${existingEntry.facultyID?.name}" is already teaching "${existingEntry.subjectCode?.name}" for Year ${existingTimetable.year} at ${existingEntry.timeslotID?.day} ${existingEntry.timeslotID?.startTime}`;

              conflicts.push({
                type: "faculty",
                severity: "critical",
                message: conflictMsg,
              });

              console.log(`    âŒ CONFLICT FOUND: ${conflictMsg}`);
              break; // Found conflict for this time slot
            }
          }
        }
      }
    }

    // ========== 2. CLASSROOM CONFLICT CHECK ==========
    if (!classroom || !timeSlots || timeSlots.length === 0) {
      console.log(
        "\nâš ï¸ SKIPPING CLASSROOM CHECK - Missing classroom or timeSlots"
      );
    } else {
      console.log("\n" + "-".repeat(100));
      console.log("2ï¸âƒ£ CHECKING CLASSROOM CONFLICTS");
      console.log("-".repeat(100));
      console.log(`Classroom ID to check: ${classroom}`);

      const allTimetables = await Timetable.find({
        semester: parseInt(semester),
      }).populate([
        { path: "schedule.classroomID", select: "roomNumber block _id" },
        { path: "schedule.timeslotID", select: "day startTime _id" },
        { path: "schedule.subjectCode", select: "subjectCode _id" },
      ]);

      console.log(`Found ${allTimetables.length} existing timetables`);

      for (const existingTimetable of allTimetables) {
        console.log(
          `\n  ðŸ“Œ Checking timetable for Year ${existingTimetable.year}`
        );

        for (const newTimeSlotId of timeSlots) {
          for (const existingEntry of existingTimetable.schedule) {
            const existingClassroomId =
              existingEntry.classroomID?._id?.toString();
            const existingTimeSlotId =
              existingEntry.timeslotID?._id?.toString();

            const classroomMatch = existingClassroomId === classroom.toString();
            const timeSlotMatch =
              existingTimeSlotId === newTimeSlotId.toString();

            if (classroomMatch && timeSlotMatch) {
              const conflictMsg = `Classroom "${existingEntry.classroomID?.roomNumber}" is already booked for Year ${existingTimetable.year} at ${existingEntry.timeslotID?.day} ${existingEntry.timeslotID?.startTime}`;

              conflicts.push({
                type: "classroom",
                severity: "critical",
                message: conflictMsg,
              });

              console.log(`    âŒ CONFLICT FOUND: ${conflictMsg}`);
              break;
            }
          }
        }
      }
    }

    // ========== 3. EXPERTISE CHECK ==========
    if (!faculty || !subject) {
      console.log(
        "\nâš ï¸ SKIPPING EXPERTISE CHECK - Missing faculty or subject"
      );
    } else {
      console.log("\n" + "-".repeat(100));
      console.log("3ï¸âƒ£ CHECKING FACULTY EXPERTISE");
      console.log("-".repeat(100));

      const facultyData = await Faculty.findById(faculty).populate("subjects");
      const subjectData = await Subject.findById(subject);

      console.log(`Faculty: ${facultyData?.name}`);
      console.log(`Subject: ${subjectData?.name}`);
      console.log(
        `Faculty's subjects count: ${facultyData?.subjects?.length || 0}`
      );

      const isQualified = facultyData?.subjects?.some(
        (sub) => sub._id?.toString() === subject.toString()
      );

      if (!isQualified) {
        const msg = `Faculty "${facultyData?.name}" is not assigned to teach "${subjectData?.name}"`;
        conflicts.push({
          type: "expertise",
          severity: "warning",
          message: msg,
        });
        console.log(`âš ï¸ WARNING: ${msg}`);
      } else {
        console.log(`âœ… Faculty is qualified`);
      }
    }

    // ========== 4. CAPACITY CHECK ==========
    if (!classroom) {
      console.log("\nâš ï¸ SKIPPING CAPACITY CHECK - Missing classroom");
    } else {
      console.log("\n" + "-".repeat(100));
      console.log("4ï¸âƒ£ CHECKING CLASSROOM CAPACITY");
      console.log("-".repeat(100));

      const classroomData = await Classroom.findById(classroom);
      const estimatedStudents = 60;

      console.log(`Classroom capacity: ${classroomData?.capacity}`);
      console.log(`Estimated students: ${estimatedStudents}`);

      if (classroomData && classroomData.capacity < estimatedStudents) {
        const msg = `Classroom capacity (${classroomData.capacity}) may be insufficient for ${estimatedStudents} students`;
        conflicts.push({
          type: "capacity",
          severity: "warning",
          message: msg,
        });
        console.log(`âš ï¸ WARNING: ${msg}`);
      } else {
        console.log(`âœ… Capacity is sufficient`);
      }
    }

    const criticalCount = conflicts.filter(
      (c) => c.severity === "critical"
    ).length;
    const warningCount = conflicts.filter(
      (c) => c.severity === "warning"
    ).length;

    console.log("\n" + "=".repeat(100));
    console.log("ðŸ“Š CONFLICT DETECTION SUMMARY");
    console.log("=".repeat(100));
    console.log(`Critical: ${criticalCount}`);
    console.log(`Warnings: ${warningCount}`);

    if (conflicts.length > 0) {
      console.log("\nðŸ“‹ CONFLICTS FOUND:");
      conflicts.forEach((c, i) => {
        console.log(
          `  ${i + 1}. [${c.severity.toUpperCase()}] ${c.type}: ${c.message}`
        );
      });
    } else {
      console.log("âœ… NO CONFLICTS DETECTED");
    }

    console.log("=".repeat(100) + "\n");

    return {
      hasConflicts: conflicts.length > 0,
      hasCriticalConflicts: criticalCount > 0,
      conflicts,
    };
  } catch (error) {
    console.error("âŒ ERROR IN CONFLICT DETECTION:", error.message);
    console.error(error.stack);
    throw error;
  }
};
