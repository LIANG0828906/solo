import { useEffect, useRef, useState, useCallback } from 'react';
import { RuneType, runeTemplates } from '../data/data';

export interface MatchResult {
  type: RuneType | null;
  confidence: number;
  name: string;
  color: string;
}

interface RuneCanvasProps {
  onSummon: (result: MatchResult) => void;
  disabled: boolean;
  triggerSummon: boolean;
  onSummonComplete: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Star {
  angle: number;
  radius: number;
}

const CANVAS_SIZE = 400;
const CIRCLE_RADIUS = CANVAS_SIZE / 2;
const RESAMPLE_POINTS = 64;
const MATCH_THRESHOLD = 0.8;

export default function RuneCanvas({ onSummon, disabled, triggerSummon, onSummonComplete }: RuneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const drawnPointsRef = useRef<Point[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const trailParticlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([
    { angle: 0, radius: CIRCLE_RADIUS - 15 },
    { angle: Math.PI / 2, radius: CIRCLE_RADIUS - 15 },
    { angle: Math.PI, radius: CIRCLE_RADIUS - 15 },
    { angle: (Math.PI * 3) / 2, radius: CIRCLE_RADIUS - 15 },
  ]);
  const animationIdRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);
  const summonFlashRef = useRef({ active: false, color: '#ffd700', alpha: 0 });
  const lastTimeRef = useRef(0);

  const getCanvasPoint = useCallback((clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const isInCircle = useCallback((point: Point): boolean => {
    const dx = point.x - CIRCLE_RADIUS;
    const dy = point.y - CIRCLE_RADIUS;
    return Math.sqrt(dx * dx + dy * dy) <= CIRCLE_RADIUS - 10;
  }, []);

  const startDrawing = useCallback((point: Point) => {
    if (disabled || isAnimatingRef.current) return;
    if (!isInCircle(point)) return;
    setIsDrawing(true);
    drawnPointsRef.current = [point];
    trailParticlesRef.current = [];
  }, [disabled, isInCircle]);

  const draw = useCallback((point: Point) => {
    if (!isDrawing || disabled || isAnimatingRef.current) return;
    if (!isInCircle(point)) return;
    
    const points = drawnPointsRef.current;
    const lastPoint = points[points.length - 1];
    
    if (lastPoint) {
      const dx = point.x - lastPoint.x;
      const dy = point.y - lastPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 5) {
        points.push(point);
        
        const trailCount = Math.floor(dist / 3);
        for (let i = 0; i < trailCount; i++) {
          const t = i / trailCount;
          trailParticlesRef.current.push({
            x: lastPoint.x + dx * t,
            y: lastPoint.y + dy * t,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 0.5,
            maxLife: 0.5,
            color: '#ffd700',
            size: 2 + Math.random() * 2,
          });
        }
      }
    }
  }, [isDrawing, disabled, isInCircle]);

  const normalizePath = useCallback((points: Point[]): Point[] => {
    if (points.length < 2) return [];
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const scale = Math.max(maxX - minX, maxY - minY) / 2;
    
    if (scale === 0) return [];
    
    return points.map(p => ({
      x: (p.x - centerX) / scale,
      y: (p.y - centerY) / scale,
    }));
  }, []);

  const resamplePoints = useCallback((points: Point[], count: number): Point[] => {
    if (points.length < 2) return [];
    
    const result: Point[] = [];
    const totalLength = points.reduce((acc, p, i) => {
      if (i === 0) return 0;
      const dx = p.x - points[i - 1].x;
      const dy = p.y - points[i - 1].y;
      return acc + Math.sqrt(dx * dx + dy * dy);
    }, 0);
    
    if (totalLength === 0) return [];
    
    const step = totalLength / (count - 1);
    let currentDist = 0;
    result.push(points[0]);
    
    for (let i = 1; i < points.length && result.length < count; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      while (currentDist + dist >= step * result.length && result.length < count) {
        const t = (step * result.length - currentDist) / dist;
        result.push({
          x: points[i - 1].x + dx * t,
          y: points[i - 1].y + dy * t,
        });
      }
      
      currentDist += dist;
    }
    
    while (result.length < count) {
      result.push({ ...points[points.length - 1] });
    }
    
    return result;
  }, []);

  const calculateDistance = useCallback((p1: Point[], p2: Point[]): number => {
    if (p1.length !== p2.length) return Infinity;
    
    let total = 0;
    for (let i = 0; i < p1.length; i++) {
      const dx = p1[i].x - p2[i].x;
      const dy = p1[i].y - p2[i].y;
      total += Math.sqrt(dx * dx + dy * dy);
    }
    
    return total / p1.length;
  }, []);

  const matchRune = useCallback((drawnPoints: Point[]): MatchResult => {
    const normalized = normalizePath(drawnPoints);
    if (normalized.length < 2) {
      return { type: null, confidence: 0, name: '', color: '' };
    }
    
    const resampled = resamplePoints(normalized, RESAMPLE_POINTS);
    
    let bestMatch: MatchResult = { type: null, confidence: 0, name: '', color: '' };
    let minDistance = Infinity;
    
    runeTemplates.forEach(template => {
      const templateResampled = resamplePoints(template.points, RESAMPLE_POINTS);
      const distance = calculateDistance(resampled, templateResampled);
      const confidence = Math.max(0, 1 - distance / 0.8);
      
      if (distance < minDistance && confidence >= MATCH_THRESHOLD) {
        minDistance = distance;
        bestMatch = {
          type: template.type,
          confidence,
          name: template.name,
          color: template.color,
        };
      }
    });
    
    return bestMatch;
  }, [normalizePath, resamplePoints, calculateDistance]);

  const playSummonAnimation = useCallback((color: string) => {
    isAnimatingRef.current = true;
    summonFlashRef.current = { active: true, color, alpha: 0 };
    
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      particlesRef.current.push({
        x: CIRCLE_RADIUS,
        y: CIRCLE_RADIUS,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8,
        maxLife: 0.8,
        color,
        size: 3 + Math.random() * 4,
      });
    }
    
    setTimeout(() => {
      isAnimatingRef.current = false;
      summonFlashRef.current.active = false;
    }, 800);
  }, []);

  const resetCanvas = useCallback(() => {
    drawnPointsRef.current = [];
    particlesRef.current = [];
    trailParticlesRef.current = [];
    isAnimatingRef.current = false;
    summonFlashRef.current = { active: false, color: '#ffd700', alpha: 0 };
  }, []);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
  }, [isDrawing]);

  const executeSummon = useCallback(() => {
    const points = drawnPointsRef.current;
    if (points.length < 10) {
      onSummon({ type: null, confidence: 0, name: '', color: '' });
      onSummonComplete();
      return;
    }
    
    const result = matchRune(points);
    
    if (result.type) {
      playSummonAnimation(result.color);
      setTimeout(() => {
        onSummon(result);
        resetCanvas();
        onSummonComplete();
      }, 800);
    } else {
      onSummon({ type: null, confidence: 0, name: '', color: '' });
      onSummonComplete();
      drawnPointsRef.current = [];
      trailParticlesRef.current = [];
    }
  }, [matchRune, playSummonAnimation, onSummon, onSummonComplete, resetCanvas]);

  useEffect(() => {
    if (triggerSummon && !disabled && !isAnimatingRef.current) {
      executeSummon();
    }
  }, [triggerSummon, disabled, executeSummon]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const handleMouseDown = (e: MouseEvent) => {
      const point = getCanvasPoint(e.clientX, e.clientY);
      if (point) startDrawing(point);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      const point = getCanvasPoint(e.clientX, e.clientY);
      if (point) draw(point);
    };
    
    const handleMouseUp = () => {
      stopDrawing();
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const point = getCanvasPoint(touch.clientX, touch.clientY);
      if (point) startDrawing(point);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const point = getCanvasPoint(touch.clientX, touch.clientY);
      if (point) draw(point);
    };
    
    const handleTouchEnd = () => {
      stopDrawing();
    };
    
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [getCanvasPoint, startDrawing, draw, stopDrawing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const drawStar = (x: number, y: number, size: number, color: string) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const outerX = x + Math.cos(angle) * size;
        const outerY = y + Math.sin(angle) * size;
        const innerAngle = angle + Math.PI / 5;
        const innerX = x + Math.cos(innerAngle) * size * 0.4;
        const innerY = y + Math.sin(innerAngle) * size * 0.4;
        
        if (i === 0) {
          ctx.moveTo(outerX, outerY);
        } else {
          ctx.lineTo(outerX, outerY);
        }
        ctx.lineTo(innerX, innerY);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    
    const render = (timestamp: number) => {
      const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = timestamp;
      
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      
      const bgGradient = ctx.createRadialGradient(
        CIRCLE_RADIUS, CIRCLE_RADIUS, 0,
        CIRCLE_RADIUS, CIRCLE_RADIUS, CIRCLE_RADIUS
      );
      bgGradient.addColorStop(0, '#2d1247');
      bgGradient.addColorStop(0.7, '#1a0a2e');
      bgGradient.addColorStop(1, '#0d051a');
      
      ctx.beginPath();
      ctx.arc(CIRCLE_RADIUS, CIRCLE_RADIUS, CIRCLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = bgGradient;
      ctx.fill();
      
      const glowGradient = ctx.createRadialGradient(
        CIRCLE_RADIUS, CIRCLE_RADIUS, CIRCLE_RADIUS * 0.3,
        CIRCLE_RADIUS, CIRCLE_RADIUS, CIRCLE_RADIUS
      );
      glowGradient.addColorStop(0, 'rgba(138, 43, 226, 0.3)');
      glowGradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
      
      ctx.beginPath();
      ctx.arc(CIRCLE_RADIUS, CIRCLE_RADIUS, CIRCLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(CIRCLE_RADIUS, CIRCLE_RADIUS, CIRCLE_RADIUS - 5, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      const runeCircleGradient = ctx.createRadialGradient(
        CIRCLE_RADIUS, CIRCLE_RADIUS, CIRCLE_RADIUS * 0.6,
        CIRCLE_RADIUS, CIRCLE_RADIUS, CIRCLE_RADIUS * 0.85
      );
      runeCircleGradient.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
      runeCircleGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
      runeCircleGradient.addColorStop(1, 'rgba(255, 215, 0, 0.1)');
      
      ctx.beginPath();
      ctx.arc(CIRCLE_RADIUS, CIRCLE_RADIUS, CIRCLE_RADIUS * 0.75, 0, Math.PI * 2);
      ctx.strokeStyle = runeCircleGradient;
      ctx.lineWidth = 3;
      ctx.stroke();
      
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const innerR = CIRCLE_RADIUS * 0.7;
        const outerR = CIRCLE_RADIUS * 0.85;
        
        ctx.beginPath();
        ctx.moveTo(
          CIRCLE_RADIUS + Math.cos(angle) * innerR,
          CIRCLE_RADIUS + Math.sin(angle) * innerR
        );
        ctx.lineTo(
          CIRCLE_RADIUS + Math.cos(angle) * outerR,
          CIRCLE_RADIUS + Math.sin(angle) * outerR
        );
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      starsRef.current.forEach((star, index) => {
        star.angle += 0.05;
        const x = CIRCLE_RADIUS + Math.cos(star.angle) * star.radius;
        const y = CIRCLE_RADIUS + Math.sin(star.angle) * star.radius;
        const size = 6 + Math.sin(timestamp / 200 + index) * 2;
        drawStar(x, y, size, '#ffd700');
      });
      
      const points = drawnPointsRef.current;
      if (points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      
      trailParticlesRef.current = trailParticlesRef.current.filter(p => {
        p.life -= deltaTime;
        if (p.life <= 0) return false;
        
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        
        const alpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        return true;
      });
      
      particlesRef.current = particlesRef.current.filter(p => {
        p.life -= deltaTime;
        if (p.life <= 0) return false;
        
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.vx *= 0.99;
        p.vy *= 0.99;
        
        const alpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        
        return true;
      });
      
      if (summonFlashRef.current.active) {
        const flash = summonFlashRef.current;
        flash.alpha = Math.sin(timestamp / 50) * 0.3 + 0.3;
        
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.arc(CIRCLE_RADIUS, CIRCLE_RADIUS, CIRCLE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = flash.color;
        ctx.globalAlpha = flash.alpha;
        ctx.fill();
        ctx.restore();
      }
      
      animationIdRef.current = requestAnimationFrame(render);
    };
    
    animationIdRef.current = requestAnimationFrame(render);
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className={`rounded-full cursor-crosshair ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ touchAction: 'none' }}
      />
      <button
        onClick={resetCanvas}
        disabled={disabled}
        className="absolute bottom-4 right-4 px-4 py-2 bg-purple-900/80 text-yellow-400 rounded-lg border border-yellow-500/50 hover:bg-purple-800/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        重置
      </button>
    </div>
  );
}
