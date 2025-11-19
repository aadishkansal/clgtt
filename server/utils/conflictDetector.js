import Timetable from "../models/Timetable.js";

/**
 * Checks for conflicts for a new timetable entry.
 */
export const detectConflicts = async ({
  year,
  semester,
  section,
  department,
  faculty,
  classroom,
  subject,
  timeSlots,
  batchGroup,
}) => {
  const conflicts = [];
  let hasCriticalConflicts = false;

  if (!timeSlots || timeSlots.length === 0) {
    return { conflicts, hasCriticalConflicts };
  }

  const allTimetables = await Timetable.find({}).populate(
    "schedule.timeslotID",
    "day startTime"
  );

  const targetTimetable = allTimetables.find(
    (t) =>
      t.year === year &&
      t.semester === semester &&
      t.section === section?.toUpperCase() &&
      t.department === department
  );

  for (const slotId of timeSlots) {
    for (const tt of allTimetables) {
      // Skip the target timetable to avoid false positives during updates.
      // Internal conflicts are handled by the batch check below.
      if (tt === targetTimetable) continue;

      // Check Faculty
      const facultyBooking = tt.schedule.find(
        (entry) =>
          entry.facultyID?.toString() === faculty &&
          entry.timeslotID?._id?.toString() === slotId
      );

      if (facultyBooking) {
        const conflictMsg = `Faculty Conflict: Faculty is already teaching in ${tt.department} (Y${tt.year}-S${tt.semester}) at this time.`;
        conflicts.push({
          type: "Faculty",
          severity: "critical",
          message: conflictMsg,
          slotId: slotId,
        });
        hasCriticalConflicts = true;
      }

      // Check Classroom
      const classroomBooking = tt.schedule.find(
        (entry) =>
          entry.classroomID?.toString() === classroom &&
          entry.timeslotID?._id?.toString() === slotId
      );

      if (classroomBooking) {
        const conflictMsg = `Classroom Conflict: Room is occupied by ${tt.department} (Y${tt.year}-S${tt.semester}) at this time.`;
        conflicts.push({
          type: "Classroom",
          severity: "critical",
          message: conflictMsg,
          slotId: slotId,
        });
        hasCriticalConflicts = true;
      }
    }

    // Check Student Batch Availability
    if (targetTimetable) {
      const entriesInThisSlot = targetTimetable.schedule.filter(
        (entry) => entry.timeslotID?._id?.toString() === slotId
      );

      if (entriesInThisSlot.length > 0) {
        // Check for overwrite (same subject + batch)
        const isSameEntry = entriesInThisSlot.some(
          (e) =>
            e.subjectCode?.toString() === subject && e.batchGroup === batchGroup
        );

        if (!isSameEntry) {
          const existingBatches = entriesInThisSlot.map((b) => b.batchGroup);
          let batchConflictFound = false;

          // Case A: Trying to schedule "Full" class -> Conflict if ANY batch exists
          if (batchGroup === "Full" && existingBatches.length > 0) {
            batchConflictFound = true;
          }

          // Case B: Trying to schedule any Batch -> Conflict if "Full" exists
          if (existingBatches.includes("Full")) {
            batchConflictFound = true;
          }

          // Case C: Specific Batch -> Conflict only if SAME batch exists
          if (existingBatches.includes(batchGroup)) {
            batchConflictFound = true;
          }

          if (batchConflictFound) {
            const conflictMsg = `Batch Conflict: Group (${existingBatches.join(
              ", "
            )}) already has a class at this time.`;
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
    }
  }

  return {
    conflicts,
    hasCriticalConflicts,
  };
};
