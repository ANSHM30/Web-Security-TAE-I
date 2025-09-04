const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // adjust path if needed
const router = express.Router();

router.get("/profile", async (req, res) => {
  try {
    const token = req.cookies.token; // ✅ token should be in cookie
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ fetch user from DB
    const user = await User.findById(decoded.id).select("-password"); // exclude password
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Profile error:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

module.exports = router;
