import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import {
  MOLECULE_DATABASE,
  buildMolecule,
  disposeMolecule,
  MoleculeGroup,
} from './moleculeLoader';
import { setupInteraction } from './interaction';
import { setupUI, showLoading, hideLoading, updateStats } from './ui';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let labelRenderer: CSS2DRenderer;
let moleculeRoot: THREE.Group;
let currentMolecule: MoleculeGroup | null = null;
let autoRotate = true;
const AUTO_ROTATE_SPEED = 0.5 * (Math.PI / 180);

const clock = new THREE.Clock();

function init() {
  const container = document.getElementById('canvas-container')!;
  const labelContainer = document.getElementById('label-container')!;

  scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.FogExp2(0x0b1020, 0.035);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.5, 5);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  const labelDom = labelRenderer.domElement;
  labelDom.style.position = 'absolute';
  labelDom.style.top = '0';
  labelDom.style.left = '0';
  labelDom.style.pointerEvents = 'none';
  labelContainer.appendChild(labelDom);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.minDistance = 0.5;
  controls.maxDistance = 10;
  controls.enablePan = false;
  controls.rotateSpeed = 0.8;
  controls.zoomSpeed = 0.9;
  controls.autoRotate = false;

  moleculeRoot = new THREE.Group();
  moleculeRoot.name = 'moleculeRoot';
  scene.add(moleculeRoot);

  setupLighting();
  setupEnvironment();
  setupStarfield();

  setupUI({
    onMoleculeChange: loadMolecule,
    onViewChange: animateCameraView,
    getCamera: () => camera,
    getControls: () => controls,
  });

  setupInteraction({
    getScene: () => scene,
    getCamera: () => camera,
    getAtomGroup: () => currentMolecule?.atomGroup || null,
    getCurrentMolecule: () => currentMolecule,
    renderer,
  });

  window.addEventListener('resize', onResize, { passive: true });

  loadMolecule('water');
  animate();
}

function setupLighting() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x88aaff, 0x223355, 0.55);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(5, 8, 6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 50;
  keyLight.shadow.camera.left = -8;
  keyLight.shadow.camera.right = 8;
  keyLight.shadow.camera.top = 8;
  keyLight.shadow.camera.bottom = -8;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.radius = 4;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x6688ff, 0.35);
  fillLight.position.set(-6, 3, -4);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0x00ff88, 0.2);
  rimLight.position.set(0, -5, 4);
  scene.add(rimLight);
}

function setupEnvironment() {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  const gradientGeo = new THREE.SphereGeometry(50, 32, 32);
  const envCanvas = document.createElement('canvas');
  envCanvas.width = 512;
  envCanvas.height = 512;
  const ctx = envCanvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#1a2a55');
  grad.addColorStop(0.5, '#0f1835');
  grad.addColorStop(1, '#080c1e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = `rgba(200, 220, 255, ${Math.random() * 0.5 + 0.2})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 1.5 + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  const envTex = new THREE.CanvasTexture(envCanvas);
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  envTex.colorSpace = THREE.SRGBColorSpace;
  const envMap = pmremGenerator.fromEquirectangular(envTex).texture;
  scene.environment = envMap;
  envTex.dispose();
  pmremGenerator.dispose();
}

function setupStarfield() {
  const starCount = 600;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);

  const color = new THREE.Color();
  for (let i = 0; i < starCount; i++) {
    const radius = 25 + Math.random() * 35;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    const tint = 0.7 + Math.random() * 0.3;
    const blueness = 0.75 + Math.random() * 0.25;
    color.setRGB(tint, tint * 0.85, tint * blueness);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = Math.random() * 1.8 + 0.5;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const starMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
      attribute float size;
      varying vec3 vColor;
      uniform float time;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float twinkle = 0.8 + 0.2 * sin(time * 2.0 + position.x * 0.5);
        gl_PointSize = size * (200.0 / -mvPosition.z) * twinkle;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, dist);
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
  });

  const stars = new THREE.Points(starGeo, starMat);
  stars.name = 'stars';
  stars.userData.shaderMat = starMat;
  scene.add(stars);
}

function clearCurrentMolecule() {
  if (currentMolecule) {
    moleculeRoot.remove(currentMolecule.atomGroup);
    moleculeRoot.remove(currentMolecule.bondGroup);
    disposeMolecule(currentMolecule);
    currentMolecule = null;
  }
}

function loadMolecule(id: string) {
  const data = MOLECULE_DATABASE[id];
  if (!data) return;

  showLoading();

  setTimeout(() => {
    clearCurrentMolecule();

    const molecule = buildMolecule(data);
    currentMolecule = molecule;
    moleculeRoot.add(molecule.atomGroup);
    moleculeRoot.add(molecule.bondGroup);

    const bbox = new THREE.Box3().setFromObject(molecule.atomGroup);
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 2);
    const fitDist = maxDim * 2.2;

    camera.position.set(0, fitDist * 0.35, fitDist);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.maxDistance = Math.max(fitDist * 3.5, 10);
    controls.minDistance = Math.max(fitDist * 0.2, 0.5);
    controls.update();

    moleculeRoot.rotation.y = 0;
    moleculeRoot.rotation.x = 0;

    updateStats({
      formula: data.formula,
      name: data.name,
      atoms: molecule.atomCount,
      bonds: molecule.bondCount,
    });

    hideLoading();
  }, 650);
}

type ViewType = 'top' | 'front' | 'side';

function animateCameraView(view: ViewType) {
  const bbox = currentMolecule
    ? new THREE.Box3().setFromObject(currentMolecule.atomGroup)
    : new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));
  const size = bbox.getSize(new THREE.Vector3());
  const dist = Math.max(size.x, size.y, size.z, 2) * 2.5;

  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  let endPos: THREE.Vector3;
  const endTarget = new THREE.Vector3(0, 0, 0);

  switch (view) {
    case 'top':
      endPos = new THREE.Vector3(0, dist, 0.001);
      break;
    case 'front':
      endPos = new THREE.Vector3(0, 0, dist);
      break;
    case 'side':
      endPos = new THREE.Vector3(dist, 0, 0);
      break;
  }

  const duration = 1000;
  const startTime = performance.now();
  autoRotate = false;

  function easeInOutCubic(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function step() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(t);

    camera.position.lerpVectors(startPos, endPos, eased);
    controls.target.lerpVectors(startTarget, endTarget, eased);
    controls.update();

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      setTimeout(() => {
        autoRotate = true;
      }, 400);
    }
  }

  step();
}

let resizeTimeout: number | undefined;
function onResize() {
  if (resizeTimeout) window.clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
  }, 100);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (autoRotate && !controls.enableDamping) {
    moleculeRoot.rotation.y += AUTO_ROTATE_SPEED;
  } else if (autoRotate) {
    moleculeRoot.rotation.y += AUTO_ROTATE_SPEED * 0.6;
  }

  const stars = scene.getObjectByName('stars') as THREE.Points | undefined;
  if (stars && stars.userData.shaderMat) {
    (stars.userData.shaderMat as THREE.ShaderMaterial).uniforms.time.value = clock.elapsedTime;
    stars.rotation.y += 0.005 * delta;
  }

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

init();

export { scene, camera, renderer, controls, labelRenderer, currentMolecule };
