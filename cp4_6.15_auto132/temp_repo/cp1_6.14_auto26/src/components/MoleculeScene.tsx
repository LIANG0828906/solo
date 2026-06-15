import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useSpring, animated, config } from '@react-spring/three';
import * as THREE from 'three';
import type { ParsedMolecule, DisplayMode } from '@/types';
import { ELEMENT_INFO, DEFAULT_ELEMENT, HIGHLIGHT_COLOR, BACKGROUND_COLOR } from '@/constants/elements';

interface MoleculeSceneProps {
  molecule: ParsedMolecule;
  displayMode: DisplayMode;
  highlightedAtomIds: Set<string>;
  onAtomClick: (atomId: string) => void;
  autoRotate: boolean;
  rotationSpeed: number;
}

interface BondTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
  atom1Element: string;
  atom2Element: string;
  order: number;
}

function computeBondTransforms(
  molecule: ParsedMolecule,
  atomPositions: Map<string, [number, number, number]>
): BondTransform[] {
  return molecule.bonds.map((bond) => {
    const pos1 = atomPositions.get(bond.atom1Id)!;
    const pos2 = atomPositions.get(bond.atom2Id)!;
    const atom1 = molecule.atoms.find((a) => a.id === bond.atom1Id)!;
    const atom2 = molecule.atoms.find((a) => a.id === bond.atom2Id)!;

    const dx = pos2[0] - pos1[0];
    const dy = pos2[1] - pos1[1];
    const dz = pos2[2] - pos1[2];
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const cx = (pos1[0] + pos2[0]) / 2;
    const cy = (pos1[1] + pos2[1]) / 2;
    const cz = (pos1[2] + pos2[2]) / 2;

    const axis = new THREE.Vector3(dx, dy, dz).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, axis);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);

    return {
      position: [cx, cy, cz],
      rotation: [euler.x, euler.y, euler.z],
      length,
      atom1Element: atom1.element,
      atom2Element: atom2.element,
      order: bond.order,
    };
  });
}

interface AtomMeshProps {
  id: string;
  element: string;
  basePosition: [number, number, number];
  displayMode: DisplayMode;
  highlighted: boolean;
  onClick: (id: string) => void;
  targetRadius: number;
}

function AtomMesh({
  id,
  element,
  basePosition,
  displayMode,
  highlighted,
  onClick,
  targetRadius,
}: AtomMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const info = ELEMENT_INFO[element] || DEFAULT_ELEMENT;
  const baseRadius = info.radius;

  const { scale } = useSpring({
    scale: targetRadius / baseRadius,
    config: config.wobbly,
  });

  const baseColor = new THREE.Color(info.color);
  const highlightColor = new THREE.Color(HIGHLIGHT_COLOR);

  const { color, emissiveIntensity, glowOpacity } = useSpring({
    color: highlighted ? highlightColor.getHexString() : baseColor.getHexString(),
    emissiveIntensity: highlighted ? 1.0 : 0,
    glowOpacity: highlighted ? 0.5 : 0,
    config: config.gentle,
  });

  const labelOffset = baseRadius * 1.8;
  const labelColor = info.color;

  return (
    <group position={basePosition}>
      <animated.group scale={scale}>
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            onClick(id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'default';
          }}
        >
          <sphereGeometry args={[baseRadius, 32, 32]} />
          <animated.meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={emissiveIntensity}
            roughness={0.25}
            metalness={0.15}
          />
        </mesh>

        {highlighted && (
          <animated.mesh scale={1.35}>
            <sphereGeometry args={[baseRadius, 32, 32]} />
            <animated.meshBasicMaterial
              color={HIGHLIGHT_COLOR}
              transparent
              opacity={glowOpacity}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </animated.mesh>
        )}

        {highlighted && (
          <animated.mesh scale={1.55}>
            <sphereGeometry args={[baseRadius, 32, 32]} />
            <animated.meshBasicMaterial
              color={HIGHLIGHT_COLOR}
              transparent
              opacity={glowOpacity.to((v) => v * 0.4)}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </animated.mesh>
        )}
      </animated.group>

      <Text
        position={[0, labelOffset, 0]}
        fontSize={0.38}
        color={labelColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
        userData={{ ignoreRaycast: true }}
      >
        {element}
      </Text>
    </group>
  );
}

