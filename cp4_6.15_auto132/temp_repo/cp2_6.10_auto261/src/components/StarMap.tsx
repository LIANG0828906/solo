import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Constellation } from '../types';

interface StarMapProps {
  constellations: Constellation[];
  flashConstellation: string | null;
  flowLines: { from: string; to: string; progress: number }[];
  onConstellationClick: (constellation: Constellation) => void;
}

const StarMap: React.FC<StarMapProps> = ({ constellations, flashConstellation, flowLines, onConstellationClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [hoveredConstellation, setHoveredConstellation] = useState<Constellation | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const starsRef = useRef<{ x: number; y: number; size: number; brightness: number; twinkleSpeed: number }[]>([]);
  const timeRef = useRef(0);

  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.5 + 0.5,
        brightness: Math.random() * 0.5 + 0.5,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
      });
    }
    starsRef.current = stars;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    const width = rect.width;
    const height = rect.height;
    const padding = 50;
    timeRef.current += 0.016;

    ctx.clearRect(0, 0, width, height);

    const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
    bgGradient.addColorStop(0, '#1a2a4a');
    bgGradient.addColorStop(0.5, '#0d1a2e');
    bgGradient.addColorStop(1, '#0a1628');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    starsRef.current.forEach((star) => {
      const twinkle = Math.sin(timeRef.current * star.twinkleSpeed * 10 + star.x * 100) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(224, 240, 255, ${star.brightness * twinkle})`;
      ctx.fill();
    });

    const getPos = (c: Constellation) => ({
      x: padding + c.x * (width - 2 * padding),
      y: padding + c.y * (height - 2 * padding),
    });

    const constellationMap = new Map(constellations.map(c => [c.id, c]));

    ctx.lineWidth = 1;
    constellations.forEach((constellation) => {
      const fromPos = getPos(constellation);
      constellation.lines.forEach((toId) => {
        const toConst = constellationMap.get(toId);
        if (toConst) {
          const toPos = getPos(toConst);
          const gradient = ctx.createLinearGradient(fromPos.x, fromPos.y, toPos.x, toPos.y);
          gradient.addColorStop(0, `${constellation.color}66`);
          gradient.addColorStop(1, `${toConst.color}66`);
          ctx.strokeStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(fromPos.x, fromPos.y);
          ctx.lineTo(toPos.x, toPos.y);
          ctx.stroke();
        }
      });
    });

    flowLines.forEach((flow) => {
      const fromConst = constellationMap.get(flow.from);
      const toConst = constellationMap.get(flow.to);
      if (fromConst && toConst) {
        const fromPos = getPos(fromConst);
        const toPos = getPos(toConst);
        const progress = flow.progress % 1;
        const x = fromPos.x + (toPos.x - fromPos.x) * progress;
        const y = fromPos.y + (toPos.y - fromPos.y) * progress;

        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
        glowGradient.addColorStop(0, '#d4af37');
        glowGradient.addColorStop(0.5, 'rgba(212, 175, 55, 0.3)');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff8dc';
        ctx.fill();
      }
    });

    constellations.forEach((constellation) => {
      const pos = getPos(constellation);
      const isFlashing = flashConstellation === constellation.id;
      const flashAlpha = isFlashing ? Math.sin(timeRef.current * 20) * 0.5 + 0.5 : 1;

      const glowSize = constellation.size * 3;
      const glowGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowSize);
      glowGradient.addColorStop(0, `${constellation.color}${Math.floor(flashAlpha * 150).toString(16).padStart(2, '0')}`);
      glowGradient.addColorStop(0.5, `${constellation.color}33`);
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      const starGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, constellation.size);
      starGradient.addColorStop(0, '#ffffff');
      starGradient.addColorStop(0.3, constellation.color);
      starGradient.addColorStop(1, `${constellation.color}aa`);
      ctx.fillStyle = starGradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, constellation.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(224, 240, 255, ${flashAlpha})`;
      ctx.font = '12px KaiTi, STKaiti, serif';
      ctx.textAlign = 'center';
      ctx.fillText(constellation.name, pos.x, pos.y + constellation.size + 15);
    });

    const beastColors = ['#7CB342', '#29B6F6', '#F44336', '#FF5722'];
    const beastNames = ['青龙', '玄武', '白虎', '朱雀'];
    const beastPositions = [
      { x: 0.85, y: 0.15 },
      { x: 0.15, y: 0.85 },
      { x: 0.85, y: 0.85 },
      { x: 0.5, y: 0.05 },
    ];

    beastNames.forEach((name, i) => {
      const x = padding + beastPositions[i].x * (width - 2 * padding);
      const y = padding + beastPositions[i].y * (height - 2 * padding);
      ctx.fillStyle = beastColors[i];
      ctx.font = 'bold 16px KaiTi, STKaiti, serif';
      ctx.textAlign = 'center';
      ctx.fillText(name, x, y);
    });

    animationRef.current = requestAnimationFrame(draw);
  }, [constellations, flashConstellation, flowLines]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const padding = 50;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let found: Constellation | null = null;
    for (const c of constellations) {
      const cx = padding + c.x * (rect.width - 2 * padding);
      const cy = padding + c.y * (rect.height - 2 * padding);
      const dist = Math.sqrt((mouseX - cx) ** 2 + (mouseY - cy) ** 2);
      if (dist < c.size + 10) {
        found = c;
        break;
      }
    }

    setHoveredConstellation(found);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const padding = 50;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (const c of constellations) {
      const cx = padding + c.x * (rect.width - 2 * padding);
      const cy = padding + c.y * (rect.height - 2 * padding);
      const dist = Math.sqrt((mouseX - cx) ** 2 + (mouseY - cy) ** 2);
      if (dist < c.size + 10) {
        onConstellationClick(c);
        break;
      }
    }
  };

  return (
    <div className="star-map-container">
      <canvas
        ref={canvasRef}
        className="star-map-canvas"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={() => setHoveredConstellation(null)}
      />
      {hoveredConstellation && (
        <div
          className="tooltip"
          style={{
            left: tooltipPos.x + 15,
            top: tooltipPos.y + 15,
          }}
        >
          <div className="tooltip-name">{hoveredConstellation.name}</div>
          <div className="tooltip-element">五行属{hoveredConstellation.element}</div>
          <div className="tooltip-desc">{hoveredConstellation.description}</div>
        </div>
      )}
    </div>
  );
};

export default StarMap;
