const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const wrap = require('../utils/wrap');
const { protect } = require('../middleware/auth');

router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Enter your email and password.' });
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matches(password))) return res.status(401).json({ message: 'Email or password is incorrect.' });
  if (!user.active) return res.status(403).json({ message: 'This account has been deactivated.' });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const { password: _pw, ...safe } = user.toObject();
  res.json({ token, user: safe });
}));

router.get('/me', protect, (req, res) => res.json({ user: req.user }));

module.exports = router;
