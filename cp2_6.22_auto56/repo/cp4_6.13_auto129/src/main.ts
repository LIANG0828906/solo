import * as THREE from 'three';

type LightMode = 'breath' | 'pulse' | 'flicker';

interface BuildingData {
  x: number;
  z: number;
  height: number;
  width: number;
  depth: number;
  color: THREE.Color;
  topColor: THREE.Color;
  topEmissive: THREE.Color;
  parts: { type: 'box' | 'cylinder'; geo: { w: number; h: number; d: number; y: number; r?: number; sides?: number } }[];
  lightStripCount: number;
  lightStripPerStrip: number;
}

interface LightStripData {
  buildingIdx: number;
  localX: number;
  localZ: number;
  face: number;
  cubes: { y: number; baseH: number; baseS: number; baseL: number; phase: number; period: number }[];
}

const BUILDING_COUNT = 50;
const GRID_SIZE = 8;
const SPACING = 3.5;
const MIN_HEIGHT = 2;
const MAX_HEIGHT = 20;
const MIN_WIDTH = 1;
const MAX_WIDTH = 3;
const MIN_LIGHT_CUBES_PER_STRIP = 6;
const MAX_LIGHT_CUBES_PER_STRIP = 12;
const MAX_VERTS = 150000;

const COLOR_START = new THREE.Color(0xff6b35);
const COLOR_MID = new THREE.Color(0xff3366);
const COLOR_END = new THREE.Color(0x3a1c71);

function lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  return new THREE.Color().copy(a).lerp(b, t);
}

function getDuskColor(t: number): THREE.Color {
  if (t < 0.5) return lerpColor(COLOR_START, COLOR_MID, t * 2);
  return lerpColor(COLOR_MID, COLOR_END, (t - 0.5) * 2);
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

const app = document.getElementById('app') as HTMLDivElement;
if (!app) throw new Error('no app container');

let width = window.innerWidth;
let height = window.innerHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050514);
scene.fog = new THREE.Fog(0x050514, 40, 90);

const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 500);
const initialCamRadius = 28;
let camRadius = initialCamRadius;
let camTheta = Math.PI * 0.25;
let camPhi = Math.PI * 0.35;
let camPanX = 0;
let camPanY = 2;

function updateCamera() {
  camRadius = clamp(camRadius, 5, 50);
  camPhi = clamp(camPhi, 0.1, Math.PI * 0.48);
  const x = camPanX + camRadius * Math.sin(camPhi) * Math.cos(camTheta);
  const y = camPanY + camRadius * Math.cos(camPhi);
  const z = camRadius * Math.sin(camPhi) * Math.sin(camTheta);
  camera.position.set(x, y, z);
  camera.lookAt(camPanX, camPanY - 2, 0);
}
updateCamera();

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(width, height);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
app.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0x404080, 0.35));
const dirLight = new THREE.DirectionalLight(0xffaa66, 0.6);
dirLight.position.set(20, 30, 10);
scene.add(dirLight);
const rimLight = new THREE.DirectionalLight(0x4466ff, 0.4);
rimLight.position.set(-20, 15, -15);
scene.add(rimLight);

function buildStars(): THREE.Points {
  const starCount = 1200;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = rand(80, 180);
    const theta = rand(0, Math.PI * 2);
    const phi = rand(0.1, Math.PI * 0.48);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi) + 20;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    const c = new THREE.Color().setHSL(rand(0.55, 0.75), 0.3, rand(0.6, 0.95));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
    depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}
scene.add(buildStars());

const groundGeo = new THREE.CircleGeometry(80, 48);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x0a0a1a,
  roughness: 0.95,
  metalness: 0.05,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.01;
scene.add(ground);

