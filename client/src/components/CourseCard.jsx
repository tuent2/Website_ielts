import { Link } from 'react-router-dom';
import { vnd } from '../api.js';

export default function CourseCard({ course, detailed = false }) {
  return (
    <article className={`card ${course.featured ? 'featured' : ''}`}>
      <span className="tag">{course.level_range}</span>
      <h3>{course.name}</h3>
      <p>{course.description}</p>
      <ul>
        <li>{course.duration}</li>
        {detailed && course.schedule && <li>Lịch học: {course.schedule}</li>}
        {course.features.map((f) => <li key={f}>{f}</li>)}
      </ul>
      {detailed && <p className="price">{vnd(course.price)}</p>}
      <Link to="/dang-ky" className={`btn ${course.featured ? '' : 'btn-ghost'}`}>Tư vấn</Link>
    </article>
  );
}
