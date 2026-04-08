const express = require('express');
const Dashboard = require('../models/Dashboard');
const Notification = require('../models/Notification');

const router = express.Router();

router.get('/:email', async (req, res, next) => {
  try {
    const { email } = req.params;
    const dashboard = await Dashboard.findOne({ userEmail: email });
    const notifications = await Notification.find({ userEmail: email }).sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      dashboard,
      notifications,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
