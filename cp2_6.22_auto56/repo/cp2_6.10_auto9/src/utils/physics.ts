import { WIND_LEVELS, WindLevel } from '@/types';

const degToRad = (deg: number): number => (deg * Math.PI) / 180;
const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

export interface PhysicsParams {
  windLevel: number;
  windDirection: number;
  sailAngle: number;
  rudderAngle: number;
  ballastWeight: number;
  elapsedTime: number;
}

export interface PhysicsResult {
  roll: number;
  pitch: number;
  speed: number;
  floodRate: number;
  waveHeight: number;
  waveFrequency: number;
  windForce: number;
}

export const calculatePhysics = (
  params: PhysicsParams,
  currentRoll: number,
  currentPitch: number
): PhysicsResult => {
  const { windLevel, windDirection, sailAngle, ballastWeight, elapsedTime } = params;
  
  const windConfig = WIND_LEVELS[windLevel as WindLevel] || WIND_LEVELS[0];
  const baseWaveHeight = windConfig.waveHeight;
  const baseWaveFrequency = windConfig.waveFrequency;

  const waveHeight = baseWaveHeight * (0.8 + Math.sin(elapsedTime * 0.5) * 0.2);
  const waveFrequency = baseWaveFrequency;

  const windForce = windLevel * 2.5;

  const sailEfficiency = Math.cos(degToRad(sailAngle - windDirection));
  const ballastStabilization = (ballastWeight - 500) * 0.01;

  const baseRoll = Math.sin(elapsedTime * waveFrequency) * waveHeight * 8;
  const windRoll = windForce * sailEfficiency * 2;
  const targetRoll = baseRoll + windRoll - ballastStabilization;
  const roll = lerp(currentRoll, clamp(targetRoll, -30, 30), 0.05);

  const basePitch = Math.sin(elapsedTime * waveFrequency * 1.3) * waveHeight * 5;
  const speedPitch = params.sailAngle * 0.02;
  const ballastTrim = (ballastWeight - 500) * 0.005;
  const targetPitch = basePitch + speedPitch - ballastTrim;
  const pitch = lerp(currentPitch, clamp(targetPitch, -20, 20), 0.05);

  const baseSpeed = 0.2;
  const windFactor = 1 + windLevel * 0.3;
  const sailFactor = Math.cos(degToRad(sailAngle)) * 0.8 + 0.2;
  const speed = clamp(baseSpeed * windFactor * sailFactor, 0.2, 2.0);

  const rollPenalty = Math.max(0, Math.abs(roll) - 15) * 2;
  const pitchPenalty = Math.max(0, Math.abs(pitch) - 10) * 1.5;
  const floodRate = clamp(rollPenalty + pitchPenalty, 0, 100);

  return {
    roll,
    pitch,
    speed,
    floodRate,
    waveHeight,
    waveFrequency,
    windForce,
  };
};

export const formatTimestamp = (date: Date): string => {
  const pad = (n: number): string => n.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
};

export const formatLogTimestamp = (date: Date): string => {
  const pad = (n: number): string => n.toString().padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const getStabilityColor = (score: number): string => {
  if (score < 30) return '#cc0000';
  if (score < 60) return '#ffaa00';
  return '#00cc00';
};

export const getRollZone = (roll: number): 'safe' | 'warning' | 'danger' => {
  const absRoll = Math.abs(roll);
  if (absRoll <= 15) return 'safe';
  if (absRoll <= 25) return 'warning';
  return 'danger';
};
