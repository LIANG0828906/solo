import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, BarChart3, Home, Menu, X, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { ActivityModule } from '@/modules/activity/ActivityModule';
import { CommunityModule } from '@/modules/community/CommunityModule';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));

function App() {
  const toast = useToast();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifiedActivities, setNotifiedActivities] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkActivityReminders = async () => {
      try {
        const response = await fetch('/api/activities');
        if (!response.ok) return;
        const activities = await response.json();
        const now = new Date();

        activities.forEach((activity: any) => {
          const activityDate = new Date(activity.date);
          const timeDiff = activityDate.getTime() - now.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);

          const activityId = activity.id;

          if (hoursDiff > 0 && hoursDiff <= 24 && !notifiedActivities.has(`${activityId}-24h`)) {
            toast.showWarning(`"${activity.name}" 将在 ${Math.ceil(hoursDiff)} 小时后开始，请准时参加！`);
            setNotifiedActivities(prev => new Set(prev).add(`${activityId}-24h`));
          }

          if (hoursDiff > 0 && hoursDiff <= 1 && !notifiedActivities.has(`${activityId}-1h`)) {
            toast.showWarning(`"${activity.name}" 即将开始，还有 ${Math.ceil(hoursDiff * 60)} 分钟截止签到！`);
            setNotifiedActivities(prev => new Set(prev).add(`${activityId}-1h`));
          }
        });
      } catch (error) {
        console.error('Failed to check reminders:', error);
      }
    };

    checkActivityReminders();
    const interval = setInterval(checkActivityReminders, 60000);

    return () => clearInterval(interval);
  }, [toast, notifiedActivities]);

  const navLinks = [
    { path: '/', label: '首页', icon: <Home size={18} /> },
    { path: '/dashboard', label: '数据统计', icon: <BarChart3 size={18} /> },
  ];

  return (
    <div className="app">
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            <div className="navbar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <BookOpen size={28} style={{ color: '#8B5CF6' }} />
              书香阁
            </div>

            <button
              className="hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="菜单"
            >
              {mobileMenuOpen ? (
                <>
                  <span style={{ transform: 'rotate(45deg) translate(4px, 4px)' }} />
                  <span style={{ opacity: 0 }} />
                  <span style={{ transform: 'rotate(-45deg) translate(4px, -4px)' }} />
                </>
              ) : (
                <>
                  <span />
                  <span />
                  <span />
                </>
              )}
            </button>

            <div className={`navbar-nav ${mobileMenuOpen ? 'open' : ''}`}>
              {navLinks.map(link => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {link.icon}
                    {link.label}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="container" style={{ paddingBottom: 64 }}>
        <Suspense
          fallback={
            <div className="loading-container">
              <div className="loading-spinner" />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<ActivityModule toast={toast} mode="list" />} />
            <Route path="/activity/:id" element={<ActivityModule toast={toast} mode="detail" />} />
            <Route path="/community/:activityId" element={<CommunityModule toast={toast} />} />
            <Route path="/dashboard" element={<DashboardPage toast={toast} />} />
          </Routes>
        </Suspense>
      </main>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}

export default App;
