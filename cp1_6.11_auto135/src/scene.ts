import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export let scene: THREE.Scene;
export let camera: THREE.PerspectiveCamera;
export let renderer: THREE.WebGLRenderer;
export let controls: OrbitControls;
export let raycaster: THREE.Raycaster;
export let mouse: THREE.Vector2;
export let starParticles: THREE.Points;

export function initScene(container: HTMLElement): void {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(15, 12, 15);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 8;
  controls.maxDistance = 30;
  controls.minPolarAngle = 0.52;
  controls.maxPolarAngle = 1.57;
  controls.maxAzimuthAngle = Infinity;
  controls.minAzimuthAngle = -Infinity;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
  };
  controls.screenSpacePanning = false;
  controls.panSpeed = 0.5;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 0.8, 100);
  pointLight.position.set(10, 20, 10);
  pointLight.castShadow = true;
  pointLight.shadow.mapSize.width = 2048;
  pointLight.shadow.mapSize.height = 2048;
  scene.add(pointLight);

  const groundGeometry = new THREE.PlaneGeometry(30, 30);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.8,
    metalness: 0.2
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const gridHelper = new THREE.GridHelper(30, 30, 0x555555, 0x555555);
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);

  createStarParticles();

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
}

function createStarParticles(): void {
  const starCount = 50;
  const positions = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);
  const opacities = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 60;
    positions[i3 + 1] = Math.random() * 30 + 5;
    positions[i3 + 2] = (Math.random() - 0.5) * 60;

    sizes[i] = Math.random() * 1.5 + 0.5;
    opacities[i] = Math.random() * 0.5 + 0.3;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const starTexture = new THREE.CanvasTexture(canvas);

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1,
    map: starTexture,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  starParticles = new THREE.Points(geometry, material);
  scene.add(starParticles);
}

export function updateStars(time: number): void {
  const opacities = starParticles.geometry.attributes.opacity.array as Float32Array;
  const sizes = starParticles.geometry.attributes.size.array as Float32Array;
  
  for (let i = 0; i < opacities.length; i++) {
    const flicker = Math.sin(time * 2 + i * 0.5) * 0.2 + 0.8;
    opacities[i] = opacities[i] * flicker;
    sizes[i] = sizes[i] * (1 + Math.sin(time * 3 + i) * 0.1);
  }
  
  starParticles.geometry.attributes.opacity.needsUpdate = true;
  starParticles.geometry.attributes.size.needsUpdate = true;
}

export function handleResize(container: HTMLElement): void {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}
