import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import TradingCalendar from "./TradingCalendar";
import ThemeToggle from "./ThemeToggle";
import { API_BASE_URL } from "../config/api";

const moodEmoji = {
  great: "😄",
  good: "🙂",
  neutral: "😐",
  bad: "😕",
  terrible: "😞",
  "": "",
};

function getMarketGroup(instrument = "") {
  const code = instrument.toUpperCase();
  if (code.includes("ES") || code.includes("MES") || code.includes("SP")) return "sp500";
  if (code.includes("NQ") || code.includes("MNQ") || code.includes("NAS")) return "nasdaq";
  return "other";
}

function marketLabel(group) {
  if (group === "sp500") return "S&P 500";
  if (group === "nasdaq") return "NASDAQ";
  return "Other";
}

function PnlChart({ entries }) {
  if (entries.length < 2) return null;

  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  let cumulative = 0;
  const points = sorted.map((e) => {
    cumulative += e.pnl;
    return cumulative;
  });

  const min = Math.min(0, ...points);
  const max = Math.max(0, ...points);
  const range = max - min || 1;
  const W = 600, H = 100, PAD = 8;
  const xStep = (W - PAD * 2) / Math.max(points.length - 1, 1);
  const toX = (i) => PAD + i * xStep;
  const toY = (v) => PAD + ((max - v) / range) * (H - PAD * 2);
  const zeroY = toY(0);

  const pathD = points.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(" ");
  const areaD = `${pathD} L ${toX(points.length - 1).toFixed(1)} ${zeroY.toFixed(1)} L ${toX(0).toFixed(1)} ${zeroY.toFixed(1)} Z`;

  const isPositive = points[points.length - 1] >= 0;
  const lineColor = isPositive ? "#22c55e" : "#ef4444";
  const areaColor = isPositive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY} stroke="#374151" strokeWidth="1" strokeDasharray="4" />
      <path d={areaD} fill={areaColor} />
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" />
      {points.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill={lineColor} />
      ))}
    </svg>
  );
}

