import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGrowthStore } from '../store/growthStore';

interface BranchProps {
  depth: number;
  maxDepth: number;
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
  thickness: number;
  branchAngle: number;
  branchSpacing: number;
  leafCount: number;
  leafSize: number;
  leafColorSat: number;
  leafColorLight: number;
  flowerSize: number;
  progress: number;
  water: number;
}

function Branch({
  depth,
  maxDepth,
  position,
  rotation,
  length,
  thickness,
  branchAngle,
  branchSpacing,
  leafCount,
  leafSize,
  leafColorSat,
  leafColorLight,
  flowerSize,
  progress,
  water,
}: BranchProps) {
  const groupRef = useRef<THREE.Group>(null);
  const depthRatio = depth / maxDepth;
  const currentLength = length * (1 - depthRatio * 0.25);
  const currentThickness = thickness * (1 - depthRatio * 0.5);

  const stemColor = useMemo(() => {
    const r = 0.25 + depthRatio * 0.15;
    const g = 0.4 + depthRatio * 0.2;
    const b = 0.15 + depthRatio * 0.1;
    return new THREE.Color(r, g, b);
  }, [depthRatio]);

  const leafColor = useMemo(() => {
    const hue = 0.28 - (1 - water / 100) * 0.08;
    return new THREE.Color().setHSL(hue, leafColorSat, leafColorLight);
  }, [leafColorSat, leafColorLight, water]);

  const branchProgress = useMemo(() => {
    const startT = depth * 0.18;
    const endT = startT + 0.3;
    return Math.max(0, Math.min(1, (progress - startT) / (endT - startT)));
  }, [progress, depth]);

  const leafCurl = useMemo(() => {
    return (1 - water / 100) * 0.5;
  }, [water]);

  const childBranches = useMemo(() => {
    if (depth >= maxDepth) return [];
    const count = depth === 0 ? 3 : 2;
    const branches: Array<{
      angle: number;
      sideAngle: number;
      offset: number;
    }> = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + depth * 0.5;
      const sideAngle = branchAngle + (Math.random() - 0.5) * 0.1;
      const offset = branchSpacing * (0.6 + i * 0.3);
      branches.push({ angle, sideAngle, offset });
    }
    return branches;
  }, [depth, maxDepth, branchAngle, branchSpacing]);

  const leafPositions = useMemo(() => {
    if (depth < maxDepth - 1) return [];
    const leaves: Array<{
      pos: [number, number, number];
      rot: [number, number, number];
    }> = [];
    for (let i = 0; i < leafCount; i++) {
      const angle = (i / leafCount) * Math.PI * 2;
      const spread = 0.05 + i * 0.02;
      leaves.push({
        pos: [
          Math.sin(angle) * spread,
          currentLength * 0.8 + i * 0.03,
          Math.cos(angle) * spread,
        ],
        rot: [
          -Math.PI / 4 + leafCurl * Math.sin(angle),
          angle,
          leafCurl * Math.cos(angle) * 0.5,
        ],
      });
    }
    return leaves;
  }, [depth, maxDepth, leafCount, currentLength, leafCurl]);

  const showFlower = depth >= maxDepth - 1 && branchProgress > 0.8;

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, currentLength * branchProgress * 0.5, 0]}>
        <cylinderGeometry args={[currentThickness * 0.7, currentThickness, currentLength * branchProgress, 5, 1]} />
        <meshStandardMaterial color={stemColor} roughness={0.8} />
      </mesh>

      {branchProgress > 0.5 &&
        childBranches.map((child, i) => (
          <Branch
            key={`${depth}-${i}`}
            depth={depth + 1}
            maxDepth={maxDepth}
            position={[0, currentLength * child.offset * branchProgress, 0]}
            rotation={[child.sideAngle, child.angle, 0]}
            length={currentLength * 0.7}
            thickness={currentThickness * 0.6}
            branchAngle={branchAngle}
            branchSpacing={branchSpacing * 0.8}
            leafCount={leafCount}
            leafSize={leafSize * 0.85}
            leafColorSat={leafColorSat}
            leafColorLight={leafColorLight}
            flowerSize={flowerSize * 0.7}
            progress={progress}
            water={water}
          />
        ))}

      {branchProgress > 0.6 &&
        leafPositions.map((leaf, i) => (
          <mesh key={`leaf-${i}`} position={leaf.pos} rotation={leaf.rot}>
            <planeGeometry args={[leafSize, leafSize * 1.5]} />
            <meshStandardMaterial
              color={leafColor}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
              roughness={0.6}
            />
          </mesh>
        ))}

      {showFlower && (
        <group position={[0, currentLength * branchProgress, 0]}>
          <mesh>
            <sphereGeometry args={[flowerSize, 6, 6]} />
            <meshStandardMaterial
              color={new THREE.Color().setHSL(0.08, 0.8, 0.6)}
              roughness={0.5}
            />
          </mesh>
          {[0, 1, 2, 3, 4].map((p) => (
            <mesh
              key={p}
              position={[
                Math.sin((p / 5) * Math.PI * 2) * flowerSize * 1.5,
                0,
                Math.cos((p / 5) * Math.PI * 2) * flowerSize * 1.5,
              ]}
            >
              <sphereGeometry args={[flowerSize * 0.6, 5, 5]} />
              <meshStandardMaterial
                color={new THREE.Color().setHSL(0.0, 0.7, 0.55 + p * 0.04)}
                roughness={0.4}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

export default function Plant() {
  const groupRef = useRef<THREE.Group>(null);
  const {
    light,
    water,
    temperature,
    growthProgress,
    isGrowing,
    isPaused,
    snapshot,
    setGrowthProgress,
    resetGrowing,
  } = useGrowthStore();

  const animRef = useRef({
    startTime: 0,
    pausedAt: 0,
    accumulated: 0,
  });

  useEffect(() => {
    if (isGrowing && !isPaused) {
      animRef.current.startTime = performance.now();
      animRef.current.accumulated = growthProgress * 5000;
    }
  }, [isGrowing, isPaused]);

  useFrame(() => {
    if (!isGrowing || isPaused) return;

    const now = performance.now();
    const elapsed = now - animRef.current.startTime + animRef.current.accumulated;
    const duration = 5000;
    const p = Math.min(1, elapsed / duration);

    setGrowthProgress(p);

    if (p >= 1) {
      resetGrowing();
      setGrowthProgress(1);
    }
  });

  const {
    trunkLength,
    trunkThickness,
    branchAngle,
    branchSpacing,
    leafCount,
    leafSize,
    leafColorSat,
    leafColorLight,
    flowerSize,
  } = snapshot;

  const effectiveProgress = isGrowing || growthProgress > 0 ? growthProgress : 1;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <Branch
        depth={0}
        maxDepth={3}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        length={trunkLength}
        thickness={trunkThickness}
        branchAngle={branchAngle}
        branchSpacing={branchSpacing}
        leafCount={leafCount}
        leafSize={leafSize}
        leafColorSat={leafColorSat}
        leafColorLight={leafColorLight}
        flowerSize={flowerSize}
        progress={effectiveProgress}
        water={water}
      />
    </group>
  );
}
