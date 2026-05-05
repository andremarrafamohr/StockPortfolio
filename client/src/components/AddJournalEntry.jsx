import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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

function FormField({ label, children }) {
  return (
    <div>
      <label className="app-label">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "app-input text-sm";

function TradeRow({ trade, index, onChange, onRemove }) {
  return (
    <div className="app-card-soft p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[color:var(--app-text-muted)] font-medium">Trade #{index + 1}</span>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-500 hover:opacity-80 text-xs font-medium"
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-[color:var(--app-text-soft)] block mb-1">Direction</label>
          <select
            value={trade.direction}
            onChange={(e) => onChange(index, "direction", e.target.value)}
            className={inputClass}
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-[color:var(--app-text-soft)] block mb-1">Contracts</label>
          <input
            type="number"
            min="1"
            value={trade.contracts}
            onChange={(e) => onChange(index, "contracts", e.target.value)}
            className={inputClass}
            placeholder="1"
          />
        </div>
        <div>
          <label className="text-xs text-[color:var(--app-text-soft)] block mb-1">Entry Price</label>
          <input
            type="number"
            step="0.25"
            value={trade.entryPrice}
            onChange={(e) => onChange(index, "entryPrice", e.target.value)}
            className={inputClass}
            placeholder="5000.00"
          />
        </div>
        <div>
          <label className="text-xs text-[color:var(--app-text-soft)] block mb-1">Exit Price</label>
          <input
            type="number"
            step="0.25"
            value={trade.exitPrice}
            onChange={(e) => onChange(index, "exitPrice", e.target.value)}
            className={inputClass}
            placeholder="5010.00"
          />
        </div>
        <div>
          <label className="text-xs text-[color:var(--app-text-soft)] block mb-1">Entry Time (EST)</label>
          <input
            type="time"
            value={trade.entryTime}
            onChange={(e) => onChange(index, "entryTime", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-[color:var(--app-text-soft)] block mb-1">Exit Time (EST)</label>
          <input
            type="time"
            value={trade.exitTime}
            onChange={(e) => onChange(index, "exitTime", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-[color:var(--app-text-soft)] block mb-1">Trade P&L ($)</label>
          <input
            type="number"
            step="0.01"
            value={trade.pnl}
            onChange={(e) => onChange(index, "pnl", e.target.value)}
            className={`${inputClass} ${
              parseFloat(trade.pnl) > 0
                ? "text-green-400"
                : parseFloat(trade.pnl) < 0
                ? "text-red-400"
                : ""
            }`}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="text-xs text-[color:var(--app-text-soft)] block mb-1">Notes</label>
          <input
            type="text"
            value={trade.notes}
            onChange={(e) => onChange(index, "notes", e.target.value)}
            className={inputClass}
            placeholder="Optional..."
          />
        </div>
      </div>
    </div>
  );
}

export default function AddJournalEntry() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const todayStr = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    account: "",
    date: todayStr,
    instrument: "ES",
    customInstrument: "",
    pnl: "",
    riskReward: "",
    mood: "",
    followedPlan: null,
    entryReason: "",
    description: "",
    mistakesOrMissed: "",
    lessons: "",
  });
  const [trades, setTrades] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/accounts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAccounts(data.accounts || []);
        const defaultAccount = data.defaultAccountId || data.accounts?.[0]?._id || "";
        setForm((prev) => ({ ...prev, account: prev.account || defaultAccount }));
      } catch (error) {
        console.error(error);
      }
    };

    loadAccounts();
  }, [token]);

  const addScreenshotFiles = (files) => {
    setScreenshots((prevScreenshots) => {
      const remaining = 5 - prevScreenshots.length;
      const toAdd = files.slice(0, remaining);

      if (toAdd.length > 0) {
        setPreviews((prevPreviews) => [
          ...prevPreviews,
          ...toAdd.map((file) => URL.createObjectURL(file)),
        ]);
      }

      return [...prevScreenshots, ...toAdd];
    });
  };

  const handleScreenshots = (e) => {
    addScreenshotFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  useEffect(() => {
    const handlePaste = (event) => {
      const pastedFiles = Array.from(event.clipboardData?.items || [])
        .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter(Boolean);

      if (pastedFiles.length === 0) return;

      event.preventDefault();
      addScreenshotFiles(pastedFiles);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  useEffect(
    () => () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    },
    [previews]
  );

  const removeScreenshot = (index) => {
    URL.revokeObjectURL(previews[index]);
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const addTrade = () => {
    setTrades((prev) => [
      ...prev,
      { direction: "long", contracts: 1, entryPrice: "", exitPrice: "", entryTime: "", exitTime: "", pnl: "", notes: "" },
    ]);
  };

  const updateTrade = (index, key, val) => {
    setTrades((prev) => prev.map((t, i) => (i === index ? { ...t, [key]: val } : t)));
  };

  const removeTrade = (index) => {
    setTrades((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const instrument = form.instrument === "Other" ? form.customInstrument.trim() : form.instrument;

    const formData = new FormData();
    formData.append("date", form.date);
    formData.append("account", form.account || "");
    formData.append("instrument", instrument || "ES");
    formData.append("pnl", form.pnl || "0");
    formData.append("riskReward", form.riskReward);
    formData.append("mood", form.mood);
    formData.append("followedPlan", form.followedPlan === null ? "" : String(form.followedPlan));
    formData.append("entryReason", form.entryReason);
    formData.append("description", form.description);
    formData.append("mistakesOrMissed", form.mistakesOrMissed);
    formData.append("lessons", form.lessons);
    if (trades.length > 0) formData.append("trades", JSON.stringify(trades));
    screenshots.forEach((f) => formData.append("screenshots", f));

    try {
      await axios.post(`${API_BASE_URL}/api/journal`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      navigate("/journal");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save entry");
      setSaving(false);
    }
  };

  const pnlNum = parseFloat(form.pnl);
  const pnlColor = pnlNum > 0 ? "text-green-400" : pnlNum < 0 ? "text-red-400" : "text-white";

  return (
    <div className="app-shell text-[color:var(--app-text)]">
      <header className="app-header px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4">
          <Link to="/journal" className="text-[color:var(--app-primary)] hover:opacity-80 text-sm">
          ← Back to Journal
          </Link>
          <ThemeToggle />
        </div>
        <h1 className="text-xl font-bold text-[color:var(--app-text)] mt-3">Log Trading Session</h1>
      </header>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-6 py-8 space-y-6 pb-12">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Date / Instrument / P&L / Risk:Reward */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <FormField label="Trading Date">
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="app-input"
              required
            />
          </FormField>

          <FormField label="Instrument">
            <select
              value={form.instrument}
              onChange={(e) => set("instrument", e.target.value)}
              className="app-input"
            >
              {INSTRUMENTS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
            {form.instrument === "Other" && (
              <input
                type="text"
                value={form.customInstrument}
                onChange={(e) => set("customInstrument", e.target.value)}
                className="app-input mt-2"
                placeholder="e.g. NKD, 6J, ZN..."
              />
            )}
          </FormField>

          <FormField label="Day P&L ($)">
            <input
              type="number"
              step="0.01"
              value={form.pnl}
              onChange={(e) => set("pnl", e.target.value)}
              className={`app-input text-lg font-bold ${pnlColor}`}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Session R:R (1:x)">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.riskReward}
              onChange={(e) => set("riskReward", e.target.value)}
              className="app-input"
              placeholder="2.00"
            />
          </FormField>

          <FormField label="Account">
            <select
              value={form.account}
              onChange={(e) => set("account", e.target.value)}
              className="app-input"
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Mood + Followed Plan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="How did you feel?">
            <div className="flex gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => set("mood", form.mood === m.value ? "" : m.value)}
                  className={`flex flex-col items-center px-3 py-2 rounded-lg border text-xs transition-colors ${
                    form.mood === m.value
                      ? "border-blue-500 bg-blue-950 text-white"
                      : "border-gray-700 bg-gray-800 text-gray-500 hover:border-gray-600"
                  }`}
                >
                  <span className="text-xl mb-0.5">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Followed your trading plan?">
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={() => set("followedPlan", form.followedPlan === true ? null : true)}
                className={`flex-1 py-2.5 rounded-lg border font-medium text-sm transition-colors ${
                  form.followedPlan === true
                    ? "border-green-600 bg-green-950 text-green-400"
                    : "border-gray-700 bg-gray-800 text-gray-500 hover:border-gray-600"
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
                    : "border-gray-700 bg-gray-800 text-gray-500 hover:border-gray-600"
                }`}
              >
                ✗ No
              </button>
            </div>
          </FormField>
        </div>

        {/* Text sections */}
        <FormField label="Why I Entered — Setup & Confirmation">
          <textarea
            value={form.entryReason}
            onChange={(e) => set("entryReason", e.target.value)}
            className={`${inputClass} h-28 resize-none`}
            placeholder="What did you see? Key levels, structure, confluence signals... Why did you take this trade?"
          />
        </FormField>

        <FormField label="Session Notes — What Happened">
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={`${inputClass} h-28 resize-none`}
            placeholder="Overall session summary. Market conditions, how you felt in execution, notable moments..."
          />
        </FormField>

        <FormField label="Mistakes / Missed Trades / Why I Didn't Enter">
          <textarea
            value={form.mistakesOrMissed}
            onChange={(e) => set("mistakesOrMissed", e.target.value)}
            className={`${inputClass} h-28 resize-none`}
            placeholder="What went wrong? Setups you skipped and why. FOMO moments. Execution errors. Broke rules?"
          />
        </FormField>

        <FormField label="Lessons Learned">
          <textarea
            value={form.lessons}
            onChange={(e) => set("lessons", e.target.value)}
            className={`${inputClass} h-24 resize-none`}
            placeholder="What will you do differently tomorrow? Key takeaways to lock in..."
          />
        </FormField>

        {/* Individual Trades */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-300">
              Individual Trades{" "}
              <span className="text-gray-600 font-normal">(optional)</span>
            </h2>
            <button
              type="button"
              onClick={addTrade}
              className="text-blue-500 hover:text-blue-400 text-sm font-medium"
            >
              + Add Trade
            </button>
          </div>
          <div className="space-y-3">
            {trades.map((trade, i) => (
              <TradeRow
                key={i}
                trade={trade}
                index={i}
                onChange={updateTrade}
                onRemove={removeTrade}
              />
            ))}
            {trades.length === 0 && (
              <p className="text-gray-700 text-sm text-center py-4 border border-dashed border-gray-800 rounded-lg">
                No trades added — click "+ Add Trade" to log individual entries
              </p>
            )}
          </div>
        </div>

        {/* Screenshots */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-300">
              Screenshots / Charts{" "}
              <span className="text-gray-600 font-normal">({screenshots.length}/5)</span>
            </h2>
          </div>

          <p className="text-xs text-[color:var(--app-text-soft)] mb-2">
            Tip: depois de usar PrtScr, cola aqui com Ctrl+V.
          </p>

          {screenshots.length < 5 && (
            <label className="cursor-pointer flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[color:var(--app-border)] rounded-xl hover:border-[color:var(--app-primary)]/40 transition-colors bg-[color:var(--app-surface)]">
              <p className="text-[color:var(--app-text-muted)] text-sm">Click to upload or paste screenshots</p>
              <p className="text-[color:var(--app-text-soft)] text-xs mt-1">PNG, JPG, GIF, WebP · max 10 MB each</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleScreenshots}
                className="hidden"
              />
            </label>
          )}

          {previews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              {previews.map((src, i) => (
                <div
                  key={i}
                  className="relative group rounded-lg overflow-hidden border border-[color:var(--app-border)] aspect-video bg-[color:var(--app-surface-soft)]"
                >
                  <img src={src} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeScreenshot(i)}
                    className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-400 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="app-button-primary flex-1 font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Session"}
          </button>
          <Link
            to="/journal"
            className="app-button-secondary px-8 py-3 text-center text-sm font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
