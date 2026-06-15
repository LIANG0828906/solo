import * as THREE from 'three';
import type { ColorTheme } from './starGenerator';

export interface MeteorShowerOptions {
  enabled: boolean;
  theme: ColorTheme;
}

export interface MeteorShower {
  start: () => void;
  stop: () => void;
  setTheme: (theme: ColorTheme) => void;
  setEnabled: (enabled: boolean) => void;
  update: (delta: number) => void;
  dispose: () => void;
}

const METEOR_VERTEX = /* glsl */ `
  attribute float aAlpha;
  attribute float aSize;
  varying float vAlpha;
  uniform float uPixelRatio;

  void main() {
    vAlpha = aAlpha;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const METEOR_FRAGMENT = /* glsl */ `
  varying float vAlpha;
  uniform vec3 uColor;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, glow * vAlpha);
  }
`;

const WARM_PALETTE = [0xff6b35, 0xffb347, 0xff4757, 0xffa502, 0xff7f50];
const COOL_PALETTE = [0x4a9eff, 0x6a4eff, 0xa855f7, 0x00d2ff, 0x7b68ee];

function sampleThemeColor(theme: ColorTheme): THREE.Color {
  const palette = theme === 'warm' ? WARM_PALETTE : theme === 'cool' ? COOL_PALETTE : [...WARM_PALETTE, ...COOL_PALETTE];
  return new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
}

interface Meteor {
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  positions: Float32Array;
  alphas: Float32Array;
  sizes: Float32Array;
  headPos: THREE.Vector3;
  velocity: THREE.Vector3;
  trajectory: (t: number) => THREE.Vector3;
  startTime: number;
  duration: number;
  particleCount: number;
  trailIndex: number;
  active: boolean;
}

export function createMeteorShower(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  options?: Partial<MeteorShowerOptions>
): MeteorShower {
  let enabled = options?.enabled ?? false;
  let currentTheme: ColorTheme = options?.theme ?? 'cool';
  let running = false;
  let nextSpawnTime = 0;
  const meteors: Meteor[] = [];
  const clock = new THREE.Clock();

  function getOffscreenStart(): THREE.Vector3 {
    const angle = Math.random() * Math.PI * 2;
    const elevation = (Math.random() - 0.3) * 0.6;
    const dir = new THREE.Vector3(
      Math.cos(angle) * Math.cos(elevation),
      Math.sin(elevation),
      Math.sin(angle) * Math.cos(elevation)
    );

    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    const right = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, camDir).normalize();

    const offset = new THREE.Vector3()
      .addScaledVector(right, dir.x * 2.5)
      .addScaledVector(up, dir.y * 2.0)
      .addScaledVector(camDir, -0.5);

    return camera.position.clone().add(offset.multiplyScalar(400));
  }

  function getEndPoint(start: THREE.Vector3): THREE.Vector3 {
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    const target = camera.position.clone().addScaledVector(camDir, 200);

    const toTarget = new THREE.Vector3().subVectors(target, start);
    const perp = new THREE.Vector3(
      (Math.random() - 0.5) * 200,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 200
    );
    return start.clone().add(toTarget.multiplyScalar(0.6)).add(perp);
  }

  function createMeteor(): Meteor {
    const particleCount = 80;
    const start = getOffscreenStart();
    const end = getEndPoint(start);
    const mid = start.clone().lerp(end, 0.5).add(
      new THREE.Vector3(
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 150
      )
    );

    function bezier(t: number): THREE.Vector3 {
      const mt = 1 - t;
      return new THREE.Vector3(
        mt * mt * start.x + 2 * mt * t * mid.x + t * t * end.x,
        mt * mt * start.y + 2 * mt * t * mid.y + t * t * end.y,
        mt * mt * start.z + 2 * mt * t * mid.z + t * t * end.z
      );
    }

    const positions = new Float32Array(particleCount * 3);
    const alphas = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = start.x;
      positions[i * 3 + 1] = start.y;
      positions[i * 3 + 2] = start.z;
      alphas[i] = 0;
      sizes[i] = 0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const color = sampleThemeColor(currentTheme);
    const material = new THREE.ShaderMaterial({
      vertexShader: METEOR_VERTEX,
      fragmentShader: METEOR_FRAGMENT,
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uColor: { value: color },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const duration = 2.0;
    return {
      points,
      geometry,
      material,
      positions,
      alphas,
      sizes,
      headPos: start.clone(),
      velocity: new THREE.Vector3(),
      trajectory: bezier,
      startTime: clock.elapsedTime,
      duration,
      particleCount,
      trailIndex: 0,
      active: true,
    };
  }

  function updateMeteor(meteor: Meteor, elapsed: number): void {
    const t = Math.min(1, (elapsed - meteor.startTime) / meteor.duration);
    if (t >= 1) {
      meteor.active = false;
      return;
    }

    const head = meteor.trajectory(t);
    meteor.headPos.copy(head);

    const trailFadeStart = 0.7;
    const globalFade = t < trailFadeStart ? 1 : 1 - (t - trailFadeStart) / (1 - trailFadeStart);

    const writeIdx = meteor.trailIndex;
    meteor.positions[writeIdx * 3] = head.x;
    meteor.positions[writeIdx * 3 + 1] = head.y;
    meteor.positions[writeIdx * 3 + 2] = head.z;
    meteor.alphas[writeIdx] = 1.0 * globalFade;
    meteor.sizes[writeIdx] = 2.5;

    for (let i = 0; i < meteor.particleCount; i++) {
      let age: number;
      if (i <= writeIdx) {
        age = (writeIdx - i) / meteor.particleCount;
      } else {
        age = (meteor.particleCount - i + writeIdx) / meteor.particleCount;
      }

      const trailAlpha = Math.max(0, 1 - age * 1.5) * globalFade;
      meteor.alphas[i] = trailAlpha;
      meteor.sizes[i] = Math.max(0.3, 2.5 * (1 - age * 1.2));
    }

    meteor.trailIndex = (meteor.trailIndex + 1) % meteor.particleCount;

    (meteor.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (meteor.geometry.attributes.aAlpha as THREE.BufferAttribute).needsUpdate = true;
    (meteor.geometry.attributes.aSize as THREE.BufferAttribute).needsUpdate = true;
  }

  function spawnMeteor(): void {
    if (meteors.length < 5) {
      meteors.push(createMeteor());
    }
  }

  function scheduleNext(): number {
    if (enabled) {
      return clock.elapsedTime + 5 + Math.random() * 3;
    }
    return clock.elapsedTime + 30;
  }

  function update(delta: number): void {
    if (!running) return;
    const elapsed = clock.elapsedTime;

    if (elapsed >= nextSpawnTime) {
      spawnMeteor();
      nextSpawnTime = scheduleNext();
    }

    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      if (m.active) {
        updateMeteor(m, elapsed);
      } else {
        scene.remove(m.points);
        m.geometry.dispose();
        m.material.dispose();
        meteors.splice(i, 1);
      }
    }
  }

  function start(): void {
    if (running) return;
    running = true;
    clock.start();
    nextSpawnTime = clock.elapsedTime + (enabled ? 2 : 10);
  }

  function stop(): void {
    running = false;
  }

  function setTheme(theme: ColorTheme): void {
    currentTheme = theme;
  }

  function setEnabled(e: boolean): void {
    enabled = e;
    if (running && e) {
      nextSpawnTime = clock.elapsedTime + 1 + Math.random() * 2;
    }
  }

  function dispose(): void {
    stop();
    for (const m of meteors) {
      scene.remove(m.points);
      m.geometry.dispose();
      m.material.dispose();
    }
    meteors.length = 0;
  }

  return {
    start,
    stop,
    setTheme,
    setEnabled,
    update,
    dispose,
  };
}
