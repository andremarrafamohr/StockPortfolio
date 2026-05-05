import { useEffect, useMemo, useState } from "react";
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

const VIEW_OPTIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "journal", label: "Journal" },
  { key: "calendar", label: "Calendar" },
];

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

function formatMoney(value) {
  const amount = Number(value || 0);
  return `${amount >= 0 ? "+" : "-"}$${Math.abs(amount).toFixed(2)}`;
}

function PnlChart({ entries }) {
  if (entries.length < 2) return null;

  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  let cumulative = 0;
  const points = sorted.map((entry) => {
    cumulative += entry.pnl;
    return cumulative;
  });

  const min = Math.min(0, ...points);
  const max = Math.max(0, ...points);
  const range = max - min || 1;
  const width = 600;
  const height = 110;
  const padding = 10;
  const xStep = (width - padding * 2) / Math.max(points.length - 1, 1);
  const toX = (index) => padding + index * xStep;
  const toY = (value) => padding + ((max - value) / range) * (height - padding * 2);
  const zeroY = toY(0);

  const pathD = points.map((value, index) => `${index === 0 ? "M" : "L"} ${toX(index).toFixed(1)} ${toY(value).toFixed(1)}`).join(" ");
  const areaD = `${pathD} L ${toX(points.length - 1).toFixed(1)} ${zeroY.toFixed(1)} L ${toX(0).toFixed(1)} ${zeroY.toFixed(1)} Z`;
  const isPositive = points[points.length - 1] >= 0;
  const lineColor = isPositive ? "#22c55e" : "#ef4444";
  const areaColor = isPositive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="color-mix(in srgb, var(--app-text-soft) 40%, transparent)" strokeWidth="1" strokeDasharray="4" />
      <path d={areaD} fill={areaColor} />
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinejoin="round" />
      {points.map((value, index) => (
        <circle key={index} cx={toX(index)} cy={toY(value)} r="3" fill={lineColor} />
      ))}
    </svg>
  );
}

function StatCard({ label, value, sub, colorClass }) {
  return (
    <div className="app-card-soft p-4">
      <p className="app-section-title mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-[color:var(--app-text-soft)] text-xs mt-1">{sub}</p>
    </div>
  );
}

