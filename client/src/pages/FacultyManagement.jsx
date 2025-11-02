import { useState } from "react";
import { FacultyForm } from "../components/Faculty/FacultyForm";
import { FacultyList } from "../components/Faculty/FacultyList";

export const FacultyManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    console.log("✅ Success - Reloading faculty list");
    setShowForm(false);
    setSelectedFaculty(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleEdit = (faculty) => {
    console.log("📝 Editing faculty:", faculty);
    setSelectedFaculty(faculty);
    setShowForm(true);
  };

  const handleHideForm = () => {
    setShowForm(false);
    setSelectedFaculty(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Faculty Management</h1>
        {!showForm && (
          <button
            onClick={() => {
              setSelectedFaculty(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Faculty
          </button>
        )}
      </div>

      {showForm && (
        <div>
          <FacultyForm faculty={selectedFaculty} onSuccess={handleSuccess} />
          <button
            onClick={handleHideForm}
            className="mt-4 text-gray-600 hover:text-gray-800"
          >
            Hide Form
          </button>
        </div>
      )}

      <FacultyList key={refreshKey} onEdit={handleEdit} />
    </div>
  );
};
