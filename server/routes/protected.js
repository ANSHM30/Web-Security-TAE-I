const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/profile', auth, (req, res) => {
  res.json({ message: 'Protected route success ✅', user: req.user });
});

module.exports = router;
