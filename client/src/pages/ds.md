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
      .populate("schedule.subjectCode", "subjectCode name type")
      .populate("schedule.facultyID", "name facultyID")
      .populate("schedule.classroomID", "roomNumber block capacity type")
      .populate("schedule.timeslotID", "day startTime endTime periodNumber");

    // Count statistics
    const totalTimetables = timetables.length;
    const publishedTimetables = timetables.filter((t) => t.isPublished).length;
    const totalScheduleEntries = timetables.reduce(
      (sum, t) => sum + (t.schedule?.length || 0),
      0
    );
    const totalConflicts = timetables.reduce(
      (sum, t) => sum + (t.conflicts?.length || 0),
      0
    );
    const criticalConflicts = timetables.reduce((sum, t) => {
      return (
        sum +
        (t.conflicts?.filter((c) => c.severity === "critical").length || 0)
      );
    }, 0);

    console.log(`ðŸ“Š Dashboard Data:
      - Timetables: ${totalTimetables}
      - Total Entries: ${totalScheduleEntries}
      - Published: ${publishedTimetables}
      - Conflicts: ${totalConflicts}
    `);

    res.status(200).json({
      success: true,
      stats: {
        totalTimetables,
        totalScheduleEntries,
        publishedTimetables,
        totalConflicts,
        criticalConflicts,
      },
      data: timetables,
      timetables,
    });
  } catch (error) {
    console.error("âŒ Error in getDashboardData:", error);
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
      .populate("breaks.timeslotID", "day startTime endTime"); // âœ… ADD THIS

    console.log(
      `ðŸ“Š Found ${timetables.length} timetables for Year ${year}, Semester ${semester}`
    );
    
    // âœ… Log breaks for debugging
    timetables.forEach((t) => {
      console.log(`  Timetable: ${t._id}`);
      console.log(`    Breaks: ${t.breaks?.length || 0}`);
      if (t.breaks && t.breaks.length > 0) {
        t.breaks.forEach((b) => {
          console.log(
            `      - ${b.day} ${b.startTime}-${b.endTime}`
          );
        });
      }
    });

    res.status(200).json({
      success: true,
      count: timetables.length,
      data: timetables,
      timetables,
    });
  } catch (error) {
    console.error("âŒ Error fetching year dashboard:", error);
    next(error);
  }
};

export const getFacultyWorkload = async (req, res, next) => {
  try {
    const faculties = await Faculty.find({ isActive: true }).populate(
      "subjects",
      "subjectCode name creditHours"
    );

    const workloadData = faculties.map((faculty) => {
      const totalHours = faculty.subjects.reduce(
        (sum, s) => sum + (s.creditHours || 0),
        0
      );

      return {
        faculty: {
          id: faculty._id,
          name: faculty.name,
          facultyID: faculty.facultyID,
        },
        assignedSubjects: faculty.subjects.length,
        totalHours: totalHours,
        maxHoursPerWeek: faculty.maxHoursPerWeek || 30,
        utilizationPercent: Math.round(
          (totalHours / (faculty.maxHoursPerWeek || 30)) * 100
        ),
      };
    });

    res.status(200).json({
      success: true,
      data: workloadData,
      workloadData,
    });
  } catch (error) {
    console.error("âŒ Error in getFacultyWorkload:", error);
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
          (t.schedule?.filter(
            (s) => s.classroomID?.toString() === classroom._id.toString()
          ).length || 0)
        );
      }, 0);

      const maxCapacity = 28; // 7 periods Ã— 4 days

      return {
        classroom: {
          id: classroom._id,
          roomNumber: classroom.roomNumber,
          block: classroom.block,
          capacity: classroom.capacity,
          type: classroom.type,
        },
        usage: usageCount,
        utilizationPercent: Math.round((usageCount / maxCapacity) * 100),
      };
    });

    res.status(200).json({
      success: true,
      data: utilizationData,
      utilizationData,
    });
  } catch (error) {
    console.error("âŒ Error in getClassroomUtilization:", error);
    next(error);
  }
};


