import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setToken } from '../api.js';

export default function AdminLogin() {
  const nav = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { token } = await api('/admin/login', { method: 'POST', body: Object.fromEntries(new FormData(e.currentTarget)) });
      setToken(token);
      nav('/admin');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="form login" onSubmit={onSubmit}>
        <Link to="/" className="logo">IELTS<span>Hub</span></Link>
        <h2 className="left">Đăng nhập quản trị</h2>
        <label>Email<input name="email" type="email" required autoComplete="username" /></label>
        <label>Mật khẩu<input name="password" type="password" required autoComplete="current-password" /></label>
        <button className="btn" disabled={loading}>{loading ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
        {error && <p className="msg error">{error}</p>}
      </form>
    </div>
  );
}
