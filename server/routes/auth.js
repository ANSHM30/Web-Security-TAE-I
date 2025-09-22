const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const Log = require('../models/Log');

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
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (!user) {
      await Log.create({ userId: null, email, success: false, ip, userAgent });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      await Log.create({ userId: user._id, email, success: false, ip, userAgent });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

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

    await Log.create({ userId: user._id, email, success: true, ip, userAgent });

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

// ======================== LOGOUT ========================
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await RefreshToken.updateMany({ tokenHash }, { $set: { revoked: true, revokedAt: new Date() } });
    }
    res.clearCookie('refreshToken');
    return res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ======================== ME (user + session meta) ========================
const auth = require('../middleware/auth');
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email joined');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const createdAt = new Date();
    const maxAgeMs = 3 * 60 * 1000;
    const expiresAt = new Date(createdAt.getTime() + maxAgeMs);

    res.json({
      user: { id: user._id, username: user.name, email: user.email },
      session: {
        id: req.user.id,
        createdAt,
        expiresAt,
        maxAge: maxAgeMs,
      },
      // ✅ Include refresh token here for demo only
      refreshToken: req.cookies.refreshToken || null,
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// ======================== LOGS (current user) ========================
router.get('/logs', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email');
    const logs = await Log.find({ email: user.email }).sort({ createdAt: -1 }).limit(25);
    res.json({ logs });
  } catch (err) {
    console.error('Get logs error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/logs', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email');
    await Log.deleteMany({ email: user.email });
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete logs error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
