import * as THREE from 'three';
import { SpaceStation, DockingStatus } from './visualization/SpaceStation';
import { Spacecraft, InputState } from './visualization/Spacecraft';
import { HUD, FrameColor, HUDData } from './visualization/HUD';
import { OrbitParams, OrbitPosition } from './data-service/orbitCalculator';

const app = document.getElementById('app')!;

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(4.5, 30, 260);
camera.lookAt(4.5, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
app.appendChild(renderer.domElement);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.25);
sunLight.position.set(80, 120, 60);
scene.add(sunLight);
const ambientLight = new THREE.AmbientLight(0x6080c0, 0.35);
scene.add(ambientLight);
const rimLight = new THREE.DirectionalLight(0x8fb8ff, 0.4);
rimLight.position.set(-60, -30, -80);
scene.add(rimLight);

function buildStars(count: number): THREE.Points {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const siz = new Float32Array(count);
  const phase = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = 600 + Math.random() * 900;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
    const br = 0.5 + Math.random() * 0.5;
    const tint = 0.85 + Math.random() * 0.15;
    col[i * 3] = br * tint;
    col[i * 3 + 1] = br * (0.95 + Math.random() * 0.05);
    col[i * 3 + 2] = br * 1.05;
    siz[i] = 0.4 + Math.random() * 2.2;
    phase[i] = Math.random() * Math.PI * 2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(siz, 1));
  (geo as any).setAttribute('phase', new THREE.BufferAttribute(phase, 1));
  const mat = new THREE.PointsMaterial({
    size: 1.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  });
  return new THREE.Points(geo, mat);
}

const starField = buildStars(500);
scene.add(starField);

const station = new SpaceStation(scene);
const spacecraft = new Spacecraft(scene);
const hud = new HUD(app);

const inputState: InputState = {
  translateI: false, translateK: false,
  translateJ: false, translateL: false,
  pitchU: false, pitchO: false,
  yawY: false, yawH: false
};

const camKeys: Record<string, boolean> = {};
let camYaw = Math.atan2(camera.position.x - 4.5, camera.position.z);
let camPitch = Math.atan2(
  camera.position.y,
  Math.sqrt(Math.pow(camera.position.x - 4.5, 2) + Math.pow(camera.position.z, 2))
);
let camDist = camera.position.distanceTo(new THREE.Vector3(4.5, 0, 0));
const camTarget = new THREE.Vector3(4.5, 0, 0);
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
renderer.domElement.addEventListener('mousedown', e => {
  isDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});
window.addEventListener('mouseup', () => { isDragging = false; });
window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  camYaw -= dx * 0.004;
  camPitch -= dy * 0.004;
  camPitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, camPitch));
});
renderer.domElement.addEventListener('wheel', e => {
  camDist = Math.max(15, Math.min(500, camDist * (1 + e.deltaY * 0.0008)));
}, { passive: true });

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'i') inputState.translateI = true;
  if (k === 'k') inputState.translateK = true;
  if (k === 'j') inputState.translateJ = true;
  if (k === 'l') inputState.translateL = true;
  if (k === 'u') inputState.pitchU = true;
  if (k === 'o') inputState.pitchO = true;
  if (k === 'y') inputState.yawY = true;
  if (k === 'h') inputState.yawH = true;
  camKeys[k] = true;
});
window.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (k === 'i') inputState.translateI = false;
  if (k === 'k') inputState.translateK = false;
  if (k === 'j') inputState.translateJ = false;
  if (k === 'l') inputState.translateL = false;
  if (k === 'u') inputState.pitchU = false;
  if (k === 'o') inputState.pitchO = false;
  if (k === 'y') inputState.yawY = false;
  if (k === 'h') inputState.yawH = false;
  camKeys[k] = false;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let orbitParams: OrbitParams | null = null;
