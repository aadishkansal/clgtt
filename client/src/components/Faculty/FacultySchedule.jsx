import { useState, useEffect } from "react";
import { Loader } from "../Common/Loader";
import { DAYS_OF_WEEK, TIME_SLOTS } from "../../utils/constants";
import api from "../../utils/api";
import { handleApiError } from "../../utils/helpers";
import { toast } from "react-toastify";

export const FacultySchedule = ({ facultyId }) => {
  const [schedule, setSchedule] = useState([]);
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHours: 0,
    subjects: [],
    years: [],
  });

  useEffect(() => {
    const loadFacultySchedule = async () => {
      if (!facultyId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Load faculty details
        const facultyResponse = await api.get(`/faculty/${facultyId}`);
        setFaculty(facultyResponse.data.data);

        // Load all timetables and filter by faculty
        const timetableResponse = await api.get("/timetable");
        const allTimetables = timetableResponse.data.data || [];

        // Extract schedule entries for this faculty
        const facultySchedule = [];
        const uniqueSubjects = new Set();
        const uniqueYears = new Set();

        allTimetables.forEach((timetable) => {
          timetable.schedule.forEach((entry) => {
            if (entry.facultyID?._id === facultyId) {
              facultySchedule.push({
                ...entry,
                year: timetable.year,
                section: timetable.section,
              });
              uniqueSubjects.add(entry.subjectCode?.name);
              uniqueYears.add(timetable.year);
            }
          });
        });

        setSchedule(facultySchedule);
        setStats({
          totalHours: facultySchedule.length, // Each slot is 1 hour
          subjects: Array.from(uniqueSubjects),
          years: Array.from(uniqueYears).sort(),
        });
      } catch (error) {
        toast.error(handleApiError(error));
      } finally {
        setLoading(false);
      }
    };

    loadFacultySchedule();
  }, [facultyId]);

  const getEntryForSlot = (day, timeSlot) => {
    return schedule.find(
      (entry) =>
        entry.timeslotID?.day === day &&
        entry.timeslotID?.startTime === timeSlot.split("-")[0]
    );
  };

  if (loading) return <Loader />;

  if (!faculty) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Faculty not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Faculty Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {faculty.name}
            </h2>
            <p className="text-gray-600">Faculty ID: {faculty.facultyID}</p>
            <p className="text-gray-600">Department: {faculty.department}</p>
            <p className="text-gray-600">Email: {faculty.email}</p>
          </div>
          <div className="text-right">
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
              <p className="text-sm font-medium">Total Teaching Hours</p>
              <p className="text-3xl font-bold">{stats.totalHours}</p>
              <p className="text-xs">out of {faculty.maxHoursPerWeek} max</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">
                Teaching Subjects:
              </p>
              <div className="flex flex-wrap gap-2">
                {stats.subjects.map((subject, idx) => (
                  <span
                    key={idx}
                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">
                Teaching Years:
              </p>
              <div className="flex flex-wrap gap-2">
                {stats.years.map((year, idx) => (
                  <span
                    key={idx}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                  >
                    {year} Year
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">Weekly Schedule</h3>
        </div>

        <table className="w-full border-collapse">
          <thead className="bg-gray-100 border-b-2 border-gray-300">
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
                <td className="px-4 py-4 font-medium text-gray-700 bg-gray-50">
                  {timeSlot}
                </td>
                {DAYS_OF_WEEK.map((day) => {
                  const entry = getEntryForSlot(day, timeSlot);

                  return (
                    <td
                      key={`${day}-${slotIndex}`}
                      className={`px-4 py-4 text-center border border-gray-200 min-h-[100px] ${
                        entry ? "bg-blue-50" : ""
                      }`}
                    >
                      {entry && entry.subjectCode ? (
                        <div className="text-xs">
                          <p className="font-bold text-blue-700 mb-1">
                            {entry.subjectCode?.subjectCode}
                          </p>
                          <p className="text-gray-700 font-medium">
                            {entry.subjectCode?.name}
                          </p>
                          <p className="text-gray-500 mt-1">
                            {entry.year} Year - {entry.section}
                          </p>
                          <p className="text-gray-500">
                            Room: {entry.classroomID?.roomNumber}
                          </p>
                          {entry.batchGroup && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                              {entry.batchGroup}
                            </span>
                          )}
                        </div>
                      ) : timeSlot === "LUNCH BREAK" ? (
                        <span className="text-gray-400 font-semibold">
                          BREAK
                        </span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Workload Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Workload Analysis
        </h3>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700 font-medium">
              Weekly Teaching Load
            </span>
            <span className="text-gray-900 font-bold">
              {stats.totalHours} / {faculty.maxHoursPerWeek} hours
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (stats.totalHours / faculty.maxHoursPerWeek) * 100 > 100
                  ? "bg-red-500"
                  : (stats.totalHours / faculty.maxHoursPerWeek) * 100 > 80
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
              style={{
                width: `${Math.min((stats.totalHours / faculty.maxHoursPerWeek) * 100, 100)}%`,
              }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              {((stats.totalHours / faculty.maxHoursPerWeek) * 100).toFixed(1)}%
              utilized
            </span>
            {stats.totalHours > faculty.maxHoursPerWeek && (
              <span className="text-xs text-red-600 font-medium">
                ⚠️ Overloaded by {stats.totalHours - faculty.maxHoursPerWeek}{" "}
                hours
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm font-medium mb-1">
              Classes per Week
            </p>
            <p className="text-3xl font-bold text-blue-900">
              {schedule.length}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-purple-800 text-sm font-medium mb-1">
              Different Subjects
            </p>
            <p className="text-3xl font-bold text-purple-900">
              {stats.subjects.length}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm font-medium mb-1">
              Years Teaching
            </p>
            <p className="text-3xl font-bold text-green-900">
              {stats.years.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
