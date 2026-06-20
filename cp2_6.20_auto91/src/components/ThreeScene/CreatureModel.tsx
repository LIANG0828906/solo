import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { EvolutionStage, CreatureType } from '../../types';
import { EGG_CONFIGS } from '../../utils/constants';

interface CreatureModelProps {
  creatureType: CreatureType;
  stage: EvolutionStage;
  evolutionAnimation: {
    rotation: number;
    scale: number;
  };
}

interface StageColors {
  primary: string;
  secondary: string;
  emissive: number;
  metalness: number;
  roughness: number;
}

const STAGE_COLORS: Record<string, Record<string, StageColors>> = {
  phoenix: {
    baby: { primary: '#ffaa80', secondary: '#ffcc66', emissive: 0.1, metalness: 0.1, roughness: 0.7 },
    adult: { primary: '#ff4500', secondary: '#ff6347', emissive: 0.3, metalness: 0.3, roughness: 0.4 },
    evolved: { primary: '#ff2200', secondary: '#ff0000', emissive: 0.6, metalness: 0.6, roughness: 0.2 },
  },
  dragon: {
    baby: { primary: '#87ceeb', secondary: '#b0e0e6', emissive: 0.1, metalness: 0.15, roughness: 0.6 },
    adult: { primary: '#1e90ff', secondary: '#00bfff', emissive: 0.3, metalness: 0.35, roughness: 0.35 },
    evolved: { primary: '#0055dd', secondary: '#00ffff', emissive: 0.6, metalness: 0.7, roughness: 0.15 },
  },
  wolf: {
    baby: { primary: '#c9a0dc', secondary: '#dda0dd', emissive: 0.1, metalness: 0.1, roughness: 0.65 },
    adult: { primary: '#9932cc', secondary: '#ba55d3', emissive: 0.3, metalness: 0.25, roughness: 0.45 },
    evolved: { primary: '#7b2fbe', secondary: '#9400d3', emissive: 0.6, metalness: 0.55, roughness: 0.2 },
  },
  tortoise: {
    baby: { primary: '#7ec87e', secondary: '#90ee90', emissive: 0.1, metalness: 0.05, roughness: 0.8 },
    adult: { primary: '#228b22', secondary: '#32cd32', emissive: 0.3, metalness: 0.2, roughness: 0.55 },
    evolved: { primary: '#006400', secondary: '#00ff00', emissive: 0.6, metalness: 0.5, roughness: 0.25 },
  },
};

const getSC = (ct: CreatureType, s: EvolutionStage): StageColors =>
  (STAGE_COLORS[ct] || STAGE_COLORS.phoenix)[s] || STAGE_COLORS.phoenix.baby;

const M = ({ c, e, ei, m = 0.3, r = 0.4, sd, t, o }: {
  c: THREE.Color | string; e?: THREE.Color | string; ei: number;
  m?: number; r?: number; sd?: THREE.Side; t?: boolean; o?: number;
}) => <meshStandardMaterial color={c} emissive={e} emissiveIntensity={ei} metalness={m} roughness={r} side={sd} transparent={t} opacity={o} />;

const Eyes = ({ y, z, sp, sz, gc }: { y: number; z: number; sp: number; sz: number; gc: string }) => (
  <group position={[0, y, z]}>
    <mesh position={[-sp, 0, 0.01]}><sphereGeometry args={[sz, 16, 16]} /><M c="#ffffff" e={gc} ei={0.7} m={0.1} r={0.3} /></mesh>
    <mesh position={[sp, 0, 0.01]}><sphereGeometry args={[sz, 16, 16]} /><M c="#ffffff" e={gc} ei={0.7} m={0.1} r={0.3} /></mesh>
    <mesh position={[-sp, 0, sz * 0.8]}><sphereGeometry args={[sz * 0.4, 8, 8]} /><M c="#111111" ei={0} m={0.5} r={0.5} /></mesh>
    <mesh position={[sp, 0, sz * 0.8]}><sphereGeometry args={[sz * 0.4, 8, 8]} /><M c="#111111" ei={0} m={0.5} r={0.5} /></mesh>
  </group>
);

const useC = (hex: string) => useMemo(() => new THREE.Color(hex), [hex]);
const useMix = (a: string, b: string, t: number) => useMemo(() => new THREE.Color(a).lerp(new THREE.Color(b), t), [a, b, t]);

interface PhoenixWingProps {
  side: 'left' | 'right';
  stage: EvolutionStage;
  sc: THREE.Color;
  cl: StageColors;
  mx: (t: number) => THREE.Color;
}

