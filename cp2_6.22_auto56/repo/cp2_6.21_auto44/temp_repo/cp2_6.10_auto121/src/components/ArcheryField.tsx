import React, { useEffect, useRef, useReducer, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archer, GameState, GameAction, Arrow, Target, Particle, WindData, ScoreRecord, Announcement } from '../types';
import { useWind } from '../hooks/useWind';
import ScoreBoard from './ScoreBoard';

interface ArcheryFieldProps {
  onScoreUpdate?: (archers: Archer[]) => void;
  onGameStateChange?: (state: GameState) => void;
}

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 500;
const GRAVITY = 0.25;
const MAX_CHARGE_TIME = 2000;
const BOW_VIBRATION_DURATION = 200;

const createInitialTargets = (): Target[] => [
  { x: CANVAS_WIDTH - 150, y: CANVAS_HEIGHT - 120, distance: 150, type: '虎皮', bullseyeDiameter: 30 },
  { x: CANVAS_WIDTH - 220, y: CANVAS_HEIGHT - 140, distance: 220, type: '熊皮', bullseyeDiameter: 26 },
  { x: CANVAS_WIDTH - 300, y: CANVAS_HEIGHT - 160, distance: 300, type: '豹皮', bullseyeDiameter: 22 },
];

const createInitialArchers = (): Archer[] => [
  { id: 1, name: '姬钊', title: '天子', scores: [], totalScore: 0, upperShots: 0, currentArrow: 0, position: { x: 120, y: CANVAS_HEIGHT - 60 } },
  { id: 2, name: '姜尚', title: '齐侯', scores: [], totalScore: 0, upperShots: 0, currentArrow: 0, position: { x: 160, y: CANVAS_HEIGHT - 60 } },
  { id: 3, name: '姬旦', title: '鲁侯', scores: [], totalScore: 0, upperShots: 0, currentArrow: 0, position: { x: 200, y: CANVAS_HEIGHT - 60 } },
];

const initialState: GameState = {
  archers: createInitialArchers(),
  currentArcherIndex: 0,
  currentRound: 1,
  arrowsPerRound: 4,
  targets: createInitialTargets(),
  currentTargetIndex: 0,
  phase: 'waiting',
  chargeLevel: 0,
  isCharging: false,
  announcements: [],
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_CHARGE':
      return { ...state, isCharging: true, phase: 'charging', chargeLevel: 0 };
    case 'UPDATE_CHARGE':
      return { ...state, chargeLevel: action.payload };
    case 'RELEASE_ARROW':
      return { ...state, isCharging: false, phase: 'shooting' };
    case 'ARROW_HIT': {
      const archers = state.archers.map((archer) => {
        if (archer.id !== action.payload.archerId) return archer;
        const newScore: ScoreRecord = {
          round: state.currentRound,
          arrowIndex: archer.currentArrow,
          score: action.payload.score,
          type: action.payload.type,
        };
        const newScores = [...archer.scores, newScore];
        return {
          ...archer,
          scores: newScores,
          totalScore: archer.totalScore + action.payload.score,
          upperShots: archer.upperShots + (action.payload.type === '上射' ? 1 : 0),
          currentArrow: archer.currentArrow + 1,
        };
      });
      return { ...state, archers, phase: 'scoring' };
    }
    case 'ARROW_MISS': {
      const archers = state.archers.map((archer) => {
        if (archer.id !== action.payload.archerId) return archer;
        const newScore: ScoreRecord = {
          round: state.currentRound,
          arrowIndex: archer.currentArrow,
          score: 0,
          type: '脱靶',
        };
        return {
          ...archer,
          scores: [...archer.scores, newScore],
          currentArrow: archer.currentArrow + 1,
        };
      });
      return { ...state, archers, phase: 'scoring' };
    }
    case 'NEXT_ARCHER': {
      const nextIndex = state.currentArcherIndex + 1;
      if (nextIndex >= state.archers.length) {
        const allDone = state.archers.every(a => a.currentArrow >= state.arrowsPerRound);
        if (allDone) {
          return {
            ...state,
            phase: 'roundEnd',
            currentArcherIndex: 0,
            currentTargetIndex: (state.currentTargetIndex + 1) % state.targets.length,
          };
        }
        return { ...state, currentArcherIndex: 0, phase: 'waiting' };
      }
      const nextArcher = state.archers[nextIndex];
      if (nextArcher.currentArrow >= state.arrowsPerRound) {
        return gameReducer(state, { type: 'NEXT_ARCHER' });
      }
      return { ...state, currentArcherIndex: nextIndex, phase: 'waiting' };
    }
    case 'NEXT_ROUND': {
      const archers = state.archers.map(a => ({ ...a, currentArrow: 0 }));
      return {
        ...state,
        archers,
        currentRound: state.currentRound + 1,
        currentArcherIndex: 0,
        phase: 'waiting',
      };
    }
    case 'ADD_ANNOUNCEMENT': {
      const newAnnouncement: Announcement = {
        id: Date.now(),
        text: action.payload,
        timestamp: Date.now(),
      };
      return { ...state, announcements: [...state.announcements, newAnnouncement] };
    }
    case 'REMOVE_ANNOUNCEMENT':
      return {
        ...state,
        announcements: state.announcements.filter(a => a.id !== action.payload),
      };
    case 'SET_PHASE':
      return { ...state, phase: action.payload };
    case 'RESET_GAME':
      return {
        ...initialState,
        archers: createInitialArchers(),
        targets: createInitialTargets(),
      };
    default:
      return state;
  }
}

