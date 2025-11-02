import { useEffect, useState } from "react";
import { Select } from "../Common/Select";

import { handleApiError } from "../../utils/helpers";
import { DAYS_OF_WEEK } from "../../utils/constants";

export const TimeslotSelect = ({
  value,
  onChange,
  disabled,
  conflictTimeslots = [],
}) => {
  const [timeslots, setTimeslots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTimeslots();
  });

  const loadTimeslots = async () => {
    try {
      setLoading(true);

      // Since we might not have a timeslots API endpoint, create default timeslots
      const defaultTimeslots = generateDefaultTimeslots();
      setTimeslots(defaultTimeslots);
    } catch (error) {
      console.error("Failed to load timeslots:", handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultTimeslots = () => {
    const slots = [];
    const times = [
      { start: "09:00", end: "10:00", period: 1 },
      { start: "10:00", end: "11:00", period: 2 },
      { start: "11:00", end: "12:00", period: 3 },
      { start: "12:00", end: "13:00", period: 4 },
      // Lunch break from 13:00-14:00
      { start: "14:00", end: "15:00", period: 5 },
      { start: "15:00", end: "16:00", period: 6 },
      { start: "16:00", end: "17:00", period: 7 },
    ];

    DAYS_OF_WEEK.forEach((day) => {
      times.forEach((time) => {
        slots.push({
          _id: `${day}-${time.start}`,
          day,
          startTime: time.start,
          endTime: time.end,
          periodNumber: time.period,
          slotID: `${day}-P${time.period}`,
          duration: 60,
        });
      });
    });

    return slots;
  };

  const isConflicted = (timeslotId) => {
    return conflictTimeslots.includes(timeslotId);
  };

  const options = timeslots.map((slot) => ({
    label: `${slot.day} - ${slot.startTime} to ${slot.endTime}${isConflicted(slot._id) ? " ⚠️ CONFLICT" : ""}`,
    value: slot._id,
    disabled: isConflicted(slot._id),
  }));

  return (
    <Select
      label="Time Slot"
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled || loading}
      placeholder={loading ? "Loading timeslots..." : "Select a time slot"}
      required
    />
  );
};
