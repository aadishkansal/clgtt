import { useEffect, useState } from "react";
import { Select } from "../Common/Select";
import api from "../../utils/api";
import { handleApiError } from "../../utils/helpers";

export const ClassroomSelect = ({ subjectType, value, onChange, disabled }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadClassrooms = async () => {
      try {
        setLoading(true);
        const response = await api.get("/classrooms");
        let allClassrooms = response.data.data || [];

        // Filter classrooms based on subject type
        if (subjectType === "P") {
          // Practical subjects need lab classrooms
          allClassrooms = allClassrooms.filter((c) => c.type === "lab");
        } else {
          // Lecture and Tutorial can use theory or seminar rooms
          allClassrooms = allClassrooms.filter(
            (c) => c.type === "theory" || c.type === "seminar"
          );
        }

        setClassrooms(allClassrooms);
      } catch (error) {
        console.error("Failed to load classrooms:", handleApiError(error));
        setClassrooms([]);
      } finally {
        setLoading(false);
      }
    };

    loadClassrooms();
  }, [subjectType]);

  const options = classrooms.map((classroom) => ({
    label: `${classroom.roomNumber} - ${classroom.block} (Capacity: ${classroom.capacity})`,
    value: classroom._id,
  }));

  return (
    <Select
      label="Classroom"
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled || loading}
      placeholder={loading ? "Loading classrooms..." : "Select a classroom"}
      required
    />
  );
};
