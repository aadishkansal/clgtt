import { Routes, Route, Navigate } from "react-router-dom";
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

import { TimetableForm } from "./components/Timetable/TimetableForm";
import { EditTimetable } from "./pages/EditTimetable";

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

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
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />

            {/* Timetable Routes */}
            <Route path="/timetable" element={<TimetableManagement />} />
            <Route path="/timetable/create" element={<TimetableForm />} />
            <Route path="/timetable/edit/:id" element={<EditTimetable />} />

            {/* Management Routes */}
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
