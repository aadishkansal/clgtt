import { useState, useEffect } from "react";
import { Button } from "../Common/Button";
import { Loader } from "../Common/Loader";
import api from "../../utils/api";
import { handleApiError } from "../../utils/helpers";
import { toast } from "react-toastify";

export const FacultyList = ({ onEdit }) => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Add Search State
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadFaculty();
  }, []);

  const loadFaculty = async () => {
    try {
      setLoading(true);
      const response = await api.get("/faculty");
      const facultyData = response.data.data || response.data.faculty || [];
      setFaculties(facultyData);
    } catch (error) {
      toast.error(handleApiError(error));
      setFaculties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this faculty?")) {
      try {
        await api.delete(`/faculty/${id}`);
        toast.success("Faculty deleted successfully");
        loadFaculty();
      } catch (error) {
        toast.error(handleApiError(error));
      }
    }
  };

  // 2. Filter Logic
  const filteredFaculties = faculties.filter((faculty) => {
    if (!searchTerm) return true; // Show all if search is empty

    const term = searchTerm.toLowerCase();

    // Safe check function to handle null values
    const check = (val) => val?.toString().toLowerCase().includes(term);

    return (
      check(faculty.name) ||
      check(faculty.facultyID) ||
      check(faculty.email) ||
      // Search inside Departments array
      faculty.departments?.some((dept) => check(dept)) ||
      // Search inside Subjects array (checks Name and Code)
      faculty.subjects?.some(
        (sub) => check(sub.name) || check(sub.subjectCode) || check(sub)
      )
    );
  });

  if (loading) return <Loader />;

  // Empty State (Database is empty)
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
    <div className="bg-white rounded-lg shadow-md">
      {/* 3. Search Bar Section */}
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
            placeholder="Search faculty by name, ID, department, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Optional: Display count of results */}
        <div className="text-sm text-gray-500 hidden sm:block">
          Showing {filteredFaculties.length} of {faculties.length}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
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
            {/* 4. Map filtered results */}
            {filteredFaculties.length > 0 ? (
              filteredFaculties.map((faculty) => (
                <tr
                  key={faculty._id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-gray-800 font-medium">
                    {faculty.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {faculty.facultyID}
                  </td>
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
                      <span className="text-gray-400">-</span>
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
                            {typeof subject === "object" && subject !== null ? (
                              <span>
                                {subject.name}{" "}
                                <span className="font-semibold text-blue-900">
                                  ({subject.subjectCode})
                                </span>
                              </span>
                            ) : (
                              subject.subjectCode || subject
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
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
              ))
            ) : (
              // 5. No Search Results State
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No faculty members match your search "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
