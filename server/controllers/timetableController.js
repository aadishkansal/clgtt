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
      .populate(
        "schedule.subjectCode",
        "subjectCode name type lectureCredits tutorialCredits practicalCredits"
      )
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
      .populate(
        "schedule.subjectCode",
        "subjectCode name type lectureCredits tutorialCredits practicalCredits"
      )
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
      department,
      subject,
      faculty,
      classroom,
      batch,
      days,
      timeSlots,
      breakSlots,
    } = req.body;

    const missingFields = {
      year: !year,
      semester: !semester,
      section: !section,
      department: !department,
      subject: !subject,
      faculty: !faculty,
      classroom: !classroom,
      batch: !batch,
      days: !days,
      timeSlots: !timeSlots || timeSlots.length === 0,
    };

    if (Object.values(missingFields).some((v) => v)) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        missingFields,
      });
    }

    // Check Conflicts
    const conflictCheck = await detectConflicts({
      year: parseInt(year),
      semester: parseInt(semester),
      section: section.toUpperCase(),
      department,
      subject,
      faculty,
      classroom,
      timeSlots,
      batchGroup: batch,
    });

    if (conflictCheck.hasCriticalConflicts) {
      return res.status(409).json({
        success: false,
        message: "Critical conflicts detected",
        conflicts: conflictCheck.conflicts,
      });
    }

    const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

    // Find or Create Timetable Document
    let timetable = await Timetable.findOneAndUpdate(
      {
        year: parseInt(year),
        semester: parseInt(semester),
        section: section.toUpperCase(),
        department: department,
        academicYear,
      },
      {
        $setOnInsert: {
          department: department,
          section: section.toUpperCase(),
          schedule: [],
          breaks: [],
          conflicts: [],
          isPublished: false,
        },
      },
      { upsert: true, new: true }
    );

    // Update Schedule
    timeSlots.forEach((slotId) => {
      // Remove existing entry for this slot+batch to avoid duplicates
      timetable.schedule = timetable.schedule.filter(
        (entry) =>
          !(
            entry.timeslotID?.toString() === slotId &&
            entry.batchGroup === batch
          )
      );

      // Add new entry
      timetable.schedule.push({
        subjectCode: subject,
        facultyID: faculty,
        classroomID: classroom,
        timeslotID: slotId,
        batchGroup: batch,
        isRMC: false,
      });
    });

    if (breakSlots && Array.isArray(breakSlots)) {
      breakSlots.forEach((slotId) => {
        if (
          !timetable.breaks.some((b) => b.timeslotID?.toString() === slotId)
        ) {
          timetable.breaks.push({ timeslotID: slotId, label: "Break" });
        }
      });
    }

    await timetable.save();
    res
      .status(201)
      .json({ success: true, message: "Entry added/updated", timetable });
  } catch (error) {
    next(error);
  }
};

export const getAvailableTimeSlots = async (req, res, next) => {
  try {
    const { year, semester, faculty, classroom, selectedDays } = req.query;

    if (!year || !semester || !selectedDays) {
      return res.status(400).json({
        success: false,
        message: "year, semester, and selectedDays are required",
      });
    }

    const daysArray = selectedDays.split(",");

    // Dynamic imports to avoid circular dependency issues if any exist
    const TimeSlot = (await import("../models/TimeSlot.js")).default;
    const Timetable = (await import("../models/Timetable.js")).default;

    const allSlots = await TimeSlot.find({
      day: { $in: daysArray },
    }).sort({ day: 1, periodNumber: 1 });

    const allTimetables = await Timetable.find({})
      .populate("schedule.timeslotID", "_id day startTime")
      .populate("breaks.timeslotID", "_id day startTime");

    const occupiedSlotIds = new Set();
    const conflictsBySlot = {};

    // Check Faculty Conflicts
    if (faculty) {
      allTimetables.forEach((timetable) => {
        timetable.schedule.forEach((entry) => {
          if (entry.facultyID?.toString() === faculty.toString()) {
            const slotId = entry.timeslotID?._id?.toString();
            if (slotId) {
              occupiedSlotIds.add(slotId);
              if (!conflictsBySlot[slotId]) conflictsBySlot[slotId] = [];
              conflictsBySlot[slotId].push({
                type: "faculty",
                message: `Faculty occupied (Year ${timetable.year})`,
              });
            }
          }
        });
      });
    }

    // Check Classroom Conflicts
    if (classroom) {
      allTimetables.forEach((timetable) => {
        timetable.schedule.forEach((entry) => {
          if (entry.classroomID?.toString() === classroom.toString()) {
            const slotId = entry.timeslotID?._id?.toString();
            if (slotId) {
              occupiedSlotIds.add(slotId);
              if (!conflictsBySlot[slotId]) conflictsBySlot[slotId] = [];
              conflictsBySlot[slotId].push({
                type: "classroom",
                message: `Classroom occupied (Year ${timetable.year})`,
              });
            }
          }
        });
      });
    }

    const availableSlots = allSlots.filter(
      (slot) => !occupiedSlotIds.has(slot._id.toString())
    );

    res.status(200).json({
      success: true,
      total: allSlots.length,
      occupied: occupiedSlotIds.size,
      available: availableSlots.length,
      availableSlots,
      conflicts: conflictsBySlot,
    });
  } catch (error) {
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

export const deleteTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findByIdAndDelete(req.params.id);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Timetable deleted successfully",
      id: req.params.id,
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
      .populate(
        "schedule.subjectCode",
        "subjectCode name type lectureCredits tutorialCredits practicalCredits"
      )
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

    const formattedData = {
      year: timetable.year,
      section: timetable.section,
      academicYear: timetable.academicYear,
      semester: timetable.semester,
      department: timetable.department,
      schedule: timetable.schedule.map((entry) => ({
        subject: entry.subjectCode,
        faculty: entry.facultyID,
        classroom: entry.classroomID,
        timeslot: entry.timeslotID,
        batchGroup: entry.batchGroup,
        isRMC: entry.isRMC,
      })),
      breaks: timetable.breaks.map((breakEntry) => ({
        _id: breakEntry._id,
        timeslot: breakEntry.timeslotID,
      })),
    };

    const pdfBuffer = await generateTimetablePDF(formattedData);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=timetable.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
