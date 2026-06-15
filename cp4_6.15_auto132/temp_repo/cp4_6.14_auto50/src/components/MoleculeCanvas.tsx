import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Molecule, Atom, Bond, ComparisonResult, BOND_COLOR, BOND_RADIUS } from '../types';
import { getAtomColor, getAtomRadius } from '../utils/parser';

interface StarFieldProps {
  count?: number;
}

const StarField: React.FC<StarFieldProps> = ({ count = 100 }) => {
  const meshRef = useRef<THREE.Points>(null);

  const { positions, sizes, opacities, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const opacities = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 30 + Math.random() * 20;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      sizes[i] = 1 + Math.random() * 2;
      opacities[i] = 0.3 + Math.random() * 0.7;
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { positions, sizes, opacities, phases };
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const material = meshRef.current.material as THREE.ShaderMaterial;
    if (material.uniforms) {
      material.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        sizes: { value: sizes },
        baseOpacities: { value: opacities },
        phases: { value: phases },
      },
      vertexShader: `
        attribute float size;
        attribute float baseOpacity;
        attribute float phase;
        uniform float time;
        varying float vOpacity;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float twinkle = sin(time * 2.0 + phase) * 0.5 + 0.5;
          vOpacity = baseOpacity * (0.5 + twinkle * 0.5);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vOpacity;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = (1.0 - dist * 2.0) * vOpacity;
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [sizes, opacities, phases]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('baseOpacity', new THREE.BufferAttribute(opacities, 1));
    geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    return geo;
  }, [positions, sizes, opacities, phases]);

  return <points ref={meshRef} geometry={geometry} material={shaderMaterial} />;
};

interface BondMeshProps {
  from: [number, number, number];
  to: [number, number, number];
  radius?: number;
  color?: string;
  opacity?: number;
}

const BondMesh: React.FC<BondMeshProps> = ({ from, to, radius = BOND_RADIUS, color = BOND_COLOR, opacity = 0.6 }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const { position, rotation } = useMemo(() => {
    const fromVec = new THREE.Vector3(...from);
    const toVec = new THREE.Vector3(...to);
    const midpoint = new THREE.Vector3().addVectors(fromVec, toVec).multiplyScalar(0.5);
    const direction = new THREE.Vector3().subVectors(toVec, fromVec);
    const length = direction.length();

    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );
    const euler = new THREE.Euler().setFromQuaternion(quaternion);

    return {
      position: midpoint.toArray() as [number, number, number],
      rotation: [euler.x, euler.y, euler.z] as [number, number, number],
      length,
    };
  }, [from, to]);

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <cylinderGeometry args={[radius, radius, 1, 12]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        metalness={0.3}
        roughness={0.6}
      />
    </mesh>
  );
};

interface AtomMeshProps {
  atom: Atom;
  scale?: number;
  isHighlighted?: boolean;
  isUnmatched?: boolean;
  onHover?: (atom: Atom | null) => void;
}

const AtomMesh: React.FC<AtomMeshProps> = ({ atom, scale = 1, isHighlighted = false, isUnmatched = false, onHover }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);

  const color = getAtomColor(atom.element);
  const radius = getAtomRadius(atom.element) * scale;

  useFrame((state) => {
    if (!materialRef.current) return;
    if (isUnmatched) {
      const t = state.clock.elapsedTime * Math.PI * 2 / 0.5;
      const pulse = (Math.sin(t) + 1) / 2;
      materialRef.current.emissive = new THREE.Color(0xff0000);
      materialRef.current.emissiveIntensity = 0.3 + pulse * 0.7;
    } else if (hovered || isHighlighted) {
      materialRef.current.emissive = new THREE.Color(0x38bdf8);
      materialRef.current.emissiveIntensity = 0.4;
    } else {
      materialRef.current.emissive = new THREE.Color(0x000000);
      materialRef.current.emissiveIntensity = 0;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={atom.position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover?.(atom);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        onHover?.(null);
      }}
    >
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        metalness={0.1}
        roughness={0.3}
      />
    </mesh>
  );
};

interface MoleculeGroupProps {
  molecule: Molecule;
  scale?: number;
  offset?: [number, number, number];
  entryAnimation?: boolean;
  unmatchedAtoms?: string[];
  onAtomHover?: (atom: Atom | null) => void;
}

const MoleculeGroup: React.FC<MoleculeGroupProps> = ({
  molecule,
  scale = 1,
  offset = [0, 0, 0],
  entryAnimation = true,
  unmatchedAtoms = [],
  onAtomHover,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [animScale, setAnimScale] = useState(entryAnimation ? 0 : 1);

  useEffect(() => {
    if (entryAnimation) {
      setAnimScale(0);
      const startTime = performance.now();
      const duration = 1200;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimScale(eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [molecule.id, entryAnimation]);

  const atomMap = useMemo(() => {
    const map: Record<string, Atom> = {};
    molecule.atoms.forEach((a) => {
      map[a.id] = a;
    });
    return map;
  }, [molecule.atoms]);

  const unmatchedSet = useMemo(() => new Set(unmatchedAtoms), [unmatchedAtoms]);

  const localOffset = offset.map((o) => o / (animScale || 1)) as [number, number, number];

  return (
    <group ref={groupRef} position={offset} scale={animScale}>
      {molecule.bonds.map((bond) => {
        const fromAtom = atomMap[bond.from];
        const toAtom = atomMap[bond.to];
        if (!fromAtom || !toAtom) return null;
        return (
          <BondMesh
            key={bond.id}
            from={fromAtom.position}
            to={toAtom.position}
            radius={BOND_RADIUS * scale}
          />
        );
      })}

      {molecule.atoms.map((atom) => (
        <AtomMesh
          key={atom.id}
          atom={{
            ...atom,
            position: atom.position.map((p) => p * scale) as [number, number, number],
          }}
          isUnmatched={unmatchedSet.has(atom.id)}
          onHover={onAtomHover}
        />
      ))}
    </group>
  );
};

interface DashedLineProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  opacity?: number;
  dashSize?: number;
}

const DashedLine: React.FC<DashedLineProps> = ({ start, end, color = '#ffff00', opacity = 0.7, dashSize = 0.3 }) => {
  const lineObject = useMemo(() => {
    const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo);
    line.computeLineDistances();

    const material = new THREE.LineDashedMaterial({
      color: new THREE.Color(color),
      dashSize: dashSize,
      gapSize: dashSize,
      transparent: true,
      opacity: opacity,
    });
    line.material = material;

    return line;
  }, [start, end, color, opacity, dashSize]);

  return <primitive object={lineObject} />;
};

interface SceneProps {
  moleculeA: Molecule | null;
  moleculeB: Molecule | null;
  comparisonResult: ComparisonResult | null;
  isComparing: boolean;
  onAtomHoverA: (atom: Atom | null) => void;
  onAtomHoverB: (atom: Atom | null) => void;
}

const Scene: React.FC<SceneProps> = ({
  moleculeA,
  moleculeB,
  comparisonResult,
  isComparing,
  onAtomHoverA,
  onAtomHoverB,
}) => {
  const { camera } = useThree();

  const offsetA: [number, number, number] = moleculeB ? [-4, 0, 0] : [0, 0, 0];
  const offsetB: [number, number, number] = [4, 0, 0];

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} color="#38bdf8" />
      <pointLight position={[0, 0, 10]} intensity={0.5} color="#ffffff" />

      <StarField count={100} />

      {moleculeA && (
        <MoleculeGroup
          molecule={moleculeA}
          offset={offsetA}
          scale={1}
          entryAnimation={true}
          unmatchedAtoms={comparisonResult ? comparisonResult.unmatchedA : []}
          onAtomHover={onAtomHoverA}
        />
      )}

      {moleculeB && (
        <MoleculeGroup
          molecule={moleculeB}
          offset={offsetB}
          scale={1}
          entryAnimation={true}
          unmatchedAtoms={comparisonResult ? comparisonResult.unmatchedB : []}
          onAtomHover={onAtomHoverB}
        />
      )}

      {comparisonResult && moleculeA && moleculeB && comparisonResult.matchedPairs.map((pair, idx) => {
        const atomA = moleculeA.atoms.find((a) => a.id === pair.atomA);
        const atomB = moleculeB.atoms.find((b) => b.id === pair.atomB);
        if (!atomA || !atomB) return null;

        const start: [number, number, number] = [
          atomA.position[0] + offsetA[0],
          atomA.position[1] + offsetA[1],
          atomA.position[2] + offsetA[2],
        ];
        const end: [number, number, number] = [
          atomB.position[0] + offsetB[0],
          atomB.position[1] + offsetB[1],
          atomB.position[2] + offsetB[2],
        ];

        return (
          <DashedLine
            key={`dash-${idx}`}
            start={start}
            end={end}
            color="#ffff00"
            opacity={0.7}
            dashSize={0.15}
          />
        );
      })}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.005}
        zoomSpeed={0.8}
        panSpeed={0.02}
        minDistance={2}
        maxDistance={20}
        enablePan={true}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />
    </>
  );
};

interface MoleculeCanvasProps {
  moleculeA: Molecule | null;
  moleculeB: Molecule | null;
  comparisonResult: ComparisonResult | null;
  isComparing: boolean;
  onAtomHoverA: (atom: Atom | null) => void;
  onAtomHoverB: (atom: Atom | null) => void;
}

const MoleculeCanvas: React.FC<MoleculeCanvasProps> = ({
  moleculeA,
  moleculeB,
  comparisonResult,
  isComparing,
  onAtomHoverA,
  onAtomHoverB,
}) => {
  return (
    <div className="app-canvas-wrapper" style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 2, 10], fov: 45, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x0f172a);
        }}
      >
        <color attach="background" args={['#0f172a']} />
        <fog attach="fog" args={['#0f172a', 15, 50]} />
        <Scene
          moleculeA={moleculeA}
          moleculeB={moleculeB}
          comparisonResult={comparisonResult}
          isComparing={isComparing}
          onAtomHoverA={onAtomHoverA}
          onAtomHoverB={onAtomHoverB}
        />
      </Canvas>

      <div
        className="gradient-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(15, 23, 42, 0.3) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default MoleculeCanvas;
