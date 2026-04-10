const mongoose = require('mongoose');

const adminPanelDataSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'default',
      unique: true,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    updatedBy: {
      type: String,
      default: 'system',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminPanelData', adminPanelDataSchema);
