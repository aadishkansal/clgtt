import { useState, useRef, useEffect } from "react"; // 1. Import hooks
import { SubjectForm } from "../components/Subject/SubjectForm";
import { SubjectList } from "../components/Subject/SubjectList";
import { Button } from "../components/Common/Button";

export const SubjectManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [refresh, setRefresh] = useState(false);

  // 2. Create the ref
  const formRef = useRef(null);

  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setSelectedSubject(null);
    setRefresh(!refresh); // This will trigger the SubjectList to refetch
  };

  const handleAddNew = () => {
    setSelectedSubject(null);
    setShowForm(true);
  };

  // 3. Add useEffect to scroll when form visibility changes
  useEffect(() => {
    if (showForm) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm]); // Run this effect when showForm changes

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Subject Management</h1>
        <Button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
            } else {
              handleAddNew();
            }
          }}
        >
          {showForm ? "Hide Form" : "Add Subject"}
        </Button>
      </div>

      {/* 4. Attach the ref to the form's wrapper */}
      <div ref={formRef}>
        {showForm && (
          <SubjectForm subject={selectedSubject} onSuccess={handleSuccess} />
        )}
      </div>

      <SubjectList key={refresh} onEdit={handleEdit} />
    </div>
  );
};
