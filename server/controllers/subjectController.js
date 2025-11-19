import Subject from "../models/Subject.js";
import Faculty from "../models/Faculty.js";

export const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().populate("assignedFaculty");

    res.json({
      success: true,
      count: subjects.length,
      subjects,
    });
  } catch (error) {
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
    const {
      subjectCode,
      name,
      year,
      semester,
      type,
      department,
      lectureCredits,
      tutorialCredits,
      practicalCredits,
    } = req.body;

    if (!subjectCode || !name || !year || !semester) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }
    if (!Array.isArray(type) || type.length === 0) {
      return res.status(400).json({ message: "Type must be an array" });
    }
    const existingSubject = await Subject.findOne({
      subjectCode: subjectCode.toString().toUpperCase().trim(),
    });
    if (existingSubject) {
      return res.status(400).json({ message: "Subject code already exists" });
    }

    const newSubject = await Subject.create({
      subjectCode: subjectCode.toString().toUpperCase().trim(),
      name: name.trim(),
      year: parseInt(year),
      semester: parseInt(semester),
      type: type,
      department: department.trim(),
      lectureCredits: parseInt(lectureCredits) || 0,
      tutorialCredits: parseInt(tutorialCredits) || 0,
      practicalCredits: parseInt(practicalCredits) || 0,
      assignedFaculty: [],
    });

    res
      .status(201)
      .json({ success: true, message: "Subject created", subject: newSubject });
  } catch (error) {
    next(error);
  }
};

export const updateSubject = async (req, res, next) => {
  try {
    const {
      subjectCode,
      name,
      year,
      semester,
      type,
      department,
      lectureCredits,
      tutorialCredits,
      practicalCredits,
    } = req.body;

    let subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });
    }

    // Handle Subject Code Update (with duplicate check)
    if (subjectCode) {
      const normalizedCode = subjectCode.toString().toUpperCase().trim();

      // If the code is actually changing
      if (normalizedCode !== subject.subjectCode) {
        const existingSubject = await Subject.findOne({
          subjectCode: normalizedCode,
        });

        // If found AND it's not the current subject we are editing
        if (
          existingSubject &&
          existingSubject._id.toString() !== req.params.id
        ) {
          return res.status(400).json({
            success: false,
            message: "Subject code already exists",
          });
        }
        subject.subjectCode = normalizedCode;
      }
    }

    // Handle other fields
    if (name) subject.name = name.trim();
    if (year) subject.year = parseInt(year);
    if (semester) subject.semester = parseInt(semester);
    if (department) subject.department = department.trim();
    if (type) subject.type = Array.isArray(type) ? type : [type];

    // Handle credits (checking for null/undefined explicitly to allow 0)
    if (lectureCredits !== undefined && lectureCredits !== null)
      subject.lectureCredits = parseInt(lectureCredits) || 0;

    if (tutorialCredits !== undefined && tutorialCredits !== null)
      subject.tutorialCredits = parseInt(tutorialCredits) || 0;

    if (practicalCredits !== undefined && practicalCredits !== null)
      subject.practicalCredits = parseInt(practicalCredits) || 0;

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
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });
    }

    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res
        .status(404)
        .json({ success: false, message: "Faculty not found" });
    }

    if (!subject.assignedFaculty.includes(facultyId)) {
      subject.assignedFaculty.push(facultyId);
      await subject.save();
    }
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
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });
    }

    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res
        .status(404)
        .json({ success: false, message: "Faculty not found" });
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
