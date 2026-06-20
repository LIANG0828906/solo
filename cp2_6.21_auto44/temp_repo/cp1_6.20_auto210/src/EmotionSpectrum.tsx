import { useEffect, useState, useRef } from 'react';

interface EmotionSpectrumProps {
  colors: (string | null)[];
  weekLabel: string;
  weekDirection?: 'left' | 'right' | null;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export default function EmotionSpectrum({
  colors,
  weekLabel,
  weekDirection,
  onPrevWeek,
  onNextWeek,
  canGoPrev,
  canGoNext,
}: EmotionSpectrumProps) {
  const [animateKey, setAnimateKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevColorsRef = useRef<(string | null)[]>(colors);

  useEffect(() => {
    if (weekDirection) {
      setIsAnimating(true);
      setAnimateKey(prev => prev + 1);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        prevColorsRef.current = colors;
      }, 500);
      return () => clearTimeout(timer);
    } else {
      prevColorsRef.current = colors;
    }
  }, [colors, weekDirection]);

  const buildGradient = (colorArr: (string | null)[]) => {
    const validColors: string[] = [];
    const positions: number[] = [];
    
    colorArr.forEach((color, index) => {
      if (color) {
        validColors.push(color);
        positions.push((index / (colorArr.length - 1)) * 100);
      }
    });

    if (validColors.length === 0) {
      return 'linear-gradient(90deg, #3a3a55 0%, #3a3a55 100%)';
    }

    if (validColors.length === 1) {
      return `linear-gradient(90deg, ${validColors[0]} 0%, ${validColors[0]} 100%)`;
    }

    const stops = validColors.map((color, i) => `${color} ${positions[i]}%`);
    return `linear-gradient(90deg, ${stops.join(', ')})`;
  };

  const currentGradient = buildGradient(colors);
  const prevGradient = buildGradient(prevColorsRef.current);

  return (
    <div className="spectrum-wrapper">
      <div className="spectrum-bar">
        {isAnimating ? (
          <>
            <div
              className="spectrum-bar-inner"
              style={{
                background: prevGradient,
                position: 'absolute',
                top: 0,
                left: 0,
                transform: weekDirection === 'right' ? 'translateX(100%)' : 'translateX(-100%)',
              }}
            />
            <div
              key={animateKey}
              className="spectrum-bar-inner"
              style={{
                background: currentGradient,
                position: 'relative',
                animation: `slideFrom${weekDirection === 'right' ? 'Left' : 'Right'} 0.5s ease forwards`,
              }}
            />
          </>
        ) : (
          <div
            className="spectrum-bar-inner"
            style={{ background: currentGradient }}
          />
        )}
      </div>
      <div className="spectrum-label">
        <button
          className="week-nav-btn"
          onClick={onPrevWeek}
          disabled={!canGoPrev}
        >
          ‹
        </button>
        <span>{weekLabel}</span>
        <button
          className="week-nav-btn"
          onClick={onNextWeek}
          disabled={!canGoNext}
        >
          ›
        </button>
      </div>
      <style>{`
        @keyframes slideFromLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideFromRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
