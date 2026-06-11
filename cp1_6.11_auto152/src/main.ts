import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DNAHelix } from './dna';

const INITIAL_CAMERA_POSITION = new THREE.Vector3(10, 6, 12);
const INITIAL_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
const ROTATION_PERIOD = 20;
const PARTICLE_COUNT = 300;
const MIN_DISTANCE = 6;
const MAX_DISTANCE = 36;

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let dna: DNAHelix;
let particles: THREE.Points;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let clickTargetMap: Map<THREE.Object3D, number>;
let labelElements: HTMLElement[] = [];
let labelsVisible = true;
let isRotationPaused = false;
let currentHighlightIndex = -1;
let clock: THREE.Clock;
let frameCount = 0;
let lastFpsUpdate = 0;

const canvasContainer = document.getElementById('canvas-container') as HTMLDivElement;
const labelsContainer = document.getElementById('labels-container') as HTMLDivElement;
const fpsCounter = document.getElementById('fps-counter') as HTMLDivElement;
const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
const btnPause = document.getElementById('btn-pause') as HTMLButtonElement;
const btnLabels = document.getElementById('btn-labels') as HTMLButtonElement;

function init(): void {
  scene = new THREE.Scene();
  const canvas = document.createElement('canvas');
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  resizeRenderer();
  canvasContainer.appendChild(canvas);

  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.copy(INITIAL_CAMERA_POSITION);
  camera.lookAt(INITIAL_CAMERA_TARGET);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(INITIAL_CAMERA_TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = MIN_DISTANCE;
  controls.maxDistance = MAX_DISTANCE;
  controls.enablePan = false;
  controls.rotateSpeed = 0.8;
  controls.zoomSpeed = 0.9;
  controls.update();

  createLighting();
  dna = new DNAHelix();
  scene.add(dna.group);

  createParticles();
  clickTargetMap = dna.getAllClickTargets();
  createLabelElements();

  raycaster = new THREE.Raycaster();
  raycaster.params.Points = { threshold: 0 };
  mouse = new THREE.Vector2(-10, -10);
  clock = new THREE.Clock();

  setupEventListeners();
  animate();
}

function createLighting(): void {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0x4FC3F7, 0.8);
  dirLight1.position.set(8, 10, 5);
  dirLight1.castShadow = true;
  dirLight1.shadow.mapSize.width = 1024;
  dirLight1.shadow.mapSize.height = 1024;
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xE040FB, 0.5);
  dirLight2.position.set(-8, 5, -5);
  scene.add(dirLight2);

  const dirLight3 = new THREE.DirectionalLight(0xffffff, 0.3);
  dirLight3.position.set(0, -8, 8);
  scene.add(dirLight3);

  const pointLight1 = new THREE.PointLight(0x4FC3F7, 0.6, 20);
  pointLight1.position.set(0, 5, 0);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xE040FB, 0.6, 20);
  pointLight2.position.set(0, -5, 0);
  scene.add(pointLight2);
}

