const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, index: true },
    complaintId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    status: { type: String, required: true },
    submittedAt: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
