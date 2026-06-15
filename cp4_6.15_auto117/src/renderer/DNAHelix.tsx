import { useMemo, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useSequenceStore } from '@/store/sequenceStore';
import {
  BasePair,
  BASE_COLORS,
  HELIX_RADIUS,
  BASE_PAIR_HEIGHT,
  BASES_PER_TURN,
} from '@/utils/sequenceParser';

interface ParticleData {
  progress: number;
  speed: number;
  offset: number;
}

export function DNAHelix() {
  const {
    basePairs,
    selectedBaseIndex,
    selectBase,
    activeMutation,
    viewParams,
  } = useSequenceStore();
  const { showLabels, showBackbone, showBases } = viewParams;

  const particlesRef = useRef<ParticleData[]>([]);
  const particleMeshesRef = useRef<THREE.Mesh[]>([]);

  useMemo(() => {
    particlesRef.current = Array.from({ length: 20 }, (_, i) => ({
      progress: i / 20,
      speed: 0.05 + Math.random() * 0.05,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  const totalBases = basePairs.length;
  const totalHeight = (totalBases - 1) * BASE_PAIR_HEIGHT;
  const yStart = -totalHeight / 2;
  const yEnd = totalHeight / 2;

  const { backbone1Points, backbone2Points } = useMemo(() => {
    const points1: THREE.Vector3[] = [];
    const points2: THREE.Vector3[] = [];
    const segmentCount = totalBases * 4;

    for (let i = 0; i <= segmentCount; i++) {
      const t = i / segmentCount;
      const angle = t * totalBases * (2 * Math.PI) / BASES_PER_TURN;
      const y = yStart + t * totalHeight;

      points1.push(new THREE.Vector3(
        HELIX_RADIUS * Math.cos(angle),
        y,
        HELIX_RADIUS * Math.sin(angle)
      ));
      points2.push(new THREE.Vector3(
        HELIX_RADIUS * Math.cos(angle + Math.PI),
        y,
        HELIX_RADIUS * Math.sin(angle + Math.PI)
      ));
    }

    return {
      backbone1Points: new THREE.CatmullRomCurve3(points1),
      backbone2Points: new THREE.CatmullRomCurve3(points2),
    };
  }, [totalBases, yStart, totalHeight]);

  const getMutationOffset = useCallback((index: number): number => {
    if (!activeMutation) return 0;
    const [start, end] = activeMutation.affectedRange;
    if (index < start || index > end) return 0;
    const distance = index - activeMutation.position;
    const normalizedDist = distance / Math.max(end - start, 1);
    return Math.sin(normalizedDist * Math.PI * 2) * activeMutation.intensity * 0.5;
  }, [activeMutation]);

  useFrame((_state, delta) => {
    if (!showBackbone) return;

    particlesRef.current.forEach((particle, i) => {
      particle.progress += particle.speed * delta;
      if (particle.progress > 1) particle.progress = 0;

      const t = particle.progress;
      const angle = t * totalBases * (2 * Math.PI) / BASES_PER_TURN + particle.offset;
      const y = yStart + t * totalHeight;

      const backboneIndex = i % 2;
      const baseAngle = backboneIndex === 0 ? angle : angle + Math.PI;
      const radius = HELIX_RADIUS + Math.sin(t * Math.PI * 4 + particle.offset) * 0.1;

      if (particleMeshesRef.current[i]) {
        particleMeshesRef.current[i].position.set(
          radius * Math.cos(baseAngle),
          y,
          radius * Math.sin(baseAngle)
        );
      }
    });
  });

  const handleBaseClick = useCallback((index: number, e: any) => {
    e.stopPropagation();
    selectBase(index === selectedBaseIndex ? null : index);
  }, [selectBase, selectedBaseIndex]);

  const tubeGeometry1 = useMemo(() =>
    new THREE.TubeGeometry(backbone1Points, 200, 0.08, 8, false),
  [backbone1Points]);

  const tubeGeometry2 = useMemo(() =>
    new THREE.TubeGeometry(backbone2Points, 200, 0.08, 8, false),
  [backbone2Points]);

  return (
    <group>
      {showBackbone && (
        <>
          <mesh geometry={tubeGeometry1}>
            <meshStandardMaterial
              color="#00d4ff"
              emissive="#0066ff"
              emissiveIntensity={0.2}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          <mesh geometry={tubeGeometry2}>
            <meshStandardMaterial
              color="#00ffaa"
              emissive="#00aa66"
              emissiveIntensity={0.2}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>

          {particlesRef.current.map((_, i) => (
            <mesh
              key={i}
              ref={(el) => {
                if (el) particleMeshesRef.current[i] = el;
              }}
            >
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? '#00ffff' : '#00ff88'}
                emissive={i % 2 === 0 ? '#00ffff' : '#00ff88'}
                emissiveIntensity={0.8}
              />
            </mesh>
          ))}
        </>
      )}

      {showBases && basePairs.map((bp: BasePair) => {
        const isSelected = selectedBaseIndex === bp.index;
        const scale = isSelected ? 1.3 : 1;
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
            <Float speed={isSelected ? 2 : 0} rotationIntensity={isSelected ? 0.2 : 0}>
              <group scale={scale}>
                <mesh position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.15, 0.15, 0.5, 16]} />
                  <meshStandardMaterial
                    color={color1}
                    emissive={isSelected ? color1 : '#000000'}
                    emissiveIntensity={isSelected ? 0.5 : 0}
                  />
                </mesh>

                <mesh position={[0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.15, 0.15, 0.5, 16]} />
                  <meshStandardMaterial
                    color={color2}
                    emissive={isSelected ? color2 : '#000000'}
                    emissiveIntensity={isSelected ? 0.5 : 0}
                  />
                </mesh>

                <mesh position={[0, 0, 0]}>
                  <sphereGeometry args={[0.12, 16, 16]} />
                  <meshStandardMaterial
                    color="#ffffff"
                    emissive="#ffffff"
                    emissiveIntensity={isSelected ? 0.8 : 0.3}
                  />
                </mesh>

                {showLabels && (
                  <>
                    <Text
                      position={[-0.5, -0.5, 0]}
                      fontSize={0.3}
                      color={color1}
                      anchorX="center"
                      anchorY="middle"
                    >
                      {bp.base1}
                    </Text>
                    <Text
                      position={[0.5, -0.5, 0]}
                      fontSize={0.3}
                      color={color2}
                      anchorX="center"
                      anchorY="middle"
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
