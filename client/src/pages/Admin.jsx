import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setToken, vnd } from '../api.js';

const STATUS = { new: 'Mới', contacted: 'Đã liên hệ', enrolled: 'Đã đăng ký', lost: 'Không theo' };

export default function Admin() {
  const nav = useNavigate();
  const [tab, setTab] = useState('leads');
  const logout = () => { setToken(null); nav('/admin/login'); };

  return (
    <div className="admin">
      <header className="admin-bar">
        <Link to="/" className="logo">IELTS<span>Hub</span> <small>Quản trị</small></Link>
        <div className="admin-tabs">
          <button className={tab === 'leads' ? 'on' : ''} onClick={() => setTab('leads')}>Học viên đăng ký</button>
          <button className={tab === 'courses' ? 'on' : ''} onClick={() => setTab('courses')}>Khóa học</button>
        </div>
        <button className="btn btn-sm btn-ghost" onClick={logout}>Đăng xuất</button>
      </header>
      <div className="container admin-body">{tab === 'leads' ? <Leads /> : <CoursesAdmin />}</div>
    </div>
  );
}

function Leads() {
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status, q });
      const [s, l] = await Promise.all([api('/admin/stats'), api(`/admin/leads?${params}`)]);
      setStats(s); setLeads(l); setError('');
    } catch (e) { setError(e.message); }
  }, [status, q]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce ô tìm kiếm
    return () => clearTimeout(t);
  }, [load]);

  async function update(id, patch) {
    try { await api(`/admin/leads/${id}`, { method: 'PATCH', body: patch }); load(); } catch (e) { setError(e.message); }
  }
  async function remove(id) {
    if (!confirm('Xóa đăng ký này?')) return;
    try { await api(`/admin/leads/${id}`, { method: 'DELETE' }); load(); } catch (e) { setError(e.message); }
  }
  async function exportCsv() {
    const res = await api(`/admin/leads.csv?${new URLSearchParams({ status, q })}`, { raw: true });
    const url = URL.createObjectURL(await res.blob());
    Object.assign(document.createElement('a'), { href: url, download: 'leads.csv' }).click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {stats && (
        <div className="stat-row">
          <div><strong>{stats.total}</strong><span>Tổng đăng ký</span></div>
          <div><strong>{stats.week}</strong><span>7 ngày qua</span></div>
          <div><strong>{stats.byStatus.new}</strong><span>Chưa xử lý</span></div>
          <div><strong>{stats.byStatus.enrolled}</strong><span>Đã đăng ký học</span></div>
        </div>
      )}
      <div className="toolbar">
        <input placeholder="Tìm tên, SĐT, email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn btn-sm btn-ghost" onClick={exportCsv}>Xuất CSV</button>
      </div>
      {error && <p className="msg error">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Ngày</th><th>Họ tên</th><th>Liên hệ</th><th>Quan tâm</th><th>Nguồn</th><th>Trạng thái</th><th>Ghi chú</th><th /></tr></thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td>{l.created_at.slice(0, 10)}</td>
                <td><b>{l.name}</b></td>
                <td>{l.phone}<br /><small>{l.email}</small></td>
                <td>{l.course_name || '—'}<br /><small>Mục tiêu {l.goal || '—'}</small></td>
                <td>{l.source === 'placement-test' ? `Test ${l.score}/12 · ${l.level}` : 'Form'}</td>
                <td>
                  <select value={l.status} onChange={(e) => update(l.id, { status: e.target.value })}>
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td>
                  <input defaultValue={l.note} placeholder="Ghi chú…" onBlur={(e) => e.target.value !== l.note && update(l.id, { note: e.target.value })} />
                </td>
                <td><button className="icon-btn" title="Xóa" onClick={() => remove(l.id)}>🗑</button></td>
              </tr>
            ))}
            {!leads.length && <tr><td colSpan={8} className="muted center">Chưa có đăng ký nào.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

const EMPTY = { slug: '', name: '', level_range: '', description: '', duration: '', schedule: '', price: 0, features: [], featured: false, sort: 0 };

function CoursesAdmin() {
  const [courses, setCourses] = useState([]);
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => api('/courses').then(setCourses).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function save(e) {
    e.preventDefault();
    const body = { ...edit, features: String(edit.featuresText ?? edit.features.join('\n')).split('\n') };
    try {
      await api(edit.id ? `/admin/courses/${edit.id}` : '/admin/courses', { method: edit.id ? 'PUT' : 'POST', body });
      setEdit(null); setError(''); load();
    } catch (err) { setError(err.message); }
  }
  async function remove(c) {
    if (!confirm(`Xóa khóa "${c.name}"?`)) return;
    try { await api(`/admin/courses/${c.id}`, { method: 'DELETE' }); load(); } catch (err) { setError(err.message); }
  }
  const set = (k) => (e) => setEdit({ ...edit, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  return (
    <>
      <div className="toolbar"><button className="btn btn-sm" onClick={() => setEdit({ ...EMPTY })}>+ Thêm khóa học</button></div>
      {error && <p className="msg error">{error}</p>}

      {edit && (
        <form className="form course-form" onSubmit={save}>
          <h3>{edit.id ? 'Sửa khóa học' : 'Khóa học mới'}</h3>
          <div className="row">
            <label>Tên<input required value={edit.name} onChange={set('name')} /></label>
            <label>Slug (không dấu)<input required value={edit.slug} onChange={set('slug')} /></label>
          </div>
          <div className="row">
            <label>Band đầu vào → đầu ra<input required value={edit.level_range} onChange={set('level_range')} /></label>
            <label>Thời lượng<input required value={edit.duration} onChange={set('duration')} /></label>
          </div>
          <label>Mô tả<textarea required rows={2} value={edit.description} onChange={set('description')} /></label>
          <div className="row">
            <label>Lịch học<input value={edit.schedule} onChange={set('schedule')} /></label>
            <label>Học phí (₫)<input type="number" min={0} value={edit.price} onChange={set('price')} /></label>
            <label>Thứ tự<input type="number" value={edit.sort} onChange={set('sort')} /></label>
          </div>
          <label>Điểm nổi bật (mỗi dòng một ý)
            <textarea rows={3} value={edit.featuresText ?? edit.features.join('\n')} onChange={(e) => setEdit({ ...edit, featuresText: e.target.value })} />
          </label>
          <label className="check"><input type="checkbox" checked={!!edit.featured} onChange={set('featured')} /> Đánh dấu nổi bật</label>
          <div className="row actions">
            <button className="btn btn-sm">Lưu</button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEdit(null)}>Hủy</button>
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead><tr><th>Tên</th><th>Band</th><th>Thời lượng</th><th>Học phí</th><th /></tr></thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td><b>{c.name}</b>{c.featured && ' ⭐'}</td>
                <td>{c.level_range}</td><td>{c.duration}</td><td>{vnd(c.price)}</td>
                <td className="nowrap">
                  <button className="icon-btn" onClick={() => setEdit({ ...c })}>✏️</button>
                  <button className="icon-btn" onClick={() => remove(c)}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
