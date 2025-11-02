import express from "express";
import {
  getDashboardData,
  getYearDashboard,
  getFacultyWorkload,
  getClassroomUtilization,
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect); // All routes require authentication

router.get("/", getDashboardData);
router.get("/year/:year", getYearDashboard);
router.get("/faculty-workload", getFacultyWorkload);
router.get("/classroom-utilization", getClassroomUtilization);

export default router;