import { useState } from "react";
import { EditEntryModal } from "./EditEntryModal";
import { EditBreakModal } from "./EditBreakModal"; // âœ… NEW

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const TIME_SLOTS = [
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "12:00-13:00",
  "14:00-15:00",
  "15:00-16:00",
  "16:00-17:00",
];

export const WeeklyGrid = ({ schedule, conflicts, breaks = [] }) => {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBreak, setSelectedBreak] = useState(null); // âœ… NEW
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false); // âœ… NEW

  const getEntryForSlot = (day, timeSlot) => {
    return schedule.find((entry) => {
      const timeslotData = entry.timeslotID;
      const startTime = timeSlot.split("-")[0];

      const timeslotDay =
        typeof timeslotData === "object" ? timeslotData?.day : null;
      const timeslotStart =
        typeof timeslotData === "object" ? timeslotData?.startTime : null;

      return timeslotDay === day && timeslotStart === startTime;
    });
  };

  const getConflictsForEntry = (entryId) => {
    return conflicts.filter((c) =>
      c.affectedEntries?.some((id) => id.toString() === entryId?.toString())
    );
  };

  const getBreakForSlot = (day, timeSlot) => {
    const startTime = timeSlot.split("-")[0];
    return breaks.find((b) => b.day === day && b.startTime === startTime);
  };

  const handleEntryClick = (entry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  // âœ… NEW - Handle break click
  const handleBreakClick = (breakItem) => {
    setSelectedBreak(breakItem);
    setIsBreakModalOpen(true);
  };

  // âœ… NEW - Handle break modal close
  const handleCloseBreakModal = () => {
    setIsBreakModalOpen(false);
    setSelectedBreak(null);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (!schedule || schedule.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">No schedule data available</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 border-b-2 border-gray-300 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[100px]">
                Time/Day
              </th>
              {DAYS_OF_WEEK.map((day) => (
                <th
                  key={day}
                  className="px-4 py-3 text-center font-semibold text-gray-700 min-w-[150px]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((timeSlot, slotIndex) => (
              <tr
                key={slotIndex}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <td className="px-4 py-4 font-medium text-gray-700 bg-gray-50 min-w-[100px] sticky left-0 z-10">
                  {timeSlot}
                </td>
                {DAYS_OF_WEEK.map((day) => {
                  const entry = getEntryForSlot(day, timeSlot);
                  const entryConflicts = entry
                    ? getConflictsForEntry(entry._id)
                    : [];
                  const breakSlot = getBreakForSlot(day, timeSlot);

                  return (
                    <td
                      key={`${day}-${slotIndex}`}
                      className="px-4 py-4 text-center relative border border-gray-200 min-h-[100px]"
                    >
                      {breakSlot ? (
                        // âœ… NEW - Make break clickable
                        <div
                          className="relative cursor-pointer hover:bg-orange-50 hover:shadow-md p-2 rounded transition-all duration-200 group"
                          onClick={() => handleBreakClick(breakSlot)}
                        >
                          {/* Hover indicator */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-orange-100 rounded -z-10 transition-opacity" />

                          <span className="text-gray-600 font-bold text-lg block">
                          BREAK
                          </span>


                          {/* Click hint */}
                          <p className="text-xs text-orange-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to edit
                          </p>
                        </div>
                      ) : entry && entry.subjectCode ? (
                        <div
                          className="relative cursor-pointer hover:bg-blue-50 hover:shadow-md p-2 rounded transition-all duration-200 group"
                          onClick={() => handleEntryClick(entry)}
                        >
                          {/* Hover indicator */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-blue-100 rounded -z-10 transition-opacity" />

                          {/* Conflict indicators */}
                          {entryConflicts.length > 0 && (
                            <div className="absolute top-1 right-1 flex gap-1">
                              {entryConflicts.map((conflict, idx) => (
                                <div
                                  key={idx}
                                  className="w-3 h-3 rounded-full bg-red-500 hover:scale-125 transition-transform"
                                  title={conflict.message}
                                />
                              ))}
                            </div>
                          )}

                          <div className="text-xs">
                            <p className="font-bold text-blue-700">
                              {entry.subjectCode?.subjectCode || "N/A"}
                            </p>
                            <p className="text-gray-600 truncate">
                              {entry.facultyID?.name || "N/A"}
                            </p>
                            <p className="text-gray-500">
                              {entry.classroomID?.roomNumber || "N/A"}
                            </p>

                            {entry.batchGroup && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                                {entry.batchGroup}
                              </span>
                            )}

                            {entry.isRMC && (
                              <span className="inline-block mt-1 ml-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                                RMC
                              </span>
                            )}

                            <p className="text-xs text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              Click to edit
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Entry Modal */}
      <EditEntryModal
        isOpen={isModalOpen}
        entry={selectedEntry}
        onClose={handleCloseModal}
        onRefresh={handleRefresh}
      />

      {/* âœ… NEW - Break Modal */}
      <EditBreakModal
        isOpen={isBreakModalOpen}
        breakItem={selectedBreak}
        onClose={handleCloseBreakModal}
        onRefresh={handleRefresh}
      />
    </>
  );
};


import { useState, useEffect } from "react";
import { YearTabs } from "../components/Dashboard/YearTabs";
import { WeeklyGrid } from "../components/Dashboard/WeeklyGrid";
import { ConflictSummary } from "../components/Dashboard/ConflictSummary";
import { Loader } from "../components/Common/Loader";
import api from "../utils/api";
import { handleApiError } from "../utils/helpers";
import { toast } from "react-toastify";

export const Dashboard = () => {
  const [selectedYear, setSelectedYear] = useState(2);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [selectedYear, selectedSemester]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log(
        `ðŸ“Š Loading dashboard for Year ${selectedYear}, Semester ${selectedSemester}`
      );

      const response = await api.get(`/dashboard/year/${selectedYear}`, {
        params: { semester: selectedSemester },
      });

      console.log("ðŸ”¥ Dashboard response:", response.data);

      const data = response.data.data || response.data.timetables || [];
      setTimetableData(Array.isArray(data) ? data : []);
      console.log(`âœ… Loaded ${data.length} timetable(s)`);
    } catch (error) {
      console.error("âŒ Error loading dashboard:", error);
      toast.error(handleApiError(error) || "Failed to load dashboard");
      setTimetableData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (timetableId) => {
    try {
      setDownloadingId(timetableId);
      console.log("ðŸ“¥ Downloading PDF for timetable:", timetableId);

      const response = await api.get(`/timetable/${timetableId}/download-pdf`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const timetable = timetableData.find((t) => t._id === timetableId);
      const filename = `timetable-Y${timetable?.year}-S${timetable?.semester}-${Date.now()}.pdf`;

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("ðŸ“„ PDF downloaded successfully!");
      console.log("âœ… PDF downloaded:", filename);
    } catch (error) {
      console.error("âŒ Error downloading PDF:", error);
      toast.error(handleApiError(error) || "Failed to download PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <Loader />;

  const flattenedSchedule = timetableData.flatMap(
    (t) =>
      t.schedule?.map((s, idx) => ({
        ...s,
        timetableId: t._id,
        entryIndex: idx,
      })) || []
  );

  const allConflicts =
    timetableData?.reduce((acc, t) => [...acc, ...(t.conflicts || [])], []) ||
    [];

  // âœ… FIXED: Properly extract breaks with day and startTime
  const allBreaks = timetableData.flatMap((t) => {
    return (t.breaks || []).map((b) => {
      // Get values from populated timeslotID first
      const ts = b.timeslotID || {};
      return {
        _id: b._id,
        day: ts.day,
        startTime: ts.startTime,
        endTime: ts.endTime,
      };
    });
  });

  console.log("ðŸ”— All breaks extracted:", allBreaks);
  console.log("ðŸ“‹ Total classes:", flattenedSchedule.length);
  console.log("ðŸ”— Total breaks:", allBreaks.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Timetable Dashboard
        </h1>
        <p className="text-gray-600">
          Year {selectedYear} Semester {selectedSemester}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Timetables"
          value={timetableData.length}
          color="blue"
        />
        <StatCard
          label="Published"
          value={timetableData.filter((t) => t.isPublished).length}
          color="green"
        />
        <StatCard
          label="Total Classes"
          value={flattenedSchedule.length}
          color="yellow"
        />
        <StatCard label="Total Breaks" value={allBreaks.length} color="red" />
      </div>

      {/* Year Selection */}
      <YearTabs selectedYear={selectedYear} onYearChange={setSelectedYear} />

      {/* Semester Selection */}
      <div className="flex gap-4 flex-wrap">
        {[1, 2].map((sem) => (
          <button
            key={sem}
            onClick={() => setSelectedSemester(sem)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
              selectedSemester === sem
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Sem {sem}
          </button>
        ))}
      </div>

      {/* Timetable Actions */}
      {timetableData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            ðŸ“‹ Timetable Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timetableData.map((timetable) => (
              <div
                key={timetable._id}
                className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-all"
              >
                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Year:</span>{" "}
                    {timetable.year}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Semester:</span>{" "}
                    {timetable.semester}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Section:</span>{" "}
                    {timetable.section}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Classes:</span>{" "}
                    {timetable.schedule?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Breaks:</span>{" "}
                    {timetable.breaks?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Status:</span>{" "}
                    {timetable.isPublished ? (
                      <span className="text-green-600 font-bold">
                        âœ… Published
                      </span>
                    ) : (
                      <span className="text-yellow-600 font-bold">
                        â³ Draft
                      </span>
                    )}
                  </p>
                </div>

                <button
                  onClick={() => handleDownloadPDF(timetable._id)}
                  disabled={downloadingId === timetable._id}
                  className={`w-full py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all text-sm ${
                    downloadingId === timetable._id
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                  }`}
                >
                  {downloadingId === timetable._id ? (
                    <>
                      <span className="animate-spin">â³</span>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <span>ðŸ“„</span>
                      Download PDF
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Status */}
      {flattenedSchedule.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-semibold mb-2">
            No Timetable Entries
          </p>
          <p className="text-yellow-700 text-sm">
            No timetable entries found for Year {selectedYear}, Semester{" "}
            {selectedSemester}
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Go to Timetable Management to create entries
          </p>
        </div>
      ) : (
        <>
          {/* Weekly Grid - Pass breaks array */}
          <WeeklyGrid schedule={flattenedSchedule} breaks={allBreaks} />

          {/* Conflict Summary */}
          {allConflicts.length > 0 && (
            <ConflictSummary conflicts={allConflicts} />
          )}
        </>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color }) => {
  const colorMap = {
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    green: "bg-green-100 text-green-800 border-green-300",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
    red: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className={`border-l-4 rounded-lg p-6 ${colorMap[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};

export default Dashboard;

WeeklyGrid.jsx:44 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at getConflictsForEntry (WeeklyGrid.jsx:44:22)
    at WeeklyGrid.jsx:119:23
    at Array.map (<anonymous>)
    at WeeklyGrid.jsx:116:31
    at Array.map (<anonymous>)
    at WeeklyGrid (WeeklyGrid.jsx:108:25)
    at Object.react_stack_bottom_frame (react-dom_client.js?v=7e2a9e1d:18509:20)
    at renderWithHooks (react-dom_client.js?v=7e2a9e1d:5654:24)
    at updateFunctionComponent (react-dom_client.js?v=7e2a9e1d:7475:21)
    at beginWork (react-dom_client.js?v=7e2a9e1d:8525:20)
installHook.js:1 An error occurred in the <WeeklyGrid> component.

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://react.dev/link/error-boundaries to learn more about error boundaries.


just want to show the all breaks too don't change other things like edit option in grid as you do in previous code i just full time table visiually on dashboard with all  subjects  and breaks