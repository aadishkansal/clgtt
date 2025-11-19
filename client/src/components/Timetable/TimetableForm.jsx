import { useState, useEffect, useRef, Fragment, useMemo } from "react";
import { Button } from "../Common/Button";
import { Select } from "../Common/Select";
import { MultiSelect } from "../Common/MultiSelect";
import api from "../../utils/api";
import { handleApiError } from "../../utils/helpers";
import { toast } from "react-toastify";

const YEARS = [1, 2, 3, 4];
const SECTIONS = ["A", "B"];
const BATCHES = ["B1", "B2"];
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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

export const TimetableForm = ({ onSave, onCancel }) => {
  const formRef = useRef(null);

  const [faculties, setFaculties] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const [bulkFormData, setBulkFormData] = useState({
    department: "",
    year: "",
    semester: "",
    section: "",
    selectedDays: [],
    selectedBreaks: [],
  });

  const [subjectSchedules, setSubjectSchedules] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({}); // Stores conflicts keyed by "subjectID-entryID"
  const [step, setStep] = useState(1);

  const [facultyBookings, setFacultyBookings] = useState(new Map());
  const [classroomBookings, setClassroomBookings] = useState(new Map());
  const [studentBookings, setStudentBookings] = useState(new Map());

  useEffect(() => {
    loadFormData();
  }, []);

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

      setFaculties(facRes.data?.data || facRes.data?.faculty || []);
      setSubjects(subRes.data?.data || subRes.data?.subjects || []);
      setClassrooms(clsRes.data?.data || clsRes.data?.classrooms || []);
      setTimeSlots(timeRes.data?.data || timeRes.data?.timeSlots || []);

      const timetableData = ttRes.data?.data || ttRes.data?.timetables || [];

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

          if (facId && slotId)
            facMap.set(`${facId}-${slotId}`, { year: tt.year });
          if (clsId && slotId)
            clsMap.set(`${clsId}-${slotId}`, { year: tt.year });

          if (slotId && tt.department) {
            const studentKey = `${tt.department}-${tt.year}-${tt.semester}-${tt.section}-${slotId}`;
            if (!studentMap.has(studentKey)) studentMap.set(studentKey, []);
            studentMap.get(studentKey).push(batch);
          }
        });
      });

      setFacultyBookings(facMap);
      setClassroomBookings(clsMap);
      setStudentBookings(studentMap);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load form data");
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = useMemo(() => {
    return subjects.filter(
      (s) =>
        s.year === parseInt(bulkFormData.year) &&
        s.semester === parseInt(bulkFormData.semester) &&
        s.department === bulkFormData.department
    );
  }, [
    subjects,
    bulkFormData.year,
    bulkFormData.semester,
    bulkFormData.department,
  ]);

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

          if (types.includes("L") && lectureHours > 0)
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
          if (types.includes("T") && tutorialHours > 0)
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
  }, [step, filteredSubjects]);

  const getSemesterOptions = () => {
    const year = parseInt(bulkFormData.year);
    if (!year) return [];
    let sems = [];
    if (year === 1) sems = [1, 2];
    else if (year === 2) sems = [3, 4];
    else if (year === 3) sems = [5, 6];
    else if (year === 4) sems = [7, 8];
    return sems.map((s) => ({ label: `Semester ${s}`, value: s }));
  };

  const handleStep1Change = (e) => {
    const { name, value } = e.target;
    setBulkFormData((prev) => {
      const newState = { ...prev, [name]: value };
      if (name === "year") newState.semester = "";
      return newState;
    });
    if (["year", "semester", "section", "department"].includes(name))
      setSubjectSchedules({});
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleStep1MultiChange = (e) =>
    setBulkFormData((prev) => ({
      ...prev,
      [e.target.name]: Array.isArray(e.target.value)
        ? e.target.value
        : [e.target.value],
    }));

  const handleEntryChange = (subjectId, entryId, field, value) => {
    // ✅ Clear error for this specific entry when user interacts
    const errorKey = `${subjectId}-${entryId}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }

    setSubjectSchedules((prev) => {
      const subject = prev[subjectId];
      if (!subject) return prev;
      const updatedEntries = subject.entries.map((entry) => {
        if (entry.id === entryId) {
          let newValues = { ...entry, [field]: value };
          // Reset time slots if days change
          if (field === "days") newValues.timeSlots = [];
          return newValues;
        }
        return entry;
      });
      return { ...prev, [subjectId]: { ...subject, entries: updatedEntries } };
    });
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!bulkFormData.department) newErrors.department = "Select department";
    if (!bulkFormData.year) newErrors.year = "Select year";
    if (!bulkFormData.semester) newErrors.semester = "Select semester";
    if (!bulkFormData.section) newErrors.section = "Select section";
    if (bulkFormData.selectedDays.length === 0)
      newErrors.selectedDays = "Select at least one day";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToStep2 = () => {
    if (validateStep1()) {
      setStep(2);
      setErrors({});
    }
  };

  const getFormSelectedSlots = (
    excludeSubjectId = null,
    excludeEntryId = null
  ) => {
    const allSelected = new Set();
    Object.keys(subjectSchedules).forEach((subjectId) => {
      const schedule = subjectSchedules[subjectId];
      if (!schedule.entries) return;
      schedule.entries.forEach((entry) => {
        if (subjectId === excludeSubjectId && entry.id === excludeEntryId)
          return;
        if (entry.timeSlots)
          entry.timeSlots.forEach((id) => allSelected.add(id));
      });
    });
    return allSelected;
  };

  const getEntryTargetDays = (entry) =>
    entry.days && entry.days.length > 0
      ? entry.days
      : bulkFormData.selectedDays;

  const isSlotBlockedByForm = (slotId, currentEntry, subjectId, entryId) => {
    for (const sId of Object.keys(subjectSchedules)) {
      const schedule = subjectSchedules[sId];
      if (!schedule) continue;

      for (const otherEntry of schedule.entries) {
        if (sId === subjectId && otherEntry.id === entryId) continue;

        if (otherEntry.timeSlots && otherEntry.timeSlots.includes(slotId)) {
          const myBatch = currentEntry.batch;
          const otherBatch = otherEntry.batch;

          if (
            myBatch === "Full" ||
            otherBatch === "Full" ||
            myBatch === otherBatch
          ) {
            return true;
          }

          if (
            currentEntry.faculty &&
            otherEntry.faculty &&
            currentEntry.faculty === otherEntry.faculty
          ) {
            return true;
          }

          if (
            currentEntry.classroom &&
            otherEntry.classroom &&
            currentEntry.classroom === otherEntry.classroom
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const getAvailableTimeSlots = (subjectId, entryId, entry) => {
    const { faculty, classroom, batch } = entry;
    const targetDays = getEntryTargetDays(entry);

    return timeSlots
      .filter((slot) => {
        // 1. Filter by Day
        if (!targetDays.includes(slot.day)) return false;

        // 2. Database Conflict Checks (Global Resource)
        if (faculty && facultyBookings.has(`${faculty}-${slot._id}`))
          return false;
        if (classroom && classroomBookings.has(`${classroom}-${slot._id}`))
          return false;

        // 3. Database Batch Checks (Local Students)
        const studentKey = `${bulkFormData.department}-${bulkFormData.year}-${bulkFormData.semester}-${bulkFormData.section}-${slot._id}`;
        const existingBatches = studentBookings.get(studentKey) || [];
        if (existingBatches.length > 0) {
          if (
            batch === "Full" ||
            existingBatches.includes("Full") ||
            existingBatches.includes(batch)
          ) {
            return false;
          }
        }

        // 4. Form Internal Check (Smart Batch Overlap)
        if (isSlotBlockedByForm(slot._id, entry, subjectId, entryId)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const dayOrder = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
        if (dayOrder !== 0) return dayOrder;
        return a.periodNumber - b.periodNumber;
      });
  };

  const getBookedSlotsForDays = (subjectId, entryId, entry) => {
    const { faculty, classroom, batch } = entry;
    const targetDays = getEntryTargetDays(entry);
    const conflictedSlots = new Set();

    timeSlots.forEach((slot) => {
      if (!targetDays.includes(slot.day)) return;

      if (faculty && facultyBookings.has(`${faculty}-${slot._id}`))
        conflictedSlots.add(slot._id);
      if (classroom && classroomBookings.has(`${classroom}-${slot._id}`))
        conflictedSlots.add(slot._id);

      const studentKey = `${bulkFormData.department}-${bulkFormData.year}-${bulkFormData.semester}-${bulkFormData.section}-${slot._id}`;
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

  const getFacultiesForSubject = (subjectId) =>
    faculties.filter((f) =>
      f.subjects?.some((s) => (typeof s === "object" ? s._id : s) === subjectId)
    );
  const getClassroomsForType = (entryType) =>
    entryType === "Practical"
      ? classrooms.filter((c) => c.type === "lab")
      : classrooms.filter((c) => c.type === "theory" || c.type === "seminar");

  const getBreakSlotOptions = () => {
    const formUsedSlots = getFormSelectedSlots();
    const studentKeyPrefix = `${bulkFormData.department}-${bulkFormData.year}-${bulkFormData.semester}-${bulkFormData.section}-`;
    const dbUsedSlots = new Set();
    studentBookings.forEach((batches, key) => {
      if (key.startsWith(studentKeyPrefix))
        dbUsedSlots.add(key.substring(studentKeyPrefix.length));
    });

    return timeSlots
      .filter(
        (t) =>
          bulkFormData.selectedDays.includes(t.day) &&
          !formUsedSlots.has(t._id) &&
          !dbUsedSlots.has(t._id)
      )
      .sort((a, b) => a.periodNumber - b.periodNumber)
      .map((t) => ({
        label: `${t.day} (${t.startTime} - ${t.endTime})`,
        value: t._id,
      }));
  };

  const validateAllSubjects = () => {
    for (const subject of filteredSubjects) {
      const schedule = subjectSchedules[subject._id];
      if (!schedule) continue;
      for (const entry of schedule.entries) {
        if (
          !entry.faculty ||
          !entry.classroom ||
          entry.timeSlots.length !== entry.requiredHours
        )
          return false;
      }
    }
    return true;
  };

  const handleSubmitAll = async () => {
    if (!validateAllSubjects()) {
      toast.error(
        "Please complete all entries (Faculty, Room, Slots) before submitting."
      );
      return;
    }
    setLoading(true);
    setErrors({}); // Clear old errors

    const allEntries = [];
    filteredSubjects.forEach((subject) => {
      const schedule = subjectSchedules[subject._id];
      if (!schedule) return;
      schedule.entries.forEach((entry) => {
        allEntries.push({
          _meta: { subjectId: subject._id, entryId: entry.id }, // ✅ Meta for UI tracking
          department: bulkFormData.department,
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
          days: getEntryTargetDays(entry),
          timeSlots: entry.timeSlots,
          breakSlots: bulkFormData.selectedBreaks,
        });
      });
    });

    try {
      for (const entry of allEntries) {
        const { _meta, ...payload } = entry;
        try {
          await api.post("/timetable/create", payload);
        } catch (innerError) {
          // If critical conflict, map it back to the UI
          if (innerError.response?.status === 409) {
            const errorKey = `${_meta.subjectId}-${_meta.entryId}`;
            const msg =
              innerError.response.data.conflicts?.[0]?.message ||
              "Conflict detected";

            setErrors((prev) => ({ ...prev, [errorKey]: msg }));

            // Scroll to error
            setTimeout(() => {
              const el = document.getElementById(`entry-${errorKey}`);
              if (el)
                el.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);

            throw new Error(
              "Critical conflicts detected. Please fix highlighted entries."
            );
          }
          throw innerError; // Re-throw other errors
        }
      }

      toast.success(`Successfully created ${allEntries.length} entries!`);
      loadFormData();
      setStep(1);
      setBulkFormData({
        department: "",
        year: "",
        semester: "",
        section: "",
        selectedDays: [],
        selectedBreaks: [],
      });
      setSubjectSchedules({});
      if (typeof onSave === "function") onSave();
    } catch (error) {
      // If custom error message exists (from our throw above), use it
      toast.error(error.message || handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading && subjects.length === 0)
    return <div className="p-6 text-center">Loading form...</div>;

  return (
    <div ref={formRef} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-2">Bulk Timetable Scheduler</h2>

      {step === 1 && (
        <form className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-4">
              Step 1: Class Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Department *"
                name="department"
                value={bulkFormData.department}
                onChange={handleStep1Change}
                options={DEPARTMENTS.map((d) => ({ label: d, value: d }))}
                required
              />
              <Select
                label="Year *"
                name="year"
                value={bulkFormData.year}
                onChange={handleStep1Change}
                options={YEARS.map((y) => ({ label: "Year " + y, value: y }))}
                required
              />
              <Select
                label="Semester *"
                name="semester"
                value={bulkFormData.semester}
                onChange={handleStep1Change}
                options={getSemesterOptions()}
                required
                disabled={!bulkFormData.year}
              />
              <Select
                label="Section *"
                name="section"
                value={bulkFormData.section}
                onChange={handleStep1Change}
                options={SECTIONS.map((s) => ({
                  label: "Section " + s,
                  value: s,
                }))}
                required
              />
            </div>
            <div className="mt-4">
              <MultiSelect
                label="Working Days *"
                name="selectedDays"
                value={bulkFormData.selectedDays}
                onChange={handleStep1MultiChange}
                options={DAYS.map((d) => ({ label: d, value: d }))}
                required
              />
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleProceedToStep2}
                disabled={
                  !bulkFormData.department ||
                  !bulkFormData.year ||
                  !bulkFormData.semester ||
                  !bulkFormData.section
                }
              >
                Continue
              </Button>
            </div>
          </div>
        </form>
      )}

      {step === 2 && (
        <form className="space-y-6">
          <div className="p-4 border rounded bg-gray-50 mb-4">
            <h3 className="font-bold text-lg mb-4">
              Step 2: Assign Slots for {filteredSubjects.length} Subjects
            </h3>

            {filteredSubjects.map((subject) => {
              const schedule = subjectSchedules[subject._id];
              if (!schedule) return null;
              return (
                <div
                  key={subject._id}
                  className="mb-4 p-4 bg-white rounded border shadow-sm"
                >
                  <h4 className="font-bold text-blue-700 mb-2">
                    {subject.name}{" "}
                    <span className="text-gray-500 text-sm font-normal">
                      ({subject.subjectCode})
                    </span>
                  </h4>
                  {schedule.entries.map((entry) => {
                    // ✅ Create unique error key for this entry
                    const errorKey = `${subject._id}-${entry.id}`;
                    const hasError = !!errors[errorKey];

                    return (
                      <div
                        key={entry.id}
                        id={`entry-${errorKey}`} // ✅ ID for auto-scrolling
                        className={`mt-2 p-3 border-l-4 rounded transition-all ${
                          hasError
                            ? "border-red-500 bg-red-50" // Red style on error
                            : "border-blue-500 bg-gray-50"
                        }`}
                      >
                        <div className="flex justify-between mb-2">
                          <span className="font-semibold text-sm">
                            {entry.entryType} ({entry.batch})
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              entry.timeSlots.length === entry.requiredHours
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            {entry.timeSlots.length}/{entry.requiredHours} slots
                          </span>
                        </div>

                        {/* ✅ SHOW ERROR MESSAGE IF EXISTS */}
                        {hasError && (
                          <div className="mb-3 text-xs text-red-700 font-bold bg-white p-2 rounded border border-red-200 shadow-sm">
                            ⚠️ {errors[errorKey]}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <Select
                            label="Faculty"
                            value={entry.faculty}
                            onChange={(e) =>
                              handleEntryChange(
                                subject._id,
                                entry.id,
                                "faculty",
                                e.target.value
                              )
                            }
                            options={getFacultiesForSubject(subject._id).map(
                              (f) => ({ label: f.name, value: f._id })
                            )}
                          />
                          <Select
                            label="Classroom"
                            value={entry.classroom}
                            onChange={(e) =>
                              handleEntryChange(
                                subject._id,
                                entry.id,
                                "classroom",
                                e.target.value
                              )
                            }
                            options={getClassroomsForType(entry.entryType).map(
                              (c) => ({ label: c.roomNumber, value: c._id })
                            )}
                          />
                        </div>

                        <div className="mb-3">
                          <MultiSelect
                            label="Select Days (Optional)"
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
                            placeholder="Use Default Days"
                          />
                        </div>

                        <div>
                          <MultiSelect
                            label={`Select ${entry.requiredHours} Time Slots`}
                            value={entry.timeSlots}
                            onChange={(e) =>
                              handleEntryChange(
                                subject._id,
                                entry.id,
                                "timeSlots",
                                e.target.value
                              )
                            }
                            options={getAvailableTimeSlots(
                              subject._id,
                              entry.id,
                              entry
                            ).map((t) => ({
                              label: `${t.day} (${t.startTime} - ${t.endTime})`,
                              value: t._id,
                            }))}
                            highlightConflict={true}
                            conflictSlots={getBookedSlotsForDays(
                              subject._id,
                              entry.id,
                              entry
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-semibold text-yellow-800 mb-2">
                Common Breaks
              </h4>
              <MultiSelect
                label="Select Break Slots"
                name="selectedBreaks"
                value={bulkFormData.selectedBreaks}
                onChange={handleStep1MultiChange}
                options={getBreakSlotOptions()}
                highlightConflict={true}
                conflictSlots={[]}
                placeholder="Select breaks..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 sticky bottom-0 bg-white p-4 border-t shadow-lg">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button type="button" onClick={handleSubmitAll} disabled={loading}>
              {loading ? "Creating..." : "Create All Entries"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
