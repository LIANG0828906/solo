import { useState, useEffect } from 'react';
import { SculptureCanvas } from './components/SculptureCanvas';
import {
  useSculptureStore,
  NEON_COLORS,
  NeonColor,
  COLOR_BACKGROUNDS,
} from './store/useSculptureStore';

const BACKGROUND_TRANSITION_DURATION = 500;

function App() {
  const { currentColor, setColor, backgroundColor } = useSculptureStore();
  const [animatedBackground, setAnimatedBackground] = useState('#0D0D2B');
  const [selectedColor, setSelectedColor] = useState<NeonColor>(currentColor);

  useEffect(() => {
    setSelectedColor(currentColor);
  }, [currentColor]);

  useEffect(() => {
    const startColor = animatedBackground;
    const endColor = backgroundColor;

    if (startColor === endColor) return;

    const startTime = performance.now();
    let animationId: number;

    const parseColor = (hex: string): number[] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16),
          ]
        : [0, 0, 0];
    };

    const toHex = (r: number, g: number, b: number): string => {
      return (
        '#' +
        [r, g, b]
          .map((x) => {
            const hex = Math.round(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          })
          .join('')
      );
    };

    const startRgb = parseColor(startColor);
    const endRgb = parseColor(endColor);

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / BACKGROUND_TRANSITION_DURATION);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const currentRgb = [
        startRgb[0] + (endRgb[0] - startRgb[0]) * easeProgress,
        startRgb[1] + (endRgb[1] - startRgb[1]) * easeProgress,
        startRgb[2] + (endRgb[2] - startRgb[2]) * easeProgress,
      ];

      setAnimatedBackground(
        toHex(currentRgb[0], currentRgb[1], currentRgb[2])
      );

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [backgroundColor]);

  const handleColorClick = (color: NeonColor) => {
    if (color !== selectedColor) {
      setColor(color);
      setSelectedColor(color);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <SculptureCanvas backgroundColor={animatedBackground} />

      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '14px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          pointerEvents: 'none',
          userSelect: 'none',
          letterSpacing: '0.5px',
        }}
      >
        拖拽绘制 | R重置
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '80px',
          display: 'flex',
          gap: '12px',
          pointerEvents: 'auto',
          zIndex: 1000,
        }}
      >
        {NEON_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => handleColorClick(color)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: color,
              border: selectedColor === color ? '2px solid white' : '2px solid transparent',
              cursor: 'pointer',
              padding: 0,
              boxShadow: selectedColor === color ? `0 0 12px ${color}, 0 0 24px ${color}40` : 'none',
              transition: 'box-shadow 0.3s ease, transform 0.2s ease',
              transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (selectedColor !== color) {
                e.currentTarget.style.transform = 'scale(1.15)';
                e.currentTarget.style.boxShadow = `0 0 8px ${color}`;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedColor !== color) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
