import * as THREE from 'three';
import { createParticleEmitter, type ParticleEmitter, type SimulationParams } from './particleEmitter';
import { createUIControl, type UIControl } from './uiControl';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let emitter: ParticleEmitter;
let ui: UIControl;
let animationId: number;
let lastTime: number = 0;

function init() {
  const container = document.getElementById('canvas-container')!;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(12, 10, 18);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0x00D4FF, 1, 50);
  pointLight1.position.set(10, 10, 10);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xFF3366, 0.5, 50);
  pointLight2.position.set(-10, -5, 5);
  scene.add(pointLight2);

  createGridAndAxes();
  createBoundary();
  setupOrbitControls();

  emitter = createParticleEmitter(scene);

  const uiContainer = document.getElementById('ui-container')!;
  ui = createUIControl(uiContainer, {
    onParamsChange: (params: Partial<SimulationParams>) => {
      emitter.setParams(params);
    },
    onReset: () => {
      emitter.reset();
    },
    onTogglePause: () => {
      const current = emitter.getCurrentParams();
      emitter.setParams({ isPaused: !current.isPaused });
    },
    onToggleEmit: () => {
      const current = emitter.getCurrentParams();
      emitter.setParams({ isEmitting: !current.isEmitting });
    }
  });

  window.addEventListener('resize', onWindowResize);

  lastTime = performance.now();
  animate();
}

function createGridAndAxes() {
  const gridHelper = new THREE.GridHelper(40, 40, 0x1E293B, 0x0F172A);
  gridHelper.position.y = -10;
  scene.add(gridHelper);

  const axesGroup = new THREE.Group();

  const xGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(8, 0, 0)
  ]);
  const xMat = new THREE.LineBasicMaterial({ color: 0xFF3366 });
  const xAxis = new THREE.Line(xGeom, xMat);
  axesGroup.add(xAxis);

  const yGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 8, 0)
  ]);
  const yMat = new THREE.LineBasicMaterial({ color: 0x00FF88 });
  const yAxis = new THREE.Line(yGeom, yMat);
  axesGroup.add(yAxis);

  const zGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 12)
  ]);
  const zMat = new THREE.LineBasicMaterial({ color: 0x00D4FF });
  const zAxis = new THREE.Line(zGeom, zMat);
  axesGroup.add(zAxis);

  scene.add(axesGroup);
}

function createBoundary() {
  const boundaryGeom = new THREE.SphereGeometry(20, 32, 32);
  const boundaryMat = new THREE.MeshBasicMaterial({
    color: 0x334155,
    wireframe: true,
    transparent: true,
    opacity: 0.1
  });
  const boundary = new THREE.Mesh(boundaryGeom, boundaryMat);
  scene.add(boundary);
}

function setupOrbitControls() {
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let spherical = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 24 };
  const target = new THREE.Vector3(0, 0, 0);

  function updateCamera() {
    camera.position.x = target.x + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    camera.position.y = target.y + spherical.radius * Math.cos(spherical.phi);
    camera.position.z = target.z + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    camera.lookAt(target);
  }

  renderer.domElement.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    spherical.theta -= deltaX * 0.01;
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - deltaY * 0.01));

    previousMousePosition = { x: e.clientX, y: e.clientY };
    updateCamera();
  });

  renderer.domElement.addEventListener('wheel', (e) => {
    e.preventDefault();
    spherical.radius = Math.max(5, Math.min(60, spherical.radius + e.deltaY * 0.02));
    updateCamera();
  }, { passive: false });

  let touchStartDist = 0;
  let touchStartPos = { x: 0, y: 0 };

  renderer.domElement.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDist = Math.sqrt(dx * dx + dy * dy);
    }
  }, { passive: false });

  renderer.domElement.addEventListener('touchend', () => {
    isDragging = false;
  });

  renderer.domElement.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      const deltaX = e.touches[0].clientX - touchStartPos.x;
      const deltaY = e.touches[0].clientY - touchStartPos.y;

      spherical.theta -= deltaX * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - deltaY * 0.01));

      touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      updateCamera();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = touchStartDist - dist;
      spherical.radius = Math.max(5, Math.min(60, spherical.radius + delta * 0.05));
      touchStartDist = dist;
      updateCamera();
    }
  }, { passive: false });

  updateCamera();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  animationId = requestAnimationFrame(animate);

  const currentTime = performance.now();
  const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.05);
  lastTime = currentTime;

  emitter.update(deltaTime, currentTime);

  ui.updateStats(emitter.getParticleCount(), emitter.getEmitRate());

  renderer.render(scene, camera);
}

init();
