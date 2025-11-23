import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import NotificationBell from "../components/NotificationBell"; // path depends on your structure
import { useNotifications } from "../context/NotificationContext";
// import { handleMarkComplete } from "../utils/taskOperations";

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const res = await api.get("/task/gettasks?page=0&size=100");
        setTasks(res.data.content || []);
        // Extract username from JWT token
        const token = localStorage.getItem("token");
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser(payload.sub || "User");
        }
      } catch (err) {
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Stats
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const inProgress = tasks.filter(t => t.status === "in-progress").length;
  const pending = tasks.filter(t => t.status === "pending").length;
  const overdue = tasks.filter(isOverdue).length;
  const upcoming = tasks.filter(t => {
    if (!t.deadline) return false;
    const d = new Date(t.deadline);
    const now = new Date();
    return d >= now && (d - now) / (1000 * 60 * 60 * 24) <= 3; // next 3 days
  }).length;

  // Recent 5 tasks
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.deadline || 0) - new Date(a.deadline || 0))
    .slice(0, 5);

  // Helper: YYYY-MM-DD (ensure consistent timezone handling)
  function formatDate(date) {
    // Use local timezone to avoid date shifting issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const handleMarkComplete = async (taskId, currentStatus) => {
  try {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newStatus = currentStatus === "completed" ? "in-progress" : "completed";
    const payload = {
      title: task.title,
      description: task.description,
      priority: typeof task.priority === "number" ? task.priority : 1,
      status: newStatus,
      deadline: task.deadline,
    };
    await api.put(`/task/update/${taskId}`, payload);
    addNotification(
      `Task "${task.title}" marked as ${newStatus.replace("-", " ")}!`,
      "success"
    );
    // Refresh task list after marking complete
    const res = await api.get("/task/gettasks?page=0&size=100");
    setTasks(res.data.content || []);
  } catch (err) {
    addNotification(
      err.response?.data?.message ||
        err.message ||
        "Failed to update task.",
      "error"
    );
  }
};


  // Map of date string => task count
  const taskCountByDate = {};
  tasks.forEach(task => {
    if (task.deadline) {
      // Extract just the date part, ignoring time and timezone
      const taskDate = new Date(task.deadline);
      const day = formatDate(taskDate);
      taskCountByDate[day] = (taskCountByDate[day] || 0) + 1;
    }
  });

  function isOverdue(task) {
  if (!task.deadline) return false;
  const deadlineDate = new Date(task.deadline);
  const today = new Date();
  // Only compare year, month, and date (ignore time)
  deadlineDate.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  return deadlineDate < today && task.status !== "completed";
}

  // Tasks for the selected date (default: today)
  const selectedDayStr = formatDate(selectedDate);
  const tasksForSelectedDate = tasks.filter(task => {
    if (!task.deadline) return false;
    const taskDate = new Date(task.deadline);
    const taskDayStr = formatDate(taskDate);
    return taskDayStr === selectedDayStr;
  });

  // Map priority numbers to string
  function mapPriority(priority) {
    if (typeof priority === "number") {
      if (priority === 1) return "low";
      if (priority === 2) return "medium";
      if (priority === 3) return "high";
    }
    return priority || "";
  }

  // Handle search submit
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchError("");
      return;
    }
    setSearchLoading(true);
    setSearchError("");
    try {
      const res = await api.get(`/task/search?query=${encodeURIComponent(searchTerm)}`);
      setSearchResults(res.data || []);
    } catch (err) {
      setSearchError(
        err.response?.data?.message ||
        err.message ||
        "Failed to search tasks."
      );
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div>
      {/* Header with notifications */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-yellow-600">
          Welcome{user ? `, ${user}` : ""}!
        </h2>
        <NotificationBell />
      </div>

      {/* Search Bar */}
      <form
        onSubmit={handleSearch}
        className="mb-6 flex gap-2"
      >
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search tasks by title or description"
          className="border p-2 rounded-lg flex-1"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Search
        </button>
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setSearchResults([]);
              setSearchError("");
            }}
            className="bg-gray-200 text-gray-700 px-2 py-1 rounded"
          >
            Clear
          </button>
        )}
      </form>

      {/* Search Results */}
      {searchLoading && (
        <div className="mb-4 text-gray-500">Searching...</div>
      )}
      {searchError && (
        <div className="mb-4 text-red-500">{searchError}</div>
      )}
      {searchResults.length > 0 && (
        <div className="mb-6 bg-white p-4 rounded-xl shadow">
          <div className="font-bold mb-2">Search Results</div>
          <ul className="divide-y">
            {searchResults.map(task => (
              <li key={task.id} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.status === "completed"}
                    onChange={() => handleMarkComplete(task.id, task.status, setTasks, addNotification, setSearchResults)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className={`font-medium ${task.status === "completed" ? "line-through text-gray-500" : ""}`}>
                      {task.title}
                    </span>
                    <span className="ml-2 text-sm text-gray-400">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : ""}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">({mapPriority(task.priority)})</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  task.status === "completed" ? "bg-green-100 text-green-700"
                  : task.status === "in-progress" ? "bg-blue-100 text-blue-700"
                  : "bg-yellow-100 text-yellow-700"
                }`}>
                  {task.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Task Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{total}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-green-100 text-green-700 shadow rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{completed}</div>
          <div className="text-sm">Completed</div>
        </div>
        <div className="bg-blue-100 text-blue-700 shadow rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{inProgress}</div>
          <div className="text-sm">In Progress</div>
        </div>
        <div className="bg-yellow-100 text-yellow-700 shadow rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{pending}</div>
          <div className="text-sm">Pending</div>
        </div>
        <div className="bg-red-100 text-red-700 shadow rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{overdue}</div>
          <div className="text-sm">Overdue</div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="font-medium text-lg text-gray-700">
          Upcoming Deadlines (next 3 days):{" "}
          <span className="text-yellow-600">{upcoming}</span>
        </div>
        <button
          onClick={() => navigate("/create")}
          className="ml-auto bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-yellow-600"
        >
          ➕ Create New Task
        </button>
      </div>

      {/* Calendar and Tasks for Selected Date (side-by-side on md+, stacked on small) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Calendar */}
        <div>
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">📆 Calendar Overview</h3>
            <Calendar
              value={selectedDate}
              onClickDay={setSelectedDate}
              tileContent={({ date, view }) => {
                if (view !== "month") return null;
                const day = formatDate(date);
                const count = taskCountByDate[day] || 0;
                return count > 0 ? (
                  <div className="flex justify-center mt-1">
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full
                        ${count === 1 ? "bg-yellow-200 text-yellow-800" :
                          count === 2 ? "bg-yellow-400 text-white" :
                          count === 3 ? "bg-orange-400 text-white" :
                          "bg-orange-600 text-white"} 
                        font-bold`}
                      style={{ minWidth: 20, textAlign: "center", marginTop: 2 }}
                      title={`${count} task${count > 1 ? "s" : ""} due`}
                    >
                      {count}
                    </span>
                  </div>
                ) : null;
              }}
              tileClassName={({ date, view }) => {
                if (view === "month") return "relative";
                return "";
              }}
            />
            <div className="mt-2 text-xs text-gray-500 flex gap-2 items-center">
              <span className="inline-block w-5 h-5 bg-yellow-200 rounded-full text-center text-yellow-800 font-bold">1</span>1 task
              <span className="inline-block w-5 h-5 bg-yellow-400 rounded-full text-center text-white font-bold">2</span>2 tasks
              <span className="inline-block w-5 h-5 bg-orange-400 rounded-full text-center text-white font-bold">3</span>3 tasks
              <span className="inline-block w-5 h-5 bg-orange-600 rounded-full text-center text-white font-bold">4+</span>4+ tasks
            </div>
          </div>
        </div>

        {/* Tasks for selected date */}
        <div>
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">
              Tasks on {selectedDate.toLocaleDateString()}
            </h3>
            {tasksForSelectedDate.length === 0 ? (
              <div className="text-gray-400">No tasks for this date.</div>
            ) : (
              <ul className="divide-y">
                {tasksForSelectedDate.map(task => (
                  <li key={task.id} className="py-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.status === "completed"}
                        onChange={() => handleMarkComplete(task.id, task.status, setTasks, addNotification)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <div>
                        <span className={`font-medium ${task.status === "completed" ? "line-through text-gray-500" : ""}`}>
                          {task.title}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">
                          {task.deadline ? new Date(task.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">({mapPriority(task.priority)})</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      task.status === "completed" ? "bg-green-100 text-green-700"
                      : task.status === "in-progress" ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {task.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-xl font-bold mb-4">Recent Tasks</h3>
        {recentTasks.length === 0 ? (
          <div className="text-gray-500">No recent tasks yet.</div>
        ) : (
          <ul className="divide-y">
            {recentTasks.map(task => (
              <li key={task.id} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.status === "completed"}
                    onChange={() => handleMarkComplete(task.id, task.status, setTasks, addNotification)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className={`font-medium ${task.status === "completed" ? "line-through text-gray-500" : ""}`}>
                      {task.title}
                    </span>
                    <span className="ml-2 text-sm text-gray-400">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : ""}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">({mapPriority(task.priority)})</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  task.status === "completed" ? "bg-green-100 text-green-700"
                  : task.status === "in-progress" ? "bg-blue-100 text-blue-700"
                  : "bg-yellow-100 text-yellow-700"
                }`}>
                  {task.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
