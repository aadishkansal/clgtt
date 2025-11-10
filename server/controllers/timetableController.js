import Timetable from "../models/Timetable.js";
import { detectConflicts } from "../utils/conflictDetector.js";
import { generateTimetablePDF } from "../utils/pdfGenerator.js";

export const getTimetable = async (req, res, next) => {
  try {
    const { year, semester, section } = req.query;

    let query = {};
    if (year) query.year = parseInt(year);
    if (semester) query.semester = parseInt(semester);
    if (section) query.section = section.toUpperCase();

    const timetables = await Timetable.find(query)
      .populate("schedule.subjectCode", "subjectCode name type")
      .populate("schedule.facultyID", "name facultyID")
      .populate("schedule.classroomID", "roomNumber block capacity")
      .populate("schedule.timeslotID", "day startTime endTime");

    res.status(200).json({
      success: true,
      count: timetables.length,
      timetables,
    });
  } catch (error) {
    next(error);
  }
};

export const getTimetableById = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate("schedule.subjectCode")
      .populate("schedule.facultyID")
      .populate("schedule.classroomID")
      .populate("schedule.timeslotID");

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    res.status(200).json({
      success: true,
      timetable,
    });
  } catch (error) {
    next(error);
  }
};

export const validateTimetableEntry = async (req, res, next) => {
  try {
    const validation = await detectConflicts(req.body);

    res.status(200).json({
      success: true,
      isValid: !validation.hasCriticalConflicts,
      conflicts: validation.conflicts,
      hasCriticalConflicts: validation.hasCriticalConflicts,
    });
  } catch (error) {
    next(error);
  }
};

export const createTimetableEntry = async (req, res, next) => {
  try {
    const {
      year,
      semester,
      section,
      subject,
      subjectType,
      faculty,
      classroom,
      batch,
      days,
      timeSlots, // This is an array: ["id1", "id2"]
      breakSlots,
    } = req.body;

    // ... (keep validation logic) ...
    const missingFields = {
      year: !year,
      semester: !semester,
      section: !section,
      subject: !subject,
      faculty: !faculty,
      classroom: !classroom,
      batch: !batch,
      days: !days,
      timeSlots: !timeSlots || timeSlots.length === 0, // Check for empty array
    };
    if (Object.values(missingFields).some((v) => v)) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        missingFields,
      });
    }

    // RUN CONFLICT DETECTION (This part is fine, it calls the detector)
    const conflictCheck = await detectConflicts({
      year: parseInt(year),
      semester: parseInt(semester),
      section: section.toUpperCase(),
      subject,
      faculty,
      classroom,
      timeSlots, // Pass the whole array
      batchGroup: batch,
    });

    if (conflictCheck.hasCriticalConflicts) {
      // ... (error handling is fine)
      return res.status(409).json({
        /* ... */
      });
    }

    const academicYear = `${new Date().getFullYear()}-${
      new Date().getFullYear() + 1
    }`;

    let timetable = await Timetable.findOneAndUpdate(
      {
        year: parseInt(year),
        semester: parseInt(semester),
        section: section.toUpperCase(),
        academicYear,
      },
      {
        $setOnInsert: {
          section: section.toUpperCase(),
          schedule: [],
          breaks: [],
          conflicts: [],
          isPublished: false,
        },
      },
      { upsert: true, new: true }
    );

    console.log(`ðŸ“‹ Using timetable ID: ${timetable._id}`);

    // ✅ --- THIS IS THE FIX ---
    // Create a new schedule entry for *each* slot ID
    console.log(
      `\nâž• Adding ${timeSlots.length} schedule entries for subject ${subject}`
    );

    timeSlots.forEach((slotId) => {
      timetable.schedule.push({
        subjectCode: subject,
        facultyID: faculty,
        classroomID: classroom,
        timeslotID: slotId, // Add one entry per slot ID
        batchGroup: batch,
        isRMC: false,
      });
    });
    // ✅ --- END OF FIX ---

    // Add breaks if provided
    if (breakSlots && Array.isArray(breakSlots) && breakSlots.length > 0) {
      // ... (your break logic is fine) ...
    }

    await timetable.save();
    console.log("ðŸ’¾ Saved to database");

    // ... (populate and return response is fine) ...

    res.status(201).json({
      success: true,
      message: "Entry added to timetable",
      timetable,
    });
  } catch (error) {
    console.error("\nâŒ ERROR:", error.message);
    next(error);
  }
};

