import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import {
  Atom,
  Bond,
  ELEMENT_INFO,
  ElementType,
  Vec3,
  vec3Sub,
  vec3Length,
} from '../modules/MoleculeEngine';
import { useMoleculeStore } from '../store/useMoleculeStore';

interface StarFieldProps {
  count?: number;
}

const StarField: React.FC<StarFieldProps> = ({ count = 1500 }) => {
  const meshRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.005;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#ffffff"
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
};

const GroundGrid: React.FC = () => {
  return (
    <gridHelper
      args={[40, 40, '#ffffff', '#ffffff']}
      position={[0, -5, 0]}
      material-opacity={0.08}
      material-transparent
    />
  );
};

interface AtomSphereProps {
  atom: Atom;
  onClick: () => void;
  selected: boolean;
  dragging: boolean;
}

const AtomSphere: React.FC<AtomSphereProps> = ({ atom, onClick, selected }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const info = ELEMENT_INFO[atom.element];
  const color = useMemo(() => new THREE.Color(info.color), [info.color]);

  return (
    <mesh
      ref={meshRef}
      position={[atom.position.x, atom.position.y, atom.position.z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      castShadow
    >
      <sphereGeometry args={[info.radius, 32, 32]} />
      <meshStandardMaterial
        color={color}
        roughness={0.3}
        metalness={0.2}
        emissive={selected ? color : new THREE.Color('#000000')}
        emissiveIntensity={selected ? 0.5 : 0}
      />
    </mesh>
  );
};

interface BondCylinderProps {
  bond: Bond;
  atomA: Atom | undefined;
  atomB: Atom | undefined;
  onClick: () => void;
  selected: boolean;
}

const BondCylinder: React.FC<BondCylinderProps> = ({
  bond,
  atomA,
  atomB,
  onClick,
  selected,
}) => {
  if (!atomA || !atomB) return null;
  const groupRef = useRef<THREE.Group>(null);

  const { position, quaternion, length, offsets } = useMemo(() => {
    const a = new THREE.Vector3(atomA.position.x, atomA.position.y, atomA.position.z);
    const b = new THREE.Vector3(atomB.position.x, atomB.position.y, atomB.position.z);
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());

    const perp = new THREE.Vector3(1, 0, 0);
    if (Math.abs(dir.x) > 0.9) perp.set(0, 1, 0);
    perp.cross(dir).normalize();
    const offs: Vec3[] = [];
    const gap = 0.18;
    if (bond.order === 1) {
      offs.push({ x: 0, y: 0, z: 0 });
    } else if (bond.order === 2) {
      offs.push(
        { x: perp.x * gap * 0.5, y: perp.y * gap * 0.5, z: perp.z * gap * 0.5 },
        { x: -perp.x * gap * 0.5, y: -perp.y * gap * 0.5, z: -perp.z * gap * 0.5 }
      );
    } else {
      const perp2 = new THREE.Vector3().crossVectors(dir, perp).normalize();
      offs.push(
        { x: perp.x * gap * 0.6, y: perp.y * gap * 0.6, z: perp.z * gap * 0.6 },
        { x: -perp.x * gap * 0.3 + perp2.x * gap * 0.5, y: -perp.y * gap * 0.3 + perp2.y * gap * 0.5, z: -perp.z * gap * 0.3 + perp2.z * gap * 0.5 },
        { x: -perp.x * gap * 0.3 - perp2.x * gap * 0.5, y: -perp.y * gap * 0.3 - perp2.y * gap * 0.5, z: -perp.z * gap * 0.3 - perp2.z * gap * 0.5 }
      );
    }
    return { position: mid, quaternion: q, length: len, offsets: offs };
  }, [atomA, atomB, bond.order]);

  const bondColor = selected ? '#00ffff' : '#888888';
  const bondRadius = 0.08;

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      quaternion={quaternion}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {offsets.map((off, i) => (
        <mesh
          key={i}
          position={[off.x, off.y, off.z]}
        >
          <cylinderGeometry args={[bondRadius, bondRadius, length, 16]} />
          <meshStandardMaterial
            color={bondColor}
            roughness={0.5}
            metalness={0.3}
            emissive={selected ? '#00ffff' : '#000000'}
            emissiveIntensity={selected ? 0.3 : 0}
          />
        </mesh>
      ))}
    </group>
  );
};

interface AuxAxesProps {
  atom: Atom | undefined;
}

const AuxAxes: React.FC<AuxAxesProps> = ({ atom }) => {
  if (!atom) return null;
  const len = 1.8;
  return (
    <group position={[atom.position.x, atom.position.y, atom.position.z]}>
      <group rotation={[0, 0, -Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, len, 8]} />
          <meshBasicMaterial color="#ff3b3b" transparent opacity={0.7} />
        </mesh>
      </group>
      <mesh>
        <cylinderGeometry args={[0.02, 0.02, len, 8]} />
        <meshBasicMaterial color="#3bff3b" transparent opacity={0.7} />
      </mesh>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, len, 8]} />
          <meshBasicMaterial color="#3b9dff" transparent opacity={0.7} />
        </mesh>
      </group>
    </group>
  );
};

