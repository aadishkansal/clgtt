import mongoose from "mongoose";

const classroomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: [true, "Please provide room number"],
    unique: true,
    trim: true,
    uppercase: true,
  },
  block: {
    type: String,
    required: [true, "Please provide block name"],
    trim: true,
    uppercase: true,
  },
  capacity: {
    type: Number,
    required: [true, "Please provide classroom capacity"],
    min: 1,
  },
  type: {
    type: String,
    required: [true, "Please provide classroom type"],
    enum: ["theory", "lab", "seminar"],
    default: "theory",
  },
  facilities: [
    {
      type: String,
      trim: true,
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Classroom", classroomSchema);
