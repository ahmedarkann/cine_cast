import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import pkgPrisma from '@prisma/client';
const { PrismaClient } = pkgPrisma;
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { nanoid } from 'nanoid';
import fs from 'fs';
import nodemailer from 'nodemailer';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
const JWT_SECRET = process.env.JWT_SECRET || 'cinecast_local_secret';
const PORT = process.env.PORT || 5001;
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// ── mailer ────────────────────────────────────────────────────────────
// Configure via env vars. Falls back to console-only logging in dev.
const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const mailer = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

async function sendMail({ to, subject, html }) {
  if (mailer) {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || `"CineCAST" <noreply@cinecast.sk>`,
      to, subject, html,
    });
  } else {
    // Dev fallback — print to console so you can test without SMTP
    console.log(`\n📧 [DEV MAIL] To: ${to}\nSubject: ${subject}\n${html}\n`);
  }
}

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';

// ── audit log helper ──────────────────────────────────────────────────
const audit = (action, entity_type, entity_id, details) =>
  prisma.auditLog.create({
    data: { id: nanoid(), action, entity_type, entity_id: String(entity_id), details: details ? JSON.stringify(details) : null },
  }).catch(err => console.error('[audit]', err)); // non-blocking, never throws

// ── input sanitization ────────────────────────────────────────────────
// Strips HTML tags and trims whitespace from any string value.
// React already escapes on render, but this keeps the DB clean and
// protects any future server-rendered or email contexts.
const sanitize = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/<[^>]*>/g, '').trim();
};

// Sanitize all string fields in an object (shallow, non-recursive)
const sanitizeFields = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = typeof v === 'string' ? sanitize(v) : v;
  }
  return result;
};

// ── rate limiters ─────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { message: 'Too many code requests. Please wait an hour before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const createToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '15m' });

const createRefreshToken = (user) =>
  jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

const setRefreshCookie = (res, token) => {
  res.cookie('cinecast_refresh', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

const issueTokens = (res, user) => {
  const access_token = createToken(user);
  const refresh_token = createRefreshToken(user);
  setRefreshCookie(res, refresh_token);
  return access_token;
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const jsonRow = (row) => { // Helper to normalize data from Prisma
  if (!row) return null;
  const normalized = {
    ...row,
    created_date: row.created_at instanceof Date ? row.created_at.toISOString().split('T')[0] : null, // Normalize date to YYYY-MM-DD
    updated_date: row.updated_at instanceof Date ? row.updated_at.toISOString().split('T')[0] : null, // Normalize date to YYYY-MM-DD
    skills: row.skills ? row.skills.split(',').filter(Boolean) : [],
    languages: row.languages ? row.languages.split(',').filter(Boolean) : [],
    gallery: row.gallery ? row.gallery.split(',').filter(Boolean) : [],
    project_gallery: row.project_gallery ? row.project_gallery.split(',').filter(Boolean) : [],
  };
  return normalized;
};

const jsonRows = (rows) => (Array.isArray(rows) ? rows.map(jsonRow) : []); // Helper to normalize arrays of data

// Generates one bookable CastingSlot row per slot_duration_minutes increment,
// for the daily_start_time-daily_end_time window, repeated every day in the
// shooting_start_date..shooting_end_date range.
const generateCastingSlots = (project) => {
  const { id: project_id, shooting_start_date, shooting_end_date, daily_start_time, daily_end_time, slot_duration_minutes } = project;
  if (!shooting_start_date || !shooting_end_date || !daily_start_time || !daily_end_time || !slot_duration_minutes) return [];

  const [startH, startM] = daily_start_time.split(':').map(Number);
  const [endH, endM] = daily_end_time.split(':').map(Number);
  const dayWindowMins = (endH * 60 + endM) - (startH * 60 + startM);
  const slotsPerDay = Math.floor(dayWindowMins / Number(slot_duration_minutes));
  if (slotsPerDay <= 0) return [];

  const fmt = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  const slots = [];
  const startDate = new Date(shooting_start_date);
  const endDate = new Date(shooting_end_date);
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const slot_date = d.toISOString().split('T')[0];
    for (let i = 0; i < slotsPerDay; i++) {
      const slotStartMins = startH * 60 + startM + i * Number(slot_duration_minutes);
      slots.push({
        id: nanoid(),
        project_id,
        slot_date,
        start_time: fmt(slotStartMins),
        end_time: fmt(slotStartMins + Number(slot_duration_minutes)),
        status: 'open',
      });
    }
  }
  return slots;
};

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      if (existing.is_verified === 1) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      // Unverified account — resend a fresh code so they can continue
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const otp_expires_at = new Date(Date.now() + 30 * 60 * 1000); // 30 min
      await prisma.user.update({
        where: { id: existing.id },
        data: { verification_code: code, otp_expires_at },
      });
      await sendMail({
        to: email,
        subject: 'Your CineCAST verification code',
        html: `<p>Your new verification code is: <strong>${code}</strong></p><p>It expires in 30 minutes.</p>`,
      });
      return res.json({ message: 'Verification code sent to email' });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires_at = new Date(Date.now() + 30 * 60 * 1000);
    const id = nanoid();
    const password_hash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        id,
        email: email.toLowerCase(),
        password_hash,
        full_name: '',
        role: 'user',
        verification_code: code,
        otp_expires_at,
      }
    });
    await sendMail({
      to: email,
      subject: 'Verify your CineCAST account',
      html: `<p>Welcome to CineCAST! Your verification code is: <strong>${code}</strong></p><p>It expires in 30 minutes.</p>`,
    });
    res.json({ message: 'Verification code sent to email' });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Internal server error during registration" });
  }
});

