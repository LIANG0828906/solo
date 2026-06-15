import type { Herb, AlchemyResult } from './danfang';
import { calculateAlchemyResult } from './danfang';

export interface FlameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  alpha: number;
}

export interface Bubble {
  x: number;
  y: number;
  radius: number;
  vy: number;
  alpha: number;
  wobble: number;
  wobbleSpeed: number;
  life: number;
}

export interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  lineWidth: number;
}

export interface ThrownHerb {
  herb: Herb;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  active: boolean;
}

export interface FurnaceState {
  temperature: number;
  targetTemperature: number;
  herbs: Herb[];
  flameParticles: FlameParticle[];
  bubbles: Bubble[];
  ripples: Ripple[];
  thrownHerbs: ThrownHerb[];
  liquidColor: string;
  tempHistory: { time: number; temp: number }[];
  startTime: number;
  flashIntensity: number;
  shakeIntensity: number;
  shakeDuration: number;
}

const SHICHEN = [
  '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
  '午时', '未时', '申时', '酉时', '戌时', '亥时'
];

export function createFurnaceState(): FurnaceState {
  return {
    temperature: 300,
    targetTemperature: 300,
    herbs: [],
    flameParticles: [],
    bubbles: [],
    ripples: [],
    thrownHerbs: [],
    liquidColor: '#006400',
    tempHistory: [],
    startTime: Date.now(),
    flashIntensity: 0,
    shakeIntensity: 0,
    shakeDuration: 0
  };
}

export function getAncientTime(): string {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  const shichenIndex = Math.floor(((hours + 1) % 24) / 2);
  const ke = Math.floor(minutes / 15);
  
  return `${SHICHEN[shichenIndex]}${ke}刻`;
}

export function setTargetTemperature(state: FurnaceState, temp: number): void {
  state.targetTemperature = Math.max(0, Math.min(1200, temp));
}

export function addHerb(state: FurnaceState, herb: Herb, startX: number, startY: number, 
  targetX: number, targetY: number): void {
  
  const herbCopy: Herb = { ...herb };
  state.herbs.push(herbCopy);
  
  const dx = targetX - startX;
  const dy = targetY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const speed = distance / 60;
  const angle = Math.atan2(dy, dx);
  
  const thrownHerb: ThrownHerb = {
    herb: herbCopy,
    x: startX,
    y: startY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 8,
    rotation: 0,
    rotationSpeed: (Math.random() - 0.5) * 0.3,
    active: true
  };
  
  state.thrownHerbs.push(thrownHerb);
  state.flashIntensity = 1;
}

export function triggerExplosion(state: FurnaceState): void {
  state.shakeIntensity = 15;
  state.shakeDuration = 30;
}

export function performAlchemy(state: FurnaceState): AlchemyResult {
  const avgTemp = state.tempHistory.length > 0
    ? state.tempHistory.reduce((sum, h) => sum + h.temp, 0) / state.tempHistory.length
    : state.temperature;
    
  const result = calculateAlchemyResult(state.herbs, state.temperature, avgTemp);
  
  if (!result.success && result.name === '炸炉') {
    triggerExplosion(state);
  }
  
  return result;
}

export function resetFurnace(state: FurnaceState): void {
  state.herbs = [];
  state.tempHistory = [];
  state.startTime = Date.now();
  state.bubbles = [];
  state.ripples = [];
  state.thrownHerbs = [];
}

function getLiquidColor(state: FurnaceState): string {
  const temp = state.temperature;
  const herbCount = state.herbs.length;
  
  let r = 0, g = 100, b = 0;
  
  if (temp < 300) {
    r = 0; g = 100; b = 0;
  } else if (temp < 500) {
    const t = (temp - 300) / 200;
    r = Math.floor(34 * t);
    g = Math.floor(139 * (1 - t) + 100 * t);
    b = Math.floor(34 * t);
  } else if (temp < 700) {
    const t = (temp - 500) / 200;
    r = Math.floor(34 + 221 * t);
    g = Math.floor(139 + 116 * t);
    b = Math.floor(34 - 34 * t);
  } else if (temp < 900) {
    const t = (temp - 700) / 200;
    r = Math.floor(255 - 127 * t);
    g = Math.floor(255 - 127 * t);
    b = Math.floor(0 + 128 * t);
  } else {
    const t = Math.min((temp - 900) / 300, 1);
    r = Math.floor(128 + 127 * t);
    g = Math.floor(128 - 128 * t);
    b = Math.floor(128 - 128 * t);
  }
  
  if (herbCount > 0) {
    const elementEffects = {
      jin: { r: 20, g: 20, b: 40 },
      mu: { r: -10, g: 30, b: -10 },
      shui: { r: -20, g: -10, b: 40 },
      huo: { r: 40, g: 10, b: -20 },
      tu: { r: 20, g: 10, b: 10 }
    };
    
    let totalEffect = { r: 0, g: 0, b: 0 };
    state.herbs.forEach(h => {
      const effect = elementEffects[h.element];
      totalEffect.r += effect.r;
      totalEffect.g += effect.g;
      totalEffect.b += effect.b;
    });
    
    const factor = Math.min(herbCount / 5, 1);
    r = Math.max(0, Math.min(255, r + totalEffect.r * factor));
    g = Math.max(0, Math.min(255, g + totalEffect.g * factor));
    b = Math.max(0, Math.min(255, b + totalEffect.b * factor));
  }
  
  return `rgb(${r}, ${g}, ${b})`;
}

