import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import db from '../db.js';

const router = Router();
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
if (!process.env.JWT_SECRET) console.warn('⚠ Chưa đặt JWT_SECRET trong .env – đang dùng khóa mặc định.');

const STATUSES = ['new', 'contacted', 'enrolled', 'lost'];

router.post(
  '/login',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, message: { error: 'Thử lại sau 15 phút.' } }),
  (req, res) => {
    const email = String(req.body?.email ?? '').toLowerCase();
    const password = String(req.body?.password ?? '');
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
      return res.status(401).json({ error: 'Sai email hoặc mật khẩu.' });
    }
    const token = jwt.sign({ id: admin.id, email: admin.email }, SECRET, { expiresIn: '8h' });
    res.json({ token, email: admin.email });
  }
);

// Mọi route bên dưới cần đăng nhập
router.use((req, res, next) => {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization ?? '');
  try {
    req.admin = jwt.verify(m?.[1] ?? '', SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Chưa đăng nhập hoặc phiên đã hết hạn.' });
  }
});

router.get('/stats', (_req, res) => {
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const r of db.prepare('SELECT status, COUNT(*) AS n FROM leads GROUP BY status').all()) byStatus[r.status] = r.n;
  const week = db.prepare("SELECT COUNT(*) AS n FROM leads WHERE created_at >= datetime('now','-7 days')").get().n;
  res.json({ total: Object.values(byStatus).reduce((a, b) => a + b, 0), week, byStatus });
});

const LEAD_SELECT = `SELECT l.*, c.name AS course_name FROM leads l LEFT JOIN courses c ON c.id = l.course_id`;

function queryLeads({ status, q }) {
  const where = [];
  const params = [];
  if (STATUSES.includes(status)) { where.push('l.status = ?'); params.push(status); }
  if (q) {
    where.push('(l.name LIKE ? OR l.phone LIKE ? OR l.email LIKE ?)');
    params.push(...Array(3).fill(`%${q}%`));
  }
  return db.prepare(`${LEAD_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY l.id DESC`).all(...params);
}

router.get('/leads', (req, res) => res.json(queryLeads(req.query)));

router.get('/leads.csv', (req, res) => {
  const cols = ['id', 'created_at', 'name', 'phone', 'email', 'goal', 'course_name', 'source', 'score', 'level', 'status', 'note'];
  // Chặn CSV injection: ô bắt đầu bằng = + - @ sẽ bị Excel hiểu là công thức
  const cell = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const rows = queryLeads(req.query).map((r) => cols.map((c) => cell(r[c])).join(','));
  res.type('text/csv').send('﻿' + [cols.join(','), ...rows].join('\n'));
});

router.patch('/leads/:id', (req, res) => {
  const { status, note } = req.body ?? {};
  if (status !== undefined && !STATUSES.includes(status)) return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
  const cur = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Không tìm thấy.' });
  db.prepare('UPDATE leads SET status = ?, note = ? WHERE id = ?').run(
    status ?? cur.status,
    typeof note === 'string' ? note.slice(0, 1000) : cur.note,
    cur.id
  );
  res.json({ ok: true });
});

router.delete('/leads/:id', (req, res) => {
  db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---- Quản lý khóa học ----
function readCourse(b = {}) {
  const c = {
    slug: String(b.slug ?? '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50),
    name: String(b.name ?? '').trim().slice(0, 100),
    level_range: String(b.level_range ?? '').trim().slice(0, 40),
    description: String(b.description ?? '').trim().slice(0, 500),
    duration: String(b.duration ?? '').trim().slice(0, 60),
    schedule: String(b.schedule ?? '').trim().slice(0, 100),
    price: Math.max(0, Math.round(Number(b.price) || 0)),
    features: JSON.stringify((Array.isArray(b.features) ? b.features : []).map((f) => String(f).trim().slice(0, 100)).filter(Boolean)),
    featured: b.featured ? 1 : 0,
    sort: Math.round(Number(b.sort) || 0),
  };
  if (!c.slug || !c.name || !c.level_range || !c.description || !c.duration) return { error: 'Thiếu thông tin bắt buộc.' };
  return c;
}

const COURSE_COLS = ['slug', 'name', 'level_range', 'description', 'duration', 'schedule', 'price', 'features', 'featured', 'sort'];

router.post('/courses', (req, res) => {
  const c = readCourse(req.body);
  if (c.error) return res.status(400).json({ error: c.error });
  try {
    const r = db.prepare(`INSERT INTO courses (${COURSE_COLS.join(',')}) VALUES (${COURSE_COLS.map(() => '?').join(',')})`).run(...COURSE_COLS.map((k) => c[k]));
    res.status(201).json({ id: Number(r.lastInsertRowid) });
  } catch {
    res.status(409).json({ error: 'Slug đã tồn tại.' });
  }
});

router.put('/courses/:id', (req, res) => {
  const c = readCourse(req.body);
  if (c.error) return res.status(400).json({ error: c.error });
  try {
    const r = db.prepare(`UPDATE courses SET ${COURSE_COLS.map((k) => k + ' = ?').join(',')} WHERE id = ?`).run(...COURSE_COLS.map((k) => c[k]), req.params.id);
    if (!r.changes) return res.status(404).json({ error: 'Không tìm thấy.' });
    res.json({ ok: true });
  } catch {
    res.status(409).json({ error: 'Slug đã tồn tại.' });
  }
});

router.delete('/courses/:id', (req, res) => {
  db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
