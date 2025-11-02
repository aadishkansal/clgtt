import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide faculty name"],
    trim: true,
  },
  facultyID: {
    type: String,
    required: [true, "Please provide faculty ID"],
    unique: true,
    trim: true,
  },
  departments: [
    {
      type: String,
      trim: true,
    },
  ],
  email: {
    type: String,
    required: [true, "Please provide email"],
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  subjects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
  ],
  maxHoursPerWeek: {
    type: Number,
    default: 24,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Faculty", facultySchema);
