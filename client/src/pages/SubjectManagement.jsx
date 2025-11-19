import { useState, useRef, useEffect } from "react";
import { SubjectForm } from "../components/Subject/SubjectForm";
import { SubjectList } from "../components/Subject/SubjectList";
import { Button } from "../components/Common/Button";

export const SubjectManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const formRef = useRef(null);

  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setSelectedSubject(null);
    setRefresh(!refresh);
  };

  const handleAddNew = () => {
    setSelectedSubject(null);
    setShowForm(true);
  };


  useEffect(() => {
    if (showForm && formRef.current) {
      // The timeout ensures the DOM has painted the form before scrolling starts
      setTimeout(() => {
        formRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start", // You can change this to 'center' if 'start' is hidden by a navbar
        });
      }, 100);
    }
  }, [showForm, selectedSubject]); // Trigger when form opens OR when subject changes

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

      {/* The ref is attached here to capture the scroll target */}
      <div ref={formRef} className="scroll-mt-20">
        {/* Added scroll-mt-20 (scroll margin top) to give some breathing room when scrolling */}
        {showForm && (
          <SubjectForm subject={selectedSubject} onSuccess={handleSuccess} />
        )}
      </div>

      <SubjectList key={refresh} onEdit={handleEdit} />
    </div>
  );
};
