import React from 'react';
import { useNavigate } from 'react-router-dom';

interface CourseCardProps {
  course: {
    id: number;
    name: string;
    category: string;
    teacher: string;
    maxStudents: number;
    enrolledCount: number;
  };
}

const categoryStyles: Record<string, { bgColor: string; textColor: string; icon: string; borderColor: string }> = {
  '琴': { bgColor: '#6B8E23', textColor: '#fff', icon: '🎐', borderColor: '#556B2F' },
  '棋': { bgColor: '#3C3C3C', textColor: '#fff', icon: '⚫', borderColor: '#1C1C1C' },
  '书': { bgColor: '#F5F0E1', textColor: '#3C3C3C', icon: '🖌️', borderColor: '#D4C9A8' },
  '画': { bgColor: '#CC3333', textColor: '#fff', icon: '🎨', borderColor: '#A02020' }
};

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const navigate = useNavigate();
  const style = categoryStyles[course.category] || categoryStyles['琴'];
  const remaining = course.maxStudents - course.enrolledCount;

  return (
    <div
      className="course-card"
      onClick={() => navigate(`/course/${course.id}`)}
      style={{
        backgroundColor: style.bgColor,
        color: style.textColor,
        borderColor: style.borderColor
      }}
    >
      <div className="card-header">
        <span className="category-icon">{style.icon}</span>
        <span className="category-label">{course.category}艺</span>
      </div>
      
      <h3 className="course-name">{course.name}</h3>
      
      <div className="teacher-info">
        <span>👨‍🏫</span>
        <span>{course.teacher}</span>
      </div>
      
      <div className="enrollment-info">
        <div className="enrolled">
          <span className="stat-icon">📝</span>
          <span>已预约 {course.enrolledCount} 人</span>
        </div>
        <div className={`remaining ${remaining <= 3 ? 'low' : ''}`}>
          <span className="stat-icon">🎫</span>
          <span>剩余 {remaining} 名额</span>
        </div>
      </div>
      
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${(course.enrolledCount / course.maxStudents) * 100}%`,
            backgroundColor: style.textColor === '#fff' ? 'rgba(255,255,255,0.6)' : 'rgba(60,60,60,0.4)'
          }}
        />
      </div>

      <style>{`
        .course-card {
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .course-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          opacity: 0.95;
        }
        
        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }
        
        .category-icon {
          font-size: 24px;
        }
        
        .category-label {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          background: rgba(255,255,255,0.2);
        }
        
        .course-name {
          font-size: 20px;
          font-weight: bold;
          margin: 0;
          font-family: 'LiSu', 'STLiti', '隶书', serif;
        }
        
        .teacher-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          opacity: 0.9;
        }
        
        .enrollment-info {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }
        
        .enrolled, .remaining {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .remaining.low {
          font-weight: bold;
        }
        
        .stat-icon {
          font-size: 14px;
        }
        
        .progress-bar {
          height: 6px;
          border-radius: 3px;
          background: rgba(255,255,255,0.2);
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default CourseCard;
