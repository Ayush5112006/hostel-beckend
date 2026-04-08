const express = require('express');
const crypto = require('node:crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const OtpCode = require('../models/OtpCode');

const router = express.Router();
const MAX_OTP_ATTEMPTS = 2;
const fallbackUsers = new Map([
  [
    'ayush@example.com',
    {
      name: 'Ayush Patel',
      email: 'ayush@example.com',
      password: '12345678',
      roomNumber: 'A-204',
      monthsLeft: 6,
      rating: 4.9,
      role: 'student',
    },
  ],
]);
const fallbackOtps = new Map();

function isDbAvailable() {
  return global.__dbAvailable === true;
}

async function findUserByEmail(email) {
  if (isDbAvailable()) {
    return User.findOne({ email });
  }
  return fallbackUsers.get(email) ?? null;
}

async function createUserRecord(userData) {
  if (isDbAvailable()) {
    return User.create(userData);
  }

  const user = {
    ...userData,
    monthsLeft: 6,
    rating: 4.9,
    role: 'student',
  };
  fallbackUsers.set(user.email, user);
  return user;
}

async function findOtpByEmail(email) {
  if (isDbAvailable()) {
    return OtpCode.findOne({ email });
  }
  return fallbackOtps.get(email) ?? null;
}

async function upsertOtpByEmail(email, otpHash, expireAt) {
  if (isDbAvailable()) {
    return OtpCode.findOneAndUpdate(
      { email },
      { email, otpHash, expireAt, failedAttempts: 0 },
      { upsert: true, new: true }
    );
  }

  const record = { email, otpHash, expireAt, failedAttempts: 0 };
  fallbackOtps.set(email, record);
  return record;
}

async function incrementOtpFailures(email) {
  if (isDbAvailable()) {
    return OtpCode.findOneAndUpdate({ email }, { $inc: { failedAttempts: 1 } }, { new: true });
  }

  const record = fallbackOtps.get(email);
  if (!record) {
    return null;
  }
  record.failedAttempts += 1;
  fallbackOtps.set(email, record);
  return record;
}

async function deleteOtpByEmail(email) {
  if (isDbAvailable()) {
    await OtpCode.deleteOne({ email });
    return;
  }
  fallbackOtps.delete(email);
}

function createOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOtp(email, otp) {
  return crypto
    .createHash('sha256')
    .update(`${email.toLowerCase()}:${otp}`)
    .digest('hex');
}

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error('EMAIL_USER or EMAIL_APP_PASSWORD is not set');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

async function issueOtp({ email, subject, introText }) {
  const otp = createOtp();
  const otpHash = hashOtp(email, otp);
  const ttlMinutes = Number(process.env.OTP_EXPIRES_MINUTES || '10');
  const expireAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await upsertOtpByEmail(email, otpHash, expireAt);

  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    text: `${introText} ${otp}. It will expire in ${ttlMinutes} minutes.`,
    html: `<p>${introText} <b>${otp}</b>.</p><p>It will expire in ${ttlMinutes} minutes.</p>`,
  });
}

router.post('/send-otp', async (req, res, next) => {
  try {
    const email = req.body.email?.toString().trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found for this email' });
    }

    await issueOtp({
      email,
      subject: 'AVJ Hostel OTP Verification',
      introText: 'Your OTP is',
    });

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    next(error);
  }
});

router.post('/verify-otp', async (req, res, next) => {
  try {
    const email = req.body.email?.toString().trim().toLowerCase();
    const otp = req.body.otp?.toString().trim();

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const otpRecord = await findOtpByEmail(email);
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP not found. Please request a new OTP.' });
    }

    if (otpRecord.expireAt.getTime() < Date.now()) {
      await deleteOtpByEmail(email);
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new OTP.' });
    }

    const incomingHash = hashOtp(email, otp);
    if (incomingHash !== otpRecord.otpHash) {
      const updatedRecord = await incrementOtpFailures(email);

      if ((updatedRecord?.failedAttempts ?? 0) >= MAX_OTP_ATTEMPTS) {
        await issueOtp({
          email,
          subject: 'AVJ Hostel OTP Verification (Resent)',
          introText: 'Your new OTP is',
        });

        return res.status(400).json({
          success: false,
          code: 'OTP_RESEND_REQUIRED',
          message: 'OTP failed 2 times. New OTP sent to your email.',
        });
      }

      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    await deleteOtpByEmail(email);
    res.json({ success: true, message: 'OTP verified' });
  } catch (error) {
    next(error);
  }
});

router.post('/signup/send-otp', async (req, res, next) => {
  try {
    const email = req.body.email?.toString().trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Account already exists for this email' });
    }

    await issueOtp({
      email,
      subject: 'AVJ Hostel Signup OTP',
      introText: 'Your signup OTP is',
    });

    res.json({ success: true, message: 'Signup OTP sent to your email' });
  } catch (error) {
    next(error);
  }
});

router.post('/signup', async (req, res, next) => {
  try {
    const name = req.body.name?.toString().trim();
    const email = req.body.email?.toString().trim().toLowerCase();
    const password = req.body.password?.toString();
    const roomNumber = req.body.roomNumber?.toString().trim() || 'A-204';
    const otp = req.body.otp?.toString().trim();

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ success: false, message: 'Name, email, password and OTP are required' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Account already exists for this email' });
    }

    const otpRecord = await findOtpByEmail(email);
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP not found. Please request a new OTP.' });
    }

    if (otpRecord.expireAt.getTime() < Date.now()) {
      await deleteOtpByEmail(email);
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new OTP.' });
    }

    const incomingHash = hashOtp(email, otp);
    if (incomingHash !== otpRecord.otpHash) {
      const updatedRecord = await incrementOtpFailures(email);

      if ((updatedRecord?.failedAttempts ?? 0) >= MAX_OTP_ATTEMPTS) {
        await issueOtp({
          email,
          subject: 'AVJ Hostel Signup OTP (Resent)',
          introText: 'Your new signup OTP is',
        });

        return res.status(400).json({
          success: false,
          code: 'OTP_RESEND_REQUIRED',
          message: 'OTP failed 2 times. New OTP sent to your email.',
        });
      }

      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const user = await createUserRecord({
      name,
      email,
      password,
      roomNumber,
    });

    await deleteOtpByEmail(email);

    res.status(201).json({
      success: true,
      message: 'Signup completed',
      user: {
        name: user.name,
        email: user.email,
        roomNumber: user.roomNumber,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = req.body.email?.toString().trim().toLowerCase();
    const password = req.body.password?.toString();
    const user = await findUserByEmail(email);

    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        roomNumber: user.roomNumber,
        monthsLeft: user.monthsLeft,
        rating: user.rating,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
