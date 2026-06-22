import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDreamStore } from '@/store/useDreamStore';
import type { DreamConnection as DreamConnectionType } from '@/types/dream';

interface DreamConnectionProps {
  connection: DreamConnectionType;
  fromPosition: [number, number, number];
  toPosition: [number, number, number];
}

const CURVE_POINTS = 50;

export function DreamConnection({
  connection,
  fromPosition,
  toPosition,
}: DreamConnectionProps) {
  const lineRef = useRef<THREE.Line>(null);
  const glowLineRef = useRef<THREE.Line>(null);
  const { dreamIntensity, nodes } = useDreamStore();

  const fromNode = nodes.find((n) => n.id === connection.from);
  const toNode = nodes.find((n) => n.id === connection.to);
  const lineColor = fromNode?.color || '#9b59b6';

  const { positions, originalPositions } = useMemo(() => {
    const positions = new Float32Array(CURVE_POINTS * 3);
    const originalPositions = new Float32Array(CURVE_POINTS * 3);

    for (let i = 0; i < CURVE_POINTS; i++) {
      const t = i / (CURVE_POINTS - 1);
      const x = fromPosition[0] + (toPosition[0] - fromPosition[0]) * t;
      const y = fromPosition[1] + (toPosition[1] - fromPosition[1]) * t;
      const z = fromPosition[2] + (toPosition[2] - fromPosition[2]) * t;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;
    }

    return { positions, originalPositions };
  }, [fromPosition, toPosition]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  useFrame((state) => {
    if (!lineRef.current || !glowLineRef.current) return;

    const time = state.clock.elapsedTime;
    const positionsAttr = lineRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const glowPositionsAttr = glowLineRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;

    const waveAmplitude = (dreamIntensity / 100) * 0.5;
    const waveSpeed = 1 + (dreamIntensity / 100) * 3;
    const flowOffset = time * waveSpeed;

    const fromVec = new THREE.Vector3(...fromPosition);
    const toVec = new THREE.Vector3(...toPosition);
    const direction = new THREE.Vector3().subVectors(toVec, fromVec).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const perpendicular = new THREE.Vector3().crossVectors(direction, up).normalize();

    for (let i = 0; i < CURVE_POINTS; i++) {
      const t = i / (CURVE_POINTS - 1);

      const wave1 = Math.sin(t * Math.PI * 4 + flowOffset) * waveAmplitude;
      const wave2 = Math.cos(t * Math.PI * 3 + flowOffset * 0.7) * waveAmplitude * 0.5;

      const baseX = originalPositions[i * 3];
      const baseY = originalPositions[i * 3 + 1];
      const baseZ = originalPositions[i * 3 + 2];

      const offsetX = perpendicular.x * wave1 + up.x * wave2;
      const offsetY = perpendicular.y * wave1 + up.y * wave2;
      const offsetZ = perpendicular.z * wave1 + up.z * wave2;

      positionsAttr.setXYZ(i, baseX + offsetX, baseY + offsetY, baseZ + offsetZ);
      glowPositionsAttr.setXYZ(i, baseX + offsetX, baseY + offsetY, baseZ + offsetZ);
    }

    positionsAttr.needsUpdate = true;
    glowPositionsAttr.needsUpdate = true;

    const flowProgress = (time * 0.5) % 1;
    const lineMaterial = lineRef.current.material as THREE.LineBasicMaterial;
    lineMaterial.opacity = 0.4 + Math.sin(flowProgress * Math.PI * 2) * 0.2 + (dreamIntensity / 100) * 0.3;
  });

  return (
    <group>
      <line ref={lineRef} geometry={geometry}>
        <lineBasicMaterial
          color={lineColor}
          transparent
          opacity={0.6}
          linewidth={2}
        />
      </line>
      <line ref={glowLineRef} geometry={geometry}>
        <lineBasicMaterial
          color={lineColor}
          transparent
          opacity={0.3}
          linewidth={4}
        />
      </line>
    </group>
  );
}
