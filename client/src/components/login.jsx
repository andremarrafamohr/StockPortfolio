import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

function getLoginWarning(error) {
  if (!error.response) {
    return `Cannot reach the backend at ${API_BASE_URL}. Start the server in the /server folder with npm run dev.`;
  }

  const message = error.response.data?.message;
  if (message) return message;

  if (error.response.status >= 500) {
    return "The backend returned an internal server error. Check the backend terminal output.";
  }

  return "Login failed.";
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setWarning("");
    setLoading(true);

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: email.trim(),
        password,
      });
      localStorage.setItem("token", data.token);
      navigate("/journal");
    } catch (err) {
      const message = getLoginWarning(err);
      setError(message);
      if (!err.response || err.response.status >= 500 || err.response.status === 503) {
        setWarning("If the backend is running, verify MongoDB connection and the values in server/.env.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Trading Journal</h1>
          <p className="text-gray-500 text-sm mt-2">Sign in to your account</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 rounded-2xl p-8 border border-gray-800 space-y-4"
        >
          {error && (
            <div className="bg-red-950 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {warning && (
            <div className="bg-amber-950 border border-amber-800 text-amber-200 px-4 py-3 rounded-lg text-sm">
              {warning}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <p className="text-center text-gray-600 text-xs">
            Backend expected at {API_BASE_URL}
          </p>
          <p className="text-center text-gray-600 text-sm pt-2">
            No account?{" "}
            <Link to="/register" className="text-blue-500 hover:text-blue-400">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}