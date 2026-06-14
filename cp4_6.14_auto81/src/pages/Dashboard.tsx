import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course, Feedback, ParticipationData, fetchFeedback } from '../api';
import RatingChart from '../components/RatingChart';
import FeedbackCard from '../components/FeedbackCard';

function StarRating({ rating, size = 20 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(star => {
        const fill = Math.min(1, Math.max(0, rating - (star - 1)));
        return (
          <div key={star} style={{ position: 'relative', width: size, height: size }}>
            <span style={{ position: 'absolute', color: '#e2e8f0', fontSize: size, lineHeight: 1 }}>★</span>
            <span style={{
              position: 'absolute',
              color: '#f59e0b',
              fontSize: size,
              lineHeight: 1,
              clipPath: `inset(0 ${100 - fill * 100}% 0 0)`,
            }}>★</span>
          </div>
        );
      })}
    </div>
  );
}

function CourseCard({ course, onClick }: { course: Course; onClick: () => void }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 320,
        maxWidth: '100%',
        borderRadius: 16,
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        padding: 24,
        cursor: 'pointer',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 25px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'transform 300ms ease-out, box-shadow 300ms ease-out',
      }}
    >
      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>{course.name}</h3>
      <div style={{ marginBottom: 12 }}>
        <StarRating rating={course.averageRating} />
        <span style={{ fontSize: 13, color: '#64748b', marginLeft: 8 }}>
          {course.averageRating.toFixed(1)} / 5.0
        </span>
      </div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
        👥 参与人数: {course.totalStudents}
      </div>
      <div style={{
        fontSize: 13,
        color: '#94a3b8',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        lineHeight: 1.5,
        marginTop: 8,
      }}>
        {course.description}
      </div>
    </div>
  );
}

export default function Dashboard({ courses, participationData, selectedCourseId, onSelectCourse }: {
  courses: Course[];
  participationData: ParticipationData[];
  selectedCourseId: string | null;
  onSelectCourse: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadFeedback = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetchFeedback(undefined, pageNum, 20);
      if (pageNum === 1) {
        setFeedbackList(res.data);
      } else {
        setFeedbackList(prev => [...prev, ...res.data]);
      }
      setTotal(res.total);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeedback(1);
  }, [loadFeedback]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100 && !loading && feedbackList.length < total) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadFeedback(nextPage);
    }
  }, [loading, feedbackList.length, total, page, loadFeedback]);

  const avgRating = courses.length > 0
    ? courses.reduce((sum, c) => sum + c.averageRating, 0) / courses.length
    : 0;

  const totalStudents = courses.reduce((sum, c) => sum + c.totalStudents, 0);

  const handleCourseClick = (courseId: string) => {
    onSelectCourse(courseId);
    navigate(`/course/${courseId}`);
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: '0 0 24px' }}>教学分析仪表盘</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginBottom: 32,
      }} className="stats-grid">
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          padding: 20,
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>课程总数</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#0f172a' }}>{courses.length}</div>
        </div>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          padding: 20,
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>平均评分</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#0f172a' }}>{avgRating.toFixed(1)}</div>
        </div>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          padding: 20,
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>总参与人数</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#0f172a' }}>{totalStudents}</div>
        </div>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', margin: '0 0 16px' }}>课程概览</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 20,
        marginBottom: 32,
      }}>
        {courses.map(course => (
          <CourseCard key={course.id} course={course} onClick={() => handleCourseClick(course.id)} />
        ))}
      </div>

      {participationData.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', margin: '0 0 16px' }}>参与度趋势</h2>
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: 12,
            padding: 24,
          }}>
            <RatingChart participationData={participationData} height={isMobile ? 150 : 300} />
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', margin: '0 0 16px' }}>最新评论</h2>
      <div
        onScroll={handleScroll}
        style={{ maxHeight: 500, overflowY: 'auto', paddingRight: 8 }}
      >
        {feedbackList.map(fb => (
          <FeedbackCard key={fb.id} feedback={fb} />
        ))}
        {loading && <p style={{ textAlign: 'center', color: '#94a3b8', padding: 16 }}>加载中...</p>}
        {!loading && feedbackList.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>暂无评论</p>}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
