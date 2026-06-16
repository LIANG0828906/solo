import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import AuraWeave from './AuraWeave';
import { ControlPanel } from './ControlPanel';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let auraWeave: AuraWeave;
let controlPanel: ControlPanel;

const clock = new THREE.Clock();
let frameCount = 0;
let lastFpsTime = 0;

function init(): void {
  const container = document.getElementById('app')!;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 18);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.5;
  controls.enablePan = false;
  controls.minDistance = 8;
  controls.maxDistance = 40;
  controls.autoRotate = false;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  auraWeave = new AuraWeave(scene, camera, renderer);

  controlPanel = new ControlPanel({
    onTwistSpeedChange: (v) => auraWeave.setTwistSpeed(v),
    onColorSpeedChange: (v) => auraWeave.setColorSpeed(v),
    onRecoveryTimeChange: (v) => auraWeave.setRecoveryTime(v),
    onPresetChange: (p) => auraWeave.setPreset(p)
  });

  window.addEventListener('resize', onResize);
  requestAnimationFrame(animate);
}

function onResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(): void {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);

  auraWeave.update(dt);
  controls.update();

  renderer.render(scene, camera);

  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    const fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
    if (fps < 50) {
      console.warn(`AuraWeave FPS: ${fps} (低于预期)`);
    }
    frameCount = 0;
    lastFpsTime = now;
  }
}

init();
