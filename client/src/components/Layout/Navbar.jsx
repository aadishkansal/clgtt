import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";


export const Navbar = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="flex justify-between items-center px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">
            College Timetable
          </h1>
          <p className="text-gray-600 text-sm">Management System</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-gray-800 font-medium">{admin?.name}</p>
            <p className="text-gray-500 text-sm">{admin?.email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};
