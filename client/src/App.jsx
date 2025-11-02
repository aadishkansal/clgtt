import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { Loader } from "./components/Common/Loader";
import { Navbar } from "./components/Layout/Navbar";
import { Sidebar } from "./components/Layout/Sidebar";

// Pages
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { TimetableManagement } from "./pages/TimetableManagement";
import { FacultyManagement } from "./pages/FacultyManagement";
import { SubjectManagement } from "./pages/SubjectManagement";
import { ClassroomManagement } from "./pages/ClassroomManagement";

console.log(
  "%c✅ App.jsx loaded",
  "color: blue; font-size: 14px; font-weight: bold;"
);

function App() {
  console.log("%c🔄 App component rendering", "color: orange");

  const { isAuthenticated, loading } = useAuth();

  console.log("🔐 Auth State:", { isAuthenticated, loading });

  if (loading) {
    console.log("⏳ Loading...");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

  console.log("✅ Rendering Routes. isAuthenticated:", isAuthenticated);

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : <Login />}
      />

      <Route
        path="/*"
        element={
          isAuthenticated ? <ProtectedLayout /> : <Navigate to="/login" />
        }
      />
    </Routes>
  );
}

function ProtectedLayout() {
  console.log("%c🛡️ ProtectedLayout rendering", "color: green");
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/timetable" element={<TimetableManagement />} />
            <Route path="/faculty" element={<FacultyManagement />} />
            <Route path="/subjects" element={<SubjectManagement />} />
            <Route path="/classrooms" element={<ClassroomManagement />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
