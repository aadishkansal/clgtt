import express from "express";
import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../controllers/subjectController.js";
import { subjectValidator } from "../utils/validators.js";
import { validate } from "../middleware/validation.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect); // All routes require authentication

router
  .route("/")
  .get(getAllSubjects)
  .post(subjectValidator, validate, createSubject);

router
  .route("/:id")
  .get(getSubjectById)
  .put(updateSubject)
  .delete(deleteSubject);

export default router;
