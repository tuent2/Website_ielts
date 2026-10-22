# IELTS Hub

React (Vite) + Express + SQLite (`node:sqlite`, cần Node ≥ 22.13).

## Chạy
```bash
npm install
cp .env.example .env     # đổi JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run dev              # web http://localhost:5173 · api http://localhost:4000
```
Production: `npm run build && npm start` (Express phục vụ luôn bản build, cổng 4000).

## Trang
- `/` trang chủ · `/khoa-hoc` · `/test-trinh-do` (quiz 12 câu, lưu lead) · `/dang-ky`
- `/admin` quản trị: xem/lọc/xuất CSV học viên đăng ký, đổi trạng thái, ghi chú, CRUD khóa học

Database nằm ở `server/data/ielts.db` (tự tạo + seed lần chạy đầu). Tài khoản admin tạo từ `.env` ở lần chạy đầu tiên.
