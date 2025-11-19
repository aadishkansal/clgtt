import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../utils/api";
import { Button } from "../components/Common/Button";
import { Select } from "../components/Common/Select";
import { Loader } from "../components/Common/Loader";

export const EditTimetable = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const entryData = location.state?.entryData;

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Dropdown Data
  const [faculties, setFaculties] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const [formData, setFormData] = useState({
    subject: "",
    faculty: "",
    classroom: "",
    timeslot: "",
    batch: "Full",
    isRMC: false,
    entryIndex: null,
  });

  useEffect(() => {
    const init = async () => {
      if (!entryData) {
        toast.error("No entry data found.");
        navigate("/timetable");
        return;
      }

      try {
        // Fetch all lists in parallel
        const [facRes, clsRes, subRes, timeRes] = await Promise.all([
          api.get("/faculty"),
          api.get("/classrooms"),
          api.get("/subjects"),
          api.get("/timeslots"),
        ]);

        const facList = facRes.data?.data || facRes.data?.faculty || [];
        const clsList = clsRes.data?.data || clsRes.data?.classrooms || [];
        const subList = subRes.data?.data || subRes.data?.subjects || [];
        const timeList = timeRes.data?.data || timeRes.data?.timeSlots || [];

        setFaculties(facList);
        setClassrooms(clsList);
        setSubjects(subList);
        setTimeSlots(timeList);

        // Set Form Data AFTER fetching lists
        setFormData({
          subject: entryData.subjectCode?._id || entryData.subjectCode || "",
          faculty: entryData.facultyID?._id || entryData.facultyID || "",
          classroom: entryData.classroomID?._id || entryData.classroomID || "",
          timeslot: entryData.timeslotID?._id || entryData.timeslotID || "",
          batch: entryData.batchGroup || "Full",
          isRMC: entryData.isRMC || false,
          entryIndex: entryData.entryIndex,
        });
      } catch {
        // Removed unused 'error' variable
        toast.error("Failed to load form options");
      } finally {
        setIsLoadingData(false);
      }
    };

    init();
  }, [entryData, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        entryIndex: formData.entryIndex,
        subject: formData.subject,
        faculty: formData.faculty,
        classroom: formData.classroom,
        timeslotID: formData.timeslot,
        batch: formData.batch,
        isRMC: formData.isRMC,
      };

      await api.put(`/timetable/${id}`, payload);

      toast.success("Entry updated successfully!");
      navigate("/timetable");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (!entryData) return null;

  // Show Loading Screen until Data is Ready
  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader text="Loading Entry Details..." />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Edit Timetable Entry
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Subject */}
        <Select
          label="Subject *"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          options={subjects.map((s) => ({
            label: `${s.name} (${s.subjectCode})`,
            value: s._id,
          }))}
          required
        />

        {/* Faculty */}
        <Select
          label="Faculty *"
          name="faculty"
          value={formData.faculty}
          onChange={handleChange}
          options={faculties.map((f) => ({ label: f.name, value: f._id }))}
          required
        />

        {/* Classroom */}
        <Select
          label="Classroom *"
          name="classroom"
          value={formData.classroom}
          onChange={handleChange}
          options={classrooms.map((c) => ({
            label: `${c.roomNumber} (${c.type})`,
            value: c._id,
          }))}
          required
        />

        {/* Time Slot */}
        <Select
          label="Time Slot *"
          name="timeslot"
          value={formData.timeslot}
          onChange={handleChange}
          options={timeSlots.map((t) => ({
            label: `${t.day} (${t.startTime}-${t.endTime})`,
            value: t._id,
          }))}
          required
        />

        {/* Batch */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Batch
          </label>
          <select
            name="batch"
            value={formData.batch}
            onChange={handleChange}
            className="w-full p-2 border rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Full">Full Class</option>
            <option value="B1">Batch B1</option>
            <option value="B2">Batch B2</option>
          </select>
        </div>

        {/* RMC Checkbox */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
          <input
            type="checkbox"
            name="isRMC"
            id="isRMC"
            checked={formData.isRMC}
            onChange={handleChange}
            className="h-5 w-5 text-blue-600"
          />
          <label
            htmlFor="isRMC"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            Mark as Recorded/Makeup Class (RMC)
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={isSaving} className="flex-1">
            {isSaving ? "Updating..." : "Update Entry"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/timetable")}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
