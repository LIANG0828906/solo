import { useRef, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Pipeline, PipelineType } from '@/types';
import { PIPELINE_COLORS } from '@/types';

const PIPELINE_VISUAL_CONFIG: Record<PipelineType, {
  color: string;
  emissive: string;
  emissiveIntensity: number;
  metalness: number;
  roughness: number;
  transparent: boolean;
  opacity: number;
  radiusMultiplier: number;
  glowIntensity: number;
}> = {
  water: {
    color: '#2196F3',
    emissive: '#0d47a1',
    emissiveIntensity: 0.15,
    metalness: 0.1,
    roughness: 0.2,
    transparent: true,
    opacity: 0.75,
    radiusMultiplier: 1.0,
    glowIntensity: 0.2,
  },
  power: {
    color: '#FFC107',
    emissive: '#ff6d00',
    emissiveIntensity: 0.4,
    metalness: 0.8,
    roughness: 0.3,
    transparent: false,
    opacity: 1.0,
    radiusMultiplier: 1.0,
    glowIntensity: 0.5,
  },
  communication: {
    color: '#4CAF50',
    emissive: '#1b5e20',
    emissiveIntensity: 0.2,
    metalness: 0.2,
    roughness: 0.6,
    transparent: false,
    opacity: 1.0,
    radiusMultiplier: 1.0,
    glowIntensity: 0.25,
  },
  gas: {
    color: '#F44336',
    emissive: '#b71c1c',
    emissiveIntensity: 0.3,
    metalness: 0.6,
    roughness: 0.4,
    transparent: false,
    opacity: 1.0,
    radiusMultiplier: 1.25,
    glowIntensity: 0.35,
  },
};

const SELECTION_CONFIG = {
  glowColor: '#ffffff',
  glowIntensity: 0.8,
  boundingBoxColor: '#00d2ff',
  boundingBoxOpacity: 0.9,
  pulseSpeed: 2.5,
  edgePadding: 0.12,
  dashSize: 0.08,
  gapSize: 0.05,
};

