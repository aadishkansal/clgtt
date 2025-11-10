import Timetable from "../models/Timetable.js";

/**
 * Checks for conflicts for a new timetable entry.
 */
export const detectConflicts = async ({
  year,
  semester,
  section,
  faculty,
  classroom,
  timeSlots,
  batchGroup,
}) => {
  const conflicts = [];
  let hasCriticalConflicts = false;

  console.log("🕵️ Backend Conflict Detector running for:", {
    year,
    semester,
    section,
    faculty,
    classroom,
    timeSlots,
    batchGroup,
  });

  if (!timeSlots || timeSlots.length === 0) {
    return { conflicts, hasCriticalConflicts };
  }

  // ✅ FIX: Find ALL timetables, not just those in the same semester.
  // This is required for global faculty/classroom conflict detection.
  const allTimetables = await Timetable.find({}).populate(
    "schedule.timeslotID",
    "day startTime"
  );

  // Find the specific timetable for our target year/section to check for batch clashes
  const targetTimetable = allTimetables.find(
    (t) =>
      t.year === year &&
      t.semester === semester &&
      t.section === section?.toUpperCase()
  );

  for (const slotId of timeSlots) {
    // --- Check 1: Faculty Conflict (Global / Inter-Year) ---
    for (const tt of allTimetables) {
      const facultyBooking = tt.schedule.find(
        (entry) =>
          entry.facultyID?.toString() === faculty &&
          entry.timeslotID?._id?.toString() === slotId
      );

      if (facultyBooking) {
        const conflictMsg = `Faculty Conflict: Faculty is booked in Year ${tt.year}, Section ${tt.section} at this time.`;
        conflicts.push({
          type: "Faculty",
          severity: "critical",
          message: conflictMsg,
          slotId: slotId,
        });
        hasCriticalConflicts = true;
      }
    }

    // --- Check 2: Classroom Conflict (Global / Inter-Year) ---
    for (const tt of allTimetables) {
      const classroomBooking = tt.schedule.find(
        (entry) =>
          entry.classroomID?.toString() === classroom &&
          entry.timeslotID?._id?.toString() === slotId
      );

      if (classroomBooking) {
        const conflictMsg = `Classroom Conflict: Room is booked for Year ${tt.year}, Section ${tt.section} (Batch ${classroomBooking.batchGroup}) at this time.`;
        conflicts.push({
          type: "Classroom",
          severity: "critical",
          message: conflictMsg,
          slotId: slotId,
        });
        hasCriticalConflicts = true;
      }
    }

    // --- Check 3: Student Batch Conflict (Local / Intra-Year) ---
    if (targetTimetable) {
      const entriesInThisSlot = targetTimetable.schedule.filter(
        (entry) => entry.timeslotID?._id?.toString() === slotId
      );

      if (entriesInThisSlot.length > 0) {
        const existingBatches = entriesInThisSlot.map((b) => b.batchGroup);
        let batchConflictFound = false;

        if (batchGroup === "Full" && existingBatches.length > 0) {
          batchConflictFound = true;
        }
        if (existingBatches.includes("Full")) {
          batchConflictFound = true;
        }
        if (existingBatches.includes(batchGroup)) {
          batchConflictFound = true;
        }

        if (batchConflictFound) {
          const conflictMsg = `Student Batch Conflict: Group (${existingBatches.join(
            ", "
          )}) is already scheduled at this time.`;
          conflicts.push({
            type: "Batch",
            severity: "critical",
            message: conflictMsg,
            slotId: slotId,
          });
          hasCriticalConflicts = true;
        }
      }
    }
  } // end of for...of timeSlots loop

  console.log(
    `✅ Conflict detection complete. Critical: ${hasCriticalConflicts}, Total: ${conflicts.length}`
  );

  return {
    conflicts,
    hasCriticalConflicts,
  };
};
