import * as THREE from 'three';
import { createParticleSystem, GENRE_PRESETS } from './particleSystem';
import { createAudioVisualizer } from './audioVisualizer';
import { createUIController } from './uiController';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const particleSystem = createParticleSystem(scene);
const audioVisualizer = createAudioVisualizer(scene);

let currentGenreIndex = 0;

createUIController((genreIndex: number) => {
  currentGenreIndex = genreIndex;
  particleSystem.setGenre(genreIndex);
  audioVisualizer.setBPM(GENRE_PRESETS[genreIndex].bpm);
});

const spherical = { radius: 12, theta: 0, phi: Math.PI / 3 };
const target = new THREE.Vector3(0, 1.5, 0);
let isDragging = false;
const lastMouse = { x: 0, y: 0 };

let targetShake = 0;
let currentShake = 0;

renderer.domElement.addEventListener('mousedown', (e) => {
  isDragging = true;
  lastMouse.x = e.clientX;
  lastMouse.y = e.clientY;
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const dx = e.clientX - lastMouse.x;
  const dy = e.clientY - lastMouse.y;
  spherical.theta -= dx * 0.005;
  spherical.phi = Math.max(
    0.1,
    Math.min(Math.PI - 0.1, spherical.phi + dy * 0.005),
  );
  lastMouse.x = e.clientX;
  lastMouse.y = e.clientY;
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

renderer.domElement.addEventListener('mouseenter', () => {
  targetShake = 1;
});
renderer.domElement.addEventListener('mouseleave', () => {
  targetShake = 0;
  isDragging = false;
});

renderer.domElement.addEventListener('touchstart', (e) => {
  isDragging = true;
  lastMouse.x = e.touches[0].clientX;
  lastMouse.y = e.touches[0].clientY;
});

renderer.domElement.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  const dx = e.touches[0].clientX - lastMouse.x;
  const dy = e.touches[0].clientY - lastMouse.y;
  spherical.theta -= dx * 0.005;
  spherical.phi = Math.max(
    0.1,
    Math.min(Math.PI - 0.1, spherical.phi + dy * 0.005),
  );
  lastMouse.x = e.touches[0].clientX;
  lastMouse.y = e.touches[0].clientY;
  e.preventDefault();
}, { passive: false });

renderer.domElement.addEventListener('touchend', () => {
  isDragging = false;
});

function updateCamera() {
  const r = spherical.radius;
  const sinPhi = Math.sin(spherical.phi);
  camera.position.set(
    r * sinPhi * Math.sin(spherical.theta),
    r * Math.cos(spherical.phi),
    r * sinPhi * Math.cos(spherical.theta),
  );
  camera.lookAt(target);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const deltaTime = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  const time = now / 1000;
  const preset = GENRE_PRESETS[currentGenreIndex];
  const beatFreq = preset.bpm / 60;
  const beatIntensity = Math.pow(Math.sin(time * beatFreq * Math.PI * 2), 2);

  particleSystem.update(deltaTime, beatIntensity);
  audioVisualizer.update(time);

  updateCamera();

  currentShake += (targetShake - currentShake) * Math.min(1, deltaTime / 0.2);
  if (currentShake > 0.01) {
    camera.position.x += Math.sin(time * 40) * 0.015 * currentShake;
    camera.position.y += Math.cos(time * 35) * 0.015 * currentShake;
  }

  renderer.render(scene, camera);
}

animate();
