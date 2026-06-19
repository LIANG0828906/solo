import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Stage, Layer, Group, Shape, Text } from 'react-konva';
import type { Pet, PetAnimationState, ColorScheme, PetSpecies } from '../types';
import { levelBadgeColor } from '../utils/helpers';

interface Props {
  pet: Pet;
  animState?: PetAnimationState;
  facing?: 'left' | 'right';
  size?: number;
  onAnimationDone?: () => void;
}

interface Palette {
  body: string;
  ears: string;
  eyes: string;
  nose: string;
  belly: string;
}

interface Particle {
  id: number;
  type: 'heart' | 'star' | 'drop';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  rotation: number;
  vr: number;
  size: number;
}

function getPalette(species: PetSpecies, breed: string, scheme: ColorScheme): Palette {
  const catMap: Record<string, Palette[]> = {
    domestic: [
      { body: '#F5A623', ears: '#D4891C', eyes: '#7C4D1A', nose: '#E07A5F', belly: '#FFE0B2' },
      { body: '#3A3A3A', ears: '#1F1F1F', eyes: '#FFD700', nose: '#8B4513', belly: '#6B6B6B' },
      { body: '#FAFAFA', ears: '#E0E0E0', eyes: '#5C97BF', nose: '#F48FB1', belly: '#FFFFFF' },
    ],
    scottish: [
      { body: '#C9B8A0', ears: '#A89070', eyes: '#607D8B', nose: '#8D6E63', belly: '#E8DFD3' },
      { body: '#F4E4C1', ears: '#E0C88A', eyes: '#546E7A', nose: '#A1887F', belly: '#FBF5E6' },
      { body: '#D3B8B8', ears: '#B89898', eyes: '#8E44AD', nose: '#AB8282', belly: '#EADADA' },
    ],
    ragdoll: [
      { body: '#FAEBD7', ears: '#8B7355', eyes: '#4A90D9', nose: '#D7B895', belly: '#FFF5E6' },
      { body: '#E8E8E8', ears: '#9370DB', eyes: '#2980B9', nose: '#B39DDB', belly: '#F5F5F5' },
      { body: '#FFEFD5', ears: '#D2691E', eyes: '#3498DB', nose: '#E8A87C', belly: '#FFF8EE' },
    ],
  };
  const dogMap: Record<string, Palette[]> = {
    shiba: [
      { body: '#E8A35A', ears: '#C97F3A', eyes: '#5C3317', nose: '#3E2723', belly: '#FFECCC' },
      { body: '#333333', ears: '#111111', eyes: '#8B4513', nose: '#000000', belly: '#555555' },
      { body: '#F5F5DC', ears: '#D2B48C', eyes: '#8B4513', nose: '#3E2723', belly: '#FFFFFF' },
    ],
    golden: [
      { body: '#DAA520', ears: '#B8860B', eyes: '#8B4513', nose: '#3E2723', belly: '#F5DEB3' },
      { body: '#F4D03F', ears: '#D4AC0D', eyes: '#A0522D', nose: '#5D4037', belly: '#FFF9C4' },
      { body: '#CD853F', ears: '#A0522D', eyes: '#654321', nose: '#3E2723', belly: '#F5DEB3' },
    ],
    corgi: [
      { body: '#FFFAF0', ears: '#CD5C5C', eyes: '#4A2C2A', nose: '#3E2723', belly: '#FFFFFF' },
      { body: '#FFE4B5', ears: '#8B4513', eyes: '#5C3317', nose: '#3E2723', belly: '#FFFFFF' },
      { body: '#E8E8E8', ears: '#555555', eyes: '#2F4F4F', nose: '#1A1A1A', belly: '#FFFFFF' },
    ],
  };
  const map = species === 'cat' ? catMap : dogMap;
  const arr = map[breed] ?? Object.values(map)[0];
  return arr[scheme] ?? arr[0];
}

const VIEW_W = 200;
const VIEW_H = 180;
const MOUTH_X = 100;
const MOUTH_Y = 85;

