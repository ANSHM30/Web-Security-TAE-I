const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

const router = express.Router();

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ======================== REGISTER ========================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      joined: user.joined,
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
});


// ======================== LOGIN ========================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = signAccessToken({ sub: user._id });
    const refreshToken = signRefreshToken({ sub: user._id });

    const tokenHash = hashToken(refreshToken);
    await RefreshToken.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // 🔒 set true in production
      sameSite: 'lax',
    });

    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ======================== REFRESH TOKEN ========================
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken)
      return res.status(401).json({ message: 'Missing refresh token' });

    let payload;
    try {
      // ✅ Verify refresh JWT
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Refresh token expired, please log in again' });
      }
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // ✅ Check DB record
    const tokenHash = hashToken(refreshToken);
    const storedToken = await RefreshToken.findOne({ user: payload.sub, tokenHash });

    if (!storedToken) {
      return res.status(403).json({ message: 'Refresh token not found in DB' });
    }

    if (storedToken.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Refresh token expired, please log in again' });
    }

    // ✅ Issue new access token
    const newAccessToken = signAccessToken({ sub: payload.sub });
    res.json({ accessToken: newAccessToken });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