function StatCard({ label, value, sub, colorClass }) {
  return (
    <div className="app-card-soft p-4">
      <p className="text-xs uppercase tracking-wider text-[color:var(--app-text-soft)] mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-[color:var(--app-text-soft)] text-xs mt-1">{sub}</p>
    </div>
  );
}

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterResult, setFilterResult] = useState("all");
  const [filterInstrument, setFilterInstrument] = useState("all");
  const [filterMarket, setFilterMarket] = useState("all");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      axios.get(`${API_BASE_URL}/api/journal`, { headers }),
      axios.get(`${API_BASE_URL}/api/journal/stats`, { headers }),
    ])
      .then(([entriesRes, statsRes]) => {
        setEntries(entriesRes.data);
        setStats(statsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const instruments = [...new Set(entries.map((e) => e.instrument).filter(Boolean))].sort();

  const filteredEntries = entries.filter((e) => {
    if (filterResult === "win" && e.pnl <= 0) return false;
    if (filterResult === "loss" && e.pnl >= 0) return false;
    if (filterInstrument !== "all" && e.instrument !== filterInstrument) return false;
    if (filterMarket !== "all" && getMarketGroup(e.instrument) !== filterMarket) return false;
    return true;
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="text-[color:var(--app-text-muted)] text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app-shell text-[color:var(--app-text)]">
      <header className="app-header sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[color:var(--app-text)]">Trading Journal</h1>
          <p className="text-xs text-[color:var(--app-text-muted)] mt-0.5">Manual Session Logging</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/journal/new"
            className="app-button-primary text-sm font-semibold px-4 py-2"
          >
            + New Session
          </Link>
          <button
            onClick={handleLogout}
            className="app-button-secondary text-sm px-3 py-2"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {stats && stats.totalDays > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Win Rate"
                value={`${stats.winRate}%`}
                sub={`${stats.winningDays}W · ${stats.losingDays}L`}
                colorClass={stats.winRate >= 50 ? "text-green-400" : "text-red-400"}
              />
              <StatCard
                label="Total P&L"
                value={`${stats.totalPnl >= 0 ? "+" : ""}$${Math.abs(stats.totalPnl).toFixed(2)}`}
                sub={`${stats.totalDays} session${stats.totalDays !== 1 ? "s" : ""}`}
                colorClass={stats.totalPnl >= 0 ? "text-green-400" : "text-red-400"}
              />
              <StatCard
                label="Avg Daily P&L"
                value={`${stats.avgPnl >= 0 ? "+" : ""}$${Math.abs(stats.avgPnl).toFixed(2)}`}
                sub="per session"
                colorClass={stats.avgPnl >= 0 ? "text-green-400" : "text-red-400"}
              />
              <StatCard
                label="Current Streak"
                value={`${stats.currentStreak > 0 ? "+" : ""}${stats.currentStreak}`}
                sub={`Max W: ${stats.maxWinStreak} / L: ${stats.maxLossStreak}`}
                colorClass={
                  stats.currentStreak > 0
                    ? "text-green-400"
                    : stats.currentStreak < 0
                    ? "text-red-400"
                    : "text-gray-400"
                }
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Profit Factor"
                value={stats.profitFactor !== null ? stats.profitFactor.toFixed(2) : "-"}
                sub="gross wins / gross losses"
                colorClass={
                  stats.profitFactor === null
                    ? "text-gray-400"
                    : stats.profitFactor >= 1.5
                    ? "text-green-400"
                    : stats.profitFactor >= 1
                    ? "text-yellow-400"
                    : "text-red-400"
                }
              />
              <StatCard
                label="Avg Win Day"
                value={stats.avgWinDay > 0 ? `+$${stats.avgWinDay.toFixed(2)}` : "-"}
                sub={`over ${stats.winningDays} winning day${stats.winningDays !== 1 ? "s" : ""}`}
                colorClass="text-green-400"
              />
              <StatCard
                label="Avg Loss Day"
                value={stats.avgLossDay < 0 ? `$${stats.avgLossDay.toFixed(2)}` : "-"}
                sub={`over ${stats.losingDays} losing day${stats.losingDays !== 1 ? "s" : ""}`}
                colorClass="text-red-400"
              />
              <StatCard
                label="Risk : Reward"
                value={stats.riskReward !== null ? `1 : ${stats.riskReward.toFixed(2)}` : "-"}
                sub="avg win vs avg loss"
                colorClass={
                  stats.riskReward === null
                    ? "text-gray-400"
                    : stats.riskReward >= 2
                    ? "text-green-400"
                    : stats.riskReward >= 1
                    ? "text-yellow-400"
                    : "text-red-400"
                }
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Expectancy / Day"
                value={`${stats.expectancy >= 0 ? "+" : ""}$${Math.abs(stats.expectancy).toFixed(2)}`}
                sub="expected value per day"
                colorClass={stats.expectancy >= 0 ? "text-green-400" : "text-red-400"}
              />
              <StatCard
                label="Total Trades"
                value={stats.totalTrades}
                sub="individual executions"
                colorClass="text-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="app-card p-4">
                <p className="text-xs text-gray-500 mb-1">Best Day</p>
                <p className="text-green-400 text-2xl font-bold">+${stats.bestDay.pnl.toFixed(2)}</p>
                <p className="text-[color:var(--app-text-soft)] text-xs mt-1">
                  {new Date(stats.bestDay.date).toLocaleDateString("en-US", {
                    weekday: "short", month: "short", day: "numeric", year: "numeric",
                  })}
                </p>
              </div>
              <div className="app-card p-4">
                <p className="text-xs text-gray-500 mb-1">Worst Day</p>
                <p className="text-red-400 text-2xl font-bold">${stats.worstDay.pnl.toFixed(2)}</p>
                <p className="text-[color:var(--app-text-soft)] text-xs mt-1">
                  {new Date(stats.worstDay.date).toLocaleDateString("en-US", {
                    weekday: "short", month: "short", day: "numeric", year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {entries.length > 1 && (
              <div className="app-card p-5">
                <h2 className="app-section-title mb-4">
                  Cumulative P&L
                </h2>
                <PnlChart entries={entries} />
              </div>
            )}

            <TradingCalendar entries={entries} />
          </>
        )}

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="app-section-title">
              Trading Sessions ({filteredEntries.length}{filteredEntries.length !== entries.length ? ` of ${entries.length}` : ""})
            </h2>

            {entries.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg overflow-hidden border border-gray-700">
                  {[
                    { key: "all", label: "All" },
                    { key: "sp500", label: "S&P 500" },
                    { key: "nasdaq", label: "NASDAQ" },
                  ].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setFilterMarket(m.key)}
                      className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                        filterMarket === m.key
                          ? m.key === "sp500"
                            ? "bg-blue-700 text-white"
                            : m.key === "nasdaq"
                            ? "bg-cyan-700 text-white"
                            : "bg-gray-700 text-white"
                          : "bg-gray-900 text-gray-400 hover:text-white"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="flex rounded-lg overflow-hidden border border-gray-700">
                  {["all", "win", "loss"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setFilterResult(r)}
                      className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                        filterResult === r
                          ? r === "win"
                            ? "bg-green-700 text-white"
                            : r === "loss"
                            ? "bg-red-700 text-white"
                            : "bg-gray-700 text-white"
                          : "bg-gray-900 text-gray-400 hover:text-white"
                      }`}
                    >
                      {r === "all" ? "All" : r === "win" ? "Wins" : "Losses"}
                    </button>
                  ))}
                </div>

                {instruments.length > 1 && (
                  <select
                    value={filterInstrument}
                    onChange={(e) => setFilterInstrument(e.target.value)}
                    className="app-input text-xs py-2 px-3"
                  >
                    <option value="all">All Instruments</option>
                    {instruments.map((inst) => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {entries.length === 0 ? (
            <div className="app-empty p-16 text-center">
              <p className="text-5xl mb-4">📈</p>
              <p className="text-[color:var(--app-text)] text-lg font-medium mb-2">No sessions yet</p>
              <p className="text-[color:var(--app-text-soft)] text-sm mb-8">
                Start logging your sessions to track performance
              </p>
              <Link
                to="/journal/new"
                className="app-button-primary text-sm font-semibold px-6 py-3"
              >
                Log First Session
              </Link>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="app-empty p-10 text-center">
              <p className="text-[color:var(--app-text-muted)] text-sm">No sessions match the current filters.</p>
              <button
                onClick={() => {
                  setFilterResult("all");
                  setFilterInstrument("all");
                  setFilterMarket("all");
                }}
                className="mt-3 text-[color:var(--app-primary)] hover:opacity-80 text-xs underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <Link
                  key={entry._id}
                  to={`/journal/${entry._id}`}
                  className="block app-card p-5 transition-all hover:border-[color:var(--app-primary)]/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`text-2xl font-bold shrink-0 ${
                          entry.pnl >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {entry.pnl >= 0 ? "+" : ""}${Math.abs(entry.pnl).toFixed(2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap text-sm">
                          <span className="font-semibold text-white">{entry.instrument}</span>
                          <span className="app-badge app-badge-neutral">
                            {marketLabel(getMarketGroup(entry.instrument))}
                          </span>
                          <span className="text-[color:var(--app-text-soft)]">·</span>
                          <span className="text-[color:var(--app-text-muted)]">
                            {new Date(entry.date).toLocaleDateString("en-US", {
                              weekday: "short", month: "short", day: "numeric", year: "numeric",
                            })}
                          </span>
                          {entry.mood && <span className="text-base">{moodEmoji[entry.mood]}</span>}
                          {entry.followedPlan === true && <span className="app-badge app-badge-success">✓ plan</span>}
                          {entry.followedPlan === false && <span className="app-badge app-badge-danger">✗ plan</span>}
                          {entry.riskReward !== null && entry.riskReward !== undefined && (
                            <span className="app-badge app-badge-primary">R:R 1:{Number(entry.riskReward).toFixed(2)}</span>
                          )}
                        </div>
                        {entry.description && (
                          <p className="text-[color:var(--app-text-soft)] text-xs mt-1 truncate">{entry.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {entry.trades.length > 0 && (
                        <span className="text-xs text-[color:var(--app-text-soft)]">
                          {entry.trades.length} trade{entry.trades.length !== 1 ? "s" : ""}
                        </span>
                      )}
                      {entry.screenshots.length > 0 && (
                        <span className="text-xs text-[color:var(--app-text-soft)]">📷 {entry.screenshots.length}</span>
                      )}
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          entry.pnl > 0
                            ? "app-badge app-badge-success"
                            : entry.pnl < 0
                            ? "app-badge app-badge-danger"
                            : "app-badge app-badge-neutral"
                        }`}
                      >
                        {entry.pnl > 0 ? "WIN" : entry.pnl < 0 ? "LOSS" : "FLAT"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
