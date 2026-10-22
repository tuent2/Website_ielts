// Hiển thị trạng thái tải / lỗi cho dữ liệu lấy từ API
export default function Async({ state, children }) {
  if (state.loading) return <p className="muted center">Đang tải…</p>;
  if (state.error) return <p className="msg error center">{state.error}</p>;
  return children(state.data);
}