function spawnFlameParticle(state: FurnaceState, centerX: number, centerY: number, width: number): void {
  const angle = (Math.random() - 0.5) * Math.PI * 0.8;
  const speed = 0.5 + Math.random() * 1.5;
  const temp = state.temperature;
  
  let color: string;
  if (temp < 400) {
    color = `rgb(${255}, ${69 + Math.random() * 50}, 0)`;
  } else if (temp < 700) {
    color = `rgb(${255}, ${150 + Math.random() * 80}, ${Math.random() * 50})`;
  } else {
    color = `rgb(${255}, ${200 + Math.random() * 55}, ${100 + Math.random() * 100})`;
  }
  
  const particle: FlameParticle = {
    x: centerX + (Math.random() - 0.5) * width * 0.4,
    y: centerY,
    vx: Math.sin(angle) * 0.5 + (Math.random() - 0.5) * 0.5,
    vy: -speed - Math.random() * 1,
    size: 3 + Math.random() * 5,
    life: 1,
    maxLife: 40 + Math.random() * 40,
    color,
    alpha: 0.8 + Math.random() * 0.2
  };
  
  state.flameParticles.push(particle);
}

function spawnBubble(state: FurnaceState, centerX: number, liquidY: number, width: number): void {
  const temp = state.temperature;
  const count = Math.floor(temp / 200) + 1;
  
  if (Math.random() < count * 0.05) {
    const bubble: Bubble = {
      x: centerX + (Math.random() - 0.5) * width * 0.5,
      y: liquidY + 10,
      radius: 2 + Math.random() * 10,
      vy: 0.3 + Math.random() * 0.8,
      alpha: 0.4 + Math.random() * 0.3,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.05 + Math.random() * 0.1,
      life: 1
    };
    state.bubbles.push(bubble);
  }
}

function createRipple(state: FurnaceState, x: number, y: number): void {
  const ripple: Ripple = {
    x,
    y,
    radius: 0,
    maxRadius: 40 + Math.random() * 20,
    alpha: 0.8,
    lineWidth: 2
  };
  state.ripples.push(ripple);
}

export function updateFurnace(state: FurnaceState, centerX: number, centerY: number, 
  furnaceWidth: number, liquidY: number, deltaTime: number): void {
  
  const tempDiff = state.targetTemperature - state.temperature;
  state.temperature += tempDiff * 0.02;
  state.temperature = Math.max(0, Math.min(1200, state.temperature));
  
  const now = Date.now();
  if (state.tempHistory.length === 0 || now - state.tempHistory[state.tempHistory.length - 1].time > 500) {
    state.tempHistory.push({ time: now, temp: state.temperature });
    if (state.tempHistory.length > 120) {
      state.tempHistory.shift();
    }
  }
  
  state.liquidColor = getLiquidColor(state);
  
  const flameCount = Math.min(30 + Math.floor(state.temperature / 50), 100);
  if (state.flameParticles.length < flameCount) {
    spawnFlameParticle(state, centerX, liquidY - 20, furnaceWidth);
  }
  
  if (state.temperature > 200) {
    spawnBubble(state, centerX, liquidY, furnaceWidth);
  }
  
  state.flameParticles = state.flameParticles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vx += (Math.random() - 0.5) * 0.1;
    p.vy *= 0.995;
    p.life -= 1 / p.maxLife;
    p.alpha = p.life * (0.8 + Math.random() * 0.2);
    p.size *= 0.995;
    return p.life > 0 && p.size > 1;
  });
  
  while (state.flameParticles.length > 500) {
    state.flameParticles.shift();
  }
  
  state.bubbles = state.bubbles.filter(b => {
    b.y -= b.vy;
    b.wobble += b.wobbleSpeed;
    b.x += Math.sin(b.wobble) * 0.5;
    b.life -= 0.005;
    
    if (b.y < liquidY - 30) {
      b.alpha -= 0.1;
      if (b.alpha <= 0) {
        createRipple(state, b.x, liquidY);
        return false;
      }
    }
    
    return b.life > 0;
  });
  
  while (state.bubbles.length > 200) {
    state.bubbles.shift();
  }
  
  state.ripples = state.ripples.filter(r => {
    r.radius += 2;
    r.alpha -= 0.03;
    r.lineWidth *= 0.95;
    return r.alpha > 0 && r.radius < r.maxRadius;
  });
  
  state.thrownHerbs = state.thrownHerbs.filter(h => {
    if (!h.active) return false;
    
    h.x += h.vx;
    h.y += h.vy;
    h.vy += 0.3;
    h.rotation += h.rotationSpeed;
    
    if (h.y >= liquidY) {
      createRipple(state, h.x, liquidY);
      h.active = false;
      return false;
    }
    
    return true;
  });
  
  if (state.flashIntensity > 0) {
    state.flashIntensity -= 0.05;
  }
  
  if (state.shakeDuration > 0) {
    state.shakeDuration--;
    state.shakeIntensity *= 0.9;
  } else {
    state.shakeIntensity = 0;
  }
}

export function getShakeOffset(state: FurnaceState): { x: number; y: number } {
  if (state.shakeIntensity <= 0) return { x: 0, y: 0 };
  return {
    x: (Math.random() - 0.5) * state.shakeIntensity,
    y: (Math.random() - 0.5) * state.shakeIntensity
  };
}
