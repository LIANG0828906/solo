import type {
  WorkerRequest,
  WorkerResponse,
  BrushCommand,
  ParticleSnapshot,
} from '@/types';
import { hexToRgb, lerpArray, clamp } from '@/utils/helpers';

const ctx: Worker = self as unknown as Worker;

function applyCarve(
  positions: Float32Array,
  cmd: BrushCommand
): Float32Array {
  const newPositions = new Float32Array(positions);
  const { centerX, centerY, centerZ, radius, strength } = cmd;
  const radiusSq = radius * radius;

  for (let i = 0; i < positions.length; i += 3) {
    const dx = positions[i] - centerX;
    const dy = positions[i + 1] - centerY;
    const dz = positions[i + 2] - centerZ;
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq < radiusSq) {
      const dist = Math.sqrt(distSq);
      const factor = 1 - dist / radius;
      const falloff = factor * factor;
      const offset = strength * falloff;

      const len = Math.sqrt(distSq) || 1;
      newPositions[i] -= (dx / len) * offset;
      newPositions[i + 1] -= (dy / len) * offset;
      newPositions[i + 2] -= (dz / len) * offset;
    }
  }
  return newPositions;
}

function applyStack(
  positions: Float32Array,
  cmd: BrushCommand
): Float32Array {
  const newPositions = new Float32Array(positions);
  const { centerX, centerY, centerZ, radius, strength } = cmd;
  const radiusSq = radius * radius;

  for (let i = 0; i < positions.length; i += 3) {
    const dx = positions[i] - centerX;
    const dy = positions[i + 1] - centerY;
    const dz = positions[i + 2] - centerZ;
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq < radiusSq) {
      const dist = Math.sqrt(distSq);
      const factor = 1 - dist / radius;
      const falloff = factor * factor;
      const offset = strength * falloff;

      const len = Math.sqrt(distSq) || 1;
      newPositions[i] += (dx / len) * offset;
      newPositions[i + 1] += (dy / len) * offset;
      newPositions[i + 2] += (dz / len) * offset;
    }
  }
  return newPositions;
}

function applySmooth(
  positions: Float32Array,
  cmd: BrushCommand
): Float32Array {
  const newPositions = new Float32Array(positions);
  const { centerX, centerY, centerZ, radius, strength } = cmd;
  const radiusSq = radius * radius;
  const particleCount = positions.length / 3;

  let avgX = 0,
    avgY = 0,
    avgZ = 0;
  let count = 0;

  for (let i = 0; i < positions.length; i += 3) {
    const dx = positions[i] - centerX;
    const dy = positions[i + 1] - centerY;
    const dz = positions[i + 2] - centerZ;
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq < radiusSq) {
      avgX += positions[i];
      avgY += positions[i + 1];
      avgZ += positions[i + 2];
      count++;
    }
  }

  if (count > 0) {
    avgX /= count;
    avgY /= count;
    avgZ /= count;

    for (let i = 0; i < positions.length; i += 3) {
      const dx = positions[i] - centerX;
      const dy = positions[i + 1] - centerY;
      const dz = positions[i + 2] - centerZ;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < radiusSq) {
        const dist = Math.sqrt(distSq);
        const factor = 1 - dist / radius;
        const falloff = factor * factor;
        const t = clamp(strength * falloff, 0, 1);

        newPositions[i] = positions[i] + (avgX - positions[i]) * t;
        newPositions[i + 1] = positions[i + 1] + (avgY - positions[i + 1]) * t;
        newPositions[i + 2] = positions[i + 2] + (avgZ - positions[i + 2]) * t;
      }
    }
  }

  void particleCount;
  return newPositions;
}

function applySpray(
  colors: Float32Array,
  positions: Float32Array,
  cmd: BrushCommand
): Float32Array {
  const newColors = new Float32Array(colors);
  const { centerX, centerY, centerZ, radius, strength, colorPalette } = cmd;
  const radiusSq = radius * radius;
  const palette = colorPalette || ['#e0d6c8'];

  for (let i = 0; i < positions.length; i += 3) {
    const dx = positions[i] - centerX;
    const dy = positions[i + 1] - centerY;
    const dz = positions[i + 2] - centerZ;
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq < radiusSq && Math.random() < strength) {
      const hex = palette[Math.floor(Math.random() * palette.length)];
      const rgb = hexToRgb(hex);
      newColors[i] = rgb.r;
      newColors[i + 1] = rgb.g;
      newColors[i + 2] = rgb.b;
    }
  }
  return newColors;
}

ctx.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'applyBrush': {
      const { positions, colors, command } = payload;
      if (!positions || !colors || !command) return;

      let newPositions = positions;
      let newColors = colors;

      switch (command.type) {
        case 'carve':
          newPositions = applyCarve(positions, command);
          break;
        case 'stack':
          newPositions = applyStack(positions, command);
          break;
        case 'smooth':
          newPositions = applySmooth(positions, command);
          break;
        case 'spray':
          newColors = applySpray(colors, positions, command);
          break;
      }

      const response: WorkerResponse = {
        type: 'positionsUpdated',
        payload: { positions: newPositions, colors: newColors },
      };
      ctx.postMessage(response, [newPositions.buffer, newColors.buffer]);
      break;
    }

    case 'resetParticles': {
      const { initialPositions, initialColors } = payload;
      if (!initialPositions || !initialColors) return;

      const response: WorkerResponse = {
        type: 'resetComplete',
        payload: {
          positions: new Float32Array(initialPositions),
          colors: new Float32Array(initialColors),
        },
      };
      ctx.postMessage(response);
      break;
    }

    case 'lerpSnapshots': {
      const { snapshotA, snapshotB, t } = payload;
      if (!snapshotA || !snapshotB || t === undefined) return;

      const positions = new Float32Array(snapshotA.positions.length);
      const colors = new Float32Array(snapshotA.colors.length);
      lerpArray(snapshotA.positions, snapshotB.positions, t, positions);
      lerpArray(snapshotA.colors, snapshotB.colors, t, colors);

      const response: WorkerResponse = {
        type: 'lerpComplete',
        payload: { positions, colors },
      };
      ctx.postMessage(response, [positions.buffer, colors.buffer]);
      break;
    }

    case 'getSnapshot': {
      const { positions, colors } = payload;
      if (!positions || !colors) return;

      const snapshot: ParticleSnapshot = {
        timestamp: Date.now(),
        positions: new Float32Array(positions),
        colors: new Float32Array(colors),
      };

      const response: WorkerResponse = {
        type: 'snapshotTaken',
        payload: { snapshot },
      };
      ctx.postMessage(response);
      break;
    }
  }
};

export default {} as typeof Worker;