let orbitPos: OrbitPosition | null = null;
async function fetchOrbitData() {
  try {
    if (!orbitParams) {
      const r1 = await fetch('/api/orbit-params');
      if (r1.ok) orbitParams = await r1.json();
    }
    const r2 = await fetch('/api/orbit-position');
    if (r2.ok) orbitPos = await r2.json();
    hud.updateOrbitView(orbitParams, orbitPos);
  } catch {
    const fallback: OrbitParams = {
      altitude: 408, velocity: 7.66, inclination: 51.64, raan: 180,
      eccentricity: 0.0003, argumentOfPerigee: 180, trueAnomaly: 45, period: 92.68,
      orbitPath: []
    };
    for (let i = 0; i < 100; i++) {
      const t = (i / 100) * Math.PI * 2;
      fallback.orbitPath.push({
        x: Math.cos(t) * 0.8,
        y: Math.sin(t) * 0.8
      });
    }
    orbitParams = fallback;
    orbitPos = {
      stationPosition: { x: 0, y: 0.8 },
      spacecraftPosition: { x: 0.05, y: 0.78 },
      timestamp: Date.now()
    };
    hud.updateOrbitView(orbitParams, orbitPos);
  }
}
fetchOrbitData();
setInterval(fetchOrbitData, 2000);

const trajectoryLog: THREE.Vector3[] = [];
const TRAJ_MAX = 1500;
let isDocked = false;
let dockedLockTime = 0;
const dockedPositions: THREE.Vector3[] = [];

const clock = new THREE.Clock();
let elapsed = 0;

function computeAttitudeDeviation(
  craftQuat: THREE.Quaternion,
  portQuat: THREE.Quaternion
): number {
  const diff = craftQuat.clone().invert().multiply(portQuat);
  const angle = 2 * Math.acos(Math.min(1, Math.abs(diff.w)));
  return (angle * 180) / Math.PI;
}

