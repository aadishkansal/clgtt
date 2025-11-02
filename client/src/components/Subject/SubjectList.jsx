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

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get("/subjects");

      const subjectData = response.data.data || response.data.subjects || [];
      setSubjects(subjectData);
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
    if (
      subject.creditDistribution &&
      typeof subject.creditDistribution === "object"
    ) {
      return Object.values(subject.creditDistribution).reduce(
        (a, b) => a + b,
        0
      );
    }
    return subject.creditHours || 0;
  };

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
    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100 border-b-2 border-gray-300">
          <tr>
            <th className="px-6 py-4 text-left font-semibold">Code</th>
            <th className="px-6 py-4 text-left font-semibold">Name</th>
            <th className="px-6 py-4 text-left font-semibold">Year</th>
            <th className="px-6 py-4 text-left font-semibold">Semester</th>
            <th className="px-6 py-4 text-left font-semibold">Type(s)</th>
            <th className="px-6 py-4 text-left font-semibold">Credits</th>
            <th className="px-6 py-4 text-center font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject) => (
            <tr
              key={subject._id}
              className="border-b border-gray-200 hover:bg-gray-50"
            >
              <td className="px-6 py-4 font-medium text-blue-600">
                {subject.subjectCode}
              </td>
              <td className="px-6 py-4">{subject.name}</td>
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
                        {SUBJECT_TYPES.find((t) => t.value === type)?.label ||
                          type}
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
                    {getTotalCredits(subject)} total
                  </div>
                  {subject.creditDistribution &&
                    typeof subject.creditDistribution === "object" && (
                      <div className="text-gray-600 text-xs mt-1">
                        {Object.entries(subject.creditDistribution).map(
                          ([type, credits]) => (
                            <div key={type}>
                              {type}: {credits}
                            </div>
                          )
                        )}
                      </div>
                    )}
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
          ))}
        </tbody>
      </table>
    </div>
  );
};
