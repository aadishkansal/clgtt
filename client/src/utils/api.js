import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check for 401 Unauthorized status
    if (error.response?.status === 401) {
      // Clear authentication data and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("admin");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
