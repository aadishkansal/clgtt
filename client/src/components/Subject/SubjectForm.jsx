import { useState, useEffect } from "react";
import { Input } from "../Common/Input";
import { Select } from "../Common/Select";
import { MultiSelect } from "../Common/MultiSelect";
import { Button } from "../Common/Button";

import api from "../../utils/api";
import { handleApiError } from "../../utils/helpers";
import { toast } from "react-toastify";

const YEARS = [1, 2, 3, 4];
// ✅ FIX: Expanded to all 8 semesters
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const SUBJECT_TYPES = [
  { label: "Lecture (L)", value: "L" },
  { label: "Tutorial (T)", value: "T" },
  { label: "Practical (P)", value: "P" },
];

export const SubjectForm = ({ subject = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    subjectCode: "",
    name: "",
    year: "",
    semester: "",
    type: ["L"],
    department: "",
    lectureCredits: 3,
    tutorialCredits: 0,
    practicalCredits: 0,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (subject) {
      setFormData({
        subjectCode: subject.subjectCode || "",
        name: subject.name || "",
        year: subject.year || "",
        semester: subject.semester || "",
        type: Array.isArray(subject.type) ? subject.type : [subject.type],
        department: subject.department || "",
        lectureCredits: subject.lectureCredits || 0,
        tutorialCredits: subject.tutorialCredits || 0,
        practicalCredits: subject.practicalCredits || 0,
      });
    }
  }, [subject]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.type.length === 0) {
      setErrors((prev) => ({
        ...prev,
        type: "Please select at least one type",
      }));
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        subjectCode: formData.subjectCode,
        name: formData.name,
        year: parseInt(formData.year),
        semester: parseInt(formData.semester),
        type: formData.type,
        department: formData.department,
        lectureCredits: formData.type.includes("L")
          ? parseInt(formData.lectureCredits) || 0
          : 0,
        tutorialCredits: formData.type.includes("T")
          ? parseInt(formData.tutorialCredits) || 0
          : 0,
        practicalCredits: formData.type.includes("P")
          ? parseInt(formData.practicalCredits) || 0
          : 0,
      };

      console.log("Submitting:", submitData);

      if (subject) {
        await api.put(`/subjects/${subject._id}`, submitData);
        toast.success("Subject updated successfully");
      } else {
        await api.post("/subjects", submitData);
        toast.success("Subject created successfully");
      }

      setFormData({
        subjectCode: "",
        name: "",
        year: "",
        semester: "",
        type: ["L"],
        department: "",
        lectureCredits: 3,
        tutorialCredits: 0,
        practicalCredits: 0,
      });
      setErrors({});
      onSuccess();
    } catch (error) {
      console.error("Error response:", error.response?.data);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      // This will show the actual validation message from Mongoose
      toast.error(error.response?.data?.message || handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">
        {subject ? "Edit Subject" : "Add Subject"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input
            label="Subject Code"
            name="subjectCode"
            value={formData.subjectCode}
            onChange={handleChange}
            required
            disabled={!!subject}
            placeholder="e.g., 5EIRC2"
          />
          {errors.subjectCode && (
            <p className="text-red-500 text-sm mt-1">{errors.subjectCode}</p>
          )}
        </div>
        <div>
          <Input
            label="Subject Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., Python Programming"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>
        <div>
          <Select
            label="Year"
            name="year"
            value={formData.year}
            onChange={handleChange}
            options={YEARS.map((y) => ({ label: `Year ${y}`, value: y }))}
            required
            disabled={!!subject}
          />
          {errors.year && (
            <p className="text-red-500 text-sm mt-1">{errors.year}</p>
          )}
        </div>
        <div>
          <Select
            label="Semester"
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            options={SEMESTERS.map((s) => ({
              label: `Semester ${s}`,
              value: s,
            }))}
            required
            disabled={!!subject}
          />
          {errors.semester && (
            <p className="text-red-500 text-sm mt-1">{errors.semester}</p>
          )}
        </div>
        <div>
          <Input
            label="Department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="e.g., Electronics & Instrumentation"
          />
          {errors.department && (
            <p className="text-red-500 text-sm mt-1">{errors.department}</p>
          )}
        </div>
        <div>
          <MultiSelect
            label="Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={SUBJECT_TYPES}
            required
          />
          {errors.type && (
            <p className="text-red-500 text-sm mt-1">{errors.type}</p>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-4">
          Weekly Credit Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {formData.type.includes("L") && (
            <div>
              <Input
                label="Lecture Credits (L)"
                type="number"
                name="lectureCredits"
                value={formData.lectureCredits}
                onChange={handleChange}
                min="0"
                max="10"
              />
            </div>
          )}
          {formData.type.includes("T") && (
            <div>
              <Input
                label="Tutorial Credits (T)"
                type="number"
                name="tutorialCredits"
                value={formData.tutorialCredits}
                onChange={handleChange}
                min="0"
                max="10"
              />
            </div>
          )}
          {formData.type.includes("P") && (
            <div>
              <Input
                label="Practical Credits (P)"
                type="number"
                name="practicalCredits"
                value={formData.practicalCredits}
                onChange={handleChange}
                min="0"
                max="10"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <Button type="submit" disabled={loading}>
          {loading ? "Loading..." : subject ? "Update" : "Add"} Subject
        </Button>
      </div>
    </form>
  );
};
