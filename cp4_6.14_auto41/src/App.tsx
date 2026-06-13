import { useState } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import ProjectModule from './ProjectModule';
import BiddingModule from './BiddingModule';
import MessageModule from './MessageModule';
import ContractModule from './ContractModule';

const navItems = [
  { path: '/projects', label: '项目管理', icon: '📋' },
  { path: '/bidding', label: '投标比价', icon: '💰' },
  { path: '/messages', label: '在线洽谈', icon: '💬' },
  { path: '/contracts', label: '合同管理', icon: '📄' },
];

function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  return (
    <div
      className="sidebar"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        width: expanded ? '220px' : '60px',
        transition: 'width 0.3s ease',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        backgroundColor: '#1e40af',
        color: 'white',
        overflow: 'hidden',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{
        padding: expanded ? '20px' : '20px 10px',
        fontSize: expanded ? '18px' : '24px',
        fontWeight: 'bold',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        whiteSpace: 'nowrap',
        textAlign: expanded ? 'left' : 'center',
      }}>
        {expanded ? '竞标管理平台' : '🏢'}
      </div>
      <nav style={{ flex: 1, padding: '16px 0' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              padding: expanded ? '12px 20px' : '12px',
              color: 'white',
              textDecoration: 'none',
              backgroundColor: isActive || location.pathname.startsWith(item.path)
                ? 'rgba(59, 130, 246, 0.5)'
                : 'transparent',
              borderLeft: isActive || location.pathname.startsWith(item.path)
                ? '4px solid #3b82f6'
                : '4px solid transparent',
              whiteSpace: 'nowrap',
              gap: expanded ? '12px' : '0',
              justifyContent: expanded ? 'flex-start' : 'center',
              marginBottom: '4px',
              fontSize: '14px',
            })}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            {expanded && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div style={{
        padding: expanded ? '16px 20px' : '16px 10px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: expanded ? '12px' : '10px',
        opacity: 0.8,
        whiteSpace: 'nowrap',
        textAlign: expanded ? 'left' : 'center',
      }}>
        {expanded ? '发包方用户' : '👤'}
      </div>
    </div>
  );
}

function App() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{
        marginLeft: '60px',
        flex: 1,
        padding: '24px',
        backgroundColor: '#f3f4f6',
        minHeight: '100vh',
      }}>
        <Routes>
          <Route path="/" element={<ProjectModule />} />
          <Route path="/projects" element={<ProjectModule />} />
          <Route path="/projects/:id" element={<BiddingModule detailMode />} />
          <Route path="/bidding" element={<BiddingModule />} />
          <Route path="/bidding/:id" element={<BiddingModule detailMode />} />
          <Route path="/messages" element={<MessageModule />} />
          <Route path="/contracts" element={<ContractModule />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
