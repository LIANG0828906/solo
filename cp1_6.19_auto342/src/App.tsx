import React, { useState, useEffect } from 'react';
import Keyboard from './components/Keyboard';
import RecorderPanel from './components/RecorderPanel';

const App: React.FC = () => {
  const [kbBgColor, setKbBgColor] = useState('#2d2d2d');
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const checkSize = () => {
      if (window.innerWidth <= 1366 || window.innerHeight <= 768) {
        setScale(0.8);
      } else {
        setScale(1);
      }
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#1c1c1c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          maxWidth: 1400,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 4,
              background: 'linear-gradient(90deg, #64B5F6, #E57373)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            键盘节奏生成器
          </h1>
          <p style={{ fontSize: 13, color: '#666', marginTop: 4, letterSpacing: 1 }}>
            Keyboard Rhythm Generator · 让每次敲击都成为音乐
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 40,
            alignItems: 'flex-start',
            justifyContent: 'center',
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.3s ease',
          }}
        >
          <div
            style={{
              padding: 24,
              borderRadius: 12,
              backgroundColor: kbBgColor,
              transition: 'background-color 0.3s ease',
            }}
          >
            <Keyboard />
          </div>
          <RecorderPanel onToneChange={setKbBgColor} />
        </div>

        <div
          style={{
            marginTop: scale < 1 ? 0 : 16,
            display: 'flex',
            gap: 24,
            fontSize: 11,
            color: '#444',
          }}
        >
          <span>白键: A S D F G H J</span>
          <span>黑键: W E T Y U</span>
          <span>支持鼠标点击或键盘输入</span>
        </div>
      </div>
    </div>
  );
};

export default App;
