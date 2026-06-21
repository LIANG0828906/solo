import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Ocean } from './ocean';
import { DynamicSun } from './sun';
import { BuoySystem } from './buoys';

const INITIAL_CAMERA_POS = new THREE.Vector3(0, 18, 45);
const INITIAL_TARGET = new THREE.Vector3(0, 0, 0);

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let clock: THREE.Clock;
let ocean: Ocean;
let sun: DynamicSun;
let buoys: BuoySystem;
let stars: THREE.Points;

let resettingCamera = false;
let resetProgress = 0;
const resetStartPos = new THREE.Vector3();
const resetStartTarget = new THREE.Vector3();

let pendingMouseX: number | null = null;

function createSkyTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#0A0E27');
  gradient.addColorStop(1, '#1E3A5F');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 512);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

function createStars(scene: THREE.Scene): THREE.Points {
  const starCount = 800;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);
  const alphas = new Float32Array(starCount);
  const phases = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    const radius = 300 + Math.random() * 200;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.max(-1, Math.min(1, 2 * Math.random() * 0.5 - 0.0)));
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.abs(radius * Math.cos(phi)) + 20;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    sizes[i] = 0.1 + Math.random() * 0.2;
    alphas[i] = 0.3 + Math.random() * 0.7;
    phases[i] = Math.random() * Math.PI * 2;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  const starCanvas = document.createElement('canvas');
  starCanvas.width = 64;
  starCanvas.height = 64;
  const sctx = starCanvas.getContext('2d')!;
  const sgrad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  sgrad.addColorStop(0, 'rgba(255,255,255,1)');
  sgrad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
  sgrad.addColorStop(1, 'rgba(255,255,255,0)');
  sctx.fillStyle = sgrad;
  sctx.fillRect(0, 0, 64, 64);
  const starTex = new THREE.CanvasTexture(starCanvas);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTexture: { value: starTex }
    },
    vertexShader: `
      attribute float aSize;
      attribute float aAlpha;
      attribute float aPhase;
      uniform float uTime;
      varying float vAlpha;
      varying float vBaseAlpha;
      void main() {
        vBaseAlpha = aAlpha;
        float twinkle = 0.6 + 0.4 * sin(uTime * 1.5 + aPhase);
        vAlpha = aAlpha * twinkle;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * 300.0 / -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      varying float vAlpha;
      varying float vBaseAlpha;
      void main() {
        vec4 tex = texture2D(uTexture, gl_PointCoord);
        gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha * tex.a);
        if (gl_FragColor.a < 0.02) discard;
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);
  return points;
}

function init(): void {
  const container = document.getElementById('app')!;

  scene = new THREE.Scene();
  scene.background = createSkyTexture();
  scene.fog = new THREE.Fog(0x0A0E27, 120, 250);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.copy(INITIAL_CAMERA_POS);
  camera.lookAt(INITIAL_TARGET);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 10;
  controls.maxDistance = 150;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.target.copy(INITIAL_TARGET);
  controls.update();

  clock = new THREE.Clock();

  ocean = new Ocean(scene);
  sun = new DynamicSun(scene);
  buoys = new BuoySystem(scene, 25);
  stars = createStars(scene);

  bindUIEvents();
  bindWindowEvents();

  animate();
}

function bindUIEvents(): void {
  const amplitudeSlider = document.getElementById('amplitude') as HTMLInputElement;
  const frequencySlider = document.getElementById('frequency') as HTMLInputElement;
  const ampValue = document.getElementById('amp-value')!;
  const freqValue = document.getElementById('freq-value')!;
  const resetBtn = document.getElementById('reset-camera')!;

  amplitudeSlider.addEventListener('input', (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    ocean.setAmplitude(val);
    ampValue.textContent = val.toFixed(1);
  });

  frequencySlider.addEventListener('input', (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    ocean.setFrequency(val);
    freqValue.textContent = val.toFixed(1);
  });

  resetBtn.addEventListener('click', () => {
    resetStartPos.copy(camera.position);
    resetStartTarget.copy(controls.target);
    resetProgress = 0;
    resettingCamera = true;
  });
}

function bindWindowEvents(): void {
  window.addEventListener('resize', onWindowResize);

  let rafId = 0;
  window.addEventListener('mousemove', (e) => {
    pendingMouseX = e.clientX / window.innerWidth;
    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        if (pendingMouseX !== null && sun) {
          sun.setAngleByMouseX(pendingMouseX);
        }
        rafId = 0;
      });
    }
  });
}

function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function updateCameraReset(delta: number): void {
  if (!resettingCamera) return;
  resetProgress += delta * 1.8;
  if (resetProgress >= 1) {
    resetProgress = 1;
    resettingCamera = false;
    camera.position.copy(INITIAL_CAMERA_POS);
    controls.target.copy(INITIAL_TARGET);
    controls.update();
    return;
  }
  const t = easeInOutCubic(resetProgress);
  camera.position.lerpVectors(resetStartPos, INITIAL_CAMERA_POS, t);
  controls.target.lerpVectors(resetStartTarget, INITIAL_TARGET, t);
  controls.update();
}

function animate(): void {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  if (!resettingCamera) {
    controls.update();
  } else {
    updateCameraReset(delta);
  }

  ocean.update(time);
  sun.update(delta);
  buoys.update(time, ocean);

  if ((stars.material as THREE.ShaderMaterial).uniforms) {
    (stars.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
  }

  renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', init);