function generateBuildings(): BuildingData[] {
  const buildings: BuildingData[] = [];
  const usedPositions = new Set<string>();

  for (let i = 0; i < BUILDING_COUNT; i++) {
    let x = 0, z = 0, key = '';
    let attempts = 0;
    do {
      x = Math.round(rand(-GRID_SIZE, GRID_SIZE));
      z = Math.round(rand(-GRID_SIZE, GRID_SIZE));
      key = `${x},${z}`;
      attempts++;
    } while (usedPositions.has(key) && attempts < 200);
    if (usedPositions.has(key)) {
      i--;
      continue;
    }
    usedPositions.add(key);

    const height = rand(MIN_HEIGHT, MAX_HEIGHT);
    const w = rand(MIN_WIDTH, MAX_WIDTH);
    const d = rand(MIN_WIDTH, MAX_WIDTH);
    const colorT = Math.random();
    const baseColor = getDuskColor(colorT);
    const topEmissive = getDuskColor(rand(0, 1)).multiplyScalar(1.4);

    const parts: BuildingData['parts'] = [];
    const partCount = Math.random() < 0.35 ? 2 : 1;
    let curY = 0;
    let curW = w, curD = d;

    for (let p = 0; p < partCount; p++) {
      const isLast = p === partCount - 1;
      const useCylinder = Math.random() < 0.35 && p === 0;
      const ph = isLast ? height - curY : rand(height * 0.35, height * 0.7) - curY;
      if (useCylinder) {
        const r = Math.min(curW, curD) * 0.48;
        const sides = Math.random() < 0.5 ? 6 : 8;
        parts.push({ type: 'cylinder', geo: { w: curW, h: ph, d: curD, y: curY + ph / 2, r, sides } });
      } else {
        parts.push({ type: 'box', geo: { w: curW, h: ph, d: curD, y: curY + ph / 2 } });
      }
      curY += ph;
      if (!isLast) {
        curW = Math.max(0.8, curW * rand(0.6, 0.85));
        curD = Math.max(0.8, curD * rand(0.6, 0.85));
      }
    }

    buildings.push({
      x: x * SPACING,
      z: z * SPACING,
      height,
      width: w,
      depth: d,
      color: baseColor,
      topColor: baseColor.clone().multiplyScalar(1.15),
      topEmissive,
      parts,
      lightStripCount: 2 + Math.floor(Math.random() * 3),
      lightStripPerStrip: Math.floor(rand(MIN_LIGHT_CUBES_PER_STRIP, MAX_LIGHT_CUBES_PER_STRIP)),
    });
  }
  return buildings;
}

const buildings = generateBuildings();

const buildingColorsArr: number[] = [];
const buildingTopEmissiveArr: number[] = [];
buildings.forEach((b) => {
  buildingColorsArr.push(b.color.r, b.color.g, b.color.b);
  buildingTopEmissiveArr.push(b.topEmissive.r, b.topEmissive.g, b.topEmissive.b);
});

function estimateVerts(): number {
  let total = 0;
  buildings.forEach((b) => {
    b.parts.forEach((p) => {
      if (p.type === 'box') total += 24;
      else total += (p.geo.sides || 6) * 4 + 2 * (p.geo.sides || 6);
    });
    total += 24;
    total += b.lightStripCount * b.lightStripPerStrip * 24;
  });
  total += 1200;
  return total;
}
console.log('Estimated vertices:', estimateVerts());

