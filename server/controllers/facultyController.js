import Faculty from "../models/Faculty.js";
import Subject from "../models/Subject.js";

export const getAllFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find().populate("subjects");

    res.json({
      success: true,
      count: faculty.length,
      faculty,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching faculty",
      error: error.message,
    });
  }
};

export const getFacultyById = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id).populate("subjects");

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    res.status(200).json({
      success: true,
      faculty,
    });
  } catch (error) {
    next(error);
  }
};

export const createFaculty = async (req, res, next) => {
  try {
    const {
      name,
      facultyID,
      departments,
      email,
      phone,
      maxHoursPerWeek,
      subjects,
    } = req.body;

    // Check if facultyID already exists
    let existingFaculty = await Faculty.findOne({ facultyID });
    if (existingFaculty) {
      return res.status(400).json({
        success: false,
        message: "Faculty ID already exists",
      });
    }

    // Validate required fields
    if (
      !name ||
      !facultyID ||
      !email ||
      !departments ||
      departments.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, Faculty ID, Email, and at least one Department are required",
      });
    }

    const faculty = await Faculty.create({
      name,
      facultyID,
      departments: departments || [],
      email,
      phone: phone || "",
      maxHoursPerWeek: maxHoursPerWeek || 24,
      subjects: subjects || [],
    });

    await faculty.populate("subjects");

    res.status(201).json({
      success: true,
      message: "Faculty created successfully",
      faculty,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFaculty = async (req, res, next) => {
  try {
    const {
      name,
      departments,
      email,
      phone,
      maxHoursPerWeek,
      isActive,
      subjects,
    } = req.body;

    let faculty = await Faculty.findById(req.params.id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    // Update fields only if provided
    if (name) faculty.name = name;
    if (departments && departments.length > 0)
      faculty.departments = departments;
    if (email) faculty.email = email;
    if (phone) faculty.phone = phone;
    if (maxHoursPerWeek) faculty.maxHoursPerWeek = maxHoursPerWeek;
    if (typeof isActive !== "undefined") faculty.isActive = isActive;
    if (subjects) faculty.subjects = subjects;

    await faculty.save();

    await faculty.populate("subjects");

    res.status(200).json({
      success: true,
      message: "Faculty updated successfully",
      faculty,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    // Hard delete (remove from database)
    await Faculty.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Faculty deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
