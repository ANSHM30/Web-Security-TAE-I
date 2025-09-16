const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");
const router = express.Router();

// Use auth middleware to verify access token from Authorization header or cookie
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email joined");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      joined: user.joined,
    });
  } catch (err) {
    console.error("Profile error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