const PhoenixWing = ({ side, stage, sc, cl, mx }: PhoenixWingProps) => {
  const sideSign = side === 'left' ? 1 : -1;
  const wingScale = stage === 'evolved' ? 1.2 : stage === 'adult' ? 1.0 : 0.7;
  const layerCount = stage === 'evolved' ? 3 : stage === 'adult' ? 2 : 1;

  const wingBones = useMemo(() => {
    const bones: { curve: THREE.CatmullRomCurve3; radius: number; emissiveMult: number; colorMix: number }[] = [];
    for (let layer = 0; layer < layerCount; layer++) {
      const layerOffset = layer * 0.12;
      const layerScale = 1 - layer * 0.22;
      const points: THREE.Vector3[] = [];
      const segs = 10;
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const x = sideSign * (0.08 + t * 0.62 * wingScale * layerScale);
        const y = Math.sin(t * Math.PI) * 0.16 * layerScale - layerOffset;
        const z = -t * 0.28 * wingScale * layerScale;
        points.push(new THREE.Vector3(x, y, z));
      }
      bones.push({
        curve: new THREE.CatmullRomCurve3(points),
        radius: 0.032 * layerScale,
        emissiveMult: 0.62 - layer * 0.16,
        colorMix: layer * 0.32,
      });
    }
    return bones;
  }, [sideSign, layerCount, wingScale]);

  const featherBlades = useMemo(() => {
    const blades: {
      position: [number, number, number];
      rotation: [number, number, number];
      size: [number, number, number];
      colorMix: number;
      emissiveMult: number;
    }[] = [];
    for (let layer = 0; layer < layerCount; layer++) {
      const layerScale = 1 - layer * 0.22;
      const layerOffset = layer * 0.12;
      const featherCount = stage === 'evolved' ? 13 : stage === 'adult' ? 10 : 6;
      for (let i = 0; i < featherCount; i++) {
        const t = (i + 1) / (featherCount + 1);
        const bx = sideSign * (0.08 + t * 0.62 * wingScale * layerScale);
        const by = Math.sin(t * Math.PI) * 0.16 * layerScale - layerOffset;
        const bz = -t * 0.28 * wingScale * layerScale;
        const bw = (0.09 + (1 - t) * 0.11) * layerScale;
        const bh = 0.01;
        const bl = (0.17 + (1 - t) * 0.09) * layerScale;
        blades.push({
          position: [bx, by, bz],
          rotation: [0.22 + (1 - t) * 0.28, sideSign * (0.08 + (1 - t) * 0.22), sideSign * (0.48 + (1 - t) * 0.12)],
          size: [bl, bh, bw],
          colorMix: layer * 0.32 + (1 - t) * 0.22,
          emissiveMult: 0.52 - layer * 0.12 - (1 - t) * 0.12,
        });
      }
    }
    return blades;
  }, [sideSign, layerCount, wingScale, stage]);

  return (
    <group>
      {wingBones.map((b, i) => (
        <mesh key={`pb-${i}`}>
          <tubeGeometry args={[b.curve, 32, b.radius, 8, false]} />
          <M c={mx(b.colorMix)} e={sc} ei={cl.emissive * b.emissiveMult} m={cl.metalness} r={cl.roughness} />
        </mesh>
      ))}
      {featherBlades.map((fb, i) => (
        <mesh key={`pf-${i}`} position={fb.position} rotation={fb.rotation}>
          <boxGeometry args={fb.size} />
          <M c={mx(fb.colorMix)} e={sc} ei={cl.emissive * fb.emissiveMult} m={cl.metalness} r={cl.roughness} sd={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

interface DragonWingProps {
  side: 'left' | 'right';
  stage: EvolutionStage;
  pc: THREE.Color;
  sc: THREE.Color;
  cr: THREE.Color;
  cl: StageColors;
  mx: (t: number) => THREE.Color;
}

const DragonWing = ({ side, stage, pc, sc, cr, cl, mx }: DragonWingProps) => {
  const sideSign = side === 'left' ? 1 : -1;
  const wingScale = stage === 'evolved' ? 1.28 : stage === 'adult' ? 1.0 : 0.7;

  const wingBones = useMemo(() => {
    const bones: { curve: THREE.CatmullRomCurve3; radius: number; color: THREE.Color | string; emissiveMult: number }[] = [];

    const leadingPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = sideSign * (0.08 + t * 0.72 * wingScale);
      const y = Math.sin(t * Math.PI * 0.85) * 0.22 * wingScale;
      const z = -t * 0.16 * wingScale;
      leadingPoints.push(new THREE.Vector3(x, y, z));
    }
    bones.push({ curve: new THREE.CatmullRomCurve3(leadingPoints), radius: 0.03, color: cr, emissiveMult: 0.32 });

    const fingerCount = stage === 'evolved' ? 5 : 4;
    for (let f = 0; f < fingerCount; f++) {
      const ft = 0.28 + f * 0.16;
      const fingerPoints: THREE.Vector3[] = [];
      const sx = sideSign * (0.08 + ft * 0.72 * wingScale);
      const sy = Math.sin(ft * Math.PI * 0.85) * 0.22 * wingScale;
      const sz = -ft * 0.16 * wingScale;
      for (let i = 0; i <= 7; i++) {
        const t = i / 7;
        const sa = (f - (fingerCount - 1) / 2) * 0.38;
        const x = sx + sideSign * t * 0.28 * wingScale * Math.cos(sa);
        const y = sy + t * (0.17 + f * 0.03) * wingScale;
        const z = sz - t * 0.22 * wingScale * Math.sin(sa);
        fingerPoints.push(new THREE.Vector3(x, y, z));
      }
      bones.push({ curve: new THREE.CatmullRomCurve3(fingerPoints), radius: 0.018, color: cr, emissiveMult: 0.26 });
    }

    const trailingPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = sideSign * (0.08 + (0.72 + 0.22 * Math.sin(t * Math.PI)) * wingScale * t);
      const y = -0.06 + Math.sin(t * Math.PI) * 0.14 * wingScale;
      const z = -0.1 - t * 0.38 * wingScale;
      trailingPoints.push(new THREE.Vector3(x, y, z));
    }
    bones.push({ curve: new THREE.CatmullRomCurve3(trailingPoints), radius: 0.022, color: mx(0.3), emissiveMult: 0.2 });

    return bones;
  }, [sideSign, wingScale, stage, cr, mx]);

  const membraneShapes = useMemo(() => {
    const results: { shape: THREE.Shape; position: [number, number, number]; rotation: [number, number, number] }[] = [];
    const ms = wingScale;
    const shape = new THREE.Shape();

    shape.moveTo(0, 0);
    for (let i = 1; i <= 12; i++) {
      const t = i / 12;
      const x = 0.08 + t * 0.72 * ms;
      const y = Math.sin(t * Math.PI * 0.85) * 0.22 * ms;
      shape.lineTo(x, y);
    }
    for (let i = 12; i >= 0; i--) {
      const t = i / 12;
      const x = 0.08 + (0.72 + 0.22 * Math.sin(t * Math.PI)) * ms * (1 - t * 0.28);
      const y = -0.06 + Math.sin(t * Math.PI) * 0.14 * ms - t * 0.1;
      shape.lineTo(x, y);
    }
    shape.closePath();

    results.push({
      shape,
      position: [0, 0, 0],
      rotation: [0.16, sideSign * 0.1, sideSign * 0.56],
    });

    if (stage === 'evolved') {
      const inner = new THREE.Shape();
      const ims = ms * 0.62;
      inner.moveTo(0, 0);
      for (let i = 1; i <= 8; i++) {
        const t = i / 8;
        const x = 0.06 + t * 0.45 * ims;
        const y = Math.sin(t * Math.PI * 0.7) * 0.12 * ims;
        inner.lineTo(x, y);
      }
      for (let i = 8; i >= 0; i--) {
        const t = i / 8;
        const x = 0.06 + 0.45 * ims * (1 - t * 0.18);
        const y = -0.04 + Math.sin(t * Math.PI) * 0.08 * ims - t * 0.06;
        inner.lineTo(x, y);
      }
      inner.closePath();
      results.push({
        shape: inner,
        position: [0, -0.04, 0.08],
        rotation: [0.1, sideSign * 0.16, sideSign * 0.42],
      });
    }

    return results;
  }, [wingScale, sideSign, stage]);

  return (
    <group position={[0, stage === 'evolved' ? 0.06 : 0, 0]}>
      {membraneShapes.map((m, i) => (
        <mesh key={`dm-${i}`} position={m.position} rotation={m.rotation}>
          <extrudeGeometry args={[m.shape, { depth: 0.005, bevelEnabled: false }]} />
          <M c={pc} e={sc} ei={cl.emissive * 0.12} m={cl.metalness * 0.8} r={cl.roughness} sd={THREE.DoubleSide} t o={0.85} />
        </mesh>
      ))}
      {wingBones.map((b, i) => (
        <mesh key={`db-${i}`}>
          <tubeGeometry args={[b.curve, 24, b.radius, 8, false]} />
          <M c={b.color} e={sc} ei={cl.emissive * b.emissiveMult} m={0.5} r={0.3} />
        </mesh>
      ))}
    </group>
  );
};

const PhoenixModel = ({ stage, cl }: { stage: EvolutionStage; cl: StageColors }) => {
  const pc = useC(cl.primary), sc = useC(cl.secondary);
  const mx = (t: number) => useMix(cl.primary, cl.secondary, t);

  if (stage === 'baby') return (
    <group>
      <mesh position={[0, 0.25, 0]}><sphereGeometry args={[0.28, 24, 24]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.55, 0.05]}><sphereGeometry args={[0.18, 24, 24]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <Eyes y={0.58} z={0.16} sp={0.07} sz={0.045} gc="#ffcc00" />
      <mesh position={[0, 0.52, 0.2]}><coneGeometry args={[0.015, 0.06, 6]} /><M c={mx(0.3)} e={sc} ei={0.2} m={0.1} r={0.6} /></mesh>
      <mesh position={[-0.02, 0.62, 0.1]} rotation={[0, 0, 0.25]}><coneGeometry args={[0.025, 0.06, 5]} /><M c={cl.secondary} e={sc} ei={0.15} m={0.1} r={0.6} /></mesh>
      <mesh position={[0.02, 0.62, 0.1]} rotation={[0, 0, -0.25]}><coneGeometry args={[0.025, 0.06, 5]} /><M c={cl.secondary} e={sc} ei={0.15} m={0.1} r={0.6} /></mesh>
      <mesh rotation={[0.15, 0, 0.4]} position={[-0.35, 0.3, 0]}><boxGeometry args={[0.28, 0.04, 0.14]} /><M c={pc} e={sc} ei={cl.emissive * 0.5} m={cl.metalness} r={cl.roughness} sd={THREE.DoubleSide} /></mesh>
      <mesh rotation={[0.15, 0, -0.4]} position={[0.35, 0.3, 0]}><boxGeometry args={[0.28, 0.04, 0.14]} /><M c={pc} e={sc} ei={cl.emissive * 0.5} m={cl.metalness} r={cl.roughness} sd={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.12, -0.25]} rotation={[0.4, 0, 0]}><coneGeometry args={[0.06, 0.18, 8]} /><M c={cl.secondary} e={sc} ei={0.15} m={0.1} r={0.5} /></mesh>
      <mesh position={[0, 0.02, 0]}><sphereGeometry args={[0.055, 10, 10]} /><M c={pc} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
    </group>
  );

  if (stage === 'adult') return (
    <group>
      <mesh position={[0, 0.35, 0]}><capsuleGeometry args={[0.22, 0.35, 8, 16]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.75, 0.05]}><sphereGeometry args={[0.2, 24, 24]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <Eyes y={0.77} z={0.2} sp={0.065} sz={0.04} gc="#ffcc00" />
      <mesh position={[0, 0.73, 0.23]}><coneGeometry args={[0.012, 0.07, 6]} /><M c={mx(0.3)} e={sc} ei={0.3} m={0.1} r={0.6} /></mesh>
      <mesh position={[-0.04, 0.9, 0]} rotation={[0.1, 0, 0.25]}><coneGeometry args={[0.04, 0.15, 6]} /><M c={cl.secondary} e={sc} ei={0.4} m={0.2} r={0.5} /></mesh>
      <mesh position={[0.04, 0.9, 0]} rotation={[0.1, 0, -0.25]}><coneGeometry args={[0.04, 0.15, 6]} /><M c={cl.secondary} e={sc} ei={0.4} m={0.2} r={0.5} /></mesh>
      <mesh position={[0, 0.92, -0.02]} rotation={[0.15, 0, 0]}><coneGeometry args={[0.03, 0.12, 5]} /><M c={cl.secondary} e={sc} ei={0.35} m={0.2} r={0.5} /></mesh>
      <group position={[0, 0.4, 0]}>
        <PhoenixWing side="left" stage={stage} sc={sc} cl={cl} mx={mx} />
        <PhoenixWing side="right" stage={stage} sc={sc} cl={cl} mx={mx} />
      </group>
      <mesh position={[0, 0.15, -0.45]} rotation={[0.35, 0, 0]}><coneGeometry args={[0.07, 0.45, 8]} /><M c={cl.secondary} e={sc} ei={0.35} m={0.2} r={0.5} /></mesh>
      <mesh position={[0, 0.22, -0.7]} rotation={[0.25, 0, 0]}><coneGeometry args={[0.05, 0.25, 8]} /><M c={mx(0.6)} e={sc} ei={0.4} m={0.2} r={0.5} /></mesh>
      <mesh position={[0, 0.08, 0]}><sphereGeometry args={[0.07, 12, 12]} /><M c={pc} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
    </group>
  );

  return (
    <group>
      <mesh position={[0, 0.4, 0]}><capsuleGeometry args={[0.25, 0.4, 8, 16]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.4, -0.1]}><sphereGeometry args={[0.18, 16, 16]} /><M c={mx(0.4)} e={sc} ei={cl.emissive * 0.8} m={0.5} r={0.25} /></mesh>
      <mesh position={[0, 0.85, 0.05]}><sphereGeometry args={[0.22, 24, 24]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <Eyes y={0.87} z={0.22} sp={0.07} sz={0.045} gc="#ff8800" />
      <mesh position={[0, 0.83, 0.25]}><coneGeometry args={[0.015, 0.08, 6]} /><M c={mx(0.3)} e={sc} ei={0.5} m={0.1} r={0.5} /></mesh>
      <mesh position={[-0.06, 1.05, 0]} rotation={[0.05, 0, 0.2]}><coneGeometry args={[0.04, 0.2, 6]} /><M c="#ffd700" e={sc} ei={0.7} m={0.8} r={0.2} /></mesh>
      <mesh position={[0.06, 1.05, 0]} rotation={[0.05, 0, -0.2]}><coneGeometry args={[0.04, 0.2, 6]} /><M c="#ffd700" e={sc} ei={0.7} m={0.8} r={0.2} /></mesh>
      <mesh position={[0, 1.1, -0.02]} rotation={[0.1, 0, 0]}><coneGeometry args={[0.035, 0.18, 5]} /><M c="#ffd700" e={sc} ei={0.7} m={0.8} r={0.2} /></mesh>
      <mesh position={[-0.1, 1.08, -0.03]} rotation={[0.15, 0.2, 0.35]}><coneGeometry args={[0.03, 0.14, 5]} /><M c="#ffd700" e={sc} ei={0.6} m={0.7} r={0.25} /></mesh>
      <mesh position={[0.1, 1.08, -0.03]} rotation={[0.15, -0.2, -0.35]}><coneGeometry args={[0.03, 0.14, 5]} /><M c="#ffd700" e={sc} ei={0.6} m={0.7} r={0.25} /></mesh>
      <group position={[0, 0.45, 0]}>
        <PhoenixWing side="left" stage={stage} sc={sc} cl={cl} mx={mx} />
        <PhoenixWing side="right" stage={stage} sc={sc} cl={cl} mx={mx} />
      </group>
      <mesh position={[0, 0.18, -0.5]} rotation={[0.3, 0, 0]}><coneGeometry args={[0.08, 0.6, 8]} /><M c={cl.secondary} e={sc} ei={0.5} m={0.3} r={0.4} /></mesh>
      <mesh position={[0, 0.28, -0.85]} rotation={[0.2, 0, 0]}><coneGeometry args={[0.06, 0.4, 8]} /><M c={mx(0.5)} e={sc} ei={0.55} m={0.3} r={0.4} /></mesh>
      <mesh position={[0, 0.35, -1.1]} rotation={[0.15, 0, 0]}><coneGeometry args={[0.04, 0.3, 8]} /><M c={mx(0.7)} e={sc} ei={0.6} m={0.3} r={0.4} /></mesh>
      {[[-0.03, 0.12, -1.2], [0.03, 0.15, -1.18], [0, 0.1, -1.25]].map(([x, y, z], i) => (
        <mesh key={i} position={[x!, y!, z!]} rotation={[0.3 + i * 0.1, i * 0.5, i * 0.3]}><sphereGeometry args={[0.035, 8, 8]} /><M c="#ff6600" e="#ff3300" ei={1.2} m={0.4} r={0.3} t o={0.8} /></mesh>
      ))}
      <mesh position={[0, 0.1, 0]}><sphereGeometry args={[0.08, 12, 12]} /><M c={pc} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
    </group>
  );
};

const DragonModel = ({ stage, cl }: { stage: EvolutionStage; cl: StageColors }) => {
  const pc = useC(cl.primary), sc = useC(cl.secondary), cr = useC('#e0f0ff');
  const mx = (t: number) => useMix(cl.primary, cl.secondary, t);

  if (stage === 'baby') return (
    <group>
      <mesh position={[0, 0.25, 0]}><sphereGeometry args={[0.3, 24, 24]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.55, 0.1]}><sphereGeometry args={[0.2, 24, 24]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <Eyes y={0.57} z={0.26} sp={0.06} sz={0.04} gc="#87ceeb" />
      <mesh position={[-0.06, 0.7, 0.12]} rotation={[0.1, 0, 0.2]}><coneGeometry args={[0.03, 0.12, 6]} /><M c={cl.secondary} e={sc} ei={0.2} m={0.15} r={0.5} /></mesh>
      <mesh position={[0.06, 0.7, 0.12]} rotation={[0.1, 0, -0.2]}><coneGeometry args={[0.03, 0.12, 6]} /><M c={cl.secondary} e={sc} ei={0.2} m={0.15} r={0.5} /></mesh>
      <mesh rotation={[0.1, 0, 0.35]} position={[-0.38, 0.32, -0.05]}><boxGeometry args={[0.35, 0.03, 0.2]} /><M c={pc} e={sc} ei={cl.emissive * 0.5} m={cl.metalness} r={cl.roughness} sd={THREE.DoubleSide} /></mesh>
      <mesh rotation={[0.1, 0, -0.35]} position={[0.38, 0.32, -0.05]}><boxGeometry args={[0.35, 0.03, 0.2]} /><M c={pc} e={sc} ei={cl.emissive * 0.5} m={cl.metalness} r={cl.roughness} sd={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.15, -0.3]} rotation={[0.35, 0, 0]}><coneGeometry args={[0.06, 0.2, 8]} /><M c={cl.secondary} e={sc} ei={0.15} m={0.1} r={0.5} /></mesh>
      <mesh position={[0, 0.02, 0]}><sphereGeometry args={[0.055, 10, 10]} /><M c={pc} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
    </group>
  );

  if (stage === 'adult') return (
    <group>
      <mesh position={[0, 0.35, 0]}><capsuleGeometry args={[0.2, 0.4, 8, 16]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.3, -0.25]}><sphereGeometry args={[0.16, 16, 16]} /><M c={pc} e={sc} ei={cl.emissive * 0.8} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.28, -0.45]}><sphereGeometry args={[0.12, 16, 16]} /><M c={pc} e={sc} ei={cl.emissive * 0.6} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.82, 0.12]}><sphereGeometry args={[0.18, 24, 24]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <Eyes y={0.84} z={0.28} sp={0.065} sz={0.04} gc="#00bfff" />
      <mesh position={[-0.07, 0.98, 0.05]} rotation={[0.15, 0, 0.2]}><coneGeometry args={[0.04, 0.2, 6]} /><M c={cl.secondary} e={sc} ei={0.4} m={0.3} r={0.4} /></mesh>
      <mesh position={[0.07, 0.98, 0.05]} rotation={[0.15, 0, -0.2]}><coneGeometry args={[0.04, 0.2, 6]} /><M c={cl.secondary} e={sc} ei={0.4} m={0.3} r={0.4} /></mesh>
      <mesh position={[0, 1.0, -0.02]} rotation={[0.1, 0, 0]}><coneGeometry args={[0.03, 0.12, 5]} /><M c={cl.secondary} e={sc} ei={0.35} m={0.3} r={0.4} /></mesh>
      <group position={[0, 0.42, 0]}>
        <DragonWing side="left" stage={stage} pc={pc} sc={sc} cr={cr} cl={cl} mx={mx} />
        <DragonWing side="right" stage={stage} pc={pc} sc={sc} cr={cr} cl={cl} mx={mx} />
      </group>
      <mesh position={[0, 0.22, -0.55]} rotation={[0.3, 0, 0]}><coneGeometry args={[0.06, 0.5, 8]} /><M c={cl.secondary} e={sc} ei={0.3} m={0.3} r={0.4} /></mesh>
      {[[-0.04, 0.2, -0.8], [0.04, 0.22, -0.82], [0, 0.18, -0.85]].map(([x, y, z], i) => (
        <mesh key={i} position={[x!, y!, z!]} rotation={[0.3, i * 0.8, i * 0.4]}><coneGeometry args={[0.02, 0.08, 5]} /><M c={cl.secondary} e={sc} ei={0.4} m={0.3} r={0.4} /></mesh>
      ))}
      <mesh position={[0, 0.08, 0]}><sphereGeometry args={[0.07, 12, 12]} /><M c={pc} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
    </group>
  );

  return (
    <group>
      <mesh position={[0, 0.38, 0]}><capsuleGeometry args={[0.22, 0.45, 8, 16]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.33, -0.3]}><sphereGeometry args={[0.18, 16, 16]} /><M c={pc} e={sc} ei={cl.emissive * 0.8} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.3, -0.55]}><sphereGeometry args={[0.14, 16, 16]} /><M c={pc} e={sc} ei={cl.emissive * 0.6} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.28, -0.75]}><sphereGeometry args={[0.1, 16, 16]} /><M c={pc} e={sc} ei={cl.emissive * 0.4} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.88, 0.12]}><sphereGeometry args={[0.2, 24, 24]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <Eyes y={0.9} z={0.3} sp={0.07} sz={0.045} gc="#00ffff" />
      <mesh position={[-0.09, 1.12, 0.02]} rotation={[0.15, 0, 0.2]}><coneGeometry args={[0.05, 0.28, 6]} /><M c={cr} e={sc} ei={0.7} m={0.8} r={0.15} /></mesh>
      <mesh position={[0.09, 1.12, 0.02]} rotation={[0.15, 0, -0.2]}><coneGeometry args={[0.05, 0.28, 6]} /><M c={cr} e={sc} ei={0.7} m={0.8} r={0.15} /></mesh>
      <mesh position={[-0.15, 1.18, -0.03]} rotation={[0.2, 0.3, 0.4]}><coneGeometry args={[0.03, 0.18, 5]} /><M c={cr} e={sc} ei={0.6} m={0.8} r={0.15} /></mesh>
      <mesh position={[0.15, 1.18, -0.03]} rotation={[0.2, -0.3, -0.4]}><coneGeometry args={[0.03, 0.18, 5]} /><M c={cr} e={sc} ei={0.6} m={0.8} r={0.15} /></mesh>
      <mesh position={[0, 1.15, -0.03]} rotation={[0.1, 0, 0]}><coneGeometry args={[0.04, 0.2, 5]} /><M c={cr} e={sc} ei={0.65} m={0.8} r={0.15} /></mesh>
      <group position={[0, 0.48, 0]}>
        <DragonWing side="left" stage={stage} pc={pc} sc={sc} cr={cr} cl={cl} mx={mx} />
        <DragonWing side="right" stage={stage} pc={pc} sc={sc} cr={cr} cl={cl} mx={mx} />
      </group>
      <mesh position={[0, 0.25, -0.6]} rotation={[0.3, 0, 0]}><coneGeometry args={[0.07, 0.65, 8]} /><M c={cl.secondary} e={sc} ei={0.4} m={0.3} r={0.4} /></mesh>
      {[[-0.05, 0.22, -0.95], [0.05, 0.25, -1.0], [-0.03, 0.18, -1.05], [0.03, 0.2, -0.98], [0, 0.22, -1.08]].map(([x, y, z], i) => (
        <mesh key={i} position={[x!, y!, z!]} rotation={[0.3, i * 0.6, i * 0.5]}><octahedronGeometry args={[0.035, 0]} /><M c={cr} e={sc} ei={0.8} m={0.9} r={0.1} t o={0.85} /></mesh>
      ))}
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.32, 0.015, 8, 32]} /><M c={cl.secondary} e={sc} ei={0.5} m={0.4} r={0.3} t o={0.5} /></mesh>
      <mesh position={[0, 0.08, 0]}><sphereGeometry args={[0.08, 12, 12]} /><M c={pc} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
    </group>
  );
};

