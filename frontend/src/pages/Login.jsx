import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      console.log("✅ Login successful");
      login(data.token, data.user);
      navigate("/chat");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Chat App</h1>
          <p className="text-slate-400">Real-time messaging platform</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 rounded-xl shadow-2xl p-8 border border-slate-800">
          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              disabled
              className="flex-1 py-2 px-4 rounded-lg font-semibold bg-green-600 text-white"
            >
              Login
            </button>
            <Link
              to="/register"
              className="flex-1 py-2 px-4 rounded-lg font-semibold bg-slate-800 text-slate-400 hover:text-slate-200 text-center transition"
            >
              Register
            </Link>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full bg-slate-800 text-slate-100 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 focus:bg-slate-700 transition placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full bg-slate-800 text-slate-100 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 focus:bg-slate-700 transition placeholder-slate-500"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-slate-400 text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-green-400 hover:text-green-300">
              Register here
            </Link>
          </p>
        </div>

        {/* Security Note */}
        <p className="text-center text-slate-500 text-sm mt-6">
          🔒 Your credentials are secure and encrypted
        </p>
      </div>
    </div>
  );
}