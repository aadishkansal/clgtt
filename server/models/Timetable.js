import mongoose from "mongoose";

const scheduleEntrySchema = new mongoose.Schema({
  subjectCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  facultyID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
    required: true,
  },
  classroomID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classroom",
    required: true,
  },
  timeslotID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TimeSlot",
    required: true,
  },
  batchGroup: {
    type: String,
    enum: ["B1", "B2", "Full", null], // Added just in case
    default: null,
  },
  isRMC: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const breakEntrySchema = new mongoose.Schema({
  timeslotID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TimeSlot",
    required: true,
  },
  label: String, // Added label for break name
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const conflictSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["classroom", "faculty", "capacity", "expertise"],
    required: true,
  },
  severity: {
    type: String,
    enum: ["critical", "warning"],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  affectedEntries: [
    {
      type: mongoose.Schema.Types.ObjectId,
    },
  ],
  resolvedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const timetableSchema = new mongoose.Schema({
  academicYear: {
    type: String,
    required: [true, "Please provide academic year"],
    trim: true,
  },
  // ✅ NEW: Added Department Field
  department: {
    type: String,
    required: [true, "Please provide department"],
    trim: true,
  },
  semester: {
    type: Number,
    required: [true, "Please provide semester"],
    min: 1,
    max: 8,
  },
  year: {
    type: Number,
    required: [true, "Please provide year"],
    enum: [1, 2, 3, 4],
    min: 1,
    max: 4,
  },
  section: {
    type: String,
    required: [true, "Please provide section"],
    trim: true,
    uppercase: true,
  },
  schedule: [scheduleEntrySchema],
  breaks: [breakEntrySchema],
  conflicts: [conflictSchema],
  isPublished: {
    type: Boolean,
    default: false,
  },
  publishedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

timetableSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Timetable", timetableSchema);