const WolfModel = ({ stage, cl }: { stage: EvolutionStage; cl: StageColors }) => {
  const pc = useC(cl.primary), sc = useC(cl.secondary);
  const mx = (t: number) => useMix(cl.primary, cl.secondary, t);

  if (stage === 'baby') return (
    <group>
      <mesh position={[0, 0.2, 0]}><capsuleGeometry args={[0.15, 0.3, 8, 16]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.4, 0.22]}><sphereGeometry args={[0.16, 24, 24]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <Eyes y={0.42} z={0.35} sp={0.055} sz={0.03} gc="#ffff00" />
      <mesh position={[-0.08, 0.5, 0.22]} rotation={[0, 0, 0.25]}><coneGeometry args={[0.04, 0.1, 6]} /><M c={cl.secondary} e={sc} ei={0.2} m={0.1} r={0.6} /></mesh>
      <mesh position={[0.08, 0.5, 0.22]} rotation={[0, 0, -0.25]}><coneGeometry args={[0.04, 0.1, 6]} /><M c={cl.secondary} e={sc} ei={0.2} m={0.1} r={0.6} /></mesh>
      <mesh position={[0, 0.39, 0.37]}><sphereGeometry args={[0.015, 8, 8]} /><M c={mx(0.3)} ei={0} m={0.1} r={0.6} /></mesh>
      {[[-0.12, 0, 0.12], [0.12, 0, 0.12], [-0.12, 0, -0.12], [0.12, 0, -0.12]].map(([x, y, z], i) => (
        <mesh key={i} position={[x!, y!, z!]}><cylinderGeometry args={[0.04, 0.06, 0.2, 8]} /><M c={pc} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
      ))}
      <mesh position={[0, 0.2, -0.3]} rotation={[0.2, 0, 0.15]}><cylinderGeometry args={[0.02, 0.04, 0.15, 8]} /><M c={cl.secondary} e={sc} ei={0.15} m={0.1} r={0.6} /></mesh>
    </group>
  );

  if (stage === 'adult') return (
    <group>
      <mesh position={[0, 0.3, 0]}><capsuleGeometry args={[0.17, 0.4, 8, 16]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.55, 0.28]}><sphereGeometry args={[0.18, 24, 24]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.55, 0.28]}><coneGeometry args={[0.16, 0.22, 24, 1, true]} /><M c={pc} e={sc} ei={cl.emissive * 0.8} m={cl.metalness} r={cl.roughness} /></mesh>
      <Eyes y={0.58} z={0.42} sp={0.06} sz={0.035} gc="#ffff00" />
      <mesh position={[-0.1, 0.72, 0.28]} rotation={[0.1, 0, 0.25]}><coneGeometry args={[0.05, 0.18, 6]} /><M c={cl.secondary} e={sc} ei={0.35} m={0.2} r={0.5} /></mesh>
      <mesh position={[0.1, 0.72, 0.28]} rotation={[0.1, 0, -0.25]}><coneGeometry args={[0.05, 0.18, 6]} /><M c={cl.secondary} e={sc} ei={0.35} m={0.2} r={0.5} /></mesh>
      <mesh position={[0, 0.54, 0.44]}><sphereGeometry args={[0.018, 8, 8]} /><M c={mx(0.3)} ei={0} m={0.2} r={0.5} /></mesh>
      {[[-0.14, 0.05, 0.15], [0.14, 0.05, 0.15], [-0.14, 0.05, -0.15], [0.14, 0.05, -0.15]].map(([x, y, z], i) => (
        <group key={i} position={[x!, y!, z!]}>
          <mesh><cylinderGeometry args={[0.04, 0.05, 0.3, 8]} /><M c={pc} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
          <mesh position={[0, -0.18, 0.03]}><sphereGeometry args={[0.04, 10, 10]} /><M c={mx(0.15)} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.3, -0.4]} rotation={[0.15, 0, 0.1]}><cylinderGeometry args={[0.025, 0.05, 0.35, 8]} /><M c={cl.secondary} e={sc} ei={0.3} m={0.2} r={0.5} /></mesh>
      {[[-0.03, 0.35, -0.58], [0.03, 0.37, -0.56]].map(([x, y, z], i) => (
        <mesh key={i} position={[x!, y!, z!]}><sphereGeometry args={[0.025, 8, 8]} /><M c={cl.secondary} e="#ffff00" ei={0.5} m={0.2} r={0.5} t o={0.7} /></mesh>
      ))}
    </group>
  );

  return (
    <group>
      <mesh position={[0, 0.35, 0]}><capsuleGeometry args={[0.2, 0.45, 8, 16]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.35, -0.1]}><sphereGeometry args={[0.15, 16, 16]} /><M c={mx(0.3)} e={sc} ei={cl.emissive * 0.7} m={0.4} r={0.3} /></mesh>
      <mesh position={[0, 0.65, 0.3]}><sphereGeometry args={[0.2, 24, 24]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.65, 0.3]}><coneGeometry args={[0.18, 0.25, 24, 1, true]} /><M c={pc} e={sc} ei={cl.emissive * 0.8} m={cl.metalness} r={cl.roughness} /></mesh>
      <Eyes y={0.68} z={0.47} sp={0.07} sz={0.04} gc="#9400d3" />
      <mesh position={[-0.06, 0.64, 0.46]}><coneGeometry args={[0.015, 0.06, 6]} /><M c={pc} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0.06, 0.64, 0.46]}><coneGeometry args={[0.015, 0.06, 6]} /><M c={pc} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[-0.12, 0.88, 0.3]} rotation={[0.1, 0, 0.25]}><coneGeometry args={[0.06, 0.22, 6]} /><M c={cl.secondary} e={sc} ei={0.6} m={0.4} r={0.3} /></mesh>
      <mesh position={[0.12, 0.88, 0.3]} rotation={[0.1, 0, -0.25]}><coneGeometry args={[0.06, 0.22, 6]} /><M c={cl.secondary} e={sc} ei={0.6} m={0.4} r={0.3} /></mesh>
      <mesh position={[-0.12, 0.82, 0.32]} rotation={[0, 0, 0.8]}><torusGeometry args={[0.04, 0.008, 6, 16, Math.PI]} /><M c="#ffff00" e="#ffff00" ei={1.0} m={0.3} r={0.4} /></mesh>
      <mesh position={[0.12, 0.82, 0.32]} rotation={[0, 0, -0.8]}><torusGeometry args={[0.04, 0.008, 6, 16, Math.PI]} /><M c="#ffff00" e="#ffff00" ei={1.0} m={0.3} r={0.4} /></mesh>
      {[[-0.16, 0.08, 0.18], [0.16, 0.08, 0.18], [-0.16, 0.08, -0.18], [0.16, 0.08, -0.18]].map(([x, y, z], i) => (
        <group key={i} position={[x!, y!, z!]}>
          <mesh><cylinderGeometry args={[0.05, 0.06, 0.4, 8]} /><M c={pc} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
          <mesh position={[0, -0.22, 0.04]}><sphereGeometry args={[0.05, 10, 10]} /><M c={mx(0.15)} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.35, -0.5]} rotation={[0.12, 0, 0.1]}><cylinderGeometry args={[0.03, 0.06, 0.45, 8]} /><M c={cl.secondary} e={sc} ei={0.5} m={0.3} r={0.4} /></mesh>
      <mesh position={[0, 0.42, -0.72]} rotation={[0.1, 0, 0.15]}><coneGeometry args={[0.05, 0.15, 8]} /><M c={cl.secondary} e={sc} ei={0.4} m={0.3} r={0.4} /></mesh>
      {[[-0.08, 0.48, 0.05], [0.08, 0.48, 0.05], [0, 0.5, -0.05], [-0.05, 0.46, 0.1], [0.05, 0.46, 0.1]].map(([x, y, z], i) => (
        <mesh key={i} position={[x!, y!, z!]}><sphereGeometry args={[0.03, 8, 8]} /><M c="#9400d3" e="#ffff00" ei={0.8} m={0.3} r={0.4} t o={0.6} /></mesh>
      ))}
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.28, 0.012, 6, 32]} /><M c={cl.secondary} e={sc} ei={0.6} m={0.4} r={0.3} t o={0.4} /></mesh>
    </group>
  );
};

