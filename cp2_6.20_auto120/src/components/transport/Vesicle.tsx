import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PathData } from '@/types';
import { createCatmullRomCurve, getCurveLength } from '@/utils/pathUtils';
import { useSceneStore } from '@/store/sceneStore';

interface VesicleProps {
  pathData: PathData;
  progress: number;
  isPlaying: boolean;
  trailLength: number;
}

export default function Vesicle({ pathData, progress, isPlaying, trailLength }: VesicleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const vesicleSize = useSceneStore((state) => state.params.vesicleSize);
  const setProgress = useSceneStore((state) => state.setProgress);
  const setPlaying = useSceneStore((state) => state.setPlaying);

  const curve = useMemo(() => {
    return createCatmullRomCurve(pathData.startPoint, pathData.controlPoints, pathData.endPoint);
  }, [pathData]);

  const curveLength = useMemo(() => getCurveLength(curve), [curve]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (instancedMeshRef.current) {
      for (let i = 0; i < 20; i++) {
        dummy.position.set(0, -1000, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [dummy]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    let currentProgress = progress;

    if (isPlaying) {
      const speed = pathData.speed;
      const progressDelta = (speed * delta) / curveLength;
      currentProgress = progress + progressDelta;

      if (currentProgress >= 1) {
        currentProgress = 1;
        setProgress(1);
        setPlaying(false);
      } else {
        setProgress(currentProgress);
      }
    }

    const point = curve.getPoint(currentProgress);
    meshRef.current.position.copy(point);

    if (instancedMeshRef.current) {
      const effectiveTrailLength = Math.min(trailLength, 20);
      for (let i = 0; i < 20; i++) {
        if (i < effectiveTrailLength) {
          const t = Math.max(0, currentProgress - (i + 1) * 0.02);
          const trailPoint = curve.getPoint(t);
          const scale = Math.max(0, 1 - i * 0.05);
          dummy.position.copy(trailPoint);
          dummy.scale.setScalar(scale);
          dummy.updateMatrix();
          instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
          instancedMeshRef.current.setColorAt(
            i,
            new THREE.Color(`rgba(250, 204, 21, ${Math.max(0, 0.7 - i * 0.035)})`)
          );
        } else {
          dummy.position.set(0, -1000, 0);
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
        }
      }
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      if (instancedMeshRef.current.instanceColor) {
        instancedMeshRef.current.instanceColor.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[vesicleSize, 32, 32]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <instancedMesh ref={instancedMeshRef} args={[undefined, undefined, 20]}>
        <sphereGeometry args={[vesicleSize, 16, 16]} />
        <meshStandardMaterial
          color="#facc15"
          transparent
          opacity={0.7}
        />
      </instancedMesh>
    </group>
  );
}
