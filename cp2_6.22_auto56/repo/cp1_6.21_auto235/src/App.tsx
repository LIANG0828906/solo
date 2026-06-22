import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import DetailPage from './pages/DetailPage';
import ProfilePage from './pages/ProfilePage';

export interface User {
  id: string;
  username: string;
  email: string;
}

interface MessageContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  currentUser: User;
}

const MessageContext = createContext<MessageContextType>({
  unreadCount: 0,
  setUnreadCount: () => {},
  currentUser: { id: '1', username: '校园学生', email: 'student@campus.edu' },
});

export const useMessageContext = () => useContext(MessageContext);

const App: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const currentUser: User = { id: '1', username: '校园学生', email: 'student@campus.edu' };

  useEffect(() => {
    const timer = setTimeout(() => {
      setUnreadCount(2);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <MessageContext.Provider value={{ unreadCount, setUnreadCount, currentUser }}>
      <div>
        <header className="app-header">
          <div className="header-content">
            <NavLink to="/" className="logo">📚 校园教材流转</NavLink>
            <nav className="nav-links">
              <NavLink to="/" end className="nav-link">搜索</NavLink>
              <NavLink to="/profile" className="nav-link">
                个人中心
                {unreadCount > 0 && (
                  <span style={{
                    display: 'inline-block',
                    marginLeft: '6px',
                    padding: '2px 6px',
                    backgroundColor: '#EF4444',
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}>
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            </nav>
          </div>
        </header>
        <main className="main-content">
          <div className="app-container">
            <Routes>
              <Route path="/" element={<SearchPage />} />
              <Route path="/book/:id" element={<DetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </MessageContext.Provider>
  );
};

export default App;
