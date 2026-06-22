import { useEffect, useRef, useState, useCallback } from 'react';
import type { Ship, MineralSpot } from './gameState';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface LaserBeam {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startTime: number;
  duration: number;
}

interface BreakFragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

interface GameCanvasProps {
  coins: number;
  laserLevel: number;
  ships: Ship[];
  asteroidLevel: number;
  asteroidCapacity: number;
  asteroidOreCount: number;
  mineralSpots: MineralSpot[];
  asteroidBreaking: boolean;
  breakProgress: number;
  onMine: () => void;
  onAsteroidBroken: () => void;
  onBreakComplete: () => void;
}

const ASTEROID_RADIUS = 80;
const STAR_COUNT = 200;

function generateStars(width: number, height: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 0.5 + Math.random() * 2,
      brightness: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 0.5 + Math.random() * 2,
      twinklePhase: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

function generateAsteroidVertices(radius: number, seed: number): { x: number; y: number }[] {
  const vertices: { x: number; y: number }[] = [];
  const vertexCount = 12 + Math.floor(seed * 4);
  for (let i = 0; i < vertexCount; i++) {
    const angle = (i / vertexCount) * Math.PI * 2;
    const r = radius * (0.85 + ((Math.sin(angle * 3 + seed * 10) + 1) / 2) * 0.25);
    vertices.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    });
  }
  return vertices;
}

function generateBreakFragments(centerX: number, centerY: number): BreakFragment[] {
  const fragments: BreakFragment[] = [];
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 150;
    fragments.push({
      x: centerX + (Math.random() - 0.5) * 40,
      y: centerY + (Math.random() - 0.5) * 40,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 15,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 5,
    });
  }
  return fragments;
}