interface BondMeshProps {
  transform: BondTransform;
  displayMode: DisplayMode;
}

function BondMesh({ transform, displayMode }: BondMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const info1 = ELEMENT_INFO[transform.atom1Element] || DEFAULT_ELEMENT;
  const info2 = ELEMENT_INFO[transform.atom2Element] || DEFAULT_ELEMENT;

  const isBallStick = displayMode === 'ball-stick';

  const { opacity, bondScale } = useSpring({
    opacity: isBallStick ? 1 : 0,
    bondScale: isBallStick ? 1 : 0.3,
    config: config.gentle,
  });

  const bondRadius = 0.12;
  const halfLength = transform.length / 2;

  const renderBondCylinders = () => {
    const cylinders: JSX.Element[] = [];
    const order = transform.order;
    const offsets = order === 1 ? [0] : order === 2 ? [-0.14, 0.14] : [-0.2, 0, 0.2];

    offsets.forEach((offset, idx) => {
      cylinders.push(
        <animated.mesh
          key={`left-${idx}`}
          position={[offset, -halfLength / 2, 0]}
          scale-x={bondScale}
          scale-z={bondScale}
        >
          <cylinderGeometry args={[bondRadius, bondRadius, halfLength, 16]} />
          <animated.meshStandardMaterial
            color={info1.color}
            roughness={0.35}
            metalness={0.05}
            transparent
            opacity={opacity}
            depthWrite={opacity.to((v) => v > 0.5)}
          />
        </animated.mesh>
      );

      cylinders.push(
        <animated.mesh
          key={`right-${idx}`}
          position={[offset, halfLength / 2, 0]}
          scale-x={bondScale}
          scale-z={bondScale}
        >
          <cylinderGeometry args={[bondRadius, bondRadius, halfLength, 16]} />
          <animated.meshStandardMaterial
            color={info2.color}
            roughness={0.35}
            metalness={0.05}
            transparent
            opacity={opacity}
            depthWrite={opacity.to((v) => v > 0.5)}
          />
        </animated.mesh>
      );
    });

    return cylinders;
  };

  return (
    <animated.group
      ref={groupRef}
      position={transform.position}
      rotation={transform.rotation}
    >
      {renderBondCylinders()}
    </animated.group>
  );
}

interface AutoRotateGroupProps {
  autoRotate: boolean;
  speed: number;
  children: React.ReactNode;
}

