import { body } from "express-validator";

export const loginValidator = [
  body("email").trim().isEmail().withMessage("Please provide a valid email"),
  body("password")
    .notEmpty()
    .withMessage("Please provide a password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

export const facultyValidator = [
  body("name").trim().notEmpty().withMessage("Faculty name is required"),
  body("facultyID").trim().notEmpty().withMessage("Faculty ID is required"),
  body("department").trim().notEmpty().withMessage("Department is required"),
  body("email").trim().isEmail().withMessage("Please provide a valid email"),
];

export const subjectValidator = [
  body("subjectCode")
    .trim()
    .notEmpty()
    .withMessage("Subject code is required")
    .isLength({ min: 2, max: 20 })
    .withMessage("Subject code must be between 2 and 20 characters")
    .toUpperCase(),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Subject name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Subject name must be between 2 and 100 characters"),

  body("year")
    .notEmpty()
    .withMessage("Year is required")
    .isInt({ min: 1, max: 4 })
    .withMessage("Year must be 1, 2, 3, or 4"),

  body("semester")
    .notEmpty()
    .withMessage("Semester is required")
    .isInt({ min: 1, max: 8 })
    .withMessage("Semester must be between 1 and 8"),

  body("type")
    .notEmpty()
    .withMessage("Type is required")
    .isArray({ min: 1 })
    .withMessage("Type must be an array with at least one value")
    .custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error("Type must be an array of strings");
      }
      const validTypes = ["L", "T", "P"];
      const isValid = value.every((v) => validTypes.includes(v));
      if (!isValid) {
        throw new Error(
          "Each type must be L (Lecture), T (Tutorial), or P (Practical)"
        );
      }
      return true;
    }),

  body("lectureCredits")
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage("Lecture credits must be a number between 0 and 10"),

  body("tutorialCredits")
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage("Tutorial credits must be a number between 0 and 10"),

  body("practicalCredits")
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage("Practical credits must be a number between 0 and 10"),

  body("department")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Department must be between 2 and 50 characters"),
];

export const classroomValidator = [
  body("roomNumber")
    .trim()
    .notEmpty()
    .withMessage("Room number is required")
    .toUpperCase(),
  body("block")
    .trim()
    .notEmpty()
    .withMessage("Block is required")
    .toUpperCase(),
  body("capacity").isInt({ min: 1 }).withMessage("Capacity must be at least 1"),
  body("type")
    .isIn(["theory", "lab", "seminar"])
    .withMessage("Type must be theory, lab, or seminar"),
];

export const timetableValidator = [
  body("year")
    .notEmpty()
    .withMessage("Year is required")
    .isInt({ min: 1, max: 4 })
    .withMessage("Year must be 1, 2, 3, or 4"),

  body("semester")
    .notEmpty()
    .withMessage("Semester is required")
    .isInt({ min: 1, max: 8 })
    .withMessage("Semester must be between 1 and 8"),

  body("subject")
    .notEmpty()
    .withMessage("Subject is required")
    .isMongoId()
    .withMessage("Subject must be a valid ID"),

  body("subjectType")
    .notEmpty()
    .withMessage("Subject type is required")
    .isIn(["L", "T", "P"])
    .withMessage("Subject type must be L, T, or P"),

  body("faculty")
    .notEmpty()
    .withMessage("Faculty is required")
    .isMongoId()
    .withMessage("Faculty must be a valid ID"),

  body("classroom")
    .notEmpty()
    .withMessage("Classroom is required")
    .isMongoId()
    .withMessage("Classroom must be a valid ID"),

  body("batch")
    .isIn(["B1", "B2", "Full"])
    .withMessage("Batch must be B1, B2 or Full"),

  body("days")
    .notEmpty()
    .withMessage("Days are required")
    .isArray({ min: 1 })
    .withMessage("Days must be an array with at least one value")
    .custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error("Days must be an array");
      }
      const validDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const isValid = value.every((day) => validDays.includes(day));
      if (!isValid) {
        throw new Error("Invalid day(s) provided");
      }
      return true;
    }),

  body("timeSlots")
    .notEmpty()
    .withMessage("Time slots are required")
    .isArray({ min: 1 })
    .withMessage("Time slots must be an array with at least one value")
    .custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error("Time slots must be an array");
      }
      // Each time slot should be a valid MongoDB ID
      const isValid = value.every((slot) => {
        return /^[0-9a-fA-F]{24}$/.test(slot);
      });
      if (!isValid) {
        throw new Error("Each time slot must be a valid ID");
      }
      return true;
    }),
];
