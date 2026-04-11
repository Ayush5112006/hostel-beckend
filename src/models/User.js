const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    firstName: { type: String, required: true, index: true },
    middleName: { type: String, default: '' },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    roomNumber: { type: String, default: 'A-204', index: true },
    collegeName: { type: String, required: true },
    collegeYears: { type: Number, required: true },
    age: { type: Number, required: true },
    phone: { type: String, required: true },
    parentPhone: { type: String, required: true },
    profileImageName: { type: String, default: '' },
    monthsLeft: { type: Number, default: 6 },
    rating: { type: Number, default: 4.9 },
    role: { type: String, enum: ['student', 'admin', 'superadmin'], default: 'student', index: true },
  },
  { timestamps: true }
);

// Compound indexes for common queries
userSchema.index({ role: 1, createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
