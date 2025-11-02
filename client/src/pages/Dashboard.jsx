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
  const [downloadingAll, setDownloadingAll] = useState(false); // NEW

  useEffect(() => {
    loadDashboardData();
  }, [selectedYear, selectedSemester]);

  const loadDashboardData = async () => {
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
  };

  // Download single PDF
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
      window.URL.revokeObjectURL(url);
      toast.success("📄 PDF downloaded!");
    } catch (error) {
      toast.error(handleApiError(error) || "Failed to download PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  // NEW: Download unified PDF
  const handleDownloadAllPDF = async () => {
    try {
      setDownloadingAll(true);
      const response = await api.get(
        `/dashboard/year/${selectedYear}/download-all-pdf`,
        {
          params: { semester: selectedSemester },
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `timetable-Y${selectedYear}-S${selectedSemester}-All-${Date.now()}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("📄 Unified PDF downloaded!");
    } catch (error) {
      toast.error(handleApiError(error) || "Failed to download unified PDF");
    } finally {
      setDownloadingAll(false);
    }
  };

  if (loading) return <Loader />;

  const flattenedSchedule = timetableData.flatMap((t) =>
    (t.schedule || []).map((s, idx) => ({
      ...s,
      timetableId: t._id,
      entryIndex: idx,
    }))
  );

  const allBreaks = timetableData.flatMap((t) =>
    (t.breaks || []).map((b) => {
      const ts = b.timeslotID || {};
      return {
        _id: b._id,
        day: ts.day,
        startTime: ts.startTime,
        endTime: ts.endTime,
      };
    })
  );

  const allConflicts = Array.isArray(timetableData)
    ? timetableData.reduce((acc, t) => [...acc, ...(t.conflicts || [])], [])
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

      <YearTabs selectedYear={selectedYear} onYearChange={setSelectedYear} />

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

      {/* NEW: Unified PDF Download */}
      {timetableData.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800">
                📚 Download Complete Timetable
              </h3>
              <p className="text-sm text-gray-600">
                Download all {timetableData.length} sections in one PDF
              </p>
            </div>
            <button
              onClick={handleDownloadAllPDF}
              disabled={downloadingAll}
              className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
                downloadingAll
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
              }`}
            >
              {downloadingAll ? (
                <>
                  <span className="animate-spin">⏳</span> Generating...
                </>
              ) : (
                <>📄 Download All PDF</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Individual timetable cards */}
      {timetableData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            📋 Individual Timetables
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timetableData.map((timetable) => (
              <div
                key={timetable._id}
                className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-all"
              >
                <p className="text-sm">
                  <span className="font-semibold">Year:</span> {timetable.year}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Sem:</span>{" "}
                  {timetable.semester}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Section:</span>{" "}
                  {timetable.section}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Classes:</span>{" "}
                  {timetable.schedule?.length || 0}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Breaks:</span>{" "}
                  {timetable.breaks?.length || 0}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Status:</span>{" "}
                  {timetable.isPublished ? "✅ Published" : "⏳ Draft"}
                </p>
                <button
                  onClick={() => handleDownloadPDF(timetable._id)}
                  disabled={downloadingId === timetable._id}
                  className={`w-full mt-3 py-2 px-3 rounded-lg font-semibold text-sm ${
                    downloadingId === timetable._id
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {downloadingId === timetable._id
                    ? "⏳ Generating..."
                    : "📄 Download Section PDF"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {flattenedSchedule.length > 0 ? (
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
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-semibold">No Classes Found</p>
          <p className="text-yellow-700 text-sm">
            Year {selectedYear}, Semester {selectedSemester}
          </p>
        </div>
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
