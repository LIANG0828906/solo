import * as THREE from 'three';
import { useComparisonStore } from '@/store/useComparisonStore';
import ModelManager from '@/models/ModelManager';
import { mockAnnotations } from '@/data/mockData';
import type { Annotation, MeasurementPoint, HitResult } from '@/types';

class AnnotationSystemClass {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private tempVec3 = new THREE.Vector3();

  handleModelClick(
    screenX: number,
    screenY: number,
    camera: THREE.Camera,
    modelId: 'A' | 'B',
    viewportWidth: number,
    viewportHeight: number
  ): HitResult | null {
    const modelRoot = ModelManager.getWrapper(modelId);
    if (!modelRoot) return null;

    this.mouse.x = (screenX / viewportWidth) * 2 - 1;
    this.mouse.y = -(screenY / viewportHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);

    const meshes: THREE.Object3D[] = [];
    modelRoot.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && !child.name.startsWith('__edge_')) {
        meshes.push(child);
      }
    });

    const intersects = this.raycaster.intersectObjects(meshes, true);

    if (intersects.length === 0) return null;

    const hit = intersects[0];
    const worldPoint = hit.point.clone();
    hit.object.localToWorld(worldPoint);

    return {
      point: worldPoint,
      object: hit.object,
      modelId,
      face: hit.face,
    };
  }

  matchAnnotationToMesh(meshName: string): typeof mockAnnotations[0] | null {
    for (const anno of mockAnnotations) {
      try {
        const regex = new RegExp(anno.meshNamePattern, 'i');
        if (regex.test(meshName)) {
          return anno;
        }
      } catch (e) {
        if (meshName.toLowerCase().includes(anno.meshNamePattern.toLowerCase())) {
          return anno;
        }
      }
    }
    return null;
  }

  showAnnotationForHit(hit: HitResult, screenPos: { x: number; y: number }): boolean {
    const meshName = this.findOriginalMeshName(hit.object);
    const matched = this.matchAnnotationToMesh(meshName);

    if (!matched) {
      const state = useComparisonStore.getState();
      if (!state.measurementMode) {
        useComparisonStore.getState().setActiveAnnotation(null);
      }
      return false;
    }

    const worldPos: [number, number, number] = [hit.point.x, hit.point.y, hit.point.z];

    const state = useComparisonStore.getState();
    let existing = state.annotations.find(
      (a) => a.id === matched.id && a.modelId === hit.modelId
    );

    if (!existing) {
      const annotation: Annotation = {
        id: `${matched.id}-${hit.modelId}`,
        componentName: matched.componentName,
        eraRange: matched.eraRange,
        description: matched.description,
        worldPosition: worldPos,
        viewed: false,
        modelId: hit.modelId,
      };
      useComparisonStore.getState().addAnnotation(annotation);
      existing = annotation;
    }

    useComparisonStore.getState().markAnnotationViewed(existing.id);

    const targetX = Math.min(
      Math.max(screenPos.x, 20),
      window.innerWidth - 340
    );
    const targetY = Math.min(
      Math.max(screenPos.y, 20),
      window.innerHeight - 200
    );

    useComparisonStore.getState().setActiveAnnotation(existing, {
      x: targetX,
      y: targetY,
    });

    return true;
  }

  private findOriginalMeshName(obj: THREE.Object3D): string {
    let current: THREE.Object3D | null = obj;
    while (current) {
      if (current.name && !current.name.startsWith('__edge_')) {
        return current.name;
      }
      current = current.parent;
    }
    return obj.name || obj.uuid;
  }

  hideAnnotation(): void {
    useComparisonStore.getState().setActiveAnnotation(null);
  }

  projectAnnotationToScreen(
    annotation: Annotation,
    camera: THREE.Camera,
    width: number,
    height: number
  ): { x: number; y: number; visible: boolean } {
    this.tempVec3.set(...annotation.worldPosition);
    this.tempVec3.project(camera);

    const inFront = this.tempVec3.z < 1;
    return {
      x: (this.tempVec3.x * 0.5 + 0.5) * width,
      y: (-this.tempVec3.y * 0.5 + 0.5) * height,
      visible: inFront && this.tempVec3.x > -1 && this.tempVec3.x < 1 && this.tempVec3.y > -1 && this.tempVec3.y < 1,
    };
  }

  handleMeasurementClick(
    screenX: number,
    screenY: number,
    camera: THREE.Camera,
    modelId: 'A' | 'B',
    vpWidth: number,
    vpHeight: number
  ): MeasurementPoint | null {
    const hit = this.handleModelClick(screenX, screenY, camera, modelId, vpWidth, vpHeight);
    if (!hit) return null;

    const screenPos = this.modelToScreen(hit.point, camera, vpWidth, vpHeight);

    return {
      position: [hit.point.x, hit.point.y, hit.point.z],
      screenPosition: { x: screenX, y: screenY },
    };
  }

  handleMeasurementMove(
    screenX: number,
    screenY: number,
    camera: THREE.Camera,
    modelId: 'A' | 'B',
    vpWidth: number,
    vpHeight: number
  ): MeasurementPoint | null {
    const hit = this.handleModelClick(screenX, screenY, camera, modelId, vpWidth, vpHeight);
    if (!hit) {
      this.mouse.x = (screenX / vpWidth) * 2 - 1;
      this.mouse.y = -(screenY / vpHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const point = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(plane, point);
      if (!point) return null;
      return {
        position: [point.x, point.y, point.z],
        screenPosition: { x: screenX, y: screenY },
      };
    }
    return {
      position: [hit.point.x, hit.point.y, hit.point.z],
      screenPosition: { x: screenX, y: screenY },
    };
  }

  private modelToScreen(
    worldPos: THREE.Vector3,
    camera: THREE.Camera,
    width: number,
    height: number
  ): { x: number; y: number } {
    const v = worldPos.clone().project(camera);
    return {
      x: (v.x * 0.5 + 0.5) * width,
      y: (-v.y * 0.5 + 0.5) * height,
    };
  }

  updateAnnotationPositions(
    cameraA: THREE.Camera,
    cameraB: THREE.Camera,
    widthA: number,
    heightA: number,
    widthB: number,
    heightB: number
  ): Map<string, { x: number; y: number; visible: boolean }> {
    const positions = new Map<string, { x: number; y: number; visible: boolean }>();
    const annotations = useComparisonStore.getState().annotations;
    const mode = useComparisonStore.getState().mode;

    annotations.forEach((anno) => {
      const cam = anno.modelId === 'A' ? cameraA : cameraB;
      const w = mode === 'split' ? (anno.modelId === 'A' ? widthA : widthB) : widthA;
      const h = mode === 'split' ? (anno.modelId === 'A' ? heightA : heightB) : heightA;
      const proj = this.projectAnnotationToScreen(anno, cam, w, h);

      let x = proj.x;
      let y = proj.y;

      if (mode === 'split' && anno.modelId === 'B') {
        x += widthA;
      }

      positions.set(anno.id, { x, y, visible: proj.visible });
    });

    return positions;
  }
}

export const AnnotationSystem = new AnnotationSystemClass();
export default AnnotationSystem;
