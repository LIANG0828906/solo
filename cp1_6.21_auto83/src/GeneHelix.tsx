import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { 
  BaseType, 
  BasePair, 
  HELIX_CONFIG, 
  BASE_COLORS,
  SelectedBaseInfo,
  AnimationState,
  COMPLEMENTARY_BASES
} from './types';
import { AnimationController, parabolicEase } from './AnimationController';

interface GeneHelixProps {
  animationController: AnimationController;
  animationState: AnimationState;
  highlightBase?: BaseType | null;
  onBaseClick: (info: SelectedBaseInfo) => void;
}

export default function GeneHelix({ 
  animationController, 
  animationState,
  highlightBase,
  onBaseClick 
}: GeneHelixProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [highlightFlash, setHighlightFlash] = useState(false);
  const [animState, setAnimState] = useState(animationController.getState());
  const [selectedRod, setSelectedRod] = useState<number | null>(null);
  const clickTimerRef = useRef<number | null>(null);

  const { radius, pitch, nodeCount, nodeDiameter, tubeRadius, tubeOpacity, baseRodRadius } = HELIX_CONFIG;

  useEffect(() => {
    const unsubscribe = animationController.subscribe((state) => {
      setAnimState(state);
    });
    return unsubscribe;
  }, [animationController]);

  const { basePairs, strand1Positions, strand2Positions } = useMemo(() => {
    const pairs: BasePair[] = [];
    const s1Pos: THREE.Vector3[] = [];
    const s2Pos: THREE.Vector3[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2 * 4;
      const y = (i / nodeCount) * pitch * 4 - pitch * 2;
      
      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;
      
      const x2 = Math.cos(angle + Math.PI) * radius;
      const z2 = Math.sin(angle + Math.PI) * radius;

      s1Pos.push(new THREE.Vector3(x1, y, z1));
      s2Pos.push(new THREE.Vector3(x2, y, z2));

      const types: BaseType[] = ['A', 'T', 'G', 'C'];
      const typeA = types[Math.floor(Math.random() * 4)] as BaseType;
      const typeB = COMPLEMENTARY_BASES[typeA];

      pairs.push({
        id: i,
        typeA,
        typeB,
        index: i
      });
    }

    return { basePairs: pairs, strand1Positions: s1Pos, strand2Positions: s2Pos };
  }, [nodeCount, pitch, radius]);

  useEffect(() => {
    if (highlightBase) {
      setHighlightFlash(true);
      const timer = setTimeout(() => setHighlightFlash(false), 500);
      return () => clearTimeout(timer);
    }
  }, [highlightBase]);

  const getActualPosition = useCallback((
    basePos: THREE.Vector3, 
    nodeIndex: number, 
    strand: 0 | 1
  ): THREE.Vector3 => {
    const result = basePos.clone();
    const scatterProgress = animationController.getScatterProgress();
    const strandSeparation = animationController.getStrandSeparation();

    if (scatterProgress > 0 && animState.scatteredPositions[nodeIndex]) {
      const scatterPos = animState.scatteredPositions[nodeIndex];
      
      const reassembleProgress = 1 - scatterProgress;
      const parabolicOffset = parabolicEase(reassembleProgress, 20);
      
      result.lerp(
        new THREE.Vector3(scatterPos.x, scatterPos.y + parabolicOffset, scatterPos.z),
        scatterProgress
      );
    } else if (strandSeparation > 0) {
      const separation = strandSeparation * (strand === 0 ? 1 : -1);
      result.x += separation;
    }

    if (animationState === AnimationState.PLAYING) {
      const floatOffset = animState.nodeFloatOffsets[nodeIndex] || 0;
      result.y += floatOffset;
    }

    return result;
  }, [animState, animationController, animationState]);

  const handleRodClick = (pair: BasePair, event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      
      const pos = getActualPosition(
        strand1Positions[pair.index],
        pair.index * 2,
        0
      );

      onBaseClick({
        type: pair.typeA,
        pairType: pair.typeB,
        position: { x: pos.x, y: pos.y, z: pos.z },
        index: pair.index
      });
      
      setSelectedRod(pair.id);
      setTimeout(() => setSelectedRod(null), 200);
    } else {
      clickTimerRef.current = window.setTimeout(() => {
        clickTimerRef.current = null;
      }, 250);
    }
  };

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = (animState.rotation * Math.PI) / 180;
    }
  });

  const rodOpacity = animationState === AnimationState.DISASSEMBLED 
    ? 0 
    : 1 - animationController.getScatterProgress() * 0.8;

  const nodeOpacity = 1 - animationController.getScatterProgress() * 0.1;

  const renderTube = (
    pos1: THREE.Vector3,
    pos2: THREE.Vector3,
    color: string,
    key: string
  ) => {
    const mid = pos1.clone().add(pos2).divideScalar(2);
    const length = pos1.distanceTo(pos2);
    const direction = pos2.clone().sub(pos1).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);

    return (
      <mesh
        key={key}
        position={mid}
        quaternion={quaternion}
      >
        <cylinderGeometry args={[tubeRadius, tubeRadius, length, 8]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={tubeOpacity * nodeOpacity}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
    );
  };

  const strand1Nodes = strand1Positions.map((pos, i) => {
    const actualPos = getActualPosition(pos, i * 2, 0);
    const pair = basePairs[i];
    const isHighlighted = highlightBase === pair.typeA || highlightBase === pair.typeB;
    return (
      <mesh key={`s1-${i}`} position={actualPos}>
        <sphereGeometry args={[nodeDiameter / 2, 16, 16]} />
        <meshStandardMaterial
          color={isHighlighted && highlightFlash ? '#FFD700' : '#66FCF1'}
          emissive={isHighlighted ? '#FFD700' : '#45A29E'}
          emissiveIntensity={isHighlighted ? 1 : 0.3}
          metalness={0.3}
          roughness={0.4}
          transparent
          opacity={nodeOpacity}
        />
      </mesh>
    );
  });

  const strand2Nodes = strand2Positions.map((pos, i) => {
    const actualPos = getActualPosition(pos, i * 2 + 1, 1);
    const pair = basePairs[i];
    const isHighlighted = highlightBase === pair.typeA || highlightBase === pair.typeB;
    return (
      <mesh key={`s2-${i}`} position={actualPos}>
        <sphereGeometry args={[nodeDiameter / 2, 16, 16]} />
        <meshStandardMaterial
          color={isHighlighted && highlightFlash ? '#FFD700' : '#45A29E'}
          emissive={isHighlighted ? '#FFD700' : '#66FCF1'}
          emissiveIntensity={isHighlighted ? 1 : 0.3}
          metalness={0.3}
          roughness={0.4}
          transparent
          opacity={nodeOpacity}
        />
      </mesh>
    );
  });

  const strand1Tubes = Array.from({ length: nodeCount - 1 }).map((_, i) => {
    const pos1 = getActualPosition(strand1Positions[i], i * 2, 0);
    const pos2 = getActualPosition(strand1Positions[i + 1], (i + 1) * 2, 0);
    return renderTube(pos1, pos2, '#45A29E', `tube-s1-${i}`);
  });

  const strand2Tubes = Array.from({ length: nodeCount - 1 }).map((_, i) => {
    const pos1 = getActualPosition(strand2Positions[i], i * 2 + 1, 1);
    const pos2 = getActualPosition(strand2Positions[i + 1], (i + 1) * 2 + 1, 1);
    return renderTube(pos1, pos2, '#66FCF1', `tube-s2-${i}`);
  });

  const baseRods = basePairs.map((pair) => {
    const pos1 = getActualPosition(strand1Positions[pair.index], pair.index * 2, 0);
    const pos2 = getActualPosition(strand2Positions[pair.index], pair.index * 2 + 1, 1);
    const rodColor = BASE_COLORS[pair.typeA];
    const isHighlighted = highlightBase === pair.typeA || highlightBase === pair.typeB;
    const currentRadius = selectedRod === pair.id 
      ? HELIX_CONFIG.baseRodHighlightRadius 
      : (isHighlighted && highlightFlash ? 0.6 : baseRodRadius);
    
    const mid = pos1.clone().add(pos2).divideScalar(2);
    const length = pos1.distanceTo(pos2);
    const direction = pos2.clone().sub(pos1).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);

    return (
      <mesh
        key={`rod-${pair.id}`}
        position={mid}
        quaternion={quaternion}
        onClick={(e) => handleRodClick(pair, e)}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <cylinderGeometry
          args={[currentRadius, currentRadius, length, 8]}
        />
        <meshStandardMaterial
          color={rodColor}
          emissive={rodColor}
          emissiveIntensity={isHighlighted ? 0.8 : 0.4}
          transparent
          opacity={rodOpacity}
        />
      </mesh>
    );
  });

  return (
    <>
      <color attach="background" args={['#0B0C10']} />
      <Stars radius={300} depth={60} count={3000} factor={4} saturation={0} fade speed={0.5} />
      <ambientLight intensity={0.3} />
      <pointLight position={[100, 100, 100]} intensity={1} color="#66FCF1" />
      <pointLight position={[-100, -100, -100]} intensity={0.5} color="#45A29E" />
      <directionalLight position={[0, 50, 50]} intensity={0.8} color="#FFFFFF" />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={20}
        maxDistance={150}
        zoomSpeed={0.8}
        maxPolarAngle={Math.PI * 85 / 180}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        }}
      />

      <group ref={groupRef}>
        {strand1Nodes}
        {strand2Nodes}
        {strand1Tubes}
        {strand2Tubes}
        {baseRods}
      </group>
    </>
  );
}
