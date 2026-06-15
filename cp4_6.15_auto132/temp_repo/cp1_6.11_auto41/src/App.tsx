import { useState, useEffect, useCallback } from 'react';
import { Menu, BookOpen, Edit3, GraduationCap, ChevronLeft } from 'lucide-react';
import type { Course, CourseProgress } from './types';
import CourseEditor from './CourseEditor';
import LearningDashboard from './LearningDashboard';
import CourseContent from './CourseContent';

type View = 'editor' | 'dashboard' | 'learning';

export default function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<CourseProgress[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [leftRatio, setLeftRatio] = useState(0.4);
  const [isResizing, setIsResizing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesRes, progressRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/progress')
      ]);
      const coursesData = await coursesRes.json();
      const progressData = await progressRes.json();
      setCourses(coursesData);
      setProgress(progressData);
    } catch (e) {
      console.error('加载数据失败:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const container = document.getElementById('split-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setLeftRatio(Math.min(0.75, Math.max(0.25, ratio)));
  }, [isResizing]);

  const handleMouseUp = useCallback(() => setIsResizing(false), []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const navigateToLearning = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentView('learning');
    setMenuOpen(false);
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || null;
  const selectedCourseProgress = progress.find(p => p.courseId === selectedCourseId) || null;

  const navItems = [
    { key: 'editor', label: '课程编辑器', icon: <Edit3 size={18} /> },
    { key: 'dashboard', label: '学习看板', icon: <GraduationCap size={18} /> },
  ];

  const renderNav = (vertical = false) => (
    <nav className={vertical ? 'flex flex-col p-4 gap-2' : 'flex items-center gap-2'}>
      {navItems.map(item => (
        <div
          key={item.key}
          className={`nav-item flex items-center gap-2 ${currentView === item.key ? 'active' : ''}`}
          onClick={() => {
            setCurrentView(item.key as View);
            setMenuOpen(false);
          }}
        >
          {item.icon}
          <span>{item.label}</span>
        </div>
      ))}
    </nav>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel p-10 text-center">
          <BookOpen size={48} className="mx-auto mb-4" style={{ color: '#00d2ff' }} />
          <p style={{ color: '#e0e0e0' }}>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 glass-panel rounded-none border-x-0 border-t-0"
        style={{
          height: '56px',
          margin: 0,
          borderRadius: 0,
          borderLeft: 'none',
          borderRight: 'none',
          borderTop: 'none',
          background: 'rgba(26, 26, 46, 0.95)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            className="icon-btn lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <BookOpen size={24} style={{ color: '#00d2ff' }} />
            <h1 className="text-lg font-bold" style={{ color: '#fff' }}>
              企业培训管理系统
            </h1>
          </div>
        </div>
        <div className="hidden lg:block">{renderNav()}</div>
        <div style={{ width: 40 }} />
      </header>

      {menuOpen && (
        <div className="hamburger-menu lg:hidden">
          {renderNav(true)}
        </div>
      )}

      <main className="flex-1 p-4" style={{ paddingBottom: '20px' }}>
        {currentView === 'editor' && (
          <div
            id="split-container"
            className="h-full w-full"
            style={{
              minHeight: 'calc(100vh - 56px - 40px)',
              display: 'flex',
              flexDirection: 'row',
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                gap: '8px',
              }}
              className="flex-col lg:flex-row"
            >
              <CourseEditor
                courses={courses}
                setCourses={setCourses}
                progress={progress}
                setProgress={setProgress}
                onRefresh={loadData}
              />
            </div>
          </div>
        )}

        {currentView === 'dashboard' && (
          <div
            id="split-container"
            style={{
              display: 'flex',
              flexDirection: 'row',
              minHeight: 'calc(100vh - 56px - 40px)',
            }}
            className="flex-col lg:flex-row"
          >
            <LearningDashboard
              courses={courses}
              progress={progress}
              onEnterCourse={navigateToLearning}
              onRefresh={loadData}
            />
          </div>
        )}

        {currentView === 'learning' && selectedCourse && (
          <div className="content-animate">
            <div className="mb-4 flex items-center gap-3">
              <button
                className="secondary-btn flex items-center gap-2"
                onClick={() => setCurrentView('dashboard')}
              >
                <ChevronLeft size={18} />
                返回看板
              </button>
              <div className="glass-panel px-4 py-2 flex-1">
                <h2 className="text-lg font-bold" style={{ color: '#fff' }}>
                  {selectedCourse.title}
                </h2>
              </div>
            </div>
            <CourseContent
              course={selectedCourse}
              progress={selectedCourseProgress}
              onProgressChange={loadData}
            />
          </div>
        )}
      </main>
    </div>
  );
}
