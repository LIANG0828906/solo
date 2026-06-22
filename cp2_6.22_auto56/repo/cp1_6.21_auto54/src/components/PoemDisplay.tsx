import { useState, useEffect, useCallback } from 'react';
import type { Poem } from '../utils/weatherTypes';

export default function PoemDisplay() {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [currentPoem, setCurrentPoem] = useState<Poem | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showText, setShowText] = useState(true);

  const loadPoems = useCallback(async () => {
    try {
      const response = await fetch('/poems.json');
      const data = await response.json();
      setPoems(data);
      if (data.length > 0) {
        const today = new Date();
        const dayOfYear = Math.floor(
          (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
        );
        const index = dayOfYear % data.length;
        setCurrentPoem(data[index]);
      }
    } catch (error) {
      console.error('Failed to load poems:', error);
    }
  }, []);

  useEffect(() => {
    loadPoems();
  }, [loadPoems]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (poems.length > 0 && !isAnimating) {
        switchPoem();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [poems, isAnimating]);

  const switchPoem = () => {
    if (poems.length === 0) return;

    setIsAnimating(true);
    setShowText(false);

    setTimeout(() => {
      const currentIndex = currentPoem
        ? poems.findIndex(p => p.text === currentPoem.text)
        : -1;
      let nextIndex = Math.floor(Math.random() * poems.length);
      while (nextIndex === currentIndex && poems.length > 1) {
        nextIndex = Math.floor(Math.random() * poems.length);
      }
      setCurrentPoem(poems[nextIndex]);
      setShowText(true);

      setTimeout(() => {
        setIsAnimating(false);
      }, 600);
    }, 600);
  };

  if (!currentPoem) return null;

  return (
    <div style={containerStyle} onClick={switchPoem}>
      <div
        style={{
          ...poemContainerStyle,
          clipPath: showText
            ? 'inset(0 0 0 0)'
            : 'inset(0 50% 0 50%)',
          transition: 'clip-path 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
        }}
      >
        <div style={textStyle}>{currentPoem.text}</div>
        <div style={sourceStyle}>{currentPoem.source}</div>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  left: '24px',
  bottom: '24px',
  zIndex: 10,
  maxWidth: '400px',
  cursor: 'pointer',
};

const poemContainerStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(4px)',
  borderRadius: '12px',
  padding: '16px 20px',
};

const textStyle: React.CSSProperties = {
  fontSize: '20px',
  color: 'rgba(255, 255, 255, 0.85)',
  lineHeight: '1.6',
  marginBottom: '8px',
  fontFamily: '"Noto Serif SC", "Songti SC", serif',
};

const sourceStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'rgba(255, 255, 255, 0.5)',
  textAlign: 'right',
};
