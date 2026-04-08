const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, index: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    time: { type: String, required: true },
    category: { type: String, default: 'general' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
