const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getAccounts, createAccount } = require("../controllers/accountController");

router.get("/", protect, getAccounts);
router.post("/", protect, createAccount);

module.exports = router;