import { useState } from "react";
import { SubjectForm } from "../components/Subject/SubjectForm";
import { SubjectList } from "../components/Subject/SubjectList";
import { Button } from "../components/Common/Button";

export const SubjectManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setSelectedSubject(null);
    setRefresh(!refresh);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Subject Management</h1>
        <Button
          onClick={() => {
            setSelectedSubject(null);
            setShowForm(!showForm);
          }}
        >
          {showForm ? "Hide Form" : "Add Subject"}
        </Button>
      </div>

      {showForm && (
        <SubjectForm subject={selectedSubject} onSuccess={handleSuccess} />
      )}

      <SubjectList key={refresh} onEdit={handleEdit} />
    </div>
  );
};
