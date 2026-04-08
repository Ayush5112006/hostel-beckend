const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, index: true },
    roomType: { type: String, required: true },
    monthlyRent: { type: String, required: true },
    checkIn: { type: String, required: true },
    duration: { type: String, required: true },
    total: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
