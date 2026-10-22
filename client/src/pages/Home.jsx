import { Link } from 'react-router-dom';
import { useApi } from '../api.js';
import Async from '../components/Async.jsx';
import CourseCard from '../components/CourseCard.jsx';
import LeadForm from '../components/LeadForm.jsx';

const initials = (name) => name.split(' ').slice(-2).map((w) => w[0]).join('');

const WHY = [
  ['🎯', 'Cam kết đầu ra', 'Không đạt band cam kết, học lại miễn phí cho đến khi đạt.'],
  ['👥', 'Lớp nhỏ', 'Tối đa 12 học viên để giáo viên theo sát từng người.'],
  ['✍️', 'Chấm chữa chi tiết', 'Writing & Speaking chấm theo 4 tiêu chí chính thức của IELTS.'],
  ['📊', 'Theo dõi tiến độ', 'Báo cáo điểm số định kỳ gửi học viên và phụ huynh.'],
  ['🧪', 'Thi thử như thật', 'Phòng thi mô phỏng, đề cập nhật theo quý.'],
  ['💬', 'Hỗ trợ ngoài giờ', 'Nhóm học tập và giáo viên giải đáp ngoài giờ học.'],
];

export default function Home() {
  const courses = useApi('/courses');
  const teachers = useApi('/teachers');
  const testimonials = useApi('/testimonials');
  const faqs = useApi('/faqs');

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Trung tâm luyện thi IELTS</p>
            <h1>Chinh phục IELTS <em>7.0+</em> với lộ trình cá nhân hóa</h1>
            <p className="lead">Lớp tối đa 12 học viên, giáo viên IELTS 8.0+, chấm chữa Writing &amp; Speaking từng bài. Cam kết đầu ra bằng văn bản.</p>
            <div className="hero-cta">
              <Link to="/test-trinh-do" className="btn">Test trình độ miễn phí</Link>
              <Link to="/khoa-hoc" className="btn btn-ghost">Xem khóa học</Link>
            </div>
            <ul className="stats">
              <li><strong>5.000+</strong><span>học viên</span></li>
              <li><strong>96%</strong><span>đạt đầu ra</span></li>
              <li><strong>12</strong><span>học viên / lớp</span></li>
            </ul>
          </div>
          <div className="hero-card" aria-hidden="true">
            <div className="score"><span>Overall</span><strong>7.5</strong></div>
            <div className="bars">
              {[['Listening', 90, '8.5'], ['Reading', 85, '8.0'], ['Writing', 70, '6.5'], ['Speaking', 75, '7.0']].map(([l, w, b]) => (
                <div key={l}><label>{l}</label><i style={{ '--w': `${w}%` }} /><b>{b}</b></div>
              ))}
            </div>
            <p className="note">Ví dụ kết quả học viên sau 4 tháng</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>Khóa học</h2>
          <p className="sub">Chọn khóa phù hợp với điểm đầu vào và mục tiêu của bạn.</p>
          <Async state={courses}>
            {(list) => <div className="cards">{list.map((c) => <CourseCard key={c.id} course={c} />)}</div>}
          </Async>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <h2>Vì sao chọn IELTS Hub</h2>
          <div className="features">
            {WHY.map(([icon, title, text]) => (
              <div key={title}><h3>{icon} {title}</h3><p>{text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section id="teachers" className="section">
        <div className="container">
          <h2>Đội ngũ giảng viên</h2>
          <Async state={teachers}>
            {(list) => (
              <div className="cards three">
                {list.map((t) => (
                  <article className="teacher" key={t.id}>
                    <div className="avatar">{initials(t.name)}</div>
                    <h3>{t.name}</h3>
                    <p><strong>IELTS {t.ielts}</strong> · {t.title}</p>
                    <p>{t.bio}</p>
                  </article>
                ))}
              </div>
            )}
          </Async>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <h2>Học viên nói gì</h2>
          <Async state={testimonials}>
            {(list) => (
              <div className="cards three">
                {list.map((t) => (
                  <blockquote className="quote" key={t.id}>
                    “{t.content}”
                    <cite>{t.name} · IELTS {t.band}</cite>
                  </blockquote>
                ))}
              </div>
            )}
          </Async>
        </div>
      </section>

      <section className="section cta">
        <div className="container reg-grid">
          <div>
            <h2>Nhận tư vấn lộ trình miễn phí</h2>
            <p>Để lại thông tin, tư vấn viên sẽ liên hệ trong 24 giờ. Hoặc <Link to="/test-trinh-do" className="link-light">làm bài test trình độ online</Link> ngay bây giờ.</p>
          </div>
          <LeadForm />
        </div>
      </section>

      <section id="faq" className="section">
        <div className="container narrow">
          <h2>Câu hỏi thường gặp</h2>
          <Async state={faqs}>
            {(list) => list.map((f) => (
              <details key={f.id}><summary>{f.question}</summary><p>{f.answer}</p></details>
            ))}
          </Async>
        </div>
      </section>
    </>
  );
}
