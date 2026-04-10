const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Late'], default: 'Present' },
  inTime: { type: String },
  outTime: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
