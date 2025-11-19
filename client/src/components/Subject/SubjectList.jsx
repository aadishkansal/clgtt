import { useState, useEffect } from "react";
import { Button } from "../Common/Button";
import { Loader } from "../Common/Loader";
import api from "../../utils/api";
import { handleApiError } from "../../utils/helpers";
import { toast } from "react-toastify";

const SUBJECT_TYPES = [
  { label: "Lecture (L)", value: "L" },
  { label: "Tutorial (T)", value: "T" },
  { label: "Practical (P)", value: "P" },
];

export const SubjectList = ({ onEdit }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // Added Search State

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get("/subjects");
      setSubjects(response.data.data || response.data.subjects || []);
    } catch (error) {
      toast.error(handleApiError(error));
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      try {
        await api.delete(`/subjects/${id}`);
        toast.success("Subject deleted successfully");
        loadSubjects();
      } catch (error) {
        toast.error(handleApiError(error));
      }
    }
  };

  const getTotalCredits = (subject) => {
    const l = parseInt(subject.lectureCredits) || 0;
    const t = parseInt(subject.tutorialCredits) || 0;
    const p = parseInt(subject.practicalCredits) || 0;
    return l + t + p;
  };

  // Filter Logic
  const filteredSubjects = subjects.filter((subject) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      subject.name.toLowerCase().includes(term) ||
      subject.subjectCode.toLowerCase().includes(term) ||
      (subject.department && subject.department.toLowerCase().includes(term)) ||
      subject.year.toString().includes(term) ||
      subject.semester.toString().includes(term)
    );
  });

  if (loading) return <Loader />;

  if (!subjects || subjects.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Subjects Found
        </h3>
        <p className="text-gray-600 mb-4">
          Add your first subject to get started
        </p>
        <Button onClick={() => onEdit(null)}>Add Subject</Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-blue-300 focus:ring focus:ring-blue-200 sm:text-sm transition duration-150 ease-in-out"
            placeholder="Search by name, code, dept, year..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-500 hidden sm:block">
          Showing {filteredSubjects.length} of {subjects.length}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b-2 border-gray-300">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Code</th>
              <th className="px-6 py-4 text-left font-semibold">Name</th>
              <th className="px-6 py-4 text-left font-semibold">Department</th>
              <th className="px-6 py-4 text-left font-semibold">Year</th>
              <th className="px-6 py-4 text-left font-semibold">Semester</th>
              <th className="px-6 py-4 text-left font-semibold">Type(s)</th>
              <th className="px-6 py-4 text-left font-semibold">
                Credits (L-T-P)
              </th>
              <th className="px-6 py-4 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubjects.length > 0 ? (
              filteredSubjects.map((subject) => (
                <tr
                  key={subject._id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-6 py-4 font-medium text-blue-600">
                    {subject.subjectCode}
                  </td>
                  <td className="px-6 py-4">{subject.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {subject.department || "-"}
                  </td>
                  <td className="px-6 py-4 text-center">{subject.year}</td>
                  <td className="px-6 py-4 text-center">{subject.semester}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(subject.type) ? (
                        subject.type.map((type) => (
                          <span
                            key={type}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                          >
                            {SUBJECT_TYPES.find((t) => t.value === type)
                              ?.label || type}
                          </span>
                        ))
                      ) : (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {SUBJECT_TYPES.find((t) => t.value === subject.type)
                            ?.label || subject.type}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-semibold">
                        {getTotalCredits(subject)} total credits
                      </div>
                      <div className="text-gray-600 text-xs mt-1">
                        {subject.lectureCredits > 0 && (
                          <div>L: {subject.lectureCredits}</div>
                        )}
                        {subject.tutorialCredits > 0 && (
                          <div>T: {subject.tutorialCredits}</div>
                        )}
                        {subject.practicalCredits > 0 && (
                          <div>P: {subject.practicalCredits}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onEdit(subject)}
                      className="mr-2"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(subject._id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  No subjects match your search "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
