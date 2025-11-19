import express from "express";
import {
  getTimetable,
  getTimetableById,
  validateTimetableEntry,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  deleteTimetable, 
  deleteBreak,
  publishTimetable,
  downloadPDF,
  getAvailableTimeSlots,
} from "../controllers/timetableController.js";
import { timetableValidator } from "../utils/validators.js";
import { validate } from "../middleware/validation.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// GET routes
router.get("/", getTimetable);
router.get("/available-slots", getAvailableTimeSlots);

// POST routes
router.post("/validate", validateTimetableEntry);
router.post("/create", timetableValidator, validate, createTimetableEntry);

//  Route to delete the ENTIRE timetable (Document)
router.delete("/:id/full", deleteTimetable);

// Individual timetable routes (for specific entries)
router
  .route("/:id")
  .get(getTimetableById)
  .put(updateTimetableEntry)
  .delete(deleteTimetableEntry); // This deletes a single class entry

// Break management routes
router.delete("/:id/break/:breakId", deleteBreak);

// Publishing and PDF routes
router.post("/:id/publish", publishTimetable);
router.get("/:id/download-pdf", downloadPDF);

export default router;
