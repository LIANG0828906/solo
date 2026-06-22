import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { BookOutlined, TeamOutlined, DashboardOutlined, ReadOutlined } from '@ant-design/icons';
import Dashboard from '@/components/Dashboard';
import BookManager from '@/modules/BookManager/BookManager';
import ReaderManager from '@/modules/ReaderManager/ReaderManager';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-title">
          <ReadOutlined />
          <span>LibraryFlow</span>
        </div>
        <div className="navbar-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            <DashboardOutlined style={{ marginRight: 6 }} />
            数据看板
          </NavLink>
          <NavLink to="/books" className={({ isActive }) => isActive ? 'active' : ''}>
            <BookOutlined style={{ marginRight: 6 }} />
            图书管理
          </NavLink>
          <NavLink to="/readers" className={({ isActive }) => isActive ? 'active' : ''}>
            <TeamOutlined style={{ marginRight: 6 }} />
            读者管理
          </NavLink>
        </div>
      </nav>
      
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/books" element={<BookManager />} />
          <Route path="/readers" element={<ReaderManager />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
