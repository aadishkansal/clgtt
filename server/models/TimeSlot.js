import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema({
  slotID: {
    type: String,
    required: [true, "Please provide slot ID"],
    unique: true,
    trim: true,
  },
  day: {
    type: String,
    required: [true, "Please provide day"],
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  },
  startTime: {
    type: String,
    required: [true, "Please provide start time"],
    trim: true,
  },
  endTime: {
    type: String,
    required: [true, "Please provide end time"],
    trim: true,
  },
  duration: {
    type: Number,
    required: [true, "Please provide duration in minutes"],
    min: 30,
  },
  periodNumber: {
    type: Number,
    required: [true, "Please provide period number"],
    min: 1,
  },
  isBreak: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("TimeSlot", timeSlotSchema);