export const getAvailableTimeSlots = async (req, res, next) => {
  try {
    const { year, semester, faculty, classroom, selectedDays } = req.query;

    console.log("\nðŸ“ GET AVAILABLE TIME SLOTS");
    console.log("Parameters:", {
      year,
      semester,
      faculty,
      classroom,
      selectedDays,
    });

    if (!year || !semester || !selectedDays) {
      return res.status(400).json({
        success: false,
        message: "year, semester, and selectedDays are required",
      });
    }

    const daysArray = selectedDays.split(",");
    console.log("Days to check:", daysArray);

    // Import models
    const TimeSlot = (await import("../models/TimeSlot.js")).default;
    const Timetable = (await import("../models/Timetable.js")).default;

    // Get ALL time slots for selected days
    const allSlots = await TimeSlot.find({
      day: { $in: daysArray },
    }).sort({ day: 1, periodNumber: 1 });

    console.log(`Found ${allSlots.length} total slots for selected days`);

    // Get occupied slots across ALL years for same semester
    const occupiedTimetables = await Timetable.find({
      semester: parseInt(semester),
    })
      .populate("schedule.timeslotID", "_id day startTime")
      .populate("breaks.timeslotID", "_id day startTime");

    console.log(
      `Found ${occupiedTimetables.length} timetables for semester ${semester}`
    );

    const occupiedSlotIds = new Set();
    const breakSlotIds = new Set();
    const conflictsBySlot = {};

    // Check for existing breaks
    console.log(`\nðŸ”— Checking for existing breaks...`);
    occupiedTimetables.forEach((timetable) => {
      timetable.breaks?.forEach((breakEntry) => {
        const slotId = breakEntry.timeslotID?._id?.toString();
        if (slotId) {
          breakSlotIds.add(slotId);
        }
      });
    });

    // Check faculty conflicts
    if (faculty) {
      console.log(`\nðŸ” Checking faculty conflicts for: ${faculty}`);

      occupiedTimetables.forEach((timetable) => {
        timetable.schedule.forEach((entry) => {
          if (entry.facultyID?.toString() === faculty.toString()) {
            const slotId = entry.timeslotID?._id?.toString();
            if (slotId) {
              occupiedSlotIds.add(slotId);
              if (!conflictsBySlot[slotId]) {
                conflictsBySlot[slotId] = [];
              }
              conflictsBySlot[slotId].push({
                type: "faculty",
                year: timetable.year,
                message: `Faculty occupied at this time (Year ${timetable.year})`,
              });
            }
          }
        });
      });
    }

    // Check classroom conflicts
    if (classroom) {
      console.log(`\nðŸ” Checking classroom conflicts for: ${classroom}`);

      occupiedTimetables.forEach((timetable) => {
        // A classroom can't be in two places at once, regardless of year
        timetable.schedule.forEach((entry) => {
          if (entry.classroomID?.toString() === classroom.toString()) {
            const slotId = entry.timeslotID?._id?.toString();
            if (slotId) {
              occupiedSlotIds.add(slotId);
              if (!conflictsBySlot[slotId]) {
                conflictsBySlot[slotId] = [];
              }
              conflictsBySlot[slotId].push({
                type: "classroom",
                year: timetable.year,
                message: `Classroom already booked at this time`,
              });
            }
          }
        });
      });
    }

    console.log(`\nðŸ“Š Summary:`);
    console.log(`  Total slots: ${allSlots.length}`);
    console.log(`  Occupied by classes: ${occupiedSlotIds.size}`);
    console.log(`  Already marked as breaks: ${breakSlotIds.size}`);

    const availableSlots = allSlots.filter(
      (slot) =>
        !occupiedSlotIds.has(slot._id.toString()) &&
        !breakSlotIds.has(slot._id.toString())
    );

    console.log(`âœ… Available for selection: ${availableSlots.length}`);

    res.status(200).json({
      success: true,
      total: allSlots.length,
      occupied: occupiedSlotIds.size,
      breaks: breakSlotIds.size,
      available: availableSlots.length,
      availableSlots,
      conflicts: conflictsBySlot,
      breakSlotIds: Array.from(breakSlotIds),
    });
  } catch (error) {
    console.error("âŒ Error getting available slots:", error);
    next(error);
  }
};

