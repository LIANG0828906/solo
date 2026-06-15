import * as THREE from 'three';

export interface NebulaParams {
  shape: 'sphere' | 'torus' | 'spiral';
  density: number;
  rotationSpeed: number;
  particleSize: number;
  attenuation: number;
  pulseAmplitude: number;
  colorStart: string;
  colorMid: string;
  colorEnd: string;
}

export interface ParticleSystem {
  group: THREE.Group;
  update: (time: number, delta: number) => void;
  updateParams: (params: Partial<NebulaParams>, animate?: boolean) => void;
  getParams: () => NebulaParams;
  transitionTo: (targetParams: NebulaParams, duration?: number) => void;
}

const easeOutElastic = (t: number): number => {
  if (t === 0 || t === 1) return t;
  const p = 0.3;
  const s = p / 4;
  return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 1, g: 1, b: 1 };
};

const interpolateColor = (
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } => ({
  r: lerp(color1.r, color2.r, t),
  g: lerp(color1.g, color2.g, t),
  b: lerp(color1.b, color2.b, t)
});

const getColorAtPosition = (
  t: number,
  start: string,
  mid: string,
  end: string
): { r: number; g: number; b: number } => {
  const c1 = hexToRgb(start);
  const c2 = hexToRgb(mid);
  const c3 = hexToRgb(end);
  if (t < 0.5) {
    return interpolateColor(c1, c2, t * 2);
  } else {
    return interpolateColor(c2, c3, (t - 0.5) * 2);
  }
};

const generateParticlePositions = (
  shape: 'sphere' | 'torus' | 'spiral',
  count: number
): Float32Array => {
  const positions = new Float32Array(count * 3);
  const radius = 50;

  for (let i = 0; i < count; i++) {
    const idx = i * 3;

    if (shape === 'sphere') {
      const r = radius * Math.pow(Math.random(), 0.33);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[idx] = r * Math.sin(phi) * Math.cos(theta);
      positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[idx + 2] = r * Math.cos(phi);
    } else if (shape === 'torus') {
      const tubeRadius = 15;
      const torusRadius = 30;
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const r = tubeRadius * Math.pow(Math.random(), 0.5);
      positions[idx] = (torusRadius + r * Math.cos(v)) * Math.cos(u);
      positions[idx + 1] = (torusRadius + r * Math.cos(v)) * Math.sin(u);
      positions[idx + 2] = r * Math.sin(v);
    } else if (shape === 'spiral') {
      const arms = 4;
      const spin = 2;
      const t = Math.pow(Math.random(), 0.5) * radius;
      const armAngle = (i % arms) * (Math.PI * 2 / arms);
      const angle = armAngle + (t / radius) * Math.PI * spin + (Math.random() - 0.5) * 0.5;
      const spread = Math.random() * 8;
      positions[idx] = Math.cos(angle) * t + (Math.random() - 0.5) * spread;
      positions[idx + 1] = (Math.random() - 0.5) * spread * 0.5;
      positions[idx + 2] = Math.sin(angle) * t + (Math.random() - 0.5) * spread;
    }
  }

  return positions;
};

const createCircleTexture = (): THREE.Texture => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

const createBackgroundStars = (): THREE.Points => {
  const count = 1000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    const distance = 200 + Math.random() * 300;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[idx] = distance * Math.sin(phi) * Math.cos(theta);
    positions[idx + 1] = distance * Math.sin(phi) * Math.sin(theta);
    positions[idx + 2] = distance * Math.cos(phi);
    const brightness = 0.7 + Math.random() * 0.3;
    colors[idx] = brightness;
    colors[idx + 1] = brightness;
    colors[idx + 2] = brightness;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.3,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });

  return new THREE.Points(geometry, material);
};