const ENDPOINT_CONFIG = {
  radiusMultiplier: 1.6,
  opacity: 0.55,
  emissiveIntensity: 0.35,
  selectedEmissiveIntensity: 0.7,
};

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
  const boundingBoxRef = useRef<THREE.LineSegments>(null);
  const pulseRef = useRef(0);
  const glowRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const visualConfig = PIPELINE_VISUAL_CONFIG[pipeline.type];

  const { position, rotation, length, baseRadius, adjustedRadius } = useMemo(() => {
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

    const baseRadius = pipeline.diameter / 2 / 1000;
    const adjustedRadius = baseRadius * visualConfig.radiusMultiplier;

    return {
      position: [midPoint.x, midPoint.y, midPoint.z] as [number, number, number],
      rotation: [rotation.x, rotation.y, rotation.z] as [number, number, number],
      length,
      baseRadius,
      adjustedRadius,
    };
  }, [pipeline, visualConfig.radiusMultiplier]);

  const boundingBoxGeometry = useMemo(() => {
    const start = new THREE.Vector3(pipeline.start.x, pipeline.start.y, pipeline.start.z);
    const end = new THREE.Vector3(pipeline.end.x, pipeline.end.y, pipeline.end.z);
    const padding = SELECTION_CONFIG.edgePadding;
    const r = adjustedRadius + padding;

    const minX = Math.min(start.x, end.x) - r;
    const maxX = Math.max(start.x, end.x) + r;
    const minY = Math.min(start.y, end.y) - r;
    const maxY = Math.max(start.y, end.y) + r;
    const minZ = Math.min(start.z, end.z) - r;
    const maxZ = Math.max(start.z, end.z) + r;

    const box = new THREE.Box3(
      new THREE.Vector3(minX, minY, minZ),
      new THREE.Vector3(maxX, maxY, maxZ)
    );
    const boxSize = new THREE.Vector3();
    const boxCenter = new THREE.Vector3();
    box.getSize(boxSize);
    box.getCenter(boxCenter);

    const boxGeometry = new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z);
    const edges = new THREE.EdgesGeometry(boxGeometry);
    edges.translate(boxCenter.x, boxCenter.y, boxCenter.z);
    return edges;
  }, [pipeline, adjustedRadius]);

  useFrame((_state, delta) => {
    if (selected) {
      pulseRef.current += delta * SELECTION_CONFIG.pulseSpeed;
    }
    if (glowRef.current) {
      const pulse = selected ? 0.5 + Math.sin(pulseRef.current) * 0.3 : 0;
      glowRef.current.emissiveIntensity = visualConfig.emissiveIntensity + SELECTION_CONFIG.glowIntensity * pulse + (selected ? visualConfig.glowIntensity : 0);
    }
    if (boundingBoxRef.current) {
      const mat = boundingBoxRef.current.material as THREE.LineDashedMaterial;
      if (selected && !boundingBoxRef.current.visible) {
        boundingBoxRef.current.computeLineDistances();
      }
      mat.opacity = selected ? SELECTION_CONFIG.boundingBoxOpacity * (0.7 + Math.sin(pulseRef.current) * 0.3) : 0;
      boundingBoxRef.current.visible = selected;
    }
  });

  return (
    <group ref={groupRef} onClick={onClick}>
      {visualConfig.glowIntensity > 0.2 && (
        <mesh position={position} rotation={rotation}>
          <cylinderGeometry args={[adjustedRadius * 1.3, adjustedRadius * 1.3, length, 20]} />
          <meshBasicMaterial
            color={visualConfig.color}
            transparent
            opacity={selected ? 0.25 : 0.1}
          />
        </mesh>
      )}

      <mesh
        position={position}
        rotation={rotation}
        onPointerDown={onBodyPointerDown}
      >
        <cylinderGeometry args={[adjustedRadius, adjustedRadius, length, 24]} />
        <meshStandardMaterial
          ref={(node) => {
            if (node) glowRef.current = node;
          }}
          color={visualConfig.color}
          emissive={selected ? SELECTION_CONFIG.glowColor : visualConfig.emissive}
          emissiveIntensity={visualConfig.emissiveIntensity}
          metalness={visualConfig.metalness}
          roughness={visualConfig.roughness}
          transparent={visualConfig.transparent}
          opacity={visualConfig.opacity}
        />
      </mesh>

      <mesh
        position={[pipeline.start.x, pipeline.start.y, pipeline.start.z]}
        onPointerDown={onStartPointerDown}
      >
        <sphereGeometry args={[baseRadius * ENDPOINT_CONFIG.radiusMultiplier, 16, 16]} />
        <meshStandardMaterial
          color={visualConfig.color}
          transparent
          opacity={ENDPOINT_CONFIG.opacity}
          emissive={selected ? SELECTION_CONFIG.glowColor : visualConfig.emissive}
          emissiveIntensity={selected ? ENDPOINT_CONFIG.selectedEmissiveIntensity : ENDPOINT_CONFIG.emissiveIntensity}
        />
      </mesh>

      <mesh
        position={[pipeline.end.x, pipeline.end.y, pipeline.end.z]}
        onPointerDown={onEndPointerDown}
      >
        <sphereGeometry args={[baseRadius * ENDPOINT_CONFIG.radiusMultiplier, 16, 16]} />
        <meshStandardMaterial
          color={visualConfig.color}
          transparent
          opacity={ENDPOINT_CONFIG.opacity}
          emissive={selected ? SELECTION_CONFIG.glowColor : visualConfig.emissive}
          emissiveIntensity={selected ? ENDPOINT_CONFIG.selectedEmissiveIntensity : ENDPOINT_CONFIG.emissiveIntensity}
        />
      </mesh>

      <lineSegments ref={boundingBoxRef} geometry={boundingBoxGeometry}>
        <lineDashedMaterial
          color={SELECTION_CONFIG.boundingBoxColor}
          transparent
          opacity={0}
          dashSize={SELECTION_CONFIG.dashSize}
          gapSize={SELECTION_CONFIG.gapSize}
          linewidth={2}
        />
      </lineSegments>
    </group>
  );
}

