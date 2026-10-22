import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
fs.mkdirSync(dir, { recursive: true });

const db = new DatabaseSync(path.join(dir, 'ielts.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  level_range TEXT NOT NULL,
  description TEXT NOT NULL,
  duration TEXT NOT NULL,
  schedule TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  features TEXT NOT NULL DEFAULT '[]',
  featured INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  bio TEXT NOT NULL,
  ielts TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  band TEXT NOT NULL,
  content TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  options TEXT NOT NULL,
  answer INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  goal TEXT NOT NULL DEFAULT '',
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'website',
  score INTEGER,
  level TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);
`);

function seed() {
  const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;

  if (!count('courses')) {
    const ins = db.prepare(
      'INSERT INTO courses (slug,name,level_range,description,duration,schedule,price,features,featured,sort) VALUES (?,?,?,?,?,?,?,?,?,?)'
    );
    [
      ['foundation', 'IELTS Foundation', '0 → 4.5', 'Xây nền tảng ngữ pháp, từ vựng và phát âm trước khi vào luyện đề.', '48 buổi / 4 tháng', 'T2-T4-T6 · 18:30-20:30', 4800000, ['Phát âm & từ vựng cốt lõi', 'Làm quen 4 kỹ năng', 'Bài tập về nhà có chữa'], 0],
      ['intermediate', 'IELTS Intermediate', '4.5 → 6.0', 'Phát triển 4 kỹ năng theo format đề thi thật, có bài thi thử hàng tháng.', '60 buổi / 5 tháng', 'T3-T5-T7 · 18:30-20:30', 7200000, ['Chấm chữa Writing 1-1', 'Mock test mỗi tháng', 'Lớp tối đa 12 học viên'], 1],
      ['advanced', 'IELTS Advanced', '6.0 → 7.5+', 'Chiến lược band cao, nâng cấp lập luận Writing và độ trôi chảy Speaking.', '48 buổi / 4 tháng', 'T2-T4-T6 · 19:00-21:00', 9600000, ['Lớp tối đa 8 học viên', 'Speaking 1-1 hàng tuần', 'Cam kết đầu ra bằng văn bản'], 0],
      ['crash', 'IELTS Crash Course', 'Cấp tốc', 'Ôn tập tăng tốc 6 tuần trước kỳ thi cho học viên đã có nền tảng.', '24 buổi / 6 tuần', 'T7-CN · 8:00-11:00', 5400000, ['Giải đề & mẹo làm bài', 'Sửa lỗi cá nhân', 'Thi thử cuối khóa'], 0],
    ].forEach(([slug, name, lr, d, dur, sch, price, feats, featured], i) =>
      ins.run(slug, name, lr, d, dur, sch, price, JSON.stringify(feats), featured, i)
    );
  }

  if (!count('teachers')) {
    const ins = db.prepare('INSERT INTO teachers (name,title,bio,ielts) VALUES (?,?,?,?)');
    ins.run('Nguyễn Minh Anh', 'Giảng viên Writing', '8 năm kinh nghiệm luyện thi, từng chấm chữa hơn 3.000 bài Writing.', '8.5');
    ins.run('Trần Quốc Huy', 'Giảng viên Speaking', 'Chứng chỉ CELTA, chuyên sửa phát âm và tăng độ trôi chảy.', '8.0');
    ins.run('Lê Thu Phương', 'Giảng viên Listening & Reading', '6 năm kinh nghiệm, nổi tiếng với phương pháp đọc nhanh theo dạng bài.', '8.5');
  }

  if (!count('testimonials')) {
    const ins = db.prepare('INSERT INTO testimonials (name,band,content) VALUES (?,?,?)');
    ins.run('Hoàng Gia Bảo', '7.0', 'Mình từ 5.0 lên 7.0 sau 5 tháng. Phần chấm Writing rất kỹ và dễ hiểu.');
    ins.run('Phạm Ngọc Linh', '7.5', 'Lớp ít người nên được luyện Speaking nhiều, hết sợ nói tiếng Anh.');
    ins.run('Vũ Đức Minh', '8.0', 'Mock test giống thi thật, vào phòng thi không còn bị áp lực.');
  }

  if (!count('faqs')) {
    const ins = db.prepare('INSERT INTO faqs (question,answer) VALUES (?,?)');
    ins.run('Tôi chưa biết trình độ của mình thì học khóa nào?', 'Bạn làm bài test đầu vào miễn phí ngay trên website, trung tâm sẽ gợi ý khóa phù hợp.');
    ins.run('Có học online không?', 'Có. Các lớp đều có hình thức online và offline với cùng giáo trình.');
    ins.run('Cam kết đầu ra hoạt động thế nào?', 'Học viên đi học đủ từ 80% số buổi và làm đủ bài tập; nếu chưa đạt band cam kết sẽ được học lại miễn phí.');
    ins.run('Học phí bao nhiêu và có trả góp không?', 'Học phí hiển thị ở từng khóa. Trung tâm hỗ trợ chia 2 đợt và ưu đãi đăng ký sớm.');
  }

  if (!count('questions')) {
    const ins = db.prepare('INSERT INTO questions (text,options,answer) VALUES (?,?,?)');
    [
      ['She ___ to school every day.', ['go', 'goes', 'going', 'gone'], 1],
      ['I have lived here ___ 2019.', ['for', 'since', 'during', 'from'], 1],
      ['If it rains tomorrow, we ___ at home.', ['stay', 'stayed', 'will stay', 'would stay'], 2],
      ['The book ___ by millions of people.', ['has read', 'has been read', 'is reading', 'have read'], 1],
      ['He asked me where ___.', ['do I live', 'I lived', 'did I live', 'I live'], 1],
      ['Choose the word closest in meaning to "reluctant".', ['eager', 'unwilling', 'careless', 'sudden'], 1],
      ['By the time we arrived, the film ___.', ['already started', 'has already started', 'had already started', 'was already starting'], 2],
      ['___ the heavy traffic, we arrived on time.', ['Despite', 'Although', 'However', 'Because'], 0],
      ['Rarely ___ such a talented musician.', ['I have seen', 'have I seen', 'I saw', 'did I saw'], 1],
      ['Had she studied harder, she ___ the exam.', ['would pass', 'would have passed', 'will pass', 'had passed'], 1],
      ['Choose the word closest in meaning to "ubiquitous".', ['rare', 'omnipresent', 'ancient', 'fragile'], 1],
      ['The report, ___ findings surprised everyone, was published yesterday.', ['that', 'which', 'whose', 'whom'], 2],
    ].forEach(([t, o, a]) => ins.run(t, JSON.stringify(o), a));
  }

  const email = (process.env.ADMIN_EMAIL || 'admin@ieltshub.vn').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  if (!count('admins')) {
    db.prepare('INSERT INTO admins (email,password_hash) VALUES (?,?)').run(email, bcrypt.hashSync(password, 10));
    console.log(`Đã tạo tài khoản admin: ${email}`);
    if (!process.env.ADMIN_PASSWORD) console.warn('⚠ Đang dùng mật khẩu mặc định "admin123" – hãy đặt ADMIN_PASSWORD trong .env');
  }
}
seed();

export default db;
