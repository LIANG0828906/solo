import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useMoleculeStore } from '../store/moleculeStore';
import { calculateVibration, generateTrajectoryPoints } from '../utils/vibrationEngine';
import { Atom, Bond, Molecule } from '../types/molecule';
import { ELEMENT_PROPERTIES } from '../data/presetMolecules';

interface AtomMeshProps {
  atom: Atom;
  displacement?: { x: number; y: number; z: number };
  isSelected: boolean;
  onClick: (e: any) => void;
  onPointerOver: (e: any) => void;
  onPointerOut: () => void;
  scale: number;
  showTrajectory?: boolean;
  trajectoryPoints?: Array<{ x: number; y: number; z: number }>;
}

const AtomMesh: React.FC<AtomMeshProps> = ({
  atom,
  displacement = { x: 0, y: 0, z: 0 },
  isSelected,
  onClick,
  onPointerOver,
  onPointerOut,
  scale,
  showTrajectory = false,
  trajectoryPoints = [],
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const actualPosition = [
    (atom.x + displacement.x) * scale,
    (atom.y + displacement.y) * scale,
    (atom.z + displacement.z) * scale,
  ] as [number, number, number];

  const color = isSelected ? '#00d4ff' : atom.color;
  const emissiveIntensity = isSelected ? 0.5 : 0.2;

  const trajectoryLinePoints = useMemo(() => {
    if (!showTrajectory || trajectoryPoints.length === 0) return [];
    return trajectoryPoints.map((p) => [p.x * scale, p.y * scale, p.z * scale] as [number, number, number]);
  }, [showTrajectory, trajectoryPoints, scale]);

  return (
    <group>
      <mesh
        ref={meshRef}
        position={actualPosition}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <sphereGeometry args={[atom.radius * scale, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>
      {isSelected && (
        <mesh position={actualPosition}>
          <sphereGeometry args={[atom.radius * scale * 1.3, 32, 32]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      )}
      {showTrajectory && trajectoryLinePoints.length > 1 && (
        <Line
          points={trajectoryLinePoints}
          color="#00d4ff"
          lineWidth={1}
          transparent
          opacity={0.4}
          dashed
          dashSize={0.2}
          gapSize={0.1}
        />
      )}
    </group>
  );
};

interface BondMeshProps {
  bond: Bond;
  atom1: Atom;
  atom2: Atom;
  displacement1?: { x: number; y: number; z: number };
  displacement2?: { x: number; y: number; z: number };
  scale: number;
}

const BondMesh: React.FC<BondMeshProps> = ({ bond, atom1, atom2, displacement1 = { x: 0, y: 0, z: 0 }, displacement2 = { x: 0, y: 0, z: 0 }, scale }) => {
  const groupRef = useRef<THREE.Group>(null);

  const p1 = new THREE.Vector3(
    (atom1.x + displacement1.x) * scale,
    (atom1.y + displacement1.y) * scale,
    (atom1.z + displacement1.z) * scale
  );
  const p2 = new THREE.Vector3(
    (atom2.x + displacement2.x) * scale,
    (atom2.y + displacement2.y) * scale,
    (atom2.z + displacement2.z) * scale
  );

  const direction = new THREE.Vector3().subVectors(p2, p1);
  const length = direction.length();
  const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());

  const bondRadius = 0.15 * scale;
  const bondColor = '#888888';

  const renderBondCylinder = (offset: number, isDouble: boolean = false) => {
    const actualRadius = isDouble ? bondRadius * 0.6 : bondRadius;
    const pos = isDouble ? new THREE.Vector3(offset, 0, 0).applyQuaternion(quaternion) : new THREE.Vector3();

    return (
      <mesh
        position={[midpoint.x + pos.x, midpoint.y + pos.y, midpoint.z + pos.z]}
        quaternion={quaternion}
      >
        <cylinderGeometry args={[actualRadius, actualRadius, length, 16]} />
        <meshStandardMaterial color={bondColor} transparent opacity={0.8} roughness={0.3} />
      </mesh>
    );
  };

  if (bond.order >= 2) {
    const offset = bondRadius * 0.8;
    return (
      <group ref={groupRef}>
        {renderBondCylinder(-offset, true)}
        {renderBondCylinder(offset, true)}
      </group>
    );
  }

  return <group ref={groupRef}>{renderBondCylinder(0)}</group>;
};

interface MoleculeSceneProps {
  molecule: Molecule;
  scale: number;
  autoRotate: boolean;
}

const MoleculeScene: React.FC<MoleculeSceneProps> = ({ molecule, scale, autoRotate }) => {
  const groupRef = useRef<THREE.Group>(null);
  const {
    selectedAtoms,
    vibrationMode,
    vibrationAmplitude,
    isVibrating,
    addSelectedAtom,
    removeSelectedAtom,
    setAtomInfoCard,
  } = useMoleculeStore();

  const [displacements, setDisplacements] = useState<Record<string, { x: number; y: number; z: number }>>({});
  const [time, setTime] = useState(0);
  const [hoveredAtom, setHoveredAtom] = useState<string | null>(null);
  const { camera, size } = useThree();

  useFrame((state, delta) => {
    if (groupRef.current && autoRotate && !isVibrating) {
      groupRef.current.rotation.y += delta * 0.2;
    }

    if (isVibrating && vibrationMode) {
      const newTime = time + delta;
      setTime(newTime);
      const frame = calculateVibration(molecule, vibrationMode, newTime, vibrationAmplitude);
      setDisplacements(frame.displacements);
    }
  });

  useEffect(() => {
    if (!isVibrating) {
      setDisplacements({});
      setTime(0);
    }
  }, [isVibrating]);

  const handleAtomClick = useCallback(
    (atomId: string, e: any) => {
      e.stopPropagation();
      const isSelected = selectedAtoms.includes(atomId);
      if (isSelected) {
        removeSelectedAtom(atomId);
        setAtomInfoCard(null);
      } else {
        addSelectedAtom(atomId);
        const vector = new THREE.Vector3();
        const atom = molecule.atoms.find((a) => a.id === atomId);
        if (atom) {
          const screenPos = new THREE.Vector3(
            (atom.x + (displacements[atomId]?.x || 0)) * scale,
            (atom.y + (displacements[atomId]?.y || 0)) * scale,
            (atom.z + (displacements[atomId]?.z || 0)) * scale
          );
          screenPos.project(camera);
          const x = (screenPos.x * 0.5 + 0.5) * size.width;
          const y = (-screenPos.y * 0.5 + 0.5) * size.height;
          setAtomInfoCard({ atomId, position: { x, y } });
        }
      }
    },
    [selectedAtoms, addSelectedAtom, removeSelectedAtom, setAtomInfoCard, molecule, camera, size, displacements, scale]
  );

  const trajectoryPoints = useMemo(() => {
    if (!isVibrating || !vibrationMode) return {};
    const points: Record<string, Array<{ x: number; y: number; z: number }>> = {};
    selectedAtoms.forEach((atomId) => {
      const atom = molecule.atoms.find((a) => a.id === atomId);
      if (atom) {
        points[atomId] = generateTrajectoryPoints(atom, molecule, vibrationMode, vibrationAmplitude);
      }
    });
    return points;
  }, [selectedAtoms, molecule, vibrationMode, vibrationAmplitude, isVibrating]);

  const handleBackgroundClick = useCallback(() => {
    setAtomInfoCard(null);
  }, [setAtomInfoCard]);

  const getAtomById = (id: string) => molecule.atoms.find((a) => a.id === id);

  return (
    <group ref={groupRef} onClick={handleBackgroundClick}>
      {molecule.bonds.map((bond) => {
        const atom1 = getAtomById(bond.atom1Id);
        const atom2 = getAtomById(bond.atom2Id);
        if (!atom1 || !atom2) return null;
        return (
          <BondMesh
            key={bond.id}
            bond={bond}
            atom1={atom1}
            atom2={atom2}
            displacement1={displacements[bond.atom1Id]}
            displacement2={displacements[bond.atom2Id]}
            scale={scale}
          />
        );
      })}

      {molecule.atoms.map((atom) => (
        <AtomMesh
          key={atom.id}
          atom={atom}
          displacement={displacements[atom.id]}
          isSelected={selectedAtoms.includes(atom.id)}
          onClick={(e) => handleAtomClick(atom.id, e)}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredAtom(atom.id);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHoveredAtom(null);
            document.body.style.cursor = 'default';
          }}
          scale={scale}
          showTrajectory={selectedAtoms.includes(atom.id) && isVibrating}
          trajectoryPoints={trajectoryPoints[atom.id]}
        />
      ))}

      {hoveredAtom && (
        <Html
          position={[
            (getAtomById(hoveredAtom)?.x || 0) * scale,
            (getAtomById(hoveredAtom)?.y || 0) * scale + 1.5,
            (getAtomById(hoveredAtom)?.z || 0) * scale,
          ]}
          center
          distanceFactor={10}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              color: 'white',
              whiteSpace: 'nowrap',
            }}
          >
            {ELEMENT_PROPERTIES[getAtomById(hoveredAtom)?.element || '']?.name || getAtomById(hoveredAtom)?.element}
          </div>
        </Html>
      )}
    </group>
  );
};

