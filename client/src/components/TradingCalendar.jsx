import { useState } from "react";
import { useNavigate } from "react-router-dom";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatPnl(pnl) {
  const abs = Math.abs(pnl);
  const str = abs >= 1000 ? `${(abs / 1000).toFixed(1)}k` : abs.toFixed(0);
  return `${pnl >= 0 ? "+" : "-"}$${str}`;
}

export default function TradingCalendar({ entries }) {
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const navigate = useNavigate();

  const year = current.getFullYear();
  const month = current.getMonth();

  // Map "YYYY-MM-DD" → entry
  const entryMap = {};
  for (const e of entries) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    entryMap[key] = e;
  }

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const monthEntries = entries.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const monthPnl = monthEntries.reduce((s, e) => s + e.pnl, 0);
  const monthWins = monthEntries.filter((e) => e.pnl > 0).length;
  const monthLosses = monthEntries.filter((e) => e.pnl < 0).length;

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1));
  const goToday = () => {
    const d = new Date();
    setCurrent(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  return (
    <div className="app-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="app-section-title">Calendar</p>
          <div className="flex items-center gap-3 mt-1">
            <h3 className="text-[color:var(--app-text)] font-semibold">
              {MONTH_NAMES[month]} {year}
            </h3>
            {monthEntries.length > 0 && (
              <>
                <span className={`text-sm font-bold ${monthPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {monthPnl >= 0 ? "+" : ""}${Math.abs(monthPnl).toFixed(2)}
                </span>
                <span className="text-xs text-[color:var(--app-text-soft)]">
                  {monthWins}W · {monthLosses}L
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[color:var(--app-text-muted)] hover:bg-[color:var(--app-surface-soft)] transition-colors text-xl leading-none"
          >
            ‹
          </button>
          <button
            onClick={goToday}
            className="px-2.5 h-8 text-xs text-[color:var(--app-text-muted)] hover:bg-[color:var(--app-surface-soft)] rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[color:var(--app-text-muted)] hover:bg-[color:var(--app-surface-soft)] transition-colors text-xl leading-none"
          >
            ›
          </button>
        </div>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs text-[color:var(--app-text-soft)] font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`pad-${i}`} />;

          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const entry = entryMap[key];
          const isToday = key === todayKey;
          const colIndex = i % 7;
          const isWeekend = colIndex === 0 || colIndex === 6;

          let bg, border, dayNumColor, pnlColor;

          if (entry) {
            if (entry.pnl > 0) {
              bg = "bg-green-500/10";
              border = "border-green-500/25 hover:border-green-500/60";
              dayNumColor = "text-green-300";
              pnlColor = "text-green-400";
            } else if (entry.pnl < 0) {
              bg = "bg-red-500/10";
              border = "border-red-500/25 hover:border-red-500/60";
              dayNumColor = "text-red-300";
              pnlColor = "text-red-400";
            } else {
              bg = "bg-[color:var(--app-surface-soft)]";
              border = "border-[color:var(--app-border)] hover:border-[color:var(--app-primary)]/35";
              dayNumColor = "text-[color:var(--app-text)]";
              pnlColor = "text-[color:var(--app-text-soft)]";
            }
          } else {
            bg = isWeekend ? "bg-[color:var(--app-surface-soft)] opacity-40" : "bg-[color:var(--app-surface-soft)]";
            border = "border-[color:var(--app-border)]";
            dayNumColor = isToday ? "text-[color:var(--app-primary)] font-bold" : "text-[color:var(--app-text-soft)]";
            pnlColor = "";
          }

          return (
            <div
              key={key}
              onClick={() => entry && navigate(`/journal/${entry._id}`)}
              className={`rounded-lg border ${bg} ${border} ${isToday ? "ring-2 ring-blue-500" : ""} ${entry ? "cursor-pointer" : ""} flex flex-col items-center justify-center py-1.5 min-h-[3.5rem] transition-colors`}
            >
              <span className={`text-xs font-medium ${dayNumColor}`}>{day}</span>
              {entry && (
                <span className={`text-xs font-bold leading-none mt-0.5 ${pnlColor}`}>
                  {formatPnl(entry.pnl)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