function buildBuildingInstancedMeshes(): { group: THREE.Group; topMeshes: THREE.Mesh[] } {
  const group = new THREE.Group();
  const topMeshes: THREE.Mesh[] = [];

  const boxPartCounts: number[] = [];
  buildings.forEach((b) => {
    let c = 0;
    b.parts.forEach((p) => { if (p.type === 'box') c++; });
    boxPartCounts.push(c);
  });
  const totalBoxParts = boxPartCounts.reduce((a, b) => a + b, 0);

  if (totalBoxParts > 0) {
    const perBoxGeo = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
    const mesh = new THREE.InstancedMesh(perBoxGeo, new THREE.MeshStandardMaterial({
      roughness: 0.55, metalness: 0.35, vertexColors: false,
    }), totalBoxParts);
    const dummy = new THREE.Object3D();
    const colors = new Float32Array(totalBoxParts * 3);
    let idx = 0;
    buildings.forEach((b) => {
      b.parts.forEach((p) => {
        if (p.type !== 'box') return;
        dummy.position.set(b.x + (rand(-0.02, 0.02)), p.geo.y, b.z + (rand(-0.02, 0.02)));
        dummy.scale.set(p.geo.w, p.geo.h, p.geo.d);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);
        const c = b.color;
        colors[idx * 3] = c.r;
        colors[idx * 3 + 1] = c.g;
        colors[idx * 3 + 2] = c.b;
        idx++;
      });
    });
    mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  }

  const cylSidesCounts = new Map<number, number>();
  buildings.forEach((b) => {
    b.parts.forEach((p) => {
      if (p.type === 'cylinder') {
        const s = p.geo.sides || 6;
        cylSidesCounts.set(s, (cylSidesCounts.get(s) || 0) + 1);
      }
    });
  });

  cylSidesCounts.forEach((count, sides) => {
    const geo = new THREE.CylinderGeometry(1, 1, 1, sides, 1, false);
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({
      roughness: 0.5, metalness: 0.4,
    }), count);
    const colors = new Float32Array(count * 3);
    const dummy = new THREE.Object3D();
    let idx = 0;
    buildings.forEach((b) => {
      b.parts.forEach((p) => {
        if (p.type !== 'cylinder' || (p.geo.sides || 6) !== sides) return;
        dummy.position.set(b.x, p.geo.y, b.z);
        dummy.scale.set((p.geo.r || 1) * 2, p.geo.h, (p.geo.r || 1) * 2);
        dummy.rotation.set(0, rand(0, Math.PI / sides), 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);
        colors[idx * 3] = b.color.r;
        colors[idx * 3 + 1] = b.color.g;
        colors[idx * 3 + 2] = b.color.b;
        idx++;
      });
    });
    mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  });

  const topBlockGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
  const topMesh = new THREE.InstancedMesh(topBlockGeo, new THREE.MeshStandardMaterial({
    emissiveIntensity: 2.2,
    roughness: 0.2, metalness: 0.5,
  }), buildings.length);
  const topColors = new Float32Array(buildings.length * 3);
  const topEmissives = new Float32Array(buildings.length * 3);
  const dummy = new THREE.Object3D();
  buildings.forEach((b, i) => {
    dummy.position.set(b.x, b.height + 0.3, b.z);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    topMesh.setMatrixAt(i, dummy.matrix);
    topColors[i * 3] = b.topColor.r;
    topColors[i * 3 + 1] = b.topColor.g;
    topColors[i * 3 + 2] = b.topColor.b;
    topEmissives[i * 3] = b.topEmissive.r;
    topEmissives[i * 3 + 1] = b.topEmissive.g;
    topEmissives[i * 3 + 2] = b.topEmissive.b;
  });
  topMesh.instanceColor = new THREE.InstancedBufferAttribute(topColors, 3);
  (topMesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0xffffff);
  const topEmissiveAttr = new THREE.InstancedBufferAttribute(topEmissives, 3);
  topMesh.geometry.setAttribute('aEmissive', topEmissiveAttr);
  topMesh.onBeforeRender = (_r, _s, _m, _g, mat) => {
    (mat as THREE.MeshStandardMaterial).emissive.copy(buildings[0].topEmissive);
  };
  topMesh.instanceMatrix.needsUpdate = true;
  group.add(topMesh);
  topMeshes.push(topMesh);

  return { group, topMeshes };
}

const { group: buildingGroup } = buildBuildingInstancedMeshes();
scene.add(buildingGroup);

function generateLightStrips(): LightStripData[] {
  const strips: LightStripData[] = [];
  buildings.forEach((b, bi) => {
    for (let s = 0; s < b.lightStripCount; s++) {
      const face = s % 4;
      const t = (s + 1) / (b.lightStripCount + 1);
      let lx = 0, lz = 0;
      const offW = (t - 0.5) * b.width;
      const offD = (t - 0.5) * b.depth;
      switch (face) {
        case 0: lx = offW; lz = -b.depth / 2 - 0.01; break;
        case 1: lx = offW; lz = b.depth / 2 + 0.01; break;
        case 2: lx = -b.width / 2 - 0.01; lz = offD; break;
        case 3: lx = b.width / 2 + 0.01; lz = offD; break;
      }
      const cubes: LightStripData['cubes'] = [];
      for (let c = 0; c < b.lightStripPerStrip; c++) {
        const cy = (c + 0.5) * (b.height / b.lightStripPerStrip) + 0.05;
        const baseH = rand(0, 1);
        cubes.push({
          y: cy,
          baseH,
          baseS: rand(0.75, 1),
          baseL: rand(0.45, 0.7),
          phase: rand(0, Math.PI * 2),
          period: rand(2, 5),
        });
      }
      strips.push({ buildingIdx: bi, localX: lx, localZ: lz, face, cubes });
    }
  });
  return strips;
}

