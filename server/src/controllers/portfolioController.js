const Portfolio = require("../models/Portfolio");

// Get user portfolio
exports.getPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      return res.status(200).json({ stocks: [] });
    }
    res.status(200).json(portfolio);
  } catch (error) {
    console.error("PortfolioController Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Add a stock to portfolio
exports.addStock = async (req, res) => {
  try {
    const { symbol, quantity, purchasePrice } = req.body;

    if (!symbol || !quantity || !purchasePrice) {
      return res.status(400).json({ message: "Please provide symbol, quantity, and purchasePrice" });
    }

    let portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio) {
      // Create new portfolio if none exists
      portfolio = new Portfolio({
        user: req.user._id,
        stocks: [{ symbol, quantity, purchasePrice }],
      });
    } else {
      // Add new stock
      portfolio.stocks.push({ symbol, quantity, purchasePrice });
    }

    await portfolio.save();

    res.status(201).json(portfolio);
  } catch (error) {
    console.error("PortfolioController Error:", error);
    res.status(500).json({ message: error.message });
  }
};