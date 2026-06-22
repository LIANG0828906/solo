import * as THREE from 'three';
import { gsap } from 'gsap';

export type ColorTheme = 'warm' | 'cool' | 'mixed';

export interface StarFieldOptions {
  count: number;
  minRadius: number;
  maxRadius: number;
  minSize: number;
  maxSize: number;
  theme: ColorTheme;
}

export interface StarField {
  points: THREE.Points;
  pulseGroup: THREE.Group;
  updateCount: (newCount: number, duration?: number) => void;
  updateTheme: (newTheme: ColorTheme, duration?: number) => void;
  updateRotationSpeed: (speed: number) => void;
  update: (delta: number, camera: THREE.PerspectiveCamera) => void;
  createPulse: (position: THREE.Vector3) => void;
  getActiveCount: () => number;
  dispose: () => void;
}

const WARM_COLORS = [
  new THREE.Color('#ff6b35'),
  new THREE.Color('#ffb347'),
  new THREE.Color('#ff4757'),
  new THREE.Color('#ffa502'),
  new THREE.Color('#ff7f50'),
];

const COOL_COLORS = [
  new THREE.Color('#4a9eff'),
  new THREE.Color('#6a4eff'),
  new THREE.Color('#a855f7'),
  new THREE.Color('#00d2ff'),
  new THREE.Color('#7b68ee'),
];

function pickColor(theme: ColorTheme, random: number): THREE.Color {
  let palette: THREE.Color[];
  if (theme === 'warm') palette = WARM_COLORS;
  else if (theme === 'cool') palette = COOL_COLORS;
  else palette = Math.random() > 0.5 ? WARM_COLORS : COOL_COLORS;

  const idx = Math.min(Math.floor(random * palette.length), palette.length - 1);
  const base = palette[idx].clone();
  const next = palette[(idx + 1) % palette.length];
  const t = random * palette.length - idx;
  return base.lerp(next, t * 0.5);
}

const STAR_VERTEX_SHADER = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute float aDistance;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uPixelRatio;
  uniform float uCameraDistance;
  uniform float uLODFactor;

  void main() {
    vColor = color;
    vAlpha = aAlpha;

    float dist = length(position);
    float lodFade = 1.0;
    float threshold = uCameraDistance * uLODFactor;
    if (dist > threshold) {
      lodFade = smoothstep(threshold * 1.5, threshold, dist);
    }
    vAlpha *= lodFade;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const STAR_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;

    float glow = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.15, 0.0, d) * 0.8;
    float alpha = (glow + core) * vAlpha;

    gl_FragColor = vec4(vColor, alpha);
  }