const lightStrips = generateLightStrips();
const totalLightCubes = lightStrips.reduce((s, st) => s + st.cubes.length, 0);

const lightCubeGeo = new THREE.BoxGeometry(0.09, 0.12, 0.09);
const lightCubeMat = new THREE.MeshStandardMaterial({
  emissiveIntensity: 3.0,
  roughness: 0.3,
  metalness: 0.1,
});

const lightInstancedMesh = new THREE.InstancedMesh(lightCubeGeo, lightCubeMat, totalLightCubes);
lightInstancedMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(totalLightCubes * 3), 3);

const lightCubeDummy = new THREE.Object3D();
let lightCubeIdx = 0;
const lightCubeRefs: { strip: LightStripData; cubeIdx: number; instIdx: number }[] = [];

lightStrips.forEach((strip) => {
  const b = buildings[strip.buildingIdx];
  strip.cubes.forEach((cube, ci) => {
    lightCubeDummy.position.set(b.x + strip.localX, cube.y, b.z + strip.localZ);
    lightCubeDummy.scale.set(1, 1, 1);
    lightCubeDummy.updateMatrix();
    lightInstancedMesh.setMatrixAt(lightCubeIdx, lightCubeDummy.matrix);

    const baseColor = new THREE.Color().setHSL(cube.baseH, cube.baseS, cube.baseL);
    const colors = lightInstancedMesh.instanceColor!.array as Float32Array;
    colors[lightCubeIdx * 3] = baseColor.r;
    colors[lightCubeIdx * 3 + 1] = baseColor.g;
    colors[lightCubeIdx * 3 + 2] = baseColor.b;

    lightCubeRefs.push({ strip, cubeIdx: ci, instIdx: lightCubeIdx });
    lightCubeIdx++;
  });
});
lightInstancedMesh.instanceMatrix.needsUpdate = true;
lightInstancedMesh.instanceColor!.needsUpdate = true;
scene.add(lightInstancedMesh);

let currentLightMode: LightMode = 'breath';
let targetLightMode: LightMode = 'breath';
let modeTransitionT = 1;
const MODE_TRANSITION_DURATION = 1;

const MODE_NAMES: Record<LightMode, string> = {
  breath: '慢速呼吸',
  pulse: '快速脉冲',
  flicker: '随机闪烁',
};

function computeBrightness(mode: LightMode, time: number, phase: number, period: number, cubeIdx: number): number {
  switch (mode) {
    case 'breath': {
      const speed = 0.5;
      return 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * speed + phase));
    }
    case 'pulse': {
      const speed = 3.5;
      const v = Math.sin(time * speed + phase);
      return 0.2 + 0.8 * Math.max(0, v);
    }
    case 'flicker': {
      const seed = cubeIdx * 97.13 + Math.floor(time * 4);
      const r = Math.abs(Math.sin(seed * 12.9898) * 43758.5453 % 1);
      const smooth = (Math.sin(time * 8 + phase * 2) + 1) * 0.5;
      return 0.25 + 0.75 * (r * 0.6 + smooth * 0.4);
    }
  }
}

function computeHueShift(mode: LightMode, time: number, phase: number, cubeIdx: number): number {
  switch (mode) {
    case 'breath': return Math.sin(time * 0.3 + phase) * 0.08;
    case 'pulse': return Math.sin(time * 1.5 + phase * 1.3 + cubeIdx * 0.1) * 0.18;
    case 'flicker': {
      const seed = cubeIdx * 31.7 + Math.floor(time * 6 + phase);
      const r = Math.abs(Math.sin(seed * 78.233) * 43758.5453 % 1);
      return (r - 0.5) * 0.4;
    }
  }
}

