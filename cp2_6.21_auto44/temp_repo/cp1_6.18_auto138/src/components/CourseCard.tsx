import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Course, CourseType } from '../data/courseData';

interface CourseCardProps {
  course: Course;
}

const typeColors: Record<CourseType, { bg: string; color: string }> = {
  '陶艺': { bg: '#DDB892', color: '#2D3436' },
  '皮具': { bg: '#8B5E3C', color: '#FFFFFF' },
  '木工': { bg: '#A68A64', color: '#FFFFFF' },
};

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    navigate(`/course/${course.id}`);
  };

  const cardStyle: React.CSSProperties = {
    width: 280,
    maxWidth: '100%',
    background: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: hovered
      ? '0 8px 24px rgba(0,0,0,0.15)'
      : '0 2px 8px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
    transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
  };

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: 150,
    objectFit: 'cover',
    display: 'block',
  };

  const contentStyle: React.CSSProperties = {
    padding: 16,
  };

  const typeColor = typeColors[course.type];

  const tagStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: 12,
    background: typeColor.bg,
    color: typeColor.color,
    marginBottom: 8,
  };

  const nameStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 8,
  };

  const bottomStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 14,
  };

  const teacherStyle: React.CSSProperties = {
    color: '#636E72',
  };

  const priceStyle: React.CSSProperties = {
    color: '#E76F51',
    fontWeight: 'bold',
  };

  return (
    <div
      style={cardStyle}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img src={course.thumbnail} alt={course.name} style={imgStyle} />
      <div style={contentStyle}>
        <div style={nameStyle}>{course.name}</div>
        <div style={tagStyle}>{course.type}</div>
        <div style={bottomStyle}>
          <span style={teacherStyle}>{course.teacher}</span>
          <span style={priceStyle}>¥{course.price}</span>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
