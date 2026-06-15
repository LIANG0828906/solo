import React, { useState, useCallback, useEffect, useRef } from 'react';
import MoodWheel from './components/MoodWheel';
import SongList from './components/SongList';
import {
  loginUser, registerUser, getMoodSongs,
  submitLike, saveMoodHistory,
  UserInfo, Song, MoodResponse,
} from './services/apiService';

const App: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [guestMode, setGuestMode] = useState<boolean>(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [moodColor, setMoodColor] = useState<string>('#e0e0e0');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string>('');
  const [usernameField, setUsernameField] = useState<string>('');
  const [passwordField, setPasswordField] = useState<string>('');
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(max-width: 767px)').matches
      : false
  );
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleIdRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(max-width: 767px)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };
    if (mql.addEventListener) {
      mql.addEventListener('change', handleChange);
      return () => mql.removeEventListener('change', handleChange);
    } else {
      mql.addListener(handleChange);
      return () => mql.removeListener(handleChange);
    }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'login') {
        const result = await loginUser(usernameField, passwordField);
        setUser(result);
      } else {
        const result = await registerUser(usernameField, passwordField);
        setUser(result);
      }
    } catch (err) {
      setAuthError(authMode === 'login' ? '登录失败，请检查用户名和密码' : '注册失败，请重试');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setGuestMode(false);
    setUsernameField('');
    setPasswordField('');
    setAuthError('');
    setSongs([]);
    setMoodColor('#e0e0e0');
  };

  const handleMoodSelect = async (mood: string, _label: string, color: string) => {
    try {
      const result: MoodResponse = await getMoodSongs(mood);
      setSongs(result.songs);
      setMoodColor(result.color || color);
      if (user) {
        await saveMoodHistory(user.id, mood);
      }
    } catch {
      setSongs([]);
    }
  };

  const handleLike = async (songId: string) => {
    if (user) {
      await submitLike(user.id, songId, 'like');
    } else {
      alert('请登录后使用此功能');
    }
  };

  const handleDislike = async (songId: string) => {
    if (user) {
      await submitLike(user.id, songId, 'dislike');
    } else {
      alert('请登录后使用此功能');
    }
  };

  const handleLoginClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = rippleIdRef.current++;
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  if (!user && !guestMode) {
    return (
      <div style={styles.loginPage}>
        <style>{styles.cssTag}</style>
        <div style={styles.loginCard}>
          <h1 style={styles.title}>MoodTune</h1>
          <p style={styles.subtitle}>为你的心情播放对的旋律</p>
          <form onSubmit={handleAuthSubmit}>
            <input
              type="text"
              placeholder="用户名"
              value={usernameField}
              onChange={(e) => setUsernameField(e.target.value)}
              style={styles.input}
              className="glow-input"
            />
            <input
              type="password"
              placeholder="密码"
              value={passwordField}
              onChange={(e) => setPasswordField(e.target.value)}
              style={{ ...styles.input, marginTop: 16 }}
              className="glow-input"
            />
            {authError && <p style={styles.errorText}>{authError}</p>}
            <button
              type="submit"
              onClick={handleLoginClick}
              style={styles.loginButton}
            >
              {authMode === 'login' ? '登录' : '注册'}
              {ripples.map((r) => (
                <span
                  key={r.id}
                  style={{
                    position: 'absolute',
                    borderRadius: '50%',
                    background: 'rgba(65, 88, 208, 0.5)',
                    width: 10,
                    height: 10,
                    left: r.x - 5,
                    top: r.y - 5,
                    animation: 'ripple 600ms ease-out forwards',
                    pointerEvents: 'none',
                  }}
                />
              ))}
            </button>
          </form>
          <div style={styles.switchContainer}>
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError('');
              }}
              style={styles.switchButton}
            >
              {authMode === 'login' ? '没有账号？立即注册' : '已有账号？立即登录'}
            </button>
          </div>
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setGuestMode(true)}
              style={styles.guestButton}
            >
              游客模式体验
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.mainPage}>
      <style>{styles.cssTag}</style>
      <div style={styles.header}>
        <span style={styles.logoText}>MoodTune</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={styles.userText}>{user ? user.username : '游客'}</span>
          <button onClick={handleLogout} style={styles.logoutButton}>
            退出登录
          </button>
        </div>
      </div>
      <div
        style={{
          ...styles.bodyContainer,
          flexDirection: isMobile ? 'column' : 'row',
        }}
      >
        <div
          style={{
            ...styles.moodWheelContainer,
            width: isMobile ? '100%' : '30%',
            height: isMobile ? '40%' : '100%',
          }}
        >
          <MoodWheel onMoodSelect={handleMoodSelect} />
        </div>
        <div
          style={{
            ...styles.songListContainer,
            width: isMobile ? '100%' : '70%',
            height: isMobile ? '60%' : '100%',
          }}
        >
          <SongList
            songs={songs}
            moodColor={moodColor}
            onLike={handleLike}
            onDislike={handleDislike}
            isLoggedIn={!!user}
          />
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties | string } = {
  cssTag: `
    @keyframes inputGlow {
      0%, 100% { box-shadow: 0 0 0 rgba(255,255,255,0); }
      50% { box-shadow: 0 0 12px rgba(255,255,255,0.35); }
    }
    .glow-input {
      animation: inputGlow 0.6s ease-in-out infinite;
    }
    @keyframes ripple {
      0% { transform: scale(0); opacity: 1; }
      100% { transform: scale(60); opacity: 0; }
    }
    button:active {
      transform: scale(1.05);
    }
    @media (min-width: 768px) {
    }
  `,
  loginPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a1a2e',
    padding: 20,
  },
  loginCard: {
    width: 'min(420px, 92vw)',
    margin: '0 auto',
    padding: 40,
    borderRadius: 20,
    background: 'linear-gradient(135deg, #4158D0 0%, #C850C0 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 20px 60px rgba(65,88,208,0.4)',
    border: '1px solid rgba(255,255,255,0.18)',
  },
  title: {
    color: 'white',
    fontSize: 42,
    fontWeight: 900,
    textAlign: 'center',
    margin: 0,
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontSize: 15,
    margin: 0,
    marginBottom: 32,
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: '14px 16px',
    color: 'white',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
  },
  loginButton: {
    width: '100%',
    background: 'white',
    color: '#4158D0',
    fontWeight: 'bold',
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
    fontSize: 15,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.1s ease',
  },
  errorText: {
    color: '#ff80ab',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 0,
    textAlign: 'center',
  },
  switchContainer: {
    marginTop: 20,
    textAlign: 'center',
  },
  switchButton: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
  },
  guestButton: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.3)',
    color: 'white',
    padding: '10px 24px',
    borderRadius: 10,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease, transform 0.1s ease',
  },
  mainPage: {
    minHeight: '100vh',
    background: '#1a1a2e',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  logoText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 800,
    background: 'linear-gradient(135deg, #4158D0 0%, #C850C0 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  userText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  logoutButton: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'white',
    padding: '8px 18px',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s ease, transform 0.1s ease',
  },
  bodyContainer: {
    flex: 1,
    display: 'flex',
    padding: 24,
    gap: 24,
    boxSizing: 'border-box',
    minHeight: 'calc(100vh - 60px)',
  },
  moodWheelContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    boxSizing: 'border-box',
  },
  songListContainer: {
    display: 'flex',
    padding: 16,
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    boxSizing: 'border-box',
    overflow: 'auto',
  },
};

export default App;
