import { useState } from "react";
import { ClassroomForm } from "../components/Classroom/ClassroomForm";
import { ClassroomList } from "../components/Classroom/ClassroomList";
import { Button } from "../components/Common/Button";

export const ClassroomManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const handleEdit = (classroom) => {
    setSelectedClassroom(classroom);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setSelectedClassroom(null);
    setRefresh(!refresh);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Classroom Management
        </h1>
        <Button
          onClick={() => {
            setSelectedClassroom(null);
            setShowForm(!showForm);
          }}
        >
          {showForm ? "Hide Form" : "Add Classroom"}
        </Button>
      </div>

      {showForm && (
        <ClassroomForm
          classroom={selectedClassroom}
          onSuccess={handleSuccess}
        />
      )}

      <ClassroomList key={refresh} onEdit={handleEdit} />
    </div>
  );
};
