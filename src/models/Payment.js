const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' },
  title: { type: String, required: true },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
