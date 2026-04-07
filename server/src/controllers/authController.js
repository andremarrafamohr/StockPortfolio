// server/src/controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// Generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT secret is missing on the server");
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const ensureDatabaseReady = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      message: "Database unavailable. Confirm MongoDB is connected and the server is running.",
    });
    return false;
  }

  return true;
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  const name = req.body.name?.trim();
  const email = normalizeEmail(req.body.email);
  const password = req.body.password || "";

  try {
    if (!ensureDatabaseReady(res)) return;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Enter a valid email address.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        message: "An account with this email already exists. Try signing in instead.",
      });
    }

    // No need to hash manually, pre("save") hook will do it
    const user = await User.create({ name, email, password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("AuthController Error:", error); // 🔹 logs full error to console
    if (error.code === 11000) {
      return res.status(400).json({
        message: "An account with this email already exists. Try signing in instead.",
      });
    }

    res.status(500).json({
      message: "Registration failed on the server. Check the backend terminal for details.",
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = req.body.password || "";

  try {
    if (!ensureDatabaseReady(res)) return;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "No account was found for this email.",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect password.",
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("AuthController Error:", error); // 🔹 logs full error to console
    res.status(500).json({
      message: "Login failed on the server. Check the backend terminal for details.",
    });
  }
};