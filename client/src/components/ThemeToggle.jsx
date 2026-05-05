import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`app-button-secondary inline-flex items-center gap-2 ${className}`}
      aria-label="Toggle light and dark mode"
    >
      <span className="text-sm">{theme === "dark" ? "🌙" : "☀️"}</span>
      <span className="text-xs font-semibold">{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}