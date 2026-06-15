import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { getItems, registerUser as apiRegister, loginUser as apiLogin, getUserById } from './api';
import Home from './pages/Home';
import Register from './pages/Register';
import Detail from './pages/Detail';
import Profile from './pages/Profile';
import Publish from './pages/Publish';

interface User {
  id: string;
  nickname: string;
  avatar_color: string;
}

interface Toast {
  id: number;
  message: string;
  count?: number;
}

interface AppContextType {
  user: User | null;
  setUser: (u: User | null) => void;
  toasts: Toast[];
  addToast: (msg: string) => void;
  refreshItems: () => void;
  itemsVersion: number;
}

export const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  toasts: [],
  addToast: () => {},
  refreshItems: () => {},
  itemsVersion: 0,
});

export const useAppContext = () => useContext(AppContext);

type Route = { page: string; params: Record<string, string> };

function parseHash(hash: string): Route {
  const h = hash.replace('#', '') || '/';
  if (h === '/') return { page: 'home', params: {} };
  if (h === '/register') return { page: 'register', params: {} };
  if (h === '/publish') return { page: 'publish', params: {} };
  if (h === '/profile') return { page: 'profile', params: {} };
  const itemMatch = h.match(/^\/items\/(.+)$/);
  if (itemMatch) return { page: 'detail', params: { id: itemMatch[1] } };
  const exchangeMatch = h.match(/^\/exchange\/(.+)$/);
  if (exchangeMatch) return { page: 'detail', params: { id: exchangeMatch[1] } };
  return { page: 'home', params: {} };
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash(window.location.hash));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cafe_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [itemsVersion, setItemsVersion] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleSetUser = useCallback((u: User | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem('cafe_user', JSON.stringify(u));
    } else {
      localStorage.removeItem('cafe_user');
    }
  }, []);

  const addToast = useCallback((msg: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message: msg, count: 1 }]);
    setUnreadCount(prev => prev + 1);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const refreshItems = useCallback(() => {
    setItemsVersion(v => v + 1);
  }, []);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (route.page === 'home') {
      setUnreadCount(0);
    }
  }, [route.page]);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  const handleLogout = () => {
    handleSetUser(null);
    window.location.hash = '/';
  };

  const ctxValue: AppContextType = {
    user,
    setUser: handleSetUser,
    toasts,
    addToast,
    refreshItems,
    itemsVersion,
  };

  const renderPage = () => {
    switch (route.page) {
      case 'register':
        return <Register navigate={navigate} />;
      case 'detail':
        return <Detail itemId={route.params.id} navigate={navigate} />;
      case 'profile':
        return <Profile navigate={navigate} />;
      case 'publish':
        return <Publish navigate={navigate} />;
      default:
        return <Home navigate={navigate} />;
    }
  };

  return (
    <AppContext.Provider value={ctxValue}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <nav style={{
          background: 'linear-gradient(135deg, #D4A574, #8B5E3C)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 12px rgba(139,94,60,0.2)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
               onClick={() => navigate('/')}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M2 21h18v-2H2v2zM20 8h-1V5H3v3H2c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v3h16v-3h1c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2zm-15 8V9H5v7h-1zm13 0H7V9h11v7z" fill="#FFF8F0"/>
            </svg>
            <span style={{ color: '#FFF8F0', fontSize: '20px', fontWeight: 'bold', fontFamily: 'Georgia, serif' }}>
              咖啡角 · 旧物交换
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user && (
              <>
                <button onClick={() => navigate('/publish')} style={{
                  background: 'rgba(255,248,240,0.2)',
                  border: '1px solid rgba(255,248,240,0.4)',
                  color: '#FFF8F0',
                  padding: '6px 14px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,248,240,0.35)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,248,240,0.2)')}
                >
                  发布物品
                </button>
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: user.avatar_color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '16px',
                  }}>
                    {user.nickname.charAt(0).toUpperCase()}
                  </div>
                  {unreadCount > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      background: '#E53935',
                      color: '#fff',
                      borderRadius: '50%',
                      minWidth: '18px',
                      height: '18px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}>
                      {unreadCount}
                    </div>
                  )}
                </div>
                <span style={{ color: '#FFF8F0', fontSize: '14px', cursor: 'pointer' }}
                      onClick={handleLogout}>
                  退出
                </span>
              </>
            )}
            {!user && (
              <button onClick={() => navigate('/register')} style={{
                background: 'rgba(255,248,240,0.2)',
                border: '1px solid rgba(255,248,240,0.4)',
                color: '#FFF8F0',
                padding: '6px 14px',
                borderRadius: '16px',
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
                fontSize: '14px',
              }}>
                注册 / 登录
              </button>
            )}
          </div>
        </nav>

        <main style={{ flex: 1 }}>
          {renderPage()}
        </main>

        {toasts.map(toast => (
          <div key={toast.id} style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            background: '#8B5E3C',
            color: '#FFF8F0',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            zIndex: 1000,
            animation: 'slideIn 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#E53935',
            }} />
            {toast.message}
          </div>
        ))}

        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.7); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes scaleOut {
            from { transform: scale(1); opacity: 1; }
            to { transform: scale(0.7); opacity: 0; }
          }
        `}</style>
      </div>
    </AppContext.Provider>
  );
}
