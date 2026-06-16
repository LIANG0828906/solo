import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  OrganelleData,
  OrganelleType,
  ViewPreset,
  organelles,
} from '../data/cellOrganelles';

interface SceneProps {
  onOrganelleClick: (organelle: OrganelleData | null) => void;
  opacity: number;
  visibleOrganelles: Record<OrganelleType, boolean>;
  hoveredOrganelle: OrganelleType | null;
  selectedOrganelle: OrganelleType | null;
  viewPreset: ViewPreset | null;
}

const CELL_WALL_SIZE = 7;
const VACUOLE_RADIUS = 2.5;

function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

function lerpVec3(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function SelectionGlow({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const glowRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (glowRef.current && enabled) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * Math.PI) * 0.05;
      glowRef.current.scale.setScalar(pulse);
    } else if (glowRef.current) {
      glowRef.current.scale.setScalar(1);
    }
  });

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <group>
      {children}
      <group ref={glowRef}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === 'mesh') {
            const originalMesh = child as React.ReactElement<any>;
            return React.cloneElement(originalMesh, {
              ...originalMesh.props,
              material: (
                <meshBasicMaterial
                  color="#ffd700"
                  transparent
                  opacity={0.3}
                  side={THREE.BackSide}
                />
              ),
              scale: 1.1,
              onClick: undefined,
            });
          }
          return null;
        })}
      </group>
    </group>
  );
}

function CellWall({ opacity }: { opacity: number }) {
  const edgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(CELL_WALL_SIZE, CELL_WALL_SIZE, CELL_WALL_SIZE)),
    []
  );

  return (
    <group>
      <mesh>
        <boxGeometry args={[CELL_WALL_SIZE, CELL_WALL_SIZE, CELL_WALL_SIZE]} />
        <meshStandardMaterial
          color="#81c784"
          transparent
          opacity={0.15 * opacity}
          side={THREE.BackSide}
        />
      </mesh>
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color="#ffd700" transparent opacity={opacity} />
      </lineSegments>
    </group>
  );
}

