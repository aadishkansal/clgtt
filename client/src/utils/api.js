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

    console.log("🔑 API Request:", config.method.toUpperCase(), config.url);
    console.log("🔑 Full URL:", config.baseURL + config.url);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("📝 Token: EXISTS");
    } else {
      console.log("⚠️ No token found");
    }

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log("✅ Response:", response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error("❌ Error:", error.response?.status || "Network Error");
    console.error("❌ URL:", error.config?.url);
    console.error("❌ Full URL:", error.config?.baseURL + error.config?.url);
    console.error("❌ Response:", error.response?.data);

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("admin");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
