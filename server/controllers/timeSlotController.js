import TimeSlot from "../models/TimeSlot.js";

export const getAllTimeSlots = async (req, res) => {
  try {
    console.log("â° Fetching all time slots...");
    const timeSlots = await TimeSlot.find().sort({ day: 1, periodNumber: 1 });

    console.log(`âœ… Found ${timeSlots.length} time slots`);

    res.json({
      success: true,
      count: timeSlots.length,
      data: timeSlots, // âœ… Changed to 'data' for consistency
      timeSlots, // Keep both for backward compatibility
    });
  } catch (error) {
    console.error("âŒ Error fetching time slots:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching time slots",
      error: error.message,
    });
  }
};

export const getTimeSlotById = async (req, res, next) => {
  try {
    const timeSlot = await TimeSlot.findById(req.params.id);

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found",
      });
    }

    res.status(200).json({
      success: true,
      timeSlot,
    });
  } catch (error) {
    next(error);
  }
};

export const createTimeSlot = async (req, res, next) => {
  try {
    const { slotID, day, startTime, endTime, duration, periodNumber, isBreak } =
      req.body;

    let timeSlot = await TimeSlot.findOne({ slotID });
    if (timeSlot) {
      return res.status(400).json({
        success: false,
        message: "Slot ID already exists",
      });
    }

    timeSlot = await TimeSlot.create({
      slotID,
      day,
      startTime,
      endTime,
      duration,
      periodNumber,
      isBreak: isBreak || false,
    });

    res.status(201).json({
      success: true,
      message: "Time slot created successfully",
      timeSlot,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTimeSlot = async (req, res, next) => {
  try {
    const { day, startTime, endTime, duration, periodNumber, isBreak } =
      req.body;

    let timeSlot = await TimeSlot.findById(req.params.id);

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found",
      });
    }

    if (day) timeSlot.day = day;
    if (startTime) timeSlot.startTime = startTime;
    if (endTime) timeSlot.endTime = endTime;
    if (duration) timeSlot.duration = duration;
    if (periodNumber) timeSlot.periodNumber = periodNumber;
    if (typeof isBreak !== "undefined") timeSlot.isBreak = isBreak;

    await timeSlot.save();

    res.status(200).json({
      success: true,
      message: "Time slot updated successfully",
      timeSlot,
    });
  } catch (error) {
    next(error);
  }
};

export const setupDefaultTimeSlots = async (req, res, next) => {
  try {
    console.log("ðŸ• SETTING UP DEFAULT TIME SLOTS");

    // Delete existing slots
    await TimeSlot.deleteMany({});
    console.log("âœ… Cleared existing time slots");

    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const times = [
      { start: "09:00", end: "10:00", period: 1, isBreak: false },
      { start: "10:00", end: "11:00", period: 2, isBreak: false },
      { start: "11:00", end: "12:00", period: 3, isBreak: false },
      // âœ… CHANGED: 12:00-13:00 is now NOT a break by default
      { start: "12:00", end: "13:00", period: 4, isBreak: false },
      { start: "14:00", end: "15:00", period: 5, isBreak: false },
      { start: "15:00", end: "16:00", period: 6, isBreak: false },
      { start: "16:00", end: "17:00", period: 7, isBreak: false },
    ];

    const slots = [];
    days.forEach((day) => {
      times.forEach((time) => {
        slots.push({
          slotID: `${day}-${time.start}`,
          day,
          startTime: time.start,
          endTime: time.end,
          duration: 60,
          periodNumber: time.period,
          isBreak: time.isBreak,
        });
      });
    });

    const created = await TimeSlot.insertMany(slots);

    console.log(`âœ… Created ${created.length} time slots`);
    console.log("ðŸ“… All slots are now regular slots (not breaks by default)");

    res.status(201).json({
      success: true,
      message: `Created ${created.length} time slots. No breaks set by default.`,
      count: created.length,
      slots: created,
    });
  } catch (error) {
    console.error("âŒ Error setting up time slots:", error);
    next(error);
  }
};

export const deleteTimeSlot = async (req, res, next) => {
  try {
    const timeSlot = await TimeSlot.findById(req.params.id);

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found",
      });
    }

    await TimeSlot.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Time slot deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
