import { Link, useLocation } from 'react-router-dom';
import { darkenColor } from '@/stores/useStore';

const NAV_BG = '#2C3E50';
const REPORT_BTN = '#3498DB';

export default function NavBar() {
  const location = useLocation();
  const onReport = location.pathname === '/report';

  return (
    <nav
      style={{
        height: '64px',
        backgroundColor: NAV_BG,
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        flexShrink: 0,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Link
        to="/"
        style={{
          color: '#FFFFFF',
          textDecoration: 'none',
          fontSize: '20px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#3498DB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
          }}
        >
          📋
        </span>
        团队任务看板
      </Link>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Link
          to="/"
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            backgroundColor: onReport ? 'transparent' : 'rgba(255,255,255,0.12)',
            color: '#FFFFFF',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'background-color 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = onReport ? 'transparent' : 'rgba(255,255,255,0.12)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          看板
        </Link>
        <Link
          to="/report"
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            backgroundColor: onReport ? REPORT_BTN : 'rgba(255,255,255,0.12)',
            color: '#FFFFFF',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'background-color 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = onReport ? darkenColor(REPORT_BTN, 15) : 'rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = onReport ? REPORT_BTN : 'rgba(255,255,255,0.12)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          📊 报告
        </Link>
      </div>
    </nav>
  );
}
