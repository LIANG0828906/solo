import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: '书架', icon: '📚' },
  { path: '/dashboard', label: '统计看板', icon: '📊' },
];

const Sidebar = () => {
  return (
    <aside
      style={{
        width: '220px',
        background: '#ffffff',
        boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '0 24px 24px',
          borderBottom: '1px solid #f0ede8',
          marginBottom: '16px',
        }}
      >
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#8e44ad' }}>
          📖 我的书库
        </h1>
      </div>
      <nav style={{ flex: 1 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 24px',
              fontSize: '15px',
              color: isActive ? '#8e44ad' : '#555',
              background: isActive ? '#f5f0fa' : 'transparent',
              borderLeft: isActive ? '3px solid #8e44ad' : '3px solid transparent',
              transition: 'all 0.3s ease-out',
            })}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
