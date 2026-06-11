import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { Hero } from './heroManager';
import { Race, getRaceColor, getRaceEmoji, getRaceName } from './heroManager';

export interface RendererConfig {
  container: HTMLElement;
  arenaRadius: number;
}

interface HeroMesh {
  id: string;
  mesh: THREE.Mesh;
  glow: THREE.Mesh;
  buffLight: THREE.PointLight;
}

interface CollisionEffect {
  sprite: THREE.Sprite;
  startTime: number;
  duration: number;
}

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let composer: EffectComposer;
let arenaRadius: number = 8;

let groundMesh: THREE.Mesh;
let boundaryRing: THREE.Mesh;
let heroMeshes: Map<string, HeroMesh> = new Map();
let collisionEffects: CollisionEffect[] = [];
let containerEl: HTMLElement;

let winnerOverlay: HTMLDivElement | null = null;

function createStarParticles(): THREE.Points {
  const starCount = 800;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const radius = 50 + Math.random() * 100;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const colorChoice = Math.random();
    if (colorChoice < 0.6) {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 1.0;
      colors[i * 3 + 2] = 1.0;
    } else if (colorChoice < 0.8) {
      colors[i * 3] = 0.8;
      colors[i * 3 + 1] = 0.6;
      colors[i * 3 + 2] = 1.0;
    } else {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.9;
      colors[i * 3 + 2] = 0.5;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.6,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });

  return new THREE.Points(geometry, material);
}

function createHexagonGround(): THREE.Mesh {
  const shape = new THREE.Shape();
  const outerRadius = arenaRadius;

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * outerRadius;
    const y = Math.sin(angle) * outerRadius;
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  shape.closePath();

  const hexCount = 36;
  for (let ring = 1; ring <= 4; ring++) {
    for (let h = 0; h < hexCount * ring; h++) {
      const baseAngle = (h / (hexCount * ring)) * Math.PI * 2;
      const r = (ring / 5) * outerRadius;
      const holeX = Math.cos(baseAngle) * r;
      const holeY = Math.sin(baseAngle) * r;
      const holeSize = 0.12 * (1 - ring * 0.1);
      const hole = new THREE.Path();
      for (let i = 0; i < 6; i++) {
        const ha = (i / 6) * Math.PI * 2;
        const hx = holeX + Math.cos(ha) * holeSize;
        const hy = holeY + Math.sin(ha) * holeSize;
        if (i === 0) hole.moveTo(hx, hy);
        else hole.lineTo(hx, hy);
      }
      hole.closePath();
      shape.holes.push(hole);
    }
  }

  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.MeshPhongMaterial({
    color: 0x1a0a3e,
    emissive: 0x2a1060,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
    shininess: 80,
    specular: 0x6a30ff
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 0;
  mesh.receiveShadow = true;

  return mesh;
}

function createBoundaryRing(): THREE.Mesh {
  const points: THREE.Vector3[] = [];
  const segments = 128;

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(
      Math.cos(angle) * arenaRadius,
      0.05,
      Math.sin(angle) * arenaRadius
    ));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x66ccff,
    transparent: true,
    opacity: 0.9,
    linewidth: 2
  });

  const line = new THREE.Line(geometry, material) as unknown as THREE.Mesh;
  return line;
}

function createHeroMesh(hero: Hero): HeroMesh {
  const color = getRaceColor(hero.race);

  const sphereGeo = new THREE.SphereGeometry(hero.radius, 32, 32);
  const sphereMat = new THREE.MeshPhongMaterial({
    color,
    shininess: 100,
    specular: 0xffffff,
    emissive: color,
    emissiveIntensity: hero.isBuffed ? 0.5 : 0.1
  });
  const mesh = new THREE.Mesh(sphereGeo, sphereMat);
  mesh.position.set(hero.position.x, hero.radius, hero.position.z);
  mesh.castShadow = true;

  const glowGeo = new THREE.SphereGeometry(hero.radius * 1.3, 24, 24);
  const glowMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: hero.isBuffed ? 0.35 : 0.1,
    side: THREE.BackSide
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.copy(mesh.position);

  const buffLight = new THREE.PointLight(color, hero.isBuffed ? 2.0 : 0.5, 4);
  buffLight.position.copy(mesh.position);

  return { id: hero.id, mesh, glow, buffLight };
}

function createCollisionTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(180, 220, 255, 0.8)');
  gradient.addColorStop(0.6, 'rgba(100, 180, 255, 0.4)');
  gradient.addColorStop(1, 'rgba(50, 120, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

let collisionTexture: THREE.Texture | null = null;

export function init(config: RendererConfig): void {
  containerEl = config.container;
  arenaRadius = config.arenaRadius;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0418, 0.008);

  camera = new THREE.PerspectiveCamera(
    60,
    containerEl.clientWidth / containerEl.clientHeight,
    0.1,
    500
  );
  camera.position.set(0, 12, 16);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(containerEl.clientWidth, containerEl.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  containerEl.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 5;
  controls.maxDistance = 20;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.target.set(0, 0.5, 0);

  const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
  keyLight.position.set(8, 15, 10);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x8866ff, 1.2, 50);
  fillLight.position.set(-10, 8, -8);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xffaa44, 1.0, 50);
  rimLight.position.set(10, 6, -10);
  scene.add(rimLight);

  const stars = createStarParticles();
  scene.add(stars);

  groundMesh = createHexagonGround();
  scene.add(groundMesh);

  boundaryRing = createBoundaryRing();
  scene.add(boundaryRing);

  collisionTexture = createCollisionTexture();

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(containerEl.clientWidth, containerEl.clientHeight),
    0.8,
    0.5,
    0.2
  );
  composer.addPass(bloomPass);

  window.addEventListener('resize', onResize);
}

