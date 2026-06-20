import { useStore, MAX_ASTEROIDS, LABELS, ORBIT_COLORS } from './store';
import type { Asteroid } from './store';
import type { Vec3 } from './physicsEngine';
import {
  calcOrbitalEnergy,
  calcOrbitalEccentricity,
  calcOrbitalPeriod,
} from './physicsEngine';
import { STAR_MASS } from './sceneSetup';
import * as THREE from 'three';

let initialized = false;
let massSlider: HTMLInputElement | null = null;
let speedSlider: HTMLInputElement | null = null;
let angleSlider: HTMLInputElement | null = null;
let massValue: HTMLElement | null = null;
let speedValue: HTMLElement | null = null;
let angleValue: HTMLElement | null = null;
let launchBtn: HTMLButtonElement | null = null;
let limitHint: HTMLElement | null = null;
let energyValueEl: HTMLElement | null = null;
let eccentricityValueEl: HTMLElement | null = null;
let infoPanel: HTMLElement | null = null;
let infoPanelTitle: HTMLElement | null = null;
let infoPosition: HTMLElement | null = null;
let infoVelocity: HTMLElement | null = null;
let infoDistance: HTMLElement | null = null;
let infoPeriod: HTMLElement | null = null;

export interface UICallbacks {
  onLaunch: (params: {
    id: string;
    label: string;
    mass: number;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    orbitColor: string;
  }) => void;
}

let callbacks: UICallbacks | null = null;

function formatNumber(n: number, decimals = 2): string {
  if (!isFinite(n)) return '—';
  return n.toFixed(decimals);
}

export function initUIController(cb: UICallbacks): void {
  if (initialized) return;
  initialized = true;
  callbacks = cb;

  massSlider = document.getElementById('mass-slider') as HTMLInputElement;
  speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
  angleSlider = document.getElementById('angle-slider') as HTMLInputElement;
  massValue = document.getElementById('mass-value');
  speedValue = document.getElementById('speed-value');
  angleValue = document.getElementById('angle-value');
  launchBtn = document.getElementById('launch-btn') as HTMLButtonElement;
  limitHint = document.getElementById('limit-hint');
  energyValueEl = document.getElementById('energy-value');
  eccentricityValueEl = document.getElementById('eccentricity-value');
  infoPanel = document.getElementById('info-panel');
  infoPanelTitle = document.getElementById('info-panel-title');
  infoPosition = document.getElementById('info-position');
  infoVelocity = document.getElementById('info-velocity');
  infoDistance = document.getElementById('info-distance');
  infoPeriod = document.getElementById('info-period');

  if (massSlider && massValue) {
    massSlider.addEventListener('input', () => {
      const v = parseInt(massSlider!.value, 10);
      massValue!.textContent = String(v);
      useStore.getState().setParam('mass', v);
    });
  }

  if (speedSlider && speedValue) {
    speedSlider.addEventListener('input', () => {
      const v = parseFloat(speedSlider!.value);
      speedValue!.textContent = v.toFixed(1);
      useStore.getState().setParam('speed', v);
    });
  }

  if (angleSlider && angleValue) {
    angleSlider.addEventListener('input', () => {
      const v = parseInt(angleSlider!.value, 10);
      angleValue!.textContent = `${v}°`;
      useStore.getState().setParam('angle', v);
    });
  }

  if (launchBtn) {
    launchBtn.addEventListener('click', handleLaunch);
  }

  useStore.subscribe(
    (state) => state.asteroids.length,
    () => {
      updateLaunchButtonState();
    }
  );
  updateLaunchButtonState();
}

function updateLaunchButtonState(): void {
  const state = useStore.getState();
  if (launchBtn && limitHint) {
    const atLimit = state.asteroids.length >= MAX_ASTEROIDS;
    launchBtn.disabled = atLimit;
    if (atLimit) {
      limitHint.classList.add('visible');
    } else {
      limitHint.classList.remove('visible');
    }
  }
}

function handleLaunch(): void {
  if (!callbacks) return;
  const state = useStore.getState();
  if (state.asteroids.length >= MAX_ASTEROIDS) return;

  const nextIndex = state.asteroids.length;
  const label = LABELS[nextIndex];
  const orbitColor = ORBIT_COLORS[nextIndex];
  const id = `asteroid-${Date.now()}-${nextIndex}`;

  const params = state.params;
  const angleRad = (params.angle * Math.PI) / 180;
  const launchDistance = 12;

  const position: THREE.Vector3 = new THREE.Vector3(
    Math.cos(angleRad) * launchDistance,
    0,
    Math.sin(angleRad) * launchDistance
  );

  const perpAngle = angleRad + Math.PI / 2;
  const velocity: THREE.Vector3 = new THREE.Vector3(
    Math.cos(perpAngle) * params.speed,
    0,
    Math.sin(perpAngle) * params.speed
  );

  const asteroidData: Asteroid = {
    id,
    label,
    mass: params.mass,
    position: { x: position.x, y: position.y, z: position.z },
    velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
    orbitColor,
  };

  state.addAsteroid(asteroidData);
  callbacks.onLaunch({
    id,
    label,
    mass: params.mass,
    position,
    velocity,
    orbitColor,
  });
}

export function updateOrbitInfo(): void {
  const state = useStore.getState();
  if (!energyValueEl || !eccentricityValueEl) return;

  if (state.asteroids.length === 0) {
    energyValueEl.textContent = '—';
    energyValueEl.classList.remove('captured');
    energyValueEl.classList.add('normal');
    eccentricityValueEl.textContent = '—';
    return;
  }

  const target = state.selectedId
    ? state.asteroids.find((a) => a.id === state.selectedId)
    : state.asteroids[0];

  if (!target) return;

  const energy = calcOrbitalEnergy(target.position, target.velocity, STAR_MASS);
  const ecc = calcOrbitalEccentricity(target.position, target.velocity, STAR_MASS);

  energyValueEl.textContent = formatNumber(energy.total, 3);
  if (energy.total < 0) {
    energyValueEl.classList.add('captured');
    energyValueEl.classList.remove('normal');
  } else {
    energyValueEl.classList.remove('captured');
    energyValueEl.classList.add('normal');
  }

  eccentricityValueEl.textContent = formatNumber(ecc, 3);
}

export function updateInfoPanel(): void {
  if (
    !infoPanel ||
    !infoPanelTitle ||
    !infoPosition ||
    !infoVelocity ||
    !infoDistance ||
    !infoPeriod
  )
    return;

  const state = useStore.getState();
  const selected = state.asteroids.find((a) => a.id === state.selectedId);

  if (!selected) {
    infoPanel.classList.remove('visible');
    return;
  }

  infoPanel.classList.add('visible');
  infoPanelTitle.textContent = `小行星 ${selected.label}`;

  const pos = selected.position;
  const vel = selected.velocity;
  infoPosition.textContent = `(${formatNumber(pos.x)}, ${formatNumber(pos.y)}, ${formatNumber(pos.z)})`;
  infoVelocity.textContent = `(${formatNumber(vel.x)}, ${formatNumber(vel.y)}, ${formatNumber(vel.z)})`;

  const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
  infoDistance.textContent = `${formatNumber(dist)} 单位`;

  const period = calcOrbitalPeriod(
    selected.position as Vec3,
    selected.velocity as Vec3,
    STAR_MASS
  );
  infoPeriod.textContent = period !== null ? `${formatNumber(period)} s` : '未捕获';
}
