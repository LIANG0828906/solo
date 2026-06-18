import React, { useRef, useState, useEffect } from 'react';

interface LikeButtonProps {
  count: number;
  onLike: () => void;
  liked?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const LikeButton: React.FC<LikeButtonProps> = ({ count, onLike, liked = false }) => {
  const [isLiked, setIsLiked] = useState(liked);
  const [displayCount, setDisplayCount] = useState(count);
  const [bounce, setBounce] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplayCount(count);
  }, [count]);

  const createParticles = (cx: number, cy: number) => {
    const colors = ['#6C63FF', '#FF6B9D', '#FFD166', '#4ADE80', '#A78BFA', '#FFFFFF'];
    const newParticles: Particle[] = [];
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24 + Math.random() * 0.3;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
      });
    }
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 1.5;
      newParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: '#FFFFFF',
        size: 2,
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life -= 0.025;
        if (p.life <= 0) return false;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });
      if (particlesRef.current.length > 0) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        animFrameRef.current = null;
      }
    };
    if (!animFrameRef.current) {
      animate();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isLiked) return;
    setIsLiked(true);
    setBounce(true);
    setDisplayCount((c) => c + 1);
    onLike();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2 - 4;
    createParticles(cx, cy);
    setTimeout(() => setBounce(false), 500);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 22px',
        borderRadius: 50,
        background: isLiked
          ? 'linear-gradient(135deg, rgba(255,107,157,0.25), rgba(108,99,255,0.25))'
          : 'rgba(255,255,255,0.06)',
        border: `1px solid ${isLiked ? 'rgba(255,107,157,0.4)' : 'var(--glass-border-light)'}`,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.3s ease',
        transform: bounce ? 'scale(1.05)' : 'scale(1)',
      }}
      onMouseEnter={(e) => {
        if (!isLiked) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isLiked) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        }
      }}
    >
      <canvas
        ref={canvasRef}
        width={120}
        height={80}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      <span
        style={{
          fontSize: 22,
          zIndex: 3,
          position: 'relative',
          animation: bounce ? 'scaleSpring 0.5s ease' : 'none',
          filter: isLiked ? 'drop-shadow(0 0 8px rgba(255,107,157,0.6))' : 'none',
        }}
      >
        {isLiked ? '❤️' : '🤍'}
      </span>
      <span
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: isLiked ? '#FFB3C9' : 'var(--text-primary)',
          zIndex: 3,
          position: 'relative',
        }}
      >
        {displayCount.toLocaleString()}
      </span>
    </div>
  );
};

export default LikeButton;
