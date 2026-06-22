import * as THREE from 'three';

export const EARTH_RADIUS = 1;
export const MIN_DISTANCE = 2.2;
export const MAX_DISTANCE = 8;

export const latLonToVector3 = (lat: number, lon: number, radius: number = EARTH_RADIUS): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
};

export const createRaycaster = () => {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  return { raycaster, mouse };
};

export const pickObject = (
  raycaster: THREE.Raycaster,
  mouse: THREE.Vector2,
  event: PointerEvent | MouseEvent,
  camera: THREE.Camera,
  targets: THREE.Object3D[]
): THREE.Intersection | null => {
  const el = event.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(targets, true);
  return hits.length > 0 ? hits[0] : null;
};

export class AnimationLoop {
  private running = false;
  private rafId: number = 0;
  private listeners: Array<(dt: number, time: number) => void> = [];
  private lastTime = 0;
  private time = 0;

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;
      this.time += dt;
      for (const fn of this.listeners) fn(dt, this.time);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  onFrame(fn: (dt: number, time: number) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((x) => x !== fn);
    };
  }

  getTime() {
    return this.time;
  }
}
