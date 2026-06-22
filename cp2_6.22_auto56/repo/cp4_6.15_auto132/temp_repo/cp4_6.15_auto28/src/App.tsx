import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context';
import BookList from './BookList';
import BookForm from './BookForm';
import ReadingTracker from './ReadingTracker';
import ReportView from './ReportView';

const Sidebar: React.FC = () => {
  const { mobileMenuOpen, setMobileMenuOpen } = useApp();

  const navItems = [
    { path: '/', label: '我的藏书', icon: '📚' },
    { path: '/report', label: '阅读报告', icon: '📊' }
  ];

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">个人藏书馆</h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div 
        className="sidebar-overlay" 
        onClick={() => setMobileMenuOpen(false)}
      />
    </>
  );
};

const MobileHeader: React.FC = () => {
  const { setMobileMenuOpen } = useApp();
  const location = useLocation();
  
  const getTitle = () => {
    if (location.pathname === '/report') return '阅读报告';
    if (location.pathname.includes('/track')) return '阅读记录';
    if (location.pathname.includes('/new') || location.pathname.includes('/edit')) return '编辑图书';
    return '我的藏书';
  };

  return (
    <header className="mobile-header">
      <button 
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(prev => !prev)}
        aria-label="打开菜单"
      >
        ☰
      </button>
      <h1 className="mobile-title">{getTitle()}</h1>
      <div style={{ width: 44 }} />
    </header>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`toast ${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

const AppContent: React.FC = () => {
  return (
    <div className="app">
      <Sidebar />
      <MobileHeader />
      <main className="main-content">
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<BookList />} />
            <Route path="/books/new" element={<BookForm />} />
            <Route path="/books/:id/edit" element={<BookForm />} />
            <Route path="/books/:id/track" element={<ReadingTracker />} />
            <Route path="/report" element={<ReportView />} />
          </Routes>
        </div>
      </main>
      <ToastContainer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
