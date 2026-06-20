import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ParticleSystem } from './particleSystem';
import { AudioEngine } from './audioEngine';
import { UIController } from './uiController';

const container = document.getElementById('app')!;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(0, 0, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x0a0a1a);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 3;
controls.maxDistance = 40;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0, 0.4, 0.85
);
composer.addPass(bloomPass);

const ps = new ParticleSystem();
scene.add(ps.points);

const audio = new AudioEngine();
let frozen = false;

const ui = new UIController(audio, ps, (v: boolean) => {
  frozen = v;
  ps.setBloom(v ? 1.0 : 0.0);
  bloomPass.strength = v ? 1.5 : 0;
});

let prevTime = performance.now();

function animate(now: number) {
  requestAnimationFrame(animate);
  const _dt = (now - prevTime) / 1000;
  prevTime = now;
  controls.update();

  if (!frozen && !ps.transitioning) {
    const freq = audio.getFrequencyData();
    if (freq.length > 0) {
      ps.updateFromFrequency(freq);
    }
  }

  if (bloomPass.strength > 0) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}

animate(performance.now());

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
