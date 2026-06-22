import { PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function initOrbitControls(
  camera: PerspectiveCamera,
  domElement: HTMLElement
): OrbitControls {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enableZoom = true;
  controls.enableRotate = true;
  controls.enablePan = false;
  controls.minDistance = 8;
  controls.maxDistance = 120;
  return controls;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function flyToPlanet(
  camera: PerspectiveCamera,
  planetWorldPos: Vector3,
  controls: OrbitControls,
  planetRadius: number,
  duration: number = 1500
): Promise<void> {
  return new Promise((resolve) => {
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();

    const offset = new Vector3(
      planetRadius * 4,
      planetRadius * 2,
      planetRadius * 4
    );
    const endPos = planetWorldPos.clone().add(offset);
    const endTarget = planetWorldPos.clone();

    const savedEnableDamping = controls.enableDamping;
    controls.enableDamping = false;
    controls.enabled = false;

    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(t);

      camera.position.lerpVectors(startPos, endPos, eased);
      controls.target.lerpVectors(startTarget, endTarget, eased);
      controls.update();

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        controls.enableDamping = savedEnableDamping;
        controls.enabled = true;
        resolve();
      }
    };

    requestAnimationFrame(animate);
  });
}

export function switchViewMode(
  mode: 'free' | 'top' | 'side',
  camera: PerspectiveCamera,
  controls: OrbitControls,
  duration: number = 500
): Promise<void> {
  return new Promise((resolve) => {
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();

    let endPos: Vector3;
    const endTarget = new Vector3(0, 0, 0);

    switch (mode) {
      case 'free':
        endPos = new Vector3(0, 30, 60);
        break;
      case 'top':
        endPos = new Vector3(0, 90, 0.01);
        break;
      case 'side':
        endPos = new Vector3(80, 5, 0);
        break;
    }

    const savedEnableDamping = controls.enableDamping;
    controls.enableDamping = false;
    controls.enabled = false;

    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(t);

      camera.position.lerpVectors(startPos, endPos, eased);
      controls.target.lerpVectors(startTarget, endTarget, eased);
      controls.update();

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        controls.enableDamping = savedEnableDamping;
        controls.enabled = true;
        resolve();
      }
    };

    requestAnimationFrame(animate);
  });
}

export function getDefaultCameraPosition(): Vector3 {
  return new Vector3(0, 30, 60);
}

export function getDefaultCameraTarget(): Vector3 {
  return new Vector3(0, 0, 0);
}
