import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/register", form);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Registration failed. Try again.");
      }
    }
  };

  return (
    <div className="h-screen w-screen flex bg-gray-100 overflow-hidden">
      <div className="w-full h-full flex">
        {/* Illustration Side */}
        <div className="w-1/2 bg-blue-100 hidden lg:flex items-center justify-center p-4">
          <img 
            src="https://images.pexels.com/photos/6368834/pexels-photo-6368834.jpeg" 
            alt="Illustration" 
            className="w-full h-full max-w-lg max-h-140 object-cover rounded-xl shadow-lg" 
          />
        </div>

        {/* Register Form */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-8 md:px-16 lg:px-20 py-8">
          <div className="mb-8 text-center">
            <div className="text-3xl font-bold mb-2 text-gray-800">Organizo</div>
            <div className="text-sm text-gray-500">Create your account</div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto w-full">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                placeholder="Enter password"
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 transition-colors duration-200 rounded-lg p-3 font-semibold text-white"
            >
              Register →
            </button>
            <div className="text-center mt-4">
              <span className="text-sm text-gray-600">Already have an account? </span>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
              >
                Sign in here
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
