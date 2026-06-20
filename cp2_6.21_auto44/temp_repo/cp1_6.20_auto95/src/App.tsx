import { useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import GalleryPage from './pages/GalleryPage';
import AuctionPage from './pages/AuctionPage';
import ProfilePage from './pages/ProfilePage';
import { useStore } from './store/useStore';

function Navbar() {
  const user = useStore(s => s.user);
  const notifications = useStore(s => s.notifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '18px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(10, 10, 20, 0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 240, 255, 0.12)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #00f0ff, #ff00aa)',
              boxShadow: '0 0 18px rgba(0, 240, 255, 0.5)',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <span
              className="font-display"
              style={{ color: '#05050a', fontWeight: 900, fontSize: 16, letterSpacing: '0.05em' }}
            >
              C
            </span>
          </div>
          <div>
            <div className="font-display glow-text" style={{ fontSize: 18, fontWeight: 800 }}>
              CYBER ART BOX
            </div>
            <div style={{ fontSize: 10, color: '#7a7a8e', letterSpacing: '0.2em' }}>
              DIGITAL COLLECTIBLES
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 32 }}>
          <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            GALLERY
          </NavLink>
          <NavLink to="/auctions" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            AUCTIONS
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            {unreadCount > 0 && (
              <span
                style={{
                  display: 'inline-block',
                  background: '#ff00aa',
                  color: '#fff',
                  borderRadius: 999,
                  fontSize: 10,
                  padding: '1px 6px',
                  marginRight: 4
                }}
              >
                {unreadCount}
              </span>
            )}
            PROFILE
          </NavLink>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          className="glass-card"
          style={{
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <span style={{ fontSize: 11, color: '#7a7a8e', letterSpacing: '0.12em' }}>BALANCE</span>
          <span className="font-display glow-text" style={{ fontSize: 18, fontWeight: 700 }}>
            ¥{user?.balance?.toLocaleString() ?? '0'}
          </span>
        </div>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff00aa, #8b5cf6)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 700,
            color: '#fff',
            boxShadow: '0 0 12px rgba(255, 0, 170, 0.4)'
          }}
        >
          {user?.name?.charAt(0) ?? 'U'}
        </div>
      </div>
    </nav>
  );
}

function Toasts() {
  const toasts = useStore(s => s.toasts);
  const removeToast = useStore(s => s.removeToast);
  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className={`toast ${t.type}`}
            onClick={() => removeToast(t.id)}
            style={{ cursor: 'pointer' }}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const loadAll = useStore(s => s.loadAll);
  const location = useLocation();

  useEffect(() => {
    loadAll();
    const interval = setInterval(() => {
      useStore.getState().loadNotifications();
    }, 8000);
    return () => clearInterval(interval);
  }, [loadAll]);

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <Navbar />
      <Toasts />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <GalleryPage />
              </motion.div>
            }
          />
          <Route
            path="/auctions"
            element={
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <AuctionPage />
              </motion.div>
            }
          />
          <Route
            path="/profile"
            element={
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <ProfilePage />
              </motion.div>
            }
          />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
