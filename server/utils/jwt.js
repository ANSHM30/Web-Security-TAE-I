const jwt = require('jsonwebtoken');

// --- Sign Access Token (short-lived: 60s for demo) ---
function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '3m',
  });
}

// --- Sign Refresh Token (longer-lived: 15m for demo) ---
function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '15m',
  });
}

// --- Verify Access Token ---
function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

// --- Verify Refresh Token ---
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