`;

export function createStarField(
  scene: THREE.Scene,
  options?: Partial<StarFieldOptions>
): StarField {
  const opts: StarFieldOptions = Object.assign(
    {
      count: 5000,
      minRadius: 50,
      maxRadius: 500,
      minSize: 0.1,
      maxSize: 1.0,
      theme: 'cool' as ColorTheme,
    },
    options || {}
  );

  const MAX_COUNT = 10000;
  const geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(MAX_COUNT * 3);
  const colors = new Float32Array(MAX_COUNT * 3);
  const sizes = new Float32Array(MAX_COUNT);
  const alphas = new Float32Array(MAX_COUNT);
  const distances = new Float32Array(MAX_COUNT);
  const randomSeeds = new Float32Array(MAX_COUNT);

  for (let i = 0; i < MAX_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = opts.minRadius + Math.random() * (opts.maxRadius - opts.minRadius);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    distances[i] = radius;
    randomSeeds[i] = Math.random();

    const color = pickColor(opts.theme, randomSeeds[i]);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = opts.minSize + Math.random() * (opts.maxSize - opts.minSize);
    alphas[i] = 0;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
  geometry.setAttribute('aDistance', new THREE.BufferAttribute(distances, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: STAR_VERTEX_SHADER,
    fragmentShader: STAR_FRAGMENT_SHADER,
    uniforms: {
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uCameraDistance: { value: 500 },
      uLODFactor: { value: 2.5 },
    },
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  geometry.setDrawRange(0, opts.count);

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let activeCount = opts.count;
  let rotationSpeed = 0.01;
  let currentTheme = opts.theme;
  const pulseGroup = new THREE.Group();
  scene.add(pulseGroup);

  for (let i = 0; i < opts.count; i++) {
    gsap.to(alphas, {
      [i]: 1,
      duration: 0.5,
      delay: Math.random() * 0.3,
      ease: 'power2.out',
      onUpdate: () => {
        (geometry.attributes.aAlpha as THREE.BufferAttribute).needsUpdate = true;
      },
    });
  }

  function updateCount(newCount: number, duration: number = 0.5): void {
    if (newCount === activeCount) return;
    newCount = Math.max(1000, Math.min(10000, newCount));
    const prev = activeCount;
    activeCount = newCount;
    geometry.setDrawRange(0, Math.max(prev, newCount));

    if (newCount > prev) {
      for (let i = prev; i < newCount; i++) {
        const color = pickColor(currentTheme, randomSeeds[i]);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        alphas[i] = 0;

        gsap.to(alphas, {
          [i]: 1,
          duration,
          delay: Math.random() * 0.3,
          ease: 'power2.out',
          onUpdate: () => {
            (geometry.attributes.aAlpha as THREE.BufferAttribute).needsUpdate = true;
          },
        });
      }
      (geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    } else {
      for (let i = newCount; i < prev; i++) {
        gsap.to(alphas, {
          [i]: 0,
          duration,
          delay: Math.random() * 0.2,
          ease: 'power2.in',
          onUpdate: () => {
            (geometry.attributes.aAlpha as THREE.BufferAttribute).needsUpdate = true;
          },
          onComplete: () => {
            if (i >= activeCount) {
              geometry.setDrawRange(0, activeCount);
            }
          },
        });
      }
    }
  }

  function updateTheme(newTheme: ColorTheme, duration: number = 0.8): void {
    if (newTheme === currentTheme) return;
    currentTheme = newTheme;

    for (let i = 0; i < activeCount; i++) {
      const target = pickColor(newTheme, randomSeeds[i]);
      const obj = {
        r: colors[i * 3],
        g: colors[i * 3 + 1],
        b: colors[i * 3 + 2],
      };

      gsap.to(obj, {
        r: target.r,
        g: target.g,
        b: target.b,
        duration,
        delay: Math.random() * 0.3,
        ease: 'power2.inOut',
        onUpdate: () => {
          colors[i * 3] = obj.r;
          colors[i * 3 + 1] = obj.g;
          colors[i * 3 + 2] = obj.b;
          (geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
        },
      });
    }
  }

  function updateRotationSpeed(speed: number): void {
    rotationSpeed = speed;
  }

  function createPulse(position: THREE.Vector3): void {
    const particleCount = 24;
    const pulseGeo = new THREE.BufferGeometry();
    const pulsePos = new Float32Array(particleCount * 3);
    const pulseAlpha = new Float32Array(particleCount);
    const pulseSize = new Float32Array(particleCount);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < particleCount; i++) {
      pulsePos[i * 3] = position.x;
      pulsePos[i * 3 + 1] = position.y;
      pulsePos[i * 3 + 2] = position.z;
      pulseAlpha[i] = 1;
      pulseSize[i] = 0.8;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 8 + Math.random() * 12;
      velocities.push(
        new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed,
          Math.cos(phi) * speed
        )
      );
    }

    pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
    pulseGeo.setAttribute('aAlpha', new THREE.BufferAttribute(pulseAlpha, 1));
    pulseGeo.setAttribute('aSize', new THREE.BufferAttribute(pulseSize, 1));

    const pulseMat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute float aAlpha;
        varying float vAlpha;
        uniform float uPixelRatio;
        void main() {
          vAlpha = aAlpha;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uPixelRatio * (150.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        uniform vec3 uColor;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          if (d > 0.5) discard;
          float glow = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(uColor, glow * vAlpha);
        }
      `,
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uColor: { value: new THREE.Color('#a855f7') },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const pulsePoints = new THREE.Points(pulseGeo, pulseMat);
    pulseGroup.add(pulsePoints);

    const life = { t: 0 };
    gsap.to(life, {
      t: 1.2,
      duration: 1.2,
      ease: 'none',
      onUpdate: () => {
        const dt = 0.016;
        for (let i = 0; i < particleCount; i++) {
          pulsePos[i * 3] += velocities[i].x * dt;
          pulsePos[i * 3 + 1] += velocities[i].y * dt;
          pulsePos[i * 3 + 2] += velocities[i].z * dt;
          pulseAlpha[i] = Math.max(0, 1 - life.t / 1.2);
          pulseSize[i] = Math.max(0.1, 0.8 * (1 - life.t / 1.2));
        }
        (pulseGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        (pulseGeo.attributes.aAlpha as THREE.BufferAttribute).needsUpdate = true;
        (pulseGeo.attributes.aSize as THREE.BufferAttribute).needsUpdate = true;
      },
      onComplete: () => {
        pulseGroup.remove(pulsePoints);
        pulseGeo.dispose();
        pulseMat.dispose();
      },
    });
  }

  function update(delta: number, camera: THREE.PerspectiveCamera): void {
    points.rotation.y += rotationSpeed * delta;

    const camDist = camera.position.length();
    material.uniforms.uCameraDistance.value = camDist;
  }

  function getActiveCount(): number {
    return activeCount;
  }

  function dispose(): void {
    scene.remove(points);
    scene.remove(pulseGroup);
    geometry.dispose();
    material.dispose();
    gsap.killTweensOf(alphas);
    gsap.killTweensOf(colors);
  }

  return {
    points,
    pulseGroup,
    updateCount,
    updateTheme,
    updateRotationSpeed,
    update,
    createPulse,
    getActiveCount,
    dispose,
  };
}
