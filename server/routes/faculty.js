import express from "express";
import {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
} from "../controllers/facultyController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.route("/").get(protect, getAllFaculty).post(protect, createFaculty);

router
  .route("/:id")
  .get(protect, getFacultyById)
  .put(protect, updateFaculty)
  .delete(protect, deleteFaculty);

export default router;
