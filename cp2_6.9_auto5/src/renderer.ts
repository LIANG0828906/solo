import type { LightSource, GlobalConfig } from './types.js';
import { CANVAS_SIZE, DEFAULT_SATURATION } from './types.js';

const SPHERE_RADIUS = 250;
const SPHERE_CENTER = CANVAS_SIZE / 2;

interface SpherePixel {
  normalX: number;
  normalY: number;
  normalZ: number;
  isOnSphere: boolean;
}

const sphereCache: SpherePixel[][] = [];
let cachedImageData: ImageData | null = null;

function precomputeSphereData(): void {
  if (sphereCache.length > 0) return;
  
  for (let y = 0; y < CANVAS_SIZE; y++) {
    sphereCache[y] = [];
    for (let x = 0; x < CANVAS_SIZE; x++) {
      const dx = x - SPHERE_CENTER;
      const dy = y - SPHERE_CENTER;
      const distSq = dx * dx + dy * dy;
      
      if (distSq <= SPHERE_RADIUS * SPHERE_RADIUS) {
        const dz = Math.sqrt(SPHERE_RADIUS * SPHERE_RADIUS - distSq);
        sphereCache[y][x] = {
          normalX: dx / SPHERE_RADIUS,
          normalY: dy / SPHERE_RADIUS,
          normalZ: dz / SPHERE_RADIUS,
          isOnSphere: true
        };
      } else {
        sphereCache[y][x] = {
          normalX: 0,
          normalY: 0,
          normalZ: 0,
          isOnSphere: false
        };
      }
    }
  }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [45, 45, 45];
}

export function render(
  ctx: CanvasRenderingContext2D,
  lights: LightSource[],
  config: GlobalConfig,
  isDragging: boolean = false
): void {
  precomputeSphereData();
  
  if (!cachedImageData) {
    cachedImageData = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
  }
  
  const data = cachedImageData.data;
  const bgRgb = hexToRgb(config.backgroundColor);
  
  const step = isDragging ? 2 : 1;
  const lightCount = lights.length;
  
  const lightData = lights.map(light => {
    const [lr, lg, lb] = hslToRgb(light.hue, DEFAULT_SATURATION, light.brightness);
    const lx = light.x - SPHERE_CENTER;
    const ly = light.y - SPHERE_CENTER;
    return { lr, lg, lb, lx, ly, radius: light.radius, brightness: light.brightness };
  });
  
  const roughness = Math.max(0.001, config.roughness);
  const shininess = Math.pow(2, 10 * (1 - roughness));
  const ks = 1 - roughness * 0.5;
  const kd = 1 - roughness * 0.3;
  const ambient = config.ambientIntensity;
  const attenuation = config.attenuation;
  
  for (let y = 0; y < CANVAS_SIZE; y++) {
    for (let x = 0; x < CANVAS_SIZE; x++) {
      const idx = (y * CANVAS_SIZE + x) * 4;
      
      if (y % step !== 0 || x % step !== 0) {
        data[idx] = bgRgb[0];
        data[idx + 1] = bgRgb[1];
        data[idx + 2] = bgRgb[2];
        data[idx + 3] = 255;
        continue;
      }
      
      const pixel = sphereCache[y][x];
      
      if (!pixel.isOnSphere) {
        data[idx] = bgRgb[0];
        data[idx + 1] = bgRgb[1];
        data[idx + 2] = bgRgb[2];
        data[idx + 3] = 255;
        continue;
      }
      
      let r = ambient * 255;
      let g = ambient * 255;
      let b = ambient * 255;
      
      const nx = pixel.normalX;
      const ny = pixel.normalY;
      const nz = pixel.normalZ;
      
      const vx = 0;
      const vy = 0;
      const vz = 1;
      
      for (let i = 0; i < lightCount; i++) {
        const light = lightData[i];
        
        const ldx = light.lx - nx * SPHERE_RADIUS;
        const ldy = light.ly - ny * SPHERE_RADIUS;
        const ldz = -nz * SPHERE_RADIUS;
        
        const dist = Math.sqrt(ldx * ldx + ldy * ldy + ldz * ldz);
        if (dist < 1) continue;
        
        const invDist = 1 / dist;
        const ldirX = ldx * invDist;
        const ldirY = ldy * invDist;
        const ldirZ = ldz * invDist;
        
        const dotNL = nx * ldirX + ny * ldirY + nz * ldirZ;
        if (dotNL <= 0) continue;
        
        const attFactor = 1 / (1 + Math.pow(dist / 200, attenuation));
        const intensity = attFactor * (light.brightness / 100) * (light.radius / 8);
        
        const diffuse = dotNL * kd * intensity;
        
        const dotRV = 2 * dotNL * nz - ldirZ;
        const specular = dotRV > 0 ? Math.pow(dotRV, shininess) * ks * intensity : 0;
        
        r += (diffuse + specular) * light.lr;
        g += (diffuse + specular) * light.lg;
        b += (diffuse + specular) * light.lb;
      }
      
      data[idx] = Math.min(255, r);
      data[idx + 1] = Math.min(255, g);
      data[idx + 2] = Math.min(255, b);
      data[idx + 3] = 255;
    }
  }
  
  if (isDragging) {
    for (let y = 0; y < CANVAS_SIZE - 1; y++) {
      for (let x = 0; x < CANVAS_SIZE - 1; x++) {
        if (y % 2 === 1 || x % 2 === 1) {
          const idx = (y * CANVAS_SIZE + x) * 4;
          const refIdx = ((y - (y % 2)) * CANVAS_SIZE + (x - (x % 2))) * 4;
          data[idx] = data[refIdx];
          data[idx + 1] = data[refIdx + 1];
          data[idx + 2] = data[refIdx + 2];
          data[idx + 3] = 255;
        }
      }
    }
  }
  
  ctx.putImageData(cachedImageData, 0, 0);
}

export function renderLightMarkers(
  ctx: CanvasRenderingContext2D,
  lights: LightSource[],
  selectedId: number | null
): void {
  for (const light of lights) {
    const isSelected = light.id === selectedId;
    const gradient = ctx.createRadialGradient(
      light.x, light.y, 0,
      light.x, light.y, light.radius * 2
    );
    gradient.addColorStop(0, `hsla(${light.hue}, ${DEFAULT_SATURATION}%, ${light.brightness}%, 0.9)`);
    gradient.addColorStop(0.5, `hsla(${light.hue}, ${DEFAULT_SATURATION}%, ${light.brightness}%, 0.4)`);
    gradient.addColorStop(1, `hsla(${light.hue}, ${DEFAULT_SATURATION}%, ${light.brightness}%, 0)`);
    
    ctx.beginPath();
    ctx.arc(light.x, light.y, light.radius * 2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${light.hue}, ${DEFAULT_SATURATION}%, ${light.brightness}%)`;
    ctx.fill();
    
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(light.x, light.y, light.radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

export function getLightAtPosition(
  lights: LightSource[],
  x: number,
  y: number
): LightSource | null {
  for (let i = lights.length - 1; i >= 0; i--) {
    const light = lights[i];
    const dx = x - light.x;
    const dy = y - light.y;
    if (dx * dx + dy * dy <= (light.radius + 6) * (light.radius + 6)) {
      return light;
    }
  }
  return null;
}
