import * as THREE from 'three';
import { FossilFragment, SnapInfo } from './types';

const SNAP_DISTANCE_THRESHOLD = 2;
const SNAP_ANGLE_THRESHOLD = 20;
const EPS = 1e-6;

export class SnapEngine {
  private fragments: Map<string, THREE.Object3D> = new Map();
  private epsilon = EPS;

  registerFragment(id: string, object: THREE.Object3D): void {
    this.fragments.set(id, object);
  }

  unregisterFragment(id: string): void {
    this.fragments.delete(id);
  }

  updateFragmentData(fragments: FossilFragment[]): void {
    for (const fragment of fragments) {
      const obj = this.fragments.get(fragment.id);
      if (obj) {
        obj.position.set(
          fragment.position.x,
          fragment.position.y,
          fragment.position.z
        );
        obj.rotation.set(
          fragment.rotation.x,
          fragment.rotation.y,
          fragment.rotation.z
        );
      }
    }
  }

  detectSnap(
    draggingId: string,
    fragmentData: FossilFragment[]
  ): SnapInfo | null {
    const draggingData = fragmentData.find((f) => f.id === draggingId);
    if (!draggingData) return null;

    const draggingObj = this.fragments.get(draggingId);
    if (!draggingObj) return null;

    let bestSnap: SnapInfo | null = null;
    let minDistance = Infinity;

    for (const targetData of fragmentData) {
      if (targetData.id === draggingId) continue;

      const targetObj = this.fragments.get(targetData.id);
      if (!targetObj) continue;

      for (const snapPointA of draggingData.snapPoints) {
        const worldPointA = this.localToWorld(draggingObj, snapPointA);

        for (const snapPointB of targetData.snapPoints) {
          const worldPointB = this.localToWorld(targetObj, snapPointB);

          const distance = worldPointA.distanceTo(worldPointB);

          if (distance < SNAP_DISTANCE_THRESHOLD && distance < minDistance) {
            const angleDiff = this.calculateAngleDifference(
              draggingObj,
              targetObj
            );

            if (angleDiff < SNAP_ANGLE_THRESHOLD) {
              minDistance = distance;
              bestSnap = {
                fragmentIdA: draggingId,
                fragmentIdB: targetData.id,
                distance,
                angleDiff,
                snapPointA: {
                  x: worldPointA.x,
                  y: worldPointA.y,
                  z: worldPointA.z
                },
                snapPointB: {
                  x: worldPointB.x,
                  y: worldPointB.y,
                  z: worldPointB.z
                }
              };
            }
          }
        }
      }
    }

    return bestSnap;
  }

  private localToWorld(
    obj: THREE.Object3D,
    point: { x: number; y: number; z: number }
  ): THREE.Vector3 {
    const v = new THREE.Vector3(point.x, point.y, point.z);
    obj.localToWorld(v);
    return v;
  }

  private worldToLocal(
    obj: THREE.Object3D,
    point: { x: number; y: number; z: number }
  ): THREE.Vector3 {
    const v = new THREE.Vector3(point.x, point.y, point.z);
    obj.worldToLocal(v);
    return v;
  }

  private calculateAngleDifference(
    objA: THREE.Object3D,
    objB: THREE.Object3D
  ): number {
    const quatA = objA.quaternion.clone();
    const quatB = objB.quaternion.clone();
    
    const dot = Math.min(1, Math.abs(quatA.dot(quatB)));
    const angle = 2 * Math.acos(dot);
    
    return (angle * 180) / Math.PI;
  }

  calculateSnapTransform(
    snapInfo: SnapInfo,
    fragmentData: FossilFragment[]
  ): { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number } } | null {
    const fragmentA = fragmentData.find((f) => f.id === snapInfo.fragmentIdA);
    const fragmentB = fragmentData.find((f) => f.id === snapInfo.fragmentIdB);
    const objA = this.fragments.get(snapInfo.fragmentIdA);
    const objB = this.fragments.get(snapInfo.fragmentIdB);

    if (!fragmentA || !fragmentB || !objA || !objB) return null;

    const worldSnapPointB = new THREE.Vector3(
      snapInfo.snapPointB.x,
      snapInfo.snapPointB.y,
      snapInfo.snapPointB.z
    );

    const localSnapPointA = this.findLocalSnapPoint(
      fragmentA,
      snapInfo.snapPointA,
      objA
    );

    if (!localSnapPointA) return null;

    const targetQuat = objB.quaternion.clone();
    const targetEuler = new THREE.Euler().setFromQuaternion(targetQuat);

    const offset = localSnapPointA.clone().negate();
    offset.applyQuaternion(targetQuat);
    const targetPos = worldSnapPointB.clone().add(offset);

    return {
      position: {
        x: parseFloat(targetPos.x.toFixed(4)),
        y: parseFloat(targetPos.y.toFixed(4)),
        z: parseFloat(targetPos.z.toFixed(4))
      },
      rotation: {
        x: parseFloat(targetEuler.x.toFixed(4)),
        y: parseFloat(targetEuler.y.toFixed(4)),
        z: parseFloat(targetEuler.z.toFixed(4))
      }
    };
  }

  private findLocalSnapPoint(
    fragment: FossilFragment,
    worldPoint: { x: number; y: number; z: number },
    obj: THREE.Object3D
  ): THREE.Vector3 | null {
    let closest: THREE.Vector3 | null = null;
    let minDist = Infinity;

    for (const sp of fragment.snapPoints) {
      const worldSp = this.localToWorld(obj, sp);
      const dist = worldSp.distanceTo(
        new THREE.Vector3(worldPoint.x, worldPoint.y, worldPoint.z)
      );
      if (dist < minDist) {
        minDist = dist;
        closest = new THREE.Vector3(sp.x, sp.y, sp.z);
      }
    }

    return closest;
  }

  getShakeOffset(time: number): { x: number; y: number; z: number } {
    const intensity = 0.05;
    const frequency = 20;
    return {
      x: Math.sin(time * frequency) * intensity,
      y: Math.cos(time * frequency * 0.7) * intensity,
      z: Math.sin(time * frequency * 1.1) * intensity
    };
  }
}
