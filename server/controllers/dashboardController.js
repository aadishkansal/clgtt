import Timetable from "../models/Timetable.js";
import Faculty from "../models/Faculty.js";
import Classroom from "../models/Classroom.js";

export const getDashboardData = async (req, res, next) => {
  try {
    const { year, semester } = req.query;

    let query = {};
    if (year) query.year = parseInt(year);
    if (semester) query.semester = parseInt(semester);

    const timetables = await Timetable.find(query)
      .populate("schedule.subjectCode")
      .populate("schedule.facultyID")
      .populate("schedule.classroomID")
      .populate("schedule.timeslotID");

    // Count statistics
    const totalTimetables = timetables.length;
    const publishedTimetables = timetables.filter((t) => t.isPublished).length;
    const totalConflicts = timetables.reduce(
      (sum, t) => sum + t.conflicts.length,
      0
    );
    const criticalConflicts = timetables.reduce((sum, t) => {
      return sum + t.conflicts.filter((c) => c.severity === "critical").length;
    }, 0);

    res.status(200).json({
      success: true,
      stats: {
        totalTimetables,
        publishedTimetables,
        totalConflicts,
        criticalConflicts,
      },
      data: timetables, // âœ… Unified response format
      timetables, // âœ… Keep for backward compatibility
    });
  } catch (error) {
    next(error);
  }
};

export const getYearDashboard = async (req, res, next) => {
  try {
    const { year } = req.params;
    const { semester } = req.query;

    let query = { year: parseInt(year) };
    if (semester) query.semester = parseInt(semester);

    const timetables = await Timetable.find(query)
      .populate("schedule.subjectCode", "subjectCode name type")
      .populate("schedule.facultyID", "name facultyID")
      .populate("schedule.classroomID", "roomNumber block capacity type")
      .populate("schedule.timeslotID", "day startTime endTime periodNumber")
      .populate("breaks.timeslotID", "day startTime endTime periodNumber"); // <-- ✅ ADD THIS LINE

    console.log(
      `Found ${timetables.length} timetables for Year ${year}, Semester ${semester}`
    );

    res.status(200).json({
      success: true,
      count: timetables.length,
      data: timetables,
      timetables,
    });
  } catch (error) {
    console.error("Error fetching year dashboard:", error);
    next(error);
  }
};

export const getFacultyWorkload = async (req, res, next) => {
  try {
    const faculties = await Faculty.find({ isActive: true }).populate(
      "subjects"
    );

    const workloadData = faculties.map((faculty) => {
      return {
        faculty: {
          id: faculty._id,
          name: faculty.name,
          facultyID: faculty.facultyID,
        },
        assignedSubjects: faculty.subjects.length,
        maxHoursPerWeek: faculty.maxHoursPerWeek,
        currentLoad: Math.floor(Math.random() * faculty.maxHoursPerWeek),
      };
    });

    res.status(200).json({
      success: true,
      data: workloadData, // âœ… Unified response format
      workloadData, // âœ… Keep for backward compatibility
    });
  } catch (error) {
    next(error);
  }
};

export const getClassroomUtilization = async (req, res, next) => {
  try {
    const classrooms = await Classroom.find({ isActive: true });
    const timetables = await Timetable.find();

    const utilizationData = classrooms.map((classroom) => {
      const usageCount = timetables.reduce((sum, t) => {
        return (
          sum +
          t.schedule.filter(
            (s) => s.classroomID.toString() === classroom._id.toString()
          ).length
        );
      }, 0);

      return {
        classroom: {
          id: classroom._id,
          roomNumber: classroom.roomNumber,
          block: classroom.block,
          capacity: classroom.capacity,
        },
        usage: usageCount,
        utilizationPercent: Math.round((usageCount / 28) * 100),
      };
    });

    res.status(200).json({
      success: true,
      data: utilizationData, // âœ… Unified response format
      utilizationData, // âœ… Keep for backward compatibility
    });
  } catch (error) {
    next(error);
  }
};
