const router = require('express').Router();
const User = require('../models/User');
const wrap = require('../utils/wrap');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/', wrap(async (req, res) => {
  res.json(await User.find().sort({ role: 1, name: 1 }));
}));

router.post('/', wrap(async (req, res) => {
  const { name, email, password, role, department, employeeId } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'That email is already in use.' });
  const user = await User.create({ name, email, password, role, department, employeeId });
  res.status(201).json(user);
}));

router.put('/:id', wrap(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Employee not found.' });
  ['name', 'email', 'role', 'department', 'employeeId', 'active'].forEach((k) => {
    if (req.body[k] !== undefined) user[k] = req.body[k];
  });
  if (req.body.password) user.password = req.body.password;
  await user.save();
  res.json(user);
}));

module.exports = router;