interface SelectionBoxProps {
  children: React.ReactNode;
  onSelectionEnd: (selectedAtomIds: string[]) => void;
}

const SelectionBox: React.FC<SelectionBoxProps> = ({ children, onSelectionEnd }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentMolecule, clearSelectedAtoms } = useMoleculeStore();

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.shiftKey) {
      setIsSelecting(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      setCurrentPos({ x: e.clientX, y: e.clientY });
      clearSelectedAtoms();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSelecting) {
      setCurrentPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = useCallback(() => {
    if (isSelecting && startPos && currentPos && currentMolecule) {
      const minX = Math.min(startPos.x, currentPos.x);
      const maxX = Math.max(startPos.x, currentPos.x);
      const minY = Math.min(startPos.y, currentPos.y);
      const maxY = Math.max(startPos.y, currentPos.y);

      if (Math.abs(maxX - minX) > 5 && Math.abs(maxY - minY) > 5) {
        const selectedIds: string[] = [];
        currentMolecule.atoms.forEach((atom) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            const x = ((atom.x + 10) / 20) * rect.width + rect.left;
            const y = ((-atom.y + 10) / 20) * rect.height + rect.top;
            if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
              selectedIds.push(atom.id);
            }
          }
        });
        if (selectedIds.length > 0) {
          onSelectionEnd(selectedIds);
        }
      }
    }
    setIsSelecting(false);
    setStartPos(null);
    setCurrentPos(null);
  }, [isSelecting, startPos, currentPos, currentMolecule, onSelectionEnd]);

  useEffect(() => {
    if (isSelecting) {
      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isSelecting, handleMouseUp]);

  const boxStyle = startPos && currentPos ? {
    left: Math.min(startPos.x, currentPos.x),
    top: Math.min(startPos.y, currentPos.y),
    width: Math.abs(currentPos.x - startPos.x),
    height: Math.abs(currentPos.y - startPos.y),
  } : null;

  return (
    <div
      ref={containerRef}
      className="main-viewer"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      {children}
      {boxStyle && <div className="selection-box" style={boxStyle} />}
    </div>
  );
};

