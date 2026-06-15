import React, { useState, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import StudentList from './components/StudentList';
import StudentDetail from './components/StudentDetail';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeNav, setActiveNav] = useState<string>(
    location.pathname.startsWith('/students')
      ? 'students'
      : location.pathname.startsWith('/dashboard')
      ? 'dashboard'
      : 'students'
  );

  const handleNavClick = useCallback(
    (nav: string, path: string) => {
      setActiveNav(nav);
      navigate(path);
    },
    [navigate]
  );

  const handleSelectStudent = useCallback(
    (id: string) => {
      navigate(`/students/${id}`);
      setActiveNav('students');
    },
    [navigate]
  );

  const handleBackToList = useCallback(() => {
    navigate('/students');
    setActiveNav('students');
  }, [navigate]);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">📚</span>
          <span className="logo-text">课时管理系统</span>
        </div>
        <nav className="sidebar-nav">
          <div
            className={`nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard', '/dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span>统计看板</span>
          </div>
          <div
            className={`nav-item ${activeNav === 'students' ? 'active' : ''}`}
            onClick={() => handleNavClick('students', '/students')}
          >
            <span className="nav-icon">👥</span>
            <span>学员管理</span>
          </div>
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={<Dashboard onViewStudents={() => navigate('/students')} />}
          />
          <Route
            path="/dashboard"
            element={<Dashboard onViewStudents={() => navigate('/students')} />}
          />
          <Route
            path="/students"
            element={<StudentList onSelectStudent={handleSelectStudent} />}
          />
          <Route
            path="/students/:id"
            element={<StudentDetail onBack={handleBackToList} />}
          />
        </Routes>
      </main>
    </div>
  );
};

export default App;
