import express from "express";
import {
  getAllTimeSlots,
  getTimeSlotById,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  setupDefaultTimeSlots,
} from "../controllers/timeSlotController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Public endpoint to setup defaults (remove protect if needed)
router.post("/setup-defaults", setupDefaultTimeSlots);

router.route("/").get(protect, getAllTimeSlots).post(protect, createTimeSlot);

router
  .route("/:id")
  .get(protect, getTimeSlotById)
  .put(protect, updateTimeSlot)
  .delete(protect, deleteTimeSlot);

export default router;