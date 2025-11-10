import { useState, useEffect, useRef, Fragment, useMemo } from "react";
import { Button } from "../Common/Button";
import { Select } from "../Common/Select";
import { MultiSelect } from "../Common/MultiSelect";
import api from "../../utils/api";
import { handleApiError } from "../../utils/helpers";
import { toast } from "react-toastify";

const YEARS = [1, 2, 3, 4];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]; // Fixed syntax
const SECTIONS = ["A", "B"];
const BATCHES = ["B1", "B2", "B3"]; // Added B3
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const TimetableForm = ({ onSave, onCancel }) => {
  const formRef = useRef(null);

  // --- Data for Dropdowns ---
  const [faculties, setFaculties] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  // --- Step 1 Form Data ---
  const [bulkFormData, setBulkFormData] = useState({
    year: "",
    semester: "",
    section: "",
    selectedDays: [],
    selectedBreaks: [],
  });

  // --- Step 2 Form Data (New Structure) ---
  const [subjectSchedules, setSubjectSchedules] = useState({});

  // --- Global State ---
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);

  // --- Conflict Detection State ---
  const [facultyBookings, setFacultyBookings] = useState(new Map());
  const [classroomBookings, setClassroomBookings] = useState(new Map());
  const [studentBookings, setStudentBookings] = useState(new Map());

  useEffect(() => {
    loadFormData();
  }, []);

  // Loads all existing bookings for conflict checking
  const loadFormData = async () => {
    setLoading(true);
    try {
      const cacheBustParams = { params: { _: new Date().getTime() } };
      const [facRes, subRes, clsRes, timeRes, ttRes] = await Promise.all([
        api.get("/faculty", cacheBustParams),
        api.get("/subjects", cacheBustParams),
        api.get("/classrooms", cacheBustParams),
        api.get("/timeslots", cacheBustParams),
        api.get("/timetable", cacheBustParams),
      ]);

      const facultyData = facRes.data?.data || facRes.data?.faculty || [];
      const subjectData = subRes.data?.data || subRes.data?.subjects || [];
      const classroomData = clsRes.data?.data || clsRes.data?.classrooms || [];
      const timeSlotData = timeRes.data?.data || timeRes.data?.timeSlots || [];
      const timetableData = ttRes.data?.data || ttRes.data?.timetables || [];

      setFaculties(facultyData);
      setSubjects(subjectData);
      setClassrooms(classroomData);
      setTimeSlots(timeSlotData);

      const facMap = new Map();
      const clsMap = new Map();
      const studentMap = new Map();

      timetableData.forEach((tt) => {
        if (!tt || !tt.schedule) return;
        tt.schedule.forEach((entry) => {
          const facId = entry.facultyID?._id || entry.facultyID;
          const clsId = entry.classroomID?._id || entry.classroomID;
          const slotId = entry.timeslotID?._id || entry.timeslotID;
          const batch = entry.batchGroup || "Full";
          const section = tt.section || "A";

          if (facId && slotId) {
            facMap.set(facId + "-" + slotId, {
              year: tt.year,
              subject: entry.subjectCode?.subjectCode || "N/A",
            });
          }
          if (clsId && slotId) {
            clsMap.set(clsId + "-" + slotId, {
              year: tt.year,
              subject: entry.subjectCode?.subjectCode || "N/A",
            });
          }
          if (slotId) {
            const studentKey = `${tt.year}-${tt.semester}-${section}-${slotId}`;
            if (!studentMap.has(studentKey)) studentMap.set(studentKey, []);
            studentMap.get(studentKey).push(batch);
          }
        });
      });

      setFacultyBookings(facMap);
      setClassroomBookings(clsMap);
      setStudentBookings(studentMap);

      console.log("Loaded bookings:", {
        faculty: facMap.size,
        classroom: clsMap.size,
        student: studentMap.size,
      });
    } catch (error) {
      toast.error("Failed to load form data");
      console.error("Load data error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX 2: Memoize filteredSubjects to prevent re-creation on every render
  const filteredSubjects = useMemo(() => {
    return subjects.filter(
      (s) =>
        s.year === parseInt(bulkFormData.year) &&
        s.semester === parseInt(bulkFormData.semester)
    );
  }, [subjects, bulkFormData.year, bulkFormData.semester]);

  // This useEffect builds the required entries for each subject
  useEffect(() => {
    if (step === 2 && filteredSubjects.length > 0) {
      setSubjectSchedules((prev) => {
        const newSchedules = { ...prev };

        filteredSubjects.forEach((subject) => {
          if (newSchedules[subject._id]) return;

          const newEntries = [];
          const types = Array.isArray(subject.type)
            ? subject.type
            : [subject.type];

          const lectureHours = (subject.lectureCredits || 0) * 1;
          const tutorialHours = (subject.tutorialCredits || 0) * 1;
          const practicalHours = (subject.practicalCredits || 0) * 2;

          if (types.includes("L") && lectureHours > 0) {
            newEntries.push({
              id: "L",
              entryType: "Lecture",
              batch: "Full",
              faculty: "",
              classroom: "",
              days: [],
              timeSlots: [],
              requiredHours: lectureHours,
            });
          }
          if (types.includes("T") && tutorialHours > 0) {
            newEntries.push({
              id: "T",
              entryType: "Tutorial",
              batch: "Full",
              faculty: "",
              classroom: "",
              days: [],
              timeSlots: [],
              requiredHours: tutorialHours,
            });
          }
          if (types.includes("P") && practicalHours > 0) {
            BATCHES.forEach((batch) => {
              newEntries.push({
                id: `P-${batch}`,
                entryType: "Practical",
                batch: batch,
                faculty: "",
                classroom: "",
                days: [],
                timeSlots: [],
                requiredHours: practicalHours,
              });
            });
          }
          newSchedules[subject._id] = { entries: newEntries };
        });
        return newSchedules;
      });
    }
    // ✅ FIX 3: Removed `subjects` from dependency array
  }, [step, filteredSubjects]);

  const handleStep1Change = (e) => {
    const { name, value } = e.target;
    setBulkFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "year" || name === "semester" || name === "section") {
      setSubjectSchedules({});
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleStep1MultiChange = (e) => {
    const { name, value } = e.target;
    setBulkFormData((prev) => ({
      ...prev,
      [name]: Array.isArray(value) ? value : [value],
    }));
  };

  const handleEntryChange = (subjectId, entryId, field, value) => {
    setSubjectSchedules((prev) => {
      const subject = prev[subjectId];
      if (!subject) return prev;

      const updatedEntries = subject.entries.map((entry) => {
        if (entry.id === entryId) {
          let newValues = { ...entry, [field]: value };
          if (field === "timeSlots") {
            newValues.timeSlots = value;
          }
          if (
            field === "faculty" ||
            field === "classroom" ||
            field === "days"
          ) {
            newValues.timeSlots = [];
          }
          return newValues;
        }
        return entry;
      });
      const errorKey = `${subjectId}-${entryId}`;
      if (errors[errorKey]) {
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
      return {
        ...prev,
        [subjectId]: {
          ...subject,
          entries: updatedEntries,
        },
      };
    });
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!bulkFormData.year) newErrors.year = "Select year";
    if (!bulkFormData.semester) newErrors.semester = "Select semester";
    if (!bulkFormData.section) newErrors.section = "Select section";
    if (bulkFormData.selectedDays.length === 0)
      newErrors.selectedDays = "Select at least one day";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAllSubjects = () => {
    const newErrors = {};
    filteredSubjects.forEach((subject) => {
      const schedule = subjectSchedules[subject._id];
      if (!schedule || !schedule.entries) return;

      schedule.entries.forEach((entry) => {
        const subErrors = [];
        if (!entry.faculty) subErrors.push("Faculty required");
        if (!entry.classroom) subErrors.push("Classroom required");
        const entryDays =
          entry.days.length > 0 ? entry.days : bulkFormData.selectedDays;
        if (entryDays.length === 0) subErrors.push("Select at least one day");
        if (entry.timeSlots.length !== entry.requiredHours) {
          subErrors.push(
            `Select exactly ${entry.requiredHours} slots (${entry.requiredHours} hours)`
          );
        }
        entry.timeSlots.forEach((slotId) => {
          if (
            entry.faculty &&
            facultyBookings.has(entry.faculty + "-" + slotId)
          ) {
            subErrors.push(`Faculty conflict on slot ${slotId}`);
          }
          if (
            entry.classroom &&
            classroomBookings.has(entry.classroom + "-" + slotId)
          ) {
            subErrors.push(`Classroom conflict on slot ${slotId}`);
          }
          const studentKey = `${bulkFormData.year}-${bulkFormData.semester}-${bulkFormData.section}-${slotId}`;
          const existingBatches = studentBookings.get(studentKey) || [];
          if (existingBatches.length > 0) {
            if (entry.batch === "Full")
              subErrors.push(
                `Batch conflict: 'Full' clashes with ${existingBatches.join()}`
              );
            if (existingBatches.includes("Full"))
              subErrors.push(
                `Batch conflict: '${entry.batch}' clashes with 'Full'`
              );
            if (existingBatches.includes(entry.batch))
              subErrors.push(
                `Batch conflict: '${entry.batch}' is already booked`
              );
          }
        });
        if (subErrors.length > 0) {
          newErrors[`${subject._id}-${entry.id}`] = subErrors.join(", ");
        }
      });
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToStep2 = () => {
    if (validateStep1()) {
      setStep(2);
      setErrors({});
    }
  };

  //
  // 🌟 ===== THIS IS THE UPDATED FUNCTION ===== 🌟
  //
  const handleSubmitAll = async () => {
    if (!validateAllSubjects()) {
      toast.error("Please fix all errors before submitting");
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        const errorEl = document.getElementById(`entry-${firstErrorKey}`);
        errorEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setLoading(true);
    let currentEntry = null; // ✅ 1. Add a variable to track the current entry
    try {
      const allEntries = [];
      filteredSubjects.forEach((subject) => {
        const schedule = subjectSchedules[subject._id];
        schedule.entries.forEach((entry) => {
          allEntries.push({
            year: parseInt(bulkFormData.year),
            semester: parseInt(bulkFormData.semester),
            section: bulkFormData.section,
            subject: subject._id,
            subjectType:
              entry.entryType === "Lecture"
                ? "L"
                : entry.entryType === "Practical"
                  ? "P"
                  : "T",
            faculty: entry.faculty,
            classroom: entry.classroom,
            batch: entry.batch,
            days:
              entry.days.length > 0 ? entry.days : bulkFormData.selectedDays,
            timeSlots: entry.timeSlots,
            breakSlots: bulkFormData.selectedBreaks,
          });
        });
      });

      console.log(`Creating ${allEntries.length} entries...`);

      for (const entry of allEntries) {
        currentEntry = entry; // ✅ 2. Update the tracker *before* each request
        await api.post("/timetable/create", entry);
      }

      toast.success(
        `Successfully created ${allEntries.length} timetable entries!`
      );

      // Reload all booking data
      loadFormData();
      // Reset form
      setStep(1);
      setBulkFormData((prev) => ({
        ...prev,
        year: "",
        semester: "",
        section: "",
        selectedDays: [],
        selectedBreaks: [],
      }));
      setSubjectSchedules({});

      onSave();
    } catch (error) {
      console.error("Error:", error);

      // ✅ 3. This is the enhanced error logging block
      let toastMessage = handleApiError(error) || "Failed to create entries";

      // Check if it's the conflict error and we know which entry failed
      if (error.response?.status === 409 && currentEntry) {
        // 4. Log the exact conflicting entry to the console!
        console.error("❌ CONFLICT OCCURRED ON THIS ENTRY:", currentEntry);
        console.error("❌ SERVER RESPONSE:", error.response?.data);

        // 5. Create a much more helpful toast message
        const subject = filteredSubjects.find(
          (s) => s._id === currentEntry.subject
        );
        const subjectName = subject
          ? `${subject.subjectCode} - ${subject.name}`
          : "Unknown Subject";

        // Use the specific message from your server if it sends one
        if (error.response?.data?.message) {
          toastMessage = error.response.data.message;
        } else {
          // Otherwise, create a detailed fallback message
          toastMessage = `Conflict on ${subjectName} (${currentEntry.batch}). Check faculty/room/batch booking.`;
        }
      }

      toast.error(toastMessage); // 6. Show the specific error to the user
    } finally {
      setLoading(false);
    }
  };
  //
  // 🌟 ===== END OF UPDATED FUNCTION ===== 🌟
  //

  const getClassroomsForType = (entryType) => {
    if (entryType === "Practical") {
      return classrooms.filter((c) => c.type === "lab");
    }
    return classrooms.filter(
      (c) => c.type === "theory" || c.type === "seminar"
    );
  };

  const getFormSelectedSlots = (currentSubjectId, currentEntryId) => {
    const allSelected = new Set();
    Object.keys(subjectSchedules).forEach((subjectId) => {
      const schedule = subjectSchedules[subjectId];
      if (!schedule.entries) return;
      schedule.entries.forEach((entry) => {
        if (subjectId === currentSubjectId && entry.id === currentEntryId) {
          return;
        }
        if (entry.timeSlots && Array.isArray(entry.timeSlots)) {
          entry.timeSlots.forEach((slotId) => {
            allSelected.add(slotId);
          });
        }
      });
    });
    return allSelected;
  };

  const getAvailableTimeSlots = (subjectId, entryId, entry) => {
    const { days, faculty, classroom, batch } = entry;
    const entryDays = days.length > 0 ? days : bulkFormData.selectedDays;
    const formSelectedSlots = getFormSelectedSlots(subjectId, entryId);

    return timeSlots
      .filter((slot) => {
        const dayMatch = entryDays.includes(slot.day);
        if (!dayMatch) return false;

        const notFormSelected = !formSelectedSlots.has(slot._id);

        const noFacultyConflict = !facultyBookings.has(
          faculty + "-" + slot._id
        );
        const noClassroomConflict = !classroomBookings.has(
          classroom + "-" + slot._id
        );

        const studentKey = `${bulkFormData.year}-${bulkFormData.semester}-${bulkFormData.section}-${slot._id}`;
        const existingBatches = studentBookings.get(studentKey) || [];

        let noBatchConflict = true;
        if (existingBatches.length > 0) {
          if (batch === "Full") noBatchConflict = false;
          if (existingBatches.includes("Full")) noBatchConflict = false;
          if (existingBatches.includes(batch)) noBatchConflict = false;
        }

        return (
          notFormSelected &&
          noFacultyConflict &&
          noClassroomConflict &&
          noBatchConflict
        );
      })
      .sort((a, b) => {
        const dayOrder = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
        if (dayOrder !== 0) return dayOrder;
        return a.periodNumber - b.periodNumber;
      });
  };

  const getBookedSlotsForDays = (subjectId, entryId, entry) => {
    const { days, faculty, classroom, batch } = entry;
    const entryDays = days.length > 0 ? days : bulkFormData.selectedDays;
    const formSelectedSlots = getFormSelectedSlots(subjectId, entryId);
    const conflictedSlots = new Set(formSelectedSlots);

    timeSlots.forEach((slot) => {
      if (!entryDays.includes(slot.day)) return;

      if (faculty && facultyBookings.has(faculty + "-" + slot._id)) {
        conflictedSlots.add(slot._id);
      }
      if (classroom && classroomBookings.has(classroom + "-" + slot._id)) {
        conflictedSlots.add(slot._id);
      }

      const studentKey = `${bulkFormData.year}-${bulkFormData.semester}-${bulkFormData.section}-${slot._id}`;
      const existingBatches = studentBookings.get(studentKey) || [];

      if (existingBatches.length > 0) {
        if (
          batch === "Full" ||
          existingBatches.includes("Full") ||
          existingBatches.includes(batch)
        ) {
          conflictedSlots.add(slot._id);
        }
      }
    });

    return Array.from(conflictedSlots);
  };

  const getBreakSlotOptions = () => {
    const formSelectedSlots = getFormSelectedSlots();
    const studentKeyPrefix = `${bulkFormData.year}-${bulkFormData.semester}-${bulkFormData.section}-`;
    const localBookedSlots = new Set();
    studentBookings.forEach((batches, key) => {
      if (key.startsWith(studentKeyPrefix)) {
        const slotId = key.substring(studentKeyPrefix.length);
        localBookedSlots.add(slotId);
      }
    });

    return timeSlots
      .filter((t) => {
        const dayMatch = bulkFormData.selectedDays.includes(t.day);
        if (!dayMatch) return false;
        const notFormSelected = !formSelectedSlots.has(t._id);
        const notLocallyBooked = !localBookedSlots.has(t._id);
        return notFormSelected && notLocallyBooked;
      })
      .sort((a, b) => {
        const dayOrder = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
        if (dayOrder !== 0) return dayOrder;
        return a.periodNumber - b.periodNumber;
      })
      .map((t) => ({
        label:
          t.day + " P" + t.periodNumber + ": " + t.startTime + "-" + t.endTime,
        value: t._id,
      }));
  };

  const getBreakConflictSlots = () => {
    const formSelectedSlots = getFormSelectedSlots();
    const conflicts = new Set(formSelectedSlots);
    const studentKeyPrefix = `${bulkFormData.year}-${bulkFormData.semester}-${bulkFormData.section}-`;
    studentBookings.forEach((batches, key) => {
      if (key.startsWith(studentKeyPrefix)) {
        const slotId = key.substring(studentKeyPrefix.length);
        conflicts.add(slotId);
      }
    });
    return Array.from(conflicts);
  };

  const getFacultiesForSubject = (subjectId) => {
    return faculties.filter((f) =>
      f.subjects?.some((s) => (typeof s === "object" ? s._id : s) === subjectId)
    );
  };

  const yearOptions = YEARS.map((y) => ({ label: "Year " + y, value: y }));
  const semesterOptions = SEMESTERS.map((s) => ({
    label: "Semester " + s,
    value: s,
  }));
  const sectionOptions = SECTIONS.map((s) => ({
    label: "Section " + s,
    value: s,
  }));
  const dayOptions = DAYS.map((d) => ({ label: d, value: d }));

  if (loading && subjects.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading form data...</p>
      </div>
    );
  }

  return (
    <div ref={formRef} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-2">Bulk Timetable Scheduler</h2>
      <p className="text-gray-600 mb-6">
        Schedule all components for a semester at once.
      </p>

      {/* --- STEP 1 --- */}
      {step === 1 && (
        <form className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-4">
              Step 1: Select Year, Semester, Section & Days
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Year *"
                name="year"
                value={bulkFormData.year}
                onChange={handleStep1Change}
                options={yearOptions}
                required
              />
              <Select
                label="Semester *"
                name="semester"
                value={bulkFormData.semester}
                onChange={handleStep1Change}
                options={semesterOptions}
                required
              />
              <Select
                label="Section *"
                name="section"
                value={bulkFormData.section}
                onChange={handleStep1Change}
                options={sectionOptions}
                required
              />
              <MultiSelect
                label="Working Days *"
                name="selectedDays"
                value={bulkFormData.selectedDays}
                onChange={handleStep1MultiChange}
                options={dayOptions}
                required
              />
            </div>

            {(errors.year ||
              errors.semester ||
              errors.section ||
              errors.selectedDays) && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
                {errors.year && (
                  <p className="text-red-700 text-sm">{errors.year}</p>
                )}
                {errors.semester && (
                  <p className="text-red-700 text-sm">{errors.semester}</p>
                )}
                {errors.section && (
                  <p className="text-red-700 text-sm">{errors.section}</p>
                )}
                {errors.selectedDays && (
                  <p className="text-red-700 text-sm">{errors.selectedDays}</p>
                )}
              </div>
            )}

            {bulkFormData.year && bulkFormData.semester && (
              <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
                <p className="text-green-700 font-semibold">
                  Found {filteredSubjects.length} subjects for this selection.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-4 mt-6">
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleProceedToStep2}
                disabled={
                  !bulkFormData.year ||
                  !bulkFormData.semester ||
                  !bulkFormData.section
                }
              >
                Continue to Schedule Subjects
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* --- STEP 2 --- */}
      {step === 2 && (
        <form className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800">
              Step 2: Schedule {filteredSubjects.length} Subjects for Y
              {bulkFormData.year}-S{bulkFormData.semester} (Section{" "}
              {bulkFormData.section})
            </h3>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
          </div>

          {filteredSubjects.map((subject, idx) => {
            const schedule = subjectSchedules[subject._id];
            if (!schedule || !schedule.entries) return null;

            return (
              <div
                key={subject._id}
                className="p-4 rounded-lg bg-gray-50 border border-gray-200"
              >
                <h4 className="font-bold text-lg text-blue-700 mb-4">
                  {idx + 1}. {subject.subjectCode} - {subject.name}
                </h4>

                <div className="space-y-4">
                  {schedule.entries.map((entry, entryIdx) => {
                    const subjectFaculties = getFacultiesForSubject(
                      subject._id
                    );
                    const availableClassrooms = getClassroomsForType(
                      entry.entryType
                    );

                    const availableTimeSlots = getAvailableTimeSlots(
                      subject._id,
                      entry.id,
                      entry
                    );

                    const slotOptions = availableTimeSlots.map((t) => ({
                      label: `${t.day} P${t.periodNumber}: ${t.startTime}-${t.endTime}`,
                      value: t._id,
                    }));

                    const valueForSelect = entry.timeSlots;
                    const label = `Time Slots (Select ${entry.requiredHours} slot(s))`;

                    const bookedSlotsForDays = getBookedSlotsForDays(
                      subject._id,
                      entry.id,
                      entry
                    );

                    const errorKey = `${subject._id}-${entry.id}`;
                    const entryError = errors[errorKey];

                    return (
                      <Fragment key={entry.id}>
                        {entryIdx > 0 && <hr className="border-gray-300" />}
                        <div
                          id={`entry-${errorKey}`}
                          className={`p-3 rounded-lg border-l-4 ${entryError ? "bg-red-50 border-red-500" : "bg-white border-blue-500"}`}
                        >
                          <h5 className="font-semibold text-gray-800">
                            {entry.entryType}{" "}
                            <span className="text-purple-600">
                              ({entry.batch})
                            </span>
                          </h5>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <Select
                              label="Faculty"
                              name={`faculty_${entry.id}`}
                              value={entry.faculty}
                              onChange={(e) =>
                                handleEntryChange(
                                  subject._id,
                                  entry.id,
                                  "faculty",
                                  e.target.value
                                )
                              }
                              options={subjectFaculties.map((f) => ({
                                label: f.name + " (" + f.facultyID + ")",
                                value: f._id,
                              }))}
                            />
                            <Select
                              label="Classroom / Lab"
                              name={`classroom_${entry.id}`}
                              value={entry.classroom}
                              onChange={(e) =>
                                handleEntryChange(
                                  subject._id,
                                  entry.id,
                                  "classroom",
                                  e.target.value
                                )
                              }
                              options={availableClassrooms.map((c) => ({
                                label: c.roomNumber + " (" + c.type + ")",
                                value: c._id,
                              }))}
                            />
                            <MultiSelect
                              label="Days (override)"
                              name={`days_${entry.id}`}
                              value={entry.days}
                              onChange={(e) =>
                                handleEntryChange(
                                  subject._id,
                                  entry.id,
                                  "days",
                                  e.target.value
                                )
                              }
                              options={bulkFormData.selectedDays.map((d) => ({
                                label: d,
                                value: d,
                              }))}
                              placeholder="Default (all selected days)"
                            />
                            <MultiSelect
                              label={label}
                              name={`timeSlots_${entry.id}`}
                              value={valueForSelect}
                              onChange={(e) =>
                                handleEntryChange(
                                  subject._id,
                                  entry.id,
                                  "timeSlots",
                                  e.target.value
                                )
                              }
                              options={slotOptions}
                              highlightConflict={true}
                              conflictSlots={bookedSlotsForDays}
                            />
                          </div>

                          <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
                            <span className="font-semibold">
                              Selected: {entry.timeSlots.length} /{" "}
                              {entry.requiredHours} slots
                            </span>
                            {entry.timeSlots.length === entry.requiredHours && (
                              <span className="ml-2 text-green-600">✅</span>
                            )}
                            {entry.timeSlots.length < entry.requiredHours && (
                              <span className="ml-2 text-orange-600">
                                Need{" "}
                                {entry.requiredHours - entry.timeSlots.length}{" "}
                                more
                              </span>
                            )}
                            {entry.timeSlots.length > entry.requiredHours && (
                              <span className="ml-2 text-red-600">
                                Too many
                              </span>
                            )}
                          </div>

                          {entryError && (
                            <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                              {/* ✅ FIX: Corrected closing tag */}
                              <p className="text-red-700 text-sm">
                                {entryError}
                              </p>
                            </div>
                          )}
                        </div>
                      </Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* --- Break Section --- */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-4">
              Break Times (Optional)
            </h3>
            {/* ✅ FIX: Corrected closing tag */}
            <p className="text-sm text-gray-600 mb-3">
              Select time slots to mark as breaks for this entire selection.
            </p>
            <MultiSelect
              label="Mark as Breaks"
              name="selectedBreaks"
              value={bulkFormData.selectedBreaks}
              onChange={handleStep1MultiChange}
              options={getBreakSlotOptions()}
              placeholder="Select breaks..."
              highlightConflict={true}
              conflictSlots={getBreakConflictSlots()}
            />
          </div>

          {/* --- Submit Buttons --- */}
          <div className="flex justify-end gap-4 mt-6 sticky bottom-0 bg-white p-4 rounded border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button type="button" onClick={handleSubmitAll} disabled={loading}>
              {loading ? "Creating..." : `Create All Entries`}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
