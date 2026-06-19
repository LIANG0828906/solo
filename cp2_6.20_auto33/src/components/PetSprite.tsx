import React, { useEffect, useRef, useState, useMemo } from 'react';
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

  const t = frame * 0.06;

  const blinkScale = animState === 'sleeping' ? 0 :
    Math.max(0.15, Math.sin(t * 0.8) > 0.98 ? 0.1 : 1);

  const tailRot = animState === 'walking' || animState === 'playing' ? Math.sin(t * 4) * 25 :
    animState === 'idle' ? Math.sin(t * 1.2) * 8 :
    animState === 'eating' ? Math.sin(t * 3) * 12 : 0;

  const bodyBob = animState === 'walking' ? Math.sin(t * 6) * 3 :
    animState === 'idle' ? Math.sin(t * 1.5) * 1.5 :
    animState === 'playing' ? Math.abs(Math.sin(t * 5)) * -6 : 0;

  const legSwing = animState === 'walking' ? Math.sin(t * 6) * 20 :
    animState === 'playing' ? Math.sin(t * 8) * 15 : 0;

  const headTilt = animState === 'eating' || animState === 'drinking' ? 12 :
    animState === 'playing' ? Math.sin(t * 4) * 8 : 0;

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

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size * 0.9,
      transform: facing === 'left' ? 'scaleX(-1)' : 'none',
      transition: 'transform 0.4s ease',
      opacity: animState === 'sleeping' ? 0.9 : 1,
    }}>
      <Stage width={size} height={size * 0.9} scaleX={size / VIEW_W * levelScale} scaleY={size / VIEW_H * levelScale}>
        <Layer offsetX={(VIEW_W * levelScale - VIEW_W) / 2} offsetY={(VIEW_H * levelScale - VIEW_H) / 2}>
          <Group x={isCat ? 25 : 170} y={90}>
            <Group rotation={tailRot} offsetX={isCat ? 0 : 0} offsetY={0}>
              <Shape sceneFunc={(ctx, shape) => { ctx.save(); ctx.translate(isCat ? -25 : -170, -90); renderTail(ctx); ctx.restore(); ctx.fillStrokeShape(shape); }} />
            </Group>
          </Group>

          <Group y={bodyBob}>
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

      {animState === 'sleeping' && (
        <div style={{
          position: 'absolute', top: 15, right: 10,
          fontSize: 22, fontWeight: 700,
          color: '#7E57C2', fontFamily: 'var(--font-cartoon)',
          animation: 'float-up 2.5s ease-out infinite',
          transform: facing === 'left' ? 'scaleX(-1)' : 'none',
        }}>Z</div>
      )}
    </div>
  );
};

export default PetSprite;
