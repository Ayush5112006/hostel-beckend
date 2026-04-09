const User = require('../models/User');
const Dashboard = require('../models/Dashboard');
const Notification = require('../models/Notification');
const ChatThread = require('../models/ChatThread');
const Booking = require('../models/Booking');
const Complaint = require('../models/Complaint');

async function seedDefaults() {
  const userEmail = 'ayush@example.com';
  const adminEmail = '24dcs139@charusat.edu.in';

  await User.findOneAndUpdate(
    { email: userEmail },
    {
      name: 'Ayush Patel',
      firstName: 'Ayush',
      middleName: '',
      lastName: 'Patel',
      email: userEmail,
      password: '12345678',
      roomNumber: 'A-204',
      collegeName: 'AVJ College',
      collegeYears: 4,
      age: 20,
      phone: '9876543210',
      parentPhone: '9876543211',
      profileImageName: '',
      monthsLeft: 6,
      rating: 4.9,
      role: 'student',
    },
    { upsert: true, new: true }
  );

  await User.findOneAndUpdate(
    { email: adminEmail },
    {
      name: 'Ayush',
      firstName: 'Ayush',
      middleName: '',
      lastName: 'Admin',
      email: adminEmail,
      password: 'Ayush@0511',
      roomNumber: 'A-001',
      collegeName: 'CHARUSAT',
      collegeYears: 4,
      age: 24,
      phone: '0000000000',
      parentPhone: '0000000000',
      profileImageName: '',
      monthsLeft: 0,
      rating: 5,
      role: 'admin',
    },
    { upsert: true, new: true }
  );

  await Dashboard.findOneAndUpdate(
    { userEmail },
    {
      userEmail,
      name: 'Ayush Patel',
      roomNumber: 'A-204',
      dueRent: '₹2,400',
      openIssues: 3,
      greeting: 'Good morning',
    },
    { upsert: true, new: true }
  );

  await Notification.deleteMany({ userEmail });
  await Notification.insertMany([
    { userEmail, title: 'Rent Due Reminder', subtitle: 'Monthly rent of ₹4,800 due on 10 Apr. Pay to avoid late fee.', time: '2h ago', category: 'rent' },
    { userEmail, title: 'Complaint Resolved', subtitle: 'Water issue #C-142 marked resolved by admin.', time: '1d ago', category: 'complaint' },
    { userEmail, title: 'Parcel Arrived', subtitle: 'Amazon parcel at reception. Collect before 9 PM.', time: '2d ago', category: 'parcel' },
  ]);

  await ChatThread.deleteMany({ userEmail });
  await ChatThread.insertMany([
    { userEmail, name: 'Hostel Admin', message: 'Room A-204 is confirmed ✅', time: '9:30', unread: 2, category: 'direct', avatarLabel: '👮', avatarColor: '#E8F0FF', accentColor: '#2F65F1', isOnline: true },
    { userEmail, name: 'Room 204 Group', message: 'Raj: Anyone for dinner tonig...', time: '8:15', unread: 5, category: 'groups', avatarLabel: '👥', avatarColor: '#F9EFC0', accentColor: '#2F65F1' },
    { userEmail, name: 'Rahul Sharma', message: 'Study at 7 PM in library?', time: 'Yesterday', category: 'direct', avatarLabel: '👤', avatarColor: '#F9DDE0', accentColor: '#8F5AD6' },
    { userEmail, name: 'Block A Hostel', message: '📢 Water off 10 AM–12 PM', time: 'Mon', category: 'admin', avatarLabel: '🏠', avatarColor: '#E4F6EF', accentColor: '#4BAA82' },
    { userEmail, name: 'Mess Manager', message: "Today's special: Chole Bhat...", time: 'Mon', category: 'admin', avatarLabel: '👩', avatarColor: '#F8E8F7', accentColor: '#E05BB5' },
  ]);

  await Booking.findOneAndUpdate(
    { userEmail },
    {
      userEmail,
      roomType: 'Double Sharing AC',
      monthlyRent: 'INR 4800',
      checkIn: 'Apr 15, 2026',
      duration: '6 Months',
      total: 'INR 28800',
    },
    { upsert: true, new: true }
  );

  const existingComplaint = await Complaint.findOne({ userEmail, complaintId: 'C-142' });
  if (!existingComplaint) {
    await Complaint.create({
      userEmail,
      complaintId: 'C-142',
      title: 'Water Leak',
      status: 'Resolved',
      submittedAt: 'Apr 3, 10:00 AM',
    });
  }
}

module.exports = seedDefaults;
