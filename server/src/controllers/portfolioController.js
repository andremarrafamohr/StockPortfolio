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

// Add a stock or multiple stocks to portfolio
exports.addStock = async (req, res) => {
  try {
    // Support two payload shapes:
    // 1) { symbol, quantity, purchasePrice }
    // 2) { stocks: [{ symbol, quantity, purchasePrice }, ...] }
    let stocks = [];

    if (Array.isArray(req.body.stocks) && req.body.stocks.length > 0) {
      stocks = req.body.stocks;
    } else if (req.body.symbol) {
      stocks = [
        {
          symbol: req.body.symbol,
          quantity: req.body.quantity,
          purchasePrice: req.body.purchasePrice,
        },
      ];
    }

    if (!stocks.length) {
      return res.status(400).json({ message: "Please provide symbol, quantity, and purchasePrice" });
    }

    // Validate each stock entry
    const validStocks = [];
    for (const s of stocks) {
      const symbol = (s.symbol || "").toString().trim();
      const quantity = Number(s.quantity);
      const purchasePrice = Number(s.purchasePrice);

      if (!symbol || !Number.isFinite(quantity) || !Number.isFinite(purchasePrice)) {
        return res.status(400).json({ message: "Please provide symbol, quantity, and purchasePrice" });
      }

      validStocks.push({ symbol, quantity, purchasePrice });
    }

    let portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio) {
      // Create new portfolio if none exists
      portfolio = new Portfolio({
        user: req.user._id,
        stocks: validStocks,
      });
    } else {
      // Add new stocks
      for (const s of validStocks) portfolio.stocks.push(s);
    }

    await portfolio.save();

    res.status(201).json(portfolio);
  } catch (error) {
    console.error("PortfolioController Error:", error);
    res.status(500).json({ message: error.message });
  }
};