export const PetSprite: React.FC<Props> = ({ pet, animState = 'idle', facing = 'right', size = 180, onAnimationDone }) => {
  const palette = useMemo(() => getPalette(pet.species, pet.breed, pet.colorScheme), [pet]);
  const levelScale = 1 + (pet.level - 1) * 0.04;
  const isCat = pet.species === 'cat';
  const isScottish = pet.breed === 'scottish';
  const isCorgi = pet.breed === 'corgi';
  const badgeColor = levelBadgeColor(pet.level);
  const showBow = pet.level >= 4 && isCat;
  const showCollar = pet.level >= 4 && !isCat;

  const [frame, setFrame] = useState(0);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);
  const particleAnimRef = useRef<number>(0);
  const particleLastTimeRef = useRef<number>(0);
  const eatingSpawnTimerRef = useRef<number>(0);
  const drinkingSpawnTimerRef = useRef<number>(0);
  const prevAnimStateRef = useRef<PetAnimationState>(animState);

  useEffect(() => {
    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = time - lastTimeRef.current;
      if (dt >= 16) {
        setFrame(f => f + 1);
        lastTimeRef.current = time;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const spawnParticle = useCallback((type: Particle['type']): Particle => {
    particleIdRef.current += 1;
    const id = particleIdRef.current;
    if (type === 'drop') {
      return {
        id,
        type,
        x: MOUTH_X + (Math.random() - 0.5) * 8,
        y: MOUTH_Y + 5,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 1.5 + Math.random() * 2,
        life: 800,
        maxLife: 800,
        rotation: 0,
        vr: 0,
        size: 14 + Math.random() * 6,
      };
    }
    return {
      id,
      type,
      x: MOUTH_X + (Math.random() - 0.5) * 10,
      y: MOUTH_Y,
      vx: (Math.random() - 0.5) * 3,
      vy: -(2 + Math.random() * 3),
      life: 500,
      maxLife: 500,
      rotation: (Math.random() - 0.5) * 30,
      vr: (Math.random() - 0.5) * 4,
      size: 14 + Math.random() * 8,
    };
  }, []);

  useEffect(() => {
    if (prevAnimStateRef.current !== animState) {
      eatingSpawnTimerRef.current = 0;
      drinkingSpawnTimerRef.current = 0;
      prevAnimStateRef.current = animState;
    }

    const updateParticles = (time: number) => {
      if (!particleLastTimeRef.current) particleLastTimeRef.current = time;
      const dt = time - particleLastTimeRef.current;
      particleLastTimeRef.current = time;

      setParticles(prevParticles => {
        let newParticles = prevParticles
          .map(p => {
            const gravity = p.type === 'drop' ? 0.15 : 0.12;
            const newVy = p.vy + gravity;
            const newLife = p.life - dt;
            return {
              ...p,
              x: p.x + p.vx * (dt / 16),
              y: p.y + newVy * (dt / 16),
              vy: newVy,
              life: newLife,
              rotation: p.rotation + p.vr * (dt / 16),
            };
          })
          .filter(p => p.life > 0);

        if (animState === 'eating') {
          eatingSpawnTimerRef.current += dt;
          const spawnInterval = 80;
          while (eatingSpawnTimerRef.current >= spawnInterval) {
            eatingSpawnTimerRef.current -= spawnInterval;
            const count = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < count; i++) {
              const type: 'heart' | 'star' = Math.random() > 0.5 ? 'heart' : 'star';
              newParticles = [...newParticles, spawnParticle(type)];
            }
          }
        }

        if (animState === 'drinking') {
          drinkingSpawnTimerRef.current += dt;
          const spawnInterval = 200;
          while (drinkingSpawnTimerRef.current >= spawnInterval) {
            drinkingSpawnTimerRef.current -= spawnInterval;
            const count = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < count; i++) {
              newParticles = [...newParticles, spawnParticle('drop')];
            }
          }
        }

        return newParticles;
      });

      particleAnimRef.current = requestAnimationFrame(updateParticles);
    };

    particleAnimRef.current = requestAnimationFrame(updateParticles);
    return () => cancelAnimationFrame(particleAnimRef.current);
  }, [animState, spawnParticle]);

  const t = frame * 0.06;

  const blinkScale = animState === 'sleeping' ? 0 :
    Math.max(0.15, Math.sin(t * 0.8) > 0.98 ? 0.1 : 1);

  const tailRot = animState === 'walking' || animState === 'playing' ? Math.sin(t * 4) * 25 :
    animState === 'idle' ? Math.sin(t * 1.2) * 8 :
    animState === 'eating' ? Math.sin(t * 3) * 12 :
    animState === 'sleeping' ? Math.sin(t * 0.4) * 2 : 0;

  const baseBodyBob = animState === 'walking' ? Math.sin(t * 6) * 3 :
    animState === 'idle' ? Math.sin(t * 1.5) * 1.5 :
    animState === 'playing' ? Math.abs(Math.sin(t * 5)) * -6 :
    animState === 'sleeping' ? Math.sin(t * 0.8) * 5 : 0;

  const bodySwayX = animState === 'sleeping' ? Math.sin(t * 0.5) * 1.5 : 0;

  const bodyBob = baseBodyBob;

  const legSwing = animState === 'walking' ? Math.sin(t * 6) * 20 :
    animState === 'playing' ? Math.sin(t * 8) * 15 : 0;

  const headTilt = animState === 'eating' || animState === 'drinking' ? 12 :
    animState === 'playing' ? Math.sin(t * 4) * 8 :
    animState === 'sleeping' ? Math.sin(t * 0.5) * 1.5 : 0;

  const mouthOpen = animState === 'eating' || animState === 'drinking' ? 1 : 0;

  const drawStar = (ctx: any, cx: number, cy: number, spikes: number, outer: number, inner: number) => {
    let rot = Math.PI / 2 * 3;
    let x = cx, y = cy;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outer);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outer;
      y = cy + Math.sin(rot) * outer;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * inner;
      y = cy + Math.sin(rot) * inner;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outer);
    ctx.closePath();
  };

  const renderBody = (ctx: any) => {
    ctx.fillStyle = palette.body;
    ctx.strokeStyle = palette.ears;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(100, 115, 58, 42, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.belly;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(100, 140, 55, 18, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  const renderLeg = (ctx: any, w: number, h: number) => {
    ctx.fillStyle = palette.body;
    ctx.strokeStyle = palette.ears;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-w / 2, 0, w, h, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.ears;
    ctx.beginPath();
    ctx.ellipse(0, h + 2, w / 2 + 2, 4, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  };

  const renderTail = (ctx: any) => {
    ctx.fillStyle = palette.body;
    ctx.strokeStyle = palette.ears;
    ctx.lineWidth = 1.5;
    if (isCat) {
      ctx.beginPath();
      ctx.moveTo(25, 95);
      ctx.quadraticCurveTo(5, 70, 10, 45);
      ctx.quadraticCurveTo(15, 30, 30, 35);
      ctx.quadraticCurveTo(28, 50, 20, 65);
      ctx.quadraticCurveTo(18, 80, 30, 95);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (isCorgi) {
      ctx.beginPath();
      ctx.moveTo(170, 85);
      ctx.lineTo(188, 78);
      ctx.lineTo(180, 95);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(170, 90);
      ctx.quadraticCurveTo(192, 60, 188, 40);
      ctx.quadraticCurveTo(185, 30, 178, 35);
      ctx.quadraticCurveTo(180, 55, 172, 80);
      ctx.quadraticCurveTo(171, 88, 170, 90);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  };

  const renderHead = (ctx: any) => {
    ctx.fillStyle = palette.body;
    ctx.strokeStyle = palette.ears;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(100, 68, 46, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.ears;
    ctx.lineWidth = 1.5;
    if (isCat) {
      if (isScottish) {
        ctx.beginPath();
        ctx.moveTo(68, 40);
        ctx.quadraticCurveTo(72, 18, 90, 30);
        ctx.quadraticCurveTo(82, 34, 75, 44);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(132, 40);
        ctx.quadraticCurveTo(128, 18, 110, 30);
        ctx.quadraticCurveTo(118, 34, 125, 44);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(60, 45);
        ctx.lineTo(68, 12);
        ctx.lineTo(86, 38);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(140, 45);
        ctx.lineTo(132, 12);
        ctx.lineTo(114, 38);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(58, 52);
      ctx.quadraticCurveTo(52, 18, 78, 32);
      ctx.quadraticCurveTo(70, 42, 64, 55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(142, 52);
      ctx.quadraticCurveTo(148, 18, 122, 32);
      ctx.quadraticCurveTo(130, 42, 136, 55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = palette.belly;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.ellipse(100, 82, 26, 20, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  const renderEyes = (ctx: any) => {
    if (animState === 'sleeping') {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(80, 62);
      ctx.quadraticCurveTo(85, 66, 90, 62);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(110, 62);
      ctx.quadraticCurveTo(115, 66, 120, 62);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = 'white';
    ctx.strokeStyle = palette.ears;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(85, 62, 6.5, 8 * blinkScale, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(115, 62, 6.5, 8 * blinkScale, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (blinkScale > 0.5) {
      ctx.fillStyle = palette.eyes;
      ctx.beginPath();
      ctx.arc(85, 63, 4, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(115, 63, 4, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(86.5, 61, 1.5, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(116.5, 61, 1.5, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }
  };

  const renderNoseMouth = (ctx: any) => {
    ctx.save();
    ctx.translate(100, 76);
    if (isCat) {
      ctx.fillStyle = palette.nose;
      ctx.strokeStyle = palette.nose;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(-4, 2);
      ctx.lineTo(0, 5);
      ctx.lineTo(4, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = palette.nose;
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 2, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(100, 82);
    if (mouthOpen) {
      ctx.fillStyle = '#8B2252';
      ctx.strokeStyle = '#4A1430';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 3, 7, 5, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (isCat) {
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.quadraticCurveTo(-6, 11, -11, 8);
        ctx.moveTo(0, 4);
        ctx.quadraticCurveTo(6, 11, 11, 8);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(-5, 4);
        ctx.quadraticCurveTo(0, 10, 5, 4);
        ctx.quadraticCurveTo(2, 8, 0, 8);
        ctx.quadraticCurveTo(-2, 8, -5, 4);
        ctx.stroke();
      }
    }
    ctx.restore();

    if (isCat) {
      ctx.strokeStyle = palette.ears;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(52, 76);
      ctx.lineTo(32, 72);
      ctx.moveTo(52, 82);
      ctx.lineTo(32, 84);
      ctx.moveTo(148, 76);
      ctx.lineTo(168, 72);
      ctx.moveTo(148, 82);
      ctx.lineTo(168, 84);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#FFB6C1';
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.ellipse(100, 88, 10, 4, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  const renderBow = (ctx: any) => {
    ctx.save();
    ctx.translate(75, 16);
    ctx.fillStyle = '#FF6B9D';
    ctx.strokeStyle = '#E91E63';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(-16, 0);
    ctx.lineTo(-16, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(16, 0);
    ctx.lineTo(16, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#E91E63';
    ctx.beginPath();
    ctx.arc(0, 8, 4, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const renderCollar = (ctx: any) => {
    ctx.strokeStyle = '#D32F2F';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(70, 95);
    ctx.quadraticCurveTo(100, 105, 130, 95);
    ctx.stroke();
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(100, 102, 5, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  const renderBadge = (ctx: any) => {
    ctx.save();
    ctx.translate(19, -5);
    drawStar(ctx, 19, 18, 5, 16, 7);
    const grad = ctx.createLinearGradient(0, 0, 0, 36);
    grad.addColorStop(0, badgeColor.shine);
    grad.addColorStop(0.55, badgeColor.fill);
    grad.addColorStop(1, badgeColor.stroke);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = badgeColor.stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  };

  const legW = isCorgi ? 18 : 14;
  const legH = isCorgi ? 22 : 28;

  const scaleFactor = size / VIEW_W * levelScale;
  const offsetX = (VIEW_W * levelScale - VIEW_W) / 2;
  const offsetY = (VIEW_H * levelScale - VIEW_H) / 2;

  const renderParticleEmoji = (p: Particle) => {
    const alpha = Math.max(0, p.life / p.maxLife);
    const leftPct = ((p.x - offsetX) / VIEW_W) * 100;
    const topPct = ((p.y - offsetY) / VIEW_H) * 100;
    const emoji = p.type === 'heart' ? '❤️' : p.type === 'star' ? '✨' : '💧';
    return (
      <div
        key={p.id}
        style={{
          position: 'absolute',
          left: `${leftPct}%`,
          top: `${topPct}%`,
          transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
          fontSize: p.size,
          opacity: alpha,
          pointerEvents: 'none',
          filter: p.type === 'drop' ? 'drop-shadow(0 1px 2px rgba(66,165,245,0.5))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
          zIndex: 50,
        }}
      >
        {emoji}
      </div>
    );
  };

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size * 0.9,
      transform: facing === 'left' ? 'scaleX(-1)' : 'none',
      transition: 'transform 0.4s ease',
      opacity: animState === 'sleeping' ? 0.9 : 1,
    }}>
      <Stage width={size} height={size * 0.9} scaleX={scaleFactor} scaleY={scaleFactor}>
        <Layer offsetX={offsetX} offsetY={offsetY}>
          <Group x={isCat ? 25 : 170} y={90}>
            <Group rotation={tailRot} offsetX={isCat ? 0 : 0} offsetY={0}>
              <Shape sceneFunc={(ctx, shape) => { ctx.save(); ctx.translate(isCat ? -25 : -170, -90); renderTail(ctx); ctx.restore(); ctx.fillStrokeShape(shape); }} />
            </Group>
          </Group>

          <Group y={bodyBob} x={bodySwayX}>
            <Shape sceneFunc={(ctx, shape) => { renderBody(ctx); ctx.fillStrokeShape(shape); }} />

            <Group x={60} y={140}>
              <Group rotation={-legSwing}>
                <Shape sceneFunc={(ctx, shape) => { renderLeg(ctx, legW, legH); ctx.fillStrokeShape(shape); }} />
              </Group>
            </Group>

            <Group x={133} y={140}>
              <Group rotation={legSwing}>
                <Shape sceneFunc={(ctx, shape) => { renderLeg(ctx, legW, legH); ctx.fillStrokeShape(shape); }} />
              </Group>
            </Group>

            <Group x={72} y={138}>
              <Group rotation={legSwing}>
                <Shape sceneFunc={(ctx, shape) => { renderLeg(ctx, legW, legH); ctx.fillStrokeShape(shape); }} />
              </Group>
            </Group>

            <Group x={120} y={138}>
              <Group rotation={-legSwing}>
                <Shape sceneFunc={(ctx, shape) => { renderLeg(ctx, legW, legH); ctx.fillStrokeShape(shape); }} />
              </Group>
            </Group>

            <Group x={100} y={68}>
              <Group rotation={headTilt}>
                <Shape sceneFunc={(ctx, shape) => { ctx.save(); ctx.translate(-100, -68); renderHead(ctx); ctx.restore(); ctx.fillStrokeShape(shape); }} />

                {showBow && <Shape sceneFunc={(ctx, shape) => { ctx.save(); ctx.translate(-100, -68); renderBow(ctx); ctx.restore(); ctx.fillStrokeShape(shape); }} />}
                {showCollar && <Shape sceneFunc={(ctx, shape) => { ctx.save(); ctx.translate(-100, -68); renderCollar(ctx); ctx.restore(); ctx.fillStrokeShape(shape); }} />}

                <Shape sceneFunc={(ctx, shape) => { ctx.save(); ctx.translate(-100, -68); renderEyes(ctx); ctx.restore(); ctx.fillStrokeShape(shape); }} />
                <Shape sceneFunc={(ctx, shape) => { ctx.save(); ctx.translate(-100, -68); renderNoseMouth(ctx); ctx.restore(); ctx.fillStrokeShape(shape); }} />
              </Group>
            </Group>

            <Shape sceneFunc={(ctx, shape) => { renderBadge(ctx); ctx.fillStrokeShape(shape); }} />
            <Text x={14} y={10} text={String(pet.level)} fontSize={11} fontFamily="Arial" fontWeight="bold" fill={pet.level <= 3 ? '#FFF' : '#5D4037'} align="center" width={18} />
          </Group>
        </Layer>
      </Stage>

      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'visible',
      }}>
        {particles.map(renderParticleEmoji)}
      </div>

      {animState === 'sleeping' && (
        <>
          <div style={{
            position: 'absolute', top: 8, right: 18,
            fontSize: 16, fontWeight: 700,
            color: '#7E57C2', fontFamily: 'var(--font-cartoon)',
            animation: 'zzz-float-1 2.5s ease-out infinite',
            transform: facing === 'left' ? 'scaleX(-1)' : 'none',
            textShadow: '0 1px 3px rgba(126, 87, 194, 0.4)',
            pointerEvents: 'none',
          }}>Z</div>
          <div style={{
            position: 'absolute', top: 20, right: 6,
            fontSize: 20, fontWeight: 700,
            color: '#9575CD', fontFamily: 'var(--font-cartoon)',
            animation: 'zzz-float-2 2.5s ease-out 0.8s infinite',
            transform: facing === 'left' ? 'scaleX(-1)' : 'none',
            textShadow: '0 1px 3px rgba(149, 117, 205, 0.4)',
            pointerEvents: 'none',
          }}>z</div>
          <div style={{
            position: 'absolute', top: 14, right: 30,
            fontSize: 14, fontWeight: 700,
            color: '#B39DDB', fontFamily: 'var(--font-cartoon)',
            animation: 'zzz-float-3 2.5s ease-out 1.6s infinite',
            transform: facing === 'left' ? 'scaleX(-1)' : 'none',
            textShadow: '0 1px 3px rgba(179, 157, 219, 0.4)',
            pointerEvents: 'none',
          }}>z</div>
        </>
      )}
    </div>
  );
};

export default PetSprite;
