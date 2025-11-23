import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

function CreateTask() {
  const { addNotification } = useNotifications();
  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
    priority: "low",
    status: "pending",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Convert priority string to backend number
    const priorityNum =
      form.priority === "high"
        ? 1
        : form.priority === "medium"
        ? 2
        : form.priority === "low"
        ? 3
        : 3;

    // Use deadline as is (datetime-local value: "2025-07-18T17:30")
    // If user picks a value, always add ":00" seconds if not present
    let deadlineValue = form.deadline;
    if (deadlineValue && deadlineValue.length === 16)
      deadlineValue = deadlineValue + ":00";

    const payload = {
      ...form,
      priority: priorityNum,
      deadline: deadlineValue || null,
    };

    try {
      await api.post("/task/create", payload);
      addNotification(`Task "${form.title}" created successfully!`, "success");
      setSuccess("Task created successfully!");
      setTimeout(() => {
        navigate("/tasks");
      }, 1000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to create task.";
      addNotification(`${errorMessage}`, "error");
      setError(errorMessage);
    }
  };

  // For minimum value: today's date and time in proper format
  const minDeadline = new Date().toISOString().slice(0, 16);

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow mt-8">
      <h2 className="text-2xl font-bold mb-6 text-yellow-600">➕ Create New Task</h2>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block font-medium mb-1">Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full border rounded-lg p-3"
            placeholder="Task title"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            className="w-full border rounded-lg p-3"
            placeholder="Describe the task"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Deadline (Date & Time)</label>
            <input
              type="datetime-local"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
              min={minDeadline}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Priority</label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        {error && (
          <div className="text-red-600 bg-red-50 p-2 rounded">{error}</div>
        )}
        {success && (
          <div className="text-green-600 bg-green-50 p-2 rounded">{success}</div>
        )}
        <button
          type="submit"
          className="w-full bg-yellow-400 hover:bg-yellow-500 rounded-lg p-3 font-semibold"
        >
          Create Task
        </button>
      </form>
    </div>
  );
}

export default CreateTask;