export const createParticleSystem = (
  initialParams: NebulaParams
): ParticleSystem => {
  const group = new THREE.Group();
  const circleTexture = createCircleTexture();
  const backgroundStars = createBackgroundStars();
  group.add(backgroundStars);

  let currentParams = { ...initialParams };
  let targetPositions: Float32Array | null = null;
  let oldPositions: Float32Array | null = null;
  let transitionProgress = 1;
  let transitionDuration = 0.6;
  let isTransitioning = false;

  let colorTarget: { start: string; mid: string; end: string } | null = null;
  let colorOld: { start: string; mid: string; end: string } | null = null;
  let colorTransitionProgress = 1;
  let colorTransitionDuration = 0.5;
  let isColorTransitioning = false;

  let geometry: THREE.BufferGeometry | null = null;
  let material: THREE.PointsMaterial | null = null;
  let points: THREE.Points | null = null;
  let baseSizes: Float32Array | null = null;

  const rebuildGeometry = () => {
    if (points) {
      group.remove(points);
      geometry?.dispose();
      material?.dispose();
    }

    const count = Math.min(currentParams.density, 50000);
    geometry = new THREE.BufferGeometry();
    const positions = generateParticlePositions(currentParams.shape, count);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    baseSizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const posIdx = i;
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);
      const maxDist = 60;
      const t = dist / maxDist;

      const color = getColorAtPosition(t, currentParams.colorStart, currentParams.colorMid, currentParams.colorEnd);
      colors[idx] = color.r;
      colors[idx + 1] = color.g;
      colors[idx + 2] = color.b;

      const baseSize = currentParams.particleSize * (1 - currentParams.attenuation * t);
      sizes[posIdx] = baseSize;
      baseSizes[posIdx] = baseSize;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    material = new THREE.PointsMaterial({
      size: currentParams.particleSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: circleTexture,
      sizeAttenuation: true
    });

    points = new THREE.Points(geometry, material);
    group.add(points);
  };

  const updateColors = (t: number) => {
    if (!geometry || !colorOld || !colorTarget) return;
    const colors = geometry.attributes.color.array as Float32Array;
    const count = colors.length / 3;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const positions = geometry.attributes.position.array as Float32Array;
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);
      const maxDist = 60;
      const colorT = dist / maxDist;

      const oldColor = getColorAtPosition(colorT, colorOld.start, colorOld.mid, colorOld.end);
      const newColor = getColorAtPosition(colorT, colorTarget.start, colorTarget.mid, colorTarget.end);

      colors[idx] = lerp(oldColor.r, newColor.r, t);
      colors[idx + 1] = lerp(oldColor.g, newColor.g, t);
      colors[idx + 2] = lerp(oldColor.b, newColor.b, t);
    }

    geometry.attributes.color.needsUpdate = true;
  };

  rebuildGeometry();

  return {
    group,

    update: (time: number, delta: number) => {
      if (points) {
        points.rotation.y += currentParams.rotationSpeed * delta * 0.1;
      }

      if (isTransitioning && geometry && targetPositions && oldPositions) {
        transitionProgress += delta / transitionDuration;
        const t = Math.min(transitionProgress, 1);
        const easedT = easeOutElastic(t);

        const positions = geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i++) {
          positions[i] = lerp(oldPositions[i], targetPositions[i], easedT);
        }
        geometry.attributes.position.needsUpdate = true;

        if (t >= 1) {
          isTransitioning = false;
          transitionProgress = 1;
        }
      }

      if (isColorTransitioning) {
        colorTransitionProgress += delta / colorTransitionDuration;
        const t = Math.min(colorTransitionProgress, 1);
        updateColors(t);

        if (t >= 1) {
          isColorTransitioning = false;
          colorTransitionProgress = 1;
        }
      }

      if (geometry && baseSizes && currentParams.pulseAmplitude > 0) {
        const sizes = geometry.attributes.size.array as Float32Array;
        const pulse = Math.sin(time * 2) * currentParams.pulseAmplitude + 1;

        for (let i = 0; i < sizes.length; i++) {
          sizes[i] = baseSizes[i] * pulse;
        }
        geometry.attributes.size.needsUpdate = true;
      }

      backgroundStars.rotation.y += delta * 0.005;
    },

    updateParams: (params: Partial<NebulaParams>, animate = true) => {
      const needsGeometryRebuild = params.shape !== undefined && params.shape !== currentParams.shape ||
                                    params.density !== undefined && params.density !== currentParams.density;

      const needsColorUpdate = params.colorStart !== undefined ||
                               params.colorMid !== undefined ||
                               params.colorEnd !== undefined;

      if (needsColorUpdate && animate) {
        colorOld = {
          start: currentParams.colorStart,
          mid: currentParams.colorMid,
          end: currentParams.colorEnd
        };
        colorTarget = {
          start: params.colorStart || currentParams.colorStart,
          mid: params.colorMid || currentParams.colorMid,
          end: params.colorEnd || currentParams.colorEnd
        };
        colorTransitionProgress = 0;
        isColorTransitioning = true;
      }

      if (needsGeometryRebuild && animate && geometry) {
        oldPositions = new Float32Array(geometry.attributes.position.array as Float32Array);
        const newCount = Math.min(params.density || currentParams.density, 50000);
        const newShape = params.shape || currentParams.shape;
        targetPositions = generateParticlePositions(newShape, newCount);
        transitionProgress = 0;
        transitionDuration = 0.6;
        isTransitioning = true;
      }

      currentParams = { ...currentParams, ...params };

      if (needsGeometryRebuild && !animate) {
        rebuildGeometry();
      }

      if (material) {
        if (params.particleSize !== undefined) {
          material.size = params.particleSize;
        }
      }
    },

    getParams: () => ({ ...currentParams }),

    transitionTo: (targetParams: NebulaParams, duration = 1) => {
      if (geometry) {
        oldPositions = new Float32Array(geometry.attributes.position.array as Float32Array);
        const newCount = Math.min(targetParams.density, 50000);
        targetPositions = generateParticlePositions(targetParams.shape, newCount);
        transitionProgress = 0;
        transitionDuration = duration;
        isTransitioning = true;

        colorOld = {
          start: currentParams.colorStart,
          mid: currentParams.colorMid,
          end: currentParams.colorEnd
        };
        colorTarget = {
          start: targetParams.colorStart,
          mid: targetParams.colorMid,
          end: targetParams.colorEnd
        };
        colorTransitionProgress = 0;
        colorTransitionDuration = duration;
        isColorTransitioning = true;
      }

      currentParams = { ...targetParams };

      if (material) {
        material.size = targetParams.particleSize;
      }
    }
  };
};
