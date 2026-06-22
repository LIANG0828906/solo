import { usePipeStore } from './store';
import { parsePipeData } from './modules/pipeData';
import { detectCollisions } from './modules/collisionDetect';
import { SceneManager } from './modules/sceneRender';
import type { RawPipeInput, CollisionPair } from './types';

const PRESET_PIPES: RawPipeInput[] = [
  {
    id: 'water-1',
    type: 'water',
    start: { x: -5, y: -2, z: 0 },
    end: { x: 5, y: -2, z: 0 },
    radius: 0.3,
    depth: 2.0,
  },
  {
    id: 'power-1',
    type: 'power',
    start: { x: 0, y: -3, z: -5 },
    end: { x: 0, y: -3, z: 5 },
    radius: 0.2,
    depth: 3.0,
  },
  {
    id: 'gas-1',
    type: 'gas',
    start: { x: -4, y: -1.5, z: -4 },
    end: { x: 4, y: -2.5, z: 4 },
    radius: 0.25,
    depth: 1.5,
  },
];

function collisionsEqual(a: CollisionPair[], b: CollisionPair[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].pipeA.id !== b[i].pipeA.id || a[i].pipeB.id !== b[i].pipeB.id) return false;
    if (Math.abs(a[i].minDistance - b[i].minDistance) > 0.001) return false;
  }
  return true;
}

function init(): void {
  const container = document.getElementById('canvas-container')!;
  const sceneManager = new SceneManager(container);

  const parsedPipes = parsePipeData(PRESET_PIPES);
  const store = usePipeStore.getState();
  store.setPipes(parsedPipes);

  sceneManager.updatePipes(parsedPipes);

  const initialCollisions = detectCollisions(parsedPipes);
  store.setCollisions(initialCollisions);
  sceneManager.updateCollisions(initialCollisions, store.showCollisionMarkers);

  setupUIButtons(sceneManager);

  let lastCollisionsSnapshot: CollisionPair[] = initialCollisions;
  let lastShowMarkers = store.showCollisionMarkers;

  function animate(): void {
    requestAnimationFrame(animate);

    const currentState = usePipeStore.getState();

    const newCollisions = detectCollisions(currentState.pipes);
    currentState.setCollisions(newCollisions);

    const collisionsChanged = !collisionsEqual(newCollisions, lastCollisionsSnapshot);
    const markersToggled = currentState.showCollisionMarkers !== lastShowMarkers;

    if (collisionsChanged || markersToggled) {
      sceneManager.updateCollisions(newCollisions, currentState.showCollisionMarkers);
      lastCollisionsSnapshot = newCollisions;
      lastShowMarkers = currentState.showCollisionMarkers;
    }

    sceneManager.render();
  }

  animate();
}

function setupUIButtons(sceneManager: SceneManager): void {
  const btnClear = document.getElementById('btn-clear-markers');
  const btnReset = document.getElementById('btn-reset-camera');

  btnClear?.addEventListener('click', () => {
    const store = usePipeStore.getState();
    store.setShowCollisionMarkers(!store.showCollisionMarkers);
    const btn = btnClear as HTMLButtonElement;
    btn.textContent = store.showCollisionMarkers ? '清除冲突标记' : '显示冲突标记';
  });

  btnReset?.addEventListener('click', () => {
    sceneManager.resetCamera();
  });

  const toggleCollision = document.getElementById('toggle-collision');
  const toggleProperty = document.getElementById('toggle-property');
  const collisionPanel = document.getElementById('collision-panel');
  const propertyPanel = document.getElementById('property-panel');

  toggleCollision?.addEventListener('click', () => {
    collisionPanel?.classList.toggle('expanded');
  });

  toggleProperty?.addEventListener('click', () => {
    propertyPanel?.classList.toggle('expanded');
  });

  function checkResponsive() {
    const isNarrow = window.innerWidth < 1280;
    if (toggleCollision) toggleCollision.style.display = isNarrow ? 'flex' : 'none';
    if (toggleProperty) toggleProperty.style.display = isNarrow ? 'flex' : 'none';
  }
  checkResponsive();
  window.addEventListener('resize', checkResponsive);
}

init();
