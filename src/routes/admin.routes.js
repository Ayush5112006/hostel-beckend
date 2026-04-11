const express = require('express');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const AdminPanelData = require('../models/AdminPanelData');
const Payment = require('../models/Payment');
const MessMenu = require('../models/MessMenu');
const Attendance = require('../models/Attendance');
const Notice = require('../models/Notice');
const AuditLog = require('../models/AuditLog');
const Setting = require('../models/Setting');

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

function normalizeRole(input) {
  const raw = (input ?? '').toString().trim().toLowerCase().replaceAll(' ', '').replaceAll('-', '');
  if (raw === 'superadmin') {
    return 'superadmin';
  }
  if (raw === 'admin') {
    return 'admin';
  }
  return 'student';
}

function buildDefaultPanelData(metrics, issues, users) {
  const students = users
    .filter((user) => !['admin', 'superadmin'].includes((user.role || '').toString().toLowerCase()))
    .slice(0, 20)
    .map((user) => ({
      name: user.name,
      room: user.roomNumber || '-',
      rentStatus: 'paid',
      complaints: 0,
    }));

  return {
    analytics: {
      revenueTrend: [
        { label: 'Jan', value: 72 },
        { label: 'Feb', value: 68 },
        { label: 'Mar', value: 80 },
        { label: 'Apr', value: 94 },
      ],
      complaintResolution: [
        { label: 'Resolved', value: 82 },
        { label: 'Pending', value: 7 },
        { label: 'Progress', value: 11 },
      ],
    },
    roles: {
      modules: [
        'Students',
        'Rooms & Booking',
        'Payments',
        'Complaints',
        'Chat & Messages',
        'Mess Management',
        'Attendance',
        'Broadcast',
        'Notice Board',
        'Analytics',
        'Role & User Mgmt',
        'Settings',
      ],
    },
    accessMatrix: {
      rows: [
        { module: 'Students', super: 'full', admin: 'full', warden: 'partial', student: 'partial' },
        { module: 'Rooms & Booking', super: 'full', admin: 'full', warden: 'partial', student: 'partial' },
        { module: 'Payments', super: 'full', admin: 'full', warden: 'partial', student: 'none' },
        { module: 'Complaints', super: 'full', admin: 'full', warden: 'full', student: 'full' },
      ],
    },
    rooms: {
      summary: {
        occupied: 86,
        vacant: 14,
        maintenance: 3,
        reserved: 2,
      },
      blockA: Array.from({ length: 24 }, (_, i) => ({
        room: `A-${String(i + 1).padStart(2, '0')}`,
        status: i < 2 ? 'maintenance' : 'occupied',
      })),
    },
    students: {
      records: students,
    },
    payments: {
      summary: [
        { label: 'Collected', value: 'Rs 4.8L' },
        { label: 'Overdue', value: 'Rs 57.6K' },
        { label: 'Pending Bills', value: '28' },
        { label: 'Collection Rate', value: '94%' },
      ],
      transactions: [
        { id: 'TXN82934', student: 'Ayush Patel', amount: 6250, status: 'paid', date: 'Apr 8' },
        { id: 'TXN82933', student: 'Neha Shah', amount: 5500, status: 'paid', date: 'Apr 8' },
        { id: 'TXN82932', student: 'Karan Mehta', amount: 4800, status: 'overdue', date: 'Apr 10' },
      ],
    },
    mess: {
      menu: [
        { meal: 'Breakfast', items: 'Poha, Jalebi, Tea / Coffee' },
        { meal: 'Lunch', items: 'Rajma Rice, Roti, Dal, Sabji, Curd' },
        { meal: 'Snacks', items: 'Samosa, Tea, Biscuits' },
        { meal: 'Dinner', items: 'Paneer Butter Masala, Naan, Rice' },
      ],
      feedback: [
        { label: 'Breakfast', value: 74 },
        { label: 'Lunch', value: 90 },
        { label: 'Dinner', value: 82 },
      ],
    },
    attendance: {
      summary: {
        present: 212,
        absent: 36,
        lateEntry: 8,
        visitors: 14,
      },
    },
    broadcast: {
      draft: {
        title: 'Water Supply Maintenance Notice',
        message:
          'Dear students, water supply will be off from 10:00 AM to 12:00 PM tomorrow for scheduled maintenance.',
      },
      recent: [
        { title: 'Power cut Block B tonight', audience: 'All students', time: '2h' },
        { title: 'April rent reminder', audience: '28 overdue students', time: '1d' },
      ],
    },
    notice: {
      items: [
        {
          title: 'Emergency: Electrical Inspection',
          message: 'All students must vacate Block B rooms from 6 PM to 8 PM for mandatory electrical inspection.',
          priority: 'urgent',
        },
        {
          title: 'April Rent Deadline Reminder',
          message: 'Hostel rent is due by April 10, 2026. Late payment will incur Rs 50/day penalty.',
          priority: 'active',
        },
      ],
    },
    audit: {
      logs: [
        { action: 'Suresh Warden resolved complaint #C-202', tag: 'Complaint', time: 'Now' },
        { action: 'Ayush Patel paid Rs 6,250 via UPI', tag: 'Payment', time: '3m' },
        { action: 'Raj Mehta changed Priya role -> Warden', tag: 'Access', time: '1h' },
      ],
    },
    settings: {
      security: {
        twoFactorAuth: true,
        autoLogout: true,
        fullAuditLogging: true,
        guestPortalAccess: false,
      },
      config: {
        hostelName: 'Sunrise Hostel',
        location: 'Near CHARUSAT Gate 2, Anand, Gujarat',
        baseMonthlyRent: 'Rs 4,800',
        lateFeePerDay: 'Rs 50',
      },
    },
    dashboard: {
      priorities: [
        { title: 'Urgent complaints', subtitle: `${metrics.openIssues} need immediate attention` },
        { title: 'Overdue payments', subtitle: 'Send reminders today' },
        { title: 'Role change requests', subtitle: 'Pending approval' },
      ],
      liveActivity: issues.slice(0, 8).map((issue) => ({
        title: issue.title,
        userEmail: issue.userEmail,
        status: issue.status,
      })),
    },
  };
}

