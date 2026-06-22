import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface CourseDetailProps {
  user: any;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scrollOpen, setScrollOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [myScore, setMyScore] = useState(0);

  useEffect(() => {
    fetchCourse();
  }, [id, user]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data);
        
        const enrollment = user?.enrolledCourses?.find(
          (ec: any) => ec.courseId === parseInt(id!)
        );
        setIsEnrolled(!!enrollment);
        setQuizCompleted(enrollment?.completed || false);
        setMyScore(enrollment?.score || 0);
        
        setTimeout(() => setScrollOpen(true), 300);
      }
    } catch (error) {
      console.error('获取课程详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (enrolling) return;
    setEnrolling(true);
    
    try {
      const response = await fetch(`/api/courses/${id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
        setIsEnrolled(true);
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('预约失败', error);
    } finally {
      setEnrolling(false);
    }
  };

  const categoryStyles: Record<string, { bgColor: string; textColor: string; icon: string; borderColor: string }> = {
    '琴': { bgColor: '#6B8E23', textColor: '#fff', icon: '🎐', borderColor: '#556B2F' },
    '棋': { bgColor: '#3C3C3C', textColor: '#fff', icon: '⚫', borderColor: '#1C1C1C' },
    '书': { bgColor: '#F5F0E1', textColor: '#3C3C3C', icon: '🖌️', borderColor: '#D4C9A8' },
    '画': { bgColor: '#CC3333', textColor: '#fff', icon: '🎨', borderColor: '#A02020' }
  };

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

  if (!course) {
    return <div className="empty-state"><p>课程不存在</p></div>;
  }

  const style = categoryStyles[course.category] || categoryStyles['琴'];
  const remaining = course.maxStudents - course.enrolledCount;

  return (
    <div className="course-detail-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← 返回
      </button>

      <div 
        className="course-header"
        style={{ 
          backgroundColor: style.bgColor, 
          color: style.textColor,
          borderColor: style.borderColor
        }}
      >
        <div className="course-header-content">
          <span className="course-icon-large">{style.icon}</span>
          <div>
            <span className="category-badge">{course.category}艺</span>
            <h1 className="course-title">{course.name}</h1>
            <p className="course-teacher">授课先生：{course.teacher}</p>
          </div>
        </div>
        
        <div className="course-stats">
          <div className="stat-item">
            <span className="stat-number">{course.enrolledCount}</span>
            <span className="stat-label">已预约</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">{remaining}</span>
            <span className="stat-label">剩余名额</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">{course.questions?.length || 0}</span>
            <span className="stat-label">课后题目</span>
          </div>
        </div>
      </div>

      <div className="scroll-container">
        <div className={`scroll ${scrollOpen ? 'open' : ''}`}>
          <div className="scroll-left-rod"></div>
          <div className="scroll-content">
            <div className="scroll-header">
              <h2>📜 课程简介</h2>
            </div>
            <div className="vertical-text">
              {course.description?.split('').map((char: string, index: number) => (
                <span key={index} className="char">{char}</span>
              ))}
            </div>
          </div>
          <div className="scroll-right-rod"></div>
        </div>
      </div>

      <div className="course-info-cards">
        <div className="info-card">
          <span className="info-icon">🕐</span>
          <div>
            <h4>开课时间</h4>
            <p>{course.startTime}</p>
          </div>
        </div>
        
        <div className="info-card">
          <span className="info-icon">👨‍🏫</span>
          <div>
            <h4>授课先生</h4>
            <p>{course.teacher}</p>
          </div>
        </div>
        
        <div className="info-card">
          <span className="info-icon">📝</span>
          <div>
            <h4>题目数量</h4>
            <p>{course.questions?.length || 0} 道选择题</p>
          </div>
        </div>
        
        <div className="info-card">
          <span className="info-icon">⭐</span>
          <div>
            <h4>满分</h4>
            <p>{(course.questions?.length || 0) * 10} 分</p>
          </div>
        </div>
      </div>

      <div className="action-section">
        {!isEnrolled ? (
          <button 
            className="enroll-btn"
            style={{ backgroundColor: remaining > 0 ? style.bgColor : '#999' }}
            onClick={handleEnroll}
            disabled={remaining <= 0 || enrolling}
          >
            {enrolling ? '预约中...' : remaining > 0 ? '📚 立即预约课程' : '名额已满'}
          </button>
        ) : (
          <div className="enrolled-actions">
            {quizCompleted ? (
              <>
                <div className="score-display">
                  🏆 你的成绩：<strong>{myScore}分</strong>
                </div>
                <button 
                  className="quiz-btn"
                  onClick={() => navigate(`/quiz/${id}`)}
                >
                  🔄 重新答题
                </button>
              </>
            ) : (
              <button 
                className="quiz-btn"
                onClick={() => navigate(`/quiz/${id}`)}
              >
                ✍️ 开始答题
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        .course-detail-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .back-btn {
          align-self: flex-start;
          background: transparent;
          color: #4A2C1A;
          font-size: 16px;
          padding: 8px 16px;
          border: 1px solid #D4C9A8;
          border-radius: 8px;
        }
        
        .back-btn:hover {
          background: #F5E6D3;
        }
        
        .course-header {
          border-radius: 16px;
          padding: 24px;
          border: 3px solid;
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }
        
        .course-header-content {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .course-icon-large {
          font-size: 56px;
        }
        
        .category-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          background: rgba(255,255,255,0.25);
          margin-bottom: 8px;
        }
        
        .course-title {
          font-size: 32px;
          margin-bottom: 4px;
        }
        
        .course-teacher {
          font-size: 15px;
          opacity: 0.9;
        }
        
        .course-stats {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.2);
        }
        
        .stat-item {
          text-align: center;
        }
        
        .stat-number {
          display: block;
          font-size: 28px;
          font-weight: bold;
          font-family: 'LiSu', 'STLiti', '隶书', serif;
        }
        
        .stat-label {
          font-size: 13px;
          opacity: 0.9;
        }
        
        .stat-divider {
          width: 1px;
          background: rgba(255,255,255,0.2);
        }
        
        .scroll-container {
          perspective: 1000px;
          padding: 20px 0;
        }
        
        .scroll {
          display: flex;
          align-items: stretch;
          position: relative;
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 0.5s ease-out;
        }
        
        .scroll.open {
          transform: scaleX(1);
        }
        
        .scroll-left-rod,
        .scroll-right-rod {
          width: 30px;
          background: linear-gradient(90deg, #8B4513, #D4AF37, #8B4513);
          border-radius: 15px;
          flex-shrink: 0;
          position: relative;
        }
        
        .scroll-left-rod::before,
        .scroll-right-rod::before {
          content: '';
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 10px;
          background: #D4AF37;
          border-radius: 5px;
        }
        
        .scroll-left-rod::after,
        .scroll-right-rod::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 10px;
          background: #D4AF37;
          border-radius: 5px;
        }
        
        .scroll-content {
          flex: 1;
          background: linear-gradient(180deg, #F5F0E1 0%, #E8E0D0 100%);
          padding: 30px;
          border-top: 4px solid #D4AF37;
          border-bottom: 4px solid #D4AF37;
          min-height: 200px;
        }
        
        .scroll-header {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .scroll-header h2 {
          font-size: 24px;
          color: #4A2C1A;
        }
        
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: upright;
          height: 180px;
          display: flex;
          flex-direction: column;
          flex-wrap: wrap;
          align-content: center;
          gap: 2px;
          line-height: 1.8;
          font-size: 16px;
          color: #3C3C3C;
          letter-spacing: 4px;
        }
        
        .char {
          opacity: 0;
          animation: charFadeIn 0.3s forwards;
        }
        
        .scroll.open .char {
          animation: charFadeIn 0.3s forwards;
        }
        
        @keyframes charFadeIn {
          to { opacity: 1; }
        }
        
        .course-info-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        
        .info-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 1px solid #E8E0D0;
        }
        
        .info-icon {
          font-size: 28px;
        }
        
        .info-card h4 {
          font-size: 14px;
          color: #666;
          margin-bottom: 4px;
          font-family: 'KaiTi', 'STKaiti', serif;
        }
        
        .info-card p {
          font-size: 15px;
          color: #3C3C3C;
          font-weight: bold;
        }
        
        .action-section {
          text-align: center;
          padding: 16px 0;
        }
        
        .enroll-btn {
          padding: 14px 40px;
          font-size: 18px;
          color: white;
          border-radius: 30px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .enroll-btn:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        
        .enrolled-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        
        .score-display {
          font-size: 20px;
          color: #4A2C1A;
        }
        
        .score-display strong {
          color: #D4AF37;
          font-size: 24px;
        }
        
        .quiz-btn {
          padding: 12px 32px;
          font-size: 16px;
          background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%);
          color: white;
          border-radius: 25px;
          box-shadow: 0 3px 10px rgba(212, 175, 55, 0.4);
        }
        
        @media (max-width: 768px) {
          .course-header-content {
            flex-direction: column;
            text-align: center;
          }
          
          .course-title {
            font-size: 24px;
          }
          
          .course-stats {
            gap: 20px;
          }
          
          .course-info-cards {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .vertical-text {
            height: auto;
            writing-mode: horizontal-tb;
            flex-direction: row;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

export default CourseDetail;
