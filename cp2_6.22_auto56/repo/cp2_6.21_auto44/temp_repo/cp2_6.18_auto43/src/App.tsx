import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useLocation,
  Navigate
} from 'react-router-dom';
import { Dashboard } from './modules/visual/Dashboard';
import { TrendPage } from './modules/visual/TrendPage';

const navStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 16px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none',
  color: active ? '#fff' : '#6B7280',
  background: active ? 'linear-gradient(135deg,#6366F1,#818CF8)' : 'transparent',
  boxShadow: active ? '0 4px 10px rgba(99,102,241,0.28)' : 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  transition: 'all 0.22s ease'
});

const Shell = () => {
  const location = useLocation();
  const [displayPath, setDisplayPath] = useState(location.pathname);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    setFade(false);
    const t = setTimeout(() => {
      setDisplayPath(location.pathname);
      setFade(true);
    }, 180);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.98) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.5) }
          to { opacity: 1; transform: scale(1) }
        }
        @keyframes popupIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.96) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1) }
          50% { opacity: 0.6; transform: scale(0.88) }
        }
        @keyframes pulseRing {
          0% { box-shadow: 0 10px 24px rgba(99,102,241,0.45), 0 0 0 0 rgba(99,102,241,0.55) }
          70% { box-shadow: 0 10px 24px rgba(99,102,241,0.45), 0 0 0 16px rgba(99,102,241,0) }
          100% { box-shadow: 0 10px 24px rgba(99,102,241,0.45), 0 0 0 0 rgba(99,102,241,0) }
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.45 }
          50% { opacity: 0.85 }
        }
        .skeleton-block {
          background: linear-gradient(90deg,#E5E7EB 25%,#F3F4F6 50%,#E5E7EB 75%);
          background-size: 200% 100%;
          animation: skeletonPulse 1.5s ease-in-out infinite;
        }
        .range-btn-enter { transition: all 0.2s ease }
        input:focus, textarea:focus, select:focus {
          border-color: #A5B4FC !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important;
        }
        .record-row:hover { background: #EEF2FF !important; }
        button:hover { filter: brightness(1.08); }
        button:active { transform: translateY(1px); }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
      `}</style>

      <nav style={styles.navBar}>
        <div style={styles.navInner}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div>
              <div style={styles.logoText}>MediTrack</div>
              <div style={styles.logoSub}>慢性病健康管理</div>
            </div>
          </div>
          <div style={styles.navLinks}>
            <NavLink to="/" end style={({ isActive }) => navStyle(isActive)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              仪表盘
            </NavLink>
            <NavLink to="/trend" style={({ isActive }) => navStyle(isActive)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              趋势分析
            </NavLink>
          </div>
          <div style={styles.navUser}>
            <div style={styles.avatar}>U</div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1F2937' }}>用户</div>
              <div style={{ fontSize: 10, color: '#9CA3AF' }}>患者模式</div>
            </div>
          </div>
        </div>
      </nav>

      <main
        style={{
          flex: 1,
          opacity: fade ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      >
        <Routes location={{ pathname: displayPath }}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trend" element={<TrendPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer style={styles.footer}>
        <span>© 2026 MediTrack · 所有数据仅存储在您的浏览器本地</span>
      </footer>
    </div>
  );
};

export const App = () => (
  <BrowserRouter>
    <Shell />
  </BrowserRouter>
);

const styles: Record<string, React.CSSProperties> = {
  navBar: {
    background: '#fff',
    borderBottom: '1px solid #F3F4F6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    position: 'sticky',
    top: 0,
    zIndex: 50
  },
  navInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '12px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: 'linear-gradient(135deg,#6366F1,#818CF8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(99,102,241,0.3)'
  },
  logoText: { fontSize: 16, fontWeight: 800, color: '#1F2937', letterSpacing: 0.2 },
  logoSub: { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
  navLinks: { display: 'inline-flex', gap: 4, background: '#F9FAFB', padding: 4, borderRadius: 10 },
  navUser: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '4px 12px 4px 4px',
    borderRadius: 100,
    background: '#F9FAFB',
    border: '1px solid #F3F4F6'
  },
  avatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'linear-gradient(135deg,#A78BFA,#6366F1)',
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700
  },
  footer: {
    padding: '20px 32px 28px',
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 11
  }
};