async function getOrCreatePanelData() {
  const [totalUsers, totalAdmins, totalStudents, totalIssues, openIssues, issues, users] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: { $in: ['admin', 'superadmin'] } }),
    User.countDocuments({ role: 'student' }),
    Complaint.countDocuments({}),
    Complaint.countDocuments({ status: { $nin: ['Resolved', 'Done'] } }),
    Complaint.find({}).sort({ createdAt: -1 }).lean(),
    User.find({}).sort({ createdAt: -1 }).select('-password').lean(),
  ]);

  let doc = await AdminPanelData.findOne({ key: 'default' });
  if (!doc) {
    doc = await AdminPanelData.create({
      key: 'default',
      data: buildDefaultPanelData(
        {
          totalUsers,
          totalAdmins,
          totalStudents,
          totalIssues,
          openIssues,
        },
        issues,
        users
      ),
      updatedBy: 'system',
    });
  }

  return doc;
}

router.get('/overview', async (req, res, next) => {
  try {
    ensureDbAvailable();

    const [totalUsers, totalAdmins, totalStudents, totalIssues, openIssues, recentIssues] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: { $in: ['admin', 'superadmin'] } }),
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
    const role = normalizeRole(req.body.role);

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
      updates.role = normalizeRole(req.body.role);
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

router.get('/panel-data', async (req, res, next) => {
  try {
    ensureDbAvailable();
    const panelData = await getOrCreatePanelData();
    res.json({
      success: true,
      panelData: panelData.data,
      updatedAt: panelData.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/panel-data', async (req, res, next) => {
  try {
    ensureDbAvailable();

    const { module, payload, panelData, updatedBy } = req.body || {};
    const doc = await getOrCreatePanelData();

    if (module && typeof module === 'string') {
      const nextData = { ...(doc.data || {}) };
      nextData[module] = payload;
      doc.data = nextData;
    } else if (panelData && typeof panelData === 'object') {
      doc.data = {
        ...(doc.data || {}),
        ...panelData,
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Provide either module+payload or panelData object.',
      });
    }

    doc.updatedBy = updatedBy?.toString().trim() || 'admin';
    await doc.save();

    res.json({
      success: true,
      panelData: doc.data,
      updatedAt: doc.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

// --- New Individual Module Routes --- //

router.get('/payments', async (req, res, next) => {
  try {
    ensureDbAvailable();
    const payments = await Payment.find({}).populate('user', 'name email roomNumber').sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (error) {
    next(error);
  }
});

router.get('/mess-menu', async (req, res, next) => {
  try {
    ensureDbAvailable();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const menu = await MessMenu.findOne({ date: { $gte: today } }).sort({ date: 1 });
    res.json({ success: true, menu });
  } catch (error) {
    next(error);
  }
});

router.get('/attendance', async (req, res, next) => {
  try {
    ensureDbAvailable();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await Attendance.find({ date: { $gte: today } }).populate('user', 'name');
    res.json({ success: true, attendance });
  } catch (error) {
    next(error);
  }
});

router.get('/notices', async (req, res, next) => {
  try {
    ensureDbAvailable();
    const notices = await Notice.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, notices });
  } catch (error) {
    next(error);
  }
});

router.post('/notices', async (req, res, next) => {
  try {
    ensureDbAvailable();
    const notice = await Notice.create(req.body);
    res.json({ success: true, notice });
  } catch (error) {
    next(error);
  }
});

router.get('/audit-logs', async (req, res, next) => {
  try {
    ensureDbAvailable();
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
});

router.post('/broadcast', async (req, res, next) => {
  try {
    ensureDbAvailable();
    // Simulate sending broadcast
    await AuditLog.create({
      action: `Broadcast sent: ${req.body.title || 'Announcement'}`,
      tag: 'Broadcast',
    });
    res.json({ success: true, message: 'Broadcast sent successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/settings', async (req, res, next) => {
  try {
    ensureDbAvailable();
    const settings = await Setting.find({});
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    ensureDbAvailable();
    const updates = req.body.settings || [];
    for (const s of updates) {
      await Setting.findOneAndUpdate({ key: s.key }, { value: s.value }, { upsert: true });
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