const MoleculeViewer: React.FC = () => {
  const {
    currentMolecule,
    isVibrating,
    selectedAtoms,
    setSelectedAtoms,
    atomInfoCard,
    setAtomInfoCard,
    isPanelCollapsed,
  } = useMoleculeStore();

  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    if (currentMolecule) {
      setIsLoading(true);
      setLoadProgress(0);
      const timer = setInterval(() => {
        setLoadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setIsLoading(false);
            return 100;
          }
          return prev + 20;
        });
      }, 100);
      return () => clearInterval(timer);
    }
  }, [currentMolecule?.id]);

  const scale = currentMolecule?.id === 'dna-fragment' ? 0.5 : 1;

  const handleSelectionEnd = useCallback(
    (atomIds: string[]) => {
      setSelectedAtoms(atomIds);
    },
    [setSelectedAtoms]
  );

  const viewerClassName = `main-viewer ${isVibrating ? 'vibrating-bg' : ''}`;

  return (
    <div className={viewerClassName}>
      <SelectionBox onSelectionEnd={handleSelectionEnd}>
        <Canvas
          camera={{ position: [0, 0, 15], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <directionalLight position={[-5, -5, -5]} intensity={0.3} />
          <pointLight position={[0, 0, 10]} intensity={0.5} color="#00d4ff" />
          <pointLight position={[0, 0, -10]} intensity={0.3} color="#7b2ff7" />

          {currentMolecule && !isLoading && (
            <MoleculeScene molecule={currentMolecule} scale={scale} autoRotate={!isVibrating} />
          )}

          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={50}
            enablePan={true}
          />
        </Canvas>
      </SelectionBox>

      {isLoading && <div className="loading-animation" />}

      {currentMolecule && !isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
            {currentMolecule.name}
          </div>
          <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)' }}>
            {currentMolecule.formula}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
            {currentMolecule.atoms.length} 个原子 · {currentMolecule.bonds.length} 个键
          </div>
          {selectedAtoms.length > 0 && (
            <div style={{ fontSize: '12px', color: '#00d4ff', marginTop: '4px' }}>
              已选择 {selectedAtoms.length} 个原子
            </div>
          )}
        </div>
      )}

      {atomInfoCard && currentMolecule && (
        <AtomInfoCard atomId={atomInfoCard.atomId} position={atomInfoCard.position} onClose={() => setAtomInfoCard(null)} />
      )}

      <div
        className={`panel-toggle ${!isPanelCollapsed ? 'panel-open' : ''}`}
        style={{ display: 'none' }}
      />
    </div>
  );
};

