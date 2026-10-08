const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    checkIn: Date,
    checkOut: Date,
    status: { type: String, enum: ['present', 'late', 'half-day', 'leave'], default: 'present' },
    workedMinutes: { type: Number, default: 0 },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
