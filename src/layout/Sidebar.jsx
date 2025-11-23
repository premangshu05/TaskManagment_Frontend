import { NavLink, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="h-screen w-64 bg-white shadow-md flex flex-col justify-between fixed">
      <div>
        <h2 className="text-2xl font-bold p-6 text-yellow-500">Organizo</h2>
        <nav className="flex flex-col gap-1 px-4">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `block p-3 rounded-lg hover:bg-yellow-100 ${isActive ? "bg-yellow-200 font-semibold" : ""}`
            }
          >
            🏠 Dashboard
          </NavLink>
          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              `block p-3 rounded-lg hover:bg-yellow-100 ${isActive ? "bg-yellow-200 font-semibold" : ""}`
            }
          >
            ✅ My Tasks
          </NavLink>
          <NavLink
            to="/create"
            className={({ isActive }) =>
              `block p-3 rounded-lg hover:bg-yellow-100 ${isActive ? "bg-yellow-200 font-semibold" : ""}`
            }
          >
            ➕ Create Task
          </NavLink>
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `block p-3 rounded-lg hover:bg-yellow-100 ${isActive ? "bg-yellow-200 font-semibold" : ""}`
            }
          >
            🔔 Notifications
          </NavLink>
        </nav>
      </div>
      <button
        onClick={logout}
        className="m-4 bg-red-500 text-white p-3 rounded-lg hover:bg-red-600"
      >
        🚪 Logout
      </button>
    </div>
  );
};

export default Sidebar;
