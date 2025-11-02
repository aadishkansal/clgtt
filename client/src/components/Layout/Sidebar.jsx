import { Link, useLocation } from "react-router-dom";

export const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { label: "Dashboard", path: "/" },
    { label: "Timetable", path: "/timetable" },
    { label: "Faculty", path: "/faculty" },
    { label: "Subjects", path: "/subjects" },
    { label: "Classrooms", path: "/classrooms" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen shadow-lg">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold">Menu</h2>
      </div>

      <nav className="p-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-4 py-3 rounded-lg mb-2 transition-colors ${
              isActive(item.path)
                ? "bg-blue-600 text-white font-medium"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};
