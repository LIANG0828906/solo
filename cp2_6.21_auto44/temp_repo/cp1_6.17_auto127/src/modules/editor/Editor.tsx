import { useState, useMemo, useEffect } from 'react';
import { useAppStore, getThemeColors } from './ThemeManager';
import type { WeatherTheme, DecorationElement } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const Editor = () => {
  const currentTheme = useAppStore((state) => state.currentTheme);
  const addPoem = useAppStore((state) => state.addPoem);
  const setView = useAppStore((state) => state.setView);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const themeColors = getThemeColors(currentTheme);

  const decorations = useMemo<DecorationElement[]>(() => {
    return Array.from({ length: 15 }, () => ({
      id: uuidv4(),
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 4,
      rotationDuration: 3 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.3,
    }));
  }, [currentTheme]);

  const getDecorationEmoji = (theme: WeatherTheme): string => {
    switch (theme) {
      case 'sunny':
        return '🌸';
      case 'rainy':
        return '💧';
      case 'snowy':
        return '❄️';
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert('请填写诗的标题和内容');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/poems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, theme: currentTheme }),
      });
      const poem = await response.json();
      addPoem(poem);
      setTitle('');
      setContent('');
      setView('wall');
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const styleId = 'editor-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg); }
          100% { transform: translateY(110vh) rotate(360deg); }
        }
        @keyframes float-rotate {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        backgroundColor: themeColors.background,
        transition: 'background-color 1.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {decorations.map((d) => (
        <div
          key={d.id}
          style={{
            position: 'absolute',
            left: `${d.x}%`,
            top: '-20px',
            fontSize: '20px',
            opacity: d.opacity,
            animation: `fall ${d.duration}s linear ${d.delay}s infinite, float-rotate ${d.rotationDuration}s ease-in-out infinite`,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {getDecorationEmoji(currentTheme)}
        </div>
      ))}

      <h2
        style={{
          marginBottom: '24px',
          color: themeColors.primary,
          fontWeight: 300,
          fontSize: '24px',
          letterSpacing: '2px',
          zIndex: 2,
        }}
      >
        {currentTheme === 'sunny' && '☀️ 晴日写诗'}
        {currentTheme === 'rainy' && '🌧️ 雨中抒怀'}
        {currentTheme === 'snowy' && '❄️ 雪中寄情'}
      </h2>

      <div
        style={{
          width: '800px',
          maxWidth: '100%',
          height: '600px',
          position: 'relative',
          backgroundColor: '#FFFBF5',
          borderRadius: '8px',
          boxShadow: `0 4px 24px ${themeColors.primary}33, 0 2px 8px #00000010`,
          padding: '48px 56px',
          boxSizing: 'border-box',
          zIndex: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 24px,
                ${themeColors.primary}08 24px,
                ${themeColors.primary}08 25px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 24px,
                ${themeColors.primary}08 24px,
                ${themeColors.primary}08 25px
              )
            `,
            opacity: 0.05,
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <input
            type="text"
            placeholder="请输入诗的标题..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '28px',
              fontWeight: 300,
              letterSpacing: '1.5px',
              color: '#3D2E1F',
              marginBottom: '32px',
              padding: '8px 0',
              borderBottom: `1px solid ${themeColors.primary}40`,
              fontFamily: '"Songti SC", "SimSun", serif',
            }}
          />

          <textarea
            placeholder="在此书写你的诗笺..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: '100%',
              height: '380px',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: 1.8,
              color: '#3D2E1F',
              resize: 'none',
              fontFamily: '"Songti SC", "SimSun", serif',
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '16px',
            }}
          >
            <button
              onClick={() => setView('wall')}
              style={{
                padding: '10px 24px',
                border: `1px solid ${themeColors.primary}60`,
                borderRadius: '24px',
                background: 'transparent',
                color: themeColors.primary,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${themeColors.primary}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              去风铃墙
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '10px 28px',
                border: 'none',
                borderRadius: '24px',
                background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`,
                color: '#FFFFFF',
                fontSize: '14px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                boxShadow: `0 2px 12px ${themeColors.primary}40`,
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 4px 16px ${themeColors.primary}60`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 2px 12px ${themeColors.primary}40`;
              }}
            >
              {submitting ? '投递中...' : '投递诗笺'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
