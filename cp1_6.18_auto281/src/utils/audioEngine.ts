import { ReflectionPoint, AudioSourceResult } from '../types/dataTypes';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function playStepSound(): AudioSourceResult {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const oscillator = ctx.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(1200, now);

  const vibrato = ctx.createOscillator();
  vibrato.type = 'sine';
  vibrato.frequency.setValueAtTime(50, now);

  const vibratoGain = ctx.createGain();
  vibratoGain.gain.setValueAtTime(30, now);

  vibrato.connect(vibratoGain);
  vibratoGain.connect(oscillator.frequency);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.3, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  vibrato.start(now);
  oscillator.start(now);
  oscillator.stop(now + 0.3);
  vibrato.stop(now + 0.3);

  return { source: oscillator, gainNode };
}

export function emitSoundWave(
  originX: number,
  originZ: number,
  obstacles: Array<{ x: number; z: number; radius: number }>,
  maxRange: number = 30,
  attenuationCoeff: number = 0.7
): ReflectionPoint[] {
  const reflections: ReflectionPoint[] = [];

  for (const obs of obstacles) {
    const dx = obs.x - originX;
    const dz = obs.z - originZ;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > maxRange || dist < 0.1) continue;

    const surfaceDist = dist - obs.radius;
    if (surfaceDist < 0) continue;

    const totalTravel = surfaceDist * 2;
    const attenuation = Math.pow(attenuationCoeff, totalTravel / 10);
    const intensity = Math.max(0, attenuation);

    if (intensity < 0.05) continue;

    const normX = dx / dist;
    const normZ = dz / dist;

    const reflectX = obs.x + normX * obs.radius;
    const reflectZ = obs.z + normZ * obs.radius;

    reflections.push({
      x: reflectX,
      z: reflectZ,
      intensity,
    });
  }

  reflections.sort((a, b) => b.intensity - a.intensity);
  return reflections.slice(0, 5);
}
