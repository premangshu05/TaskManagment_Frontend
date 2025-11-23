import { useEffect,useRef, useState } from "react";
import api from "../services/api";
import { useNotifications } from "../context/NotificationContext";
import Mystack from "../components/Mystack"

function mapPriority(priority) {
  if (typeof priority === "number") {
    if (priority === 1) return "high";
    if (priority === 2) return "medium";
    if (priority === 3) return "low";
  }
  return priority || "low";
}

function priorityToNumber(priority) {
  if (priority === "high") return 1;
  if (priority === "medium") return 2;
  if (priority === "low") return 3;
  return 3;
}

function Tasks() {

  const undoStack = useRef(new Mystack());
  const redoStack = useRef(new Mystack());

  const { addNotification } = useNotifications();
  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [undoRedoLoading, setUndoRedoLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [sortBy, setSortBy] = useState("deadline");
  const [sortOrder, setSortOrder] = useState("asc");

  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "",
    status: "",
    deadline: ""
  });

  
  function isoToLocalDatetime(iso) {
    if (!iso) return "";
    return iso.slice(0, 16);
  }

  
  function dateToFilterDatetime(date, type) {
    if (!date) return "";
    return type === "start"
      ? `${date}T00:00:00`
      : `${date}T23:59:59`;
  }


  const handleMarkComplete = async (task) => {
    // Save current state for undo
    undoStack.current.push([...tasks]);
    redoStack.current.clear();

    try {
      const newStatus =
        task.status === "completed" ? "in-progress" : "completed";
      const updateData = {
        title: task.title,
        description: task.description,
        priority: typeof task.priority === "number" ? task.priority : priorityToNumber(task.priority),
        status: newStatus,
        deadline: task.deadline,
      };
      await api.put(`/task/update/${task.id}`, updateData);
      addNotification(
        `Task "${task.title}" marked as ${newStatus.replace("-", " ")}!`,
        "success"
      );
      fetchTasks();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update task.";
      addNotification(`${errorMessage}`, "error");
    }
  };

  const handleEditTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return alert("Task not found!");
    setEditingTask(taskId);
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      priority: mapPriority(task.priority),
      status: task.status || "",
      deadline: isoToLocalDatetime(task.deadline) 
    });
  };

  const handleUndo = async () => {
    if (!undoStack.current.isEmpty()) {
      setUndoRedoLoading(true);
      try {
        const previousState = undoStack.current.pop();
        redoStack.current.push([...tasks]);
        
        // Update database with previous state
        await syncTasksWithDatabase(previousState);
        
        setTasks(previousState);
        addNotification("Action undone successfully!", "success");
      } catch (error) {
        // If database sync fails, restore the stack state
        undoStack.current.push(redoStack.current.pop());
        addNotification("Failed to undo action. Please try again.", "error");
      } finally {
        setUndoRedoLoading(false);
      }
    }
  };

  const handleRedo = async () => {
    if (!redoStack.current.isEmpty()) {
      setUndoRedoLoading(true);
      try {
        const nextState = redoStack.current.pop();
        undoStack.current.push([...tasks]);
        
        // Update database with next state
        await syncTasksWithDatabase(nextState);
        
        setTasks(nextState);
        addNotification("Action redone successfully!", "success");
      } catch (error) {
        // If database sync fails, restore the stack state
        redoStack.current.push(undoStack.current.pop());
        addNotification("Failed to redo action. Please try again.", "error");
      } finally {
        setUndoRedoLoading(false);
      }
    }
  };

  // Helper function to sync task state with database
  const syncTasksWithDatabase = async (taskState) => {
    const currentTasks = tasks;
    const targetTasks = taskState;

    // Find tasks that were deleted (exist in current but not in target)
    const deletedTasks = currentTasks.filter(current => 
      !targetTasks.find(target => target.id === current.id)
    );

    // Find tasks that were added (exist in target but not in current)
    const addedTasks = targetTasks.filter(target => 
      !currentTasks.find(current => current.id === target.id)
    );

    // Find tasks that were modified (exist in both but with different properties)
    const modifiedTasks = targetTasks.filter(target => {
      const current = currentTasks.find(c => c.id === target.id);
      return current && (
        current.title !== target.title ||
        current.description !== target.description ||
        current.status !== target.status ||
        current.priority !== target.priority ||
        current.deadline !== target.deadline
      );
    });

    // Apply changes to database
    const promises = [];

    // Handle deleted tasks (restore them)
    deletedTasks.forEach(task => {
      promises.push(
        api.post('/task/create', {
          title: task.title,
          description: task.description,
          priority: typeof task.priority === "number" ? task.priority : priorityToNumber(task.priority),
          status: task.status,
          deadline: task.deadline
        })
      );
    });

    // Handle added tasks (delete them)
    addedTasks.forEach(task => {
      promises.push(api.delete(`/task/delete/${task.id}`));
    });

    // Handle modified tasks (update them)
    modifiedTasks.forEach(task => {
      promises.push(
        api.put(`/task/update/${task.id}`, {
          title: task.title,
          description: task.description,
          priority: typeof task.priority === "number" ? task.priority : priorityToNumber(task.priority),
          status: task.status,
          deadline: task.deadline
        })
      );
    });

    // Wait for all database operations to complete
    try {
      await Promise.all(promises);
      console.log("✅ Database sync completed successfully");
    } catch (error) {
      console.error("❌ Database sync failed:", error);
      throw error;
    }
  };

  const handleFilter = async () => {
    try {
      setLoading(true);
      setError("");
      let query = "/task/filter?";
      const params = [];
      if (filterStart) params.push(`start=${dateToFilterDatetime(filterStart, "start")}`);
      if (filterEnd) params.push(`end=${dateToFilterDatetime(filterEnd, "end")}`);
      if (filterStatus) params.push(`status=${filterStatus}`);
      query += params.join("&");

      const res = await api.get(query);
      setTasks(res.data || []);
      setTotalPages(1);
      setPage(0);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to filter tasks"
      );
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    undoStack.current.push([...tasks]);
    redoStack.current.clear();

    const taskToDelete = tasks.find(t => t.id === taskId);
    const taskTitle = taskToDelete?.title || "Task";
    try {
      await api.delete(`/task/delete/${taskId}`);
      addNotification(`"${taskTitle}" deleted successfully!`, "success");
      fetchTasks();
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
        "Failed to delete task. You can only delete your own tasks.";
      addNotification(`${errorMessage}`, "error");
    }
  };

  const handleSaveEdit = async () => {
    undoStack.current.push([...tasks])
    redoStack.current.clear();
    try {
      let formattedDeadline = editForm.deadline;
      if (formattedDeadline && formattedDeadline.length === 16)
        formattedDeadline = formattedDeadline + ":00";

      const updateData = {
        title: editForm.title,
        description: editForm.description,
        priority: priorityToNumber(editForm.priority),
        status: editForm.status,
        deadline: formattedDeadline || null,
      };

      await api.put(`/task/update/${editingTask}`, updateData);

      addNotification(`Task "${editForm.title}" updated successfully!`, "success");
      setEditingTask(null);
      setEditForm({
        title: "",
        description: "",
        priority: "",
        status: "",
        deadline: ""
      });
      fetchTasks();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update task.";
      addNotification(`${errorMessage}`, "error");
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditForm({
      title: "",
      description: "",
      priority: "",
      status: "",
      deadline: ""
    });
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchTasks();
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/task/search?query=${encodeURIComponent(searchTerm)}`);
      setTasks(res.data || []);
      setTotalPages(1);
      setPage(0);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to search tasks"
      );
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
    setLoading(true);
    setError("");
    let endpoint = `/task/gettasks?page=${page}&size=5`;

    if (sortBy === "priority") {
      endpoint = `/task/priority?page=${page}&size=5&order=${sortOrder}`;
    } else if (sortBy === "deadline") {
      endpoint = `/task/deadline?page=${page}&size=5&order=${sortOrder}`;
    } else {
      endpoint = `/task/gettasks?page=${page}&size=5`;
    }

   
    const res = await api.get(endpoint);
    
    setTasks(res.data.content || res.data);
    setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to load tasks"
      );
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, sortBy, sortOrder]);


  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Tasks</h2>

      {/* Search Bar */}
      <form
        onSubmit={e => { e.preventDefault(); handleSearch(); }}
        className="mb-4 flex gap-2"
      >
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search tasks..."
          className="border p-2 rounded-lg flex-1"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Search
        </button>
      </form>

      {/* Filter Bar */}
      <form
        className="mb-4 flex gap-2 items-center"
        onSubmit={e => { e.preventDefault(); handleFilter(); }}
      >
        <input
          type="date"
          value={filterStart}
          onChange={e => setFilterStart(e.target.value)}
          className="border p-2 rounded-lg"
          placeholder="Start date"
        />
        <input
          type="date"
          value={filterEnd}
          onChange={e => setFilterEnd(e.target.value)}
          className="border p-2 rounded-lg"
          placeholder="End date"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border p-2 rounded-lg"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          Apply Filter
        </button>
        {(filterStart || filterEnd || filterStatus) && (
          <button
            type="button"
            onClick={() => {
              setFilterStart("");
              setFilterEnd("");
              setFilterStatus("");
              fetchTasks();
            }}
            className="ml-2 bg-gray-300 text-gray-700 px-2 py-1 rounded"
          >
            Clear
          </button>
        )}
      </form>

      {/* Sort Bar */}
      <div className="flex gap-2 mb-4 items-center justify-between">
        <div className="flex gap-2">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="p-2 border rounded">
            <option value="deadline">Sort by Deadline</option>
            <option value="priority">Sort by Priority</option>
            <option value="title">Sort by Title</option>
          </select>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="p-2 border rounded">
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
        
        {/* Undo/Redo buttons */}
        <div className="flex gap-2">
          <button 
            onClick={handleUndo} 
            disabled={undoStack.current.isEmpty() || undoRedoLoading}
            className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            title="Undo last action"
          >
            {undoRedoLoading ? "..." : "Undo"}
          </button>
          <button 
            onClick={handleRedo} 
            disabled={redoStack.current.isEmpty() || undoRedoLoading}
            className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            title="Redo last action"
          >
            {undoRedoLoading ? "..." : "Redo"}
          </button>
        </div>
      </div>


      {loading && <div>Loading tasks...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 border-b text-sm font-medium text-gray-700">
            <div className="col-span-2">TASK</div>
            <div>DUE DATE</div>
            <div>STAGE</div>
            <div>PRIORITY</div>
          </div>

          {/* Tasks */}
          {tasks.map(task => (
            <div key={task.id} className="border-b last:border-b-0">
              {/* Main row */}
              <div className="grid grid-cols-5 gap-4 p-4 items-center">
                {/* Task (checkbox + title) */}
                <div className="flex items-center col-span-2">
                  <input
                    type="checkbox"
                    checked={task.status === "completed"}
                    onChange={() => handleMarkComplete(task)}
                    className="form-checkbox rounded mr-3 h-5 w-5 border-gray-400 accent-green-500"
                    title={task.status === "completed" ? "Mark as in-progress" : "Mark as completed"}
                    style={{ accentColor: "#22c55e" }}
                  />
                  <span className={`text-sm font-medium ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-900"}`}>
                    {task.title}
                  </span>
                </div>

                {/* Due Date */}
                <div className="text-sm">
                  {task.deadline ? (
                    <span className="text-orange-600">
                      {new Date(task.deadline).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric"
                      })}
                    </span>
                  ) : (
                    <span className="text-gray-400">No date</span>
                  )}
                </div>

                {/* Stage */}
                <div>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    task.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : task.status === "in-progress"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {task.status === "in-progress" ? "In progress" : task.status}
                  </span>
                </div>

                {/* Priority */}
                <div>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    mapPriority(task.priority) === "high"
                      ? "bg-red-100 text-red-700"
                      : mapPriority(task.priority) === "medium"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {mapPriority(task.priority)}
                  </span>
                </div>
              </div>

              {/* Description row */}
              {task.description && (
                <div className="px-4 pb-2">
                  <p className={`text-sm text-gray-600 ${task.status === "completed" ? "line-through text-gray-400" : ""}`}>
                    {task.description}
                  </p>
                </div>
              )}

              {/* Actions row */}
              <div className="px-4 pb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditTask(task.id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                    title="Edit Task"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                    title="Delete Task"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && (
        <div className="flex gap-2 mt-6 items-center">
          <button
            disabled={page === 0}
            onClick={() => setPage(prev => prev - 1)}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="text-sm text-gray-700">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage(prev => prev + 1)}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deadline</label>
                <input
                  type="datetime-local"
                  value={editForm.deadline}
                  onChange={e => setEditForm({ ...editForm, deadline: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
