import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <header className="header">
        <div className="container nav">
          <Link to="/" className="logo" onClick={close}>IELTS<span>Hub</span></Link>
          <button className="nav-toggle" aria-label="Mở menu" aria-expanded={open} onClick={() => setOpen(!open)}>☰</button>
          <nav className={`menu ${open ? 'open' : ''}`} onClick={close}>
            <NavLink to="/" end>Trang chủ</NavLink>
            <NavLink to="/khoa-hoc">Khóa học</NavLink>
            <Link to="/#teachers">Giảng viên</Link>
            <Link to="/#faq">Hỏi đáp</Link>
            <NavLink to="/test-trinh-do">Test trình độ</NavLink>
            <Link to="/dang-ky" className="btn btn-sm">Đăng ký tư vấn</Link>
          </nav>
        </div>
      </header>

      <main><Outlet /></main>

      <footer className="footer">
        <div className="container foot-grid">
          <div>
            <Link to="/" className="logo light">IELTS<span>Hub</span></Link>
            <p>Luyện thi IELTS hiệu quả, minh bạch, cam kết đầu ra.</p>
          </div>
          <div>
            <h4>Liên hệ</h4>
            <p>📍 123 Đường ABC, Quận 1, TP.HCM</p>
            <p>📞 0900 000 000</p>
            <p>✉️ hello@ieltshub.vn</p>
          </div>
          <div>
            <h4>Giờ làm việc</h4>
            <p>Thứ 2 – Thứ 7: 8:00 – 21:00</p>
            <p>Chủ nhật: 8:00 – 17:00</p>
            <p><Link to="/admin">Quản trị</Link></p>
          </div>
        </div>
        <p className="copy">© {new Date().getFullYear()} IELTS Hub. Mọi quyền được bảo lưu.</p>
      </footer>
    </>
  );
}
