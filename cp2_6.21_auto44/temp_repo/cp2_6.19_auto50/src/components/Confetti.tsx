import { useEffect, useRef } from 'react';

interface ConfettiProps {
  active: boolean;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];

export default function Confetti({ active }: ConfettiProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const styleInjected = useRef(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (!styleInjected.current) {
      const styleId = 'confetti-keyframes';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          @keyframes confettiFall {
            0% {
              transform: translateY(-100vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
          @keyframes confettiSway {
            0%, 100% {
              transform: translateX(0);
            }
            25% {
              transform: translateX(30px);
            }
            75% {
              transform: translateX(-30px);
            }
          }
        `;
        document.head.appendChild(style);
      }
      styleInjected.current = true;
    }
  }, []);

  if (!active) return null;

  return (
    <div ref={containerRef} style={styles.container}>
      {Array.from({ length: 30 }).map((_, index) => {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const left = Math.random() * 100;
        const size = 6 + Math.random() * 10;
        const duration = 2 + Math.random() * 2;
        const delay = Math.random() * 0.5;
        const animationDuration = 2.5 + Math.random() * 1;

        return (
          <div
            key={index}
            style={{
              ...styles.particle,
              left: `${left}%`,
              width: `${size}px`,
              height: `${size * 0.6}px`,
              backgroundColor: color,
              animation: `confettiFall ${animationDuration}s ease-in ${delay}s forwards, confettiSway ${duration}s ease-in-out infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
    top: '-20px',
    borderRadius: '2px',
    opacity: 0,
  },
};
