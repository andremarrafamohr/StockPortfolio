const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const accountRoutes = require("./routes/accountRoutes");
const journalRoutes = require("./routes/journalRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");

// Load env vars
dotenv.config();

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Serve uploaded screenshot images as static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/portfolio", portfolioRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Trading Journal API is running...");
});

module.exports = app;