function CellMembrane({ opacity }: { opacity: number }) {
  const size = CELL_WALL_SIZE * 0.96;
  return (
    <mesh>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial
        color="#fff59d"
        transparent
        opacity={0.1 * opacity}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

function Vacuole({ opacity }: { opacity: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 80;

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = VACUOLE_RADIUS * 0.8 * Math.random();
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame(() => {
    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3] += velocities[i * 3];
        pos[i * 3 + 1] += velocities[i * 3 + 1];
        pos[i * 3 + 2] += velocities[i * 3 + 2];

        const dist = Math.sqrt(
          pos[i * 3] ** 2 + pos[i * 3 + 1] ** 2 + pos[i * 3 + 2] ** 2
        );
        if (dist > VACUOLE_RADIUS * 0.85) {
          const norm = 1 / dist;
          velocities[i * 3] *= -0.8;
          velocities[i * 3 + 1] *= -0.8;
          velocities[i * 3 + 2] *= -0.8;
          pos[i * 3] *= norm * VACUOLE_RADIUS * 0.8;
          pos[i * 3 + 1] *= norm * VACUOLE_RADIUS * 0.8;
          pos[i * 3 + 2] *= norm * VACUOLE_RADIUS * 0.8;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[VACUOLE_RADIUS, 64, 64]} />
        <meshStandardMaterial
          color="#ce93d8"
          transparent
          opacity={0.3 * opacity}
        />
      </mesh>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#4fc3f7"
          size={0.05}
          transparent
          opacity={opacity}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

function Nucleus({
  data,
  opacity,
  isSelected,
  isHovered,
  onClick,
}: {
  data: OrganelleData;
  opacity: number;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef(0);

  useFrame((state) => {
    if (meshRef.current) {
      pulseRef.current += 0.03;
      const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const originalPos = meshRef.current.geometry.userData.originalPositions;
        if (originalPos) {
          const nx = originalPos[i];
          const ny = originalPos[i + 1];
          const nz = originalPos[i + 2];
          const wave = Math.sin(pulseRef.current + nx * 2 + ny * 3) * 0.03;
          positions[i] = nx + nx * wave;
          positions[i + 1] = ny + ny * wave;
          positions[i + 2] = nz + nz * wave;
        }
      }
      meshRef.current.geometry.attributes.position.needsUpdate = true;
      meshRef.current.geometry.computeVertexNormals();
    }
  });

  const handleGeometryCreated = (geometry: THREE.SphereGeometry) => {
    geometry.userData.originalPositions = new Float32Array(
      geometry.attributes.position.array
    );
  };

  const scale = data.scale * (isHovered ? 1.1 : 1);

  return (
    <Outline
      enabled={isSelected}
      color="#ffd700"
      thickness={0.03}
      strength={1.5}
    >
      <mesh
        ref={meshRef}
        position={data.position}
        scale={scale}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <sphereGeometry
          args={[0.6, 32, 32]}
          onUpdate={handleGeometryCreated}
        />
        <meshStandardMaterial
          color={data.color}
          transparent
          opacity={opacity}
        />
      </mesh>
    </Outline>
  );
}

function Chloroplast({
  position,
  color,
  scale,
  opacity,
  isSelected,
  isHovered,
  onClick,
}: {
  position: [number, number, number];
  color: string;
  scale: number;
  opacity: number;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const s = scale * (isHovered ? 1.1 : 1);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  return (
    <Outline
      enabled={isSelected}
      color="#ffd700"
      thickness={0.03}
      strength={1.5}
    >
      <group
        ref={groupRef}
        position={position}
        scale={[s * 0.6, s * 0.4, s * 0.4]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color={color} transparent opacity={opacity} />
        </mesh>
        {[0.3, 0.1, -0.1, -0.3].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <cylinderGeometry args={[0.7, 0.7, 0.05, 32]} />
            <meshStandardMaterial
              color="#ffd700"
              transparent
              opacity={0.7 * opacity}
            />
          </mesh>
        ))}
      </group>
    </Outline>
  );
}

function Mitochondrion({
  position,
  color,
  scale,
  opacity,
  isSelected,
  isHovered,
  onClick,
}: {
  position: [number, number, number];
  color: string;
  scale: number;
  opacity: number;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const s = scale * (isHovered ? 1.1 : 1);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.z += 0.005;
    }
  });

  return (
    <Outline
      enabled={isSelected}
      color="#ffd700"
      thickness={0.03}
      strength={1.5}
    >
      <group
        ref={groupRef}
        position={position}
        scale={[s * 0.4, s * 0.25, s * 0.25]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color={color} transparent opacity={opacity} />
        </mesh>
        {[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <planeGeometry args={[0.4, 1.5]} />
            <meshStandardMaterial
              color="#ffb74d"
              transparent
              opacity={0.6 * opacity}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>
    </Outline>
  );
}

function Golgi({
  data,
  opacity,
  isSelected,
  isHovered,
  onClick,
}: {
  data: OrganelleData;
  opacity: number;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const s = data.scale * (isHovered ? 1.1 : 1);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.004;
    }
  });

  return (
    <Outline
      enabled={isSelected}
      color="#ffd700"
      thickness={0.03}
      strength={1.5}
    >
      <group
        ref={groupRef}
        position={data.position}
        scale={s}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} position={[0, (i - 2) * 0.15, 0]} rotation={[0.2, 0, 0]}>
            <cylinderGeometry args={[0.5 - i * 0.03, 0.5 - i * 0.03, 0.08, 32]} />
            <meshStandardMaterial
              color={data.color}
              transparent
              opacity={opacity}
            />
          </mesh>
        ))}
      </group>
    </Outline>
  );
}

function EndoplasmicReticulum({
  data,
  opacity,
  isSelected,
  isHovered,
  onClick,
}: {
  data: OrganelleData;
  opacity: number;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const s = data.scale * (isHovered ? 1.05 : 1);

  const curvePoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const x = Math.sin(t * Math.PI * 4) * 0.8;
      const y = (t - 0.5) * 2;
      const z = Math.cos(t * Math.PI * 3) * 0.5;
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }, []);

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(curvePoints),
    [curvePoints]
  );
  const tubeGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, 100, 0.06, 12, false),
    [curve]
  );

  return (
    <Outline
      enabled={isSelected}
      color="#ffd700"
      thickness={0.03}
      strength={1.5}
    >
      <group
        ref={groupRef}
        position={data.position}
        scale={s}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <mesh geometry={tubeGeometry}>
          <meshStandardMaterial
            color={data.color}
            transparent
            opacity={0.6 * opacity}
          />
        </mesh>
      </group>
    </Outline>
  );
}

