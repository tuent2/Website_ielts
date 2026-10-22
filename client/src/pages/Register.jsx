import LeadForm from '../components/LeadForm.jsx';

export default function Register() {
  return (
    <section className="section">
      <div className="container narrow">
        <h1 className="center">Đăng ký tư vấn</h1>
        <p className="sub">Điền thông tin, chúng tôi sẽ gọi lại trong vòng 24 giờ để tư vấn lộ trình phù hợp.</p>
        <LeadForm />
      </div>
    </section>
  );
}
