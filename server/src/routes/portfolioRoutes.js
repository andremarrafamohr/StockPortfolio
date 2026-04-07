const express = require("express");
const router = express.Router();
const { getPortfolio, addStock } = require("../controllers/portfolioController");
const { protect } = require("../middleware/authMiddleware");

// Protected routes
router.get("/", protect, getPortfolio);
router.post("/", protect, addStock);

module.exports = router;