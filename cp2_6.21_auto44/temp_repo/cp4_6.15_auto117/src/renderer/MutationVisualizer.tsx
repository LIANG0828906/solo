import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSequenceStore } from '@/store/sequenceStore';
import {
  BASE_COLORS,
  getDynamicHelixParams,
  type BaseType,
} from '@/utils/sequenceParser';
import type { MutationEffect } from '@/utils/mutationSimulator';

interface ExplosionParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  rotationSpeed: THREE.Vector3;
}

interface Fragment {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  rotationSpeed: THREE.Euler;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface PulseRing {
  position: THREE.Vector3;
  scale: number;
  maxScale: number;
  life: number;
  maxLife: number;
  color: string;
}

interface InsertionFlash {
  position: THREE.Vector3;
  life: number;
  maxLife: number;
  baseType: BaseType;
  index: number;
}

export function MutationVisualizer() {
  const { activeMutation, basePairs } = useSequenceStore();
  const mutationType = useSequenceStore((state) => {
    const history = state.mutationHistory;
    const idx = state.currentHistoryIndex;
    return idx >= 0 && idx < history.length ? history[idx]?.type : null;
  });

  const explosionParticlesRef = useRef<ExplosionParticle[]>([]);
  const fragmentsRef = useRef<Fragment[]>([]);
  const pulseRingsRef = useRef<PulseRing[]>([]);
  const insertionFlashesRef = useRef<InsertionFlash[]>([]);
  const markerPointsRef = useRef<{ position: THREE.Vector3; baseType: BaseType }[]>([]);

  const groupRef = useRef<THREE.Group>(null);
  const prevMutationIdRef = useRef<string | null>(null);

  const totalBases = basePairs.length;
  const { radius, basePairHeight, basesPerTurn } = useMemo(
    () => getDynamicHelixParams(totalBases),
    [totalBases]
  );

  const getBasePosition = useCallback(
    (index: number): THREE.Vector3 => {
      const anglePerBase = (2 * Math.PI) / basesPerTurn;
      const helixAngle = index * anglePerBase;
      const yOffset = (index - (totalBases - 1) / 2) * basePairHeight;
      return new THREE.Vector3(
        radius * Math.cos(helixAngle),
        yOffset,
        radius * Math.sin(helixAngle)
      );
    },
    [radius, basePairHeight, basesPerTurn, totalBases]
  );

  const createExplosionParticles = useCallback(
    (position: THREE.Vector3, color: string, count: number = 30) => {
      const newParticles: ExplosionParticle[] = [];
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = 0.5 + Math.random() * 1.5;
        const velocity = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed,
          Math.sin(phi) * Math.sin(theta) * speed
        );
        newParticles.push({
          position: position.clone(),
          velocity,
          life: 1.5,
          maxLife: 1.5,
          size: 0.05 + Math.random() * 0.08,
          color,
          rotationSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
          ),
        });
      }
      explosionParticlesRef.current = [
        ...explosionParticlesRef.current,
        ...newParticles,
      ];
    },
    []
  );

  const createFragments = useCallback(
    (position: THREE.Vector3, color: string, count: number = 12) => {
      const newFragments: Fragment[] = [];
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const speed = 0.3 + Math.random() * 0.8;
        const velocity = new THREE.Vector3(
          Math.cos(theta) * speed,
          1 + Math.random() * 1.5,
          Math.sin(theta) * speed
        );
        newFragments.push({
          position: position.clone().add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 0.3,
              (Math.random() - 0.5) * 0.3,
              (Math.random() - 0.5) * 0.3
            )
          ),
          velocity,
          rotation: new THREE.Euler(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          ),
          rotationSpeed: new THREE.Euler(
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8
          ),
          life: 2,
          maxLife: 2,
          size: 0.08 + Math.random() * 0.1,
          color,
        });
      }
      fragmentsRef.current = [...fragmentsRef.current, ...newFragments];
    },
    []
  );

  const createPulseRing = useCallback(
    (position: THREE.Vector3, color: string, maxScale: number = 2) => {
      pulseRingsRef.current.push({
        position: position.clone(),
        scale: 0.1,
        maxScale,
        life: 1.2,
        maxLife: 1.2,
        color,
      });
    },
    []
  );

  const createInsertionFlashes = useCallback(
    (startPosition: THREE.Vector3, bases: BaseType[], startIndex: number) => {
      const flashes: InsertionFlash[] = bases.map((base, i) => ({
        position: startPosition.clone().add(new THREE.Vector3(0, i * 0.15, 0)),
        life: -i * 0.15,
        maxLife: 1.2,
        baseType: base,
        index: startIndex + i,
      }));
      insertionFlashesRef.current = [
        ...insertionFlashesRef.current,
        ...flashes,
      ];
    },
    []
  );

  useEffect(() => {
    if (!activeMutation) return;

    const mutationId = `${activeMutation.position}-${activeMutation.intensity}-${Date.now()}`;
    if (prevMutationIdRef.current === mutationId) return;
    prevMutationIdRef.current = mutationId;

    const position = getBasePosition(activeMutation.position);
    const basePair = basePairs[activeMutation.position];
    const baseColor = basePair ? BASE_COLORS[basePair.base1] : '#ffffff';

    createPulseRing(position, baseColor, 2.5);
    createPulseRing(
      position,
      '#ffffff',
      3
    );

    if (mutationType === 'point') {
      createExplosionParticles(position, baseColor, 25);
      createFragments(position, baseColor, 8);
    } else if (mutationType === 'deletion') {
      const [start, end] = activeMutation.affectedRange;
      const count = Math.min(end - start + 1, 10);
      for (let i = 0; i < count; i++) {
        const idx = start + Math.floor((i / count) * (end - start));
        const pos = getBasePosition(idx);
        const bp = basePairs[idx];
        const color = bp ? BASE_COLORS[bp.base1] : baseColor;
        createExplosionParticles(pos, color, 8);
        createFragments(pos, color, 4);
      }
    } else if (mutationType === 'insertion') {
      const bases: BaseType[] = ['A', 'T', 'G', 'C'].map((b) => b as BaseType);
      const randomBases = Array.from(
        { length: Math.min(3, Math.floor(activeMutation.intensity * 5)) },
        () => bases[Math.floor(Math.random() * 4)]
      );
      createInsertionFlashes(position, randomBases, activeMutation.position);
    }

    if (!markerPointsRef.current.find(
      (m) =>
        Math.abs(m.position.x - position.x) < 0.01 &&
        Math.abs(m.position.y - position.y) < 0.01
    )) {
      markerPointsRef.current.push({
        position: position.clone(),
        baseType: basePair?.base1 || 'A',
      });
    }
  }, [
    activeMutation,
    basePairs,
    mutationType,
    getBasePosition,
    createExplosionParticles,
    createFragments,
    createPulseRing,
    createInsertionFlashes,
  ]);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    for (let i = explosionParticlesRef.current.length - 1; i >= 0; i--) {
      const p = explosionParticlesRef.current[i];
      p.life -= delta;
      if (p.life <= 0) {
        explosionParticlesRef.current.splice(i, 1);
        continue;
      }
      p.velocity.y -= 0.8 * delta;
      p.position.add(p.velocity.clone().multiplyScalar(delta));
      p.velocity.multiplyScalar(0.98);
    }

    for (let i = fragmentsRef.current.length - 1; i >= 0; i--) {
      const f = fragmentsRef.current[i];
      f.life -= delta;
      if (f.life <= 0) {
        fragmentsRef.current.splice(i, 1);
        continue;
      }
      f.velocity.y -= 0.5 * delta;
      f.position.add(f.velocity.clone().multiplyScalar(delta));
      f.rotation.x += f.rotationSpeed.x * delta;
      f.rotation.y += f.rotationSpeed.y * delta;
      f.rotation.z += f.rotationSpeed.z * delta;
    }

    for (let i = pulseRingsRef.current.length - 1; i >= 0; i--) {
      const r = pulseRingsRef.current[i];
      r.life -= delta;
      if (r.life <= 0) {
        pulseRingsRef.current.splice(i, 1);
        continue;
      }
      const progress = 1 - r.life / r.maxLife;
      r.scale = 0.1 + progress * r.maxScale;
    }

    for (let i = insertionFlashesRef.current.length - 1; i >= 0; i--) {
      const flash = insertionFlashesRef.current[i];
      flash.life += delta;
      if (flash.life >= flash.maxLife) {
        insertionFlashesRef.current.splice(i, 1);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {pulseRingsRef.current.map((ring, i) => {
        const opacity = (ring.life / ring.maxLife) * 0.6;
        return (
          <mesh
            key={`pulse-${i}`}
            position={ring.position}
            scale={[ring.scale, ring.scale, 1]}
          >
            <ringGeometry args={[0.8, 1, 64]} />
            <meshBasicMaterial
              color={ring.color}
              transparent
              opacity={opacity}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      {explosionParticlesRef.current.map((p, i) => {
        const opacity = p.life / p.maxLife;
        return (
          <mesh
            key={`particle-${i}`}
            position={p.position}
            scale={[p.size, p.size, p.size]}
          >
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial
              color={p.color}
              transparent
              opacity={opacity}
            />
          </mesh>
        );
      })}

      {fragmentsRef.current.map((f, i) => {
        const opacity = f.life / f.maxLife;
        return (
          <mesh
            key={`fragment-${i}`}
            position={f.position}
            rotation={[f.rotation.x, f.rotation.y, f.rotation.z]}
            scale={[f.size, f.size * 0.3, f.size * 0.5]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={f.color}
              transparent
              opacity={opacity}
              emissive={f.color}
              emissiveIntensity={0.3}
            />
          </mesh>
        );
      })}

      {insertionFlashesRef.current.map((flash, i) => {
        const t = Math.max(0, flash.life) / flash.maxLife;
        const scale = Math.sin(t * Math.PI) * 1.5 + 0.5;
        const opacity = t < 0.1 ? t * 10 : t > 0.8 ? (1 - t) * 5 : 1;
        const color = BASE_COLORS[flash.baseType];
        return (
          <group key={`insert-${i}`} position={flash.position}>
            <mesh scale={[scale * 0.3, scale * 0.3, scale * 0.3]}>
              <octahedronGeometry args={[1, 0]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={opacity * 0.9}
              />
            </mesh>
            <mesh scale={[scale * 0.6, scale * 0.6, 0.01]}>
              <ringGeometry args={[0.8, 1, 32]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={opacity * 0.5}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}

      {markerPointsRef.current.map((marker, i) => {
        const color = BASE_COLORS[marker.baseType];
        return (
          <mesh key={`marker-${i}`} position={marker.position}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

export default MutationVisualizer;
