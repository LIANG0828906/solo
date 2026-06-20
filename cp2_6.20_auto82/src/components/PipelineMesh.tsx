import { useRef, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Pipeline } from '@/types';
import { PIPELINE_COLORS } from '@/types';

interface PipelineMeshProps {
  pipeline: Pipeline;
  selected: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onBodyPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onStartPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onEndPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
}

function PipelineMesh({ pipeline, selected, onClick, onBodyPointerDown, onStartPointerDown, onEndPointerDown }: PipelineMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef(0);

  const { position, rotation, length, radius } = useMemo(() => {
    const start = new THREE.Vector3(pipeline.start.x, pipeline.start.y, pipeline.start.z);
    const end = new THREE.Vector3(pipeline.end.x, pipeline.end.y, pipeline.end.z);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    const rotation = new THREE.Euler();
    if (length > 0.001) {
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize()
      );
      rotation.setFromQuaternion(quaternion);
    }

    return {
      position: [midPoint.x, midPoint.y, midPoint.z] as [number, number, number],
      rotation: [rotation.x, rotation.y, rotation.z] as [number, number, number],
      length,
      radius: pipeline.diameter / 2 / 1000,
    };
  }, [pipeline]);

  useFrame((_state, delta) => {
    if (selected) {
      pulseRef.current += delta * 3;
    }
  });

  const color = PIPELINE_COLORS[pipeline.type];

  return (
    <group ref={groupRef} onClick={onClick}>
      <mesh
        position={position}
        rotation={rotation}
        onPointerDown={onBodyPointerDown}
      >
        <cylinderGeometry args={[radius, radius, length, 16]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.4}
          emissive={selected ? color : '#000000'}
          emissiveIntensity={selected ? 0.3 : 0}
        />
      </mesh>

      <mesh
        position={[pipeline.start.x, pipeline.start.y, pipeline.start.z]}
        onPointerDown={onStartPointerDown}
      >
        <sphereGeometry args={[radius * 1.5, 12, 12]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.6}
          emissive={color}
          emissiveIntensity={selected ? 0.5 : 0.2}
        />
      </mesh>

      <mesh
        position={[pipeline.end.x, pipeline.end.y, pipeline.end.z]}
        onPointerDown={onEndPointerDown}
      >
        <sphereGeometry args={[radius * 1.5, 12, 12]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.6}
          emissive={color}
          emissiveIntensity={selected ? 0.5 : 0.2}
        />
      </mesh>
    </group>
  );
}

interface CollisionMarkerProps {
  position: [number, number, number];
  focused?: boolean;
}

function CollisionMarker({ position, focused }: CollisionMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_state, delta) => {
    timeRef.current += delta;
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = 0.3 + Math.sin(timeRef.current * 4) * 0.25 + 0.3;
      const scale = 1 + Math.sin(timeRef.current * 2) * 0.15;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial
        color="#ff0000"
        transparent
        opacity={0.6}
        emissive="#ff0000"
        emissiveIntensity={focused ? 1 : 0.5}
      />
    </mesh>
  );
}

interface PreviewPipelineProps {
  start: { x: number; y: number; z: number };
  end: { x: number; y: number; z: number };
  diameter: number;
  type: string;
}

function PreviewPipeline({ start, end, diameter, type }: PreviewPipelineProps) {
  const { position, rotation, length, radius } = useMemo(() => {
    const startVec = new THREE.Vector3(start.x, start.y, start.z);
    const endVec = new THREE.Vector3(end.x, end.y, end.z);
    const direction = new THREE.Vector3().subVectors(endVec, startVec);
    const length = direction.length();
    const midPoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);

    const rotation = new THREE.Euler();
    if (length > 0.001) {
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize()
      );
      rotation.setFromQuaternion(quaternion);
    }

    return {
      position: [midPoint.x, midPoint.y, midPoint.z] as [number, number, number],
      rotation: [rotation.x, rotation.y, rotation.z] as [number, number, number],
      length,
      radius: diameter / 2 / 1000,
    };
  }, [start, end, diameter]);

  const color = PIPELINE_COLORS[type as keyof typeof PIPELINE_COLORS] || '#ffffff';

  return (
    <group>
      <mesh position={position} rotation={rotation}>
        <cylinderGeometry args={[radius, radius, length, 12]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.5}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

interface SnapIndicatorProps {
  position: [number, number, number];
}

function SnapIndicator({ position }: SnapIndicatorProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_state, delta) => {
    timeRef.current += delta;
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = 0.4 + Math.sin(timeRef.current * 6) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.06, 12, 12]} />
      <meshStandardMaterial
        color="#00ff00"
        transparent
        opacity={0.6}
        emissive="#00ff00"
        emissiveIntensity={0.8}
      />
    </mesh>
  );
}

export { PipelineMesh, CollisionMarker, PreviewPipeline, SnapIndicator };
