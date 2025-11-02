export const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatTime = (time) => {
  if (!time) return "";
  return time;
};

export const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export const isTokenValid = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const getConflictColor = (severity) => {
  switch (severity) {
    case "critical":
      return "bg-red-100 border-red-300 text-red-800";
    case "warning":
      return "bg-yellow-100 border-yellow-300 text-yellow-800";
    default:
      return "bg-gray-100 border-gray-300 text-gray-800";
  }
};

export const getConflictBadgeColor = (type) => {
  switch (type) {
    case "classroom":
      return "bg-red-500";
    case "faculty":
      return "bg-yellow-500";
    case "capacity":
      return "bg-orange-500";
    case "expertise":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
};

export const handleApiError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return error.message || "An error occurred";
};

export const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  return `${year}-${year + 1}`;
};
