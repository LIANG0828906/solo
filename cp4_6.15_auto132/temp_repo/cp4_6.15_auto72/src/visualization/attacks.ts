import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAttackStore } from '../data/generator';
import type { AttackEvent, FilterType } from '../data/types';
import { geoCoordToVec3, createArcCurve, EARTH_RADIUS } from './scene';

export interface AttackPoint {
  id: string;
  position: THREE.Vector3;
  scale: number;
  phase: number;
  type: 'source' | 'target';
  color: THREE.Color;
  bandwidth: number;
}

export interface AttackArc {
  id: string;
  positions: Float32Array;
  sourceId: string;
  targetId: string;
  progress: number;
  lifetime: number;
  age: number;
}

export function useFilteredEvents(filterType: FilterType): AttackEvent[] {
  const events = useAttackStore((state) => state.events);
  if (filterType === 'ALL') return events;
  return events.filter((e) => e.type === filterType);
}

export function useAttacks(filterType: FilterType) {
  const events = useFilteredEvents(filterType);

  const { points, arcs } = useMemo(() => {
    const pointMap = new Map<string, AttackPoint>();
    const arcList: AttackArc[] = [];

    for (const event of events) {
      const sourcePos = geoCoordToVec3(event.source, EARTH_RADIUS + 0.02);
      const targetPos = geoCoordToVec3(event.target, EARTH_RADIUS + 0.02);

      const sourceId = `src-${event.id}`;
      const targetId = `tgt-${event.id}`;

      const sourceScale = Math.max(0.05, Math.min(0.2, event.bandwidth / 500));
      const targetScale = Math.max(0.04, Math.min(0.15, event.bandwidth / 800));

      pointMap.set(sourceId, {
        id: sourceId,
        position: sourcePos,
        scale: sourceScale,
        phase: Math.random() * Math.PI * 2,
        type: 'source',
        color: new THREE.Color('#ff0040'),
        bandwidth: event.bandwidth,
      });

      pointMap.set(targetId, {
        id: targetId,
        position: targetPos,
        scale: targetScale,
        phase: Math.random() * Math.PI * 2,
        type: 'target',
        color: new THREE.Color('#00d4ff'),
        bandwidth: event.bandwidth,
      });

      const { positions } = createArcCurve(sourcePos, targetPos, 0.5, 30);
      arcList.push({
        id: event.id,
        positions,
        sourceId,
        targetId,
        progress: 0,
        lifetime: 3 + Math.random() * 2,
        age: 0,
      });
    }

    return { points: Array.from(pointMap.values()), arcs: arcList };
  }, [events]);

  return { points, arcs };
}

export function useAttackAnimation(points: AttackPoint[], arcs: AttackArc[]) {
  const pointsRef = useRef<THREE.InstancedMesh | null>(null);
  const sourceDummy = useMemo(() => new THREE.Object3D(), []);
  const targetDummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const brightColor = useMemo(() => new THREE.Color(), []);

  const arcLinesRef = useRef<THREE.Group | null>(null);
  const currentPositions = useRef<Map<string, Float32Array>>(new Map());
  const targetPositions = useRef<Map<string, Float32Array>>(new Map());

  useFrame((_state, delta) => {
    const time = performance.now() * 0.001;

    if (pointsRef.current) {
      const mesh = pointsRef.current;

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const pulse = 1 + Math.sin(time * 2 + p.phase) * 0.3;
        const s = p.scale * pulse;
        const colorFlicker = 0.6 + Math.sin(time * 4 + p.phase * 2) * 0.4;

        const dummy = p.type === 'source' ? sourceDummy : targetDummy;
        dummy.position.copy(p.position);
        dummy.scale.setScalar(s);
        dummy.lookAt(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        if (mesh.setColorAt) {
          brightColor.copy(p.color).multiplyScalar(1.5 + colorFlicker * 0.5);
          tempColor.copy(p.color).lerp(brightColor, colorFlicker);
          mesh.setColorAt(i, tempColor);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    if (arcLinesRef.current) {
      const group = arcLinesRef.current;
      for (let i = 0; i < group.children.length && i < arcs.length; i++) {
        const line = group.children[i] as THREE.Line;
        const arc = arcs[i];
        const arcId = arc.id;

        if (!targetPositions.current.has(arcId)) {
          targetPositions.current.set(arcId, arc.positions.slice());
          currentPositions.current.set(arcId, arc.positions.slice());
        } else {
          const prev = targetPositions.current.get(arcId)!;
          if (prev.length !== arc.positions.length ||
              prev.some((v, idx) => Math.abs(v - arc.positions[idx]) > 0.001)) {
            targetPositions.current.set(arcId, arc.positions.slice());
          }
        }

        const curr = currentPositions.current.get(arcId)!;
        const tgt = targetPositions.current.get(arcId)!;
        const lerpFactor = Math.min(1, delta * 3);
        for (let j = 0; j < curr.length; j++) {
          curr[j] += (tgt[j] - curr[j]) * lerpFactor;
        }

        const geom = line.geometry as THREE.BufferGeometry;
        const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let j = 0; j < Math.min(arr.length, curr.length); j++) {
          arr[j] = curr[j];
        }
        posAttr.needsUpdate = true;

        if (line.material instanceof THREE.LineBasicMaterial) {
          const opacity = Math.sin((arc.age / arc.lifetime) * Math.PI) * 0.6 + 0.2;
          line.material.opacity = opacity;
        }
      }

      const validIds = new Set(arcs.map((a) => a.id));
      for (const id of currentPositions.current.keys()) {
        if (!validIds.has(id)) {
          currentPositions.current.delete(id);
          targetPositions.current.delete(id);
        }
      }
    }
  });

  return { pointsRef, arcLinesRef };
}
