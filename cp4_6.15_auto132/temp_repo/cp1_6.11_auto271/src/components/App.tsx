import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const CourseList = lazy(() => import('../pages/CourseList'));
const CourseDetail = lazy(() => import('../pages/CourseDetail'));
const QuizPage = lazy(() => import('../pages/QuizPage'));
const Profile = lazy(() => import('../pages/Profile'));
const TeacherPanel = lazy(() => import('../pages/TeacherPanel'));
const Login = lazy(() => import('../pages/Login'));

const Loading = () => (
  <div className="loading-container">
    <div className="bamboo-loading">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bamboo-slip"></div>
      ))}
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('获取用户信息失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (role: string) => {
    try {
      const response = await fetch('/api/user/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        navigate('/');
      }
    } catch (error) {
      console.error('登录失败', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  const categories = [
    { key: '琴', color: '#6B8E23', icon: '🎐' },
    { key: '棋', color: '#3C3C3C', icon: '⚫' },
    { key: '书', color: '#F5F0E1', icon: '🖌️', textColor: '#3C3C3C' },
    { key: '画', color: '#CC3333', icon: '🎨' }
  ];

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  const isTeacher = user.role === 'teacher';

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            古韵书院
          </h1>
          
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

          <nav className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
            {categories.map(cat => (
              <button
                key={cat.key}
                className="nav-tab"
                style={{
                  backgroundColor: location.pathname === `/courses/${cat.key}` ? cat.color : 'transparent',
                  color: location.pathname === `/courses/${cat.key}` ? (cat.textColor || '#fff') : '#3C3C3C'
                }}
                onClick={() => {
                  navigate(`/courses/${cat.key}`);
                  setMobileMenuOpen(false);
                }}
              >
                <span className="nav-icon">{cat.icon}</span>
                {cat.key}
              </button>
            ))}
            
            {isTeacher && (
              <button
                className="nav-tab"
                style={{
                  backgroundColor: location.pathname === '/teacher' ? '#D4AF37' : 'transparent',
                  color: location.pathname === '/teacher' ? '#fff' : '#3C3C3C'
                }}
                onClick={() => {
                  navigate('/teacher');
                  setMobileMenuOpen(false);
                }}
              >
                📚 教学管理
              </button>
            )}
            
            <button
              className="nav-tab"
              style={{
                backgroundColor: location.pathname === '/profile' ? '#8B4513' : 'transparent',
                color: location.pathname === '/profile' ? '#fff' : '#3C3C3C'
              }}
              onClick={() => {
                navigate('/profile');
                setMobileMenuOpen(false);
              }}
            >
              👤 个人中心
            </button>

            <button className="nav-tab logout-btn" onClick={handleLogout}>
              🚪 退出
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <div className="app-container">
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/courses/:category" element={<CourseList />} />
              <Route path="/course/:id" element={<CourseDetail user={user} />} />
              <Route path="/quiz/:id" element={<QuizPage />} />
              <Route path="/profile" element={<Profile user={user} onRefresh={fetchCurrentUser} />} />
              {isTeacher && (
                <Route path="/teacher" element={<TeacherPanel />} />
              )}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>

      <footer className="app-footer">
        <p>© 古韵书院 · 传承千年文化</p>
      </footer>

      <style>{`
        .app-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .app-header {
          background: linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #8B4513 100%);
          border-bottom: 4px solid #D4AF37;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }
        
        .app-title {
          font-size: 28px;
          color: #F5F0E1;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          letter-spacing: 4px;
        }
        
        .nav-menu {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .nav-tab {
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 16px;
          background: transparent;
          color: #F5F0E1;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        
        .nav-tab:hover {
          background: rgba(255,255,255,0.2);
          opacity: 1;
        }
        
        .nav-icon {
          font-size: 18px;
        }
        
        .logout-btn {
          background: rgba(255,255,255,0.1);
        }
        
        .mobile-menu-btn {
          display: none;
          background: transparent;
          color: #F5F0E1;
          font-size: 24px;
          padding: 8px 12px;
        }
        
        .main-content {
          flex: 1;
          padding: 24px 0;
        }
        
        .app-footer {
          background: #4A2C1A;
          color: #D4AF37;
          text-align: center;
          padding: 20px;
          border-top: 3px solid #D4AF37;
        }
        
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: block;
          }
          
          .nav-menu {
            position: absolute;
            top: 70px;
            left: 0;
            right: 0;
            background: #8B4513;
            flex-direction: column;
            padding: 16px;
            gap: 8px;
            display: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
          
          .nav-menu.open {
            display: flex;
          }
          
          .nav-tab {
            width: 100%;
            justify-content: center;
            padding: 12px;
          }
          
          .app-title {
            font-size: 20px;
            letter-spacing: 2px;
          }
          
          .header-content {
            height: 60px;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
