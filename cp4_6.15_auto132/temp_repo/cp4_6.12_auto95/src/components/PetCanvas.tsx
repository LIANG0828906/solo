import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { IPetData, AnimationState } from '../types/pet';
import {
  getCurrentFrameIndex,
  calculateDrawParameters,
  drawPixelPet,
  drawBattleParticle,
  interpolateColor,
} from '../utils/petAnimation';

interface PetCanvasProps {
  pet: IPetData;
  isWarning: boolean;
  isBattle: boolean;
  opponent?: {
    name: string;
    type: 'dragon' | 'unicorn' | 'robot';
    hunger: number;
    mood: number;
    energy: number;
    intelligence: number;
  } | null;
  battleResult?: 'win' | 'lose' | 'draw' | null;
  showLevelUp?: boolean;
  showingBattleResult?: boolean;
}

export interface PetCanvasRef {
  triggerActionAnimation: (action: AnimationState) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 320;
const SKY_COLOR_TOP = '#87ceeb';
const SKY_COLOR_BOTTOM = '#f0e68c';

export const PetCanvas = forwardRef<PetCanvasRef, PetCanvasProps>((
  { pet, isWarning, isBattle, opponent, battleResult, showLevelUp, showingBattleResult },
  ref
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationStartTimeRef = useRef<number>(Date.now());
  const lastAnimationStateRef = useRef<AnimationState>(pet.currentAnimation);
  const rafIdRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const levelUpParticlesRef = useRef<Particle[]>([]);
  const timeOfDayRef = useRef<number>(0);
  const battleAnimationPhaseRef = useRef<number>(0);
  const battleAttackTimerRef = useRef<number>(0);
  const flashRef = useRef<number>(0);

  useImperativeHandle(ref, () => ({
    triggerActionAnimation: (action: AnimationState) => {
      animationStartTimeRef.current = Date.now();
      lastAnimationStateRef.current = action;
    },
  }));

  useEffect(() => {
    if (pet.currentAnimation !== lastAnimationStateRef.current) {
      animationStartTimeRef.current = Date.now();
      lastAnimationStateRef.current = pet.currentAnimation;
    }
  }, [pet.currentAnimation]);

  const createLevelUpParticles = useCallback(() => {
    const particles: Particle[] = [];
    const colors = ['#ffd700', '#ffed4e', '#fff8a5', '#ffb700', '#ffa500'];
    
    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 * i) / 60 + Math.random() * 0.3;
      const speed = 1.5 + Math.random() * 3;
      particles.push({
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 90,
        maxLife: 90,
      });
    }
    levelUpParticlesRef.current = particles;
  }, []);

  const createBattleParticles = useCallback((fromLeft: boolean) => {
    const particles: Particle[] = [];
    const colors = ['#ef4444', '#f97316', '#fbbf24', '#ffffff'];
    const startX = fromLeft ? CANVAS_WIDTH * 0.3 : CANVAS_WIDTH * 0.7;
    const endX = fromLeft ? CANVAS_WIDTH * 0.7 : CANVAS_WIDTH * 0.3;
    
    for (let i = 0; i < 15; i++) {
      particles.push({
        x: startX,
        y: CANVAS_HEIGHT * 0.5 + (Math.random() - 0.5) * 40,
        vx: (endX - startX) * 0.03 + (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 3,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 40,
        maxLife: 40,
      });
    }
    particlesRef.current = [...particlesRef.current, ...particles];
  }, []);

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    timeOfDayRef.current = (Math.sin(time * 0.0001) + 1) / 2;
    const t = timeOfDayRef.current;
    const topColor = interpolateColor(SKY_COLOR_TOP, '#ff7e5f', t * 0.4);
    const bottomColor = interpolateColor(SKY_COLOR_BOTTOM, '#feb47b', t * 0.3);

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const sunY = 40 + t * 30;
    ctx.fillStyle = interpolateColor('#ffffff', '#fff4a3', t);
    ctx.beginPath();
    ctx.arc(60, sunY, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = interpolateColor('#fff8e1', '#ffe066', t);
    ctx.beginPath();
    ctx.arc(60, sunY, 18, 0, Math.PI * 2);
    ctx.fill();

    const drawCloud = (x: number, y: number, scale: number) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.7 - t * 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, 18 * scale, 0, Math.PI * 2);
      ctx.arc(x + 20 * scale, y - 8 * scale, 22 * scale, 0, Math.PI * 2);
      ctx.arc(x + 40 * scale, y, 18 * scale, 0, Math.PI * 2);
      ctx.arc(x + 20 * scale, y + 6 * scale, 16 * scale, 0, Math.PI * 2);
      ctx.fill();
    };

