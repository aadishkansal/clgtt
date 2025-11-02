import express from "express";
import {
  getAllClassrooms,
  getClassroomById,
  createClassroom,
  updateClassroom,
  deleteClassroom,
} from "../controllers/classroomController.js";
import { classroomValidator } from "../utils/validators.js";
import { validate } from "../middleware/validation.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect); // All routes require authentication

router
  .route("/")
  .get(getAllClassrooms)
  .post(classroomValidator, validate, createClassroom);

router
  .route("/:id")
  .get(getClassroomById)
  .put(updateClassroom)
  .delete(deleteClassroom);

export default router;
