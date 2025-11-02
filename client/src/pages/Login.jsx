import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import { toast } from "react-toastify";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  console.log(
    "🔑 Login page - Email:",
    email,
    "Password:",
    password ? "***" : "(empty)"
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("\n🚀 ========== LOGIN ATTEMPT ==========");
    console.log("📧 Email:", email);
    console.log("🔒 Password:", password ? "Entered" : "EMPTY");

    if (!email || !password) {
      console.error("❌ Validation failed!");
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      console.log("🌐 Calling API...");
      const response = await api.post("/auth/login", { email, password });

      console.log("✅ Login successful!", response.data);

      const { token, admin } = response.data;
      login(token, admin);

      toast.success("Login successful!");
      navigate("/");
    } catch (error) {
      console.error("❌ Login error:", error);
      console.error("Response:", error.response?.data);

      const message =
        error.response?.data?.message || error.message || "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            College Timetable
          </h1>
          <p className="text-gray-600">Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                console.log("✏️ Email changed:", e.target.value);
                setEmail(e.target.value);
              }}
              placeholder="admin@college.edu"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                console.log(
                  "✏️ Password changed:",
                  e.target.value ? "***" : "(empty)"
                );
                setPassword(e.target.value);
              }}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Credentials Display */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-center text-gray-600 text-sm font-semibold mb-2">
            Default Credentials:
          </p>
          <p className="text-center text-gray-800 text-sm">
            <strong>admin@college.edu</strong> / <strong>admin123</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
