import { useState, useEffect } from "react";
import { Input } from "../Common/Input";
import { Button } from "../Common/Button";
import api from "../../utils/api";
import { handleApiError } from "../../utils/helpers";
import { toast } from "react-toastify";

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Electronics & Instrumentation",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Artificial Intelligence & DS",
];

export const FacultyForm = ({ faculty = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    facultyID: "",
    departments: [],
    email: "",
    phone: "",
    maxHoursPerWeek: 24,
    subjects: [],
  });

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newDepartment, setNewDepartment] = useState("");

  useEffect(() => {
    loadSubjects();

    if (faculty) {
      setFormData({
        name: faculty.name || "",
        facultyID: faculty.facultyID || "",
        departments: faculty.departments || [],
        email: faculty.email || "",
        phone: faculty.phone || "",
        maxHoursPerWeek: faculty.maxHoursPerWeek || 24,
        subjects: faculty.subjects?.map((s) => s._id || s) || [],
      });
    }
  }, [faculty]);

  const loadSubjects = async () => {
    try {
      const response = await api.get("/subjects");
      const subjectData = response.data?.data || response.data?.subjects || [];
      setSubjects(subjectData);
    } catch {
      // Removed unused 'error' variable
      toast.error("Failed to load subjects");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDepartmentToggle = (department) => {
    setFormData((prev) => {
      const departments = prev.departments || [];
      const isSelected = departments.includes(department);

      return {
        ...prev,
        departments: isSelected
          ? departments.filter((d) => d !== department)
          : [...departments, department],
      };
    });
  };

  const handleAddCustomDepartment = () => {
    if (newDepartment.trim()) {
      const trimmedDept = newDepartment.trim();
      if (!formData.departments.includes(trimmedDept)) {
        setFormData((prev) => ({
          ...prev,
          departments: [...prev.departments, trimmedDept],
        }));
        setNewDepartment("");
      } else {
        toast.warning("Department already selected");
      }
    }
  };

  const handleRemoveDepartment = (department) => {
    setFormData((prev) => ({
      ...prev,
      departments: prev.departments.filter((d) => d !== department),
    }));
  };

  const handleSubjectToggle = (subjectId) => {
    setFormData((prev) => {
      const subjects = prev.subjects || [];
      const isSelected = subjects.includes(subjectId);

      return {
        ...prev,
        subjects: isSelected
          ? subjects.filter((id) => id !== subjectId)
          : [...subjects, subjectId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.departments.length === 0) {
      toast.error("Please select at least one department");
      return;
    }

    if (!formData.name || !formData.email) {
      toast.error("Name and Email are required");
      return;
    }

    setLoading(true);

    try {
      if (faculty) {
        await api.put(`/faculty/${faculty._id}`, formData);
        toast.success("Faculty updated successfully");
      } else {
        await api.post("/faculty", formData);
        toast.success("Faculty created successfully");
      }

      onSuccess();

      setFormData({
        name: "",
        facultyID: "",
        departments: [],
        email: "",
        phone: "",
        maxHoursPerWeek: 24,
        subjects: [],
      });
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {faculty ? "Edit Faculty" : "Add Faculty"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <Input
          label="Faculty ID"
          name="facultyID"
          value={formData.facultyID}
          onChange={handleChange}
          required
          disabled={!!faculty}
        />

        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <Input
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />

        <Input
          label="Max Hours Per Week"
          type="number"
          name="maxHoursPerWeek"
          value={formData.maxHoursPerWeek}
          onChange={handleChange}
          min="1"
        />
      </div>

      {/* Departments Multi-Select */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Departments <span className="text-red-500">*</span>
          <span className="text-gray-500 font-normal ml-2">
            (Select all departments this faculty belongs to)
          </span>
        </label>

        {/* Selected Departments Tags */}
        {formData.departments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {formData.departments.map((dept) => (
              <span
                key={dept}
                className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {dept}
                <button
                  type="button"
                  onClick={() => handleRemoveDepartment(dept)}
                  className="hover:text-blue-900 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Department Checkboxes */}
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {DEPARTMENTS.map((dept) => (
              <label
                key={dept}
                className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                  formData.departments?.includes(dept)
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.departments?.includes(dept)}
                  onChange={() => handleDepartmentToggle(dept)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{dept}</span>
              </label>
            ))}
          </div>

          {/* Add Custom Department Input */}
          <div className="border-t pt-4">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Other Department (e.g., Mathematics, Humanities)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  (e.preventDefault(), handleAddCustomDepartment())
                }
                placeholder="Type department name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <Button
                type="button"
                onClick={handleAddCustomDepartment}
                variant="secondary"
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Multi-Select */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Subjects{" "}
          <span className="text-gray-500">
            (Select all subjects this faculty can teach)
          </span>
        </label>
        <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
          {subjects.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No subjects available. Please add subjects first.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjects.map((subject) => (
                <label
                  key={subject._id}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer border transition-all ${
                    formData.subjects?.includes(subject._id)
                      ? "bg-blue-50 border-blue-300"
                      : "hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.subjects?.includes(subject._id)}
                    onChange={() => handleSubjectToggle(subject._id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {subject.subjectCode}
                    </div>
                    <div className="text-sm text-gray-600">{subject.name}</div>
                    <div className="text-xs text-gray-500">
                      Year {subject.year}, Sem {subject.semester}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        {formData.subjects?.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            Selected: {formData.subjects.length} subject
            {formData.subjects.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <Button type="submit" disabled={loading}>
          {faculty ? "Update" : "Add"} Faculty
        </Button>
      </div>
    </form>
  );
};
