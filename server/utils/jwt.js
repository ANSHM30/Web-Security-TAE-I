const jwt = require('jsonwebtoken');

// --- Sign Access Token (short-lived: 15s) ---
function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15s', // fixed to 15 seconds for testing
  });
}

// --- Sign Refresh Token (short-lived: 1m for testing) ---
function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '1m', // fixed to 1 minute for testing
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
