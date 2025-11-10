import { useState, useRef, useEffect } from "react"; // 1. Import hooks
import { ClassroomForm } from "../components/Classroom/ClassroomForm";
import { ClassroomList } from "../components/Classroom/ClassroomList";
import { Button } from "../components/Common/Button";

export const ClassroomManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [refresh, setRefresh] = useState(false);

  // 2. Create a ref
  const formRef = useRef(null);

  const handleEdit = (classroom) => {
    setSelectedClassroom(classroom);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setSelectedClassroom(null);
    setRefresh(!refresh);
  };

  // Handler for "Add" button
  const handleAddNew = () => {
    setSelectedClassroom(null);
    setShowForm(true);
  };

  // 3. Add useEffect to scroll when form becomes visible
  useEffect(() => {
    if (showForm) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm]); // This effect runs when 'showForm' changes

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Classroom Management
        </h1>
        <Button
          onClick={() => {
            // Use the explicit handler for "Add New"
            if (showForm) {
              setShowForm(false);
            } else {
              handleAddNew();
            }
          }}
        >
          {showForm ? "Hide Form" : "Add Classroom"}
        </Button>
      </div>

      {/* 4. Attach the ref to a wrapper div */}
      <div ref={formRef}>
        {showForm && (
          <ClassroomForm
            classroom={selectedClassroom}
            onSuccess={handleSuccess}
          />
        )}
      </div>

      <ClassroomList key={refresh} onEdit={handleEdit} />
    </div>
  );
};
