import { useState, useEffect } from "react";
import { Input } from "../Common/Input";
import { Select } from "../Common/Select";
import { MultiSelect } from "../Common/MultiSelect";
import { Button } from "../Common/Button";

import api from "../../utils/api";
import { handleApiError } from "../../utils/helpers";
import { toast } from "react-toastify";

const YEARS = [1, 2, 3, 4];
const SEMESTERS = [1, 2];
const SUBJECT_TYPES = [
  { label: "Lecture (L)", value: "L" },
  { label: "Tutorial (T)", value: "T" },
  { label: "Practical (P)", value: "P" },
];

const calculateCreditDistribution = (types, totalCredits) => {
  if (!types || types.length === 0) return {};

  const distribution = {};

  if (types.length === 1) {
    distribution[types[0]] = totalCredits;
  } else if (types.length === 2 && types.includes("L") && types.includes("P")) {
    distribution["L"] = Math.max(1, totalCredits - 1);
    distribution["P"] = 1;
  } else if (types.length === 2 && types.includes("L") && types.includes("T")) {
    distribution["L"] = Math.ceil(totalCredits * 0.8);
    distribution["T"] = totalCredits - distribution["L"];
  } else if (types.length === 2 && types.includes("T") && types.includes("P")) {
    distribution["T"] = Math.ceil(totalCredits / 2);
    distribution["P"] = totalCredits - distribution["T"];
  } else if (types.length === 3) {
    distribution["L"] = Math.ceil(totalCredits * 0.6);
    distribution["T"] = Math.ceil(totalCredits * 0.2);
    distribution["P"] = totalCredits - distribution["L"] - distribution["T"];
  }

  return distribution;
};

export const SubjectForm = ({ subject = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    subjectCode: "",
    name: "",
    year: "",
    semester: "",
    type: ["L"],
    creditHours: 3,
    department: "",
  });

  const [creditDistribution, setCreditDistribution] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (subject) {
      setFormData({
        ...subject,
        type: Array.isArray(subject.type) ? subject.type : [subject.type],
      });
      updateCreditDistribution(
        Array.isArray(subject.type) ? subject.type : [subject.type],
        subject.creditHours
      );
    }
  }, [subject]);

  const updateCreditDistribution = (types, credits) => {
    const distribution = calculateCreditDistribution(types, credits);
    setCreditDistribution(distribution);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "type") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      updateCreditDistribution(value, formData.creditHours);
    } else if (name === "creditHours") {
      const credits = parseInt(value) || 0;
      setFormData((prev) => ({ ...prev, [name]: credits }));
      updateCreditDistribution(formData.type, credits);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.type.length === 0) {
      setErrors((prev) => ({
        ...prev,
        type: "Please select at least one subject type",
      }));
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        year: parseInt(formData.year),
        semester: parseInt(formData.semester),
        creditHours: parseInt(formData.creditHours),
        creditDistribution,
      };

      console.log("ðŸ“¤ Submitting:", submitData);

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
        creditHours: 3,
        department: "",
      });
      setErrors({});
      onSuccess();
    } catch (error) {
      console.error("âŒ Error response:", error.response?.data);

      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }

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
            placeholder="e.g., CS101"
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
            placeholder="e.g., Data Structures"
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

        <div>
          <Input
            label="Total Credit Hours"
            type="number"
            name="creditHours"
            value={formData.creditHours}
            onChange={handleChange}
            min="1"
            max="10"
          />
          {errors.creditHours && (
            <p className="text-red-500 text-sm mt-1">{errors.creditHours}</p>
          )}
        </div>

        <div>
          <Input
            label="Department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
            placeholder="e.g., Computer Science"
          />
          {errors.department && (
            <p className="text-red-500 text-sm mt-1">{errors.department}</p>
          )}
        </div>
      </div>

      {formData.type.length > 0 &&
        Object.keys(creditDistribution).length > 0 && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-4">
              Credit Distribution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formData.type.map((type) => (
                <div
                  key={type}
                  className="bg-white p-3 rounded border border-blue-100"
                >
                  <div className="text-sm text-gray-600">
                    {SUBJECT_TYPES.find((t) => t.value === type)?.label}
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {creditDistribution[type] || 0}
                  </div>
                  <div className="text-xs text-gray-500">credits</div>
                </div>
              ))}
            </div>
          </div>
        )}

      <div className="flex justify-end gap-4 mt-8">
        <Button type="submit" disabled={loading}>
          {loading ? "Loading..." : subject ? "Update" : "Add"} Subject
        </Button>
      </div>
    </form>
  );
};
