import { Link, NavLink } from 'react-router-dom';
import { useCartStore } from './store';

const logoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 64 64" fill="none">
  <path d="M12 16c0-2.2 1.8-4 4-4h32c2.2 0 4 1.8 4 4v28c0 2.2-1.8 4-4 4H16c-2.2 0-4-1.8-4-4V16z" 
        stroke="#8B5E3C" stroke-width="3" fill="none"/>
  <path d="M16 16v28h32V16" stroke="#8B5E3C" stroke-width="2" fill="none"/>
  <path d="M20 24h24v4H20z" fill="#8B5E3C"/>
  <path d="M20 32h16v4H20z" fill="#8B5E3C"/>
</svg>`;

const cartSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
  <line x1="3" y1="6" x2="21" y2="6"/>
  <path d="M16 10a4 4 0 01-8 0"/>
</svg>`;

export default function Navbar() {
  const getCount = useCartStore((state) => state.getCount);
  const count = getCount();

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        padding: '12px 24px',
        backgroundColor: '#FDF8F0',
        borderBottom: '1px solid #E8DCC8',
        transition: 'all 0.2s ease-out',
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div dangerouslySetInnerHTML={{ __html: logoSvg }} />
        <span
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#8B5E3C',
          }}
        >
          匠艺皮具
        </span>
      </Link>

      <div style={{ display: 'flex', gap: '32px', marginLeft: '48px', flex: 1 }}>
        <NavLink
          to="/"
          end
          style={({ isActive }) => ({
            padding: '8px 4px',
            color: isActive ? '#8B5E3C' : '#666',
            fontWeight: isActive ? 600 : 400,
            borderBottom: isActive ? '2px solid #8B5E3C' : '2px solid transparent',
            transition: 'all 0.2s ease-out',
          })}
        >
          客户浏览
        </NavLink>
        <NavLink
          to="/admin"
          style={({ isActive }) => ({
            padding: '8px 4px',
            color: isActive ? '#8B5E3C' : '#666',
            fontWeight: isActive ? 600 : 400,
            borderBottom: isActive ? '2px solid #8B5E3C' : '2px solid transparent',
            transition: 'all 0.2s ease-out',
          })}
        >
          后台管理
        </NavLink>
      </div>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          color: '#8B5E3C',
          cursor: 'pointer',
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: cartSvg }} />
        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-8px',
              minWidth: '18px',
              height: '18px',
              padding: '0 5px',
              borderRadius: '9px',
              backgroundColor: '#D4A574',
              color: 'white',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {count}
          </span>
        )}
      </div>
    </nav>
  );
}
