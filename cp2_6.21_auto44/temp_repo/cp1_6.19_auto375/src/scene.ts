import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  lerp,
  lerpColor,
  hexToRgb,
  sineNoise,
  easeOutCubic,
} from './utils';
import type { ParticleClickData } from './store';

const PARTICLE_COUNT = 8000;
const NEBULA_RADIUS = 80;
const TRANSITION_DURATION = 0.3;

interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  particles: THREE.Points;
  positions: Float32Array;
  colors: Float32Array;
  spherePositions: Float32Array;
  spiralPositions: Float32Array;
  ringPositions: Float32Array;
  baseRadii: Float32Array;
  noiseOffsets: Float32Array;
  time: number;
  lastTime: number;
  frameCount: number;
  fpsUpdateTime: number;
  smoothParams: {
    currentMorphology: number;
    targetMorphology: number;
    currentTurbulence: number;
    targetTurbulence: number;
    currentColorTemp: number;
    targetColorTemp: number;
    transitionProgress: number;
    startMorphology: number;
    startTurbulence: number;
    startColorTemp: number;
  };
  hoverStartTime: number;
  isUserInteracting: boolean;
  autoRotateSpeed: number;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  rippleMesh: THREE.Mesh | null;
  rippleStartTime: number;
  onFpsUpdate: (fps: number) => void;
  onParticleClick: (data: ParticleClickData | null) => void;
  getMorphology: () => number;
  getTurbulence: () => number;
  getColorTemp: () => number;
}

const COLOR_INNER = hexToRgb('#00E5FF');
const COLOR_OUTER = hexToRgb('#B388FF');
const COLOR_COOL = hexToRgb('#0066FF');
const COLOR_WARM = hexToRgb('#FF6B00');

const generateSpherePosition = (
  i: number,
  count: number
): { x: number; y: number; z: number; radius: number } => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = NEBULA_RADIUS * Math.cbrt(Math.random());

  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);

  return { x, y, z, radius: r };
};

const generateSpiralPosition = (
  i: number,
  count: number
): { x: number; y: number; z: number; radius: number } => {
  const t = i / count;
  const theta = t * Math.PI * 8;
  const r = NEBULA_RADIUS * 0.3 + t * NEBULA_RADIUS * 0.7;
  const z = (Math.random() - 0.5) * NEBULA_RADIUS * 0.4;

  const x = r * Math.cos(theta);
  const y = r * Math.sin(theta);
  const radius = Math.sqrt(x * x + y * y + z * z);

  return { x, y, z, radius };
};

const generateRingPosition = (
  i: number,
  count: number
): { x: number; y: number; z: number; radius: number } => {
  const theta = Math.random() * Math.PI * 2;
  const phi = (Math.random() - 0.5) * Math.PI * 0.3;
  const ringRadius = NEBULA_RADIUS * 0.7;
  const tubeRadius = NEBULA_RADIUS * 0.15;
  const r = tubeRadius * Math.sqrt(Math.random());

  const x = (ringRadius + r * Math.cos(phi)) * Math.cos(theta);
  const y = (ringRadius + r * Math.cos(phi)) * Math.sin(theta);
  const z = r * Math.sin(phi);
  const radius = Math.sqrt(x * x + y * y + z * z);

  return { x, y, z, radius };
};

const interpolatePosition = (
  sphere: { x: number; y: number; z: number },
  spiral: { x: number; y: number; z: number },
  ring: { x: number; y: number; z: number },
  morphology: number
): { x: number; y: number; z: number } => {
  if (morphology <= 0.5) {
    const t = morphology * 2;
    return {
      x: lerp(sphere.x, spiral.x, t),
      y: lerp(sphere.y, spiral.y, t),
      z: lerp(sphere.z, spiral.z, t),
    };
  } else {
    const t = (morphology - 0.5) * 2;
    return {
      x: lerp(spiral.x, ring.x, t),
      y: lerp(spiral.y, ring.y, t),
      z: lerp(spiral.z, ring.z, t),
    };
  }
};

const getParticleColor = (
  radius: number,
  maxRadius: number,
  colorTemp: number
): { r: number; g: number; b: number } => {
  const t = radius / maxRadius;
  let baseColor = lerpColor(COLOR_INNER, COLOR_OUTER, t);

  if (colorTemp < 0) {
    baseColor = lerpColor(baseColor, COLOR_COOL, -colorTemp);
  } else if (colorTemp > 0) {
    baseColor = lerpColor(baseColor, COLOR_WARM, colorTemp);
  }

  return baseColor;
};