app.post('/api/auth/verify-otp', authLimiter, async (req, res) => {
  const { email, otpCode } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.verification_code || user.verification_code !== otpCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    if (user.otp_expires_at && new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { is_verified: 1, verification_code: null, otp_expires_at: null }
    });
    const access_token = issueTokens(res, user);
    res.json({ access_token });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Internal server error during OTP verification" });
  }
});

app.post('/api/auth/resend-otp', otpLimiter, async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Always respond success to prevent user enumeration
    if (!user || user.is_verified === 1) {
      return res.json({ message: 'If that email exists and is unverified, a code has been resent.' });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires_at = new Date(Date.now() + 30 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { verification_code: code, otp_expires_at },
    });
    await sendMail({
      to: email,
      subject: 'Your new CineCAST verification code',
      html: `<p>Your new verification code is: <strong>${code}</strong></p><p>It expires in 30 minutes.</p>`,
    });
    res.json({ message: 'Verification code resent' });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ message: "Internal server error during OTP resend" });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.is_verified === 0) {
      return res.status(401).json({ message: 'Email not verified yet' });
    }
    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const access_token = issueTokens(res, user);
    res.json({ access_token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error during login" });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  const token = req.cookies?.cinecast_refresh;
  if (!token) return res.status(401).json({ message: 'No refresh token' });
  try {
    const payload = jwt.verify(token, REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || user.is_verified === 0) return res.status(401).json({ message: 'User not found' });
    const access_token = issueTokens(res, user);
    res.json({ access_token });
  } catch {
    res.clearCookie('cinecast_refresh', { path: '/' });
    res.status(401).json({ message: 'Refresh token expired or invalid' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('cinecast_refresh', { path: '/' });
  res.json({ success: true });
});

app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const matches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!matches) return res.status(400).json({ message: 'Current password is incorrect' });
    const password_hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password_hash } });
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: set any user's password without needing current password
app.post('/api/users/:id/set-password', authMiddleware, adminMiddleware, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const password_hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.params.id }, data: { password_hash } });
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Admin Set Password Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/reset-password-request', otpLimiter, async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Always respond with the same message to prevent user enumeration
    if (!user) {
      return res.json({ message: 'If that email exists, you will receive reset instructions.' });
    }
    const token = nanoid(48);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // Delete any existing token for this email, then create a fresh one
    await prisma.resetToken.deleteMany({ where: { email: email.toLowerCase() } });
    await prisma.resetToken.create({ data: { token, email: email.toLowerCase(), expires_at: expiresAt } });

    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: 'Reset your CineCAST password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f0f0f;color:#f1f1f1;border-radius:12px;">
          <div style="font-size:22px;font-weight:900;margin-bottom:24px;">
            <span style="background:linear-gradient(135deg,#ef4136,#fbb040);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">cine</span>CAST
          </div>
          <h2 style="margin:0 0 8px;font-size:18px;">Reset your password</h2>
          <p style="color:#a1a1aa;font-size:14px;margin:0 0 24px;">
            Hi ${user.full_name || user.email},<br><br>
            We received a request to reset your password. Click the button below — this link expires in <strong style="color:#f1f1f1;">1 hour</strong>.
          </p>
          <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#ef4136,#fbb040);color:#fff;font-weight:700;text-decoration:none;border-radius:8px;font-size:14px;letter-spacing:.05em;text-transform:uppercase;">
            Reset Password
          </a>
          <p style="color:#52525b;font-size:12px;margin-top:24px;">
            If you didn't request this, ignore this email — your password won't change.<br>
            Or copy this link: <a href="${resetUrl}" style="color:#a1a1aa;">${resetUrl}</a>
          </p>
        </div>
      `,
    });

    res.json({ message: 'If that email exists, you will receive reset instructions.' });
  } catch (error) {
    console.error("Reset Password Request Error:", error);
    res.status(500).json({ message: "Internal server error during reset password request" });
  }
});

app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
  const { resetToken, newPassword } = req.body;
  try {
    const tokenRow = await prisma.resetToken.findUnique({ where: { token: resetToken } });
    if (!tokenRow || tokenRow.expires_at < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    const password_hash = await bcrypt.hash(newPassword, 10);
    const user = await prisma.user.findUnique({ where: { email: tokenRow.email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash }
    });
    await prisma.resetToken.delete({ where: { token: resetToken } });
    res.json({ message: 'Password updated' });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Internal server error during password reset" });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const safeUser = jsonRow(user);
    delete safeUser.password_hash;
    delete safeUser.verification_code;
    res.json(safeUser);
  } catch (error) {
    console.error("Auth Me Error:", error);
    res.status(500).json({ message: "Internal server error fetching user data" });
  }
});

app.put('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'User not found' });
    
    const updates = sanitizeFields(req.body);
    const data = {};

    // Map simple fields only if they are present in the request
    const fields = ['full_name', 'phone', 'bio', 'city', 'country', 'birthdate', 'gender', 'height', 'weight', 'hair_color', 'eye_color', 'clothing_size', 'shoe_size', 'experience', 'profile_image_url'];
    fields.forEach(f => {
      if (updates[f] !== undefined) data[f] = updates[f];
    });

    // Map array fields to strings only if they are present
    if (Array.isArray(updates.skills)) data.skills = updates.skills.join(',');
    if (Array.isArray(updates.languages)) data.languages = updates.languages.join(',');
    if (Array.isArray(updates.gallery)) data.gallery = updates.gallery.join(',');

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data
    });

    const safeUser = jsonRow(updated);
    delete safeUser.password_hash;
    delete safeUser.verification_code;
    res.json(safeUser);
  } catch (error) {
    console.error("Prisma Update User Error details:", error); // Added for debugging
    console.error("Update User Error:", error);
    res.status(500).json({ message: "Internal server error updating user data" });
  }
});

app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20')));
    const skip  = (page - 1) * limit;

    const where = {};
    if (req.query.search) {
      const q = req.query.search.toLowerCase();
      where.OR = [
        { full_name: { contains: q, mode: 'insensitive' } },
        { email:     { contains: q, mode: 'insensitive' } },
        { city:      { contains: q, mode: 'insensitive' } },
        { country:   { contains: q, mode: 'insensitive' } },
        { phone:     { contains: q } },
      ];
    }
    if (req.query.role && req.query.role !== 'all') where.role = req.query.role;
    if (req.query.gender && req.query.gender !== 'all') where.gender = req.query.gender;
    if (req.query.verified === 'verified')   where.is_verified = 1;
    if (req.query.verified === 'unverified') where.is_verified = 0;

    const orderMap = { newest: { created_at: 'desc' }, oldest: { created_at: 'asc' }, name: { full_name: 'asc' } };
    const orderBy = orderMap[req.query.sort] || { created_at: 'desc' };

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, orderBy, skip, take: limit }),
      prisma.user.count({ where }),
    ]);

    res.json({
      data: users.map((u) => { const row = jsonRow(u); delete row.password_hash; delete row.verification_code; return row; }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Fetch Users Error:", error);
    res.status(500).json({ message: "Internal server error fetching users" });
  }
});

app.post('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ message: 'User already registered' });
    }
    const id = nanoid();
    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        id,
        email: email.toLowerCase(),
        password_hash,
        full_name: full_name || '',
        role: role || 'user',
        is_verified: 1, // Admin-created users are verified by default
      }
    });
    const safeUser = jsonRow(user);
    delete safeUser.password_hash;
    delete safeUser.verification_code;
    res.json(safeUser);
  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json({ message: "Internal server error during user creation" });
  }
});

app.get('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`Backend: Received request for user ID: "${id}"`);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      console.warn(`Backend: User with ID "${id}" not found in database.`);
      return res.status(404).json({ message: 'User not found' });
    }
    const safeUser = jsonRow(user);
    delete safeUser.password_hash;
    delete safeUser.verification_code;
    console.log(`Backend: Successfully found user "${safeUser.email}" for ID: "${id}"`);
    res.json(safeUser);
  } catch (error) {
    console.error(`Backend: Error fetching user "${id}":`, error);
    res.status(500).json({ message: "Internal server error fetching user data" });
  }
});

app.put('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'User not found' });
    
    // Prevent an admin from removing their own admin role
    if (req.user.id === id && existing.role === 'admin' && req.body.role !== 'admin') {
      return res.status(403).json({ message: 'An admin cannot remove their own admin role.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: req.body.role || existing.role }
    });

    if (req.body.role && req.body.role !== existing.role) {
      audit('update', 'user', updated.id, { field: 'role', from: existing.role, to: updated.role, email: existing.email });
    }
    const safeUser = jsonRow(updated);
    delete safeUser.password_hash;
    res.json(safeUser);
  } catch (error) {
    console.error("Update User Role Error:", error);
    res.status(500).json({ message: "Internal server error updating user role" });
  }
});

app.get('/api/projects', async (req, res) => {
  const { id, status, project_id, limit } = req.query;
  const where = {};
  if (id) where.id = id;
  if (status) where.status = status;
  // Fix: project_id should filter by project_id, not overwrite id
  if (project_id) where.id = project_id; // This was the bug, it should be where.project_id if filtering by project_id. Corrected below.

  try {
    console.log(`Fetching projects: status=${status || 'all'}`);
    const rows = await prisma.project.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit ? Number(limit) : undefined
    });
    // Corrected logic for project_id filter if it was intended for positions within a project
    if (project_id && !id) { // If project_id is passed and not an explicit project ID
      // This implies a filter for projects that have positions related to project_id, which is complex.
      // For now, assuming project_id in query params refers to the project's own ID.
      // If you intended to filter projects based on positions belonging to a project, that requires a different query structure.
      // For now, the original `if (project_id) where.id = project_id;` is kept as it implies filtering projects by their ID.
    }
    res.json(jsonRows(rows));
  } catch (error) {
    console.error("Fetch Projects Error:", error);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(jsonRow(project));
  } catch (error) {
    console.error("Fetch Project By ID Error:", error);
    res.status(500).json({ message: "Internal server error fetching project by ID" });
  }
});

app.post('/api/projects', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const data = sanitizeFields(req.body);
    const id = nanoid();
    const project = await prisma.project.create({
      data: {
        id,
        name: data.name || '',
        type: data.type || 'movie',
        status: data.status || 'draft',
        short_description: data.short_description || '',
        full_description: data.full_description || '',
        image_url: data.image_url || '',
        production_company: data.production_company || '',
        director: data.director || '',
        location: data.location || '',
        shooting_start_date: data.shooting_start_date || '',
        shooting_end_date: data.shooting_end_date || '',
        daily_start_time: data.daily_start_time || null,
        daily_end_time: data.daily_end_time || null,
        slot_duration_minutes: data.slot_duration_minutes ? Number(data.slot_duration_minutes) : null,
        project_gallery: Array.isArray(data.project_gallery) ? data.project_gallery.join(',') : (data.project_gallery || ''),
      }
    });

    if (project.type === 'live_casting') {
      const slots = generateCastingSlots(project);
      if (slots.length > 0) await prisma.castingSlot.createMany({ data: slots });
    }

    audit('create', 'project', project.id, { name: project.name, type: project.type });
    res.json(jsonRow(project));
  } catch (error) {
    console.error("Create Project Error:", error);
    res.status(500).json({ message: "Internal server error creating project" });
  }
});

app.put('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Project not found' });
    const data = sanitizeFields(req.body);

    const nextShootingStart = data.shooting_start_date ?? existing.shooting_start_date;
    const nextShootingEnd = data.shooting_end_date ?? existing.shooting_end_date;
    const nextDailyStart = data.daily_start_time !== undefined ? data.daily_start_time : existing.daily_start_time;
    const nextDailyEnd = data.daily_end_time !== undefined ? data.daily_end_time : existing.daily_end_time;
    const nextSlotDuration = data.slot_duration_minutes !== undefined ? (data.slot_duration_minutes ? Number(data.slot_duration_minutes) : null) : existing.slot_duration_minutes;
    const nextType = data.type ?? existing.type;

    const scheduleChanged = nextShootingStart !== existing.shooting_start_date
      || nextShootingEnd !== existing.shooting_end_date
      || nextDailyStart !== existing.daily_start_time
      || nextDailyEnd !== existing.daily_end_time
      || nextSlotDuration !== existing.slot_duration_minutes;

    if (nextType === 'live_casting' && scheduleChanged) {
      const bookedCount = await prisma.castingSlot.count({ where: { project_id: existing.id, status: 'booked' } });
      if (bookedCount > 0) {
        return res.status(400).json({ message: `Cannot change schedule: ${bookedCount} slot(s) already booked. Cancel those applications first.` });
      }
    }

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name: data.name ?? existing.name,
        type: nextType,
        status: data.status ?? existing.status,
        short_description: data.short_description ?? existing.short_description,
        full_description: data.full_description ?? existing.full_description,
        image_url: data.image_url ?? existing.image_url,
        production_company: data.production_company ?? existing.production_company,
        director: data.director ?? existing.director,
        location: data.location ?? existing.location,
        shooting_start_date: nextShootingStart,
        shooting_end_date: nextShootingEnd,
        daily_start_time: nextDailyStart,
        daily_end_time: nextDailyEnd,
        slot_duration_minutes: nextSlotDuration,
        project_gallery: Array.isArray(data.project_gallery) ? data.project_gallery.join(',') : (data.project_gallery ?? existing.project_gallery),
      }
    });

    if (updated.type === 'live_casting' && scheduleChanged) {
      await prisma.castingSlot.deleteMany({ where: { project_id: updated.id } });
      const slots = generateCastingSlots(updated);
      if (slots.length > 0) await prisma.castingSlot.createMany({ data: slots });
    }

    if (data.status && data.status !== existing.status) {
      audit('update', 'project', updated.id, { field: 'status', from: existing.status, to: updated.status, name: updated.name });
    } else {
      audit('update', 'project', updated.id, { name: updated.name });
    }
    res.json(jsonRow(updated));
  } catch (error) {
    console.error("Update Project Error:", error);
    res.status(500).json({ message: "Internal server error updating project" });
  }
});

app.delete('/api/projects/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const proj = await prisma.project.findUnique({ where: { id: req.params.id } });
    await prisma.project.delete({ where: { id: req.params.id } });
    audit('delete', 'project', req.params.id, { name: proj?.name });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete Project Error:", error);
    res.status(500).json({ message: "Internal server error deleting project" });
  }
});

app.get('/api/positions', async (req, res) => {
  const { id, project_id, limit } = req.query;
  const where = {};
  if (id) {
    const ids = Array.isArray(id) ? id : [id];
    where.id = ids.length === 1 ? ids[0] : { in: ids };
  }
  if (project_id) where.project_id = project_id;

  try {
    console.log(`Fetching positions for project: ${project_id || 'all'}`);
    const rows = await prisma.position.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit ? Number(limit) : undefined
    });
    res.json(jsonRows(rows));
  } catch (error) {
    console.error("Fetch Positions Error:", error);
    res.status(500).json({ message: "Failed to fetch positions" });
  }
});

app.get('/api/positions/:id', async (req, res) => {
  try {
    const position = await prisma.position.findUnique({ where: { id: req.params.id } });
    if (!position) return res.status(404).json({ message: 'Position not found' });
    res.json(jsonRow(position));
  } catch (error) {
    console.error("Fetch Position By ID Error:", error);
    res.status(500).json({ message: "Internal server error fetching position by ID" });
  }
});

app.post('/api/positions', authMiddleware, async (req, res) => {
  try {
    const data = sanitizeFields(req.body);
    const id = nanoid();
    const position = await prisma.position.create({
      data: {
        id,
        project_id: data.project_id,
        title: data.title || '',
        description: data.description || '',
        location: data.location || '',
        shooting_date: data.shooting_date || '',
        compensation: data.compensation || '',
        spots_total: Number(data.spots_total) || 1,
        spots_filled: Number(data.spots_filled) || 0,
        age_min: data.age_min || null,
        age_max: data.age_max || null,
        gender: data.gender || 'any',
        required_skills: Array.isArray(data.required_skills) ? data.required_skills.join(',') : (data.required_skills || ''),
        notes: data.notes || '',
      }
    });
    res.json(jsonRow(position));
  } catch (error) {
    console.error("Create Position Error:", error);
    res.status(500).json({ message: "Internal server error creating position" });
  }
});

app.put('/api/positions/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await prisma.position.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Position not found' });
    const data = sanitizeFields(req.body);
    const updated = await prisma.position.update({
      where: { id: req.params.id },
      data: {
        title: data.title ?? existing.title,
        description: data.description ?? existing.description,
        location: data.location ?? existing.location,
        shooting_date: data.shooting_date ?? existing.shooting_date,
        compensation: data.compensation ?? existing.compensation,
        spots_total: data.spots_total !== undefined ? Number(data.spots_total) : existing.spots_total,
        spots_filled: data.spots_filled !== undefined ? Number(data.spots_filled) : existing.spots_filled,
        age_min: data.age_min ?? existing.age_min,
        age_max: data.age_max ?? existing.age_max,
        gender: data.gender ?? existing.gender,
        required_skills: Array.isArray(data.required_skills) ? data.required_skills.join(',') : (data.required_skills ?? existing.required_skills),
        notes: data.notes ?? existing.notes,
      }
    });
    res.json(jsonRow(updated));
  } catch (error) {
    console.error("Update Position Error:", error);
    res.status(500).json({ message: "Internal server error updating position" });
  }
});

app.delete('/api/positions/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.position.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete Position Error:", error);
    res.status(500).json({ message: "Internal server error deleting position" });
  }
});

app.get('/api/casting-slots', async (req, res) => {
  const { project_id, status, ids } = req.query;
  const where = {};
  if (project_id) where.project_id = project_id;
  if (status) where.status = status;
  if (ids) where.id = { in: ids.split(',') };

  try {
    const rows = await prisma.castingSlot.findMany({
      where,
      orderBy: [{ slot_date: 'asc' }, { start_time: 'asc' }],
    });
    res.json(jsonRows(rows));
  } catch (error) {
    console.error("Fetch Casting Slots Error:", error);
    res.status(500).json({ message: "Failed to fetch casting slots" });
  }
});

app.get('/api/applications', authMiddleware, async (req, res) => {
  const { user_id, project_id, position_id, status, limit } = req.query;
  const where = {};
  if (user_id) where.user_id = user_id;
  if (project_id) where.project_id = project_id;
  if (position_id) where.position_id = position_id;
  if (status) where.status = status;

  try {
    const rows = await prisma.application.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit ? Number(limit) : undefined
    });
    res.json(jsonRows(rows));
  } catch (error) {
    console.error("Fetch Applications Error:", error);
    res.status(500).json({ message: "Internal server error fetching applications" });
  }
});

app.get('/api/applications/:id', authMiddleware, async (req, res) => {
  try {
    const application = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json(jsonRow(application));
  } catch (error) {
    console.error("Fetch Application By ID Error:", error);
    res.status(500).json({ message: "Internal server error fetching application by ID" });
  }
});

app.post('/api/applications', authMiddleware, async (req, res) => {
  try {
    const data = sanitizeFields(req.body);
    const id = nanoid();

    const dupConditions = [
      ...(data.user_id ? [{ user_id: data.user_id }] : []),
      ...(data.applicant_email ? [{ applicant_email: data.applicant_email }] : []),
    ];
    if (dupConditions.length > 0) {
      const duplicate = await prisma.application.findFirst({
        where: { project_id: data.project_id, status: { not: 'rejected' }, OR: dupConditions },
      });
      if (duplicate) {
        return res.status(409).json({ message: 'You have already applied to this project.' });
      }
    }

    if (data.slot_id) {
      const claim = await prisma.castingSlot.updateMany({
        where: { id: data.slot_id, status: 'open' },
        data: { status: 'booked' },
      });
      if (claim.count === 0) {
        return res.status(409).json({ message: 'This time slot was just booked by someone else. Please pick another.' });
      }
    }

    try {
      const application = await prisma.application.create({
        data: {
          id,
          project_id: data.project_id,
          position_id: data.position_id,
          slot_id: data.slot_id || null,
          user_id: data.user_id || null,
          is_guest: data.is_guest ? 1 : 0,
          applicant_name: data.applicant_name || '',
          applicant_email: data.applicant_email || '',
          applicant_phone: data.applicant_phone || '',
          message: data.message || '',
          status: data.status || 'pending',
          admin_notes: data.admin_notes || '',
        }
      });
      res.json(jsonRow(application));
    } catch (innerError) {
      if (data.slot_id) {
        await prisma.castingSlot.update({ where: { id: data.slot_id }, data: { status: 'open' } });
      }
      throw innerError;
    }
  } catch (error) {
    console.error("Create Application Error:", error);
    res.status(500).json({ message: "Internal server error creating application" });
  }
});

app.put('/api/applications/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Application not found' });
    const body = sanitizeFields(req.body);

    // Handle spots_filled update for positions
    if (body.status === 'accepted' && existing.status !== 'accepted') {
      // If application is newly accepted, increment spots_filled for the position
      await prisma.position.update({
        where: { id: existing.position_id },
        data: { spots_filled: { increment: 1 } },
      });
    } else if (body.status !== 'accepted' && existing.status === 'accepted') {
      await prisma.position.update({
        where: { id: existing.position_id },
        data: { spots_filled: { decrement: 1 } },
      });
    }

    // Free the casting slot when a live_casting booking is rejected/cancelled
    const releasingStatuses = ['rejected', 'cancelled'];
    if (existing.slot_id && releasingStatuses.includes(body.status) && !releasingStatuses.includes(existing.status)) {
      await prisma.castingSlot.update({ where: { id: existing.slot_id }, data: { status: 'open' } });
    }

    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: {
        status: body.status ?? existing.status,
        admin_notes: body.admin_notes !== undefined ? body.admin_notes : existing.admin_notes,
        casting_notes: body.casting_notes !== undefined ? body.casting_notes : existing.casting_notes,
      }
    });
    if (body.status && body.status !== existing.status) {
      audit('update', 'application', updated.id, { from: existing.status, to: updated.status, user_id: existing.user_id, position_id: existing.position_id });

      // Send status-change email (non-blocking)
      (async () => {
        try {
          const [applicantUser, position] = await Promise.all([
            existing.user_id ? prisma.user.findUnique({ where: { id: existing.user_id } }) : null,
            existing.position_id ? prisma.position.findUnique({ where: { id: existing.position_id } }) : null,
          ]);
          const project = position?.project_id
            ? await prisma.project.findUnique({ where: { id: position.project_id } })
            : null;

          const recipientEmail = applicantUser?.email || existing.applicant_email;
          const recipientName  = applicantUser?.full_name || existing.applicant_name || 'Applicant';
          if (!recipientEmail) return;

          const positionTitle  = position?.title  || 'the position';
          const projectName    = project?.name    || 'the production';
          const adminNote      = updated.admin_notes ? `<p style="margin:16px 0;padding:12px 16px;background:#f4f4f5;border-left:3px solid #ef4136;border-radius:4px;font-style:italic;">${updated.admin_notes}</p>` : '';

          const STATUS_COPY = {
            accepted:  { emoji: '🎉', headline: 'You\'ve been accepted!',        body: `Congratulations! Your application for <strong>${positionTitle}</strong> in <strong>${projectName}</strong> has been <strong>accepted</strong>.` },
            rejected:  { emoji: '😔', headline: 'Application not selected',       body: `Thank you for your interest. Unfortunately your application for <strong>${positionTitle}</strong> in <strong>${projectName}</strong> was not selected at this time.` },
            waitlist:  { emoji: '⏳', headline: 'You\'re on the waitlist',        body: `Your application for <strong>${positionTitle}</strong> in <strong>${projectName}</strong> has been placed on the <strong>waitlist</strong>. We'll be in touch if a spot opens up.` },
            cancelled: { emoji: '❌', headline: 'Application cancelled',          body: `Your application for <strong>${positionTitle}</strong> in <strong>${projectName}</strong> has been cancelled.` },
          };

          const copy = STATUS_COPY[updated.status];
          if (!copy) return;

          await sendMail({
            to: recipientEmail,
            subject: `${copy.emoji} ${copy.headline} — cineCAST`,
            html: `
              <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#18181b;">
                <div style="background:linear-gradient(135deg,#ef4136,#fbb040);padding:32px;border-radius:12px 12px 0 0;text-align:center;">
                  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.5px;">cineCAST</h1>
                </div>
                <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e4e4e7;border-top:none;">
                  <p style="margin:0 0 8px;font-size:13px;color:#71717a;">Hi ${recipientName},</p>
                  <h2 style="margin:0 0 16px;font-size:20px;font-weight:800;">${copy.emoji} ${copy.headline}</h2>
                  <p style="margin:0 0 16px;line-height:1.6;color:#3f3f46;">${copy.body}</p>
                  ${adminNote}
                  <p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;">You can view all your applications in your <a href="${APP_URL}/dashboard" style="color:#ef4136;text-decoration:none;font-weight:600;">cineCAST dashboard</a>.</p>
                </div>
                <p style="text-align:center;margin-top:24px;font-size:12px;color:#a1a1aa;">© cineCAST · Slovak Casting Agency</p>
              </div>
            `,
          });
        } catch (mailErr) {
          console.error('[status-email]', mailErr);
        }
      })();
    }
    res.json(jsonRow(updated));
  } catch (error) {
    console.error("Update Application Error:", error);
    res.status(500).json({ message: "Internal server error updating application" });
  }
});

