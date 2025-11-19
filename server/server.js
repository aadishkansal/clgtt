import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";

// Route imports
import authRoutes from "./routes/auth.js";
import facultyRoutes from "./routes/faculty.js";
import subjectRoutes from "./routes/subject.js";
import classroomRoutes from "./routes/classroom.js";
import timetableRoutes from "./routes/timetable.js";
import dashboardRoutes from "./routes/dashboard.js";
import timeSlotRoutes from "./routes/timeSlots.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// FIXED CORS - Accept all localhost ports
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow localhost with any port
      if (
        !origin ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/timeslots", timeSlotRoutes);
// Test route
app.get("/", (req, res) => {
  res.json({ message: "College Timetable API" });
});

// 404 Route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error Handler
app.use(errorHandler);

// Connect DB and start server
connectDB().then(() => {
  app.listen(PORT, () => {

  });
});

process.on("unhandledRejection", (err) => {

  process.exit(1);
});
