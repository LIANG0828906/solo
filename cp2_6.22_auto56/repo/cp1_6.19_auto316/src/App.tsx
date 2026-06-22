import React, { useState, useEffect } from 'react';
import { useAuctionStore } from './store/auctionStore';
import AuctionList from './components/AuctionList';
import AuctionDetail from './components/AuctionDetail';

function LoginDialog({ onLogin }: { onLogin: (name: string) => void }) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.logo}>📖</div>
        <h2 style={styles.title}>欢迎来到 BookBid</h2>
        <p style={styles.subtitle}>请输入昵称开始竞拍</p>
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入你的昵称"
            maxLength={20}
            autoFocus
          />
          <button style={styles.btn} type="submit" disabled={!name.trim()}>
            进入
          </button>
        </form>
      </div>
    </div>
  );
}

function NotificationBanner() {
  const notifications = useAuctionStore((s) => s.notifications);
  const removeNotification = useAuctionStore((s) => s.removeNotification);

  return (
    <div style={{ position: 'fixed', top: 60, left: 0, right: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
      {notifications.map((n) => (
        <div
          key={n.id}
          onClick={() => removeNotification(n.id)}
          style={{
            background: n.color,
            color: '#fff',
            padding: '10px 24px',
            borderRadius: 6,
            marginBottom: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            pointerEvents: 'auto',
            animation: 'slideDown 0.3s ease',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const loggedIn = useAuctionStore((s) => s.loggedIn);
  const nickname = useAuctionStore((s) => s.nickname);
  const currentPage = useAuctionStore((s) => s.currentPage);
  const login = useAuctionStore((s) => s.login);
  const logout = useAuctionStore((s) => s.logout);
  const setPage = useAuctionStore((s) => s.setPage);
  const fetchAuctions = useAuctionStore((s) => s.fetchAuctions);

  useEffect(() => {
    if (loggedIn) {
      const interval = setInterval(() => {
        fetchAuctions();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [loggedIn, fetchAuctions]);

  if (!loggedIn) {
    return <LoginDialog onLogin={login} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8' }}>
      <style>{globalCSS}</style>
      <nav style={styles.nav}>
        <div style={styles.navLeft} onClick={() => setPage('list')}>
          <span style={styles.navLogo}>📖</span>
          <span style={styles.navTitle}>BookBid</span>
        </div>
        <div style={styles.navRight}>
          <span style={styles.navNickname}>{nickname}</span>
          <button style={styles.logoutBtn} onClick={logout}>
            退出
          </button>
        </div>
      </nav>
      <NotificationBanner />
      <div style={{ animation: 'fadeIn 0.2s ease' }}>
        {currentPage === 'list' ? <AuctionList /> : <AuctionDetail />}
      </div>
    </div>
  );
}

const globalCSS = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes expandUp {
  from { opacity: 0; transform: scaleY(0); transform-origin: bottom; }
  to { opacity: 1; transform: scaleY(1); transform-origin: bottom; }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F5F0E8; }
`;

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '40px 36px',
    width: 380,
    maxWidth: '90vw',
    textAlign: 'center' as const,
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  logo: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 22, color: '#A0522D', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 24 },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #E0D8CC',
    borderRadius: 8,
    fontSize: 16,
    outline: 'none',
    marginBottom: 16,
    transition: 'border-color 0.2s',
  },
  btn: {
    width: '100%',
    padding: '12px',
    background: '#A0522D',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  nav: {
    height: 60,
    background: '#A0522D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    gap: 8,
  },
  navLogo: { fontSize: 24 },
  navTitle: { color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: 1 },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  navNickname: { color: '#F5F0E8', fontSize: 14 },
  logoutBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 6,
    padding: '4px 14px',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
};