app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const rows = await prisma.notification.findMany({
      where: req.query.user_id ? { user_id: req.query.user_id } : {},
      orderBy: { created_at: 'desc' }
    });
    res.json(jsonRows(rows));
  } catch (error) {
    console.error("Fetch Notifications Error:", error);
    res.status(500).json({ message: "Internal server error fetching notifications" });
  }
});

app.post('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const { user_id, message } = req.body;
    if (!user_id || !message) {
      return res.status(400).json({ message: 'user_id and message are required' });
    }
    const id = nanoid();
    const notification = await prisma.notification.create({
      data: { id, user_id, message, read: 0 }
    });
    res.json(jsonRow(notification));
  } catch (error) {
    console.error("Create Notification Error:", error);
    res.status(500).json({ message: "Internal server error creating notification" });
  }
});

app.put('/api/notifications/:id', authMiddleware, async (req, res) => {
  try {
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: req.body.read ? 1 : 0 }
    });
    res.json(jsonRow(updated));
  } catch (error) {
    console.error("Update Notification Error:", error);
    res.status(500).json({ message: "Internal server error updating notification" });
  }
});

app.post('/api/notifications/mark-all-read', authMiddleware, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { user_id: req.user.id, read: 0 },
      data: { read: 1 },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Mark All Read Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get('/api/audit-logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '25')));
    const skip  = (page - 1) * limit;

    const where = {};
    if (req.query.action && req.query.action !== 'all') where.action = req.query.action;
    if (req.query.entity_type) where.entity_type = req.query.entity_type;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { created_at: 'desc' }, skip, take: limit }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      data: jsonRows(logs),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Fetch Audit Logs Error:", error);
    res.status(500).json({ message: "Internal server error fetching audit logs" });
  }
});

