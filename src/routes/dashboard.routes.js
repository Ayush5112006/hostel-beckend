const express = require('express');
const Dashboard = require('../models/Dashboard');
const Notification = require('../models/Notification');

const router = express.Router();

router.get('/:email', async (req, res, next) => {
  try {
    const { email } = req.params;
    
    // Parallel queries with field selection and lean()
    const [dashboard, notifications] = await Promise.all([
      Dashboard.findOne({ userEmail: email })
        .select('-__v')
        .lean(),
      Notification.find({ userEmail: email })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('_id title message type createdAt isRead')
        .lean(),
    ]);

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
