import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '@/types';

interface CourseCardProps {
  course: Course;
}

const difficultyColors: Record<string, string> = {
  '初级': '#27AE60',
  '中级': '#F39C12',
  '高级': '#E74C3C',
};

const placeholderImages = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20handcraft%20workshop%20knitting%20ceramic%20woodwork%20warm%20lighting&image_size=square',
];

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const images: string[] = JSON.parse(course.images || '[]');
  const coverImage = images[0] || placeholderImages[0];
  const isHot = course.enrolled_count >= course.capacity * 0.8;
  const remaining = course.capacity - course.enrolled_count;

  return (
    <Link
      to={`/course/${course.id}`}
      className={`animate-fade-in-scale ${isHot ? 'hot-course' : ''}`}
      style={{
        display: 'block',
        background: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        border: isHot ? '2px solid #FFD700' : '2px solid #E8DCC8',
        transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
        boxShadow: '0 2px 12px rgba(139, 94, 60, 0.08)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 94, 60, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(139, 94, 60, 0.08)';
      }}
    >
      <div style={{ position: 'relative' }}>
        <img
          src={coverImage}
          alt={course.title}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
          }}
        />
        <span style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#fff',
          background: difficultyColors[course.difficulty],
        }}>
          {course.difficulty}
        </span>
        <span style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#fff',
          background: '#8B5E3C',
        }}>
          {course.category}
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#333',
          marginBottom: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {course.title}
        </h3>

        <p style={{
          fontSize: '13px',
          color: '#8B5E3C',
          marginBottom: '12px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {course.description}
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}>
          <div style={{ fontSize: '13px', color: '#666' }}>
            {course.sessions}节课程 · 讲师：{course.instructor_name}
          </div>
          <div style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#E67E22',
          }}>
            ¥{course.price}
          </div>
        </div>

        <div style={{
          borderTop: '1px solid #E8DCC8',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: '13px', color: '#666' }}>
            已报名 <span style={{ color: '#27AE60', fontWeight: '600' }}>{course.enrolled_count}</span> 人
          </div>
          <div style={{ fontSize: '13px', color: remaining <= 3 ? '#E74C3C' : '#666', fontWeight: remaining <= 3 ? '600' : 'normal' }}>
            剩余 {remaining} 个名额
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
