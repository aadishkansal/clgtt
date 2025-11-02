import { useEffect, useState } from "react";
import { Select } from "../Common/Select";
import api from "../../utils/api";
import { handleApiError } from "../../utils/helpers";

export const FacultySelect = ({ subjectId, value, onChange, disabled }) => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFaculty = async () => {
      if (!subjectId) {
        setFaculties([]);
        return;
      }

      try {
        setLoading(true);
        // Get all faculty and filter by subject
        const response = await api.get("/faculty");
        const allFaculty = response.data.data || [];

        // Filter faculty who teach this subject
        const filteredFaculty = allFaculty.filter((faculty) =>
          faculty.subjects?.some((subject) => subject._id === subjectId)
        );

        setFaculties(filteredFaculty);
      } catch (error) {
        console.error("Failed to load faculty:", handleApiError(error));
        setFaculties([]);
      } finally {
        setLoading(false);
      }
    };

    loadFaculty();
  }, [subjectId]);

  const options = faculties.map((faculty) => ({
    label: `${faculty.name} (${faculty.facultyID})`,
    value: faculty._id,
  }));

  return (
    <Select
      label="Faculty"
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled || loading || !subjectId}
      placeholder={
        loading
          ? "Loading faculty..."
          : faculties.length === 0
            ? "No faculty available for this subject"
            : "Select a faculty"
      }
      required
    />
  );
};
