import * as THREE from 'three';
import { createArmillaryRings, createCelestialSphere, generateStars, createStarPoints, StarData, Constellation } from './orb';
import { ParticleSystem, FlyingStar } from './particles';
import { useStore } from '../store';

export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  armillary: THREE.Group;
  celestialSphere: THREE.Mesh;
  stars: StarData[];
  starPoints: THREE.Points;
  particleSystem: ParticleSystem;
  flyingStar: FlyingStar;
  constellationLines: Map<string, THREE.Line>;
  trailLine: THREE.Line | null;
}

let ctx: SceneContext | null = null;
let animationId: number = 0;
let lastTime: number = 0;
let mouseDown: boolean = false;
let lastMouseX: number = 0;
let lastMouseY: number = 0;
let rotationVelocityX: number = 0;
let rotationVelocityY: number = 0;
const DAMPING = 0.95;

export const CONSTELLATIONS: Constellation[] = [
  {
    id: 'beidou',
    name: '北斗',
    chineseName: '北斗七星',
    meaning: '帝王之车',
    iconPath: 'beidou',
    stars: generateConstellationStars([
      [-0.3, 0.8, 1.8],
      [-0.15, 0.75, 1.83],
      [0.0, 0.7, 1.85],
      [0.15, 0.65, 1.82],
      [0.3, 0.55, 1.8],
      [0.42, 0.45, 1.78],
      [0.5, 0.35, 1.75],
    ]),
  },
  {
    id: 'orion',
    name: '参宿',
    chineseName: '参宿',
    meaning: '西方白虎',
    iconPath: 'orion',
    stars: generateConstellationStars([
      [0.0, 0.5, 1.88],
      [-0.2, 0.3, 1.9],
      [0.2, 0.3, 1.88],
      [-0.1, 0.1, 1.92],
      [0.1, 0.1, 1.91],
      [0.0, -0.1, 1.9],
      [-0.25, -0.3, 1.87],
      [0.25, -0.3, 1.86],
    ]),
  },
  {
    id: 'xiong',
    name: '大熊',
    chineseName: '大熊座',
    meaning: '北斗所在',
    iconPath: 'xiong',
    stars: generateConstellationStars([
      [-0.8, 0.6, 1.7],
      [-0.6, 0.65, 1.75],
      [-0.4, 0.5, 1.8],
      [-0.3, 0.3, 1.85],
      [-0.5, 0.2, 1.82],
      [-0.7, 0.3, 1.78],
      [-0.75, 0.45, 1.72],
    ]),
  },
  {
    id: 'xiehu',
    name: '蝎虎',
    chineseName: '蝎虎座',
    meaning: '北天星座',
    iconPath: 'xiehu',
    stars: generateConstellationStars([
      [0.5, 0.8, 1.7],
      [0.65, 0.6, 1.72],
      [0.7, 0.4, 1.7],
      [0.6, 0.25, 1.75],
      [0.5, 0.1, 1.8],
    ]),
  },
  {
    id: 'shizi',
    name: '狮子',
    chineseName: '狮子座',
    meaning: '王者之星',
    iconPath: 'shizi',
    stars: generateConstellationStars([
      [0.8, 0.2, 1.65],
      [0.7, 0.4, 1.7],
      [0.55, 0.45, 1.75],
      [0.45, 0.35, 1.8],
      [0.55, 0.15, 1.82],
      [0.7, 0.0, 1.8],
      [0.85, -0.1, 1.75],
    ]),
  },
  {
    id: 'chunu',
    name: '处女',
    chineseName: '处女座',
    meaning: '丰收女神',
    iconPath: 'chunu',
    stars: generateConstellationStars([
      [-0.9, 0.0, 1.65],
      [-0.75, -0.15, 1.7],
      [-0.6, -0.25, 1.75],
      [-0.5, -0.4, 1.8],
      [-0.65, -0.55, 1.78],
      [-0.85, -0.45, 1.72],
    ]),
  },
  {
    id: 'shuangzi',
    name: '双子',
    chineseName: '双子座',
    meaning: '孪生兄弟',
    iconPath: 'shuangzi',
    stars: generateConstellationStars([
      [0.3, 0.9, 1.75],
      [0.5, 0.85, 1.72],
      [0.35, 0.65, 1.8],
      [0.55, 0.6, 1.78],
      [0.42, 0.4, 1.82],
      [0.25, 0.3, 1.85],
      [0.6, 0.25, 1.8],
    ]),
  },
  {
    id: 'juxie',
    name: '巨蟹',
    chineseName: '巨蟹座',
    meaning: '天蟹星座',
    iconPath: 'juxie',
    stars: generateConstellationStars([
      [-0.5, 0.9, 1.7],
      [-0.35, 0.75, 1.78],
      [-0.2, 0.85, 1.75],
      [-0.3, 0.6, 1.82],
      [-0.45, 0.5, 1.8],
    ]),
  },
];