    const cloudOffset1 = (time * 0.01) % (CANVAS_WIDTH + 100);
    const cloudOffset2 = (time * 0.006 + 150) % (CANVAS_WIDTH + 100);
    drawCloud(cloudOffset1 - 50, 50, 0.9);
    drawCloud(cloudOffset2 - 50, 85, 0.7);

    ctx.fillStyle = interpolateColor('#86efac', '#4ade80', 0.3);
    ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);

    ctx.fillStyle = interpolateColor('#4ade80', '#22c55e', 0.5);
    ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 3);

    for (let i = 0; i < 15; i++) {
      const grassX = (i * 23 + 10) % CANVAS_WIDTH;
      const grassHeight = 4 + (i % 3) * 2;
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(grassX, CANVAS_HEIGHT - 48, 2, -grassHeight);
      ctx.fillRect(grassX + 3, CANVAS_HEIGHT - 48, 2, -grassHeight - 1);
    }

    ctx.fillStyle = interpolateColor('#ec4899', '#f472b6', 0.5);
    ctx.beginPath();
    ctx.arc(50, CANVAS_HEIGHT - 46, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = interpolateColor('#8b5cf6', '#a78bfa', 0.5);
    ctx.beginPath();
    ctx.arc(180, CANVAS_HEIGHT - 44, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = interpolateColor('#f59e0b', '#fbbf24', 0.5);
    ctx.beginPath();
    ctx.arc(270, CANVAS_HEIGHT - 47, 4, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const drawBattleMode = useCallback((
    ctx: CanvasRenderingContext2D,
    frameIndex: number,
    time: number
  ) => {
    if (!opponent) return;

    battleAnimationPhaseRef.current = Math.floor(time / 800) % 4;
    battleAttackTimerRef.current += 1;

    if (battleAttackTimerRef.current % 60 === 0 && showingBattleResult === false) {
      createBattleParticles(battleAttackTimerRef.current % 120 === 60);
      flashRef.current = 10;
    }

    const petX = 20;
    const petY = CANVAS_HEIGHT - 170;
    const oppX = CANVAS_WIDTH - 148;
    const oppY = CANVAS_HEIGHT - 170;

    const petBob = Math.sin(time * 0.005) * 3;
    const oppBob = Math.sin(time * 0.005 + Math.PI) * 3;

    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.fillRect(10, 40, 150, CANVAS_HEIGHT - 90);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 40, 150, CANVAS_HEIGHT - 90);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.fillRect(CANVAS_WIDTH - 160, 40, 150, CANVAS_HEIGHT - 90);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(CANVAS_WIDTH - 160, 40, 150, CANVAS_HEIGHT - 90);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`LV.${pet.level} ${pet.name}`, 85, 30);
    ctx.fillText(`LV.${opponent.level || 1} ${opponent.name}`, CANVAS_WIDTH - 85, 30);

    const paramsPet = calculateDrawParameters(CANVAS_WIDTH, CANVAS_HEIGHT, frameIndex, pet.currentAnimation);
    drawPixelPet(
      ctx,
      petX + paramsPet.offsetX,
      petY + petBob + paramsPet.offsetY,
      128,
      128,
      pet.type,
      frameIndex,
      'idle',
      false
    );

    const paramsOpp = calculateDrawParameters(CANVAS_WIDTH, CANVAS_HEIGHT, frameIndex, 'idle', true);
    drawPixelPet(
      ctx,
      oppX - paramsOpp.offsetX,
      oppY + oppBob - paramsOpp.offsetY,
      128,
      128,
      opponent.type,
      frameIndex,
      'idle',
      true
    );

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const vsPulse = 1 + Math.sin(time * 0.01) * 0.1;
    ctx.save();
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.scale(vsPulse, vsPulse);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.strokeText('VS', 0, 0);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('VS', 0, 0);
    ctx.restore();
    ctx.textBaseline = 'alphabetic';

    if (showingBattleResult && battleResult) {
      flashRef.current = 5;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      let resultText = '';
      let resultColor = '#ffffff';
      switch (battleResult) {
        case 'win':
          resultText = '胜利！';
          resultColor = '#22c55e';
          break;
        case 'lose':
          resultText = '失败...';
          resultColor = '#ef4444';
          break;
        case 'draw':
          resultText = '平局';
          resultColor = '#f59e0b';
          break;
      }

      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const scale = 1 + Math.sin(time * 0.02) * 0.15;
      ctx.save();
      ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.scale(scale, scale);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 5;
      ctx.strokeText(resultText, 0, 0);
      ctx.fillStyle = resultColor;
      ctx.fillText(resultText, 0, 0);
      ctx.restore();
      ctx.textBaseline = 'alphabetic';
    }
  }, [opponent, pet, battleResult, showingBattleResult, createBattleParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const elapsed = currentTime - lastTime;
      if (elapsed < 33) {
        rafIdRef.current = requestAnimationFrame(render);
        return;
      }
      lastTime = currentTime;

      const frameIndex = getCurrentFrameIndex(
        pet.currentAnimation,
        animationStartTimeRef.current,
        currentTime
      );

      ctx.save();

      if (isWarning) {
        ctx.filter = 'hue-rotate(-30deg) saturate(0.5)';
      }

      drawBackground(ctx, currentTime);

      if (isBattle && opponent) {
        drawBattleMode(ctx, frameIndex, currentTime);
      } else {
        const params = calculateDrawParameters(
          CANVAS_WIDTH,
          CANVAS_HEIGHT,
          frameIndex,
          pet.currentAnimation
        );
        drawPixelPet(
          ctx,
          params.drawX + params.offsetX,
          params.drawY + params.offsetY,
          params.drawWidth,
          params.drawHeight,
          pet.type,
          frameIndex,
          pet.currentAnimation
        );

        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${pet.name}  Lv.${pet.level}`, CANVAS_WIDTH / 2, 28);
      }

      ctx.restore();

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life -= 1;
        p.alpha = p.life / p.maxLife;
        if (p.life > 0) {
          drawBattleParticle(ctx, p.x, p.y, p.size, p.color, p.alpha);
          return true;
        }
        return false;
      });

      if (showLevelUp && levelUpParticlesRef.current.length === 0) {
        createLevelUpParticles();
        flashRef.current = 15;
      }

      levelUpParticlesRef.current = levelUpParticlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;
        p.life -= 1;
        p.alpha = p.life / p.maxLife;
        if (p.life > 0) {
          ctx.save();
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          drawBattleParticle(ctx, p.x, p.y, p.size, p.color, p.alpha);
          ctx.restore();
          return true;
        }
        return false;
      });

      if (flashRef.current > 0) {
        ctx.fillStyle = `rgba(255, 215, 0, ${flashRef.current / 30})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        flashRef.current -= 1;
      }

      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [pet, isWarning, isBattle, opponent, battleResult, showingBattleResult, showLevelUp, drawBackground, drawBattleMode, createLevelUpParticles]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        width: '100%',
        maxWidth: '320px',
        height: 'auto',
        aspectRatio: '1 / 1',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        imageRendering: 'pixelated',
      }}
    />
  );
});

PetCanvas.displayName = 'PetCanvas';
