const express = require('express');
const ChatThread = require('../models/ChatThread');

const router = express.Router();
const fallbackThreads = [
  {
    userEmail: 'ayush@example.com',
    name: 'Hostel Admin',
    message: 'Room A-204 is confirmed ✅',
    time: '9:30',
    unread: 2,
    category: 'direct',
    avatarLabel: '👮',
    avatarColor: '#E8F0FF',
    accentColor: '#2F65F1',
    isOnline: true,
  },
  {
    userEmail: 'ayush@example.com',
    name: 'Room 204 Group',
    message: 'Raj: Anyone for dinner tonig...',
    time: '8:15',
    unread: 5,
    category: 'groups',
    avatarLabel: '👥',
    avatarColor: '#F9EFC0',
    accentColor: '#2F65F1',
    isOnline: false,
  },
  {
    userEmail: 'ayush@example.com',
    name: 'Rahul Sharma',
    message: 'Study at 7 PM in library?',
    time: 'Yesterday',
    unread: 0,
    category: 'direct',
    avatarLabel: '👤',
    avatarColor: '#F9DDE0',
    accentColor: '#8F5AD6',
    isOnline: false,
  },
  {
    userEmail: 'ayush@example.com',
    name: 'Block A Hostel',
    message: '📢 Water off 10 AM–12 PM',
    time: 'Mon',
    unread: 0,
    category: 'admin',
    avatarLabel: '🏠',
    avatarColor: '#E4F6EF',
    accentColor: '#4BAA82',
    isOnline: false,
  },
  {
    userEmail: 'ayush@example.com',
    name: 'Mess Manager',
    message: "Today's special: Chole Bhat...",
    time: 'Mon',
    unread: 0,
    category: 'admin',
    avatarLabel: '👩',
    avatarColor: '#F8E8F7',
    accentColor: '#E05BB5',
    isOnline: false,
  },
];

function isDbAvailable() {
  return global.__dbAvailable === true;
}

router.get('/:email', async (req, res, next) => {
  try {
    const email = req.params.email?.toString().trim().toLowerCase();
    const category = req.query.category;
    const shouldFilterCategory = category && category !== 'all';
    let threads;

    if (isDbAvailable()) {
      const filter = { userEmail: email };
      if (shouldFilterCategory) {
        filter.category = category;
      }
      threads = await ChatThread.find(filter).sort({ updatedAt: -1 });
    } else {
      threads = fallbackThreads.filter((thread) => {
        if (thread.userEmail !== email) {
          return false;
        }
        if (shouldFilterCategory && thread.category !== category) {
          return false;
        }
        return true;
      });
    }

    res.json({ success: true, threads });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
