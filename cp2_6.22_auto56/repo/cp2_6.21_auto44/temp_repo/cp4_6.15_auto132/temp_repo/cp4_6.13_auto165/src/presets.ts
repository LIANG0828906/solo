import * as THREE from 'three';
import { ParticleSystem } from './particleSystem';

const COUNT = 6000;
const C_LOW = new THREE.Color('#1a5276');
const C_HIGH = new THREE.Color('#e67e22');
const C_NEBULA = new THREE.Color('#9b59b6');
const C_TORNADO = new THREE.Color('#1abc9c');
const C_RIPPLE = new THREE.Color('#3498db');
const tmp = new THREE.Color();

interface PresetData { positions: Float32Array; colors: Float32Array; sizes: Float32Array }

function genNebula(): PresetData {
  const p = new Float32Array(COUNT * 3);
  const c = new Float32Array(COUNT * 3);
  const s = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    const r = 3 + Math.random() * 5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    p[i3] = r * Math.sin(phi) * Math.cos(theta);
    p[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
    p[i3 + 2] = r * Math.cos(phi);
    const t = Math.random();
    tmp.lerpColors(C_LOW, C_NEBULA, t);
    c[i3] = tmp.r; c[i3 + 1] = tmp.g; c[i3 + 2] = tmp.b;
    s[i] = 0.5 + Math.random() * 2.5;
  }
  return { positions: p, colors: c, sizes: s };
}

function genTornado(): PresetData {
  const p = new Float32Array(COUNT * 3);
  const c = new Float32Array(COUNT * 3);
  const s = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    const t = i / COUNT;
    const y = (t - 0.5) * 12;
    const r = 0.5 + t * 3.5;
    const angle = t * Math.PI * 8 + Math.random() * 0.5;
    p[i3] = Math.cos(angle) * r;
    p[i3 + 1] = y;
    p[i3 + 2] = Math.sin(angle) * r;
    tmp.lerpColors(C_TORNADO, C_HIGH, t);
    c[i3] = tmp.r; c[i3 + 1] = tmp.g; c[i3 + 2] = tmp.b;
    s[i] = 0.5 + (1 - t) * 2;
  }
  return { positions: p, colors: c, sizes: s };
}

function genRipple(): PresetData {
  const p = new Float32Array(COUNT * 3);
  const c = new Float32Array(COUNT * 3);
  const s = new Float32Array(COUNT);
  const rings = 20;
  const perRing = Math.floor(COUNT / rings);
  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    const ring = Math.floor(i / perRing);
    const ri = i % perRing;
    const r = 1 + ring * 0.5;
    const angle = (ri / perRing) * Math.PI * 2;
    const wave = Math.sin(ring * 1.5) * 0.8;
    p[i3] = Math.cos(angle) * r;
    p[i3 + 1] = wave;
    p[i3 + 2] = Math.sin(angle) * r;
    const t = ring / rings;
    tmp.lerpColors(C_RIPPLE, C_HIGH, t);
    c[i3] = tmp.r; c[i3 + 1] = tmp.g; c[i3 + 2] = tmp.b;
    s[i] = 1 + Math.abs(wave) * 2;
  }
  return { positions: p, colors: c, sizes: s };
}

const presets: Record<string, () => PresetData> = {
  nebula: genNebula,
  tornado: genTornado,
  ripple: genRipple,
};

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function startPresetTransition(ps: ParticleSystem, name: string, duration = 3000) {
  const target = presets[name]();
  if (!target) return;
  ps.transitioning = true;
  const startP = ps.getPositions();
  const startC = ps.getColors();
  const startS = ps.getSizes();
  const startTime = performance.now();

  function step(now: number) {
    const elapsed = now - startTime;
    let t = Math.min(elapsed / duration, 1);
    t = easeInOutCubic(t);
    const p = new Float32Array(COUNT * 3);
    const c = new Float32Array(COUNT * 3);
    const s = new Float32Array(COUNT);
    for (let i = 0; i < COUNT * 3; i++) {
      p[i] = startP[i] + (target.positions[i] - startP[i]) * t;
      c[i] = startC[i] + (target.colors[i] - startC[i]) * t;
    }
    for (let i = 0; i < COUNT; i++) {
      s[i] = startS[i] + (target.sizes[i] - startS[i]) * t;
    }
    ps.applyPositions(p);
    ps.applyColors(c);
    ps.applySizes(s);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      ps.transitioning = false;
    }
  }
  requestAnimationFrame(step);
}