function EmptyState({ title, description, action }) {
  return (
    <div className="app-empty p-12 text-center">
      <p className="text-5xl mb-4">📈</p>
      <p className="text-[color:var(--app-text)] text-lg font-semibold mb-2">{title}</p>
      <p className="text-[color:var(--app-text-soft)] text-sm mb-8 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  );
}

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [defaultAccountId, setDefaultAccountId] = useState("all");
  const [selectedAccountId, setSelectedAccountId] = useState(() => localStorage.getItem("stockportfolio-selected-account-id") || "all");
  const [activeView, setActiveView] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [accountLoading, setAccountLoading] = useState(true);
  const [filterResult, setFilterResult] = useState("all");
  const [filterInstrument, setFilterInstrument] = useState("all");
  const [filterMarket, setFilterMarket] = useState("all");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    let active = true;

    const loadAccounts = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/accounts`, { headers });
        if (!active) return;
        setAccounts(data.accounts || []);
        setDefaultAccountId(data.defaultAccountId || "all");

        const savedAccountId = localStorage.getItem("stockportfolio-selected-account-id");
        if (!savedAccountId && data.defaultAccountId) {
          setSelectedAccountId("all");
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setAccountLoading(false);
      }
    };

    loadAccounts();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("stockportfolio-selected-account-id", selectedAccountId);
  }, [selectedAccountId]);

  useEffect(() => {
    const query = selectedAccountId && selectedAccountId !== "all" ? `?account=${selectedAccountId}` : "";

    setLoading(true);
    Promise.all([
      axios.get(`${API_BASE_URL}/api/journal${query}`, { headers }),
      axios.get(`${API_BASE_URL}/api/journal/stats${query}`, { headers }),
    ])
      .then(([entriesRes, statsRes]) => {
        setEntries(entriesRes.data || []);
        setStats(statsRes.data || null);
      })
      .catch((error) => {
        console.error(error);
        setEntries([]);
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, [selectedAccountId]);

  const currentAccount = useMemo(
    () => accounts.find((account) => String(account._id) === String(selectedAccountId)),
    [accounts, selectedAccountId]
  );

  const instruments = [...new Set(entries.map((entry) => entry.instrument).filter(Boolean))].sort();

  const filteredEntries = entries.filter((entry) => {
    if (filterResult === "win" && entry.pnl <= 0) return false;
    if (filterResult === "loss" && entry.pnl >= 0) return false;
    if (filterInstrument !== "all" && entry.instrument !== filterInstrument) return false;
    if (filterMarket !== "all" && getMarketGroup(entry.instrument) !== filterMarket) return false;
    return true;
  });

  const recentEntries = [...entries].slice(0, 5);
  const accountLabel = selectedAccountId === "all" ? "All Accounts" : currentAccount?.name || "Selected Account";

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleCreateAccount = async () => {
    const name = window.prompt("Account name");
    if (!name || !name.trim()) return;

    const startingBalance = window.prompt("Starting balance (optional)", "0");

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/accounts`,
        {
          name: name.trim(),
          startingBalance: startingBalance || 0,
        },
        { headers }
      );
      setAccounts((prev) => [...prev, data]);
      setSelectedAccountId(String(data._id));
    } catch (error) {
      window.alert(error.response?.data?.message || "Failed to create account");
    }
  };

  const refreshFilters = () => {
    setFilterResult("all");
    setFilterInstrument("all");
    setFilterMarket("all");
  };

  if (loading || accountLoading) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="text-[color:var(--app-text-muted)] text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app-shell text-[color:var(--app-text)]">
      <header className="app-header sticky top-0 z-10 px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--app-surface)] border border-[color:var(--app-border)] shadow-lg">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[color:var(--app-text)]">StockPortfolio</h1>
              <p className="text-sm text-[color:var(--app-text-muted)]">{accountLabel}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="app-input min-w-[180px] text-sm py-2.5"
            >
              <option value="all">All Accounts</option>
              {accounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleCreateAccount} className="app-button-secondary px-4 py-2.5 text-sm font-semibold">
              + Account
            </button>
            <Link to="/journal/new" className="app-button-primary px-4 py-2.5 text-sm font-semibold">
              + New Session
            </Link>
            <button onClick={handleLogout} className="app-button-secondary px-4 py-2.5 text-sm">
              Logout
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {VIEW_OPTIONS.map((view) => (
            <button
              key={view.key}
              type="button"
              onClick={() => setActiveView(view.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeView === view.key
                  ? "bg-[color:var(--app-primary)]/15 text-[color:var(--app-primary)] border border-[color:var(--app-primary)]/25"
                  : "bg-[color:var(--app-surface)] text-[color:var(--app-text-muted)] border border-[color:var(--app-border)] hover:border-[color:var(--app-primary)]/25"
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8 pb-12">
        {activeView === "dashboard" && (
          <>
            {stats ? (
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
                    value={formatMoney(stats.totalPnl)}
                    sub={`${stats.totalDays} session${stats.totalDays !== 1 ? "s" : ""}`}
                    colorClass={stats.totalPnl >= 0 ? "text-green-400" : "text-red-400"}
                  />
                  <StatCard
                    label="Avg Daily P&L"
                    value={formatMoney(stats.avgPnl)}
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
                    value={formatMoney(stats.expectancy)}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="app-card p-4">
                    <p className="app-section-title mb-1">Best Day</p>
                    <p className="text-green-400 text-2xl font-bold">+${Math.abs(stats.bestDay?.pnl || 0).toFixed(2)}</p>
                    <p className="text-[color:var(--app-text-soft)] text-xs mt-1">
                      {stats.bestDay
                        ? new Date(stats.bestDay.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "-"}
                    </p>
                  </div>
                  <div className="app-card p-4">
                    <p className="app-section-title mb-1">Worst Day</p>
                    <p className="text-red-400 text-2xl font-bold">${Math.abs(stats.worstDay?.pnl || 0).toFixed(2)}</p>
                    <p className="text-[color:var(--app-text-soft)] text-xs mt-1">
                      {stats.worstDay
                        ? new Date(stats.worstDay.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="app-card p-5">
                  <h2 className="app-section-title mb-4">Cumulative P&L</h2>
                  <PnlChart entries={entries} />
                </div>
              </>
            ) : (
              <EmptyState
                title="No data yet"
                description="Start logging sessions to see dashboard metrics, win rate and cumulative performance."
                action={<Link to="/journal/new" className="app-button-primary inline-flex px-6 py-3 text-sm font-semibold">Log First Session</Link>}
              />
            )}
          </>
        )}

        {activeView === "calendar" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Sessions" value={stats?.totalDays ?? 0} sub="selected account" colorClass="text-blue-400" />
              <StatCard label="Win Rate" value={`${stats?.winRate ?? 0}%`} sub="selected account" colorClass={(stats?.winRate ?? 0) >= 50 ? "text-green-400" : "text-red-400"} />
              <StatCard label="P&L" value={formatMoney(stats?.totalPnl)} sub="selected account" colorClass={(stats?.totalPnl ?? 0) >= 0 ? "text-green-400" : "text-red-400"} />
              <StatCard label="Trades" value={stats?.totalTrades ?? 0} sub="executions" colorClass="text-blue-400" />
            </div>
            <TradingCalendar entries={entries} />
          </div>
        )}

        {activeView === "journal" && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="app-section-title">
                Trading Sessions ({filteredEntries.length}{filteredEntries.length !== entries.length ? ` of ${entries.length}` : ""})
              </h2>

              {entries.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-xl overflow-hidden border border-[color:var(--app-border)]">
                    {[
                      { key: "all", label: "All" },
                      { key: "sp500", label: "S&P 500" },
                      { key: "nasdaq", label: "NASDAQ" },
                    ].map((market) => (
                      <button
                        key={market.key}
                        onClick={() => setFilterMarket(market.key)}
                        className={`px-3 py-2 text-xs font-semibold transition-colors ${
                          filterMarket === market.key
                            ? "bg-[color:var(--app-primary)]/15 text-[color:var(--app-primary)]"
                            : "bg-[color:var(--app-surface)] text-[color:var(--app-text-muted)] hover:text-[color:var(--app-text)]"
                        }`}
                      >
                        {market.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex rounded-xl overflow-hidden border border-[color:var(--app-border)]">
                    {[
                      { key: "all", label: "All" },
                      { key: "win", label: "Wins" },
                      { key: "loss", label: "Losses" },
                    ].map((result) => (
                      <button
                        key={result.key}
                        onClick={() => setFilterResult(result.key)}
                        className={`px-3 py-2 text-xs font-semibold transition-colors ${
                          filterResult === result.key
                            ? result.key === "win"
                              ? "bg-green-500/15 text-green-400"
                              : result.key === "loss"
                              ? "bg-red-500/15 text-red-400"
                              : "bg-[color:var(--app-primary)]/15 text-[color:var(--app-primary)]"
                            : "bg-[color:var(--app-surface)] text-[color:var(--app-text-muted)] hover:text-[color:var(--app-text)]"
                        }`}
                      >
                        {result.label}
                      </button>
                    ))}
                  </div>

                  {instruments.length > 1 && (
                    <select
                      value={filterInstrument}
                      onChange={(e) => setFilterInstrument(e.target.value)}
                      className="app-input text-xs py-2 px-3 min-w-[160px]"
                    >
                      <option value="all">All Instruments</option>
                      {instruments.map((instrument) => (
                        <option key={instrument} value={instrument}>
                          {instrument}
                        </option>
                      ))}
                    </select>
                  )}

                  <button type="button" className="app-button-secondary px-3 py-2 text-xs" onClick={refreshFilters}>
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            {entries.length === 0 ? (
              <EmptyState
                title="No sessions yet"
                description="Start logging your sessions to track performance."
                action={<Link to="/journal/new" className="app-button-primary inline-flex px-6 py-3 text-sm font-semibold">Log First Session</Link>}
              />
            ) : filteredEntries.length === 0 ? (
              <EmptyState
                title="No sessions match"
                description="Adjust the filters or switch the selected account to see more sessions."
                action={<button onClick={refreshFilters} className="app-button-secondary inline-flex px-6 py-3 text-sm font-semibold">Clear filters</button>}
              />
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
                        <div className={`text-2xl font-bold shrink-0 ${entry.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {entry.pnl >= 0 ? "+" : ""}${Math.abs(entry.pnl).toFixed(2)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap text-sm">
                            <span className="font-semibold text-[color:var(--app-text)]">{entry.instrument}</span>
                            {entry.account?.name && <span className="app-badge app-badge-neutral">{entry.account.name}</span>}
                            <span className="app-badge app-badge-neutral">{marketLabel(getMarketGroup(entry.instrument))}</span>
                            <span className="text-[color:var(--app-text-soft)]">·</span>
                            <span className="text-[color:var(--app-text-muted)]">
                              {new Date(entry.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
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
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${entry.pnl > 0 ? "app-badge app-badge-success" : entry.pnl < 0 ? "app-badge app-badge-danger" : "app-badge app-badge-neutral"}`}>
                          {entry.pnl > 0 ? "WIN" : entry.pnl < 0 ? "LOSS" : "FLAT"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
