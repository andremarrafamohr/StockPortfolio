const TradeJournal = require("../models/TradeJournal");
const path = require("path");
const fs = require("fs");

// GET /api/journal — all entries for current user (newest first)
exports.getEntries = async (req, res) => {
  try {
    const entries = await TradeJournal.find({ user: req.user._id }).sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/journal/stats — computed stats for current user
exports.getStats = async (req, res) => {
  try {
    const entries = await TradeJournal.find({ user: req.user._id });

    if (entries.length === 0) {
      return res.json({
        totalDays: 0,
        winningDays: 0,
        losingDays: 0,
        winRate: 0,
        totalPnl: 0,
        avgPnl: 0,
        bestDay: null,
        worstDay: null,
        currentStreak: 0,
        maxWinStreak: 0,
        maxLossStreak: 0,
        riskReward: null,
        expectancy: 0,
      });
    }

    const totalDays = entries.length;
    const winningDays = entries.filter((e) => e.pnl > 0).length;
    const losingDays = entries.filter((e) => e.pnl < 0).length;
    const winRate = parseFloat(((winningDays / totalDays) * 100).toFixed(1));
    const totalPnl = parseFloat(entries.reduce((s, e) => s + e.pnl, 0).toFixed(2));
    const avgPnl = parseFloat((totalPnl / totalDays).toFixed(2));

    const bestDay = entries.reduce((b, e) => (!b || e.pnl > b.pnl ? e : b), null);
    const worstDay = entries.reduce((w, e) => (!w || e.pnl < w.pnl ? e : w), null);

    // Streaks from most recent entry backward
    const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    let currentStreak = 0;
    const firstIsWin = sorted[0].pnl > 0;
    for (const e of sorted) {
      if ((e.pnl > 0) === firstIsWin) currentStreak++;
      else break;
    }
    if (!firstIsWin) currentStreak = -currentStreak;

    let maxWinStreak = 0, maxLossStreak = 0, curW = 0, curL = 0;
    for (const e of sorted) {
      if (e.pnl > 0) {
        curW++;
        curL = 0;
        maxWinStreak = Math.max(maxWinStreak, curW);
      } else {
        curL++;
        curW = 0;
        maxLossStreak = Math.max(maxLossStreak, curL);
      }
    }

    const winEntries = entries.filter((e) => e.pnl > 0);
    const lossEntries = entries.filter((e) => e.pnl < 0);
    const grossWins = winEntries.reduce((s, e) => s + e.pnl, 0);
    const grossLosses = Math.abs(lossEntries.reduce((s, e) => s + e.pnl, 0));
    const profitFactor = grossLosses === 0 ? null : parseFloat((grossWins / grossLosses).toFixed(2));
    const avgWinDay = winEntries.length > 0 ? parseFloat((grossWins / winEntries.length).toFixed(2)) : 0;
    const avgLossDay = lossEntries.length > 0 ? parseFloat((-grossLosses / lossEntries.length).toFixed(2)) : 0;
    const totalTrades = entries.reduce((s, e) => s + (e.trades ? e.trades.length : 0), 0);
    const avgLossAbs = Math.abs(avgLossDay);
    const riskReward = avgLossAbs === 0 ? null : parseFloat((avgWinDay / avgLossAbs).toFixed(2));
    const winProb = winningDays / totalDays;
    const lossProb = losingDays / totalDays;
    const expectancy = parseFloat((winProb * avgWinDay + lossProb * avgLossDay).toFixed(2));

    res.json({
      totalDays,
      winningDays,
      losingDays,
      winRate,
      totalPnl,
      avgPnl,
      bestDay: { date: bestDay.date, pnl: bestDay.pnl },
      worstDay: { date: worstDay.date, pnl: worstDay.pnl },
      currentStreak,
      maxWinStreak,
      maxLossStreak,
      profitFactor,
      avgWinDay,
      avgLossDay,
      riskReward,
      expectancy,
      totalTrades,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/journal/:id — single entry
exports.getEntry = async (req, res) => {
  try {
    const entry = await TradeJournal.findOne({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/journal — create new entry
exports.createEntry = async (req, res) => {
  try {
    const {
      date, instrument, pnl, trades,
      entryReason, description, mistakesOrMissed, lessons,
      followedPlan, mood, riskReward,
    } = req.body;

    const screenshots = req.files ? req.files.map((f) => f.filename) : [];

    const entry = new TradeJournal({
      user: req.user._id,
      date: date || new Date(),
      instrument: instrument || "ES",
      pnl: parseFloat(pnl) || 0,
      riskReward:
        riskReward !== undefined && riskReward !== "" ? parseFloat(riskReward) : null,
      trades: trades ? JSON.parse(trades) : [],
      screenshots,
      entryReason: entryReason || "",
      description: description || "",
      mistakesOrMissed: mistakesOrMissed || "",
      lessons: lessons || "",
      followedPlan:
        followedPlan === "true" ? true : followedPlan === "false" ? false : null,
      mood: mood || "",
    });

    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    console.error("createEntry error:", err);
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/journal/:id — update entry
exports.updateEntry = async (req, res) => {
  try {
    const entry = await TradeJournal.findOne({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    const textFields = ["date", "instrument", "entryReason", "description", "mistakesOrMissed", "lessons", "mood"];
    for (const f of textFields) {
      if (req.body[f] !== undefined) entry[f] = req.body[f];
    }
    if (req.body.pnl !== undefined) entry.pnl = parseFloat(req.body.pnl);
    if (req.body.riskReward !== undefined) {
      entry.riskReward =
        req.body.riskReward === "" ? null : parseFloat(req.body.riskReward);
    }
    if (req.body.followedPlan !== undefined) {
      entry.followedPlan =
        req.body.followedPlan === "true" ? true : req.body.followedPlan === "false" ? false : null;
    }
    if (req.body.trades) entry.trades = JSON.parse(req.body.trades);

    // Append any new screenshots
    if (req.files && req.files.length > 0) {
      entry.screenshots.push(...req.files.map((f) => f.filename));
    }

    await entry.save();
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/journal/:id — delete entry and its files
exports.deleteEntry = async (req, res) => {
  try {
    const entry = await TradeJournal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    for (const file of entry.screenshots) {
      const filePath = path.join(__dirname, "../../uploads", file);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ message: "Entry deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/journal/:id/screenshots/:filename — remove one screenshot
exports.deleteScreenshot = async (req, res) => {
  try {
    const { filename } = req.params;
    // Prevent path traversal
    if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
      return res.status(400).json({ message: "Invalid filename" });
    }

    const entry = await TradeJournal.findOne({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    entry.screenshots = entry.screenshots.filter((s) => s !== filename);
    await entry.save();

    const filePath = path.join(__dirname, "../../uploads", filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: "Screenshot deleted", entry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
