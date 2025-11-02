import { useState, useEffect } from "react";
import { Input } from "../Common/Input";
import { Select } from "../Common/Select";
import { Button } from "../Common/Button";



import { CLASSROOM_TYPES } from "../../utils/constants";
import api from "../../utils/api";
import { handleApiError } from "../../utils/helpers";
import { toast } from "react-toastify";

export const ClassroomForm = ({ classroom = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    roomNumber: "",
    block: "",
    capacity: "",
    type: "theory",
    facilities: [],
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (classroom) {
      setFormData(classroom);
    }
  }, [classroom]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (classroom) {
        await api.put(`/classrooms/${classroom._id}`, formData);
        toast.success("Classroom updated successfully");
      } else {
        await api.post("/classrooms", formData);
        toast.success("Classroom created successfully");
      }
      onSuccess();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">
        {classroom ? "Edit Classroom" : "Add Classroom"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Room Number"
          name="roomNumber"
          value={formData.roomNumber}
          onChange={handleChange}
          placeholder="e.g., E-105"
          required
          disabled={!!classroom}
        />

        <Input
          label="Block"
          name="block"
          value={formData.block}
          onChange={handleChange}
          placeholder="e.g., E"
          required
        />

        <Input
          label="Capacity"
          type="number"
          name="capacity"
          value={formData.capacity}
          onChange={handleChange}
          min="1"
          required
        />

        <Select
          label="Type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          options={CLASSROOM_TYPES.map((t) => ({
            label: t.charAt(0).toUpperCase() + t.slice(1),
            value: t,
          }))}
        />
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <Button type="submit" disabled={loading}>
          {classroom ? "Update" : "Add"} Classroom
        </Button>
      </div>
    </form>
  );
};
