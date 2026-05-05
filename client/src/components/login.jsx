import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import ThemeToggle from "./ThemeToggle";

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
    <div className="app-page flex items-center justify-center px-4 py-10">
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[color:var(--app-surface)] border border-[color:var(--app-border)] mb-4 shadow-lg">
            <span className="text-2xl">📈</span>
          </div>
          <h1 className="text-3xl font-bold text-[color:var(--app-text)]">Trading Journal</h1>
          <p className="text-[color:var(--app-text-muted)] text-sm mt-2">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="app-auth-card space-y-4 p-8">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3 text-sm">
              {error}
            </div>
          )}
          {warning && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 px-4 py-3 text-sm">
              {warning}
            </div>
          )}
          <div>
            <label className="app-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="app-input text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="app-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="app-input text-sm"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="app-button-primary w-full font-semibold py-3 mt-2 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <p className="text-center text-[color:var(--app-text-soft)] text-xs">
            Backend expected at {API_BASE_URL}
          </p>
          <p className="text-center text-[color:var(--app-text-muted)] text-sm pt-2">
            No account?{" "}
            <Link to="/register" className="text-[color:var(--app-primary)] hover:opacity-80">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
