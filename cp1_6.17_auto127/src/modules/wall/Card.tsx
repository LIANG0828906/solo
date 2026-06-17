import { useRef, useState, useEffect, memo } from 'react';
import { getThemeColors } from '../editor/ThemeManager';
import type { Poem } from '../../types';

interface CardProps {
  poem: Poem;
  index: number;
  onLike: (id: string) => void;
}

const Card = memo(function Card({ poem, index, onLike }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const themeColors = getThemeColors(poem.theme);

  const rotation = useRef((Math.random() * 6 - 3) + (index % 2 === 0 ? -1 : 1) * 0.5).current;
  const offsetX = useRef(Math.random() * 40 - 20).current;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLike = async () => {
    try {
      await fetch(`/api/poems/${poem.id}/like`, { method: 'POST' });
      onLike(poem.id);
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const getThemeEmoji = () => {
    switch (poem.theme) {
      case 'sunny':
        return '☀️';
      case 'rainy':
        return '🌧️';
      case 'snowy':
        return '❄️';
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '260px',
        minHeight: '320px',
        backgroundColor: '#FFFBF5',
        borderRadius: '8px',
        padding: '24px',
        margin: '10px',
        flexShrink: 0,
        transform: `translateX(${offsetX}px) rotate(${isHovered ? 0 : rotation}deg) translateY(${isHovered ? -8 : 0}px)`,
        transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
        boxShadow: isHovered
          ? '0 8px 24px #00000018'
          : '0 2px 8px #00000008',
        cursor: 'pointer',
        position: 'relative',
        borderTop: `3px solid ${themeColors.primary}`,
        animation: isVisible ? undefined : 'none',
        willChange: 'transform',
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
              transparent 20px,
              ${themeColors.primary}08 20px,
              ${themeColors.primary}08 21px
            )
          `,
          opacity: 0.05,
          borderRadius: '8px',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <span style={{ fontSize: '18px' }}>{getThemeEmoji()}</span>
          <span
            style={{
              fontSize: '11px',
              color: '#999',
            }}
          >
            {new Date(poem.createdAt).toLocaleDateString('zh-CN')}
          </span>
        </div>

        <h3
          style={{
            fontSize: '20px',
            fontWeight: 300,
            letterSpacing: '1px',
            color: '#3D2E1F',
            margin: '0 0 16px 0',
            fontFamily: '"Songti SC", "SimSun", serif',
            borderBottom: `1px solid ${themeColors.primary}30`,
            paddingBottom: '8px',
          }}
        >
          {poem.title}
        </h3>

        <div
          style={{
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: 1.9,
            color: '#4A3728',
            whiteSpace: 'pre-line',
            fontFamily: '"Songti SC", "SimSun", serif',
            minHeight: '140px',
          }}
        >
          {poem.content}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '16px',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: `1px dashed ${themeColors.primary}30`,
            opacity: isHovered ? 1 : 0.7,
            transition: 'opacity 0.3s ease',
          }}
        >
          <div
            onClick={handleLike}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              color: themeColors.primary,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <span>❤️</span>
            <span>{poem.likes}</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              color: '#888',
            }}
          >
            <span>💬</span>
            <span>{poem.comments}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Card;
