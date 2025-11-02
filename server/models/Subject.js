import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    subjectCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4],
    },
    semester: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4, 5, 6, 7, 8],
    },
    type: {
      type: [String],
      enum: ["L", "T", "P"],
      default: ["L"],
      required: true,
    },
    creditHours: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    creditDistribution: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    assignedFaculty: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Faculty",
      },
    ],
  },
  { timestamps: true }
);

subjectSchema.index({ subjectCode: 1, year: 1, semester: 1 });

export default mongoose.model("Subject", subjectSchema);
