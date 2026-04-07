const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema({
  direction: { type: String, enum: ["long", "short"] },
  contracts: { type: Number, default: 1 },
  entryPrice: { type: Number },
  exitPrice: { type: Number },
  entryTime: { type: String, default: "" },
  exitTime: { type: String, default: "" },
  pnl: { type: Number, default: 0 },
  notes: { type: String, default: "" },
});

const tradeJournalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: Date, required: true },
    instrument: { type: String, default: "ES" },
    pnl: { type: Number, required: true, default: 0 },
    riskReward: { type: Number, default: null, min: 0 },
    trades: [tradeSchema],
    screenshots: [{ type: String }],
    // Why I entered / what I saw
    entryReason: { type: String, default: "" },
    // General session notes
    description: { type: String, default: "" },
    // Mistakes or trades missed
    mistakesOrMissed: { type: String, default: "" },
    // Lessons for next session
    lessons: { type: String, default: "" },
    followedPlan: { type: Boolean, default: null },
    mood: {
      type: String,
      enum: ["great", "good", "neutral", "bad", "terrible", ""],
      default: "",
    },
    isWinningDay: { type: Boolean },
  },
  { timestamps: true }
);

tradeJournalSchema.pre("save", function () {
  this.isWinningDay = this.pnl > 0;
});

module.exports = mongoose.model("TradeJournal", tradeJournalSchema);
