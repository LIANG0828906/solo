import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CourseCard from '../components/CourseCard';

const CourseList: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, [category]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses?category=${category}`);
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('获取课程列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryInfo: Record<string, { color: string; bgColor: string; description: string; icon: string }> = {
    '琴': { 
      color: '#6B8E23', 
      bgColor: 'rgba(107, 142, 35, 0.1)', 
      description: '高山流水遇知音，琴声悠悠传古韵',
      icon: '🎐'
    },
    '棋': { 
      color: '#3C3C3C', 
      bgColor: 'rgba(60, 60, 60, 0.1)', 
      description: '黑白纵横间，乾坤藏棋枰',
      icon: '⚫'
    },
    '书': { 
      color: '#8B4513', 
      bgColor: 'rgba(139, 69, 19, 0.1)', 
      description: '笔走龙蛇间，墨香传千古',
      icon: '🖌️'
    },
    '画': { 
      color: '#CC3333', 
      bgColor: 'rgba(204, 51, 51, 0.1)', 
      description: '丹青妙笔绘山河，意境深远韵无穷',
      icon: '🎨'
    }
  };

  const info = categoryInfo[category || '琴'] || categoryInfo['琴'];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="bamboo-loading">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bamboo-slip"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="course-list-page">
      <div className="category-header" style={{ borderColor: info.color, backgroundColor: info.bgColor }}>
        <div className="category-icon-large">{info.icon}</div>
        <div>
          <h2 style={{ color: info.color }}>{category}艺课程</h2>
          <p className="category-desc">{info.description}</p>
        </div>
      </div>

      <div className="course-count">
        共 <span style={{ color: info.color, fontWeight: 'bold' }}>{courses.length}</span> 门课程
      </div>

      {courses.length > 0 ? (
        <div className="course-grid">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <p>暂无{category}艺课程</p>
        </div>
      )}

      <style>{`
        .course-list-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .category-header {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          border-radius: 16px;
          border-left: 6px solid;
        }
        
        .category-icon-large {
          font-size: 48px;
        }
        
        .category-header h2 {
          font-size: 28px;
          margin-bottom: 4px;
        }
        
        .category-desc {
          color: #666;
          font-size: 14px;
        }
        
        .course-count {
          font-size: 15px;
          color: #666;
        }
        
        .course-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }
        
        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }
        
        @media (max-width: 1024px) {
          .course-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 600px) {
          .course-grid {
            grid-template-columns: 1fr;
          }
          
          .category-header {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default CourseList;