interface SceneClickHandlerProps {
  onSceneClick: (point: THREE.Vector3) => void;
}

const SceneClickHandler: React.FC<SceneClickHandlerProps> = ({ onSceneClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSceneClick(e.point);
      }}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
};

interface DragHandlerProps {
  atom: Atom;
  onDrag: (pos: Vec3) => void;
  children: React.ReactNode;
}

const DragHandler: React.FC<DragHandlerProps> = ({ onDrag, children }) => {
  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    []
  );
  const { camera, gl } = useThree();
  const isDragging = useRef(false);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const dom = gl.domElement;
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      isDragging.current = true;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const point = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, point);
      if (point) {
        onDrag({ x: point.x, y: point.y, z: point.z });
      }
    };
    const onPointerUp = () => {
      isDragging.current = false;
    };
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);
    return () => {
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
    };
  }, [camera, gl, onDrag, plane, mouse, raycaster]);

  return (
    <group ref={groupRef} onPointerDown={() => (isDragging.current = true)}>
      {children}
    </group>
  );
};

export const MoleculeViewer: React.FC = () => {
  const atoms = useMoleculeStore((s) => s.atoms);
  const bonds = useMoleculeStore((s) => s.bonds);
  const selectedAtomId = useMoleculeStore((s) => s.selectedAtomId);
  const selectedBondId = useMoleculeStore((s) => s.selectedBondId);
  const editMode = useMoleculeStore((s) => s.editMode);
  const currentElement = useMoleculeStore((s) => s.currentElement);
  const bondCreationFirstAtom = useMoleculeStore((s) => s.bondCreationFirstAtom);

  const addAtom = useMoleculeStore((s) => s.addAtom);
  const selectAtom = useMoleculeStore((s) => s.selectAtom);
  const selectBond = useMoleculeStore((s) => s.selectBond);
  const updateAtomPosition = useMoleculeStore((s) => s.updateAtomPosition);

  const atomMap = useMemo(() => {
    const map = new Map<string, Atom>();
    atoms.forEach((a) => map.set(a.id, a));
    return map;
  }, [atoms]);

  const selectedAtom = selectedAtomId ? atomMap.get(selectedAtomId) : undefined;

  const handleSceneClick = (point: THREE.Vector3) => {
    if (editMode === 'atom') {
      addAtom(currentElement, { x: point.x, y: Math.max(point.y, 0.5), z: point.z });
    } else if (editMode === 'select') {
      selectAtom(null);
      selectBond(null);
    }
  };

  return (
    <>
      <color attach="background" args={['#0d1117']} />
      <fog attach="fog" args={['#0d1117', 30, 80]} />

      <ambientLight intensity={0.45} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={0.85}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#bf00ff" />
      <pointLight position={[5, 3, 5]} intensity={0.3} color="#00ffff" />

      <StarField />
      <GroundGrid />

      <SceneClickHandler onSceneClick={handleSceneClick} />

      {bonds.map((bond) => (
        <BondCylinder
          key={bond.id}
          bond={bond}
          atomA={atomMap.get(bond.atomA)}
          atomB={atomMap.get(bond.atomB)}
          selected={selectedBondId === bond.id}
          onClick={() => selectBond(bond.id)}
        />
      ))}

      {atoms.map((atom) => {
        const isFirst = bondCreationFirstAtom === atom.id;
        if (editMode === 'select' && selectedAtomId === atom.id) {
          return (
            <DragHandler
              key={atom.id}
              atom={atom}
              onDrag={(pos) => updateAtomPosition(atom.id, pos)}
            >
              <AtomSphere
                atom={atom}
                onClick={() => selectAtom(atom.id)}
                selected={true}
                dragging={true}
              />
            </DragHandler>
          );
        }
        return (
          <group key={atom.id}>
            <AtomSphere
              atom={atom}
              onClick={() => selectAtom(atom.id)}
              selected={selectedAtomId === atom.id || isFirst}
              dragging={false}
            />
            {isFirst && (
              <mesh position={[atom.position.x, atom.position.y, atom.position.z]}>
                <sphereGeometry args={[ELEMENT_INFO[atom.element as ElementType].radius + 0.12, 16, 16]} />
                <meshBasicMaterial color="#bf00ff" transparent opacity={0.25} />
              </mesh>
            )}
          </group>
        );
      })}

      <AuxAxes atom={selectedAtom} />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={50}
        makeDefault
      />
    </>
  );
};

export default MoleculeViewer;