function generateConstellationStars(positions: number[][]): StarData[] {
  return positions.map((p, i) => ({
    position: new THREE.Vector3(p[0], p[1], p[2]),
    magnitude: 1.5 + Math.random() * 1.5,
    color: new THREE.Color(0xe0f0ff).lerp(new THREE.Color(0xfff8dc), i / positions.length),
  }));
}

export function initScene(container: HTMLElement): SceneContext {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  scene.fog = new THREE.FogExp2(0x1a1a2e, 0.08);

  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffeedd, 1.0);
  mainLight.position.set(2, 3, 4);
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0x8899ff, 0.4);
  fillLight.position.set(-3, -1, -2);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xffd700, 0.8, 10);
  rimLight.position.set(0, 2, -3);
  scene.add(rimLight);

  const armillary = createArmillaryRings();
  scene.add(armillary);

  const celestialSphere = createCelestialSphere();
  scene.add(celestialSphere);

  const stars = generateStars(200);
  const starPoints = createStarPoints(stars);
  scene.add(starPoints);

  const particleSystem = new ParticleSystem();
  scene.add(particleSystem.mesh);

  const flyingStar = new FlyingStar();
  scene.add(flyingStar.getMesh());

  const constellationLines = new Map<string, THREE.Line>();
  const trailLine: THREE.Line | null = null;

  const nebulaGeometry = new THREE.BufferGeometry();
  const nebulaCount = 500;
  const nebulaPositions = new Float32Array(nebulaCount * 3);
  const nebulaColors = new Float32Array(nebulaCount * 3);
  for (let i = 0; i < nebulaCount; i++) {
    const r = 2.5 + Math.random() * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    nebulaPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    nebulaPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    nebulaPositions[i * 3 + 2] = r * Math.cos(phi);
    const c = new THREE.Color().setHSL(0.6 + Math.random() * 0.2, 0.5, 0.3);
    nebulaColors[i * 3] = c.r;
    nebulaColors[i * 3 + 1] = c.g;
    nebulaColors[i * 3 + 2] = c.b;
  }
  nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(nebulaPositions, 3));
  nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(nebulaColors, 3));
  const nebulaMaterial = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
  nebula.name = 'nebula';
  scene.add(nebula);

  ctx = {
    scene,
    camera,
    renderer,
    armillary,
    celestialSphere,
    stars,
    starPoints,
    particleSystem,
    flyingStar,
    constellationLines,
    trailLine,
  };

  setupMouseControls(container, armillary);
  setupStoreListeners();
  animate();

  window.addEventListener('resize', () => onResize(container));

  return ctx;
}

function setupMouseControls(container: HTMLElement, armillary: THREE.Group): void {
  container.addEventListener('mousedown', (e) => {
    if ((e.target as HTMLElement).closest('.ui-panel')) return;
    mouseDown = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });

  window.addEventListener('mouseup', () => {
    mouseDown = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (!mouseDown) return;

    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;

    rotationVelocityY = deltaX * 0.005;
    rotationVelocityX = deltaY * 0.005;

    armillary.rotation.y += rotationVelocityY;
    armillary.rotation.x += rotationVelocityX;
    armillary.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, armillary.rotation.x));

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });

  container.addEventListener('touchstart', (e) => {
    if ((e.target as HTMLElement).closest('.ui-panel')) return;
    if (e.touches.length === 1) {
      mouseDown = true;
      lastMouseX = e.touches[0].clientX;
      lastMouseY = e.touches[0].clientY;
    }
  });

  container.addEventListener('touchend', () => {
    mouseDown = false;
  });

  container.addEventListener('touchmove', (e) => {
    if (!mouseDown || e.touches.length !== 1) return;
    e.preventDefault();

    const deltaX = e.touches[0].clientX - lastMouseX;
    const deltaY = e.touches[0].clientY - lastMouseY;

    rotationVelocityY = deltaX * 0.005;
    rotationVelocityX = deltaY * 0.005;

    armillary.rotation.y += rotationVelocityY;
    armillary.rotation.x += rotationVelocityX;
    armillary.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, armillary.rotation.x));

    lastMouseX = e.touches[0].clientX;
    lastMouseY = e.touches[0].clientY;
  });
}

function setupStoreListeners(): void {
  let prevConnected = useStore.getState().connectedConstellations;
  let prevBrightness = useStore.getState().starBrightness;
  let prevDensity = useStore.getState().nebulaDensity;

  useStore.subscribe((state) => {
    if (state.connectedConstellations !== prevConnected) {
      prevConnected = state.connectedConstellations;
      updateConstellationLines(state.connectedConstellations);
    }

    if (state.starBrightness !== prevBrightness) {
      prevBrightness = state.starBrightness;
      if (ctx) {
        const material = ctx.starPoints.material as THREE.ShaderMaterial;
        if (material.uniforms && material.uniforms.brightness) {
          material.uniforms.brightness.value = state.starBrightness;
        }
      }
    }

    if (state.nebulaDensity !== prevDensity) {
      prevDensity = state.nebulaDensity;
      if (ctx) {
        const nebula = ctx.scene.getObjectByName('nebula') as THREE.Points;
        if (nebula) {
          (nebula.material as THREE.PointsMaterial).opacity = state.nebulaDensity * 0.6;
        }
      }
    }
  });
}

