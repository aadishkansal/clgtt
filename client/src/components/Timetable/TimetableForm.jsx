import { useState, useEffect, useRef } from "react";
import { Button } from "../Common/Button";
import { Select } from "../Common/Select";
import { MultiSelect } from "../Common/MultiSelect";
import api from "../../utils/api";
import { handleApiError } from "../../utils/helpers";
import { toast } from "react-toastify";

const YEARS = [1, 2, 3, 4];
const SEMESTERS = [1, 2];
const BATCHES = ["B1", "B2"];
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

  const [faculties, setFaculties] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const [bulkFormData, setBulkFormData] = useState({
    year: "",
    semester: "",
    selectedDays: [],
    selectedBreaks: [],
  });

  const [subjectSchedules, setSubjectSchedules] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);

  const [facultyBookings, setFacultyBookings] = useState(new Map());
  const [classroomBookings, setClassroomBookings] = useState(new Map());
  const [bookedSlots, setBookedSlots] = useState(new Set());

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    setLoading(true);

    let facultyData = [];
    try {
      const facultyRes = await api.get("/faculty");
      facultyData = facultyRes.data?.data || facultyRes.data?.faculty || [];
    } catch (error) {
      console.warn("Faculty API failed:", error);
      facultyData = [];
    }

    let subjectData = [];
    try {
      const subjectRes = await api.get("/subjects");
      subjectData = subjectRes.data?.data || subjectRes.data?.subjects || [];
    } catch (error) {
      console.warn("Subjects API failed:", error);
      subjectData = [];
    }

    let classroomData = [];
    try {
      const classroomRes = await api.get("/classrooms");
      classroomData =
        classroomRes.data?.data || classroomRes.data?.classrooms || [];
    } catch (error) {
      console.warn("Classrooms API failed:", error);
      classroomData = [];
    }

    let timeSlotData = [];
    try {
      const timeslotRes = await api.get("/timeslots");
      timeSlotData =
        timeslotRes.data?.data || timeslotRes.data?.timeSlots || [];
    } catch (error) {
      console.warn("Timeslots API failed:", error);
      timeSlotData = [];
    }

    let timetableData = [];
    try {
      const timetableRes = await api.get("/timetable");
      timetableData = timetableRes.data?.data || timetableRes.data || [];
    } catch (error) {
      console.warn("Timetable API failed:", error);
      timetableData = [];
    }

    setFaculties(facultyData);
    setSubjects(subjectData);
    setClassrooms(classroomData);
    setTimeSlots(timeSlotData);

    const facMap = new Map();
    const clsMap = new Map();
    const bookedSlotSet = new Set();

    timetableData.forEach((timetable) => {
      if (timetable && timetable.schedule) {
        timetable.schedule.forEach((entry) => {
          const facId = entry.facultyID?._id || entry.facultyID;
          const clsId = entry.classroomID?._id || entry.classroomID;
          const slotId = entry.timeslotID?._id || entry.timeslotID;
          const timeSlotKey = entry.timeSlot || slotId;

          if (timeSlotKey) {
            bookedSlotSet.add(timeSlotKey);
          }

          if (facId && slotId) {
            const key = facId + "-" + slotId;
            if (!facMap.has(key)) {
              facMap.set(key, {
                year: timetable.year,
                semester: timetable.semester,
                subject: entry.subjectCode?.subjectCode || "N/A",
              });
            }
          }

          if (clsId && slotId) {
            const key = clsId + "-" + slotId;
            if (!clsMap.has(key)) {
              clsMap.set(key, {
                year: timetable.year,
                semester: timetable.semester,
                subject: entry.subjectCode?.subjectCode || "N/A",
              });
            }
          }
        });
      }
    });

    setFacultyBookings(facMap);
    setClassroomBookings(clsMap);
    setBookedSlots(bookedSlotSet);

    console.log("Loaded ", {
      faculties: facultyData.length,
      subjects: subjectData.length,
      classrooms: classroomData.length,
      timeSlots: timeSlotData.length,
      timetables: timetableData.length,
      facultyBookings: facMap.size,
      classroomBookings: clsMap.size,
      bookedSlots: bookedSlotSet.size,
    });

    setLoading(false);
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.year === parseInt(bulkFormData.year) &&
      s.semester === parseInt(bulkFormData.semester)
  );

  useEffect(() => {
    if (filteredSubjects.length > 0) {
      setSubjectSchedules((prev) => {
        const schedules = { ...prev };

        filteredSubjects.forEach((subject) => {
          if (!schedules[subject._id]) {
            schedules[subject._id] = {
              faculty: "",
              classroom: "",
              batch: "",
              days: [],
              timeSlots: [],
              subjectType: Array.isArray(subject.type)
                ? subject.type.length === 1
                  ? subject.type[0]
                  : ""
                : subject.type,
            };
          }
        });

        return schedules;
      });
    }
  }, [filteredSubjects]);

  const calculateRequiredHours = (subject) => {
    if (!subject) return 0;
    const subType = subjectSchedules[subject._id]?.subjectType;
    if (subType === "P") {
      return subject.creditHours * 2;
    }
    return subject.creditHours;
  };

  const handleStep1Change = (e) => {
    const { name, value } = e.target;
    setBulkFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleStep1MultiChange = (e) => {
    const { name, value } = e.target;
    setBulkFormData((prev) => ({
      ...prev,
      [name]: Array.isArray(value) ? value : [value],
    }));
  };

  const handleSubjectScheduleChange = (subjectId, field, value) => {
    setSubjectSchedules((prev) => {
      const currentSchedule = prev[subjectId] || {
        faculty: "",
        classroom: "",
        batch: "",
        days: [],
        timeSlots: [],
        subjectType: "",
      };
      return {
        ...prev,
        [subjectId]: {
          ...currentSchedule,
          [field]: value,
        },
      };
    });
    if (errors[subjectId]) {
      setErrors((prev) => ({ ...prev, [subjectId]: "" }));
    }
  };

  const handleSubjectMultiSelect = (subjectId, field, value) => {
    setSubjectSchedules((prev) => {
      const currentSchedule = prev[subjectId] || {
        faculty: "",
        classroom: "",
        batch: "",
        days: [],
        timeSlots: [],
        subjectType: "",
      };
      return {
        ...prev,
        [subjectId]: {
          ...currentSchedule,
          [field]: Array.isArray(value) ? value : [value],
        },
      };
    });
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!bulkFormData.year) newErrors.year = "Select year";
    if (!bulkFormData.semester) newErrors.semester = "Select semester";
    if (bulkFormData.selectedDays.length === 0)
      newErrors.selectedDays = "Select at least one day";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAllSubjects = () => {
    const newErrors = {};

    filteredSubjects.forEach((subject) => {
      const schedule = subjectSchedules[subject._id];
      if (!schedule) return;

      const subErrors = [];

      if (!schedule.faculty) subErrors.push("Faculty required");
      if (!schedule.classroom) subErrors.push("Classroom required");

      if (schedule.subjectType === "P" && !schedule.batch) {
        subErrors.push("Batch required for Practical");
      }

      if (schedule.days.length === 0) {
        subErrors.push("Select at least one day");
      }

      const requiredHours = calculateRequiredHours(subject);
      if (schedule.timeSlots.length !== requiredHours) {
        subErrors.push(
          `Select exactly ${requiredHours} slots (${requiredHours} hours)`
        );
      }

      schedule.timeSlots.forEach((slotId) => {
        const facId = schedule.faculty;
        const clsId = schedule.classroom;

        if (facId && facultyBookings.has(facId + "-" + slotId)) {
          subErrors.push(
            `Faculty conflict: Slot booked in Year ${facultyBookings.get(facId + "-" + slotId).year}`
          );
        }
        if (clsId && classroomBookings.has(clsId + "-" + slotId)) {
          subErrors.push(
            `Classroom conflict: Slot booked in Year ${classroomBookings.get(clsId + "-" + slotId).year}`
          );
        }
      });

      if (subErrors.length > 0) {
        newErrors[subject._id] = subErrors.join(", ");
      }
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

  const handleSubmitAll = async () => {
    if (!validateAllSubjects()) {
      toast.error(
        "Please fix all errors (including cross-year conflicts) before submitting"
      );
      return;
    }

    setLoading(true);
    try {
      const entries = filteredSubjects.map((subject) => {
        const schedule = subjectSchedules[subject._id];
        return {
          year: parseInt(bulkFormData.year),
          semester: parseInt(bulkFormData.semester),
          subject: subject._id,
          subjectType: schedule.subjectType,
          faculty: schedule.faculty,
          classroom: schedule.classroom,
          batch: schedule.subjectType === "P" ? schedule.batch : "Full",
          days: schedule.days,
          timeSlots: schedule.timeSlots,
          breakSlots: bulkFormData.selectedBreaks,
        };
      });

      console.log(`Creating ${entries.length} entries...`);

      for (const entry of entries) {
        await api.post("/timetable/create", entry);
      }

      toast.success(
        `Successfully created ${entries.length} timetable entries!`
      );
      onSave();
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error.response?.data?.message ||
          handleApiError(error) ||
          "Failed to create entries"
      );
    } finally {
      setLoading(false);
    }
  };

  const getClassroomsForType = (subjectType) => {
    if (subjectType === "P") {
      return classrooms.filter((c) => c.type === "lab");
    }
    return classrooms.filter(
      (c) => c.type === "theory" || c.type === "seminar"
    );
  };

  const getAllSelectedSlotsInForm = () => {
    const allSelected = new Set();
    Object.values(subjectSchedules).forEach((schedule) => {
      if (schedule.timeSlots && Array.isArray(schedule.timeSlots)) {
        schedule.timeSlots.forEach((slotId) => {
          allSelected.add(slotId);
        });
      }
    });
    return allSelected;
  };

  const getTimeSlotsForDays = (days, facultyId = null, classroomId = null) => {
    const formSelectedSlots = getAllSelectedSlotsInForm();

    return timeSlots
      .filter((slot) => {
        const dayMatch = days.includes(slot.day);
        const notBookedGlobally = !bookedSlots.has(slot._id);
        const notFormSelected = !formSelectedSlots.has(slot._id);

        let noFacultyConflict = true;
        if (facultyId && facultyBookings.has(facultyId + "-" + slot._id)) {
          noFacultyConflict = false;
        }

        let noClassroomConflict = true;
        if (
          classroomId &&
          classroomBookings.has(classroomId + "-" + slot._id)
        ) {
          noClassroomConflict = false;
        }

        return (
          dayMatch &&
          notBookedGlobally &&
          notFormSelected &&
          noFacultyConflict &&
          noClassroomConflict
        );
      })
      .sort((a, b) => {
        const dayOrder = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
        if (dayOrder !== 0) return dayOrder;
        return a.periodNumber - b.periodNumber;
      });
  };

  const getBookedSlotsForDays = (
    days,
    facultyId = null,
    classroomId = null
  ) => {
    const formSelectedSlots = getAllSelectedSlotsInForm();
    const conflictedSlots = new Set(formSelectedSlots);

    timeSlots.forEach((slot) => {
      if (days.includes(slot.day)) {
        if (bookedSlots.has(slot._id)) conflictedSlots.add(slot._id);

        if (facultyId && facultyBookings.has(facultyId + "-" + slot._id)) {
          conflictedSlots.add(slot._id);
        }

        if (
          classroomId &&
          classroomBookings.has(classroomId + "-" + slot._id)
        ) {
          conflictedSlots.add(slot._id);
        }
      }
    });

    return Array.from(conflictedSlots);
  };

  const getBreakSlotOptions = () => {
    const formSelectedSlots = getAllSelectedSlotsInForm();
    // const usedBreakSlots = new Set(bulkFormData.selectedBreaks);

    return timeSlots
      .filter((t) => {
        const dayMatch = bulkFormData.selectedDays.includes(t.day);
        const notFormSelected = !formSelectedSlots.has(t._id);
        const notFacultyBooked = !Array.from(facultyBookings.keys()).some(
          (key) => key.endsWith("-" + t._id)
        );
        const notClassroomBooked = !Array.from(classroomBookings.keys()).some(
          (key) => key.endsWith("-" + t._id)
        );
        return (
          dayMatch && notFormSelected && notFacultyBooked && notClassroomBooked
        );
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
    const formSelectedSlots = getAllSelectedSlotsInForm();
    const conflicts = new Set(formSelectedSlots);

    timeSlots.forEach((slot) => {
      if (bulkFormData.selectedDays.includes(slot.day)) {
        if (bookedSlots.has(slot._id)) conflicts.add(slot._id);
        if (
          Array.from(facultyBookings.keys()).some((key) =>
            key.endsWith("-" + slot._id)
          )
        )
          conflicts.add(slot._id);
        if (
          Array.from(classroomBookings.keys()).some((key) =>
            key.endsWith("-" + slot._id)
          )
        )
          conflicts.add(slot._id);
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
  const dayOptions = DAYS.map((d) => ({ label: d, value: d }));
  const batchOptions = BATCHES.map((b) => ({ label: "Batch " + b, value: b }));

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
        Schedule all subjects for a semester at once (cross-year conflicts
        prevented)
      </p>

      {step === 1 && (
        <form className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-4">
              Step 1: Select Year, Semester & Days
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
                <MultiSelect
                  label="Days *"
                  name="selectedDays"
                  value={bulkFormData.selectedDays}
                  onChange={handleStep1MultiChange}
                  options={dayOptions}
                  required
                />
              </div>
            </div>

            {(errors.year || errors.semester || errors.selectedDays) && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
                {errors.year && (
                  <p className="text-red-700 text-sm">{errors.year}</p>
                )}
                {errors.semester && (
                  <p className="text-red-700 text-sm">{errors.semester}</p>
                )}
                {errors.selectedDays && (
                  <p className="text-red-700 text-sm">{errors.selectedDays}</p>
                )}
              </div>
            )}

            {bulkFormData.year && bulkFormData.semester && (
              <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
                <p className="text-green-700 font-semibold">
                  Found {filteredSubjects.length} subjects for Year{" "}
                  {bulkFormData.year}, Semester {bulkFormData.semester}
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
                disabled={!bulkFormData.year || !bulkFormData.semester}
              >
                Continue to Schedule Subjects
              </Button>
            </div>
          </div>
        </form>
      )}

      {step === 2 && (
        <form className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800">
              Step 2: Schedule {filteredSubjects.length} Subjects
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
            const schedule = subjectSchedules[subject._id] || {};
            const requiredHours = calculateRequiredHours(subject);
            const subjectFaculties = getFacultiesForSubject(subject._id);
            const availableClassrooms = getClassroomsForType(
              schedule.subjectType
            );
            const availableTimeSlots = getTimeSlotsForDays(
              schedule.days || bulkFormData.selectedDays,
              schedule.faculty,
              schedule.classroom
            );
            const bookedSlotsForDays = getBookedSlotsForDays(
              schedule.days || bulkFormData.selectedDays,
              schedule.faculty,
              schedule.classroom
            );
            const subjectError = errors[subject._id];

            return (
              <div
                key={subject._id}
                className={`p-4 rounded-lg border-l-4 ${
                  subjectError
                    ? "bg-red-50 border-red-500"
                    : "bg-gray-50 border-blue-500"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-gray-800">
                      {idx + 1}. {subject.subjectCode} - {subject.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {subject.creditHours} credit(s)
                      {schedule.subjectType === "P"
                        ? ` → ${requiredHours} hours per batch`
                        : ` → ${requiredHours} hours total`}
                    </p>
                  </div>
                  {subjectError && (
                    <div className="text-red-600 font-semibold text-sm">
                      Error
                    </div>
                  )}
                </div>

                {Array.isArray(subject.type) && subject.type.length > 1 ? (
                  <Select
                    label="Type"
                    name={`type_${subject._id}`}
                    value={schedule.subjectType}
                    onChange={(e) =>
                      handleSubjectScheduleChange(
                        subject._id,
                        "subjectType",
                        e.target.value
                      )
                    }
                    options={subject.type.map((t) => ({
                      label:
                        t === "L"
                          ? "Lecture"
                          : t === "T"
                            ? "Tutorial"
                            : "Practical",
                      value: t,
                    }))}
                  />
                ) : (
                  <div className="mb-3 p-2 bg-blue-100 rounded text-sm text-blue-700">
                    <span className="font-semibold">Type:</span>{" "}
                    {schedule.subjectType === "L"
                      ? "Lecture"
                      : schedule.subjectType === "T"
                        ? "Tutorial"
                        : "Practical"}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <Select
                    label="Faculty"
                    name={`faculty_${subject._id}`}
                    value={schedule.faculty}
                    onChange={(e) =>
                      handleSubjectScheduleChange(
                        subject._id,
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
                    label="Classroom"
                    name={`classroom_${subject._id}`}
                    value={schedule.classroom}
                    onChange={(e) =>
                      handleSubjectScheduleChange(
                        subject._id,
                        "classroom",
                        e.target.value
                      )
                    }
                    options={availableClassrooms.map((c) => ({
                      label: c.roomNumber + " (" + c.type + ")",
                      value: c._id,
                    }))}
                  />

                  {schedule.subjectType === "P" && (
                    <Select
                      label="Batch"
                      name={`batch_${subject._id}`}
                      value={schedule.batch}
                      onChange={(e) =>
                        handleSubjectScheduleChange(
                          subject._id,
                          "batch",
                          e.target.value
                        )
                      }
                      options={batchOptions}
                    />
                  )}

                  <MultiSelect
                    label="Days"
                    name={`days_${subject._id}`}
                    value={schedule.days}
                    onChange={(e) =>
                      handleSubjectMultiSelect(
                        subject._id,
                        "days",
                        e.target.value
                      )
                    }
                    options={bulkFormData.selectedDays.map((d) => ({
                      label: d,
                      value: d,
                    }))}
                  />

                  <MultiSelect
                    label={`Time Slots (Select ${requiredHours})`}
                    name={`timeSlots_${subject._id}`}
                    value={schedule.timeSlots}
                    onChange={(e) =>
                      handleSubjectMultiSelect(
                        subject._id,
                        "timeSlots",
                        e.target.value
                      )
                    }
                    options={availableTimeSlots
                      .sort((a, b) => {
                        const dayOrder =
                          DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
                        if (dayOrder !== 0) return dayOrder;
                        return a.periodNumber - b.periodNumber;
                      })
                      .map((t) => ({
                        label:
                          t.day +
                          " P" +
                          t.periodNumber +
                          ": " +
                          t.startTime +
                          "-" +
                          t.endTime,
                        value: t._id,
                      }))}
                    highlightConflict={true}
                    conflictSlots={bookedSlotsForDays}
                  />
                </div>

                {schedule.timeSlots.length > 0 && (
                  <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
                    <span className="font-semibold">
                      Selected: {schedule.timeSlots.length} / {requiredHours}{" "}
                      slots
                    </span>
                    {schedule.timeSlots.length === requiredHours && (
                      <span className="ml-2 text-green-600">✅</span>
                    )}
                    {schedule.timeSlots.length < requiredHours && (
                      <span className="ml-2 text-orange-600">
                        Need {requiredHours - schedule.timeSlots.length} more
                      </span>
                    )}
                    {schedule.timeSlots.length > requiredHours && (
                      <span className="ml-2 text-red-600">Too many</span>
                    )}
                  </div>
                )}

                {subjectError && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                    <p className="text-red-700 text-sm">{subjectError}</p>
                  </div>
                )}
              </div>
            );
          })}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-4">
              Break Times (Optional)
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Select time slots to mark as breaks for the entire semester
              (excludes cross-year bookings)
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
            {bulkFormData.selectedBreaks.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {bulkFormData.selectedBreaks.length} break slot(s) selected
              </p>
            )}
          </div>

          <div className="flex justify-end gap-4 mt-6 sticky bottom-0 bg-white p-4 rounded border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button type="button" onClick={handleSubmitAll} disabled={loading}>
              {loading
                ? "Creating..."
                : `Create All ${filteredSubjects.length} Entries`}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
