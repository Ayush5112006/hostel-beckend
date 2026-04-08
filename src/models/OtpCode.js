const mongoose = require('mongoose');

const otpCodeSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    otpHash: { type: String, required: true },
    expireAt: { type: Date, required: true, index: true },
    failedAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OtpCode', otpCodeSchema);
