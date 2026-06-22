import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  generateDNAGeometry,
  createBackboneTube,
  getArrowPositions,
  BasePairData,
} from '../lib/DNAGeometry';
import { useDNAContext, DNAVisualParams } from '../context/DNAContext';
import { Colors, lerp, easeInOutCubic } from '../lib/utils';
import BasePair from './BasePair';

const DNAHelix: React.FC = () => {
  const { params, visualMode, highlightedBasePair } = useDNAContext();
  const animRef = useRef<{
    start: DNAVisualParams;
    end: DNAVisualParams;
    startTime: number;
  } | null>(null);
  const currentParams = useRef<DNAVisualParams>(params);
  const rootGroup = useRef<THREE.Group>(null);

  useEffect(() => {
    animRef.current = {
      start: { ...currentParams.current },
      end: { ...params },
      startTime: performance.now(),
    };
  }, [params.turns, params.basePairSpacing, params.backboneWidth]);

  useFrame(() => {
    if (!animRef.current || !rootGroup.current) return;
    const { start, end, startTime } = animRef.current;
    const elapsed = performance.now() - startTime;
    const tRaw = Math.min(elapsed / 300, 1);
    const t = easeInOutCubic(tRaw);
    currentParams.current = {
      turns: lerp(start.turns, end.turns, t),
      basePairSpacing: lerp(start.basePairSpacing, end.basePairSpacing, t),
      backboneWidth: lerp(start.backboneWidth, end.backboneWidth, t),
    };
  });

  const geometry = useMemo(
    () =>
      generateDNAGeometry(
        currentParams.current.turns,
        currentParams.current.basePairSpacing,
        currentParams.current.backboneWidth,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.turns, params.basePairSpacing, params.backboneWidth],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const displayParams = currentParams.current;

  const backbone1Geom = useMemo(
    () => createBackboneTube(geometry.backbone1Points, 300, 10, displayParams.backboneWidth * 0.55),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [geometry.backbone1Points, displayParams.backboneWidth],
  );
  const backbone2Geom = useMemo(
    () => createBackboneTube(geometry.backbone2Points, 300, 10, displayParams.backboneWidth * 0.55),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [geometry.backbone2Points, displayParams.backboneWidth],
  );

  const showBonds = visualMode !== 'backbone';
  const showLabels = visualMode === 'teaching';
  const showArrows = visualMode === 'teaching';

  const arrows1 = useMemo(() => getArrowPositions(geometry.backbone1Points, 8), [geometry.backbone1Points]);
  const arrows2 = useMemo(() => getArrowPositions(geometry.backbone2Points, 8), [geometry.backbone2Points]);

  return (
    <group ref={rootGroup}>
      <mesh geometry={backbone1Geom}>
        <meshStandardMaterial
          color={Colors.backboneBlue}
          emissive={Colors.backboneBlue}
          emissiveIntensity={0.35}
          transparent
          opacity={0.82}
          metalness={0.4}
          roughness={0.25}
        />
      </mesh>
      <mesh geometry={backbone2Geom}>
        <meshStandardMaterial
          color={Colors.backboneRed}
          emissive={Colors.backboneRed}
          emissiveIntensity={0.35}
          transparent
          opacity={0.82}
          metalness={0.4}
          roughness={0.25}
        />
      </mesh>

      {showArrows &&
        arrows1.map((a, i) => {
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.direction);
          return (
            <group key={`arrow1-${i}`} position={a.position} quaternion={q}>
              <mesh>
                <coneGeometry args={[0.08, 0.22, 10]} />
                <meshStandardMaterial color={Colors.backboneBlue} emissive={Colors.backboneBlue} emissiveIntensity={0.5} />
              </mesh>
            </group>
          );
        })}

      {showArrows &&
        arrows2.map((a, i) => {
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.direction);
          return (
            <group key={`arrow2-${i}`} position={a.position} quaternion={q}>
              <mesh>
                <coneGeometry args={[0.08, 0.22, 10]} />
                <meshStandardMaterial color={Colors.backboneRed} emissive={Colors.backboneRed} emissiveIntensity={0.5} />
              </mesh>
            </group>
          );
        })}

      {geometry.basePairs.map((bp: BasePairData) => (
        <BasePair
          key={bp.id}
          data={bp}
          isHighlighted={highlightedBasePair?.id === bp.id}
          showBonds={showBonds}
          showLabels={showLabels}
        />
      ))}

      {showLabels && (
        <>
          <Text
            position={[1.8, geometry.totalHeight / 2 + 0.6, 0]}
            fontSize={0.3}
            color={Colors.backboneBlue}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            5'
          </Text>
          <Text
            position={[-1.8, -geometry.totalHeight / 2 - 0.6, 0]}
            fontSize={0.3}
            color={Colors.backboneRed}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            3'
          </Text>
        </>
      )}
    </group>
  );
};

export default DNAHelix;