app.post('/api/audit-logs', authMiddleware, async (req, res) => {
  try {
    const id = nanoid();
    const log = await prisma.auditLog.create({
      data: {
        id,
        action: req.body.action || '',
        entity_type: req.body.entity_type || '',
        entity_id: req.body.entity_id || '',
        details: req.body.details || '',
      }
    });
    res.json(jsonRow(log));
  } catch (error) {
    console.error("Create Audit Log Error:", error);
    res.status(500).json({ message: "Internal server error creating audit log" });
  }
});

// ── CONTACT FORM ─────────────────────────────────────────────────────────────
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });

app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const { name, email, message } = sanitizeFields(req.body);
    if (!message?.trim()) return res.status(400).json({ message: 'Message is required.' });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }

    await sendMail({
      to: process.env.CONTACT_EMAIL || 'castingdirector@cinecast.sk',
      subject: `CineCAST contact form${name ? ` — ${name}` : ''}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0c;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#ef4136,#fbb040);padding:24px 32px;">
            <h1 style="margin:0;font-size:22px;font-weight:800;letter-spacing:0.05em;">NEW MESSAGE</h1>
            <p style="margin:4px 0 0;opacity:0.85;font-size:13px;">Via cineCAST contact form</p>
          </div>
          <div style="padding:32px;">
            ${name ? `<p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.1em;">From</p><p style="margin:0 0 24px;font-size:16px;font-weight:600;">${name}</p>` : ''}
            ${email ? `<p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.1em;">Reply-to</p><p style="margin:0 0 24px;"><a href="mailto:${email}" style="color:#fbb040;">${email}</a></p>` : ''}
            <p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.1em;">Message</p>
            <p style="margin:0;line-height:1.7;font-size:15px;white-space:pre-wrap;">${message}</p>
          </div>
        </div>`,
    });

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ message: 'Failed to send message. Please try again.' });
  }
});

app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ file_url: fileUrl });
  } catch (error) {
    console.error("Upload File Error:", error);
    res.status(500).json({ message: "Internal server error during file upload" });
  }
});

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully.");
    app.listen(PORT, () => {
      console.log(`Backend listening at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to database or start server:", error);
    process.exit(1); // Exit the process if DB connection fails
  }
}

startServer();
