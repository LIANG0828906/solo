import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { fetchCourses, fetchFeedback, fetchParticipation, submitFeedback, Course, Feedback, ParticipationData } from './api';
import Dashboard from './pages/Dashboard';
import FeedbackCard from './components/FeedbackCard';
import RatingChart from './components/RatingChart';

const NAV_ITEMS = [
  { key: 'dashboard', label: '仪表盘', icon: '📊' },
  { key: 'courses', label: '课程概览', icon: '📚' },
  { key: 'feedback', label: '反馈管理', icon: '💬' },
];

function Sidebar({ current, onNavigate, mobileOpen, onOpenMobile, onCloseMobile }: {
  current: string;
  onNavigate: (key: string) => void;
  mobileOpen: boolean;
  onOpenMobile: () => void;
  onCloseMobile: () => void;
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleHamburgerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenMobile();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onCloseMobile();
  };

  const handleNavClick = (e: React.MouseEvent<HTMLButtonElement>, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    onNavigate(key);
    onCloseMobile();
  };

  const sidebar = (
    <nav style={{
      width: 240,
      minHeight: '100vh',
      backgroundColor: '#1e293b',
      padding: '24px 0',
      position: isMobile ? 'fixed' : 'relative',
      left: isMobile ? (mobileOpen ? 0 : -240) : 0,
      top: 0,
      zIndex: 1000,
      transition: 'left 300ms ease-out',
      flexShrink: 0,
    }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #334155' }}>
        <h2 style={{ color: '#ffffff', fontSize: 18, fontWeight: 700, margin: 0 }}>教学分析中心</h2>
        <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>Course Analytics</p>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0' }}>
        {NAV_ITEMS.map(item => (
          <li key={item.key}>
            <button
              onClick={(e) => handleNavClick(e, item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '12px 20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: current === item.key ? 600 : 400,
                color: current === item.key ? '#000000' : '#94a3b8',
                backgroundColor: current === item.key ? '#ffffff' : 'transparent',
                transition: 'all 200ms ease-out',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <>
      {isMobile && (
        <>
          <button
            onClick={handleHamburgerClick}
            style={{
              position: 'fixed',
              top: 12,
              left: 12,
              zIndex: 999,
              background: '#1e293b',
              border: 'none',
              color: '#ffffff',
              width: 40,
              height: 40,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              cursor: 'pointer',
              display: mobileOpen ? 'none' : 'flex',
            }}
          >☰</button>
          {mobileOpen && (
            <div
              onClick={handleOverlayClick}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: '#00000060',
                zIndex: 999,
              }}
            />
          )}
        </>
      )}
      {sidebar}
    </>
  );
}

function FeedbackModal({ courseId, onClose, onSubmit }: {
  courseId: string;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [bouncingStar, setBouncingStar] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleStarClick = (star: number) => {
    setRating(star);
    setBouncingStar(star);
    setTimeout(() => setBouncingStar(null), 200);
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await submitFeedback({ courseId, rating, comment });
      onSubmit();
      onClose();
    } catch {
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#00000080',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }} onClick={onClose}>
      <div
        style={{
          width: 500,
          maxWidth: '90vw',
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: 32,
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 24px' }}>发布即时反馈问卷</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#334155', marginBottom: 8 }}>评分</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className={bouncingStar === star ? 'star-bounce' : ''}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 32,
                  padding: 4,
                  color: (hoverRating || rating) >= star ? '#f59e0b' : '#e2e8f0',
                  transition: 'color 150ms ease-out, transform 200ms ease-out',
                  transform: bouncingStar === star ? 'scale(1)' : 'scale(1)',
                }}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#334155', marginBottom: 8 }}>文字评论</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="请输入您对本节课的反馈..."
            style={{
              width: '100%',
              height: 120,
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              padding: 12,
              fontSize: 14,
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'Inter, sans-serif',
              transition: 'border-color 200ms ease-out, box-shadow 200ms ease-out',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#334155',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >取消</button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            style={{
              padding: '12px 24px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: rating === 0 || submitting ? '#93c5fd' : '#3b82f6',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              cursor: rating === 0 || submitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 200ms ease-out',
            }}
            onMouseEnter={e => { if (rating > 0 && !submitting) e.currentTarget.style.backgroundColor = '#2563eb'; }}
            onMouseLeave={e => { if (rating > 0 && !submitting) e.currentTarget.style.backgroundColor = '#3b82f6'; }}
          >
            {submitting ? '提交中...' : '提交反馈'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes starBounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        .star-bounce {
          animation: starBounce 200ms ease-out;
        }
      `}</style>
    </div>
  );
}

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div style={{
      position: 'fixed',
      top: visible ? 20 : -60,
      left: '50%',
      transform: `translateX(-50%)`,
      backgroundColor: '#22c55e',
      color: '#ffffff',
      padding: '12px 24px',
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 600,
      zIndex: 3000,
      transition: 'top 400ms ease-out, opacity 400ms ease-out',
      opacity: visible ? 1 : 0,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}>
      {message}
    </div>
  );
}

function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [participation, setParticipation] = useState<ParticipationData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const totalRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchCourses().then(setCourses).catch(() => {});
  }, []);

  useEffect(() => {
    if (courses.length > 0 && courseId) {
      const c = courses.find(c => c.id === courseId);
      if (c) setCourse(c);
    }
  }, [courses, courseId]);

  const loadFeedback = useCallback(async (pageNum: number) => {
    if (!courseId || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetchFeedback(courseId, pageNum, 20);
      if (pageNum === 1) {
        setFeedbackList(res.data);
      } else {
        setFeedbackList(prev => [...prev, ...res.data]);
      }
      setTotal(res.total);
      totalRef.current = res.total;
    } catch { } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      pageRef.current = 1;
      loadFeedback(1);
    }
  }, [courseId, loadFeedback]);

  useEffect(() => {
    if (courseId) {
      fetchParticipation(courseId).then(setParticipation).catch(() => {});
    }
  }, [courseId]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (loadingRef.current) return;
    if (feedbackList.length >= totalRef.current) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom < 100) {
      pageRef.current += 1;
      loadFeedback(pageRef.current);
    }
  }, [loadFeedback, feedbackList.length]);

  const handleSubmitSuccess = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
    pageRef.current = 1;
    loadFeedback(1);
    if (courseId) {
      fetchParticipation(courseId).then(setParticipation).catch(() => {});
    }
  };

  const chartHeight = isMobile ? 150 : 300;

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'none',
          border: 'none',
          color: '#3b82f6',
          fontSize: 14,
          cursor: 'pointer',
          padding: '8px 0',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >← 返回概览</button>

      {course && (
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>{course.name}</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>讲师: {course.instructor} · 参与人数: {course.totalStudents}</p>
        </div>
      )}

      <div
        className="detail-chart-container"
        style={{
          backgroundColor: '#f8fafc',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          height: chartHeight + 48,
          transition: 'height 300ms ease-out',
        }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: '0 0 16px' }}>参与度趋势</h3>
        {participation.length > 0 && (
          <RatingChart participationData={participation} height={chartHeight} />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>学生评论</h3>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 200ms ease-out',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >发布问卷</button>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{ maxHeight: 600, overflowY: 'auto', paddingRight: 8 }}
      >
        {feedbackList.map(fb => (
          <FeedbackCard key={fb.id} feedback={fb} />
        ))}
        {loading && <p style={{ textAlign: 'center', color: '#94a3b8', padding: 16 }}>加载中...</p>}
        {!loading && feedbackList.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: 16 }}>暂无评论</p>}
      </div>

      {showModal && courseId && (
        <FeedbackModal courseId={courseId} onClose={() => setShowModal(false)} onSubmit={handleSubmitSuccess} />
      )}
      <Toast message="反馈已提交！" visible={toastVisible} />

      <style>{`
        @media (max-width: 768px) {
          .detail-chart-container {
            height: 198px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const [currentNav, setCurrentNav] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [participation, setParticipation] = useState<ParticipationData[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses().then(setCourses).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchParticipation(selectedCourseId).then(setParticipation).catch(() => {});
    }
  }, [selectedCourseId]);

  const handleNavClick = (key: string) => {
    setCurrentNav(key);
    setSelectedCourseId(null);
    if (key === 'dashboard') {
      window.history.pushState({}, '', '/');
    }
  };

  return (
    <Router>
      <div style={{
        display: 'flex',
        fontFamily: "'Inter', sans-serif",
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        backgroundColor: '#f1f5f9',
      }}>
        <Sidebar
          current={currentNav}
          onNavigate={handleNavClick}
          mobileOpen={mobileOpen}
          onOpenMobile={() => setMobileOpen(true)}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <main style={{
          flex: 1,
          padding: window.innerWidth < 768 ? '60px 16px 24px' : '32px',
          overflowY: 'auto',
          minHeight: '100vh',
        }}>
          <Routes>
            <Route path="/" element={
              <Dashboard
                courses={courses}
                participationData={participation}
                selectedCourseId={selectedCourseId}
                onSelectCourse={(id) => {
                  setSelectedCourseId(id);
                  setCurrentNav('courses');
                }}
              />
            } />
            <Route path="/course/:courseId" element={<CourseDetailPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
