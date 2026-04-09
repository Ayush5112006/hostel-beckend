const express = require('express');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

const router = express.Router();

function ensureDbAvailable() {
  if (global.__dbAvailable !== true) {
    const error = new Error('Database unavailable. Please try again later.');
    error.statusCode = 503;
    throw error;
  }
}

function splitNameParts(name) {
  const parts = name
    .toString()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return { firstName: '', middleName: '', lastName: '' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], middleName: '', lastName: 'User' };
  }

  if (parts.length === 2) {
    return { firstName: parts[0], middleName: '', lastName: parts[1] };
  }

  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
}

router.get('/overview', async (req, res, next) => {
  try {
    ensureDbAvailable();

    const [totalUsers, totalAdmins, totalStudents, totalIssues, openIssues, recentIssues] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'student' }),
      Complaint.countDocuments({}),
      Complaint.countDocuments({ status: { $nin: ['Resolved', 'Done'] } }),
      Complaint.find({}).sort({ createdAt: -1 }).limit(8),
    ]);

    res.json({
      success: true,
      metrics: {
        totalUsers,
        totalAdmins,
        totalStudents,
        totalIssues,
        openIssues,
      },
      recentIssues,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/issues', async (req, res, next) => {
  try {
    ensureDbAvailable();
    const issues = await Complaint.find({}).sort({ createdAt: -1 });
    res.json({ success: true, issues });
  } catch (error) {
    next(error);
  }
});

router.put('/issues/:id', async (req, res, next) => {
  try {
    ensureDbAvailable();
    const status = req.body.status?.toString().trim();

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const issue = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    res.json({ success: true, issue });
  } catch (error) {
    next(error);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    ensureDbAvailable();
    const users = await User.find({}).sort({ createdAt: -1 }).select('-password');
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    ensureDbAvailable();

    const name = req.body.name?.toString().trim() || '';
    const email = req.body.email?.toString().trim().toLowerCase() || '';
    const password = req.body.password?.toString() || '';
    const role = req.body.role?.toString().trim().toLowerCase() === 'admin' ? 'admin' : 'student';

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User already exists with this email' });
    }

    const { firstName, middleName, lastName } = splitNameParts(name);

    const user = await User.create({
      name,
      firstName,
      middleName,
      lastName,
      email,
      password,
      role,
      roomNumber: req.body.roomNumber?.toString().trim() || 'A-204',
      collegeName: req.body.collegeName?.toString().trim() || 'AVJ College',
      collegeYears: Number(req.body.collegeYears) || 4,
      age: Number(req.body.age) || 20,
      phone: req.body.phone?.toString().trim() || '0000000000',
      parentPhone: req.body.parentPhone?.toString().trim() || '0000000000',
      profileImageName: req.body.profileImageName?.toString().trim() || '',
      monthsLeft: Number(req.body.monthsLeft) || 6,
      rating: Number(req.body.rating) || 4.9,
    });

    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

router.put('/users/:id', async (req, res, next) => {
  try {
    ensureDbAvailable();

    const updates = {};

    if (req.body.name != null) {
      const name = req.body.name.toString().trim();
      if (!name) {
        return res.status(400).json({ success: false, message: 'Name cannot be empty' });
      }
      updates.name = name;
      const { firstName, middleName, lastName } = splitNameParts(name);
      updates.firstName = firstName;
      updates.middleName = middleName;
      updates.lastName = lastName;
    }

    if (req.body.roomNumber != null) {
      updates.roomNumber = req.body.roomNumber.toString().trim();
    }

    if (req.body.role != null) {
      updates.role = req.body.role.toString().trim().toLowerCase() === 'admin' ? 'admin' : 'student';
    }

    if (req.body.phone != null) {
      updates.phone = req.body.phone.toString().trim();
    }

    if (req.body.parentPhone != null) {
      updates.parentPhone = req.body.parentPhone.toString().trim();
    }

    if (req.body.password != null && req.body.password.toString().trim().length > 0) {
      updates.password = req.body.password.toString();
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
