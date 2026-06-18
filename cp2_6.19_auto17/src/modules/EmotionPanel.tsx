import React, { useRef, useState, useCallback, useEffect } from 'react';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  color: string;
  min?: number;
  max?: number;
  step?: number;
}

export const EmotionSlider: React.FC<SliderProps> = ({
  value,
  onChange,
  label,
  color,
  min = 0,
  max = 1,
  step = 0.01,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const percentage = ((value - min) / (max - min)) * 100;

  const getValueFromPosition = useCallback((clientY: number) => {
    if (!trackRef.current) return value;
    const rect = trackRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    const height = rect.height;
    let newValue = 1 - y / height;
    newValue = Math.max(0, Math.min(1, newValue));
    const range = max - min;
    let steppedValue = min + newValue * range;
    if (step > 0) {
      steppedValue = Math.round(steppedValue / step) * step;
    }
    return Math.max(min, Math.min(max, steppedValue));
  }, [value, min, max, step]);

  const handleStart = useCallback((clientY: number) => {
    setIsDragging(true);
    const newValue = getValueFromPosition(clientY);
    onChange(newValue);
  }, [getValueFromPosition, onChange]);

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    const newValue = getValueFromPosition(clientY);
    onChange(newValue);
  }, [isDragging, getValueFromPosition, onChange]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientY);
  }, [handleStart]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleStart(e.touches[0].clientY);
    }
  }, [handleStart]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientY);
    };
    const handleMouseUp = () => {
      handleEnd();
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => {
      handleEnd();
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const thumbScale = isDragging ? 1.3 : isHovering ? 1.15 : 1;
  const glowIntensity = isDragging ? 1.5 : isHovering ? 1.2 : 1;

  return (
    <div className="emotion-slider-container">
      <div className="emotion-slider-label" style={{ color }}>
        {label}
      </div>
      <div
        className="emotion-slider-wrapper"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div
          className="emotion-slider-track-bg"
          ref={trackRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div
            className="emotion-slider-track-glow"
            style={{
              boxShadow: `0 0 ${12 * glowIntensity}px ${color}88, 0 0 ${24 * glowIntensity}px ${color}44`,
            }}
          >
            <div
              className="emotion-slider-fill"
              style={{
                height: `${percentage}%`,
                background: `linear-gradient(to top, ${color}, ${color}cc)`,
              }}
            />
          </div>

          <div
            className="emotion-slider-thumb"
            style={{
              bottom: `calc(${percentage}% - 14px)`,
              transform: `translateX(-50%) scale(${thumbScale})`,
              background: `radial-gradient(circle at 30% 30%, #fff, ${color})`,
              boxShadow: `
                0 0 ${12 * glowIntensity}px ${color},
                0 0 ${24 * glowIntensity}px ${color}aa,
                0 0 ${40 * glowIntensity}px ${color}55,
                inset 0 2px 4px rgba(255, 255, 255, 0.8)
              `,
            }}
          />
        </div>
      </div>
      <div className="emotion-slider-value" style={{ color }}>
        {Math.round(value * 100)}%
      </div>
    </div>
  );
};

export interface EmotionPanelProps {
  emotions: {
    happy: number;
    sad: number;
    angry: number;
    calm: number;
  };
  onChange: (emotions: {
    happy: number;
    sad: number;
    angry: number;
    calm: number;
  }) => void;
  themeColor: string;
}

const emotionConfig = [
  { key: 'happy' as const, label: '快乐', color: '#FFD93D' },
  { key: 'sad' as const, label: '悲伤', color: '#4A90D9' },
  { key: 'angry' as const, label: '愤怒', color: '#FF6B6B' },
  { key: 'calm' as const, label: '平静', color: '#6BCB9D' },
];

export const EmotionPanel: React.FC<EmotionPanelProps> = ({
  emotions,
  onChange,
  themeColor,
}) => {
  const handleEmotionChange = (key: keyof typeof emotions, value: number) => {
    onChange({
      ...emotions,
      [key]: value,
    });
  };

  return (
    <div
      className="emotion-panel"
      style={{
        '--theme-color': themeColor,
      } as React.CSSProperties}
    >
      <div className="emotion-panel-header">
        <h2 className="emotion-panel-title">情绪调色板</h2>
        <p className="emotion-panel-subtitle">拖拽滑块，绘制你的心情</p>
      </div>
      <div className="emotion-sliders-grid">
        {emotionConfig.map(({ key, label, color }) => (
          <EmotionSlider
            key={key}
            value={emotions[key]}
            onChange={(v) => handleEmotionChange(key, v)}
            label={label}
            color={color}
          />
        ))}
      </div>
    </div>
  );
};
