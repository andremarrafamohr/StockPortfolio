import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

function getRegisterWarning(error) {
  if (!error.response) {
    return `Cannot reach the backend at ${API_BASE_URL}. Start the server in the /server folder with npm run dev.`;
  }

  const message = error.response.data?.message;
  if (message) return message;

  if (error.response.status >= 500) {
    return "The backend returned an internal server error. Check the backend terminal output.";
  }

  return "Registration failed.";
}

export default function Register() {
  const [name, setName] = useState("");
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

    if (!name.trim() || !email.trim() || !password) {
      setError("Name, email, and password are required.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name: name.trim(),
        email: email.trim(),
        password,
      });
      localStorage.setItem("token", data.token);
      navigate("/journal");
    } catch (err) {
      const message = getRegisterWarning(err);
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
          <p className="text-gray-500 text-sm mt-2">Create your account</p>
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Your name"
            />
          </div>
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
              minLength={6}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Min 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
          <p className="text-center text-gray-600 text-xs">
            Backend expected at {API_BASE_URL}
          </p>
          <p className="text-center text-gray-600 text-sm pt-2">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-500 hover:text-blue-400">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}