function updateLightShow(time: number, dt: number) {
  if (modeTransitionT < 1) {
    modeTransitionT = Math.min(1, modeTransitionT + dt / MODE_TRANSITION_DURATION);
    if (modeTransitionT >= 1) currentLightMode = targetLightMode;
  }

  const colors = lightInstancedMesh.instanceColor!.array as Float32Array;
  const emissiveArr = new Float32Array(totalLightCubes * 3);

  for (let i = 0; i < lightCubeRefs.length; i++) {
    const ref = lightCubeRefs[i];
    const cube = ref.strip.cubes[ref.cubeIdx];
    const instIdx = ref.instIdx;

    let brightCur = computeBrightness(currentLightMode, time, cube.phase, cube.period, ref.cubeIdx);
    let hueCur = computeHueShift(currentLightMode, time, cube.phase, ref.cubeIdx);

    let b: number, h: number;
    if (modeTransitionT < 1) {
      const brightTarget = computeBrightness(targetLightMode, time, cube.phase, cube.period, ref.cubeIdx);
      const hueTarget = computeHueShift(targetLightMode, time, cube.phase, ref.cubeIdx);
      const t = modeTransitionT;
      b = brightCur * (1 - t) + brightTarget * t;
      h = hueCur * (1 - t) + hueTarget * t;
    } else {
      b = brightCur;
      h = hueCur;
    }

    const finalH = (cube.baseH + h + 1) % 1;
    const finalL = 0.2 + cube.baseL * b;
    const finalS = cube.baseS;
    const col = new THREE.Color().setHSL(finalH, finalS, finalL);

    colors[instIdx * 3] = col.r;
    colors[instIdx * 3 + 1] = col.g;
    colors[instIdx * 3 + 2] = col.b;

    emissiveArr[instIdx * 3] = col.r * 1.5;
    emissiveArr[instIdx * 3 + 1] = col.g * 1.5;
    emissiveArr[instIdx * 3 + 2] = col.b * 1.5;
  }

  lightInstancedMesh.instanceColor!.needsUpdate = true;
  (lightCubeMat as THREE.MeshStandardMaterial).emissive = new THREE.Color(0xffffff);
  lightInstancedMesh.geometry.setAttribute('aEmissive', new THREE.InstancedBufferAttribute(emissiveArr, 3));
}

function setLightMode(mode: LightMode) {
  if (mode === targetLightMode && modeTransitionT >= 1) return;
  if (modeTransitionT >= 1) {
    currentLightMode = targetLightMode;
  } else {
    const t = modeTransitionT;
    currentLightMode = (Math.random() < 0.5 ? 'breath' : targetLightMode) as LightMode;
  }
  targetLightMode = mode;
  modeTransitionT = 0;
  updateModeLabels();
  updateControlButtons();
}

let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
const keys: Record<string, boolean> = {};

renderer.domElement.addEventListener('mousedown', (e) => {
  isDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    camTheta -= dx * 0.005;
    camPhi += dy * 0.004;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    updateCamera();
  }
  updateHaloAngle(e.clientX, e.clientY);
});

renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  camRadius += e.deltaY * 0.02;
  camRadius = clamp(camRadius, 5, 50);
  updateCamera();
}, { passive: false });

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'r') cycleLightMode();
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

const MODES_ORDER: LightMode[] = ['breath', 'pulse', 'flicker'];
function cycleLightMode() {
  const cur = modeTransitionT >= 1 ? targetLightMode : targetLightMode;
  const idx = MODES_ORDER.indexOf(cur);
  setLightMode(MODES_ORDER[(idx + 1) % MODES_ORDER.length]);
}

function updateCameraPan(dt: number) {
  const speed = 12 * dt;
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  if (keys['w']) camPanY += speed;
  if (keys['s']) camPanY -= speed;
  if (keys['a']) camPanX -= right.x * speed;
  if (keys['d']) camPanX += right.x * speed;
  camPanY = clamp(camPanY, -5, 25);
  camPanX = clamp(camPanX, -30, 30);
  updateCamera();
}

