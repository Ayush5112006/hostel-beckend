const express = require('express');
const Complaint = require('../models/Complaint');

const router = express.Router();

router.get('/:email', async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ userEmail: req.params.email }).sort({ createdAt: -1 });
    res.json({ success: true, complaints });
  } catch (error) {
    next(error);
  }
});

router.post('/:email', async (req, res, next) => {
  try {
    const complaintCount = await Complaint.countDocuments({ userEmail: req.params.email });
    const complaint = await Complaint.create({
      userEmail: req.params.email,
      complaintId: `C-${142 + complaintCount}`,
      ...req.body,
    });

    res.status(201).json({ success: true, complaint });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
