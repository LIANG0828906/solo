import { useMemo, useRef, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useSequenceStore } from '@/store/sequenceStore';
import {
  type BasePair,
  BASE_COLORS,
  DEFAULT_HELIX_RADIUS,
  DEFAULT_BASES_PER_TURN,
  getDynamicHelixParams,
} from '@/utils/sequenceParser';

interface FlowParticle {
  progress: number;
  speed: number;
  offset: number;
  size: number;
  strand: number;
}

export function DNAHelix() {
  const {
    basePairs,
    selectedBaseIndex,
    selectBase,
    activeMutation,
    viewParams,
    isTransitioning,
  } = useSequenceStore();
  const { showLabels, showBackbone, showBases } = viewParams;

  const particlesRef = useRef<FlowParticle[]>([]);
  const particleGroupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<Map<string, THREE.Mesh>>(new Map());

  const totalBases = basePairs.length;
  const { radius, basePairHeight, basesPerTurn } = useMemo(
    () => getDynamicHelixParams(totalBases),
    [totalBases]
  );
  const totalHeight = (totalBases - 1) * basePairHeight;
  const yStart = -totalHeight / 2;
  const yEnd = totalHeight / 2;

  useEffect(() => {
    particlesRef.current = Array.from({ length: 30 }, (_, i) => ({
      progress: Math.random(),
      speed: 0.08 + Math.random() * 0.06,
      offset: Math.random() * Math.PI * 2,
      size: 0.04 + Math.random() * 0.04,
      strand: i % 2,
    }));
  }, []);

  const getHelixPoint = useCallback(
    (t: number, strand: number = 0): THREE.Vector3 => {
      const angle = t * totalBases * ((2 * Math.PI) / basesPerTurn);
      const strandOffset = strand === 0 ? 0 : Math.PI;
      const y = yStart + t * totalHeight;
      return new THREE.Vector3(
        radius * Math.cos(angle + strandOffset),
        y,
        radius * Math.sin(angle + strandOffset)
      );
    },
    [radius, totalBases, basesPerTurn, yStart, totalHeight]
  );

  const backboneCurves = useMemo(() => {
    const points1: THREE.Vector3[] = [];
    const points2: THREE.Vector3[] = [];
    const segmentCount = Math.max(100, totalBases * 3);

    for (let i = 0; i <= segmentCount; i++) {
      const t = i / segmentCount;
      points1.push(getHelixPoint(t, 0));
      points2.push(getHelixPoint(t, 1));
    }

    return {
      curve1: new THREE.CatmullRomCurve3(points1),
      curve2: new THREE.CatmullRomCurve3(points2),
    };
  }, [getHelixPoint, totalBases]);

  const getMutationOffset = useCallback(
    (index: number): number => {
      if (!activeMutation) return 0;
      const [start, end] = activeMutation.affectedRange;
      if (index < start || index > end) return 0;
      const distance = index - activeMutation.position;
      const decayFactor = Math.exp(-Math.abs(distance) / 5);
      const oscillation = Math.sin(distance * 0.6) * 0.3;
      return activeMutation.intensity * decayFactor * (1 + oscillation);
    },
    [activeMutation]
  );

  useFrame((_state, delta) => {
    if (!showBackbone || !particleGroupRef.current) return;

    const particles = particlesRef.current;
    const group = particleGroupRef.current;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.progress += p.speed * delta;
      if (p.progress > 1) p.progress = 0;

      const pos = getHelixPoint(p.progress, p.strand);
      const child = group.children[i] as THREE.Mesh;
      if (child) {
        child.position.copy(pos);
        const scale = 0.7 + Math.sin(p.progress * Math.PI) * 0.6;
        child.scale.setScalar(scale * (p.size / 0.05));
      }
    }
  });

  const handleBaseClick = useCallback(
    (index: number, e: any) => {
      e.stopPropagation();
      selectBase(index === selectedBaseIndex ? null : index);
    },
    [selectBase, selectedBaseIndex]
  );

  const tubeGeometry1 = useMemo(
    () => new THREE.TubeGeometry(backboneCurves.curve1, 200, 0.08, 12, false),
    [backboneCurves]
  );

  const tubeGeometry2 = useMemo(
    () => new THREE.TubeGeometry(backboneCurves.curve2, 200, 0.08, 12, false),
    [backboneCurves]
  );

  return (
    <group>
      {showBackbone && (
        <>
          <mesh geometry={tubeGeometry1}>
            <meshStandardMaterial
              color="#00d4ff"
              emissive="#0088ff"
              emissiveIntensity={0.3}
              metalness={0.7}
              roughness={0.25}
            />
          </mesh>
          <mesh geometry={tubeGeometry2}>
            <meshStandardMaterial
              color="#00ffaa"
              emissive="#00cc77"
              emissiveIntensity={0.3}
              metalness={0.7}
              roughness={0.25}
            />
          </mesh>

          <group ref={particleGroupRef}>
            {particlesRef.current.map((p, i) => (
              <mesh key={i}>
                <sphereGeometry args={[p.size, 12, 12]} />
                <meshBasicMaterial
                  color={p.strand === 0 ? '#00ffff' : '#00ffaa'}
                  transparent
                  opacity={0.9}
                />
              </mesh>
            ))}
          </group>
        </>
      )}

      {showBases &&
        basePairs.map((bp: BasePair) => {
          const isSelected = selectedBaseIndex === bp.index;
          const scale = isSelected ? 1.4 : 1;
          const mutationOffset = getMutationOffset(bp.index);
          const color1 = BASE_COLORS[bp.base1];
          const color2 = BASE_COLORS[bp.base2];

          return (
            <group
              key={bp.id}
              position={[
                bp.position[0],
                bp.position[1] + mutationOffset,
                bp.position[2],
              ]}
              rotation={bp.rotation}
              onClick={(e) => handleBaseClick(bp.index, e)}
            >
              <Float
                speed={isSelected ? 3 : 0}
                rotationIntensity={isSelected ? 0.3 : 0}
                floatIntensity={isSelected ? 0.5 : 0}
              >
                <group scale={scale}>
                  {isSelected && (
                    <mesh>
                      <ringGeometry args={[0.6, 0.8, 32]} />
                      <meshBasicMaterial
                        color={color1}
                        transparent
                        opacity={0.4}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                  )}

                  <mesh position={[-0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.16, 0.16, 0.5, 16]} />
                    <meshStandardMaterial
                      color={color1}
                      emissive={isSelected ? color1 : '#000000'}
                      emissiveIntensity={isSelected ? 0.6 : 0}
                      metalness={0.3}
                      roughness={0.4}
                    />
                  </mesh>

                  <mesh position={[0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.16, 0.16, 0.5, 16]} />
                    <meshStandardMaterial
                      color={color2}
                      emissive={isSelected ? color2 : '#000000'}
                      emissiveIntensity={isSelected ? 0.6 : 0}
                      metalness={0.3}
                      roughness={0.4}
                    />
                  </mesh>

                  <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.1, 16, 16]} />
                    <meshStandardMaterial
                      color="#ffffff"
                      emissive="#ffffff"
                      emissiveIntensity={isSelected ? 1 : 0.4}
                    />
                  </mesh>

                  {showLabels && (
                    <>
                      <Text
                        position={[-0.45, -0.5, 0]}
                        fontSize={0.25}
                        color={color1}
                        anchorX="center"
                        anchorY="middle"
                        fontWeight="bold"
                      >
                        {bp.base1}
                      </Text>
                      <Text
                        position={[0.45, -0.5, 0]}
                        fontSize={0.25}
                        color={color2}
                        anchorX="center"
                        anchorY="middle"
                        fontWeight="bold"
                      >
                        {bp.base2}
                      </Text>
                    </>
                  )}
                </group>
              </Float>
            </group>
          );
        })}
    </group>
  );
}

export default DNAHelix;