const fpsEl = document.createElement('div');
fpsEl.style.cssText = `
  position: absolute;
  left: 16px;
  bottom: 16px;
  color: #e0e6ff;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  background: rgba(10, 10, 30, 0.55);
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid rgba(120, 140, 255, 0.25);
  backdrop-filter: blur(6px);
  pointer-events: none;
  line-height: 1.6;
  z-index: 10;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
`;
app.appendChild(fpsEl);

function updateFPSDisplay(fps: number, mode: LightMode) {
  fpsEl.innerHTML = `<div style="color: #7ee8fa; font-weight: bold;">FPS: ${fps.toFixed(0)}</div>
    <div style="color: #ffb07a; margin-top: 2px;">模式: ${MODE_NAMES[mode]}</div>
    <div style="color: #9ba6c4; font-size: 11px; margin-top: 4px;">R 切换模式 · WASD 平移 · 拖拽旋转 · 滚轮缩放</div>`;
}

function updateModeLabels() {
  const displayMode = modeTransitionT >= 1 ? targetLightMode : targetLightMode;
  updateFPSDisplay(currentFps, displayMode);
}

const controlPanel = document.createElement('div');
controlPanel.style.cssText = `
  position: absolute;
  right: 20px;
  bottom: 20px;
  width: 170px;
  height: 170px;
  z-index: 10;
`;
app.appendChild(controlPanel);

const haloCanvas = document.createElement('canvas');
haloCanvas.width = 340;
haloCanvas.height = 340;
haloCanvas.style.cssText = `
  position: absolute;
  left: -85px;
  top: -85px;
  width: 340px;
  height: 340px;
  pointer-events: none;
  border-radius: 50%;
`;
controlPanel.appendChild(haloCanvas);
const haloCtx = haloCanvas.getContext('2d')!;

const wheelBase = document.createElement('div');
wheelBase.style.cssText = `
  position: absolute;
  left: 10px;
  top: 10px;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(100, 120, 220, 0.22), rgba(20, 10, 50, 0.7) 60%, rgba(10, 5, 30, 0.9));
  border: 1px solid rgba(160, 180, 255, 0.35);
  backdrop-filter: blur(10px);
  box-shadow: inset 0 0 30px rgba(120, 100, 255, 0.18), 0 8px 32px rgba(0, 0, 0, 0.5);
`;
controlPanel.appendChild(wheelBase);

const buttonDefs: { mode: LightMode; label: string; angle: number }[] = [
  { mode: 'breath', label: '呼吸', angle: -Math.PI / 2 },
  { mode: 'pulse', label: '脉冲', angle: Math.PI / 6 },
  { mode: 'flicker', label: '闪烁', angle: Math.PI * 5 / 6 },
];

const btnEls: { mode: LightMode; el: HTMLDivElement }[] = [];
buttonDefs.forEach((def) => {
  const btn = document.createElement('div');
  const r = 52;
  const cx = 75 + Math.cos(def.angle) * r;
  const cy = 75 + Math.sin(def.angle) * r;
  btn.style.cssText = `
    position: absolute;
    left: ${cx - 28}px;
    top: ${cy - 28}px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    color: #d4dbff;
    background: radial-gradient(circle, rgba(80, 100, 200, 0.5), rgba(30, 20, 80, 0.7));
    border: 1px solid rgba(150, 170, 255, 0.5);
    user-select: none;
    transition: all 0.25s ease;
    text-shadow: 0 0 8px rgba(120, 150, 255, 0.5);
  `;
  btn.textContent = def.label;
  btn.addEventListener('click', () => setLightMode(def.mode));
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.12)';
    btn.style.background = 'radial-gradient(circle, rgba(120, 140, 255, 0.7), rgba(60, 40, 140, 0.8))';
    btn.style.boxShadow = '0 0 20px rgba(120, 140, 255, 0.6)';
    btn.dataset.hover = '1';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
    if (btn.dataset.active !== '1') {
      btn.style.background = 'radial-gradient(circle, rgba(80, 100, 200, 0.5), rgba(30, 20, 80, 0.7))';
      btn.style.boxShadow = 'none';
    }
    btn.dataset.hover = '';
  });
  controlPanel.appendChild(btn);
  btnEls.push({ mode: def.mode, el: btn });
});