const AtomInfoCard: React.FC<{
  atomId: string;
  position: { x: number; y: number };
  onClose: () => void;
}> = ({ atomId, position, onClose }) => {
  const { currentMolecule } = useMoleculeStore();
  const atom = currentMolecule?.atoms.find((a) => a.id === atomId);
  const bondedAtoms = currentMolecule
    ? currentMolecule.bonds
        .filter((b) => b.atom1Id === atomId || b.atom2Id === atomId)
        .map((b) => {
          const otherId = b.atom1Id === atomId ? b.atom2Id : b.atom1Id;
          return currentMolecule.atoms.find((a) => a.id === otherId);
        })
        .filter(Boolean)
    : [];

  const elementProps = atom ? ELEMENT_PROPERTIES[atom.element] : null;

  if (!atom) return null;

  const cardStyle: React.CSSProperties = {
    left: Math.min(position.x + 20, window.innerWidth - 260),
    top: Math.min(position.y - 60, window.innerHeight - 300),
  };

  return (
    <div className="atom-info-card" style={cardStyle} onClick={(e) => e.stopPropagation()}>
      <div className="card-header">
        <div className="element-symbol" style={{ backgroundColor: atom.color }}>
          {atom.element}
        </div>
        <div>
          <div className="element-name">{elementProps?.name || atom.element}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            半径: {atom.radius} Å
          </div>
        </div>
      </div>
      <div className="card-content">
        <div className="info-row">
          <span className="label">X 坐标</span>
          <span className="value">{atom.x.toFixed(3)}</span>
        </div>
        <div className="info-row">
          <span className="label">Y 坐标</span>
          <span className="value">{atom.y.toFixed(3)}</span>
        </div>
        <div className="info-row">
          <span className="label">Z 坐标</span>
          <span className="value">{atom.z.toFixed(3)}</span>
        </div>
        {bondedAtoms.length > 0 && (
          <div className="bonded-atoms">
            <div className="bonded-title">键连原子 ({bondedAtoms.length})</div>
            <div className="bonded-list">
              {bondedAtoms.map((ba, idx) => (
                <span key={idx} className="bonded-item">
                  {ba?.element}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        ✕
      </button>
    </div>
  );
};

export default MoleculeViewer;
