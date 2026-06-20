import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('bookDriftUser');
    if (savedUser) {
      navigate('/plaza');
    }
  }, [navigate]);

  const handleRegister = () => {
    if (nickname.trim()) {
      setIsRegistered(true);
      const user = {
        id: Date.now().toString(),
        nickname: nickname.trim(),
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${nickname}`,
      };
      localStorage.setItem('bookDriftUser', JSON.stringify(user));
      setTimeout(() => {
        navigate('/plaza');
      }, 500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.decorationCircle1} />
      <div style={styles.decorationCircle2} />
      
      <div style={{
        ...styles.card,
        transform: isRegistered ? 'scale(0.95)' : 'scale(1)',
        opacity: isRegistered ? 0 : 1,
      }}>
        <div style={styles.iconWrapper}>
          <span style={styles.icon}>📚</span>
        </div>
        
        <h1 style={styles.title}>图书漂流</h1>
        <p style={styles.subtitle}>分享好书，传递温暖</p>
        
        <div style={styles.inputContainer}>
          <div style={styles.inputWrapper}>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyPress={handleKeyPress}
              placeholder="请输入您的昵称"
              maxLength={20}
              style={styles.input}
            />
            <div style={{
              ...styles.underline,
              width: isFocused ? '100%' : '0%',
            }} />
          </div>
        </div>

        <button
          onClick={handleRegister}
          disabled={!nickname.trim()}
          style={{
            ...styles.button,
            backgroundColor: nickname.trim() ? '#8b5e3c' : '#c4a882',
            cursor: nickname.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          开启漂流之旅
        </button>

        <div style={styles.tips}>
          <p style={styles.tipText}>💡 注册后即可浏览书箱、留言互动</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #faf3e0 0%, #f0e4c8 100%)',
    position: 'relative' as const,
    overflow: 'hidden',
    padding: '20px',
  },
  decorationCircle1: {
    position: 'absolute' as const,
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(212,165,116,0.2) 0%, transparent 70%)',
    top: '-100px',
    right: '-100px',
  },
  decorationCircle2: {
    position: 'absolute' as const,
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,94,60,0.1) 0%, transparent 70%)',
    bottom: '-150px',
    left: '-150px',
  },
  card: {
    backgroundColor: '#fffef8',
    borderRadius: '20px',
    padding: '50px 40px',
    boxShadow: '0 20px 60px rgba(139,94,60,0.15)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center' as const,
    transition: 'all 0.5s ease',
    position: 'relative' as const,
    zIndex: 1,
  },
  iconWrapper: {
    width: '80px',
    height: '80px',
    margin: '0 auto 20px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #faf3e0 0%, #f0e4c8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: '40px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '32px',
    fontWeight: 700,
    color: '#3b2e1f',
    letterSpacing: '2px',
  },
  subtitle: {
    margin: '0 0 40px 0',
    fontSize: '15px',
    color: '#8b5e3c',
  },
  inputContainer: {
    marginBottom: '30px',
  },
  inputWrapper: {
    position: 'relative' as const,
  },
  input: {
    width: '100%',
    padding: '15px 0',
    fontSize: '16px',
    border: 'none',
    borderBottom: '2px solid #e8dcc4',
    backgroundColor: 'transparent',
    color: '#3b2e1f',
    outline: 'none',
    transition: 'border-color 0.3s ease',
    textAlign: 'center' as const,
    fontFamily: 'inherit',
  } as React.CSSProperties,
  underline: {
    position: 'absolute' as const,
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    height: '2px',
    background: 'linear-gradient(90deg, #d4a574, #c9a227)',
    transition: 'width 0.3s ease',
  },
  button: {
    width: '100%',
    padding: '14px 30px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    letterSpacing: '1px',
  } as React.CSSProperties,
  tips: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px dashed #e8dcc4',
  },
  tipText: {
    margin: 0,
    fontSize: '13px',
    color: '#a08060',
  },
};

export default Home;
