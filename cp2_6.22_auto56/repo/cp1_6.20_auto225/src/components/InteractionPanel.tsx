import React, { useRef, useEffect } from 'react';
import { usePetStore } from '../data/PetState';
import { Utensils, Droplets, Star } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  life: number;
}

const InteractionPanel: React.FC = () => {
  const { feed, clean, play, isAnimating } = usePetStore();
  const particlesRef = useRef<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);
  const animationFrameRef = useRef<number>(0);

  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#A8E6CF'];

  useEffect(() => {
    const animate = () => {
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.dx,
          y: p.y + p.dy,
          life: p.life - 16,
        }))
        .filter((p) => p.life > 0);

      const container = containerRef.current;
      if (container) {
        container
          .querySelectorAll('.particle')
          .forEach((el) => el.remove());

        particlesRef.current.forEach((p) => {
          const dot = document.createElement('div');
          dot.className = 'particle';
          dot.style.left = `${p.x}px`;
          dot.style.top = `${p.y}px`;
          dot.style.backgroundColor = p.color;
          dot.style.opacity = `${p.life / 400}`;
          container.appendChild(dot);
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const spawnParticles = (clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const originX = clientX - rect.left;
    const originY = clientY - rect.top;

    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5 + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 1.5;
      particlesRef.current.push({
        id: particleIdRef.current++,
        x: originX,
        y: originY,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 400,
      });
    }
  };

  const handleFeed = (e: React.MouseEvent) => {
    if (isAnimating) return;
    feed();
    spawnParticles(e.clientX, e.clientY);
  };

  const handleClean = (e: React.MouseEvent) => {
    if (isAnimating) return;
    clean();
    spawnParticles(e.clientX, e.clientY);
  };

  const handlePlay = (e: React.MouseEvent) => {
    if (isAnimating) return;
    play();
    spawnParticles(e.clientX, e.clientY);
  };

  return (
    <div className="interaction-panel" ref={containerRef}>
      <h3 className="panel-title">照顾宠物</h3>
      <div className="button-group">
        <button
          className="action-btn feed-btn"
          onClick={handleFeed}
          disabled={isAnimating}
          aria-label="喂食"
        >
          <Utensils size={28} color="#FFFFFF" />
          <span className="btn-label">喂食</span>
        </button>
        <button
          className="action-btn clean-btn"
          onClick={handleClean}
          disabled={isAnimating}
          aria-label="清洁"
        >
          <Droplets size={28} color="#FFFFFF" />
          <span className="btn-label">清洁</span>
        </button>
        <button
          className="action-btn play-btn"
          onClick={handlePlay}
          disabled={isAnimating}
          aria-label="玩耍"
        >
          <Star size={28} color="#FFFFFF" />
          <span className="btn-label">玩耍</span>
        </button>
      </div>
    </div>
  );
};

export default InteractionPanel;
