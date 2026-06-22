import { useState, useCallback } from 'react';
import { useProgress } from './hooks/useProgress';
import Dashboard from './components/Dashboard';
import LearningPath from './components/LearningPath';
import CourseList from './components/CourseList';
import CourseDetailModal from './components/CourseDetailModal';
import type { Course } from '../../shared/types';

type PageType = 'dashboard' | 'courses' | 'path';

const NAV_ITEMS: { key: PageType; label: string; icon: string }[] = [
  { key: 'dashboard', label: '学习仪表盘', icon: '📊' },
  { key: 'courses', label: '全部课程', icon: '📚' },
  { key: 'path', label: '学习路径', icon: '🎯' }
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const {
    courses,
    progress,
    recommendations,
    activity,
    loading,
    error,
    updateProgress
  } = useProgress();

  const handleCourseClick = useCallback((courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (course) setSelectedCourse(course);
  }, [courses]);

  const handleCloseModal = useCallback(() => {
    setSelectedCourse(null);
  }, []);

  const selectedProgress = selectedCourse
    ? progress.find(p => p.courseId === selectedCourse.id) || null
    : null;

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
        <p style={{ fontSize: 16, color: '#64748B' }}>正在加载学习数据...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={loadingStyle}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <p style={{ fontSize: 16, color: '#EF4444', marginBottom: 16 }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: '#3B82F6',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={sidebarStyle} className="sidebar">
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid #334155',
          marginBottom: 8
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20
            }}>
              🎓
            </div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>学习助手</h1>
              <p style={{ fontSize: 12, color: '#94A3B8' }}>进度追踪 & 路径推荐</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '8px 12px' }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setCurrentPage(item.key)}
              className="nav-item"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: 'none',
                background: currentPage === item.key ? '#334155' : 'transparent',
                color: currentPage === item.key ? '#F8FAFC' : '#94A3B8',
                fontSize: 14,
                fontWeight: currentPage === item.key ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 4,
                textAlign: 'left',
                transition: 'all 0.2s ease-out'
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div style={{
          marginTop: 'auto',
          padding: 20,
          borderTop: '1px solid #334155'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: 14
            }}>
              学
            </div>
            <div className="nav-label">
              <p style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 500 }}>学习者</p>
              <p style={{ fontSize: 12, color: '#94A3B8' }}>在线学习中</p>
            </div>
          </div>
        </div>
      </nav>

      <main style={mainStyle}>
        <div style={contentStyle}>
          {currentPage === 'dashboard' && (
            <>
              <PageHeader
                title="学习仪表盘"
                subtitle="查看你的学习进度概览和数据统计"
              />
              <Dashboard courses={courses} progress={progress} activity={activity} />
            </>
          )}

          {currentPage === 'courses' && (
            <>
              <PageHeader
                title="全部课程"
                subtitle="浏览所有可用课程，更新你的学习进度"
              />
              <CourseList
                courses={courses}
                progress={progress}
                onCourseClick={handleCourseClick}
              />
            </>
          )}

          {currentPage === 'path' && (
            <>
              <PageHeader
                title="智能学习路径"
                subtitle="基于你的学习进度和知识图谱生成个性化推荐"
              />
              <LearningPath
                recommendations={recommendations}
                progress={progress}
                onCourseClick={handleCourseClick}
              />
            </>
          )}
        </div>
      </main>

      <CourseDetailModal
        course={selectedCourse}
        progress={selectedProgress}
        allCourses={courses}
        onClose={handleCloseModal}
        onUpdate={updateProgress}
      />

      <style>{cssStyles}</style>
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>
        {title}
      </h1>
      <p style={{ fontSize: 14, color: '#64748B' }}>{subtitle}</p>
    </div>
  );
}

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  background: '#F8FAFC'
};

const sidebarStyle: React.CSSProperties = {
  width: 260,
  background: '#1E293B',
  color: '#E2E8F0',
  display: 'flex',
  flexDirection: 'column',
  position: 'fixed',
  top: 0,
  left: 0,
  bottom: 0,
  zIndex: 100,
  overflowY: 'auto'
};

const mainStyle: React.CSSProperties = {
  marginLeft: 260,
  flex: 1,
  minHeight: '100vh',
  background: '#F8FAFC'
};

const contentStyle: React.CSSProperties = {
  padding: '32px 40px',
  maxWidth: 1400,
  margin: '0 auto',
  width: '100%'
};

const cssStyles = `
  .nav-item:hover {
    background: #334155 !important;
    color: #F8FAFC !important;
  }

  @media (max-width: 768px) {
    .sidebar {
      width: 100% !important;
      height: 64px !important;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: auto !important;
      flex-direction: row !important;
      align-items: center;
      padding: 0 16px;
      overflow: hidden;
    }

    .sidebar > div:first-child {
      padding: 0 !important;
      border: none !important;
      margin: 0 !important;
      margin-right: 16px !important;
    }

    .sidebar > div:first-child h1,
    .sidebar > div:first-child p {
      display: none;
    }

    .sidebar > div:nth-child(2) {
      padding: 0 !important;
      display: flex !important;
      flex-direction: row !important;
      flex: 1;
      gap: 4px;
    }

    .nav-item {
      padding: 8px 12px !important;
      margin: 0 !important;
      width: auto !important;
    }

    .nav-label {
      display: none !important;
    }

    .sidebar > div:last-child {
      display: none !important;
    }

    main {
      margin-left: 0 !important;
      padding-top: 64px !important;
    }

    main > div {
      padding: 20px 16px !important;
    }
  }
`;
