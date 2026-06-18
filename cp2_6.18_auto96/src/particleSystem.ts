import * as THREE from 'three';

export interface GenrePreset {
  name: string;
  colors: THREE.Color[];
  bpm: number;
  intensity: number;
}

export const GENRE_PRESETS: GenrePreset[] = [
  {
    name: '古典',
    colors: [new THREE.Color(0xff8c00), new THREE.Color(0xffd700), new THREE.Color(0xff6347)],
    bpm: 80,
    intensity: 0.3,
  },
  {
    name: '电子',
    colors: [new THREE.Color(0x00ffff), new THREE.Color(0xff00ff), new THREE.Color(0x39ff14)],
    bpm: 128,
    intensity: 0.6,
  },
  {
    name: '爵士',
    colors: [new THREE.Color(0xffd700), new THREE.Color(0xcd853f), new THREE.Color(0xdaa520)],
    bpm: 100,
    intensity: 0.5,
  },
  {
    name: '摇滚',
    colors: [new THREE.Color(0x4169e1), new THREE.Color(0x8a2be2), new THREE.Color(0xff1493)],
    bpm: 140,
    intensity: 0.9,
  },
];

const PARTICLE_COUNT = 2000;

interface ParticleState {
  age: number;
  lifetime: number;
  baseSpeed: number;
  driftPhase: number;
  driftFreq: number;
  initialX: number;
  initialZ: number;
  colorIndex: number;
}

function createParticleTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.2)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function makeParticleState(randomAge: boolean): ParticleState {
  const lifetime = 3 + Math.random() * 3;
  return {
    age: randomAge ? Math.random() * lifetime : 0,
    lifetime,
    baseSpeed: 0.5 + Math.random() * 0.2,
    driftPhase: Math.random() * Math.PI * 2,
    driftFreq: 1 + Math.random() * 2,
    initialX: (Math.random() - 0.5) * 1.5,
    initialZ: (Math.random() - 0.5) * 1.5,
    colorIndex: Math.floor(Math.random() * 3),
  };
}

export function createParticleSystem(scene: THREE.Scene) {
  const geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const opacities = new Float32Array(PARTICLE_COUNT);

  const particles: ParticleState[] = [];
  let currentPreset = GENRE_PRESETS[0];

  function resetParticle(i: number, randomAge: boolean) {
    const p = makeParticleState(randomAge);
    particles[i] = p;

    const color = currentPreset.colors[p.colorIndex % currentPreset.colors.length];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    applyParticle(i, p);
  }

  function applyParticle(i: number, p: ParticleState) {
    const t = p.age / p.lifetime;
    const spreadFactor = Math.sin(t * Math.PI);

    positions[i * 3] =
      p.initialX * (1 + spreadFactor * 0.5) +
      Math.sin(p.age * p.driftFreq + p.driftPhase) * 0.3 * spreadFactor;
    positions[i * 3 + 1] = p.age * p.baseSpeed;
    positions[i * 3 + 2] =
      p.initialZ * (1 + spreadFactor * 0.5) +
      Math.cos(p.age * p.driftFreq * 0.7 + p.driftPhase) * 0.3 * spreadFactor;

    sizes[i] = 3 - 2.5 * t;
    opacities[i] = 1 - t;
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    resetParticle(i, true);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));

  const texture = createParticleTexture();

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
    },
    vertexShader: `
      attribute float aSize;
      attribute float aOpacity;
      attribute vec3 aColor;
      varying float vOpacity;
      varying vec3 vColor;
      void main() {
        vOpacity = aOpacity;
        vColor = aColor;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (200.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      varying float vOpacity;
      varying vec3 vColor;
      void main() {
        vec4 texColor = texture2D(uTexture, gl_PointCoord);
        gl_FragColor = vec4(vColor, texColor.a * vOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  function update(deltaTime: number, beatIntensity: number) {
    const intensityFactor = currentPreset.intensity;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      p.age += deltaTime;

      if (p.age >= p.lifetime) {
        resetParticle(i, false);
        continue;
      }

      const t = p.age / p.lifetime;
      const spreadFactor = Math.sin(t * Math.PI);
      const beatMod = 1 + beatIntensity * intensityFactor;

      positions[i * 3] =
        p.initialX * (1 + spreadFactor * 0.5) +
        Math.sin(p.age * p.driftFreq + p.driftPhase) * 0.3 * spreadFactor * beatMod;
      positions[i * 3 + 1] = p.age * p.baseSpeed * (1 + beatIntensity * intensityFactor * 0.3);
      positions[i * 3 + 2] =
        p.initialZ * (1 + spreadFactor * 0.5) +
        Math.cos(p.age * p.driftFreq * 0.7 + p.driftPhase) * 0.3 * spreadFactor * beatMod;

      sizes[i] = (3 - 2.5 * t) * (1 + beatIntensity * intensityFactor * 0.2);
      opacities[i] = 1 - t;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aSize.needsUpdate = true;
    geometry.attributes.aOpacity.needsUpdate = true;
  }

  function setGenre(index: number) {
    currentPreset = GENRE_PRESETS[index];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const color = currentPreset.colors[particles[i].colorIndex % currentPreset.colors.length];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.attributes.aColor.needsUpdate = true;
  }

  return { update, setGenre, points };
}
