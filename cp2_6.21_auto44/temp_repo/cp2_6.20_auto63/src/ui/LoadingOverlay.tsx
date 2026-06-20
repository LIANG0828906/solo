import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';

const LoadingOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const setPhase = useGameStore((s) => s.setPhase);
  const initLevel = useGameStore((s) => s.initLevel);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d')!;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; color: string; life: number }[] = [];
    const colors = ['#d4af37', '#00d4ff', '#ff00ff', '#00ff88', '#8844ff'];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < 400; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 150;
      particles.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      });
    }

    let startTime = performance.now();
    const duration = 1500;
    let animationId: number;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const expand = progress * progress * 2.5;

      ctx.fillStyle = 'rgba(10, 22, 40, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = 0.3 + expand * 0.5;
        p.vx += (dx / (dist || 1)) * force;
        p.vy += (dy / (dist || 1)) * force;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.x += p.vx;
        p.y += p.vy;
        p.life = Math.max(0, 1 - progress * 1.2);

        ctx.beginPath();
        ctx.globalAlpha = p.life * (0.5 + Math.sin((elapsed + i * 50) * 0.005) * 0.3);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.arc(p.x, p.y, p.size * (1 + progress * 0.5), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          initLevel();
          setPhase('playing');
        }, 100);
      }
    };

    animationId = requestAnimationFrame(animate);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [setPhase, initLevel]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, #1a0a2e 0%, #0a1628 60%, #050810 100%)',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          transform: 'translateY(-50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          className="font-cinzel"
          style={{
            color: '#d4af37',
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textShadow: '0 0 30px rgba(212,175,55,0.6)',
            animation: 'pulse-glow 1.5s ease-in-out infinite',
          }}
        >
          虚空遗物
        </div>
        <div
          style={{
            marginTop: 12,
            color: 'rgba(212,175,55,0.6)',
            fontSize: 14,
            letterSpacing: '0.3em',
          }}
        >
          VOID RELICS
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
