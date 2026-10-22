import { useEffect, useState } from 'react';

const TOKEN_KEY = 'ielts_admin_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export async function api(path, { method = 'GET', body, raw = false } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 401 && path.startsWith('/admin') && path !== '/admin/login') {
    setToken(null);
    window.location.assign('/admin/login');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Có lỗi xảy ra, vui lòng thử lại.');
  }
  return raw ? res : res.json();
}

export function useApi(path, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    api(path).then((d) => alive && setData(d)).catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, [path, ...deps]);
  return { data, error, loading: !data && !error };
}

export const vnd = (n) => new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
