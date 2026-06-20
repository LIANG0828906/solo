import { v4 as uuidv4 } from 'uuid';
import type { EffectParams } from './types';

const createColorStop = (color: string, position: number) => ({
  id: uuidv4(),
  color,
  position,
});

const createCurvePoint = (x: number, y: number) => ({
  id: uuidv4(),
  x,
  y,
});

export const presets: Record<string, EffectParams> = {
  '斩击刀光': {
    particleCount: 150,
    lifetimeMin: 0.6,
    lifetimeMax: 1.0,
    velocityXMin: 200,
    velocityXMax: 300,
    velocityYMin: -50,
    velocityYMax: 50,
    emissionAngleStart: 30,
    emissionAngleEnd: 60,
    colorGradient: [
      createColorStop('#FFFFFF', 0),
      createColorStop('#87CEEB', 0.5),
      createColorStop('#1a1a2e', 1),
    ],
    scaleCurve: [
      createCurvePoint(0, 1),
      createCurvePoint(0.5, 0.8),
      createCurvePoint(1, 0),
    ],
    scaleCurvePreset: 'easeOut',
    rotationSpeed: 0,
    randomOffset: 10,
    originOffsetX: 0,
    originOffsetY: 0,
  },

  '火焰爆炸': {
    particleCount: 300,
    lifetimeMin: 1.0,
    lifetimeMax: 2.0,
    velocityXMin: -200,
    velocityXMax: 200,
    velocityYMin: -200,
    velocityYMax: 200,
    emissionAngleStart: 0,
    emissionAngleEnd: 360,
    colorGradient: [
      createColorStop('#FFFF00', 0),
      createColorStop('#FFA500', 0.3),
      createColorStop('#FF0000', 0.7),
      createColorStop('#000000', 1),
    ],
    scaleCurve: [
      createCurvePoint(0, 0),
      createCurvePoint(0.25, 1),
      createCurvePoint(0.5, 0.5),
      createCurvePoint(0.75, 1),
      createCurvePoint(1, 0),
    ],
    scaleCurvePreset: 'sine',
    rotationSpeed: 30,
    randomOffset: 20,
    originOffsetX: 0,
    originOffsetY: 0,
  },

  '神圣法阵': {
    particleCount: 200,
    lifetimeMin: 2.5,
    lifetimeMax: 3.5,
    velocityXMin: -30,
    velocityXMax: 30,
    velocityYMin: -30,
    velocityYMax: 30,
    emissionAngleStart: 0,
    emissionAngleEnd: 360,
    colorGradient: [
      createColorStop('#FFD700', 0),
      createColorStop('#FFFFFF', 0.5),
      createColorStop('#FFD700', 1),
    ],
    scaleCurve: [
      createCurvePoint(0, 0.5),
      createCurvePoint(0.5, 1),
      createCurvePoint(1, 0.5),
    ],
    scaleCurvePreset: 'linear',
    rotationSpeed: 180,
    randomOffset: 5,
    originOffsetX: 0,
    originOffsetY: 0,
  },
};

export type PresetKey = keyof typeof presets;
