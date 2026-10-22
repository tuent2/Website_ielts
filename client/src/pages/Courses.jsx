import { useApi } from '../api.js';
import Async from '../components/Async.jsx';
import CourseCard from '../components/CourseCard.jsx';

export default function Courses() {
  const courses = useApi('/courses');
  return (
    <section className="section">
      <div className="container">
        <h1 className="center">Các khóa học IELTS</h1>
        <p className="sub">Học phí và lịch học dự kiến. Liên hệ để biết lịch khai giảng gần nhất và ưu đãi đăng ký sớm.</p>
        <Async state={courses}>
          {(list) => <div className="cards">{list.map((c) => <CourseCard key={c.id} course={c} detailed />)}</div>}
        </Async>
      </div>
    </section>
  );
}