function Ribosomes({
  data,
  opacity,
  isSelected,
}: {
  data: OrganelleData;
  opacity: number;
  isSelected: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const count = data.count || 20;

  const positions = useMemo(() => {
    const pos: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const x = data.position[0] + Math.sin(t * Math.PI * 4) * 1 + (Math.random() - 0.5) * 0.3;
      const y = data.position[1] + (t - 0.5) * 2 + (Math.random() - 0.5) * 0.3;
      const z = data.position[2] + Math.cos(t * Math.PI * 3) * 0.6 + (Math.random() - 0.5) * 0.3;
      pos.push([x, y, z]);
    }
    return pos;
  }, [data.position, count]);

  return (
    <Outline
      enabled={isSelected}
      color="#ffd700"
      thickness={0.02}
      strength={1.5}
    >
      <group ref={groupRef}>
        {positions.map((pos, i) => (
          <mesh
            key={i}
            position={pos}
            scale={data.scale}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial
              color={data.color}
              transparent
              opacity={opacity}
            />
          </mesh>
        ))}
      </group>
    </Outline>
  );
}

function Centrosome({
  data,
  opacity,
  isSelected,
  isHovered,
  onClick,
}: {
  data: OrganelleData;
  opacity: number;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const s = data.scale * (isHovered ? 1.1 : 1);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;
    }
  });

  return (
    <Outline
      enabled={isSelected}
      color="#ffd700"
      thickness={0.03}
      strength={1.5}
    >
      <group
        ref={groupRef}
        position={data.position}
        scale={s}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.6, 16]} />
          <meshStandardMaterial
            color={data.color}
            transparent
            opacity={opacity}
          />
        </mesh>
        <mesh position={[-0.2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.6, 16]} />
          <meshStandardMaterial
            color={data.color}
            transparent
            opacity={opacity}
          />
        </mesh>
      </group>
    </Outline>
  );
}

function MultiOrganelleGroup({
  type,
  data,
  opacity,
  isSelected,
  isHovered,
  onClick,
  visible,
}: {
  type: OrganelleType;
  data: OrganelleData;
  opacity: number;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  visible: boolean;
}) {
  if (!visible) return null;

  const count = data.count || 1;

  const positions = useMemo(() => {
    const pos: [number, number, number][] = [];
    if (count === 1) {
      pos.push(data.position);
    } else {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const radius = 2;
        const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
        const y = Math.sin(angle) * radius * 0.6 + (Math.random() - 0.5) * 0.5;
        const z = Math.sin(angle * 0.7) * radius + (Math.random() - 0.5) * 0.5;
        pos.push([x, y, z]);
      }
    }
    return pos;
  }, [data.position, count]);

  if (type === 'chloroplast') {
    return (
      <>
        {positions.map((pos, i) => (
          <Chloroplast
            key={i}
            position={pos}
            color={data.color}
            scale={data.scale}
            opacity={opacity}
            isSelected={isSelected}
            isHovered={isHovered}
            onClick={onClick}
          />
        ))}
      </>
    );
  }

  if (type === 'mitochondrion') {
    return (
      <>
        {positions.map((pos, i) => (
          <Mitochondrion
            key={i}
            position={pos}
            color={data.color}
            scale={data.scale}
            opacity={opacity}
            isSelected={isSelected}
            isHovered={isHovered}
            onClick={onClick}
          />
        ))}
      </>
    );
  }

  return null;
}

