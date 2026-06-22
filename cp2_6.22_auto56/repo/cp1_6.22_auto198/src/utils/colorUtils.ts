import * as THREE from 'three';

export const magnitudeToColor = (mag: number): THREE.Color => {
  const clampedMag = Math.max(4.5, Math.min(9.5, mag));
  const t = (clampedMag - 4.5) / 5;
  const lowColor = new THREE.Color('#00FFAA');
  const highColor = new THREE.Color('#FF0055');
  return lowColor.clone().lerp(highColor, t);
};

export const magnitudeToHeight = (mag: number): number => {
  return mag * 0.05;
};

export const magnitudeToBlinkRate = (mag: number): number => {
  const clampedMag = Math.max(4.5, Math.min(9.5, mag));
  return 1 + (clampedMag - 4.5) * 2;
};

export const magnitudeToColorCss = (mag: number): string => {
  const color = magnitudeToColor(mag);
  return `#${color.getHexString()}`;
};

export const formatTime = (timestamp: number): string => {
  const d = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatDate = (timestamp: number): string => {
  const d = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

export const formatFullDate = (timestamp: number): string => {
  const d = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
