import * as THREE from 'three';
import { useComparisonStore } from '@/store/useComparisonStore';
import ModelManager from '@/models/ModelManager';
import type { ComparisonMode, CameraState } from '@/types';
import { lerpCameraPreset } from '@/data/mockData';

class ComparisonControllerClass {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private tempVec3 = new THREE.Vector3();

  setMode(mode: ComparisonMode): void {
    const current = useComparisonStore.getState().mode;
    if (current === mode) return;

    useComparisonStore.getState().setMode(mode);

    if (mode === 'split') {
      ModelManager.centerModelsForSplitView();
      ModelManager.setOverlayOpacity('A', 1);
      ModelManager.setOverlayOpacity('B', 1);
    } else {
      ModelManager.centerModelsForOverlay();
      const opacity = useComparisonStore.getState().overlayOpacity;
      ModelManager.setOverlayOpacity('A', 1 - opacity, 0.1);
      ModelManager.setOverlayOpacity('B', 1);
    }
  }

  toggleMode(): void {
    const current = useComparisonStore.getState().mode;
    this.setMode(current === 'split' ? 'overlay' : 'split');
  }

  setOverlayOpacity(opacity: number): void {
    const clamped = Math.max(0, Math.min(1, opacity));
    useComparisonStore.getState().setOverlayOpacity(clamped);
    if (useComparisonStore.getState().mode === 'overlay') {
      ModelManager.setOverlayOpacity('A', 1 - clamped, 0.1);
      ModelManager.setOverlayOpacity('B', 1);
    }
  }

  setViewSync(enabled: boolean, source?: 'A' | 'B'): void {
    useComparisonStore.getState().setViewSync({
      enabled,
      ...(source ? { source } : {}),
    });

    if (enabled) {
      const src = source || useComparisonStore.getState().viewSync.source;
      const camKey = src === 'A' ? 'cameraA' : 'cameraB';
      const camState = useComparisonStore.getState()[camKey];
      const otherKey = src === 'A' ? 'cameraB' : 'cameraA';
      useComparisonStore.getState()[otherKey] = camState;
    }
  }

  syncCameraFromSource(source: 'A' | 'B'): void {
    const state = useComparisonStore.getState();
    if (!state.viewSync.enabled) return;

    const sourceKey = source === 'A' ? 'cameraA' : 'cameraB';
    const targetKey = source === 'A' ? 'cameraB' : 'cameraA';
    const sourceCam = state[sourceKey];

    useComparisonStore.getState().setCameraState(source, sourceCam);
  }

  onCameraChange(
    id: 'A' | 'B',
    camera: THREE.Camera,
    controlsTarget: THREE.Vector3
  ): void {
    const state = useComparisonStore.getState();

    const cameraState: CameraState = {
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: [controlsTarget.x, controlsTarget.y, controlsTarget.z],
    };

    useComparisonStore.getState().setCameraState(id, cameraState);

    if (state.viewSync.enabled && state.viewSync.source === id) {
      useComparisonStore.getState().setCameraState(
        id === 'A' ? 'B' : 'A',
        cameraState
      );
    }
  }

  setYear(year: number): void {
    const clamped = Math.max(-200, Math.min(600, year));
    useComparisonStore.getState().setCurrentYear(clamped);

    const preset = lerpCameraPreset(clamped);
    const state = useComparisonStore.getState();

    this.animateCameraTo('A', preset.position, preset.target, 1000);
    if (state.viewSync.enabled || state.mode === 'split') {
      this.animateCameraTo('B', preset.position, preset.target, 1000);
    }
  }

  private animateCameraTo(
    id: 'A' | 'B',
    targetPos: [number, number, number],
    targetLook: [number, number, number],
    durationMs: number
  ): void {
    const state = useComparisonStore.getState();
    const camKey = id === 'A' ? 'cameraA' : 'cameraB';
    const startPos = [...state[camKey].position] as [number, number, number];
    const startLook = [...state[camKey].target] as [number, number, number];

    const startTime = performance.now();
    const tick = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / durationMs, 1);
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

      const newPos: [number, number, number] = [
        lerp(startPos[0], targetPos[0], easeT),
        lerp(startPos[1], targetPos[1], easeT),
        lerp(startPos[2], targetPos[2], easeT),
      ];
      const newLook: [number, number, number] = [
        lerp(startLook[0], targetLook[0], easeT),
        lerp(startLook[1], targetLook[1], easeT),
        lerp(startLook[2], targetLook[2], easeT),
      ];

      useComparisonStore.getState().setCameraState(id, {
        position: newPos,
        target: newLook,
      });

      if (t < 1) {
        requestAnimationFrame(tick);
      }
    };
    tick();
  }

  setTheme(theme: 'dusk' | 'daylight' | 'night'): void {
    useComparisonStore.getState().setTheme(theme);
  }

  toggleMeasurementMode(): void {
    const state = useComparisonStore.getState();
    useComparisonStore.getState().setMeasurementMode(!state.measurementMode);
    if (state.measurementMode) {
      useComparisonStore.getState().cancelMeasurement();
    }
  }

  setSplitRatio(ratio: number): void {
    useComparisonStore.getState().setSplitRatio(ratio);
  }

  computeDistance3D(
    p1: [number, number, number],
    p2: [number, number, number]
  ): number {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dz = p2[2] - p1[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  raycastScreenPoint(
    screenX: number,
    screenY: number,
    camera: THREE.Camera,
    objects: THREE.Object3D[]
  ): THREE.Intersection | null {
    const rect = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    this.mouse.x = ((screenX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((screenY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObjects(objects, true);

    return intersects.length > 0 ? intersects[0] : null;
  }

  worldToScreen(
    worldPos: [number, number, number],
    camera: THREE.Camera,
    width: number,
    height: number
  ): { x: number; y: number } {
    this.tempVec3.set(...worldPos);
    this.tempVec3.project(camera);
    return {
      x: (this.tempVec3.x * 0.5 + 0.5) * width,
      y: (-this.tempVec3.y * 0.5 + 0.5) * height,
    };
  }

  resetView(id: 'A' | 'B' | 'both'): void {
    const defaultCam = {
      position: [10, 8, 10] as [number, number, number],
      target: [0, 3, 0] as [number, number, number],
    };
    if (id === 'both' || id === 'A') {
      this.animateCameraTo('A', defaultCam.position, defaultCam.target, 800);
    }
    if (id === 'both' || id === 'B') {
      this.animateCameraTo('B', defaultCam.position, defaultCam.target, 800);
    }
  }
}

export const ComparisonController = new ComparisonControllerClass();
export default ComparisonController;
