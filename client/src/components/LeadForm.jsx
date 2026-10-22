import { useState } from 'react';
import { api, useApi } from '../api.js';

export default function LeadForm({ defaultCourse = '' }) {
  const { data: courses } = useApi('/courses');
  const [state, setState] = useState({ status: 'idle', message: '' });

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    setState({ status: 'loading', message: '' });
    try {
      await api('/leads', { method: 'POST', body });
      setState({ status: 'ok', message: 'Cảm ơn bạn! Chúng tôi sẽ liên hệ trong 24 giờ.' });
      form.reset();
    } catch (err) {
      setState({ status: 'error', message: err.message });
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label>Họ và tên
        <input name="name" required minLength={2} maxLength={100} autoComplete="name" />
      </label>
      <label>Số điện thoại
        <input name="phone" type="tel" required pattern="[0-9+\s().\-]{9,16}" autoComplete="tel" />
      </label>
      <label>Email (không bắt buộc)
        <input name="email" type="email" autoComplete="email" />
      </label>
      <div className="row">
        <label>Khóa quan tâm
          <select name="courseId" defaultValue={defaultCourse}>
            <option value="">Chưa chắc chắn</option>
            {courses?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>Mục tiêu band
          <select name="goal" defaultValue="7.0">
            {['5.5', '6.0', '6.5', '7.0', '7.5', '8.0+'].map((g) => <option key={g}>{g}</option>)}
          </select>
        </label>
      </div>
      <button className="btn" type="submit" disabled={state.status === 'loading'}>
        {state.status === 'loading' ? 'Đang gửi…' : 'Đăng ký ngay'}
      </button>
      <p className={`msg ${state.status === 'error' ? 'error' : ''}`} role="status">{state.message}</p>
    </form>
  );
}
