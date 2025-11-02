import { useState } from "react";
import { toast } from "react-toastify";
import api from "../../utils/api";

export const EditEntryModal = ({ isOpen, entry, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !entry) {
    return null;
  }

  const handleEdit = () => {
    console.log(" Edit entry:", entry._id);
    // Navigate to edit page
    window.location.href = `/timetable/edit/${entry.timetableId}`;
  };

const handleDelete = async () => {
  setLoading(true);
  try {
    console.log("Deleting entry...");
    console.log("Timetable ID:", entry.timetableId);
    console.log("Entry Index:", entry.entryIndex);

    // FIXED: Remove 'response' variable
    await api.delete(`/timetable/${entry.timetableId}`, {
      data: {
        entryIndex: entry.entryIndex,
      },
    });

    console.log("âœ… Entry deleted successfully");
    toast.success("âœ… Entry deleted successfully");

    onClose();
    setTimeout(() => {
      onRefresh();
    }, 500);
  } catch (error) {
    console.error("âŒ Delete error:", error.response?.data || error.message);
    toast.error(error.response?.data?.message || "Failed to delete entry");
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-white h-screen bg-opacity-10 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto transform transition-all">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              Entry Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl leading-none font-bold hover:bg-gray-100 w-8 h-8 rounded transition-colors"
            >
              X 
            </button>
          </div>

          {/* Entry Details */}
          <div className="space-y-4 mb-6">
            {/* Subject */}
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4">
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">
                Subject
              </p>
              <p className="text-lg font-bold text-blue-900 mt-1">
                {entry.subjectCode?.subjectCode}
              </p>
              <p className="text-sm text-blue-700">{entry.subjectCode?.name}</p>
            </div>

            {/* Faculty */}
            <div className="bg-purple-50 border-l-4 border-purple-500 rounded p-4">
              <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">
                Faculty
              </p>
              <p className="text-lg font-bold text-purple-900 mt-1">
                {entry.facultyID?.name}
              </p>
              <p className="text-sm text-purple-700">
                ID: {entry.facultyID?.facultyID}
              </p>
            </div>

            {/* Classroom */}
            <div className="bg-green-50 border-l-4 border-green-500 rounded p-4">
              <p className="text-xs text-green-600 font-bold uppercase tracking-wider">
                Classroom
              </p>
              <p className="text-lg font-bold text-green-900 mt-1">
                {entry.classroomID?.roomNumber}
              </p>
              <p className="text-sm text-green-700">
                Block {entry.classroomID?.block} Capacity:{" "}
                {entry.classroomID?.capacity}
              </p>
            </div>

            {/* Time Slot */}
            <div className="bg-orange-50 border-l-4 border-orange-500 rounded p-4">
              <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">
                Time
              </p>
              <p className="text-lg font-bold text-orange-900 mt-1">
                {entry.timeslotID?.day}
              </p>
              <p className="text-sm text-orange-700">
                {entry.timeslotID?.startTime} - {entry.timeslotID?.endTime}
              </p>
            </div>

            {/* Batch */}
            {entry.batchGroup && (
              <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded p-4">
                <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
                  Batch
                </p>
                <p className="text-lg font-bold text-indigo-900 mt-1">
                  {entry.batchGroup}
                </p>
              </div>
            )}

            {/* RMC Status */}
            {entry.isRMC && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded p-4">
                <p className="text-xs text-red-600 font-bold uppercase tracking-wider">
                  Status
                </p>
                <p className="text-lg font-bold text-red-900 mt-1">
                  Recorded/Makeup Class
                </p>
              </div>
            )}
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm ? (
            <div className="bg-red-50 border-2 border-red-300 rounded p-4 mb-4">
              <p className="text-red-700 font-bold mb-4">
                Are you sure you want to delete this entry?
              </p>
              <p className="text-red-600 text-sm mb-4">
                This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                  className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-400 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ) : (
            /* Action Buttons */
            <div className="flex gap-3">
              <button
                onClick={handleEdit}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
               Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                Delete
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 disabled:opacity-50 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* Info text */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Click Edit to modify this entry
          </p>
        </div>
      </div>
    </>
  );
};
