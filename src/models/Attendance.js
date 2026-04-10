const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true, index: true },
  status: { type: String, enum: ['Present', 'Absent', 'Late'], default: 'Present' },
  inTime: { type: String },
  outTime: { type: String },
}, { timestamps: true });

// Compound indexes for common queries
attendanceSchema.index({ date: -1, user: 1 });
attendanceSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
