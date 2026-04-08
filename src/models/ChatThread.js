const mongoose = require('mongoose');

const chatThreadSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, index: true },
    name: { type: String, required: true },
    message: { type: String, required: true },
    time: { type: String, required: true },
    unread: { type: Number, default: 0 },
    category: { type: String, enum: ['direct', 'groups', 'admin'], default: 'direct' },
    avatarLabel: { type: String, default: '👤' },
    avatarColor: { type: String, default: '#EAF0FF' },
    accentColor: { type: String, default: '#2F65F1' },
    isOnline: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatThread', chatThreadSchema);