export const initScene = (
  container: HTMLElement,
  getMorphology: () => number,
  getTurbulence: () => number,
  getColorTemp: () => number,
  onFpsUpdate: (fps: number) => void,
  onParticleClick: (data: ParticleClickData | null) => void
): {
  animate: () => void;
  dispose: () => void;
  handleMouseMove: (event: MouseEvent) => void;
  handleClick: (event: MouseEvent) => void;
  handleMouseDown: () => void;
  handleMouseUp: () => void;
} => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0B0C10');

  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 150;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.minDistance = 50;
  controls.maxDistance = 300;

  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const spherePositions = new Float32Array(PARTICLE_COUNT * 3);
  const spiralPositions = new Float32Array(PARTICLE_COUNT * 3);
  const ringPositions = new Float32Array(PARTICLE_COUNT * 3);
  const baseRadii = new Float32Array(PARTICLE_COUNT);
  const noiseOffsets = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const sphere = generateSpherePosition(i, PARTICLE_COUNT);
    const spiral = generateSpiralPosition(i, PARTICLE_COUNT);
    const ring = generateRingPosition(i, PARTICLE_COUNT);

    spherePositions[i * 3] = sphere.x;
    spherePositions[i * 3 + 1] = sphere.y;
    spherePositions[i * 3 + 2] = sphere.z;

    spiralPositions[i * 3] = spiral.x;
    spiralPositions[i * 3 + 1] = spiral.y;
    spiralPositions[i * 3 + 2] = spiral.z;

    ringPositions[i * 3] = ring.x;
    ringPositions[i * 3 + 1] = ring.y;
    ringPositions[i * 3 + 2] = ring.z;

    baseRadii[i] = sphere.radius;
    noiseOffsets[i] = Math.random() * Math.PI * 2;

    const color = getParticleColor(sphere.radius, NEBULA_RADIUS, 0);
    positions[i * 3] = sphere.x;
    positions[i * 3 + 1] = sphere.y;
    positions[i * 3 + 2] = sphere.z;
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const ctx: SceneContext = {
    scene,
    camera,
    renderer,
    controls,
    particles,
    positions,
    colors,
    spherePositions,
    spiralPositions,
    ringPositions,
    baseRadii,
    noiseOffsets,
    time: 0,
    lastTime: performance.now(),
    frameCount: 0,
    fpsUpdateTime: 0,
    smoothParams: {
      currentMorphology: 0,
      targetMorphology: 0,
      currentTurbulence: 1,
      targetTurbulence: 1,
      currentColorTemp: 0,
      targetColorTemp: 0,
      transitionProgress: 1,
      startMorphology: 0,
      startTurbulence: 1,
      startColorTemp: 0,
    },
    hoverStartTime: 0,
    isUserInteracting: false,
    autoRotateSpeed: (2 * Math.PI) / 180,
    raycaster,
    mouse,
    rippleMesh: null,
    rippleStartTime: 0,
    onFpsUpdate,
    onParticleClick,
    getMorphology,
    getTurbulence,
    getColorTemp,
  };

  const updateSmoothParams = () => {
    const targetMorphology = getMorphology();
    const targetTurbulence = getTurbulence();
    const targetColorTemp = getColorTemp();

    if (
      ctx.smoothParams.targetMorphology !== targetMorphology ||
      ctx.smoothParams.targetTurbulence !== targetTurbulence ||
      ctx.smoothParams.targetColorTemp !== targetColorTemp
    ) {
      ctx.smoothParams.startMorphology = ctx.smoothParams.currentMorphology;
      ctx.smoothParams.startTurbulence = ctx.smoothParams.currentTurbulence;
      ctx.smoothParams.startColorTemp = ctx.smoothParams.currentColorTemp;
      ctx.smoothParams.targetMorphology = targetMorphology;
      ctx.smoothParams.targetTurbulence = targetTurbulence;
      ctx.smoothParams.targetColorTemp = targetColorTemp;
      ctx.smoothParams.transitionProgress = 0;
    }
  };

  const updateParticles = (deltaTime: number) => {
    updateSmoothParams();

    if (ctx.smoothParams.transitionProgress < 1) {
      ctx.smoothParams.transitionProgress = Math.min(
        1,
        ctx.smoothParams.transitionProgress + deltaTime / TRANSITION_DURATION
      );
    }

    const easedProgress = easeOutCubic(ctx.smoothParams.transitionProgress);
    ctx.smoothParams.currentMorphology = lerp(
      ctx.smoothParams.startMorphology,
      ctx.smoothParams.targetMorphology,
      easedProgress
    );
    ctx.smoothParams.currentTurbulence = lerp(
      ctx.smoothParams.startTurbulence,
      ctx.smoothParams.targetTurbulence,
      easedProgress
    );
    ctx.smoothParams.currentColorTemp = lerp(
      ctx.smoothParams.startColorTemp,
      ctx.smoothParams.targetColorTemp,
      easedProgress
    );

    const {
      currentMorphology,
      currentTurbulence,
      currentColorTemp,
    } = ctx.smoothParams;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const offset = ctx.noiseOffsets[i];

      const noiseX = sineNoise(ctx.time, offset, 0.5, currentTurbulence * 0.3);
      const noiseY = sineNoise(ctx.time, offset * 1.3, 0.4, currentTurbulence * 0.3);
      const noiseZ = sineNoise(ctx.time, offset * 0.7, 0.3, currentTurbulence * 0.3);

      const pos = interpolatePosition(
        {
          x: ctx.spherePositions[i3],
          y: ctx.spherePositions[i3 + 1],
          z: ctx.spherePositions[i3 + 2],
        },
        {
          x: ctx.spiralPositions[i3],
          y: ctx.spiralPositions[i3 + 1],
          z: ctx.spiralPositions[i3 + 2],
        },
        {
          x: ctx.ringPositions[i3],
          y: ctx.ringPositions[i3 + 1],
          z: ctx.ringPositions[i3 + 2],
        },
        currentMorphology
      );

      ctx.positions[i3] = pos.x + noiseX;
      ctx.positions[i3 + 1] = pos.y + noiseY;
      ctx.positions[i3 + 2] = pos.z + noiseZ;

      const currentRadius = Math.sqrt(
        ctx.positions[i3] ** 2 +
          ctx.positions[i3 + 1] ** 2 +
          ctx.positions[i3 + 2] ** 2
      );
      const color = getParticleColor(currentRadius, NEBULA_RADIUS, currentColorTemp);
      ctx.colors[i3] = color.r;
      ctx.colors[i3 + 1] = color.g;
      ctx.colors[i3 + 2] = color.b;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  };

  const updateRipple = () => {
    if (!ctx.rippleMesh) return;

    const elapsed = (performance.now() - ctx.rippleStartTime) / 1000;
    const duration = 1.2;

    if (elapsed >= duration) {
      ctx.scene.remove(ctx.rippleMesh);
      ctx.rippleMesh = null;
      return;
    }

    const t = elapsed / duration;
    const scale = 5 + t * 75;
    const opacity = 0.8 * (1 - t);

    ctx.rippleMesh.scale.setScalar(scale);
    (ctx.rippleMesh.material as THREE.Material).opacity = opacity;
  };

  const animate = () => {
    requestAnimationFrame(animate);

    const now = performance.now();
    const deltaTime = (now - ctx.lastTime) / 1000;
    ctx.lastTime = now;
    ctx.time += deltaTime;

    ctx.frameCount++;
    ctx.fpsUpdateTime += deltaTime;
    if (ctx.fpsUpdateTime >= 0.5) {
      const fps = Math.round(ctx.frameCount / ctx.fpsUpdateTime);
      ctx.onFpsUpdate(fps);
      ctx.frameCount = 0;
      ctx.fpsUpdateTime = 0;
    }

    if (
      !ctx.isUserInteracting &&
      ctx.hoverStartTime > 0 &&
      now - ctx.hoverStartTime > 1000
    ) {
      particles.rotation.y += ctx.autoRotateSpeed * deltaTime;
    }

    updateParticles(deltaTime);
    updateRipple();

    controls.update();
    renderer.render(scene, camera);
  };

  const handleResize = () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };

  const handleMouseMove = (event: MouseEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    ctx.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    ctx.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    ctx.hoverStartTime = performance.now();
  };

  const handleClick = (event: MouseEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    ctx.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    ctx.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    ctx.raycaster.setFromCamera(ctx.mouse, camera);
    const intersects = ctx.raycaster.intersectObject(particles);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const index = intersects[0].index;

      if (index !== undefined) {
        const i3 = index * 3;
        const x = ctx.positions[i3];
        const y = ctx.positions[i3 + 1];
        const z = ctx.positions[i3 + 2];
        const r = ctx.colors[i3];
        const g = ctx.colors[i3 + 1];
        const b = ctx.colors[i3 + 2];
        const radius = Math.sqrt(x * x + y * y + z * z);

        if (ctx.rippleMesh) {
          ctx.scene.remove(ctx.rippleMesh);
        }

        const rippleGeometry = new THREE.RingGeometry(0.9, 1, 32);
        const rippleMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        });
        ctx.rippleMesh = new THREE.Mesh(rippleGeometry, rippleMaterial);
        ctx.rippleMesh.position.copy(point);
        ctx.rippleMesh.lookAt(camera.position);
        ctx.scene.add(ctx.rippleMesh);
        ctx.rippleStartTime = performance.now();

        ctx.onParticleClick({
          x,
          y,
          z,
          r,
          g,
          b,
          radius,
          screenX: event.clientX,
          screenY: event.clientY,
        });
      }
    } else {
      ctx.onParticleClick(null);
    }
  };

  const handleMouseDown = () => {
    ctx.isUserInteracting = true;
    ctx.hoverStartTime = 0;
  };

  const handleMouseUp = () => {
    ctx.isUserInteracting = false;
    ctx.hoverStartTime = performance.now();
  };

  window.addEventListener('resize', handleResize);

  const dispose = () => {
    window.removeEventListener('resize', handleResize);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    if (ctx.rippleMesh) {
      ctx.rippleMesh.geometry.dispose();
      (ctx.rippleMesh.material as THREE.Material).dispose();
    }
    container.removeChild(renderer.domElement);
  };

  return {
    animate,
    dispose,
    handleMouseMove,
    handleClick,
    handleMouseDown,
    handleMouseUp,
  };
};

export const updateParticles = () => {
  // This is handled internally in the animate loop
};
