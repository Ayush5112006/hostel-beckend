const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  color: { type: String, default: '44C5FF' },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

// Compound index for common queries
noticeSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Notice', noticeSchema);