function updateConstellationLines(ids: string[]): void {
  if (!ctx) return;

  ctx.constellationLines.forEach((line) => {
    ctx!.scene.remove(line);
  });
  ctx.constellationLines.clear();

  ids.forEach((id) => {
    const constellation = CONSTELLATIONS.find((c) => c.id === id);
    if (!constellation) return;

    const positions: number[] = [];
    constellation.stars.forEach((star) => {
      positions.push(star.position.x, star.position.y, star.position.z);
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.8,
      linewidth: 1.5,
    });

    const line = new THREE.Line(geometry, material);
    ctx!.scene.add(line);
    ctx!.constellationLines.set(id, line);
  });
}

export function createTrailPath(points: THREE.Vector3[], colorStart: string, colorEnd: string): void {
  if (!ctx) return;

  if (ctx.trailLine) {
    ctx.scene.remove(ctx.trailLine);
  }

  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const curvePoints = curve.getPoints(100);

  const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);

  const colors: number[] = [];
  const startColor = new THREE.Color(colorStart);
  const endColor = new THREE.Color(colorEnd);
  for (let i = 0; i < curvePoints.length; i++) {
    const t = i / (curvePoints.length - 1);
    const c = startColor.clone().lerp(endColor, t);
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
  });

  const line = new THREE.Line(geometry, material);
  ctx.scene.add(line);
  ctx.trailLine = line;

  ctx.flyingStar.setPath(points);
  ctx.flyingStar.setOnConstellationPass((index) => {
    if (!ctx) return;
    const ids = useStore.getState().connectedConstellations;
    const constellation = CONSTELLATIONS.find((c) => c.id === ids[index]);
    if (constellation) {
      const centerStar = constellation.stars[Math.floor(constellation.stars.length / 2)];
      const burstPos = centerStar.position.clone();
      ctx.particleSystem.burst(burstPos, constellation.stars[0].color, 30);
      playClickSound();
    }
  });
}

export function startFlyingStar(): void {
  if (!ctx) return;
  ctx.flyingStar.start();
}

export function stopFlyingStar(): void {
  if (!ctx) return;
  ctx.flyingStar.stop();
}

export function rotateToView(points: THREE.Vector3[]): void {
  if (!ctx || points.length === 0) return;

  const center = new THREE.Vector3();
  points.forEach((p) => center.add(p));
  center.divideScalar(points.length);

  const targetRotationY = Math.atan2(center.x, center.z);
  const targetRotationX = -Math.asin(center.y / center.length());

  const startY = ctx.armillary.rotation.y;
  const startX = ctx.armillary.rotation.x;
  const duration = 1000;
  const startTime = performance.now();

  function animateRotation(): void {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);

    ctx!.armillary.rotation.y = startY + (targetRotationY - startY) * eased;
    ctx!.armillary.rotation.x = startX + (targetRotationX - startX) * eased;

    if (t < 1) {
      requestAnimationFrame(animateRotation);
    }
  }

  animateRotation();
}

export function getSceneContext(): SceneContext | null {
  return ctx;
}

function onResize(container: HTMLElement): void {
  if (!ctx) return;
  ctx.camera.aspect = container.clientWidth / container.clientHeight;
  ctx.camera.updateProjectionMatrix();
  ctx.renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate(): void {
  animationId = requestAnimationFrame(animate);

  const now = performance.now();
  const deltaTime = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (!ctx) return;

  if (!mouseDown) {
    ctx.armillary.rotation.y += rotationVelocityY;
    ctx.armillary.rotation.x += rotationVelocityX;
    ctx.armillary.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, ctx.armillary.rotation.x));
    rotationVelocityX *= DAMPING;
    rotationVelocityY *= DAMPING;
  }

  ctx.armillary.rotation.y += 0.0005;

  ctx.particleSystem.update(deltaTime);
  ctx.flyingStar.update(deltaTime);

  ctx.renderer.render(ctx.scene, ctx.camera);
}

let audioContext: AudioContext | null = null;

export function playClickSound(): void {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  const ctxAudio = audioContext;
  const oscillator = ctxAudio.createOscillator();
  const gainNode = ctxAudio.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(400, ctxAudio.currentTime);
  oscillator.frequency.linearRampToValueAtTime(800, ctxAudio.currentTime + 0.05);
  oscillator.frequency.linearRampToValueAtTime(600, ctxAudio.currentTime + 0.1);

  gainNode.gain.setValueAtTime(0.1, ctxAudio.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctxAudio.currentTime + 0.1);

  oscillator.connect(gainNode);
  gainNode.connect(ctxAudio.destination);

  oscillator.start(ctxAudio.currentTime);
  oscillator.stop(ctxAudio.currentTime + 0.1);
}

export function disposeScene(): void {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (ctx) {
    ctx.renderer.dispose();
    ctx = null;
  }
}