const TortoiseModel = ({ stage, cl }: { stage: EvolutionStage; cl: StageColors }) => {
  const pc = useC(cl.primary), sc = useC(cl.secondary);
  const mx = (t: number) => useMix(cl.primary, cl.secondary, t);

  if (stage === 'baby') return (
    <group>
      <mesh position={[0, 0.12, 0]}><sphereGeometry args={[0.3, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.08, 0]}><torusGeometry args={[0.28, 0.05, 8, 24]} /><M c={mx(0.2)} ei={0} m={cl.metalness} r={cl.roughness + 0.1} /></mesh>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.28, 0.28, 0.04, 24]} /><M c={mx(0.3)} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.1, 0.3]}><sphereGeometry args={[0.12, 24, 24]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <Eyes y={0.12} z={0.39} sp={0.04} sz={0.025} gc="#32cd32" />
      {[[-0.18, -0.02, -0.15], [0.18, -0.02, -0.15], [-0.18, -0.02, 0.15], [0.18, -0.02, 0.15]].map(([x, y, z], i) => (
        <mesh key={i} position={[x!, y!, z!]}><cylinderGeometry args={[0.05, 0.06, 0.12, 8]} /><M c={pc} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
      ))}
      <mesh position={[0, 0.05, -0.28]}><sphereGeometry args={[0.06, 12, 12]} /><M c={cl.secondary} e={sc} ei={0.15} m={0.1} r={0.5} /></mesh>
    </group>
  );

  if (stage === 'adult') return (
    <group>
      <mesh position={[0, 0.18, 0]}><sphereGeometry args={[0.38, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.14, 0]}><torusGeometry args={[0.36, 0.06, 8, 32]} /><M c={mx(0.2)} ei={0} m={cl.metalness} r={cl.roughness + 0.1} /></mesh>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.36, 0.36, 0.04, 32]} /><M c={mx(0.3)} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
      {[[-0.15, 0.12, 0], [0.15, 0.12, 0], [0, 0.12, -0.15], [0, 0.12, 0.15]].map(([x, y, z], i) => (
        <mesh key={i} position={[x!, y!, z!]} rotation={[0, i * 0.5, 0]}><cylinderGeometry args={[0.08, 0.08, 0.02, 6]} /><M c={mx(0.4)} ei={0} m={cl.metalness + 0.1} r={cl.roughness - 0.1} /></mesh>
      ))}
      <mesh position={[0, 0.15, 0.38]}><sphereGeometry args={[0.14, 24, 24]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <Eyes y={0.17} z={0.49} sp={0.05} sz={0.03} gc="#32cd32" />
      <mesh position={[0, 0.12, 0.5]}><sphereGeometry args={[0.02, 8, 8]} /><M c={mx(0.4)} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
      {[[-0.22, 0, -0.2], [0.22, 0, -0.2], [-0.22, 0, 0.2], [0.22, 0, 0.2]].map(([x, y, z], i) => (
        <group key={i} position={[x!, y!, z!]}>
          <mesh><cylinderGeometry args={[0.06, 0.07, 0.2, 8]} /><M c={pc} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
          <mesh position={[0, -0.12, 0]}><sphereGeometry args={[0.05, 10, 10]} /><M c={mx(0.2)} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.08, -0.36]}><sphereGeometry args={[0.08, 12, 12]} /><M c={cl.secondary} e={sc} ei={0.2} m={0.1} r={0.5} /></mesh>
    </group>
  );

  return (
    <group>
      <mesh position={[0, 0.22, 0]}><sphereGeometry args={[0.45, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <mesh position={[0, 0.18, 0]}><torusGeometry args={[0.43, 0.07, 8, 32]} /><M c={mx(0.2)} ei={0} m={cl.metalness} r={cl.roughness + 0.1} /></mesh>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.43, 0.43, 0.04, 32]} /><M c={mx(0.3)} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
      {[[-0.2, 0.18, 0], [0.2, 0.18, 0], [0, 0.18, -0.2], [0, 0.18, 0.2], [-0.14, 0.18, -0.14], [0.14, 0.18, 0.14], [-0.14, 0.18, 0.14], [0.14, 0.18, -0.14]].map(([x, y, z], i) => (
        <mesh key={i} position={[x!, y!, z!]} rotation={[0, i * 0.4, 0]}><cylinderGeometry args={[0.06, 0.06, 0.04, 6]} /><M c={mx(0.5)} ei={0} m={cl.metalness + 0.2} r={cl.roughness - 0.15} /></mesh>
      ))}
      {[[-0.12, 0.3, 0], [0.12, 0.3, 0], [0, 0.3, -0.12], [0, 0.3, 0.12]].map(([x, y, z], i) => (
        <mesh key={i} position={[x!, y!, z!]} rotation={[0, i * 0.8, 0]}><octahedronGeometry args={[0.06, 0]} /><M c="#e0ffe0" e={sc} ei={0.8} m={0.8} r={0.15} t o={0.8} /></mesh>
      ))}
      <mesh position={[0, 0.2, 0.45]}><sphereGeometry args={[0.16, 24, 24]} /><M c={pc} e={sc} ei={cl.emissive} m={cl.metalness} r={cl.roughness} /></mesh>
      <Eyes y={0.22} z={0.58} sp={0.055} sz={0.035} gc="#00ff00" />
      <mesh position={[0, 0.18, 0.6]}><sphereGeometry args={[0.025, 8, 8]} /><M c={mx(0.4)} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
      {[[-0.26, 0, -0.24], [0.26, 0, -0.24], [-0.26, 0, 0.24], [0.26, 0, 0.24]].map(([x, y, z], i) => (
        <group key={i} position={[x!, y!, z!]}>
          <mesh><cylinderGeometry args={[0.08, 0.1, 0.35, 8]} /><M c={pc} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
          <mesh position={[0, -0.2, 0]}><sphereGeometry args={[0.06, 10, 10]} /><M c={mx(0.2)} ei={0} m={cl.metalness} r={cl.roughness} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.12, -0.42]}><sphereGeometry args={[0.1, 12, 12]} /><M c={cl.secondary} e={sc} ei={0.4} m={0.3} r={0.4} /></mesh>
      <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.38, 0.015, 8, 32]} /><M c={cl.secondary} e={sc} ei={0.5} m={0.4} r={0.3} t o={0.4} /></mesh>
    </group>
  );
};

