import express from "express";
import { login, register, getMe } from "../controllers/authController.js";
import { loginValidator } from "../utils/validators.js";
import { validate } from "../middleware/validation.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", loginValidator, validate, login);
router.post("/register", loginValidator, validate, register);
router.get("/me", protect, getMe);

export default router;
