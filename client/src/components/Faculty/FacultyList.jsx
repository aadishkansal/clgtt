import { useState, useEffect } from "react";
import { Button } from "../Common/Button";
import { Loader } from "../Common/Loader";
import api from "../../utils/api";
import { handleApiError } from "../../utils/helpers";
import { toast } from "react-toastify";

export const FacultyList = ({ onEdit }) => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFaculty();
  }, []);

  const loadFaculty = async () => {
    try {
      console.log("📡 Fetching faculty...");
      setLoading(true);
      const response = await api.get("/faculty");

      const facultyData = response.data.data || response.data.faculty || [];

      console.log("✅ Faculty loaded:", facultyData);
      setFaculties(facultyData);
    } catch (error) {
      console.error("❌ Load Faculty Error:", error);
      toast.error(handleApiError(error));
      setFaculties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this faculty?")) {
      try {
        console.log("🗑️ Deleting faculty ID:", id);
        await api.delete(`/faculty/${id}`);
        toast.success("Faculty deleted successfully");
        console.log("✅ Delete successful");
        loadFaculty();
      } catch (error) {
        console.error("❌ Delete error:", error);
        toast.error(handleApiError(error));
      }
    }
  };

  if (loading) return <Loader />;

  if (!faculties || faculties.length === 0) {
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Faculty Members Found
        </h3>
        <p className="text-gray-600 mb-4">
          Get started by adding your first faculty member
        </p>
        <Button onClick={() => onEdit(null)}>Add Faculty</Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100 border-b-2 border-gray-300">
          <tr>
            <th className="px-6 py-4 text-left font-semibold text-gray-700">
              Name
            </th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700">
              Faculty ID
            </th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700">
              Departments
            </th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700">
              Email
            </th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700">
              Subjects
            </th>
            <th className="px-6 py-4 text-center font-semibold text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {faculties.map((faculty) => (
            <tr
              key={faculty._id}
              className="border-b border-gray-200 hover:bg-gray-50"
            >
              <td className="px-6 py-4 text-gray-800">{faculty.name}</td>
              <td className="px-6 py-4 text-gray-600">{faculty.facultyID}</td>
              <td className="px-6 py-4 text-gray-600">
                {faculty.departments?.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {faculty.departments.map((dept, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                      >
                        {dept}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">No departments</span>
                )}
              </td>
              <td className="px-6 py-4 text-gray-600">{faculty.email}</td>
              <td className="px-6 py-4 text-gray-600">
                {faculty.subjects?.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {faculty.subjects.map((subject, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                      >
                        {subject.subjectCode || subject}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">No subjects</span>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onEdit(faculty)}
                  className="mr-2"
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(faculty._id)}
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
