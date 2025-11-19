import Classroom from "../models/Classroom.js";

export const getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find();

    res.json({
      success: true,
      count: classrooms.length,
      classrooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching classrooms",
      error: error.message,
    });
  }
};

export const getClassroomById = async (req, res, next) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    res.status(200).json({
      success: true,
      classroom,
    });
  } catch (error) {
    next(error);
  }
};

export const createClassroom = async (req, res, next) => {
  try {
    const { roomNumber, block, capacity, type, facilities } = req.body;

    let classroom = await Classroom.findOne({ roomNumber });
    if (classroom) {
      return res.status(400).json({
        success: false,
        message: "Room number already exists",
      });
    }

    classroom = await Classroom.create({
      roomNumber,
      block,
      capacity,
      type,
      facilities: facilities || [],
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Classroom created successfully",
      classroom,
    });
  } catch (error) {
    next(error);
  }
};

export const updateClassroom = async (req, res, next) => {
  try {
    const { block, capacity, type, facilities, isActive } = req.body;

    let classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    if (block) classroom.block = block;
    if (capacity) classroom.capacity = capacity;
    if (type) classroom.type = type;
    if (facilities) classroom.facilities = facilities;
    if (typeof isActive !== "undefined") classroom.isActive = isActive;

    await classroom.save();

    res.status(200).json({
      success: true,
      message: "Classroom updated successfully",
      classroom,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClassroom = async (req, res, next) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    // Hard delete - actually remove from database
    await Classroom.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Classroom deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
