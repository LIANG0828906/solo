import * as THREE from 'three';
import { MaterialType, ReverbParticle, SonarConfig } from '../types';

export const SOUND_SPEED_WATER = 1500;

const MATERIAL_REFLECTIVITY: Record<MaterialType, number> = {
  metal: 0.8,
  fish: 0.5,
  rock:  0.3,
};

export function calculateAttenuation(distance: number, frequencyKhz: number): number {
  if (distance <= 0) return 1;
  const sphericalSpread = 1 / (distance * distance);
  const freqMhz = frequencyKhz / 1000;
  const absorptionCoeff = 0.036 * Math.pow(freqMhz, 1.5);
  const absorption = Math.exp(-absorptionCoeff * distance / 1000);
  return Math.min(1, sphericalSpread * absorption * 100);
}

export function calculateDopplerShift(
  sourceFreq: number,
  targetVelocity: THREE.Vector3,
  waveDirection: THREE.Vector3,
  soundSpeed: number = SOUND_SPEED_WATER
): number {
  const dir = waveDirection.clone().normalize();
  const vr = targetVelocity.dot(dir);
  const shiftedFreq = sourceFreq * (soundSpeed + vr) / (soundSpeed - vr);
  return shiftedFreq - sourceFreq;
}

export function calculateEchoStrength(
  distance: number,
  material: MaterialType,
  frequencyKhz: number,
  incidentAngleRad: number = 0
): number {
  const reflectivity = MATERIAL_REFLECTIVITY[material] ?? 0.5;
  const attenuation = calculateAttenuation(distance, frequencyKhz);
  const angularFactor = Math.max(0.1, Math.cos(incidentAngleRad));
  const twoWayAttenuation = attenuation * attenuation;
  return reflectivity * angularFactor * twoWayAttenuation;
}

export function strengthToColor(strength: number): THREE.Color {
  const s = Math.max(0, Math.min(1, strength));
  const r = s;
  const g = 0.2 * (1 - s);
  const b = 1 - s * 0.7;
  return new THREE.Color(r, g, b);
}

export function generateReverbParticles(
  count: number,
  bounds: THREE.Box3,
  seed: number = 42
): ReverbParticle[] {
  const particles: ReverbParticle[] = [];
  const size = bounds.getSize(new THREE.Vector3());
  let s = seed;
  function rand(): number {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  }
  for (let i = 0; i < count; i++) {
    const pos = new THREE.Vector3(
      bounds.min.x + rand() * size.x,
      bounds.min.y + rand() * size.y,
      bounds.min.z + rand() * size.z
    );
    particles.push({
      position: pos,
      baseIntensity: 0.15 + rand() * 0.5,
      phase: rand() * Math.PI * 2,
      speed: 0.2 + rand() * 0.5,
    });
  }
  return particles;
}

export function calculateSNR(
  signalStrength: number,
  reverbDecay: number,
  noiseThreshold: number
): number {
  const noiseLevel = (1 - reverbDecay) * 0.5 + noiseThreshold * 0.3;
  if (noiseLevel <= 0) return 60;
  const snr = 10 * Math.log10(Math.max(0.001, signalStrength / noiseLevel));
  return Math.max(-20, Math.min(60, snr));
}

export function degToRad(deg: number): number {
  return deg * Math.PI / 180;
}

export function radToDeg(rad: number): number {
  return rad * 180 / Math.PI;
}

export function getSonarDirection(config: SonarConfig): THREE.Vector3 {
  const h = degToRad(config.horizontalAngle);
  const v = degToRad(config.verticalAngle);
  return new THREE.Vector3(
    Math.sin(h) * Math.cos(v),
    Math.sin(v),
    Math.cos(h) * Math.cos(v)
  ).normalize();
}

export function pointInSonarCone(
  point: THREE.Vector3,
  sonarOrigin: THREE.Vector3,
  config: SonarConfig
): { inside: boolean; distance: number; angle: number } {
  const toPoint = point.clone().sub(sonarOrigin);
  const distance = toPoint.length();
  if (distance > config.maxRange || distance < 0.5) {
    return { inside: false, distance, angle: Infinity };
  }
  const dir = getSonarDirection(config);
  const normalized = toPoint.normalize();
  const dot = Math.max(-1, Math.min(1, dir.dot(normalized)));
  const angle = Math.acos(dot);
  const inside = angle <= degToRad(config.beamWidth / 2);
  return { inside, distance, angle };
}
