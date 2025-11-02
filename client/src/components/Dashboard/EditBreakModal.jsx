import { useState } from "react";
import { toast } from "react-toastify";
import api from "../../utils/api";

export const EditBreakModal = ({ isOpen, breakItem, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !breakItem) {
    return null;
  }

  const handleDelete = async () => {
    setLoading(true);
    try {


      await api.delete(`/timetable/break/${breakItem._id}`);


      toast.success("Break deleted successfully");

      onClose();
      setTimeout(() => {
        onRefresh();
      }, 500);
    } catch (error) {
      console.error(" Delete error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to delete break");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
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
             Break Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl leading-none font-bold hover:bg-gray-100 w-8 h-8 rounded transition-colors"
            > X 
            </button>

          </div>

          {/* Break Details */}
          <div className="space-y-4 mb-6">
            {/* Day */}
            <div className="bg-orange-50 border-l-4 border-orange-500 rounded p-4">
              <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">
                Day
              </p>
              <p className="text-lg font-bold text-orange-900 mt-1">
                {breakItem.day}
              </p>
            </div>

            {/* Time */}
            <div className="bg-orange-50 border-l-4 border-orange-500 rounded p-4">
              <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">
                Time
              </p>
              <p className="text-lg font-bold text-orange-900 mt-1">
                {breakItem.startTime} - {breakItem.endTime}
              </p>
            </div>

            {/* Duration */}
            <div className="bg-orange-50 border-l-4 border-orange-500 rounded p-4">
              <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">
                Duration
              </p>
              <p className="text-lg font-bold text-orange-900 mt-1">
                60 minutes
              </p>
            </div>

            {/* Type */}
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4">
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">
                Type
              </p>
              <p className="text-lg font-bold text-blue-900 mt-1">
                Break
              </p>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="text-sm text-blue-700">
                This break is reserved and no classes can be scheduled
                during this time.
              </p>
            </div>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm ? (
            <div className="bg-red-50 border-2 border-red-300 rounded p-4 mb-4">
              <p className="text-red-700 font-bold mb-4">
                Are you sure you want to remove this break?
              </p>
              <p className="text-red-600 text-sm mb-4">
                Classes can now be scheduled during this time.
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
                  {loading ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          ) : (
            /* Action Buttons */
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                Remove Break
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
            Click Remove Break to delete this break time
          </p>
        </div>
      </div>
    </>
  );
};