const ArcheryField: React.FC<ArcheryFieldProps> = ({ onScoreUpdate, onGameStateChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const windRef = useWind();
  const [aimAngle, setAimAngle] = useState(-30);
  const [bowVibrating, setBowVibrating] = useState(false);
  const [vibrationOffset, setVibrationOffset] = useState({ x: 0, y: 0 });

  const arrowsRef = useRef<Arrow[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const chargeStartRef = useRef<number>(0);
  const rafIdRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsRef = useRef<number>(60);
  const bannerTimeRef = useRef<number>(0);

  const currentArcher = state.archers[state.currentArcherIndex];
  const currentTarget = state.targets[state.currentTargetIndex];

  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(state.archers);
    }
  }, [state.archers, onScoreUpdate]);

  useEffect(() => {
    if (onGameStateChange) {
      onGameStateChange(state);
    }
  }, [state, onGameStateChange]);

  useEffect(() => {
    if (state.announcements.length > 0) {
      const latest = state.announcements[state.announcements.length - 1];
      const timer = setTimeout(() => {
        dispatch({ type: 'REMOVE_ANNOUNCEMENT', payload: latest.id });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.announcements]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (state.phase === 'waiting' || state.phase === 'charging' || state.phase === 'aiming') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
      const archerX = currentArcher.position.x;
      const archerY = currentArcher.position.y - 60;
      const angle = Math.atan2(mouseY - archerY, mouseX - archerX) * (180 / Math.PI);
      setAimAngle(Math.max(-80, Math.min(10, angle)));
    }
  }, [state.phase, currentArcher]);

  const handleMouseDown = useCallback(() => {
    if (state.phase === 'waiting') {
      dispatch({ type: 'START_CHARGE' });
      chargeStartRef.current = performance.now();
    }
  }, [state.phase]);

  const handleMouseUp = useCallback(() => {
    if (state.phase === 'charging') {
      const chargeTime = performance.now() - chargeStartRef.current;
      const chargePercent = Math.min(100, (chargeTime / MAX_CHARGE_TIME) * 100);
      releaseArrow(chargePercent, windRef.current);
    }
  }, [state.phase]);

  const releaseArrow = useCallback((chargePercent: number, wind: WindData) => {
    const archer = currentArcher;
    const angleRad = (aimAngle * Math.PI) / 180;
    const baseSpeed = 5 + (chargePercent / 100) * 10;
    const vx = Math.cos(angleRad) * baseSpeed;
    const vy = Math.sin(angleRad) * baseSpeed;
    const windRad = (wind.angle * Math.PI) / 180;
    const windX = Math.cos(windRad) * wind.speed * baseSpeed;
    const windY = Math.sin(windRad) * wind.speed * baseSpeed * 0.3;

    const newArrow: Arrow = {
      id: Date.now(),
      x: archer.position.x + 20,
      y: archer.position.y - 60,
      vx: vx + windX,
      vy: vy + windY,
      active: true,
      trail: [],
      targetIndex: state.currentTargetIndex,
    };

    arrowsRef.current = [...arrowsRef.current, newArrow];
    dispatch({ type: 'RELEASE_ARROW', payload: { angle: aimAngle, wind } });

    setBowVibrating(true);
    const vibrateStart = performance.now();
    const vibrateInterval = setInterval(() => {
      const elapsed = performance.now() - vibrateStart;
      if (elapsed >= BOW_VIBRATION_DURATION) {
        clearInterval(vibrateInterval);
        setBowVibrating(false);
        setVibrationOffset({ x: 0, y: 0 });
        return;
      }
      const progress = elapsed / BOW_VIBRATION_DURATION;
      const amplitude = Math.sin(progress * Math.PI) * 3;
      const freq = 30;
      setVibrationOffset({
        x: Math.sin(elapsed * freq * 0.01) * amplitude,
        y: Math.cos(elapsed * freq * 0.01) * amplitude * 0.5,
      });
    }, 16);
  }, [currentArcher, currentTarget, aimAngle, state.currentTargetIndex]);

  const createHitParticles = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
      const speed = 1 + Math.random() * 3;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 500,
        maxLife: 500,
        size: 2 + Math.random() * 4,
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  const checkCollision = useCallback((arrow: Arrow, target: Target): { hit: boolean; score: number; type: ScoreRecord['type'] } => {
    const dx = arrow.x - target.x;
    const dy = arrow.y - target.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = target.bullseyeDiameter / 2;
    if (distance <= radius * 0.5) return { hit: true, score: 10, type: '上射' };
    if (distance <= radius * 0.8) return { hit: true, score: 7, type: '参射' };
    if (distance <= radius) return { hit: true, score: 5, type: '干射' };
    return { hit: false, score: 0, type: '脱靶' };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;
      frameCountRef.current++;

      if (deltaTime > 0) {
        const instFps = 1000 / deltaTime;
        fpsRef.current = fpsRef.current * 0.9 + instFps * 0.1;
      }

      if (state.phase === 'charging' && state.isCharging) {
        const chargeTime = performance.now() - chargeStartRef.current;
        const chargePercent = Math.min(100, (chargeTime / MAX_CHARGE_TIME) * 100);
        dispatch({ type: 'UPDATE_CHARGE', payload: chargePercent });
      }

      arrowsRef.current = arrowsRef.current.map((arrow) => {
        if (!arrow.active) return arrow;
        arrow.trail.push({ x: arrow.x, y: arrow.y });
        if (arrow.trail.length > 20) arrow.trail.shift();
        arrow.vy += GRAVITY;
        arrow.x += arrow.vx;
        arrow.y += arrow.vy;
        const target = state.targets[arrow.targetIndex];
        const collision = checkCollision(arrow, target);
        if (collision.hit) {
          createHitParticles(arrow.x, arrow.y);
          const archerId = currentArcher.id;
          setTimeout(() => {
            dispatch({ type: 'ARROW_HIT', payload: { score: collision.score, type: collision.type, archerId } });
            dispatch({ type: 'ADD_ANNOUNCEMENT', payload: `${currentArcher.title}${currentArcher.name} ${collision.type}！+${collision.score}分` });
          }, 300);
          return { ...arrow, active: false };
        }
        if (arrow.y > CANVAS_HEIGHT + 50 || arrow.x > CANVAS_WIDTH + 50 || arrow.x < -50) {
          const archerId = currentArcher.id;
          setTimeout(() => {
            dispatch({ type: 'ARROW_MISS', payload: { archerId } });
            dispatch({ type: 'ADD_ANNOUNCEMENT', payload: `${currentArcher.title}${currentArcher.name} 脱靶！` });
          }, 300);
          return { ...arrow, active: false };
        }
        return arrow;
      });

      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.05,
          life: p.life - deltaTime,
        }))
        .filter((p) => p.life > 0);

      bannerTimeRef.current += deltaTime;

      drawScene(ctx);

      rafIdRef.current = requestAnimationFrame(gameLoop);
    };

    rafIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [state.phase, state.isCharging, state.targets, checkCollision, createHitParticles, currentArcher]);

  useEffect(() => {
    if (state.phase === 'scoring') {
      const timer = setTimeout(() => {
        dispatch({ type: 'NEXT_ARCHER' });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state.phase]);

  const drawScene = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBackground(ctx);
    drawGrass(ctx);
    drawBrickGround(ctx);
    drawTargets(ctx);
    drawBanner(ctx);
    drawArchers(ctx);
    drawBow(ctx);
    drawArrows(ctx);
    drawParticles(ctx);
    drawAimLine(ctx);
    drawFPS(ctx);
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#e8dcc8';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 80);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 60 + i * 5);
      ctx.lineTo(CANVAS_WIDTH, 40 + i * 5);
      ctx.lineTo(CANVAS_WIDTH, 45 + i * 5);
      ctx.lineTo(0, 65 + i * 5);
      ctx.closePath();
      ctx.fill();
    }
  };

  const drawGrass = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - 200, 0, CANVAS_HEIGHT - 40);
    gradient.addColorStop(0, '#556b2f');
    gradient.addColorStop(1, '#6b8e23');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, CANVAS_HEIGHT - 200, CANVAS_WIDTH, 160);
    ctx.strokeStyle = '#3d521e';
    ctx.lineWidth = 1;
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * CANVAS_WIDTH;
      const y = CANVAS_HEIGHT - 200 + Math.random() * 160;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 4, y - 8 - Math.random() * 6);
      ctx.stroke();
    }
  };

  const drawBrickGround = (ctx: CanvasRenderingContext2D) => {
    const brickY = CANVAS_HEIGHT - 40;
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(0, brickY, CANVAS_WIDTH, 40);
    ctx.strokeStyle = '#5c4a32';
    ctx.lineWidth = 1;
    const brickWidth = 40;
    const brickHeight = 20;
    for (let y = brickY; y < CANVAS_HEIGHT; y += brickHeight) {
      const offset = ((y - brickY) / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
      for (let x = -brickWidth; x < CANVAS_WIDTH + brickWidth; x += brickWidth) {
        ctx.strokeRect(x + offset, y, brickWidth, brickHeight);
      }
    }
  };

  const drawTargets = (ctx: CanvasRenderingContext2D) => {
    state.targets.forEach((target, index) => {
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(target.x - 45, target.y + 5, 90, 25);
      ctx.beginPath();
      ctx.arc(target.x, target.y, 55, 0, Math.PI * 2);
      ctx.save();
      if (target.type === '虎皮') {
        const grad = ctx.createRadialGradient(target.x, target.y, 0, target.x, target.y, 55);
        grad.addColorStop(0, '#daa520');
        grad.addColorStop(0.5, '#b8860b');
        grad.addColorStop(1, '#8b6914');
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#1a1a1a';
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 * i) / 12;
          const r = 20 + Math.random() * 25;
          const sx = target.x + Math.cos(angle) * r;
          const sy = target.y + Math.sin(angle) * r;
          ctx.beginPath();
          ctx.ellipse(sx, sy, 6 + Math.random() * 3, 4 + Math.random() * 2, angle, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (target.type === '熊皮') {
        const grad = ctx.createRadialGradient(target.x, target.y, 0, target.x, target.y, 55);
        grad.addColorStop(0, '#5c5c5c');
        grad.addColorStop(0.5, '#3d3d3d');
        grad.addColorStop(1, '#1f1f1f');
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#0a0a0a';
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 * i) / 8;
          const r = 25 + Math.random() * 20;
          const sx = target.x + Math.cos(angle) * r;
          const sy = target.y + Math.sin(angle) * r;
          ctx.beginPath();
          ctx.arc(sx, sy, 5 + Math.random() * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const grad = ctx.createRadialGradient(target.x, target.y, 0, target.x, target.y, 55);
        grad.addColorStop(0, '#d4a574');
        grad.addColorStop(0.5, '#a67c52');
        grad.addColorStop(1, '#6b4423');
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#1a1a1a';
        for (let i = 0; i < 15; i++) {
          const angle = (Math.PI * 2 * i) / 15 + Math.random() * 0.3;
          const r = 18 + Math.random() * 28;
          const sx = target.x + Math.cos(angle) * r;
          const sy = target.y + Math.sin(angle) * r;
          ctx.beginPath();
          ctx.ellipse(sx, sy, 4, 8, angle + Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      const radius = target.bullseyeDiameter / 2;
      ctx.beginPath();
      ctx.arc(target.x, target.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#8b0000';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(target.x, target.y, radius * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = '#a52a2a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(target.x, target.y, radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#cc3333';
      ctx.fill();
      ctx.strokeStyle = '#8b0000';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#f5e6c8';
      ctx.font = '14px "STKaiti", "KaiTi", serif';
      ctx.textAlign = 'center';
      ctx.fillText(target.type, target.x, target.y + 55);
      if (index === state.currentTargetIndex) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(target.x, target.y, 60, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  };

  const drawBanner = (ctx: CanvasRenderingContext2D) => {
    const poleX = 100;
    const poleY = 20;
    const poleHeight = 60;
    ctx.fillStyle = '#4a3728';
    ctx.fillRect(poleX - 3, poleY, 6, poleHeight);
    ctx.beginPath();
    ctx.arc(poleX, poleY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();
    const wind = windRef.current;
    const windAngleRad = (wind.angle * Math.PI) / 180;
    const baseSway = Math.sin(bannerTimeRef.current * 0.003) * 5;
    const windSway = Math.cos(windAngleRad) * wind.speed * 40;
    const ribbonColors = ['#ffffff', '#f0f0f0', '#e8e8e8'];
    for (let r = 0; r < 3; r++) {
      const ribbonY = poleY + 15 + r * 15;
      const segments = 8;
      const segLen = 12;
      ctx.beginPath();
      ctx.moveTo(poleX, ribbonY);
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const wave = Math.sin(bannerTimeRef.current * 0.005 + t * 3 + r) * 3 * (1 - t * 0.5);
        const x = poleX + segLen * i + baseSway * t + windSway * t;
        const y = ribbonY + wave + Math.sin(windAngleRad) * wind.speed * 15 * t;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = ribbonColors[r];
      ctx.lineWidth = 4 - r;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    ctx.fillStyle = '#4a3728';
    ctx.font = '14px "STKaiti", "KaiTi", serif';
    ctx.textAlign = 'left';
    ctx.fillText(`风向: ${wind.angle > 0 ? '→' : '←'} ${wind.level}`, 120, 50);
  };

  const drawArchers = (ctx: CanvasRenderingContext2D) => {
    state.archers.forEach((archer, index) => {
      const isCurrent = index === state.currentArcherIndex;
      const x = archer.position.x;
      const y = archer.position.y;
      ctx.fillStyle = isCurrent ? '#8b0000' : '#4a3728';
      ctx.fillRect(x - 8, y - 50, 16, 35);
      ctx.beginPath();
      ctx.arc(x, y - 58, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#d4a574';
      ctx.fill();
      ctx.strokeStyle = '#4a3728';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#2c1810';
      ctx.beginPath();
      ctx.arc(x, y - 65, 8, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = isCurrent ? '#cc3333' : '#6b5344';
      ctx.beginPath();
      ctx.moveTo(x - 15, y - 45);
      ctx.lineTo(x + 15, y - 45);
      ctx.lineTo(x + 12, y - 15);
      ctx.lineTo(x - 12, y - 15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = isCurrent ? '#8b0000' : '#4a3728';
      ctx.fillRect(x - 10, y - 18, 20, 20);
      if (isCurrent && (state.phase === 'waiting' || state.phase === 'charging' || state.phase === 'aiming')) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y - 30, 35, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#4a3728';
      ctx.font = '12px "STKaiti", "KaiTi", serif';
      ctx.textAlign = 'center';
      ctx.fillText(archer.title, x, y + 25);
      ctx.fillText(archer.name, x, y + 40);
    });
  };

  const drawBow = (ctx: CanvasRenderingContext2D) => {
    if (!currentArcher) return;
    const x = currentArcher.position.x + vibrationOffset.x;
    const y = currentArcher.position.y - 60 + vibrationOffset.y;
    const angleRad = (aimAngle * Math.PI) / 180;
    const bowLength = 50;
    const stringPull = state.isCharging ? (state.chargeLevel / 100) * 20 : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angleRad);
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-stringPull / 2, 0, bowLength / 2 + stringPull / 3, -Math.PI / 2.5, Math.PI / 2.5);
    ctx.stroke();
    ctx.strokeStyle = '#f5f5dc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const topY = (bowLength / 2 + stringPull / 3) * Math.sin(-Math.PI / 2.5);
    const topX = -stringPull / 2 + (bowLength / 2 + stringPull / 3) * Math.cos(-Math.PI / 2.5);
    const botY = (bowLength / 2 + stringPull / 3) * Math.sin(Math.PI / 2.5);
    const botX = -stringPull / 2 + (bowLength / 2 + stringPull / 3) * Math.cos(Math.PI / 2.5);
    ctx.moveTo(topX, topY);
    ctx.lineTo(-bowVibrating ? stringPull + vibrationOffset.x : stringPull, bowVibrating ? vibrationOffset.y : 0);
    ctx.lineTo(botX, botY);
    ctx.stroke();
    if (state.isCharging || state.phase === 'charging') {
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(-5, -2, 45, 4);
      ctx.fillStyle = '#4a3728';
      ctx.beginPath();
      ctx.moveTo(40, -4);
      ctx.lineTo(50, 0);
      ctx.lineTo(40, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  const drawAimLine = (ctx: CanvasRenderingContext2D) => {
    if (state.phase !== 'waiting' && state.phase !== 'charging' && state.phase !== 'aiming') return;
    const x = currentArcher.position.x + 20;
    const y = currentArcher.position.y - 60;
    const angleRad = (aimAngle * Math.PI) / 180;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    const simSpeed = 10 + (state.chargeLevel / 100) * 5;
    let simX = x;
    let simY = y;
    let simVx = Math.cos(angleRad) * simSpeed;
    let simVy = Math.sin(angleRad) * simSpeed;
    for (let i = 0; i < 60; i++) {
      simVy += GRAVITY * 0.5;
      simX += simVx * 0.5;
      simY += simVy * 0.5;
      ctx.lineTo(simX, simY);
      if (simY > CANVAS_HEIGHT || simX > CANVAS_WIDTH) break;
    }
    ctx.stroke();
    ctx.restore();
  };

  const drawArrows = (ctx: CanvasRenderingContext2D) => {
    arrowsRef.current.forEach((arrow) => {
      if (!arrow.active && arrow.trail.length === 0) return;
      if (arrow.trail.length > 1) {
        ctx.save();
        ctx.lineCap = 'round';
        for (let i = 1; i < arrow.trail.length; i++) {
          const alpha = i / arrow.trail.length;
          const t = i / arrow.trail.length;
          ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.6})`;
          ctx.lineWidth = Math.max(1, 3 * (1 - t * 0.7));
          ctx.beginPath();
          ctx.moveTo(arrow.trail[i - 1].x, arrow.trail[i - 1].y);
          ctx.lineTo(arrow.trail[i].x, arrow.trail[i].y);
          ctx.stroke();
        }
        ctx.restore();
      }
      if (arrow.active) {
        const angle = Math.atan2(arrow.vy, arrow.vx);
        ctx.save();
        ctx.translate(arrow.x, arrow.y);
        ctx.rotate(angle);
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-15, -1.5, 25, 3);
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.moveTo(10, -4);
        ctx.lineTo(18, 0);
        ctx.lineTo(10, 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#cc3333';
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(-20, -4);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-20, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    });
    arrowsRef.current = arrowsRef.current.filter(a => a.active || a.trail.length > 0);
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#cc3333';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };

  const drawFPS = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(74, 55, 40, 0.7)';
    ctx.fillRect(CANVAS_WIDTH - 80, 10, 70, 25);
    ctx.fillStyle = '#f5e6c8';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${fpsRef.current.toFixed(0)} FPS`, CANVAS_WIDTH - 15, 28);
  };

  const handleNextRound = () => {
    dispatch({ type: 'NEXT_ROUND' });
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_GAME' });
    arrowsRef.current = [];
    particlesRef.current = [];
  };

  const getWindDirectionText = () => {
    const wind = windRef.current;
    if (Math.abs(wind.angle) < 20) return '顺风';
    if (Math.abs(wind.angle) > 160) return '逆风';
    if (wind.angle > 0) return '右偏风';
    return '左偏风';
  };

  return (
    <>
      <div className="archery-field-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            border: '4px solid #4a3728',
            borderRadius: '6px',
            boxShadow: '0 4px 20px rgba(74, 55, 40, 0.4)',
            cursor: state.phase === 'waiting' ? 'crosshair' : 'default',
          }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        <AnimatePresence>
          {state.announcements.map((announcement) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1.2, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -30 }}
              transition={{ duration: 0.3 }}
              className="announcement-popup"
            >
              {announcement.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="game-ui">
        <ScoreBoard
          archers={state.archers}
          currentArcherIndex={state.currentArcherIndex}
          currentRound={state.currentRound}
          arrowsPerRound={state.arrowsPerRound}
        />

        <div className="control-panel jiandu-box">
          <div className="info-text">
            <strong>当前射手:</strong> {currentArcher?.title} {currentArcher?.name}
          </div>
          <div className="info-text">
            <strong>当前靶位:</strong> {currentTarget?.type}靶 ({currentTarget?.distance}步)
          </div>
          <div className="info-text">
            <strong>风向:</strong> {getWindDirectionText()} {windRef.current.level}
          </div>
          <div className="info-text">
            <strong>仰角:</strong> {aimAngle.toFixed(1)}°
          </div>

          <div>
            <div className="info-text" style={{ marginBottom: '4px' }}>
              <strong>蓄力:</strong> {state.chargeLevel.toFixed(0)}%
            </div>
            <div className="charge-bar-container">
              <div
                className="charge-bar"
                style={{ width: `${state.chargeLevel}%` }}
              />
            </div>
          </div>

          <div className="instruction">
            按住鼠标蓄力，松开放箭<br />
            移动鼠标调整瞄准角度
          </div>

          {state.phase === 'roundEnd' && (
            <button className="jiandu-btn" onClick={handleNextRound}>
              进入第 {state.currentRound + 1} 轮
            </button>
          )}

          <button className="jiandu-btn" onClick={handleReset}>
            重新开始
          </button>
        </div>
      </div>
    </>
  );
};

export default ArcheryField;
