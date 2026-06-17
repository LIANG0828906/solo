import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMoleculeStore } from '@/store';
import { MoleculeData, AtomData, createBondGeometry, getMoleculeCenter } from '@/utils/renderAtoms';
import moleculesData from '@/data/molecules.json';

const moleculeMap = moleculesData as Record<string, MoleculeData>;

function Atom({
  atom,
  showLabel,
  center,
  scale,
}: {
  atom: AtomData;
  showLabel: boolean;
  center: THREE.Vector3;
  scale: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);

  return (
    <group position={[atom.x - center.x, atom.y - center.y, atom.z - center.z]}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[atom.radius, 32, 32]} />
        <meshPhysicalMaterial
          color={atom.color}
          transparent
          opacity={hovered ? 0.95 : 0.85}
          roughness={0.3}
          metalness={0.1}
          clearcoat={0.3}
          emissive={hovered ? atom.color : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      {showLabel && (
        <Html
          position={[0, atom.radius + 0.2, 0]}
          center
          style={{
            pointerEvents: 'none',
            transform: `scale(${Math.max(0.3, scale)})`,
            transformOrigin: 'center bottom',
          }}
        >
          <div
            style={{
              background: 'rgba(0,0,0,0.7)',
              borderRadius: '4px',
              padding: '2px 6px',
              color: '#fff',
              fontSize: '16px',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              lineHeight: '1.2',
            }}
          >
            {atom.element}
          </div>
        </Html>
      )}
    </group>
  );
}

function Bond({
  atomFrom,
  atomTo,
  bondOrder,
  center,
}: {
  atomFrom: AtomData;
  atomTo: AtomData;
  bondOrder: number;
  center: THREE.Vector3;
}) {
  const from = new THREE.Vector3(atomFrom.x - center.x, atomFrom.y - center.y, atomFrom.z - center.z);
  const to = new THREE.Vector3(atomTo.x - center.x, atomTo.y - center.y, atomTo.z - center.z);
  const { positions, rotations, scales } = useMemo(
    () => createBondGeometry(from, to, bondOrder),
    [from.x, from.y, from.z, to.x, to.y, to.z, bondOrder]
  );

  const bondColor = useMemo(() => {
    const fromEl = atomFrom.element;
    const toEl = atomTo.element;
    if (fromEl === 'C' || toEl === 'C') return '#888888';
    if (fromEl === 'O' || toEl === 'O') return '#cc4444';
    if (fromEl === 'N' || toEl === 'N') return '#3344aa';
    return '#888888';
  }, [atomFrom.element, atomTo.element]);

  return (
    <group>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos} rotation={rotations[i]} scale={scales[i]}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
          <meshPhysicalMaterial
            color={bondColor}
            roughness={0.5}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

function MoleculeModel({ moleculeKey, opacity }: { moleculeKey: string; opacity: number }) {
  const showLabels = useMoleculeStore((s) => s.showLabels);
  const data = moleculeMap[moleculeKey];

  const center = useMemo(() => {
    if (!data) return new THREE.Vector3();
    return getMoleculeCenter(data.atoms);
  }, [data]);

  const { camera } = useThree();

  useEffect(() => {
    if (data) {
      const maxDist = Math.max(
        ...data.atoms.map((a) => new THREE.Vector3(a.x, a.y, a.z).distanceTo(center))
      );
      const viewDistance = useMoleculeStore.getState().viewDistance;
      camera.position.setLength(viewDistance);
    }
  }, [data, center, camera]);

  const scale = useMemo(() => {
    const dist = camera.position.length();
    return Math.max(0.3, Math.min(1, 8 / dist));
  }, [camera.position]);

  if (!data) return null;

  return (
    <group visible={opacity > 0.01}>
      {data.atoms.map((atom, i) => (
        <Atom key={`${moleculeKey}-atom-${i}`} atom={atom} showLabel={showLabels} center={center} scale={scale} />
      ))}
      {data.bonds.map((bond, i) => (
        <Bond
          key={`${moleculeKey}-bond-${i}`}
          atomFrom={data.atoms[bond.from]}
          atomTo={data.atoms[bond.to]}
          bondOrder={bond.order}
          center={center}
        />
      ))}
    </group>
  );
}

function SceneCamera() {
  const { camera } = useThree();
  const viewDistance = useMoleculeStore((s) => s.viewDistance);
  const horizontalRotation = useMoleculeStore((s) => s.horizontalRotation);
  const verticalTilt = useMoleculeStore((s) => s.verticalTilt);

  useEffect(() => {
    const hRad = (horizontalRotation * Math.PI) / 180;
    const vRad = (verticalTilt * Math.PI) / 180;
    const x = viewDistance * Math.cos(vRad) * Math.sin(hRad);
    const y = viewDistance * Math.sin(vRad);
    const z = viewDistance * Math.cos(vRad) * Math.cos(hRad);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
  }, [viewDistance, horizontalRotation, verticalTilt, camera]);

  return null;
}

function AutoRotator() {
  const groupRef = useRef<THREE.Group>(null);
  const autoRotate = useMoleculeStore((s) => s.autoRotate);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += 0.005 * delta * 60;
    }
  });

  return <group ref={groupRef}><MoleculeModelWithTransition /></group>;
}

function MoleculeModelWithTransition() {
  const currentMolecule = useMoleculeStore((s) => s.currentMolecule);
  const [displayMolecule, setDisplayMolecule] = React.useState(currentMolecule);
  const [opacity, setOpacity] = React.useState(1);
  const transitioning = React.useRef(false);
  const targetMolecule = React.useRef(currentMolecule);

  useEffect(() => {
    if (currentMolecule !== displayMolecule) {
      targetMolecule.current = currentMolecule;
      transitioning.current = true;
      setOpacity(0);
    }
  }, [currentMolecule, displayMolecule]);

  useFrame(() => {
    if (transitioning.current) {
      setOpacity((prev) => {
        if (prev <= 0.01) {
          setDisplayMolecule(targetMolecule.current);
          transitioning.current = false;
          return 0;
        }
        return prev - 0.06;
      });
    } else if (opacity < 1) {
      setOpacity((prev) => Math.min(1, prev + 0.04));
    }
  });

  return <MoleculeModel moleculeKey={displayMolecule} opacity={opacity} />;
}

export default function MoleculeViewer() {
  return (
    <>
      <color attach="background" args={['#1a1a2e']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, -3, -5]} intensity={0.3} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#00d4ff" />
      <SceneCamera />
      <AutoRotator />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        makeDefault
        minDistance={3}
        maxDistance={25}
      />
    </>
  );
}
