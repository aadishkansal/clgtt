import Subject from "../models/Subject.js";
import Faculty from "../models/Faculty.js";

const calculateCreditDistribution = (types, totalCredits) => {
  if (!types || types.length === 0) return {};

  const distribution = {};
  const totalCreditsNum = parseInt(totalCredits);

  if (types.length === 1) {
    distribution[types[0]] = totalCreditsNum;
  } else if (types.length === 2 && types.includes("L") && types.includes("P")) {
    // Lab + Theory: 4 for theory, 1 for lab
    distribution["L"] = Math.max(1, totalCreditsNum - 1);
    distribution["P"] = 1;
  } else if (types.length === 2 && types.includes("L") && types.includes("T")) {
    // Lecture + Tutorial: 80% lecture, 20% tutorial
    distribution["L"] = Math.ceil(totalCreditsNum * 0.8);
    distribution["T"] = totalCreditsNum - distribution["L"];
  } else if (types.length === 2 && types.includes("T") && types.includes("P")) {
    // Tutorial + Practical: 50-50 split
    distribution["T"] = Math.ceil(totalCreditsNum / 2);
    distribution["P"] = totalCreditsNum - distribution["T"];
  } else if (types.length === 3) {
    // All three: 60% L, 20% T, 20% P
    distribution["L"] = Math.ceil(totalCreditsNum * 0.6);
    distribution["T"] = Math.ceil(totalCreditsNum * 0.2);
    distribution["P"] = totalCreditsNum - distribution["L"] - distribution["T"];
  }

  return distribution;
};

export const getAllSubjects = async (req, res) => {
  try {
    console.log("ðŸ“š Fetching all subjects...");
    const subjects = await Subject.find().populate("assignedFaculty");

    console.log(`âœ… Found ${subjects.length} subjects`);

    res.json({
      success: true,
      count: subjects.length,
      subjects,
    });
  } catch (error) {
    console.error("âŒ Error fetching subjects:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching subjects",
      error: error.message,
    });
  }
};

export const getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id).populate(
      "assignedFaculty"
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    res.status(200).json({
      success: true,
      subject,
    });
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (req, res, next) => {
  try {
    const { subjectCode, name, year, semester, type, creditHours, department } =
      req.body;

    console.log("ðŸ“ Creating subject with:", {
      subjectCode,
      name,
      year,
      semester,
      type,
      creditHours,
      department,
    });

    // Validation check
    if (
      !subjectCode ||
      !name ||
      !year ||
      !semester ||
      !creditHours ||
      !department
    ) {
      console.log("âŒ Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Validate type is array
    if (!Array.isArray(type) || type.length === 0) {
      console.log("âŒ Type must be an array");
      return res.status(400).json({
        success: false,
        message: "Type must be an array with at least one value (L, T, or P)",
      });
    }

    // Check if subject code already exists
    const existingSubject = await Subject.findOne({
      subjectCode: subjectCode.toString().toUpperCase().trim(),
    });

    if (existingSubject) {
      console.log("âŒ Subject code already exists");
      return res.status(400).json({
        success: false,
        message: "Subject code already exists",
      });
    }

    const types = Array.isArray(type) ? type : [type];
    const credits = parseInt(creditHours);

    if (isNaN(credits) || credits < 1 || credits > 10) {
      console.log("âŒ Invalid credit hours");
      return res.status(400).json({
        success: false,
        message: "Credit hours must be between 1 and 10",
      });
    }

    const creditDistribution = calculateCreditDistribution(types, credits);

    console.log("ðŸ’¾ Credit distribution:", creditDistribution);

    const newSubject = await Subject.create({
      subjectCode: subjectCode.toString().toUpperCase().trim(),
      name: name.trim(),
      year: parseInt(year),
      semester: parseInt(semester),
      type: types,
      creditHours: credits,
      creditDistribution: new Map(Object.entries(creditDistribution)),
      department: department.trim(),
      assignedFaculty: [],
    });

    console.log("âœ… Subject created:", newSubject._id);

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      subject: newSubject,
    });
  } catch (error) {
    console.error("âŒ Error creating subject:", error.message);
    next(error);
  }
};

export const updateSubject = async (req, res, next) => {
  try {
    const { name, year, semester, type, creditHours, department } = req.body;

    let subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    if (name) subject.name = name.trim();
    if (year) subject.year = parseInt(year);
    if (semester) subject.semester = parseInt(semester);

    if (type) {
      const types = Array.isArray(type) ? type : [type];
      subject.type = types;

      const credits = creditHours ? parseInt(creditHours) : subject.creditHours;
      const creditDistribution = calculateCreditDistribution(types, credits);
      subject.creditDistribution = new Map(Object.entries(creditDistribution));
    }

    if (creditHours) {
      const credits = parseInt(creditHours);
      subject.creditHours = credits;
      const creditDistribution = calculateCreditDistribution(
        subject.type,
        credits
      );
      subject.creditDistribution = new Map(Object.entries(creditDistribution));
    }

    if (department) subject.department = department.trim();

    await subject.save();

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      subject,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Remove subject from all assigned faculty
    await Faculty.updateMany(
      { subjects: req.params.id },
      { $pull: { subjects: req.params.id } }
    );

    await Subject.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const assignFacultyToSubject = async (req, res, next) => {
  try {
    const { facultyId } = req.body;
    const { id } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    // Add faculty to subject if not already assigned
    if (!subject.assignedFaculty.includes(facultyId)) {
      subject.assignedFaculty.push(facultyId);
      await subject.save();
    }

    // Add subject to faculty if not already assigned
    if (!faculty.subjects.includes(id)) {
      faculty.subjects.push(id);
      await faculty.save();
    }

    res.status(200).json({
      success: true,
      message: "Faculty assigned to subject successfully",
      subject,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFacultyFromSubject = async (req, res, next) => {
  try {
    const { facultyId } = req.body;
    const { id } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    subject.assignedFaculty = subject.assignedFaculty.filter(
      (fid) => fid.toString() !== facultyId
    );
    await subject.save();

    faculty.subjects = faculty.subjects.filter((sid) => sid.toString() !== id);
    await faculty.save();

    res.status(200).json({
      success: true,
      message: "Faculty removed from subject successfully",
      subject,
    });
  } catch (error) {
    next(error);
  }
};
