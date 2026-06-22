import { NavLink } from 'react-router-dom';

export default function Navbar() {
  const navItems = [
    { path: '/', label: '编辑器' },
    { path: '/arena', label: '竞技场' },
    { path: '/leaderboard', label: '排行榜' },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 glass"
      style={{
        borderBottom: '1px solid rgba(0, 245, 212, 0.3)',
        boxShadow: '0 1px 10px rgba(0, 245, 212, 0.1)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center"
              style={{
                color: 'var(--neon-cyan)',
                textShadow: '0 0 10px var(--neon-cyan)',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="14" y="2" width="4" height="4" fill="currentColor" />
                <rect x="10" y="6" width="12" height="4" fill="currentColor" />
                <rect x="8" y="10" width="4" height="4" fill="currentColor" />
                <rect x="20" y="10" width="4" height="4" fill="currentColor" />
                <rect x="12" y="14" width="8" height="4" fill="currentColor" />
                <rect x="6" y="18" width="6" height="4" fill="currentColor" />
                <rect x="20" y="18" width="6" height="4" fill="currentColor" />
                <rect x="10" y="22" width="4" height="4" fill="currentColor" />
                <rect x="18" y="22" width="4" height="4" fill="currentColor" />
                <rect x="6" y="26" width="6" height="4" fill="currentColor" />
                <rect x="20" y="26" width="6" height="4" fill="currentColor" />
              </svg>
            </div>
            <span
              className="text-xl font-bold tracking-wider"
              style={{
                color: 'var(--neon-cyan)',
                textShadow: '0 0 10px rgba(0, 245, 212, 0.5)',
              }}
            >
              NEON RUN
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `neon-button ${isActive ? 'active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
