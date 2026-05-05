import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import ThemeToggle from "./ThemeToggle";

const INSTRUMENTS = ["ES", "NQ", "YM", "RTY", "CL", "GC", "6E", "ZB", "Other"];
const MOODS = [
  { value: "great", emoji: "😄", label: "Great" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "bad", emoji: "😕", label: "Bad" },
  { value: "terrible", emoji: "😞", label: "Terrible" },
];
const moodEmoji = { great: "😄", good: "🙂", neutral: "😐", bad: "😕", terrible: "😞", "": "" };

function getMarketLabel(instrument = "") {
  const code = instrument.toUpperCase();
  if (code.includes("ES") || code.includes("SP") || code.includes("MES")) return "S&P 500";
  if (code.includes("NQ") || code.includes("MNQ") || code.includes("NAS")) return "NASDAQ";
  return "Other";
}

const inputClass = "app-input text-sm";

function FormField({ label, children }) {
  return (
    <div>
      <label className="app-label">{label}</label>
      {children}
    </div>
  );
}

function Section({ label, value, editing, formValue, onChange, placeholder }) {
  return (
    <div className="app-card p-5">
      <h2 className="app-section-title mb-3">{label}</h2>
      {editing ? (
        <textarea
          value={formValue}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} h-28 resize-none`}
          placeholder={placeholder}
        />
      ) : (
        <p className="text-[color:var(--app-text)] text-sm whitespace-pre-wrap leading-relaxed">
          {value ? value : <span className="text-[color:var(--app-text-soft)] italic">No notes recorded</span>}
        </p>
      )}
    </div>
  );
}

export default function JournalEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [entry, setEntry] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [newScreenshots, setNewScreenshots] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/journal/${id}`, { headers })
      .then(({ data }) => {
        setEntry(data);
        setForm({
          date: new Date(data.date).toISOString().split("T")[0],
          instrument: INSTRUMENTS.includes(data.instrument) ? data.instrument : "Other",
          customInstrument: INSTRUMENTS.includes(data.instrument) ? "" : data.instrument,
          pnl: data.pnl,
          riskReward: data.riskReward ?? "",
          mood: data.mood || "",
          followedPlan: data.followedPlan ?? null,
          entryReason: data.entryReason || "",
          description: data.description || "",
          mistakesOrMissed: data.mistakesOrMissed || "",
          lessons: data.lessons || "",
        });
      })
      .catch(() => navigate("/journal"));
  }, [id]);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const addNewScreenshotFiles = (files) => {
    setNewScreenshots((prevScreenshots) => {
      const remaining = 5 - (entry?.screenshots.length || 0) - prevScreenshots.length;
      const toAdd = files.slice(0, remaining);

      if (toAdd.length > 0) {
        setNewPreviews((prevPreviews) => [
          ...prevPreviews,
          ...toAdd.map((file) => URL.createObjectURL(file)),
        ]);
      }

      return [...prevScreenshots, ...toAdd];
    });
  };

  const handleNewScreenshots = (e) => {
    addNewScreenshotFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  useEffect(() => {
    if (!editing) return undefined;

    const handlePaste = (event) => {
      const pastedFiles = Array.from(event.clipboardData?.items || [])
        .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter(Boolean);

      if (pastedFiles.length === 0) return;

      event.preventDefault();
      addNewScreenshotFiles(pastedFiles);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [editing, entry?.screenshots.length]);

  useEffect(
    () => () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    },
    [newPreviews]
  );

  const handleDeleteScreenshot = async (filename) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/journal/${id}/screenshots/${filename}`, { headers });
      setEntry((prev) => ({
        ...prev,
        screenshots: prev.screenshots.filter((s) => s !== filename),
      }));
    } catch (err) {
      console.error("Failed to delete screenshot:", err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const instrument = form.instrument === "Other" ? form.customInstrument.trim() : form.instrument;

    const formData = new FormData();
    formData.append("date", form.date);
    formData.append("instrument", instrument || "ES");
    formData.append("pnl", form.pnl);
    formData.append("riskReward", form.riskReward);
    formData.append("mood", form.mood);
    formData.append("followedPlan", form.followedPlan === null ? "" : String(form.followedPlan));
    formData.append("entryReason", form.entryReason);
    formData.append("description", form.description);
    formData.append("mistakesOrMissed", form.mistakesOrMissed);
    formData.append("lessons", form.lessons);
    newScreenshots.forEach((f) => formData.append("screenshots", f));

    try {
      const { data } = await axios.put(`${API_BASE_URL}/api/journal/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setEntry(data);
      setNewScreenshots([]);
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
      setNewPreviews([]);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this session? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/journal/${id}`, { headers });
      navigate("/journal");
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setNewScreenshots([]);
    newPreviews.forEach((url) => URL.revokeObjectURL(url));
    setNewPreviews([]);
    setError("");
    // Reset form to entry values
    if (entry) {
      setForm({
        date: new Date(entry.date).toISOString().split("T")[0],
        instrument: INSTRUMENTS.includes(entry.instrument) ? entry.instrument : "Other",
        customInstrument: INSTRUMENTS.includes(entry.instrument) ? "" : entry.instrument,
        pnl: entry.pnl,
        riskReward: entry.riskReward ?? "",
        mood: entry.mood || "",
        followedPlan: entry.followedPlan ?? null,
        entryReason: entry.entryReason || "",
        description: entry.description || "",
        mistakesOrMissed: entry.mistakesOrMissed || "",
        lessons: entry.lessons || "",
      });
    }
  };

  if (!entry) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="text-[color:var(--app-text-muted)] animate-pulse">Loading...</div>
      </div>
    );
  }

  const dateStr = new Date(entry.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const pnlColor = entry.pnl > 0 ? "text-green-400" : entry.pnl < 0 ? "text-red-400" : "text-gray-400";
  const editPnlNum = parseFloat(form.pnl);
  const editPnlColor =
    editPnlNum > 0 ? "text-green-400" : editPnlNum < 0 ? "text-red-400" : "text-white";

  return (
    <div className="app-shell text-[color:var(--app-text)]">
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={`${API_BASE_URL}/uploads/${lightbox}`}
            alt="Screenshot"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
          <button
            className="absolute top-4 right-4 text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <header className="app-header px-6 py-4 sticky top-0 z-10">
        <div className="flex items-start justify-between">
          <div>
            <Link to="/journal" className="text-[color:var(--app-primary)] hover:opacity-80 text-sm">
              ← Journal
            </Link>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <h1 className="text-xl font-bold text-[color:var(--app-text)]">{dateStr}</h1>
              <span className="text-[color:var(--app-text-soft)]">·</span>
              <span className="text-[color:var(--app-text-muted)] font-medium">{entry.instrument}</span>
              <span className="app-badge app-badge-neutral">
                {getMarketLabel(entry.instrument)}
              </span>
              {entry.mood && <span className="text-xl">{moodEmoji[entry.mood]}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <ThemeToggle />
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="app-button-secondary text-sm px-4 py-2"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-sm px-4 py-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="app-button-primary text-sm px-4 py-2 disabled:opacity-50 text-white font-medium"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="app-button-secondary text-sm px-4 py-2"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 pb-12">
        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* P&L card — view or edit */}
        {!editing ? (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Day P&L</p>
              <p className={`text-5xl font-bold ${pnlColor}`}>
                {entry.pnl >= 0 ? "+" : ""}${Math.abs(entry.pnl).toFixed(2)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
                  entry.pnl > 0
                    ? "bg-green-950 text-green-400"
                    : entry.pnl < 0
                    ? "bg-red-950 text-red-400"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                {entry.pnl > 0 ? "WIN DAY" : entry.pnl < 0 ? "LOSS DAY" : "FLAT"}
              </span>
              {entry.followedPlan === true && (
                <span className="text-xs px-2 py-1 rounded bg-green-950 text-green-500">
                  ✓ Followed Plan
                </span>
              )}
              {entry.followedPlan === false && (
                <span className="text-xs px-2 py-1 rounded bg-red-950 text-red-500">
                  ✗ Broke Plan
                </span>
              )}
              {entry.riskReward !== null && entry.riskReward !== undefined && (
                <span className="text-xs px-2 py-1 rounded bg-blue-950 text-blue-400">
                  R:R 1:{Number(entry.riskReward).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField label="Date">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="Instrument">
                <select
                  value={form.instrument}
                  onChange={(e) => set("instrument", e.target.value)}
                  className={inputClass}
                >
                  {INSTRUMENTS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
                {form.instrument === "Other" && (
                  <input
                    value={form.customInstrument}
                    onChange={(e) => set("customInstrument", e.target.value)}
                    className={`${inputClass} mt-2`}
                    placeholder="Custom instrument..."
                  />
                )}
              </FormField>
              <FormField label="Day P&L ($)">
                <input
                  type="number"
                  step="0.01"
                  value={form.pnl}
                  onChange={(e) => set("pnl", e.target.value)}
                  className={`${inputClass} text-lg font-bold ${editPnlColor}`}
                />
              </FormField>
              <FormField label="Session R:R (1:x)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.riskReward}
                  onChange={(e) => set("riskReward", e.target.value)}
                  className={inputClass}
                  placeholder="2.00"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Mood">
                <div className="flex gap-2 flex-wrap">
                  {MOODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => set("mood", form.mood === m.value ? "" : m.value)}
                      className={`flex flex-col items-center px-3 py-2 rounded-lg border text-xs transition-colors ${
                        form.mood === m.value
                          ? "border-blue-500 bg-blue-950 text-white"
                          : "border-gray-700 bg-gray-800 text-gray-500"
                      }`}
                    >
                      <span className="text-xl mb-0.5">{m.emoji}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </FormField>
              <FormField label="Followed Plan?">
                <div className="flex gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => set("followedPlan", form.followedPlan === true ? null : true)}
                    className={`flex-1 py-2.5 rounded-lg border font-medium text-sm transition-colors ${
                      form.followedPlan === true
                        ? "border-green-600 bg-green-950 text-green-400"
                        : "border-gray-700 bg-gray-800 text-gray-500"
                    }`}
                  >
                    ✓ Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => set("followedPlan", form.followedPlan === false ? null : false)}
                    className={`flex-1 py-2.5 rounded-lg border font-medium text-sm transition-colors ${
                      form.followedPlan === false
                        ? "border-red-600 bg-red-950 text-red-400"
                        : "border-gray-700 bg-gray-800 text-gray-500"
                    }`}
                  >
                    ✗ No
                  </button>
                </div>
              </FormField>
            </div>
          </div>
        )}

        {/* Notes sections */}
        <Section
          label="Why I Entered — Setup"
          value={entry.entryReason}
          editing={editing}
          formValue={form.entryReason}
          onChange={(v) => set("entryReason", v)}
          placeholder="Setup, confluence, key levels..."
        />
        <Section
          label="Session Notes"
          value={entry.description}
          editing={editing}
          formValue={form.description}
          onChange={(v) => set("description", v)}
          placeholder="Overall session summary..."
        />
        <Section
          label="Mistakes / Missed Trades"
          value={entry.mistakesOrMissed}
          editing={editing}
          formValue={form.mistakesOrMissed}
          onChange={(v) => set("mistakesOrMissed", v)}
          placeholder="What went wrong? What setups did you miss?"
        />
        <Section
          label="Lessons Learned"
          value={entry.lessons}
          editing={editing}
          formValue={form.lessons}
          onChange={(v) => set("lessons", v)}
          placeholder="What will you do differently?"
        />

        {/* Individual Trades */}
        {entry.trades.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Individual Trades ({entry.trades.length})
            </h2>
            <div className="space-y-3">
              {entry.trades.map((t, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-4 flex-wrap text-sm">
                    <span
                      className={`font-bold text-base ${
                        t.direction === "long" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {t.direction?.toUpperCase()}
                    </span>
                    <span className="text-gray-400">
                      {t.contracts} contract{t.contracts !== 1 ? "s" : ""}
                    </span>
                    {t.entryPrice && (
                      <span className="text-gray-400">
                        Entry{" "}
                        <span className="text-white font-medium">${t.entryPrice}</span>
                      </span>
                    )}
                    {t.exitPrice && (
                      <span className="text-gray-400">
                        Exit{" "}
                        <span className="text-white font-medium">${t.exitPrice}</span>
                      </span>
                    )}
                    {t.entryTime && (
                      <span className="text-gray-500 text-xs">
                        {t.entryTime}
                        {t.exitTime ? ` – ${t.exitTime}` : ""}
                      </span>
                    )}
                    <span
                      className={`font-bold ml-auto ${
                        Number(t.pnl) >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {Number(t.pnl) >= 0 ? "+" : ""}${Number(t.pnl).toFixed(2)}
                    </span>
                  </div>
                  {t.notes && (
                    <p className="text-gray-500 text-xs mt-2">{t.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Screenshots */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Screenshots / Charts ({entry.screenshots.length + newPreviews.length})
          </h2>

          {entry.screenshots.length === 0 && newPreviews.length === 0 && !editing && (
            <p className="text-gray-700 text-sm italic">No screenshots attached</p>
          )}

          {/* Existing screenshots */}
          {entry.screenshots.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              {entry.screenshots.map((file) => (
                <div
                  key={file}
                  className="relative group rounded-lg overflow-hidden border border-gray-700 aspect-video bg-gray-800 cursor-pointer"
                  onClick={() => setLightbox(file)}
                >
                  <img
                    src={`${API}/uploads/${file}`}
                    alt="Screenshot"
                    className="w-full h-full object-cover"
                  />
                  {editing && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScreenshot(file);
                      }}
                      className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  )}
                  {!editing && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                        🔍
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* New screenshot previews */}
          {newPreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              {newPreviews.map((src, i) => (
                <div
                  key={i}
                  className="relative rounded-lg overflow-hidden border border-blue-700 aspect-video"
                >
                  <img src={src} alt="New screenshot" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">
                    new
                  </span>
                </div>
              ))}
            </div>
          )}

          {editing && entry.screenshots.length + newPreviews.length < 5 && (
            <label className="cursor-pointer flex items-center justify-center w-full h-16 border-2 border-dashed border-gray-700 rounded-xl hover:border-gray-500 transition-colors">
              <p className="text-gray-500 text-sm">+ Upload or paste more screenshots</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleNewScreenshots}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
