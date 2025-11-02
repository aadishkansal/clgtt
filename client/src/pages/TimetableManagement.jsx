import { useState } from "react";
import { TimetableForm } from "../components/Timetable/TimetableForm";
import { Button } from "../components/Common/Button";

export const TimetableManagement = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Timetable Management
        </h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-3"
        >
          {showForm ? "Hide Form" : "Create New Entry"}
        </Button>
      </div>

      {showForm && (
        <TimetableForm
          onSuccess={() => {
            setShowForm(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};
