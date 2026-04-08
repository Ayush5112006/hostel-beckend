const express = require('express');
const Booking = require('../models/Booking');

const router = express.Router();

router.get('/:email', async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ userEmail: req.params.email }).sort({ createdAt: -1 });
    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
});

router.post('/:email', async (req, res, next) => {
  try {
    const booking = await Booking.create({
      userEmail: req.params.email,
      ...req.body,
    });

    res.status(201).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
