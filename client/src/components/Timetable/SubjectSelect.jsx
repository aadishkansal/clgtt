import { useEffect, useState } from "react";
import { Select } from "../Common/Select";
import api from "../../utils/api";
import { handleApiError } from "../../utils/helpers";

export const SubjectSelect = ({
  year,
  semester,
  value,
  onChange,
  disabled,
}) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSubjects() {
      if (!year || !semester) return;
      setLoading(true);
      try {
        const response = await api.get("/subjects", {
          params: { year, semester },
        });
        setSubjects(response.data.data || []);
      } catch (error) {
        console.error("Failed to load subjects:", handleApiError(error));
      } finally {
        setLoading(false);
      }
    }
    loadSubjects();
  }, [year, semester]);

  const options = subjects.map((subject) => ({
    label: `${subject.subjectCode} - ${subject.name} (${subject.type})`,
    value: subject._id,
  }));

  return (
    <Select
      label="Subject"
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled || loading || !year || !semester}
      placeholder={loading ? "Loading subjects..." : "Select a subject"}
      required
    />
  );
};