export const updateTimetableEntry = async (req, res, next) => {
  try {
    const { entryIndex, timeslotID } = req.body;

    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    if (!timetable.schedule[entryIndex]) {
      return res.status(400).json({
        success: false,
        message: "Entry not found",
      });
    }

    timetable.schedule[entryIndex].timeslotID = timeslotID;
    await timetable.save();

    res.status(200).json({
      success: true,
      message: "Timetable entry updated successfully",
      timetable,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBreak = async (req, res, next) => {
  try {
    const { breakId } = req.params;

    if (!breakId) {
      return res.status(400).json({
        success: false,
        message: "Break ID is required",
      });
    }

    const timetable = await Timetable.findOneAndUpdate(
      { "breaks._id": breakId },
      { $pull: { breaks: { _id: breakId } } },
      { new: true }
    );

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Break not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Break deleted successfully",
      timetable,
    });
  } catch (error) {
    console.error("âŒ Error deleting break:", error);
    next(error);
  }
};

export const deleteTimetableEntry = async (req, res, next) => {
  try {
    const { entryIndex } = req.body;

    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    timetable.schedule.splice(entryIndex, 1);
    await timetable.save();

    res.status(200).json({
      success: true,
      message: "Timetable entry deleted successfully",
      timetable,
    });
  } catch (error) {
    next(error);
  }
};

export const publishTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    timetable.isPublished = true;
    timetable.publishedAt = new Date();
    await timetable.save();

    res.status(200).json({
      success: true,
      message: "Timetable published successfully",
      timetable,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadPDF = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate("schedule.subjectCode", "subjectCode name type")
      .populate("schedule.facultyID", "name facultyID")
      .populate("schedule.classroomID", "roomNumber block capacity")
      .populate("schedule.timeslotID", "day startTime endTime periodNumber")
      .populate("breaks.timeslotID", "day startTime endTime periodNumber");

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    console.log(
      `Generating PDF for timetable ${timetable._id} with ${timetable.schedule.length} entries and ${timetable.breaks.length} breaks`
    );

    // Pass full schedule and breaks to PDF generator
    const formattedData = {
      year: timetable.year,
      section: timetable.section,
      academicYear: timetable.academicYear,
      semester: timetable.semester,

      // Format schedule
      schedule: timetable.schedule.map((entry) => ({
        subject: entry.subjectCode,
        faculty: entry.facultyID,
        classroom: entry.classroomID,
        timeslot: entry.timeslotID, // Key is 'timeslot'
        batchGroup: entry.batchGroup,
        isRMC: entry.isRMC,
      })),

      // Format breaks
      breaks: timetable.breaks.map((breakEntry) => ({
        _id: breakEntry._id,
        timeslot: breakEntry.timeslotID, // Key is 'timeslot'
      })),
    };

    console.log(
      `PDF generator receiving ${formattedData.schedule.length} entries and ${formattedData.breaks.length} breaks`
    );

    const pdfBuffer = await generateTimetablePDF(formattedData);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=timetable-Y${timetable.year}-S${timetable.semester}-${new Date().getTime()}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    next(error);
  }
};
