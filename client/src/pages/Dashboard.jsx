import { useState, useEffect, useMemo, useCallback } from "react";
import { YearTabs } from "../components/Dashboard/YearTabs";
import { WeeklyGrid } from "../components/Dashboard/WeeklyGrid";
import { ConflictSummary } from "../components/Dashboard/ConflictSummary";
import { Loader } from "../components/Common/Loader";
import api from "../utils/api";
import { handleApiError } from "../utils/helpers";
import { toast } from "react-toastify";

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Electronics & Instrumentation",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Artificial Intelligence & DS",
];

export const Dashboard = () => {
  // Default to the first department since "All" is removed
  const [selectedDepartment, setSelectedDepartment] = useState(DEPARTMENTS[3]);
  const [selectedYear, setSelectedYear] = useState(2);
  const [selectedSemester, setSelectedSemester] = useState(3);
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  // Helper to get valid semesters for a year
  const getSemestersForYear = (year) => {
    const y = parseInt(year);
    if (y === 1) return [1, 2];
    if (y === 2) return [3, 4];
    if (y === 3) return [5, 6];
    if (y === 4) return [7, 8];
    return [];
  };

  // Handle Year Change with Auto-Semester Reset
  const handleYearChange = (year) => {
    setSelectedYear(year);
    const validSemesters = getSemestersForYear(year);
    if (!validSemesters.includes(selectedSemester)) {
      setSelectedSemester(validSemesters[0]);
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/dashboard/year/${selectedYear}`, {
        params: { semester: selectedSemester },
      });
      const data = response.data.data || response.data.timetables || [];
      setTimetableData(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(handleApiError(error) || "Failed to load dashboard");
      setTimetableData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedSemester]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const filteredTimetables = useMemo(() => {
    return timetableData.filter((t) => t.department === selectedDepartment);
  }, [timetableData, selectedDepartment]);

  const handleDeleteTimetable = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this entire timetable? This cannot be undone."
      )
    ) {
      try {
        await api.delete(`/timetable/${id}/full`);
        toast.success("Timetable deleted successfully");
        loadDashboardData();
      } catch (error) {
        toast.error(handleApiError(error));
      }
    }
  };

  const handleDownloadPDF = async (timetableId) => {
    try {
      setDownloadingId(timetableId);
      const response = await api.get(`/timetable/${timetableId}/download-pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const timetable = timetableData.find((t) => t._id === timetableId);
      link.setAttribute(
        "download",
        `timetable-Y${timetable?.year}-S${timetable?.semester}-${Date.now()}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("📄 PDF downloaded!");
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <Loader />;

  const flattenedSchedule = filteredTimetables.flatMap((t) =>
    (t.schedule || []).map((s, idx) => ({
      ...s,
      timetableId: t._id,
      entryIndex: idx,
    }))
  );

  const allBreaks = filteredTimetables.flatMap((t) =>
    (t.breaks || []).map((b) => {
      const ts = b.timeslotID || {};
      return {
        _id: b._id,
        day: ts.day,
        startTime: ts.startTime,
        endTime: ts.endTime,
        label: b.label || "Break",
      };
    })
  );

  const allConflicts = Array.isArray(filteredTimetables)
    ? filteredTimetables.reduce(
        (acc, t) => [...acc, ...(t.conflicts || [])],
        []
      )
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Timetable Dashboard
        </h1>
        <p className="text-gray-600">
          Year {selectedYear} Semester {selectedSemester}
        </p>
      </div>

      {/* Stats Cards - Removed Published Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Timetables"
          value={filteredTimetables.length}
          color="blue"
        />
        <StatCard
          label="Total Classes"
          value={flattenedSchedule.length}
          color="yellow"
        />
        <StatCard label="Total Breaks" value={allBreaks.length} color="red" />
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Year
          </label>
          <YearTabs
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Semester
            </label>
            <div className="flex gap-2 flex-wrap">
              {getSemestersForYear(selectedYear).map((sem) => (
                <button
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm border transition-all ${
                    selectedSemester === sem
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  Sem {sem}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              {/* Removed "All Departments" option */}
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Removed Download All Button Section */}

      {filteredTimetables.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTimetables.map((timetable) => (
            <div
              key={timetable._id}
              className="border rounded-lg p-4 bg-white shadow-sm relative group hover:shadow-md transition-all"
            >
              <button
                onClick={() => handleDeleteTimetable(timetable._id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete"
              >
                🗑️
              </button>
              {timetable.department && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                  {timetable.department}
                </span>
              )}
              <div className="mt-3 space-y-1 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="font-semibold">Year:</span>
                  <span>{timetable.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Sem:</span>
                  <span>{timetable.semester}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Section:</span>
                  <span>{timetable.section}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Status:</span>
                  {timetable.isPublished ? (
                    <span className="text-green-600 font-bold">
                      ✅ Published
                    </span>
                  ) : (
                    <span className="text-orange-500 font-bold">⏳ Draft</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDownloadPDF(timetable._id)}
                disabled={downloadingId === timetable._id}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {downloadingId === timetable._id
                  ? "Generating..."
                  : "Download PDF"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded border border-dashed border-gray-300 text-gray-500">
          No timetables found for the selected criteria.
        </div>
      )}

      {flattenedSchedule.length > 0 && (
        <>
          <WeeklyGrid
            schedule={flattenedSchedule}
            conflicts={allConflicts}
            breaks={allBreaks}
          />
          {allConflicts.length > 0 && (
            <ConflictSummary conflicts={allConflicts} />
          )}
        </>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <div className={`p-4 border rounded-lg ${colors[color]}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default Dashboard;
