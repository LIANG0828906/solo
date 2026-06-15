import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createParticleSystem, NebulaParams } from './particleSystem';
import { createUIController } from './uiController';

const defaultParams: NebulaParams = {
  shape: 'spiral',
  density: 30000,
  rotationSpeed: 0.5,
  particleSize: 1.5,
  attenuation: 0.6,
  pulseAmplitude: 0.2,
  colorStart: '#6a0dad',
  colorMid: '#1e90ff',
  colorEnd: '#00ffff'
};

const container = document.getElementById('canvas-container')!;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);
scene.fog = new THREE.FogExp2(0x050510, 0.008);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(0, 30, 100);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 20;
controls.maxDistance = 300;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.5;

const particleSystem = createParticleSystem(defaultParams);
scene.add(particleSystem.group);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const ui = createUIController(defaultParams);

ui.onParamsChange((params) => {
  particleSystem.updateParams(params, true);
});

ui.onTemplateLoad((params) => {
  particleSystem.transitionTo(params, 1);
});

ui.onReset(() => {
  particleSystem.transitionTo(defaultParams, 0.8);
});

const fpsDisplay = document.createElement('div');
fpsDisplay.style.position = 'fixed';
fpsDisplay.style.top = '20px';
fpsDisplay.style.right = '20px';
fpsDisplay.style.color = 'rgba(255,255,255,0.6)';
fpsDisplay.style.fontSize = '12px';
fpsDisplay.style.fontFamily = 'monospace';
fpsDisplay.style.background = 'rgba(10,10,30,0.5)';
fpsDisplay.style.padding = '8px 12px';
fpsDisplay.style.borderRadius = '8px';
fpsDisplay.style.backdropFilter = 'blur(4px)';
fpsDisplay.style.zIndex = '1000';
document.body.appendChild(fpsDisplay);

let lastTime = performance.now();
let frameCount = 0;
let fps = 60;

const animate = () => {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const delta = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  frameCount++;
  if (frameCount % 30 === 0) {
    fps = Math.round(1 / delta);
    const particleCount = particleSystem.getParams().density.toLocaleString();
    fpsDisplay.textContent = `${fps} FPS | ${particleCount} 粒子`;
  }

  const time = currentTime * 0.001;

  particleSystem.update(time, delta);
  controls.update();

  renderer.render(scene, camera);
};

const handleResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
};

window.addEventListener('resize', handleResize);

animate();

console.log(`
✨ 星云粒子生成器已启动!
-----------------------------------
🎨 粒子系统: ${defaultParams.density.toLocaleString()} 个粒子
🎮 控制: 鼠标拖拽旋转, 滚轮缩放
📊 性能目标: 60 FPS
-----------------------------------
🚀 后端API: http://localhost:3001
`);
