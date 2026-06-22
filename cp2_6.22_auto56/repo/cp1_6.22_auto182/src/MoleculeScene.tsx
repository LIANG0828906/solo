import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { AtomData, BondData, calculateMoleculeRadius } from './DataLoader';

interface MoleculeSceneProps {
  atoms: AtomData[];
  bonds: BondData[];
  onAtomClick: (atom: AtomData) => void;
  resetTrigger: number;
}

const Atom: React.FC<{
  atom: AtomData;
  scale: number;
  onClick: () => void;
}> = ({ atom, scale, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const baseRadius = atom.covalentRadius * 0.8;
  const displayScale = hovered ? scale * 1.15 : scale;

  useFrame(() => {
    if (ringRef.current) {
      ringRef.current.rotation.x += 0.01;
      ringRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={[atom.x, atom.y, atom.z]}>
      <mesh
        ref={meshRef}
        scale={displayScale}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[baseRadius, 32, 32]} />
        <meshStandardMaterial
          color={atom.color}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      {hovered && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} scale={displayScale}>
          <ringGeometry args={[baseRadius * 1.1, baseRadius * 1.2, 32]} />
          <meshBasicMaterial
            color={atom.color}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

const Bond: React.FC<{
  from: THREE.Vector3;
  to: THREE.Vector3;
  order: number;
  fromRadius: number;
  toRadius: number;
}> = ({ from, to, order, fromRadius, toRadius }) => {
  const bondRadius = 0.15;
  const bondSpacing = 0.2;

  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();
  const midPoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);

  const rotation = new THREE.Euler();
  rotation.setFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    )
  );

  const adjustedLength = length - fromRadius * 0.5 - toRadius * 0.5;

  const renderBondCylinder = (offset: number) => {
    const perpendicular = new THREE.Vector3()
      .crossVectors(direction, new THREE.Vector3(0, 0, 1))
      .normalize();
    if (perpendicular.length() === 0) {
      perpendicular.set(1, 0, 0);
    }

    const position = midPoint
      .clone()
      .add(perpendicular.multiplyScalar(offset));

    return (
      <mesh
        key={offset}
        position={position}
        rotation={rotation}
      >
        <cylinderGeometry args={[bondRadius, bondRadius, adjustedLength, 16]} />
        <meshStandardMaterial color="#C0C0C0" roughness={0.5} metalness={0.3} />
      </mesh>
    );
  };

  if (order >= 2) {
    return (
      <group>
        {renderBondCylinder(-bondSpacing / 2)}
        {renderBondCylinder(bondSpacing / 2)}
      </group>
    );
  }

  return renderBondCylinder(0);
};

const MoleculeGroup: React.FC<{
  atoms: AtomData[];
  bonds: BondData[];
  scale: number;
  onAtomClick: (atom: AtomData) => void;
}> = ({ atoms, bonds, scale, onAtomClick }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, [atoms]);

  const displayScale = visible ? scale : 0.01;

  return (
    <group ref={groupRef} scale={displayScale}>
      {atoms.map((atom) => (
        <Atom
          key={atom.id}
          atom={atom}
          scale={1}
          onClick={() => onAtomClick(atom)}
        />
      ))}
      {bonds.map((bond, index) => {
        const fromAtom = atoms.find((a) => a.id === bond.from);
        const toAtom = atoms.find((a) => a.id === bond.to);
        if (!fromAtom || !toAtom) return null;

        return (
          <Bond
            key={index}
            from={new THREE.Vector3(fromAtom.x, fromAtom.y, fromAtom.z)}
            to={new THREE.Vector3(toAtom.x, toAtom.y, toAtom.z)}
            order={bond.order}
            fromRadius={fromAtom.covalentRadius * 0.8}
            toRadius={toAtom.covalentRadius * 0.8}
          />
        );
      })}
    </group>
  );
};

const CameraController: React.FC<{
  resetTrigger: number;
  moleculeRadius: number;
}> = ({ resetTrigger, moleculeRadius }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const animatingRef = useRef(false);
  const startPosRef = useRef(new THREE.Vector3());
  const endPosRef = useRef(new THREE.Vector3());
  const startTimeRef = useRef(0);
  const animationDuration = 1000;

  useEffect(() => {
    if (resetTrigger > 0) {
      startPosRef.current.copy(camera.position);
      endPosRef.current.set(0, 0, moleculeRadius * 3);
      startTimeRef.current = performance.now();
      animatingRef.current = true;
    }
  }, [resetTrigger, camera, moleculeRadius]);

  useFrame(() => {
    if (animatingRef.current) {
      const elapsed = performance.now() - startTimeRef.current;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(
        startPosRef.current,
        endPosRef.current,
        easeProgress
      );

      if (controlsRef.current) {
        controlsRef.current.target.lerp(
          new THREE.Vector3(0, 0, 0),
          easeProgress
        );
        controlsRef.current.update();
      }

      if (progress >= 1) {
        animatingRef.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.1}
      minDistance={moleculeRadius * 0.5}
      maxDistance={moleculeRadius * 5}
      enablePan={true}
    />
  );
};

const SceneContent: React.FC<MoleculeSceneProps> = ({
  atoms,
  bonds,
  onAtomClick,
  resetTrigger,
}) => {
  const moleculeRadius = useMemo(
    () => calculateMoleculeRadius(atoms),
    [atoms]
  );

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#8B5CF6" />

      <MoleculeGroup
        atoms={atoms}
        bonds={bonds}
        scale={1}
        onAtomClick={onAtomClick}
      />

      <CameraController
        resetTrigger={resetTrigger}
        moleculeRadius={moleculeRadius}
      />
    </>
  );
};

const MoleculeScene: React.FC<MoleculeSceneProps> = (props) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      gl={{ antialias: true }}
      style={{
        background: 'linear-gradient(180deg, #0B0C10 0%, #1F2833 100%)',
        width: '100%',
        height: '100%',
      }}
    >
      <SceneContent {...props} />
    </Canvas>
  );
};

export default MoleculeScene;