const CreatureModel = ({ creatureType, stage, evolutionAnimation }: CreatureModelProps) => {
  const creatureRef = useRef<THREE.Group>(null);
  const config = EGG_CONFIGS[creatureType] || EGG_CONFIGS.phoenix;
  const cl = getSC(creatureType, stage);

  const getScale = () => {
    switch (stage) {
      case 'baby': return 0.5;
      case 'adult': return 0.8;
      case 'evolved': return 1.0;
      default: return 0.5;
    }
  };

  const secondaryColor = new THREE.Color(config.glowColor);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (creatureRef.current) {
      const breathe = Math.sin(time * 2) * 0.03;
      creatureRef.current.position.y = breathe;
      creatureRef.current.rotation.y = evolutionAnimation.rotation + Math.sin(time * 0.3) * 0.1;
      const baseScale = getScale() * evolutionAnimation.scale;
      creatureRef.current.scale.setScalar(baseScale + breathe * 0.3);
    }
  });

  const renderCreature = () => {
    const props = { stage, cl };
    switch (creatureType) {
      case 'phoenix': return <PhoenixModel {...props} />;
      case 'dragon': return <DragonModel {...props} />;
      case 'wolf': return <WolfModel {...props} />;
      case 'tortoise': return <TortoiseModel {...props} />;
      default: return <PhoenixModel {...props} />;
    }
  };

  return (
    <group ref={creatureRef}>
      {renderCreature()}
      <pointLight
        position={[0, 0.5, 0]}
        color={secondaryColor}
        intensity={stage === 'evolved' ? 1.0 : stage === 'adult' ? 0.7 : 0.5}
        distance={stage === 'evolved' ? 5 : 3}
      />
    </group>
  );
};

export default CreatureModel;