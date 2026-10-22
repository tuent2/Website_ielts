import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Courses from './pages/Courses.jsx';
import Placement from './pages/Placement.jsx';
import Register from './pages/Register.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import Admin from './pages/Admin.jsx';
import { getToken } from './api.js';
import './index.css';

function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/admin/login" replace />;
}

function NotFound() {
  return (
    <section className="section narrow center">
      <h1>404</h1>
      <p>Không tìm thấy trang bạn cần.</p>
    </section>
  );
}

// Cuộn lên đầu khi đổi trang, hoặc tới #anchor
function ScrollManager() {
  const { pathname, hash } = useLocation();
  React.useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ScrollManager />
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="khoa-hoc" element={<Courses />} />
        <Route path="test-trinh-do" element={<Placement />} />
        <Route path="dang-ky" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