function CameraController({
  viewPreset,
  controlsRef,
}: {
  viewPreset: ViewPreset | null;
  controlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();
  const [targetPos, setTargetPos] = useState<[number, number, number] | null>(null);
  const [targetLookAt, setTargetLookAt] = useState<[number, number, number] | null>(null);
  const [animProgress, setAnimProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const startPos = useRef<[number, number, number]>([0, 0, 0]);
  const startLookAt = useRef<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    if (viewPreset && controlsRef.current) {
      startPos.current = [camera.position.x, camera.position.y, camera.position.z];
      startLookAt.current = [
        controlsRef.current.target.x,
        controlsRef.current.target.y,
        controlsRef.current.target.z,
      ];
      setTargetPos(viewPreset.position);
      setTargetLookAt(viewPreset.target);
      setAnimProgress(0);
      setIsAnimating(true);
    }
  }, [viewPreset, camera.position, controlsRef]);

  useFrame((_, delta) => {
    if (isAnimating && targetPos && targetLookAt) {
      const newProgress = Math.min(animProgress + delta * 2, 1);
      setAnimProgress(newProgress);

      const eased = 1 - Math.pow(1 - newProgress, 3);
      const newPos = lerpVec3(startPos.current, targetPos, eased);
      const newLookAt = lerpVec3(startLookAt.current, targetLookAt, eased);

      camera.position.set(newPos[0], newPos[1], newPos[2]);
      if (controlsRef.current) {
        controlsRef.current.target.set(newLookAt[0], newLookAt[1], newLookAt[2]);
      }

      if (newProgress >= 1) {
        setIsAnimating(false);
        setTargetPos(null);
        setTargetLookAt(null);
      }
    }
  });

  return null;
}

function SceneContent({
  onOrganelleClick,
  opacity,
  visibleOrganelles,
  hoveredOrganelle,
  selectedOrganelle,
  viewPreset,
  controlsRef,
}: SceneProps & { controlsRef: React.RefObject<any> }) {
  const handleClick = (type: OrganelleType) => {
    const organelle = organelles.find((o) => o.type === type);
    onOrganelleClick(organelle || null);
  };

  return (
    <>
      <CameraController viewPreset={viewPreset} controlsRef={controlsRef} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-10, -5, -10]} intensity={0.5} color="#88ccff" />

      <CellWall opacity={opacity} />
      <CellMembrane opacity={opacity} />
      <Vacuole opacity={opacity} />

      {organelles.map((organelle) => {
        const isSelected = selectedOrganelle === organelle.type;
        const isHovered = hoveredOrganelle === organelle.type;
        const visible = visibleOrganelles[organelle.type];

        if (!visible) return null;

        if (organelle.type === 'chloroplast' || organelle.type === 'mitochondrion') {
          return (
            <MultiOrganelleGroup
              key={organelle.id}
              type={organelle.type}
              data={organelle}
              opacity={opacity}
              isSelected={isSelected}
              isHovered={isHovered}
              onClick={() => handleClick(organelle.type)}
              visible={visible}
            />
          );
        }

        if (organelle.type === 'nucleus') {
          return (
            <Nucleus
              key={organelle.id}
              data={organelle}
              opacity={opacity}
              isSelected={isSelected}
              isHovered={isHovered}
              onClick={() => handleClick(organelle.type)}
            />
          );
        }

        if (organelle.type === 'golgi') {
          return (
            <Golgi
              key={organelle.id}
              data={organelle}
              opacity={opacity}
              isSelected={isSelected}
              isHovered={isHovered}
              onClick={() => handleClick(organelle.type)}
            />
          );
        }

        if (organelle.type === 'er') {
          return (
            <EndoplasmicReticulum
              key={organelle.id}
              data={organelle}
              opacity={opacity}
              isSelected={isSelected}
              isHovered={isHovered}
              onClick={() => handleClick(organelle.type)}
            />
          );
        }

        if (organelle.type === 'ribosome') {
          return (
            <Ribosomes
              key={organelle.id}
              data={organelle}
              opacity={opacity}
              isSelected={isSelected}
            />
          );
        }

        if (organelle.type === 'centrosome') {
          return (
            <Centrosome
              key={organelle.id}
              data={organelle}
              opacity={opacity}
              isSelected={isSelected}
              isHovered={isHovered}
              onClick={() => handleClick(organelle.type)}
            />
          );
        }

        return null;
      })}
    </>
  );
}

const Scene: React.FC<SceneProps> = (props) => {
  const controlsRef = useRef<any>(null);

  return (
    <Canvas
      camera={{ position: [8, 6, 8], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      onClick={() => props.onOrganelleClick(null)}
    >
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={20}
      />
      <SceneContent {...props} controlsRef={controlsRef} />
    </Canvas>
  );
};

export default Scene;
