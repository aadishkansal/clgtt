import { useState, useEffect } from "react";
import { Button } from "../Common/Button";
import { Loader } from "../Common/Loader";
import api from "../../utils/api";
import { handleApiError } from "../../utils/helpers";
import { toast } from "react-toastify";

export const ClassroomList = ({ onEdit }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // Added Search State

  useEffect(() => {
    loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    try {
      setLoading(true);
      const response = await api.get("/classrooms");
      const classroomData =
        response.data.data || response.data.classrooms || [];
      setClassrooms(classroomData);
    } catch (error) {
      toast.error(handleApiError(error));
      setClassrooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this classroom?")) {
      try {
        await api.delete(`/classrooms/${id}`);
        toast.success("Classroom deleted successfully");
        loadClassrooms();
      } catch (error) {
        toast.error(handleApiError(error));
      }
    }
  };

  // Filter Logic
  const filteredClassrooms = classrooms.filter((classroom) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      classroom.roomNumber.toLowerCase().includes(term) ||
      classroom.block.toLowerCase().includes(term) ||
      classroom.type.toLowerCase().includes(term) ||
      classroom.capacity.toString().includes(term)
    );
  });

  if (loading) return <Loader />;

  if (!classrooms || classrooms.length === 0) {
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Classrooms Found
        </h3>
        <p className="text-gray-600 mb-4">
          Add your first classroom to begin scheduling
        </p>
        <Button onClick={() => onEdit(null)}>Add Classroom</Button>
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
            placeholder="Search by room number, block, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-500 hidden sm:block">
          Showing {filteredClassrooms.length} of {classrooms.length}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b-2 border-gray-300">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Room Number</th>
              <th className="px-6 py-4 text-left font-semibold">Block</th>
              <th className="px-6 py-4 text-left font-semibold">Capacity</th>
              <th className="px-6 py-4 text-left font-semibold">Type</th>
              <th className="px-6 py-4 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClassrooms.length > 0 ? (
              filteredClassrooms.map((classroom) => (
                <tr
                  key={classroom._id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-6 py-4 font-medium text-blue-600">
                    {classroom.roomNumber}
                  </td>
                  <td className="px-6 py-4">{classroom.block}</td>
                  <td className="px-6 py-4 text-center">
                    {classroom.capacity}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm capitalize">
                      {classroom.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onEdit(classroom)}
                      className="mr-2"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(classroom._id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No classrooms match your search "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
