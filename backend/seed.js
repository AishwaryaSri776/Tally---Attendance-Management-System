// Creates an admin, sample employees and 30 days of attendance so the UI has data.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const { dateStr } = require('./utils/date');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany({}), Attendance.deleteMany({})]);

  await User.create({ name: 'Asha Menon', email: 'admin@tally.dev', password: 'admin123', role: 'admin', department: 'HR', employeeId: 'ADM-001' });
  const people = [
    ['Ravi Kumar', 'Engineering'], ['Priya Nair', 'Design'], ['Karthik S', 'Engineering'],
    ['Divya Raj', 'Finance'], ['Arjun Patel', 'Sales'],
  ];
  const employees = [];
  for (let i = 0; i < people.length; i++) {
    employees.push(await User.create({
      name: people[i][0], email: `${people[i][0].split(' ')[0].toLowerCase()}@tally.dev`, password: 'emp123',
      department: people[i][1], employeeId: `EMP-${String(i + 1).padStart(3, '0')}`,
    }));
  }

  const docs = [];
  for (let back = 1; back <= 30; back++) {
    const day = new Date(); day.setDate(day.getDate() - back);
    if ([0, 6].includes(day.getDay())) continue;
    for (const e of employees) {
      const roll = Math.random();
      if (roll < 0.06) continue; // absent
      const base = { user: e._id, date: dateStr(day) };
      if (roll < 0.11) { docs.push({ ...base, status: 'leave', note: 'Planned leave' }); continue; }
      const late = roll < 0.25;
      const inAt = new Date(day); inAt.setHours(late ? 10 : 9, late ? 15 + Math.floor(Math.random() * 40) : 5 + Math.floor(Math.random() * 20), 0, 0);
      const half = roll > 0.95;
      const outAt = new Date(inAt.getTime() + (half ? 3.5 : 8 + Math.random()) * 3600000);
      docs.push({ ...base, checkIn: inAt, checkOut: outAt, workedMinutes: Math.round((outAt - inAt) / 60000), status: half ? 'half-day' : late ? 'late' : 'present' });
    }
  }
  await Attendance.insertMany(docs);
  console.log('Seeded. Admin: admin@tally.dev / admin123 — Employee: ravi@tally.dev / emp123');
  process.exit(0);
})();
