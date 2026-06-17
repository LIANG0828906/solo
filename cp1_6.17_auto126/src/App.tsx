import React, { useEffect, useRef, useState } from 'react';
import EcosystemContainer from './EcosystemModule/EcosystemContainer';
import UserIntervention from './GlitchModule/UserIntervention';

const App: React.FC = () => {
  const noiseCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [titleOffset, setTitleOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleOffset((Math.random() - 0.5) * 2);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = noiseCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderNoise = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const colors = ['#FF00FF', '#00FFFF', '#FFFF00', '#FF4444', '#44FF44'];
      const noiseCount = 100;

      for (let i = 0; i < noiseCount; i++) {
        const edge = Math.floor(Math.random() * 4);
        let x, y;

        switch (edge) {
          case 0:
            x = Math.random() * canvas.width;
            y = Math.random() * 20;
            break;
          case 1:
            x = Math.random() * canvas.width;
            y = canvas.height - Math.random() * 20;
            break;
          case 2:
            x = Math.random() * 20;
            y = Math.random() * canvas.height;
            break;
          default:
            x = canvas.width - Math.random() * 20;
            y = Math.random() * canvas.height;
            break;
        }

        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.globalAlpha = 0.1 + Math.random() * 0.1;
        ctx.fillRect(x, y, 1, 1);
      }

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(renderNoise);
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animationRef.current = requestAnimationFrame(renderNoise);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0D0D0D',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Consolas, Monaco, monospace',
    }}>
      <canvas
        ref={noiseCanvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <h1 style={{
        fontSize: '28px',
        fontWeight: 800,
        color: '#FFFFFF',
        marginBottom: '30px',
        position: 'relative',
        transform: `translateX(${titleOffset}px)`,
        textShadow: '2px 0 #FF0000, -2px 0 #00FFFF',
        letterSpacing: '2px',
        zIndex: 1,
        userSelect: 'none',
      }}>
        故障生态缸
      </h1>

      <div style={{
        display: 'flex',
        gap: '30px',
        alignItems: 'flex-start',
        zIndex: 1,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <div style={{ position: 'relative' }}>
          <EcosystemContainer />
        </div>
        <UserIntervention />
      </div>

      <div style={{
        marginTop: '20px',
        color: '#555',
        fontSize: '12px',
        zIndex: 1,
        textAlign: 'center',
      }}>
        Glitch Ecosystem v0.1.0 | 观察 · 干预 · 修复
      </div>
    </div>
  );
};

export default App;
