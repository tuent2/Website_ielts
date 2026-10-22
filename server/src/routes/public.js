import { Router } from 'express';
import db from '../db.js';

const router = Router();

const parseCourse = (c) => ({ ...c, features: JSON.parse(c.features), featured: !!c.featured });

router.get('/courses', (_req, res) => {
  res.json(db.prepare('SELECT * FROM courses ORDER BY sort, id').all().map(parseCourse));
});
router.get('/teachers', (_req, res) => res.json(db.prepare('SELECT * FROM teachers ORDER BY id').all()));
router.get('/testimonials', (_req, res) => res.json(db.prepare('SELECT * FROM testimonials ORDER BY id').all()));
router.get('/faqs', (_req, res) => res.json(db.prepare('SELECT * FROM faqs ORDER BY id').all()));

// Câu hỏi test trình độ – không trả đáp án đúng về client
router.get('/quiz', (_req, res) => {
  const rows = db.prepare('SELECT id, text, options FROM questions ORDER BY id').all();
  res.json(rows.map((q) => ({ ...q, options: JSON.parse(q.options) })));
});

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function readContact(body) {
  const name = str(body.name, 100);
  const phone = str(body.phone, 20);
  const email = str(body.email, 120);
  const goal = str(body.goal, 20);
  if (name.length < 2) return { error: 'Vui lòng nhập họ tên.' };
  if (!/^[0-9+\s().-]{9,16}$/.test(phone)) return { error: 'Số điện thoại không hợp lệ.' };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Email không hợp lệ.' };
  return { name, phone, email, goal };
}

function courseIdOf(value) {
  const id = Number(value);
  if (!Number.isInteger(id)) return null;
  return db.prepare('SELECT id FROM courses WHERE id = ?').get(id)?.id ?? null;
}

router.post('/leads', (req, res) => {
  const c = readContact(req.body ?? {});
  if (c.error) return res.status(400).json({ error: c.error });
  db.prepare('INSERT INTO leads (name,phone,email,goal,course_id,source) VALUES (?,?,?,?,?,?)').run(
    c.name, c.phone, c.email, c.goal, courseIdOf(req.body.courseId), 'website'
  );
  res.status(201).json({ ok: true });
});

function levelFor(score) {
  if (score <= 3) return { level: 'Dưới 4.5', slug: 'foundation' };
  if (score <= 7) return { level: '4.5 – 6.0', slug: 'intermediate' };
  return { level: '6.0 trở lên', slug: 'advanced' };
}

router.post('/quiz/submit', (req, res) => {
  const body = req.body ?? {};
  const c = readContact(body);
  if (c.error) return res.status(400).json({ error: c.error });

  const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
  const questions = db.prepare('SELECT id, answer FROM questions').all();
  const score = questions.filter((q) => Number(answers[q.id]) === q.answer).length;
  const { level, slug } = levelFor(Math.round((score / questions.length) * 12));
  const course = db.prepare('SELECT id, slug, name FROM courses WHERE slug = ?').get(slug);

  db.prepare('INSERT INTO leads (name,phone,email,goal,course_id,source,score,level,note) VALUES (?,?,?,?,?,?,?,?,?)').run(
    c.name, c.phone, c.email, c.goal, course?.id ?? null, 'placement-test', score, level,
    `Test online: ${score}/${questions.length}`
  );
  res.json({ score, total: questions.length, level, course: course ?? null });
});

export default router;
