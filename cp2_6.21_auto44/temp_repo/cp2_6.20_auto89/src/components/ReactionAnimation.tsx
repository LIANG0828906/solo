import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  Atom,
  Bond,
  ELEMENT_INFO,
  ElementType,
  Vec3,
} from '../modules/MoleculeEngine';
import { useMoleculeStore } from '../store/useMoleculeStore';

interface ParticleData {
  position: Vec3;
  velocity: Vec3;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

const ParticleSystem: React.FC<{ progress: number }> = ({ progress }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const prevProgress = useRef(progress);
  const MAX_PARTICLES = 400;

  const particles = useRef<ParticleData[]>([]);

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(MAX_PARTICLES * 3);
    const col = new Float32Array(MAX_PARTICLES * 3);
    const siz = new Float32Array(MAX_PARTICLES);
    return { positions: pos, colors: col, sizes: siz };
  }, []);

  const spawnParticles = (isBreaking: boolean, center: Vec3, count: number) => {
    for (let i = 0; i < count; i++) {
      if (particles.current.length >= MAX_PARTICLES) break;
      const color = isBreaking ? '#ff6b6b' : '#69db7c';
      particles.current.push({
        position: { ...center },
        velocity: {
          x: (Math.random() - 0.5) * 0.12,
          y: (Math.random() - 0.5) * 0.12,
          z: (Math.random() - 0.5) * 0.12,
        },
        color,
        life: 1,
        maxLife: 1 + Math.random() * 0.8,
        size: 0.06 + Math.random() * 0.06,
      });
    }
  };

  useFrame((_, delta) => {
    const dp = Math.abs(progress - prevProgress.current);
    if (dp > 0.002) {
      const breaking = progress > 0.2 && progress < 0.5;
      const forming = progress > 0.5 && progress < 0.8;
      const center: Vec3 = { x: 0, y: 0.5, z: 0 };
      if (breaking) spawnParticles(true, center, 3);
      if (forming) spawnParticles(false, center, 3);
    }
    prevProgress.current = progress;

    particles.current = particles.current.filter((p) => {
      p.position.x += p.velocity.x;
      p.position.y += p.velocity.y;
      p.position.z += p.velocity.z;
      p.velocity.y -= 0.001;
      p.life -= delta / p.maxLife;
      return p.life > 0;
    });

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particles.current[i];
      if (p) {
        positions[i * 3] = p.position.x;
        positions[i * 3 + 1] = p.position.y;
        positions[i * 3 + 2] = p.position.z;
        const c = new THREE.Color(p.color);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
        sizes[i] = p.size * p.life;
      } else {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -1000;
        positions[i * 3 + 2] = 0;
        sizes[i] = 0;
      }
    }

    if (pointsRef.current) {
      const geom = pointsRef.current.geometry;
      (geom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (geom.attributes.color as THREE.BufferAttribute).needsUpdate = true;
      (geom.attributes.size as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

const AnimatedAtom: React.FC<{ atom: Atom; selected?: boolean }> = ({ atom, selected }) => {
  const info = ELEMENT_INFO[atom.element as ElementType];
  const color = useMemo(() => new THREE.Color(info.color), [info.color]);
  return (
    <mesh position={[atom.position.x, atom.position.y, atom.position.z]} castShadow>
      <sphereGeometry args={[info.radius, 24, 24]} />
      <meshStandardMaterial
        color={color}
        roughness={0.3}
        metalness={0.2}
        emissive={selected ? color : new THREE.Color('#000000')}
        emissiveIntensity={selected ? 0.4 : 0}
      />
    </mesh>
  );
};

const AnimatedBond: React.FC<{ bond: Bond; atomA?: Atom; atomB?: Atom }> = ({
  bond,
  atomA,
  atomB,
}) => {
  if (!atomA || !atomB) return null;

  const { position, quaternion, length, offsets } = useMemo(() => {
    const a = new THREE.Vector3(atomA.position.x, atomA.position.y, atomA.position.z);
    const b = new THREE.Vector3(atomB.position.x, atomB.position.y, atomB.position.z);
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const q = new THREE.Quaternion();
    if (len > 0.001) {
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    }
    const perp = new THREE.Vector3(1, 0, 0);
    if (len > 0.001) {
      if (Math.abs(dir.x) > 0.9) perp.set(0, 1, 0);
      perp.cross(dir).normalize();
    }
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
      const perp2 = new THREE.Vector3();
      if (len > 0.001) perp2.crossVectors(dir, perp).normalize();
      offs.push(
        { x: perp.x * gap * 0.6, y: perp.y * gap * 0.6, z: perp.z * gap * 0.6 },
        { x: -perp.x * gap * 0.3 + perp2.x * gap * 0.5, y: -perp.y * gap * 0.3 + perp2.y * gap * 0.5, z: -perp.z * gap * 0.3 + perp2.z * gap * 0.5 },
        { x: -perp.x * gap * 0.3 - perp2.x * gap * 0.5, y: -perp.y * gap * 0.3 - perp2.y * gap * 0.5, z: -perp.z * gap * 0.3 - perp2.z * gap * 0.5 }
      );
    }
    return { position: mid, quaternion: q, length: len, offsets: offs };
  }, [atomA, atomB, bond.order]);

  return (
    <group position={[position.x, position.y, position.z]} quaternion={quaternion}>
      {offsets.map((off, i) => (
        <mesh key={i} position={[off.x, off.y, off.z]}>
          <cylinderGeometry args={[0.08, 0.08, length, 12]} />
          <meshStandardMaterial
            color="#888888"
            roughness={0.5}
            metalness={0.3}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
};

export const ReactionAnimation: React.FC = () => {
  const reactionResult = useMoleculeStore((s) => s.reactionResult);
  const animationProgress = useMoleculeStore((s) => s.animationProgress);
  const reactionSimulator = useMoleculeStore((s) => s.getReactionSimulator)();
  const animationPlaying = useMoleculeStore((s) => s.animationPlaying);
  const setAnimationProgress = useMoleculeStore((s) => s.setAnimationProgress);
  const animationSpeed = useMoleculeStore((s) => s.animationSpeed);

  useFrame((_, delta) => {
    if (animationPlaying && reactionResult) {
      const next = animationProgress + delta * 0.12 * animationSpeed;
      if (next >= 1) {
        setAnimationProgress(0);
      } else {
        setAnimationProgress(next);
      }
    }
  });

  const molecule = useMemo(() => {
    if (!reactionResult) return null;
    return reactionSimulator.getFrameAtProgress(reactionResult.path, animationProgress);
  }, [reactionResult, animationProgress, reactionSimulator]);

  if (!molecule) return null;

  const atomMap = useMemo(() => {
    const map = new Map<string, Atom>();
    molecule.atoms.forEach((a) => map.set(a.id, a));
    return map;
  }, [molecule]);

  return (
    <group>
      {molecule.bonds.map((bond) => (
        <AnimatedBond
          key={bond.id}
          bond={bond}
          atomA={atomMap.get(bond.atomA)}
          atomB={atomMap.get(bond.atomB)}
        />
      ))}
      {molecule.atoms.map((atom) => (
        <AnimatedAtom key={atom.id} atom={atom} />
      ))}
      <ParticleSystem progress={animationProgress} />
    </group>
  );
};

export default ReactionAnimation;