function render() {
  const delta = Math.min(clock.getDelta(), 0.05);
  elapsed += delta;

  const camMoveSpeed = 80 * delta;
  const camForward = new THREE.Vector3(-Math.sin(camYaw) * Math.cos(camPitch), Math.sin(camPitch), -Math.cos(camYaw) * Math.cos(camPitch));
  const camRight = new THREE.Vector3().crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();
  if (camKeys['w']) camTarget.add(camForward.clone().multiplyScalar(camMoveSpeed));
  if (camKeys['s']) camTarget.sub(camForward.clone().multiplyScalar(camMoveSpeed));
  if (camKeys['a']) camTarget.sub(camRight.clone().multiplyScalar(camMoveSpeed));
  if (camKeys['d']) camTarget.add(camRight.clone().multiplyScalar(camMoveSpeed));

  camera.position.set(
    camTarget.x + Math.sin(camYaw) * Math.cos(camPitch) * camDist,
    camTarget.y + Math.sin(camPitch) * camDist,
    camTarget.z + Math.cos(camYaw) * Math.cos(camPitch) * camDist
  );
  camera.lookAt(camTarget);

  const phaseAttr = (starField.geometry as any).getAttribute('phase') as THREE.BufferAttribute;
  const colAttr = starField.geometry.getAttribute('color') as THREE.BufferAttribute;
  for (let i = 0; i < phaseAttr.count; i++) {
    const ph = phaseAttr.array[i] as number;
    const tw = 0.7 + 0.3 * Math.sin(elapsed * 2 + ph);
    (colAttr.array as Float32Array)[i * 3] *= tw;
    (colAttr.array as Float32Array)[i * 3 + 1] *= tw;
    (colAttr.array as Float32Array)[i * 3 + 2] *= tw;
  }
  colAttr.needsUpdate = true;

  spacecraft.handleInput(inputState, delta);
  const craftState = spacecraft.update(delta);

  const dockingPortWorld = station.getDockingPortWorldPosition();
  const dockingPortQuat = station.getDockingPortWorldQuaternion();

  const toPort = dockingPortWorld.clone().sub(craftState.position);
  const distance = toPort.length();
  const speed = craftState.speed;

  const craftForward = new THREE.Vector3(0, 0, -1).applyQuaternion(craftState.position.clone().set(0, 0, 0).setFromSpherical?.(new THREE.Spherical()) ?? new THREE.Vector3());
  const idealForward = toPort.clone().normalize();
  const fwdDot = Math.max(-1, Math.min(1, craftState.position.clone().sub(dockingPortWorld).normalize().dot(new THREE.Vector3(0, 0, 1))));
  const axialDev = (Math.acos(Math.max(-1, Math.min(1, craftForward.dot(idealForward) || fwdDot))) * 180) / Math.PI;
  const clampedDev = Math.max(-5, Math.min(5, (axialDev > 5 ? axialDev - 10 : axialDev)));

  const attitudeDev = computeAttitudeDeviation(spacecraft.group.quaternion, dockingPortQuat);
  const finalDev = Math.min(5, Math.max(-5, Math.min(axialDev, attitudeDev)) * (axialDev > 5 ? -1 : 1));

  station.update(delta, elapsed);

  let status: DockingStatus;
  let frameColor: FrameColor;
  if (distance < 0.5 && speed < 0.1 && attitudeDev < 2) {
    status = DockingStatus.LOCKED;
    frameColor = 'green';
  } else if (distance < 8) {
    status = DockingStatus.NEAR;
    frameColor = 'green';
  } else if (distance < 40) {
    status = DockingStatus.APPROACHING;
    frameColor = speed > 1.0 ? 'red' : 'yellow';
  } else {
    status = DockingStatus.FAR;
    frameColor = 'red';
  }
  station.updateDockingStatus(status);
  hud.setDockingFrameColor(frameColor);
  hud.flashWarning(speed > 1.5 && distance < 40);

  const craftScreen = craftState.position.clone().project(camera);
  const portScreen = dockingPortWorld.clone().project(camera);
  const dx = (portScreen.x - craftScreen.x) * window.innerWidth * 0.5;
  const dy = (craftScreen.y - portScreen.y) * window.innerHeight * 0.5;
  hud.setGuideVector(dx, dy, distance, camera);

  const hudData: HUDData = {
    distance: Number(distance.toFixed(2)),
    velocity: Number(speed.toFixed(3)),
    axialDeviation: Number(finalDev.toFixed(2)),
    rollAngle: Number((craftState.attitude.roll * 180 / Math.PI).toFixed(2))
  };
  hud.update(hudData, camera, dockingPortWorld);

  if (!isDocked && distance < TRAJ_MAX) {
    trajectoryLog.push(craftState.position.clone());
    if (trajectoryLog.length > TRAJ_MAX) trajectoryLog.shift();
  }

  const MAX_DEVIATION_DIST = 400;
  const AXIAL_DEV_THRESHOLD = 45;
  let needReset = false;
  if (distance > MAX_DEVIATION_DIST) {
    needReset = true;
  } else if (distance < 4 && attitudeDev > AXIAL_DEV_THRESHOLD) {
    needReset = true;
  } else if (distance < 2.5 && speed > 1.2) {
    needReset = true;
  }

  if (needReset && !isDocked) {
    spacecraft.triggerCollisionShake();
    setTimeout(() => {
      spacecraft.resetPosition();
      trajectoryLog.length = 0;
    }, 400);
  }

  if (!isDocked && status === DockingStatus.LOCKED) {
    isDocked = true;
    dockedLockTime = elapsed;
    while (dockedPositions.length < 20) {
      dockedPositions.push(dockingPortWorld.clone());
    }
    for (let i = trajectoryLog.length - 800; i < trajectoryLog.length; i++) {
      if (i >= 0) dockedPositions.unshift(trajectoryLog[i].clone());
    }
    spacecraft.spawnFireworks(300);
    hud.showDockingSuccess(dockedPositions, camera).then(() => {
      setTimeout(() => {
        isDocked = false;
        dockedPositions.length = 0;
        spacecraft.resetPosition();
        trajectoryLog.length = 0;
      }, 1500);
    });
  }

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

render();
