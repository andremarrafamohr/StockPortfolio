const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const {
  getEntries,
  getStats,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  deleteScreenshot,
} = require("../controllers/journalController");

// Multer — save uploads to server/uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /\.(jpe?g|png|gif|webp)$/i;
  if (allowed.test(path.extname(file.originalname))) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, png, gif, webp) are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
});

// IMPORTANT: /stats must be declared before /:id so Express doesn't treat "stats" as an id
router.get("/stats", protect, getStats);
router.get("/", protect, getEntries);
router.post("/", protect, upload.array("screenshots", 5), createEntry);
router.get("/:id", protect, getEntry);
router.put("/:id", protect, upload.array("screenshots", 5), updateEntry);
router.delete("/:id", protect, deleteEntry);
router.delete("/:id/screenshots/:filename", protect, deleteScreenshot);

module.exports = router;