export default function GameCanvas({
  coins,
  laserLevel,
  ships,
  asteroidLevel,
  asteroidCapacity,
  asteroidOreCount,
  mineralSpots,
  asteroidBreaking,
  breakProgress: propBreakProgress,
  onMine,
  onAsteroidBroken,
  onBreakComplete,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const starsRef = useRef<Star[]>([]);
  const asteroidsRef = useRef<{ vertices: { x: number; y: number }[]; seed: number } | null>(null);
  const lasersRef = useRef<LaserBeam[]>([]);
  const breakFragmentsRef = useRef<BreakFragment[]>([]);
  const coinAnimRef = useRef<{ scale: number; startTime: number } | null>(null);
  const shakeRef = useRef<{ shaking: boolean; startTime: number }>({ shaking: false, startTime: 0 });
  const breakStartTimeRef = useRef<number>(0);
  const prevBreakingRef = useRef(false);
  const flashCountRef = useRef(0);
  const lastAutoMineRef = useRef<number[]>([]);
  const rotationRef = useRef(0);

  const displayCoins = Math.floor(coins);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setSize({ width: rect.width, height: rect.height });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    starsRef.current = generateStars(size.width, size.height);
  }, [size.width, size.height]);

  useEffect(() => {
    asteroidsRef.current = {
      vertices: generateAsteroidVertices(ASTEROID_RADIUS, asteroidLevel * 0.7 + 0.3),
      seed: asteroidLevel * 0.7 + 0.3,
    };
  }, [asteroidLevel]);

  useEffect(() => {
    if (asteroidBreaking && !prevBreakingRef.current) {
      breakStartTimeRef.current = performance.now();
      flashCountRef.current = 0;
      const centerX = size.width / 2;
      const centerY = size.height / 2 - 50;
      breakFragmentsRef.current = generateBreakFragments(centerX, centerY);
      onAsteroidBroken();
    }
    prevBreakingRef.current = asteroidBreaking;
  }, [asteroidBreaking, size.width, size.height, onAsteroidBroken]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (asteroidBreaking) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const centerX = size.width / 2;
    const centerY = size.height / 2 - 50;
    
    let clickedSpot = false;
    for (const spot of mineralSpots) {
      const spotX = centerX + spot.x;
      const spotY = centerY + spot.y;
      const dist = Math.sqrt((clickX - spotX) ** 2 + (clickY - spotY) ** 2);
      if (dist < spot.size + 10) {
        clickedSpot = true;
        const shipX = centerX;
        const shipY = centerY + 150;
        lasersRef.current.push({
          fromX: shipX,
          fromY: shipY,
          toX: spotX,
          toY: spotY,
          startTime: performance.now(),
          duration: 300,
        });
        onMine();
        coinAnimRef.current = { scale: 1, startTime: performance.now() };
        break;
      }
    }
    
    if (!clickedSpot) {
      const distFromCenter = Math.sqrt((clickX - centerX) ** 2 + (clickY - centerY) ** 2);
      if (distFromCenter < ASTEROID_RADIUS + 20) {
        const shipX = centerX;
        const shipY = centerY + 150;
        lasersRef.current.push({
          fromX: shipX,
          fromY: shipY,
          toX: clickX,
          toY: clickY,
          startTime: performance.now(),
          duration: 300,
        });
        onMine();
        coinAnimRef.current = { scale: 1, startTime: performance.now() };
      }
    }
  }, [asteroidBreaking, size.width, size.height, mineralSpots, onMine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let lastTime = performance.now();
    
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      rotationRef.current += deltaTime * 0.00005;
      
      const centerX = size.width / 2;
      const centerY = size.height / 2 - 50;
      
      ships.forEach((ship, index) => {
        const lastMine = lastAutoMineRef.current[index] || 0;
        if (currentTime - lastMine >= 1000 && !asteroidBreaking) {
          lastAutoMineRef.current[index] = currentTime;
          if (mineralSpots.length > 0) {
            const spotIndex = Math.floor(Math.random() * mineralSpots.length);
            const spot = mineralSpots[spotIndex];
            const shipX = centerX + Math.cos(ship.angle) * ship.radius;
            const shipY = centerY + Math.sin(ship.angle) * ship.radius;
            lasersRef.current.push({
              fromX: shipX,
              fromY: shipY,
              toX: centerX + spot.x,
              toY: centerY + spot.y,
              startTime: currentTime,
              duration: 200,
            });
          }
        }
      });
      
      ctx.fillStyle = '#0a0a2e';
      ctx.fillRect(0, 0, size.width, size.height);
      
      starsRef.current.forEach((star) => {
        const twinkle = Math.sin(currentTime * star.twinkleSpeed * 0.001 + star.twinklePhase);
        const brightness = star.brightness * (0.6 + twinkle * 0.4);
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      lasersRef.current = lasersRef.current.filter((laser) => {
        const elapsed = currentTime - laser.startTime;
        if (elapsed > laser.duration) return false;
        
        const alpha = 1 - elapsed / laser.duration;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(laser.fromX, laser.fromY);
        ctx.lineTo(laser.toX, laser.toY);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        return true;
      });
      
      if (!asteroidBreaking && asteroidsRef.current) {
        ctx.save();
        ctx.translate(centerX, centerY);
        
        const vertices = asteroidsRef.current.vertices;
        
        const gradient = ctx.createRadialGradient(-15, -15, 10, 0, 0, ASTEROID_RADIUS);
        gradient.addColorStop(0, '#8b7355');
        gradient.addColorStop(0.5, '#6b5344');
        gradient.addColorStop(1, '#4a3728');
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#3a2718';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
          ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        mineralSpots.forEach((spot) => {
          const twinkle = Math.sin(currentTime * 0.003 + spot.twinklePhase);
          const brightness = 0.6 + twinkle * 0.4;
          
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 8 * brightness;
          ctx.fillStyle = `rgba(255, 215, 0, ${brightness})`;
          ctx.beginPath();
          ctx.arc(spot.x, spot.y, spot.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });
        
        ctx.restore();
      }
      
      if (asteroidBreaking) {
        const breakElapsed = currentTime - breakStartTimeRef.current;
        const breakDuration = 1000;
        
        if (breakElapsed < breakDuration) {
          const progress = breakElapsed / breakDuration;
          
          breakFragmentsRef.current.forEach((frag) => {
            const x = frag.x + frag.vx * progress;
            const y = frag.y + frag.vy * progress + 0.5 * 50 * progress * progress;
            const rotation = frag.rotation + frag.rotationSpeed * progress;
            const alpha = 1 - progress;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.fillStyle = `rgba(139, 115, 85, ${alpha})`;
            ctx.fillRect(-frag.size / 2, -frag.size / 2, frag.size, frag.size * 0.7);
            ctx.restore();
          });
        } else {
          onBreakComplete();
        }
      }
      
      if (asteroidBreaking) {
        const breakElapsed = currentTime - breakStartTimeRef.current;
        const flashInterval = 150;
        const flashNum = Math.floor(breakElapsed / flashInterval);
        if (flashNum < 3 && flashNum !== flashCountRef.current) {
          flashCountRef.current = flashNum;
        }
        if (flashNum < 3) {
          const flashAlpha = (flashNum % 2 === 0) ? 0.5 : 0;
          if (flashAlpha > 0 && asteroidsRef.current) {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.fillStyle = `rgba(255, 50, 50, ${flashAlpha})`;
            ctx.beginPath();
            const vertices = asteroidsRef.current.vertices;
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let i = 1; i < vertices.length; i++) {
              ctx.lineTo(vertices[i].x, vertices[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        }
      }
      
      ships.forEach((ship) => {
        const shipX = centerX + Math.cos(ship.angle) * ship.radius;
        const shipY = centerY + Math.sin(ship.angle) * ship.radius;
        
        ctx.save();
        ctx.translate(shipX, shipY);
        ctx.rotate(ship.angle + Math.PI / 2);
        
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-6, 8);
        ctx.lineTo(6, 8);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#4da6ff';
        ctx.beginPath();
        ctx.arc(0, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });
      
      if (ships.length === 0 && !asteroidBreaking) {
        const shipX = centerX;
        const shipY = centerY + 150;
        
        ctx.save();
        ctx.translate(shipX, shipY);
        
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(-8, 10);
        ctx.lineTo(8, 10);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#4da6ff';
        ctx.beginPath();
        ctx.arc(0, -3, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [size, ships, mineralSpots, asteroidBreaking, onBreakComplete]);

  let coinScale = 1;
  if (coinAnimRef.current) {
    const elapsed = performance.now() - coinAnimRef.current.startTime;
    if (elapsed < 150) {
      const t = elapsed / 150;
      coinScale = 1 + Math.sin(t * Math.PI) * 0.3;
    } else {
      coinAnimRef.current = null;
    }
  }

  const progressPercent = (asteroidOreCount / asteroidCapacity) * 100;

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={size.width}
        height={size.height}
        onClick={handleCanvasClick}
        style={{ display: 'block', cursor: 'pointer' }}
      />
      
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 8,
        }}
      >
        <div
          style={{
            color: '#ffd700',
            fontSize: 28,
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
            transform: `scale(${coinScale})`,
            transition: 'transform 0.05s',
          }}
        >
          💎 {displayCoins.toLocaleString()} 金币
        </div>
        
        <div style={{ color: '#aaa', fontSize: 14 }}>
          第 {asteroidLevel} 号矿星
        </div>
        
        <div style={{ width: 200, textAlign: 'right' }}>
          <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>
            储量: {asteroidOreCount.toLocaleString()} / {asteroidCapacity.toLocaleString()}
          </div>
          <div
            style={{
              width: '100%',
              height: 8,
              background: '#1a1a3e',
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid #2a2a5e',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #ffd700, #ffed4a)',
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
