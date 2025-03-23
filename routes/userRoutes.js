const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 📌 Get All Users (Admin Only)
router.get("/", authMiddleware, async (req, res) => {
  try {
    // Only allow admins to view users
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied" });
    }

    const users = await pool.query("SELECT id, name, email, role FROM users");
    res.json(users.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