const COLLISION_CONFIG = {
  baseRadius: 0.12,
  color: '#ff1744',
  emissive: '#ff0000',
  baseOpacity: 0.55,
  pulseOpacityMin: 0.3,
  pulseOpacityMax: 0.8,
  pulseSpeed: 4,
  scalePulseSpeed: 2,
  scaleMin: 0.9,
  scaleMax: 1.2,
  focusedEmissiveMultiplier: 1.5,
};

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
      material.opacity =
        COLLISION_CONFIG.pulseOpacityMin +
        (Math.sin(timeRef.current * COLLISION_CONFIG.pulseSpeed) * 0.5 + 0.5) *
          (COLLISION_CONFIG.pulseOpacityMax - COLLISION_CONFIG.pulseOpacityMin);
      const scale =
        COLLISION_CONFIG.scaleMin +
        (Math.sin(timeRef.current * COLLISION_CONFIG.scalePulseSpeed) * 0.5 + 0.5) *
          (COLLISION_CONFIG.scaleMax - COLLISION_CONFIG.scaleMin);
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[COLLISION_CONFIG.baseRadius, 20, 20]} />
      <meshStandardMaterial
        color={COLLISION_CONFIG.color}
        transparent
        opacity={COLLISION_CONFIG.baseOpacity}
        emissive={COLLISION_CONFIG.emissive}
        emissiveIntensity={focused ? COLLISION_CONFIG.focusedEmissiveMultiplier : 0.7}
      />
    </mesh>
  );
}

const PREVIEW_CONFIG = {
  opacity: 0.55,
  emissiveIntensity: 0.4,
  segments: 16,
};

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

    const ptype = type as PipelineType;
    const config = PIPELINE_VISUAL_CONFIG[ptype] || PIPELINE_VISUAL_CONFIG.water;
    const radius = (diameter / 2 / 1000) * config.radiusMultiplier;

    return {
      position: [midPoint.x, midPoint.y, midPoint.z] as [number, number, number],
      rotation: [rotation.x, rotation.y, rotation.z] as [number, number, number],
      length,
      radius,
    };
  }, [start, end, diameter, type]);

  const color = PIPELINE_COLORS[type as keyof typeof PIPELINE_COLORS] || '#ffffff';

  return (
    <group>
      <mesh position={position} rotation={rotation}>
        <cylinderGeometry args={[radius, radius, length, PREVIEW_CONFIG.segments]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={PREVIEW_CONFIG.opacity}
          emissive={color}
          emissiveIntensity={PREVIEW_CONFIG.emissiveIntensity}
        />
      </mesh>
    </group>
  );
}

const SNAP_CONFIG = {
  baseRadius: 0.07,
  color: '#00ff6a',
  emissive: '#00ff6a',
  emissiveIntensity: 1.0,
  baseOpacity: 0.6,
  pulseSpeed: 6,
  pulseAmplitude: 0.3,
};

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
      material.opacity =
        SNAP_CONFIG.baseOpacity + Math.sin(timeRef.current * SNAP_CONFIG.pulseSpeed) * SNAP_CONFIG.pulseAmplitude;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[SNAP_CONFIG.baseRadius, 16, 16]} />
      <meshStandardMaterial
        color={SNAP_CONFIG.color}
        transparent
        opacity={SNAP_CONFIG.baseOpacity}
        emissive={SNAP_CONFIG.emissive}
        emissiveIntensity={SNAP_CONFIG.emissiveIntensity}
      />
    </mesh>
  );
}

export { PipelineMesh, CollisionMarker, PreviewPipeline, SnapIndicator };