function AutoRotateGroup({ autoRotate, speed, children }: AutoRotateGroupProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * speed * 0.5;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

interface CameraControllerProps {
  target: [number, number, number];
  radius: number;
  resetTrigger: number;
}

function CameraController({ target, radius, resetTrigger }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const prevReset = useRef(resetTrigger);

  useEffect(() => {
    if (resetTrigger !== prevReset.current) {
      prevReset.current = resetTrigger;
      const distance = Math.max(radius * 2.8, 10);
      camera.position.set(target[0], target[1] + distance * 0.5, target[2] + distance);
      camera.lookAt(target[0], target[1], target[2]);
      if (controlsRef.current) {
        controlsRef.current.target.set(target[0], target[1], target[2]);
        controlsRef.current.update();
      }
    }
  }, [resetTrigger, target, radius, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={3}
      maxDistance={150}
      makeDefault
      enablePan={true}
      panSpeed={0.8}
      rotateSpeed={0.8}
      zoomSpeed={0.9}
    />
  );
}

function SceneContent({
  molecule,
  displayMode,
  highlightedAtomIds,
  onAtomClick,
  autoRotate,
  rotationSpeed,
  resetTrigger,
}: MoleculeSceneProps & { resetTrigger: number }) {
  const atomPositions = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    molecule.atoms.forEach((atom) => {
      map.set(atom.id, atom.position);
    });
    return map;
  }, [molecule.atoms]);

  const bondTransforms = useMemo(
    () => computeBondTransforms(molecule, atomPositions),
    [molecule, atomPositions]
  );

  const bounds = useMemo(() => {
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;

    molecule.atoms.forEach((atom) => {
      const [x, y, z] = atom.position;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      minZ = Math.min(minZ, z);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      maxZ = Math.max(maxZ, z);
    });

    const center: [number, number, number] = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];
    const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
    const radius = size / 2;

    return { center, radius };
  }, [molecule.atoms]);

  const centeredAtoms = useMemo(() => {
    return molecule.atoms.map((atom) => ({
      ...atom,
      centeredPosition: [
        atom.position[0] - bounds.center[0],
        atom.position[1] - bounds.center[1],
        atom.position[2] - bounds.center[2],
      ] as [number, number, number],
    }));
  }, [molecule.atoms, bounds.center]);

  const centeredBondTransforms = useMemo(() => {
    return bondTransforms.map((t) => ({
      ...t,
      position: [
        t.position[0] - bounds.center[0],
        t.position[1] - bounds.center[1],
        t.position[2] - bounds.center[2],
      ] as [number, number, number],
    }));
  }, [bondTransforms, bounds.center]);

  const getAtomTargetRadius = (element: string, mode: DisplayMode): number => {
    const info = ELEMENT_INFO[element] || DEFAULT_ELEMENT;
    return mode === 'ball-stick' ? info.radius : info.vanDerWaalsRadius * 0.5;
  };

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, bounds.radius * 1.2, bounds.radius * 2.8]}
        fov={45}
        near={0.1}
        far={500}
      />
      <CameraController target={[0, 0, 0]} radius={bounds.radius} resetTrigger={resetTrigger} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[12, 15, 8]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-10, -8, -12]} intensity={0.45} />
      <pointLight position={[0, 12, 0]} intensity={0.6} color="#ffffff" />
      <pointLight position={[-8, 0, 10]} intensity={0.35} color="#e0e0ff" />
      <pointLight position={[8, 0, -10]} intensity={0.25} color="#ffe0e0" />

      <AutoRotateGroup autoRotate={autoRotate} speed={rotationSpeed}>
        {centeredAtoms.map((atom) => (
          <AtomMesh
            key={atom.id}
            id={atom.id}
            element={atom.element}
            basePosition={atom.centeredPosition}
            displayMode={displayMode}
            highlighted={highlightedAtomIds.has(atom.id)}
            onClick={onAtomClick}
            targetRadius={getAtomTargetRadius(atom.element, displayMode)}
          />
        ))}
        {centeredBondTransforms.map((transform, idx) => (
          <BondMesh
            key={`bond-${idx}`}
            transform={transform}
            displayMode={displayMode}
          />
        ))}
      </AutoRotateGroup>
    </>
  );
}

export default function MoleculeScene(props: MoleculeSceneProps) {
  const [resetTrigger, setResetTrigger] = useState(0);

  useEffect(() => {
    const handleReset = () => setResetTrigger((t) => t + 1);
    window.addEventListener('reset-camera', handleReset);
    return () => window.removeEventListener('reset-camera', handleReset);
  }, []);

  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ background: BACKGROUND_COLOR }}
      dpr={[1, 2]}
      frameloop="always"
    >
      <color attach="background" args={[BACKGROUND_COLOR]} />
      <fog attach="fog" args={[BACKGROUND_COLOR, 40, 120]} />
      <SceneContent {...props} resetTrigger={resetTrigger} />
    </Canvas>
  );
}
