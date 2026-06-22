import { NavLink } from 'react-router-dom';

interface NavbarProps {
  currentPath: string;
}

const Navbar = ({ currentPath }: NavbarProps) => {
  const links = [
    { to: '/', label: '时间线' },
    { to: '/achievements', label: '成就' },
    { to: '/stats', label: '统计' },
  ];

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(26, 29, 35, 0.8)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'var(--accent)',
          }}
        >
          💪 FitnessTrack
        </div>
        <div
          style={{
            display: 'flex',
            gap: '2rem',
          }}
        >
          {links.map((link) => {
            const isActive = currentPath === link.to;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                style={{
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontWeight: isActive ? '600' : '400',
                  padding: '0.5rem 0',
                  position: 'relative',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                {link.label}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      backgroundColor: 'var(--accent)',
                      borderRadius: '2px',
                    }}
                  />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
