const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  stocks: [
    {
      symbol: { type: String, required: true },
      name: { type: String },
      quantity: { type: Number, required: true },
      purchasePrice: { type: Number, required: true }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Portfolio", portfolioSchema);