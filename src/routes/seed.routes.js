const express = require('express');
const seedDefaults = require('../utils/seedDefaults');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    await seedDefaults();

    res.json({ success: true, message: 'Seed data created' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
