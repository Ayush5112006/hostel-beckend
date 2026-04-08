const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    roomNumber: { type: String, required: true },
    dueRent: { type: String, required: true },
    openIssues: { type: Number, required: true },
    greeting: { type: String, default: 'Good morning' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dashboard', dashboardSchema);
