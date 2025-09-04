require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
const profileRoutes = require("./routes/profile");
const { verifyAccessToken } = require("./utils/jwt"); // ✅ import verifyAccessToken

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());


// ✅ Allow frontend (React) to talk to backend
app.use(
  cors({
    origin: "http://localhost:3001", // change if frontend runs elsewhere
    credentials: true, // allow cookies if you’re using JWT in cookies
  })
);

// ✅ Routes
app.use("/auth", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api", profileRoutes);


// ✅ Direct protected test route
app.get("/api/protected", (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Invalid token format" });

    const payload = verifyAccessToken(token);
    if (!payload) return res.status(403).json({ message: "Invalid or expired token" });

    res.json({
      message: "This is protected data!",
      userId: payload.sub,
      time: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Protected route error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Server + Database
const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () =>
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
