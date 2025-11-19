import { useState, useMemo } from "react";
import { EditEntryModal } from "./EditEntryModal";
import { EditBreakModal } from "./EditBreakModal";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const TIME_SLOTS = [
  "08:00-09:00",
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "12:00-13:00",
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
  "16:00-17:00",
];

// Build break map
const buildBreakMap = (breaks = []) => {
  const map = {};
  breaks.forEach((b) => {
    const day = b?.day?.trim();
    const t = b?.startTime?.trim();
    if (day && t) {
      const key = `${day}-${t}`;
      map[key] = b; // Store the actual break object (contains _id)
    }
  });
  return map;
};

export const WeeklyGrid = ({ schedule, conflicts = [], breaks = [] }) => {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBreak, setSelectedBreak] = useState(null);
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);

  const breakMap = useMemo(() => buildBreakMap(breaks), [breaks]);

  // This function now returns an ARRAY of entries
  const getEntriesForSlot = (day, timeSlot) => {
    const startTime = timeSlot.split("-")[0];
    const matches = schedule.filter((entry) => {
      const ts = entry?.timeslotID;
      return ts?.day === day && ts?.startTime === startTime;
    });
    return matches;
  };

  const getConflictsForEntry = (entryId) => {
    if (!Array.isArray(conflicts) || !entryId) return [];
    return conflicts.filter((c) =>
      (c?.affectedEntries || []).some(
        (id) => id?.toString?.() === entryId?.toString?.()
      )
    );
  };

  const handleEntryClick = (entry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const handleBreakClick = (b) => {
    setSelectedBreak(b);
    setIsBreakModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  const handleCloseBreakModal = () => {
    setIsBreakModalOpen(false);
    setSelectedBreak(null);
  };

  const handleRefresh = () => window.location.reload();

  if (!Array.isArray(schedule) || schedule.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">No schedule data available</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 border-b-2 border-gray-300 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[100px]">
                Time/Day
              </th>
              {DAYS_OF_WEEK.map((day) => (
                <th
                  key={day}
                  className="px-4 py-3 text-center font-semibold text-gray-700 min-w-[150px]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((timeSlot, slotIndex) => {
              const startTime = timeSlot.split("-")[0];
              return (
                <tr
                  key={slotIndex}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-4 py-4 font-medium text-gray-700 bg-gray-50 min-w-[100px] sticky left-0 z-10">
                    {timeSlot}
                  </td>
                  {DAYS_OF_WEEK.map((day) => {
                    const entries = getEntriesForSlot(day, timeSlot);
                    const breakData = breakMap[`${day}-${startTime}`];

                    return (
                      <td
                        key={`${day}-${slotIndex}`}
                        className="px-4 py-4 text-center relative border border-gray-200 min-h-[100px] align-top"
                      >
                        {breakData ? (
                          <div
                            className="relative cursor-pointer hover:bg-orange-50 hover:shadow-md p-2 rounded transition-all duration-200 group bg-orange-100 border-2 border-orange-500"
                            onClick={() => handleBreakClick(breakData)}
                          >
                            <span className="text-orange-700 font-bold text-lg block">
                              🔗 BREAK
                            </span>
                            <p className="text-xs text-orange-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              Click to edit
                            </p>
                          </div>
                        ) : entries.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {entries.map((entry) => {
                              const entryConflicts = getConflictsForEntry(
                                entry._id
                              );
                              return (
                                <div
                                  key={entry._id}
                                  className="relative cursor-pointer hover:bg-blue-50 hover:shadow-md p-2 rounded transition-all duration-200 group bg-blue-50 border-2 border-blue-500"
                                  onClick={() => handleEntryClick(entry)}
                                >
                                  {entryConflicts.length > 0 && (
                                    <div className="absolute top-1 right-1 flex gap-1">
                                      {entryConflicts.map((conflict, idx) => (
                                        <div
                                          key={idx}
                                          className="w-3 h-3 rounded-full bg-red-500 hover:scale-125 transition-transform"
                                          title={conflict?.message}
                                        />
                                      ))}
                                    </div>
                                  )}
                                  <div className="text-xs">
                                    <p className="font-bold text-blue-700">
                                      {entry.subjectCode?.subjectCode || "N/A"}
                                      <span
                                        className={`font-semibold ml-1 ${
                                          entry.batchGroup === "Full"
                                            ? "text-red-600"
                                            : "text-purple-600"
                                        }`}
                                      >
                                        ({entry.batchGroup || "Full"})
                                      </span>
                                    </p>
                                    <p className="text-gray-600 truncate">
                                      {entry.facultyID?.name || "N/A"}
                                    </p>
                                    <p className="text-gray-500">
                                      {entry.classroomID?.roomNumber || "N/A"}
                                    </p>
                                    {entry.isRMC && (
                                      <span className="inline-block mt-1 ml-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                                        RMC
                                      </span>
                                    )}
                                    <p className="text-xs text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      Click to edit
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-gray-300 font-semibold text-2xl">
                            -
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <EditEntryModal
        isOpen={isModalOpen}
        entry={selectedEntry}
        onClose={handleCloseModal}
        onRefresh={handleRefresh}
      />

      <EditBreakModal
        isOpen={isBreakModalOpen}
        breakItem={selectedBreak}
        onClose={handleCloseBreakModal}
        onRefresh={handleRefresh}
      />
    </>
  );
};
