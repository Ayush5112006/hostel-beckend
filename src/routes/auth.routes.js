const express = require('express');
const crypto = require('node:crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const OtpCode = require('../models/OtpCode');

const router = express.Router();
const MAX_OTP_ATTEMPTS = 2;

function isDbAvailable() {
  return global.__dbAvailable === true;
}

function ensureDbAvailable() {
  if (!isDbAvailable()) {
    const error = new Error('Database unavailable. Please try again later.');
    error.statusCode = 503;
    throw error;
  }
}

async function findUserByEmail(email) {
  ensureDbAvailable();
  return User.findOne({ email });
}

async function createUserRecord(userData) {
  ensureDbAvailable();
  return User.create(userData);
}

async function findOtpByEmail(email) {
  ensureDbAvailable();
  return OtpCode.findOne({ email });
}

async function upsertOtpByEmail(email, otpHash, expireAt) {
  ensureDbAvailable();
  return OtpCode.findOneAndUpdate(
    { email },
    { email, otpHash, expireAt, failedAttempts: 0 },
    { upsert: true, new: true }
  );
}

async function incrementOtpFailures(email) {
  ensureDbAvailable();
  return OtpCode.findOneAndUpdate({ email }, { $inc: { failedAttempts: 1 } }, { new: true });
}

async function deleteOtpByEmail(email) {
  ensureDbAvailable();
  await OtpCode.deleteOne({ email });
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
    const firstName = req.body.firstName?.toString().trim();
    const middleName = req.body.middleName?.toString().trim() || '';
    const lastName = req.body.lastName?.toString().trim();
    const name = req.body.name?.toString().trim();
    const email = req.body.email?.toString().trim().toLowerCase();
    const password = req.body.password?.toString();
    const roomNumber = req.body.roomNumber?.toString().trim() || 'A-204';
    const collegeName = req.body.collegeName?.toString().trim();
    const collegeYears = Number(req.body.collegeYears);
    const age = Number(req.body.age);
    const phone = req.body.phone?.toString().trim();
    const parentPhone = req.body.parentPhone?.toString().trim();
    const profileImageName = req.body.profileImageName?.toString().trim() || '';
    const otp = req.body.otp?.toString().trim();

    if (!firstName || !lastName || !name || !email || !password || !roomNumber || !collegeName || !phone || !parentPhone || !otp) {
      return res.status(400).json({ success: false, message: 'Signup fields are required' });
    }

    if (!Number.isFinite(collegeYears) || collegeYears < 1 || collegeYears > 10) {
      return res.status(400).json({ success: false, message: 'Invalid college years' });
    }

    if (!Number.isFinite(age) || age < 15 || age > 100) {
      return res.status(400).json({ success: false, message: 'Invalid age' });
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
      firstName,
      middleName,
      lastName,
      email,
      password,
      roomNumber,
      collegeName,
      collegeYears,
      age,
      phone,
      parentPhone,
      profileImageName,
    });

    await deleteOtpByEmail(email);

    res.status(201).json({
      success: true,
      message: 'Signup completed',
      user: {
        name: user.name,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        email: user.email,
        roomNumber: user.roomNumber,
        collegeName: user.collegeName,
        collegeYears: user.collegeYears,
        age: user.age,
        phone: user.phone,
        parentPhone: user.parentPhone,
        profileImageName: user.profileImageName,
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
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        email: user.email,
        roomNumber: user.roomNumber,
        collegeName: user.collegeName,
        collegeYears: user.collegeYears,
        age: user.age,
        phone: user.phone,
        parentPhone: user.parentPhone,
        profileImageName: user.profileImageName,
        monthsLeft: user.monthsLeft,
        rating: user.rating,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/profile/:email', async (req, res, next) => {
  try {
    const email = req.params.email?.toString().trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user: {
        name: user.name,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        email: user.email,
        roomNumber: user.roomNumber,
        collegeName: user.collegeName,
        collegeYears: user.collegeYears,
        age: user.age,
        phone: user.phone,
        parentPhone: user.parentPhone,
        profileImageName: user.profileImageName,
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