function onResize(): void {
  if (!containerEl || !camera || !renderer || !composer) return;

  const width = containerEl.clientWidth;
  const height = containerEl.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  composer.setSize(width, height);
}

export function setHeroes(heroes: Hero[]): void {
  heroMeshes.forEach(hm => {
    scene.remove(hm.mesh);
    scene.remove(hm.glow);
    scene.remove(hm.buffLight);
    hm.mesh.geometry.dispose();
    (hm.mesh.material as THREE.Material).dispose();
    hm.glow.geometry.dispose();
    (hm.glow.material as THREE.Material).dispose();
  });
  heroMeshes.clear();

  heroes.forEach(hero => {
    if (!hero.isAlive) return;
    const hm = createHeroMesh(hero);
    heroMeshes.set(hero.id, hm);
    scene.add(hm.mesh);
    scene.add(hm.glow);
    scene.add(hm.buffLight);
  });
}

export function updateHeroes(heroes: Hero[]): void {
  heroes.forEach(hero => {
    const hm = heroMeshes.get(hero.id);
    if (!hm) {
      if (hero.isAlive) {
        const newHm = createHeroMesh(hero);
        heroMeshes.set(hero.id, newHm);
        scene.add(newHm.mesh);
        scene.add(newHm.glow);
        scene.add(newHm.buffLight);
      }
      return;
    }

    if (!hero.isAlive) {
      scene.remove(hm.mesh);
      scene.remove(hm.glow);
      scene.remove(hm.buffLight);
      hm.mesh.geometry.dispose();
      (hm.mesh.material as THREE.Material).dispose();
      hm.glow.geometry.dispose();
      (hm.glow.material as THREE.Material).dispose();
      heroMeshes.delete(hero.id);
      return;
    }

    const meshGeo = hm.mesh.geometry as THREE.SphereGeometry;
    hm.mesh.position.set(hero.position.x, hero.radius, hero.position.z);
    hm.glow.position.copy(hm.mesh.position);
    hm.glow.scale.setScalar(hero.radius / meshGeo.parameters.radius);
    hm.buffLight.position.copy(hm.mesh.position);

    const mat = hm.mesh.material as THREE.MeshPhongMaterial;
    mat.emissiveIntensity = hero.isBuffed ? 0.6 : 0.12;
    (hm.glow.material as THREE.MeshBasicMaterial).opacity = hero.isBuffed ? 0.4 : 0.12;
    hm.buffLight.intensity = hero.isBuffed ? 2.5 : 0.6;

    if (Math.abs(hm.mesh.scale.x - hero.radius / (hm.mesh.geometry as THREE.SphereGeometry).parameters.radius) > 0.01) {
      const scale = hero.radius / (hm.mesh.geometry as THREE.SphereGeometry).parameters.radius;
      hm.mesh.scale.setScalar(scale);
    }
  });
}

export function addCollisionEffect(x: number, z: number): void {
  if (!collisionTexture) return;

  const spriteMat = new THREE.SpriteMaterial({
    map: collisionTexture,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(x, 0.5, z);
  sprite.scale.set(0.5, 0.5, 1);

  scene.add(sprite);
  collisionEffects.push({
    sprite,
    startTime: performance.now(),
    duration: 800
  });
}

export function updateBoundaryPulse(time: number): void {
  if (!boundaryRing) return;

  const pulse = 0.6 + 0.4 * Math.sin((time / 1000) * Math.PI);
  const mat = (boundaryRing as unknown as THREE.Line).material as THREE.LineBasicMaterial;
  mat.opacity = 0.5 + pulse * 0.5;
}

export function updateCollisionEffects(time: number): void {
  for (let i = collisionEffects.length - 1; i >= 0; i--) {
    const effect = collisionEffects[i];
    const elapsed = time - effect.startTime;
    const progress = elapsed / effect.duration;

    if (progress >= 1) {
      scene.remove(effect.sprite);
      (effect.sprite.material as THREE.SpriteMaterial).dispose();
      collisionEffects.splice(i, 1);
      continue;
    }

    const scale = 0.5 + progress * 3.5;
    effect.sprite.scale.set(scale, scale, 1);
    (effect.sprite.material as THREE.SpriteMaterial).opacity = 1 - progress;
  }
}

export function showWinner(race: Race): void {
  hideWinner();

  winnerOverlay = document.createElement('div');
  winnerOverlay.className = 'winner-overlay';
  winnerOverlay.innerHTML = `
    <div class="winner-icon">${getRaceEmoji(race)}</div>
    <div class="winner-title">胜利!</div>
    <div class="winner-subtitle">${getRaceName(race)}族获得最终胜利</div>
  `;

  document.getElementById('app')?.appendChild(winnerOverlay);
}

export function hideWinner(): void {
  if (winnerOverlay) {
    winnerOverlay.remove();
    winnerOverlay = null;
  }
}

export function render(): void {
  controls.update();
  composer.render();
}

export function dispose(): void {
  window.removeEventListener('resize', onResize);
  hideWinner();
  if (renderer) {
    renderer.dispose();
    containerEl?.removeChild(renderer.domElement);
  }
}