function createParticles(): void {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const opacities = new Float32Array(PARTICLE_COUNT);

  const colorStart = new THREE.Color(0xffffff);
  const colorEnd = new THREE.Color(0x4FC3F7);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const radius = 8 + Math.random() * 20;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = (Math.random() - 0.7) * 12;
    positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const colorT = Math.random();
    const color = colorStart.clone().lerp(colorEnd, colorT);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    sizes[i] = 2 + Math.random() * 3;
    opacities[i] = 0.3 + Math.random() * 0.4;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

  const material = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    depthWrite: false,
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

function createLabelElements(): void {
  const pairCount = dna.getPairCount();
  for (let i = 0; i < pairCount; i++) {
    const labelData = dna.getLabelText(i);
    const labelEl = document.createElement('div');
    labelEl.className = 'base-label';
    labelEl.innerHTML = `
      <div class="label-title">${labelData.title}</div>
      <div class="label-detail">${labelData.detail.replace(/\n/g, '<br>')}</div>
    `;
    labelsContainer.appendChild(labelEl);
    labelElements.push(labelEl);
  }
  updateLabelsVisibility();
}

function updateLabelsVisibility(): void {
  labelElements.forEach((el) => {
    if (labelsVisible) {
      el.classList.add('visible');
    } else {
      el.classList.remove('visible');
    }
  });
}

function setupEventListeners(): void {
  window.addEventListener('resize', onWindowResize);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('mouseleave', onMouseLeave);

  btnReset.addEventListener('click', onResetCamera);
  btnPause.addEventListener('click', onTogglePause);
  btnLabels.addEventListener('click', onToggleLabels);
}

function onWindowResize(): void {
  resizeRenderer();
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function resizeRenderer(): void {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
}

function onMouseMove(event: MouseEvent): void {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function onMouseLeave(): void {
  mouse.set(-10, -10);
  if (currentHighlightIndex >= 0) {
    dna.clearAllHighlights();
    currentHighlightIndex = -1;
  }
}

function onResetCamera(): void {
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const duration = 800;
  const startTime = performance.now();

  function animateReset(currentTime: number): void {
    const elapsed = currentTime - startTime;
    const t = Math.min(elapsed / duration, 1);
    const easeT = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    camera.position.lerpVectors(startPos, INITIAL_CAMERA_POSITION, easeT);
    controls.target.lerpVectors(startTarget, INITIAL_CAMERA_TARGET, easeT);
    controls.update();

    if (t < 1) {
      requestAnimationFrame(animateReset);
    }
  }

  requestAnimationFrame(animateReset);
}

function onTogglePause(): void {
  isRotationPaused = !isRotationPaused;
  if (isRotationPaused) {
    btnPause.textContent = '继续旋转';
    btnPause.classList.add('active');
  } else {
    btnPause.textContent = '暂停旋转';
    btnPause.classList.remove('active');
  }
}

function onToggleLabels(): void {
  labelsVisible = !labelsVisible;
  if (labelsVisible) {
    btnLabels.textContent = '隐藏标签';
    btnLabels.classList.remove('active');
  } else {
    btnLabels.textContent = '显示标签';
    btnLabels.classList.add('active');
  }
  updateLabelsVisibility();
}

function handleHover(): void {
  if (mouse.x === -10 && mouse.y === -10) {
    if (currentHighlightIndex >= 0) {
      dna.clearAllHighlights();
      currentHighlightIndex = -1;
    }
    return;
  }

  raycaster.setFromCamera(mouse, camera);
  const clickTargets = Array.from(clickTargetMap.keys());
  const intersects = raycaster.intersectObjects(clickTargets, false);

  if (intersects.length > 0) {
    const hitObj = intersects[0].object;
    const pairIndex = clickTargetMap.get(hitObj);
    if (pairIndex !== undefined && pairIndex !== currentHighlightIndex) {
      dna.highlight(pairIndex);
      currentHighlightIndex = pairIndex;
    }
  } else {
    if (currentHighlightIndex >= 0) {
      dna.clearAllHighlights();
      currentHighlightIndex = -1;
    }
  }
}

function updateLabels(): void {
  const pairCount = dna.getPairCount();
  for (let i = 0; i < pairCount; i++) {
    const worldPos = dna.getBasePairWorldPosition(i);
    const screenPos = worldPos.clone().project(camera);

    const isHighlighted = (i === currentHighlightIndex);
    const isInFront = screenPos.z < 1;
    const labelEl = labelElements[i];

    if (labelEl) {
      if (isHighlighted && isInFront && labelsVisible) {
        labelEl.classList.add('visible');
        const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
        labelEl.style.left = `${x}px`;
        labelEl.style.top = `${y - 60}px`;
      } else if (!labelsVisible) {
        labelEl.classList.remove('visible');
      } else if (currentHighlightIndex === -1 || !isInFront || i !== currentHighlightIndex) {
        labelEl.classList.remove('visible');
      }
    }
  }
}

function animate(): void {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  if (!isRotationPaused) {
    const rotationSpeed = (Math.PI * 2) / ROTATION_PERIOD;
    dna.group.rotation.y += rotationSpeed * delta;
  }

  particles.rotation.y += delta * 0.02;
  particles.rotation.x += delta * 0.01;

  handleHover();
  updateLabels();
  controls.update();
  renderer.render(scene, camera);

  updateFPS(elapsed);
}

function updateFPS(elapsed: number): void {
  frameCount++;
  if (elapsed - lastFpsUpdate >= 0.5) {
    const fps = Math.round(frameCount / (elapsed - lastFpsUpdate));
    fpsCounter.textContent = `${fps} FPS`;
    frameCount = 0;
    lastFpsUpdate = elapsed;
  }
}

init();
