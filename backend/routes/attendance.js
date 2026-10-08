const router = require('express').Router();
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const wrap = require('../utils/wrap');
const { protect, adminOnly } = require('../middleware/auth');
const { dateStr, monthStr, monthRange } = require('../utils/date');

router.use(protect);

const cfg = () => ({
  start: process.env.WORK_START || '09:30',
  grace: Number(process.env.GRACE_MINUTES ?? 10),
  halfDay: Number(process.env.HALF_DAY_MINUTES ?? 240),
});

function summarize(records, workingDays) {
  const s = { present: 0, late: 0, halfDay: 0, leave: 0, workedMinutes: 0 };
  records.forEach((r) => {
    if (r.status === 'present') s.present++;
    else if (r.status === 'late') s.late++;
    else if (r.status === 'half-day') s.halfDay++;
    else if (r.status === 'leave') s.leave++;
    s.workedMinutes += r.workedMinutes || 0;
  });
  const attended = s.present + s.late + s.halfDay;
  s.workingDays = workingDays;
  s.absent = Math.max(0, workingDays - attended - s.leave);
  const expected = Math.max(0, workingDays - s.leave);
  s.percentage = expected ? Math.round(((s.present + s.late + s.halfDay * 0.5) / expected) * 100) : 0;
  return s;
}

/* ---------- Employee actions ---------- */
router.post('/check-in', wrap(async (req, res) => {
  const date = dateStr();
  if (await Attendance.findOne({ user: req.user._id, date })) return res.status(400).json({ message: 'You have already clocked in today.' });
  const { start, grace } = cfg();
  const [h, m] = start.split(':').map(Number);
  const now = new Date();
  const cutoff = new Date();
  cutoff.setHours(h, m + grace, 0, 0);
  const record = await Attendance.create({ user: req.user._id, date, checkIn: now, status: now > cutoff ? 'late' : 'present' });
  res.status(201).json({ record });
}));

router.post('/check-out', wrap(async (req, res) => {
  const record = await Attendance.findOne({ user: req.user._id, date: dateStr() });
  if (!record || !record.checkIn) return res.status(400).json({ message: 'Clock in first, then you can clock out.' });
  if (record.checkOut) return res.status(400).json({ message: 'You have already clocked out today.' });
  const now = new Date();
  record.checkOut = now;
  record.workedMinutes = Math.round((now - record.checkIn) / 60000);
  if (record.workedMinutes < cfg().halfDay) record.status = 'half-day';
  await record.save();
  res.json({ record });
}));

router.get('/today', wrap(async (req, res) => {
  res.json({ record: await Attendance.findOne({ user: req.user._id, date: dateStr() }) });
}));

router.get('/me', wrap(async (req, res) => {
  const month = /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : monthStr();
  const range = monthRange(month);
  const records = await Attendance.find({ user: req.user._id, date: { $gte: range.start, $lte: range.end } }).sort({ date: -1 });
  res.json({ month, days: range.days, records, summary: summarize(records, range.workingDays) });
}));

/* ---------- Admin views ---------- */
router.get('/stats', adminOnly, wrap(async (req, res) => {
  const date = dateStr();
  const [total, records] = await Promise.all([
    User.countDocuments({ role: 'employee', active: true }),
    Attendance.find({ date }),
  ]);
  const count = (s) => records.filter((r) => r.status === s).length;
  const present = count('present'), late = count('late'), halfDay = count('half-day'), leave = count('leave');
  res.json({ date, total, present, late, halfDay, leave, absent: Math.max(0, total - present - late - halfDay - leave) });
}));

router.get('/report', adminOnly, wrap(async (req, res) => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date) ? req.query.date : dateStr();
  const [users, records] = await Promise.all([
    User.find({ role: 'employee', active: true }).sort({ name: 1 }),
    Attendance.find({ date }),
  ]);
  const byUser = new Map(records.map((r) => [String(r.user), r]));
  const rows = users.map((u) => {
    const r = byUser.get(String(u._id));
    return {
      userId: u._id, name: u.name, department: u.department, employeeId: u.employeeId,
      status: r ? r.status : 'absent', checkIn: r?.checkIn || null, checkOut: r?.checkOut || null,
      workedMinutes: r?.workedMinutes || 0, note: r?.note || '',
    };
  });
  res.json({ date, rows });
}));

router.get('/summary', adminOnly, wrap(async (req, res) => {
  const month = /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : monthStr();
  const range = monthRange(month);
  const [users, records] = await Promise.all([
    User.find({ role: 'employee', active: true }).sort({ name: 1 }),
    Attendance.find({ date: { $gte: range.start, $lte: range.end } }),
  ]);
  const rows = users.map((u) => ({
    userId: u._id, name: u.name, department: u.department, employeeId: u.employeeId,
    ...summarize(records.filter((r) => String(r.user) === String(u._id)), range.workingDays),
  }));
  res.json({ month, workingDays: range.workingDays, rows });
}));

// Admin sets a day's status for an employee (absent = remove the record)
router.post('/mark', adminOnly, wrap(async (req, res) => {
  const { userId, date, status, note } = req.body;
  if (!userId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !status) return res.status(400).json({ message: 'Employee, date and status are required.' });
  if (status === 'absent') {
    await Attendance.deleteOne({ user: userId, date });
    return res.json({ ok: true });
  }
  const update = { status, note: note || '' };
  if (status === 'leave') Object.assign(update, { checkIn: null, checkOut: null, workedMinutes: 0 });
  const record = await Attendance.findOneAndUpdate({ user: userId, date }, { $set: update }, { upsert: true, new: true });
  res.json({ record });
}));

module.exports = router;
