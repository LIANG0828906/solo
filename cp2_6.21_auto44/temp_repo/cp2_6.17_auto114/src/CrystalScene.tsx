import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useCrystalStore, type AtomData, type BondData } from './store';
import { generateCrystal, getCrystalDescription } from './CrystalGenerator';

const EXPLODE_FACTOR = 0.6;

function RulerIconSvg() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="19" x2="21" y2="5" />
      <polyline points="16 5 21 5 21 10" />
      <polyline points="3 14 3 19 8 19" />
      <line x1="8" y1="14" x2="10" y2="16" />
      <line x1="12" y1="10" x2="14" y2="12" />
      <line x1="16" y1="6" x2="18" y2="8" />
    </svg>
  );
}

function ProtractorIconSvg() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20 L4 8 L20 8" />
      <path d="M8 12 Q8 8 12 8" />
      <path d="M15 4 L17 6 L19 4 L21 6 L19 8" />
    </svg>
  );
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function Atom({
  atom,
  atomScale,
  explodeProgress,
  isSelected,
  onClick,
}: {
  atom: AtomData;
  atomScale: number;
  explodeProgress: number;
  isSelected: boolean;
  onClick: (atom: AtomData, screenPos: { x: number; y: number }) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();

  const position = useMemo(() => {
    const factor = 1 + EXPLODE_FACTOR * explodeProgress;
    return [
      atom.position[0] * factor,
      atom.position[1] * factor,
      atom.position[2] * factor,
    ] as [number, number, number];
  }, [atom.position, explodeProgress]);

  const ringScale = useMemo(() => {
    const base = 1.2;
    return isSelected ? base : base * 0.01;
  }, [isSelected]);

  useFrame((state, delta) => {
    if (ringRef.current) {
      const currentScale = ringRef.current.scale.x;
      const targetScale = ringScale;
      const newScale = currentScale + (targetScale - currentScale) * Math.min(1, delta * 10);
      ringRef.current.scale.set(newScale, newScale, newScale);
      ringRef.current.rotation.z += delta * 2;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (meshRef.current) {
      const worldPos = new THREE.Vector3();
      meshRef.current.getWorldPosition(worldPos);
      const screenPos = worldPos.project(camera);
      const canvasRect = gl.domElement.getBoundingClientRect();
      const x = (screenPos.x * 0.5 + 0.5) * canvasRect.width;
      const y = (-screenPos.y * 0.5 + 0.5) * canvasRect.height;
      onClick(atom, { x, y });
    }
  };

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[atom.radius * atomScale, 32, 32]} />
        <meshStandardMaterial
          color={atom.color}
          metalness={0.3}
          roughness={0.4}
          emissive={atom.color}
          emissiveIntensity={0.1}
        />
      </mesh>
      <mesh ref={ringRef} scale={[0.01, 0.01, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[atom.radius * atomScale * 1.1, atom.radius * atomScale * 1.25, 64]} />
        <meshBasicMaterial
          color="#FFD700"
          transparent
          opacity={isSelected ? 0.6 : 0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function Bond({
  bond,
  explodeProgress,
  isExploded,
}: {
  bond: BondData;
  explodeProgress: number;
  isExploded: boolean;
}) {
  const lineRef = useRef<THREE.Line>(null);

  const line = useMemo(() => {
    const factor = 1 + EXPLODE_FACTOR * explodeProgress;
    const start = new THREE.Vector3(
      bond.positionA[0] * factor,
      bond.positionA[1] * factor,
      bond.positionA[2] * factor
    );
    const end = new THREE.Vector3(
      bond.positionB[0] * factor,
      bond.positionB[1] * factor,
      bond.positionB[2] * factor
    );
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineDashedMaterial({
      color: isExploded ? '#88CCFF' : '#FFFFFF',
      linewidth: 1,
      dashSize: 0.1,
      gapSize: 0.05,
      transparent: true,
      opacity: isExploded ? 0.4 : 0.7,
    });
    const lineObj = new THREE.Line(geometry, material);
    lineObj.computeLineDistances();
    return lineObj;
  }, [bond, explodeProgress, isExploded]);

  useFrame(() => {
    if (lineRef.current) {
      lineRef.current.computeLineDistances();
    }
  });

  return <primitive object={line} ref={lineRef} />;
}

function MeasurementBondLine({
  atom1,
  atom2,
  explodeProgress,
}: {
  atom1: { position: [number, number, number] };
  atom2: { position: [number, number, number] };
  explodeProgress: number;
}) {
  const lineRef = useRef<THREE.Line>(null);

  const line = useMemo(() => {
    const factor = 1 + EXPLODE_FACTOR * explodeProgress;
    const start = new THREE.Vector3(
      atom1.position[0] * factor,
      atom1.position[1] * factor,
      atom1.position[2] * factor
    );
    const end = new THREE.Vector3(
      atom2.position[0] * factor,
      atom2.position[1] * factor,
      atom2.position[2] * factor
    );
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineDashedMaterial({
      color: '#FFFFFF',
      linewidth: 1,
      dashSize: 0.08,
      gapSize: 0.04,
      transparent: true,
      opacity: 0.9,
    });
    const lineObj = new THREE.Line(geometry, material);
    lineObj.computeLineDistances();
    return lineObj;
  }, [atom1.position, atom2.position, explodeProgress]);

  useFrame(() => {
    if (lineRef.current) {
      lineRef.current.computeLineDistances();
    }
  });

  return <primitive object={line} ref={lineRef} />;
}

function UnitCell({
  latticeConstant,
  opacity,
  explodeProgress,
}: {
  latticeConstant: number;
  opacity: number;
  explodeProgress: number;
}) {
  const half = latticeConstant / 2;
  const factor = 1 + EXPLODE_FACTOR * explodeProgress;
  const size = latticeConstant * factor;

  const edges = useMemo(() => {
    const geo = new THREE.BoxGeometry(size, size, size);
    const edgesGeo = new THREE.EdgesGeometry(geo);
    return edgesGeo;
  }, [size]);

  return (
    <lineSegments geometry={edges}>
      <lineBasicMaterial color="#FFFFFF" transparent opacity={opacity} linewidth={1} />
    </lineSegments>
  );
}

function CrystalContent() {
  const {
    crystalType,
    latticeConstant,
    atomScale,
    rotationSpeed,
    cellOpacity,
    isExploded,
    selectedAtoms,
    bondMeasurements,
    angleMeasurements,
    selectAtom,
    clearMeasurements,
    updateAtomScreenPosition,
  } = useCrystalStore();

  const controlsRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [explodeProgress, setExplodeProgress] = useState(0);
  const animFrameRef = useRef<number>(0);
  const { camera, gl } = useThree();

  const { atoms, bonds } = useMemo(() => {
    return generateCrystal(crystalType, latticeConstant);
  }, [crystalType, latticeConstant]);

  useEffect(() => {
    const startTime = performance.now();
    const startValue = explodeProgress;
    const targetValue = isExploded ? 1 : 0;
    const duration = 2000;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOut(t);
      const newValue = startValue + (targetValue - startValue) * eased;
      setExplodeProgress(newValue);

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isExploded]);

  useFrame((state, delta) => {
    if (groupRef.current && rotationSpeed > 0) {
      const rotSpeed = (rotationSpeed / 100) * 0.3;
      groupRef.current.rotation.y += delta * rotSpeed;
    }

    if (selectedAtoms.length > 0) {
      selectedAtoms.forEach((atom) => {
        const pos = new THREE.Vector3(
          atom.position[0] * (1 + EXPLODE_FACTOR * explodeProgress),
          atom.position[1] * (1 + EXPLODE_FACTOR * explodeProgress),
          atom.position[2] * (1 + EXPLODE_FACTOR * explodeProgress)
        );
        if (groupRef.current) {
          pos.applyMatrix4(groupRef.current.matrixWorld);
        }
        const screenPos = pos.project(camera);
        const canvasRect = gl.domElement.getBoundingClientRect();
        const x = (screenPos.x * 0.5 + 0.5) * canvasRect.width;
        const y = (-screenPos.y * 0.5 + 0.5) * canvasRect.height;
        updateAtomScreenPosition(atom.id, { x, y });
      });
    }
  });

  const handleCanvasClick = (e: any) => {
    if (e.target === e.currentTarget || !e.intersects || e.intersects.length === 0) {
      clearMeasurements();
    }
  };

  const selectedAtomIds = useMemo(() => {
    return new Set(selectedAtoms.map((a) => a.id));
  }, [selectedAtoms]);

  const handleAtomClick = (atom: AtomData, screenPos: { x: number; y: number }) => {
    selectAtom(atom, screenPos);
  };

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#FFFFFF" />
      <pointLight position={[-5, -5, 5]} intensity={0.3} color="#6C63FF" />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        makeDefault
      />

      <group ref={groupRef} onClick={handleCanvasClick}>
        <UnitCell
          latticeConstant={latticeConstant}
          opacity={cellOpacity}
          explodeProgress={explodeProgress}
        />

        {bonds.map((bond) => (
          <Bond
            key={bond.id}
            bond={bond}
            explodeProgress={explodeProgress}
            isExploded={isExploded}
          />
        ))}

        {atoms.map((atom) => (
          <Atom
            key={atom.id}
            atom={atom}
            atomScale={atomScale}
            explodeProgress={explodeProgress}
            isSelected={selectedAtomIds.has(atom.id)}
            onClick={handleAtomClick}
          />
        ))}

        {bondMeasurements.map((m) => (
          <MeasurementBondLine
            key={m.id}
            atom1={m.atom1}
            atom2={m.atom2}
            explodeProgress={explodeProgress}
          />
        ))}
      </group>
    </>
  );
}

export default function CrystalScene() {
  const { crystalType, atoms, bondMeasurements, angleMeasurements } = useCrystalStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const description = getCrystalDescription(crystalType);

  return (
    <div ref={containerRef} className="canvas-container" style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [6, 5, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <CrystalContent />
      </Canvas>

      <div className="scene-overlay">
        <div className="scene-info-badge">
          <span>当前结构:</span>
          <strong>{crystalType}</strong>
          <span style={{ color: '#666688' }}>|</span>
          <span style={{ color: '#8888AA', fontSize: '11px' }}>{description}</span>
        </div>
        <div className="scene-info-badge">
          <span>原子数量:</span>
          <strong>{atoms.length}</strong>
        </div>
        {(bondMeasurements.length > 0 || angleMeasurements.length > 0) && (
          <div className="scene-info-badge" style={{ borderColor: '#FFD700' }}>
            <span style={{ color: '#FFD700' }}>● 测量模式</span>
          </div>
        )}
      </div>

      {bondMeasurements.map((m) => {
        const pos = m.atom2.screenPosition;
        if (!pos) return null;
        return (
          <div
            key={`bond-label-${m.id}`}
            className="measurement-label-container"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
            }}
          >
            <div className="measurement-label">
              <span className="label-icon">
                <RulerIconSvg />
              </span>
              <span className="label-text">{m.length.toFixed(2)}</span>
              <span className="label-unit">Å</span>
            </div>
          </div>
        );
      })}

      {angleMeasurements.map((m) => {
        const pos = m.atom2.screenPosition;
        if (!pos) return null;
        return (
          <div
            key={`angle-label-${m.id}`}
            className="measurement-label-container"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y - 40}px`,
            }}
          >
            <div className="measurement-label" style={{ borderColor: 'rgba(255, 215, 0, 0.5)' }}>
              <span className="label-icon">
                <ProtractorIconSvg />
              </span>
              <span className="label-text">{m.angle.toFixed(1)}</span>
              <span className="label-unit">°</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
