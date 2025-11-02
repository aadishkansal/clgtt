import { CONFLICT_TYPES } from "../../utils/constants";

export const ConflictBadge = ({ type }) => {
  const colors = {
    [CONFLICT_TYPES.CLASSROOM]: "bg-red-500",
    [CONFLICT_TYPES.FACULTY]: "bg-yellow-500",
    [CONFLICT_TYPES.CAPACITY]: "bg-orange-500",
    [CONFLICT_TYPES.EXPERTISE]: "bg-purple-500",
  };

  const titles = {
    [CONFLICT_TYPES.CLASSROOM]: "Room Conflict",
    [CONFLICT_TYPES.FACULTY]: "Faculty Conflict",
    [CONFLICT_TYPES.CAPACITY]: "Capacity Issue",
    [CONFLICT_TYPES.EXPERTISE]: "Expertise Issue",
  };

  return (
    <div
      className={`w-3 h-3 rounded-full ${colors[type]}`}
      title={titles[type]}
    />
  );
};