const centerLabel = document.createElement('div');
centerLabel.style.cssText = `
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  color: #aab4dd;
  text-align: center;
  pointer-events: none;
  line-height: 1.4;
`;
centerLabel.innerHTML = `<div style="font-weight:bold;color:#c8d0ff;">灯光</div><div style="font-size:10px;">模式</div>`;
controlPanel.appendChild(centerLabel);

function updateControlButtons() {
  btnEls.forEach((b) => {
    if (b.mode === targetLightMode) {
      b.el.dataset.active = '1';
      b.el.style.background = 'radial-gradient(circle, rgba(255, 150, 100, 0.8), rgba(200, 60, 80, 0.85))';
      b.el.style.boxShadow = '0 0 24px rgba(255, 120, 80, 0.7)';
      b.el.style.color = '#fff8f0';
    } else {
      b.el.dataset.active = '';
      if (b.el.dataset.hover !== '1') {
        b.el.style.background = 'radial-gradient(circle, rgba(80, 100, 200, 0.5), rgba(30, 20, 80, 0.7))';
        b.el.style.boxShadow = 'none';
        b.el.style.color = '#d4dbff';
      }
    }
  });
}
updateControlButtons();

let hoverAngle = -Math.PI / 2;
let targetHoverAngle = -Math.PI / 2;
let haloPulseT = 0;

function updateHaloAngle(mouseX: number, mouseY: number) {
  const rect = controlPanel.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = mouseX - cx;
  const dy = mouseY - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 10 && dist < 250) {
    targetHoverAngle = Math.atan2(dy, dx);
  }
}

function drawHalo(time: number) {
  haloPulseT += 0.02;
  const diff = targetHoverAngle - hoverAngle;
  hoverAngle += diff * 0.08;

  const w = haloCanvas.width, h = haloCanvas.height;
  haloCtx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const baseR = 145;
  const pulse = 0.85 + 0.15 * Math.sin(haloPulseT * 4);

  haloCtx.save();
  haloCtx.translate(cx, cy);
  haloCtx.rotate(hoverAngle);

  const grad = haloCtx.createRadialGradient(0, -baseR, 0, 0, -baseR, 80);
  grad.addColorStop(0, `rgba(255, 180, 120, ${0.7 * pulse})`);
  grad.addColorStop(0.3, `rgba(200, 100, 200, ${0.4 * pulse})`);
  grad.addColorStop(0.7, `rgba(100, 100, 255, ${0.18 * pulse})`);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  haloCtx.beginPath();
  haloCtx.arc(0, -baseR, 80, 0, Math.PI * 2);
  haloCtx.fillStyle = grad;
  haloCtx.fill();

  haloCtx.beginPath();
  haloCtx.arc(0, 0, baseR, -0.55, 0.55);
  haloCtx.strokeStyle = `rgba(255, 200, 150, ${0.55 * pulse})`;
  haloCtx.lineWidth = 3;
  haloCtx.shadowColor = 'rgba(255, 160, 100, 0.8)';
  haloCtx.shadowBlur = 20;
  haloCtx.stroke();
  haloCtx.shadowBlur = 0;
  haloCtx.restore();
}

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

let lastTime = performance.now();
let frameCount = 0;
let fpsAccum = 0;
let currentFps = 60;
let fpsUpdateTimer = 0;

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const rawDt = (now - lastTime) / 1000;
  lastTime = now;
  const dt = Math.min(rawDt, 0.05);
  const elapsed = clock.getElapsedTime();

  frameCount++;
  fpsAccum += rawDt;
  fpsUpdateTimer += rawDt;
  if (fpsUpdateTimer >= 0.25) {
    currentFps = frameCount / fpsAccum;
    fpsUpdateTimer = 0;
    const displayMode = modeTransitionT >= 1 ? targetLightMode : targetLightMode;
    updateFPSDisplay(currentFps, displayMode);
  }

  updateCameraPan(dt);
  updateLightShow(elapsed, dt);
  drawHalo(elapsed);

  renderer.render(scene, camera);
}

animate();

const finalVerts = estimateVerts();
console.log('Scene initialized. Estimated vertices:', finalVerts, '/ Max:', MAX_VERTS);
if (finalVerts > MAX_VERTS) console.warn('Vertex count exceeds limit!');
