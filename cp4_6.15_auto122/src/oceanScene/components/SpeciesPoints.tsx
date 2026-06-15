import { useRef, useMemo, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore } from '../../store';
import type { RenderableSpecies } from '../../types';

const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();
const tempVec = new THREE.Vector3();

interface InstanceData {
  targetPos: THREE.Vector3;
  currentPos: THREE.Vector3;
  targetScale: number;
  currentScale: number;
  targetOpacity: number;
  currentOpacity: number;
  color: string;
  speciesData: RenderableSpecies;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export default function SpeciesPoints() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const renderableData = useOceanStore((s) => s.renderableData);
  const setHoveredSpecies = useOceanStore((s) => s.setHoveredSpecies);
  const setSelectedSpecies = useOceanStore((s) => s.setSelectedSpecies);

  const maxCount = 2000;
  const instanceDataRef = useRef<Map<number, InstanceData>>(new Map());
  const animProgressRef = useRef<Map<number, number>>(new Map());

  const prevDataRef = useRef<RenderableSpecies[]>([]);

  useMemo(() => {
    const newMap = new Map<number, InstanceData>();
    const prevMap = instanceDataRef.current;

    for (let i = 0; i < renderableData.length; i++) {
      const d = renderableData[i];
      const pos = new THREE.Vector3(...d.position);
      const prev = prevMap.get(i);
      const startPos = prev ? prev.currentPos.clone() : pos.clone();
      const startScale = prev ? prev.currentScale : d.scale;
      const startOpacity = prev ? prev.currentOpacity : d.opacity;

      newMap.set(i, {
        targetPos: pos,
        currentPos: startPos,
        targetScale: d.scale,
        currentScale: startScale,
        targetOpacity: d.opacity,
        currentOpacity: startOpacity,
        color: d.color,
        speciesData: d,
      });
      animProgressRef.current.set(i, 0);
    }

    instanceDataRef.current = newMap;
    prevDataRef.current = renderableData;
  }, [renderableData]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const animSpeed = 2.0;

    for (let i = 0; i < renderableData.length; i++) {
      const data = instanceDataRef.current.get(i);
      if (!data) continue;

      let progress = animProgressRef.current.get(i) || 0;
      progress = Math.min(1, progress + delta * animSpeed);
      animProgressRef.current.set(i, progress);

      const eased = easeInOut(progress);

      data.currentPos.lerpVectors(data.currentPos, data.targetPos, eased > 0.01 ? 0.1 : 0);
      if (eased > 0.01) {
        data.currentPos.lerpVectors(
          new THREE.Vector3(
            data.currentPos.x + (data.targetPos.x - data.currentPos.x) * 0,
            data.currentPos.y,
            data.currentPos.z
          ),
          data.targetPos,
          eased
        );
      }

      data.currentScale += (data.targetScale - data.currentScale) * Math.min(1, delta * animSpeed);
      data.currentOpacity += (data.targetOpacity - data.currentOpacity) * Math.min(1, delta * animSpeed);

      const s = Math.max(0.05, data.currentScale);
      tempMatrix.makeTranslation(data.currentPos.x, data.currentPos.y, data.currentPos.z);
      tempMatrix.scale(tempVec.set(s, s, s));
      mesh.setMatrixAt(i, tempMatrix);

      tempColor.set(data.color);
      mesh.setColorAt(i, tempColor);
    }

    for (let i = renderableData.length; i < maxCount; i++) {
      tempMatrix.makeScale(0, 0, 0);
      mesh.setMatrixAt(i, tempMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  const geometry = useMemo(() => new THREE.SphereGeometry(0.5, 12, 8), []);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0.85,
        roughness: 0.3,
        metalness: 0.1,
        emissive: new THREE.Color('#00e5ff'),
        emissiveIntensity: 0.3,
      }),
    []
  );

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const id = e.instanceId;
      if (id !== undefined) {
        const data = instanceDataRef.current.get(id);
        if (data) setHoveredSpecies(data.speciesData);
      }
    },
    [setHoveredSpecies]
  );

  const handlePointerOut = useCallback(() => {
    setHoveredSpecies(null);
  }, [setHoveredSpecies]);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      const id = e.instanceId;
      if (id !== undefined) {
        const data = instanceDataRef.current.get(id);
        if (data) setSelectedSpecies(data.speciesData);
      }
    },
    [setSelectedSpecies]
  );

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, maxCount]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  );
}
