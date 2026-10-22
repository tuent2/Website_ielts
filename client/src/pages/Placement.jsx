import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, useApi } from '../api.js';
import Async from '../components/Async.jsx';

export default function Placement() {
  const quiz = useApi('/quiz');
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [state, setState] = useState({ loading: false, error: '' });

  async function submit(e) {
    e.preventDefault();
    const contact = Object.fromEntries(new FormData(e.currentTarget));
    setState({ loading: true, error: '' });
    try {
      setResult(await api('/quiz/submit', { method: 'POST', body: { ...contact, answers } }));
      window.scrollTo(0, 0);
    } catch (err) {
      setState({ loading: false, error: err.message });
      return;
    }
    setState({ loading: false, error: '' });
  }

  if (result) {
    return (
      <section className="section narrow center">
        <h1>Kết quả của bạn</h1>
        <div className="result">
          <strong>{result.score}/{result.total}</strong>
          <span>Trình độ ước tính: <b>IELTS {result.level}</b></span>
        </div>
        {result.course && <p>Khóa học gợi ý: <b>{result.course.name}</b></p>}
        <p className="muted">Tư vấn viên sẽ liên hệ để xếp lớp và đặt lịch kiểm tra Speaking/Writing chi tiết.</p>
        <div className="hero-cta center-row">
          <Link to="/khoa-hoc" className="btn">Xem khóa học</Link>
          <Link to="/" className="btn btn-ghost">Về trang chủ</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container narrow">
        <h1 className="center">Test trình độ online</h1>
        <p className="sub">12 câu ngữ pháp &amp; từ vựng, khoảng 10 phút. Kết quả mang tính tham khảo.</p>
        <Async state={quiz}>
          {(questions) => (
            <form onSubmit={submit}>
              {questions.map((q, i) => (
                <fieldset className="question" key={q.id}>
                  <legend>{i + 1}. {q.text}</legend>
                  {q.options.map((opt, idx) => (
                    <label key={idx} className="option">
                      <input type="radio" name={`q${q.id}`} required checked={answers[q.id] === idx}
                        onChange={() => setAnswers({ ...answers, [q.id]: idx })} />
                      {opt}
                    </label>
                  ))}
                </fieldset>
              ))}
              <div className="form">
                <h3>Nhập thông tin để xem kết quả</h3>
                <label>Họ và tên<input name="name" required minLength={2} autoComplete="name" /></label>
                <label>Số điện thoại<input name="phone" type="tel" required pattern="[0-9+\s().\-]{9,16}" autoComplete="tel" /></label>
                <label>Email (không bắt buộc)<input name="email" type="email" autoComplete="email" /></label>
                <button className="btn" disabled={state.loading}>{state.loading ? 'Đang chấm…' : 'Nộp bài & xem kết quả'}</button>
                {state.error && <p className="msg error">{state.error}</p>}
              </div>
            </form>
          )}
        </Async>
      </div>
    </section>
  );
}
