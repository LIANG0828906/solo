import { audioManager } from './audio';
import { particleSystem } from './particle';
import { uiManager } from './controls';
import type { FrequencyData } from './types.d';

let scene: any = null;
let camera: any = null;
let renderer: any = null;
let container: HTMLElement | null = null;

let cameraAngle = 0;
const CAMERA_RADIUS = 45;
const CAMERA_HEIGHT = 5;
const CAMERA_SPEED = (Math.PI * 2) / 10;

let lastTime = 0;
let freqData: FrequencyData = { low: 0.3, mid: 0.3, high: 0.3 };
let hasAudio = false;
let animationId: number | null = null;
let idleTime = 0;

function init(): void {
  container = document.getElementById('canvas-container');
  if (!container) return;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  updateCameraPosition(0);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  particleSystem.init(scene);

  uiManager.init(document.getElementById('app')!, particleSystem.getThemeNames());
  uiManager.setVolume(audioManager.getVolume());

  setupEventListeners();
  animate();
}

function setupEventListeners(): void {
  uiManager.onFileLoad(async (file: File) => {
    try {
      await audioManager.loadFile(file);
      audioManager.play();
      uiManager.setPlaying(true);
      hasAudio = true;
    } catch (e) {
      console.error('Failed to load audio:', e);
    }
  });

  uiManager.onPlayPause(() => {
    if (audioManager.getDuration() === 0) return;
    audioManager.togglePlay();
    uiManager.setPlaying(audioManager.getIsPlaying());
  });

  uiManager.onVolumeChange((volume: number) => {
    audioManager.setVolume(volume);
  });

  uiManager.onProgressChange((time: number) => {
    audioManager.setProgress(time);
  });

  uiManager.onThemeChange((theme: string) => {
    particleSystem.setTheme(theme);
  });

  audioManager.onFrequency((data: FrequencyData) => {
    freqData = data;
  });

  audioManager.onProgress((time: number, duration: number) => {
    uiManager.updateProgress(time, duration);
  });

  window.addEventListener('resize', onWindowResize);
}

function updateCameraPosition(delta: number): void {
  if (!camera) return;
  cameraAngle += CAMERA_SPEED * delta;
  const x = Math.cos(cameraAngle) * CAMERA_RADIUS;
  const z = Math.sin(cameraAngle) * CAMERA_RADIUS;
  camera.position.set(x, CAMERA_HEIGHT, z);
  camera.lookAt(0, 0, 0);
}

function onWindowResize(): void {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  particleSystem.resize();
}

function animate(): void {
  animationId = requestAnimationFrame(animate);

  const currentTime = performance.now() / 1000;
  const delta = lastTime ? Math.min(currentTime - lastTime, 0.1) : 0;
  lastTime = currentTime;

  updateCameraPosition(delta);

  if (!hasAudio) {
    idleTime += delta;
    const t = idleTime;
    freqData.low = 0.25 + Math.sin(t * 0.8) * 0.1 + Math.sin(t * 1.3) * 0.05;
    freqData.mid = 0.3 + Math.sin(t * 1.1) * 0.08 + Math.sin(t * 0.7) * 0.05;
    freqData.high = 0.35 + Math.sin(t * 1.5) * 0.07 + Math.sin(t * 0.9) * 0.05;
  }

  particleSystem.update(delta, freqData);

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

window.addEventListener('DOMContentLoaded', init);
