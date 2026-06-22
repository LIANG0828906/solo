import React, { useRef, useEffect, useState } from 'react';
import { ThumbsUp, Check } from 'lucide-react';
import styles from './投票按钮.module.css';

interface VoteButtonProps {
  votes: number;
  voted: boolean;
  onVote: () => void;
  disabled?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

const VoteButton: React.FC<VoteButtonProps> = ({ votes, voted, onVote, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const [isAnimating, setIsAnimating] = useState(false);

  const colors = ['#8b5cf6', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#60a5fa'];

  const createParticles = (x: number, y: number) => {
    const count = 25;
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
        life: 1,
        maxLife: 60 + Math.random() * 30,
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
    setIsAnimating(true);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;
      let hasAlive = false;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.vx *= 0.98;
        p.life -= 1 / p.maxLife;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        hasAlive = true;

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      if (hasAlive) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    if (isAnimating) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating]);

  const handleClick = (e: React.MouseEvent) => {
    if (voted || disabled) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      createParticles(x, y);
    }

    onVote();
  };

  return (
    <div className={styles.voteContainer}>
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        className={styles.particleCanvas}
      />
      <button
        className={`${styles.voteButton} ${voted ? styles.votedButton : ''}`}
        onClick={handleClick}
        disabled={disabled}
      >
        {voted ? <Check size={20} /> : <ThumbsUp size={20} />}
        <span className={styles.voteCount}>{votes}</span>
        <span>{voted ? '已投票' : '投票支持'}</span>
      </button>
    </div>
  );
};

export default VoteButton;
