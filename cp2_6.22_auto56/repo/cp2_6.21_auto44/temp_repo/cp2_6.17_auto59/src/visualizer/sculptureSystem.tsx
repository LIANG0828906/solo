import { useRef, useMemo, useEffect } from 'react';
import React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudioStore } from '@/store/audioStore';

const selectBeat = (s: any) => s.beat;

const BURST_COUNT = 60;
const BURST_LIFETIME = 0.5;
const BURST_POOL_SIZE = BURST_COUNT * 4;
const SCULPTURE_COLOR = new THREE.Color('#7C4DFF');

const WARM_COLORS = [
  new THREE.Color('#FF6B6B'),
  new THREE.Color('#FF3366'),
  new THREE.Color('#FFA94D'),
  new THREE.Color('#FFD93D'),
  new THREE.Color('#9D4DFF'),
];

const COOL_COLORS = [
  new THREE.Color('#00E5FF'),
  new THREE.Color('#B388FF'),
  new THREE.Color('#7C4DFF'),
  new THREE.Color('#4D7CFF'),
  new THREE.Color('#9D4DFF'),
];

const pickBurstColor = (): THREE.Color => {
  const palette = Math.random() > 0.5 ? WARM_COLORS : COOL_COLORS;
  return palette[Math.floor(Math.random() * palette.length)].clone();
};

const createRingGeometry = (radius: number, height: number): THREE.BufferGeometry => {
  const shape = new THREE.Shape();
  const outerR = radius;
  const innerR = radius * 0.7;
  const segments = 96;
  shape.moveTo(outerR, 0);
  for (let i = 1; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    shape.lineTo(outerR * Math.cos(a), outerR * Math.sin(a));
  }
  const hole = new THREE.Path();
  hole.moveTo(innerR, 0);
  for (let i = 1; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    hole.lineTo(innerR * Math.cos(a), innerR * Math.sin(a));
  }
  shape.holes.push(hole);
  const extrudeSettings = {
    depth: height,
    bevelEnabled: false,
    curveSegments: segments,
    steps: 1,
  };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.translate(0, 0, -height / 2);
  geo.rotateX(Math.PI / 2);
  return geo;
};

const RING_CONFIGS = [
  { radius: 2.5, speed: THREE.MathUtils.degToRad(30), y: 0.4 },
  { radius: 1.8, speed: THREE.MathUtils.degToRad(45), y: 0 },
  { radius: 1.0, speed: THREE.MathUtils.degToRad(60), y: -0.4 },
];

interface BurstParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
  active: boolean;
}

export const useSculptureAnimation = () => {
  const beat = useAudioStore(selectBeat);

  const groupRef = useRef<THREE.Group>(null);
  const ringRefs = useRef<THREE.Mesh[]>([]);
  const scaleTargetRef = useRef(1);
  const scaleCurrentRef = useRef(1);
  const scaleAnimStartRef = useRef(0);
  const scaleAnimDurationRef = useRef(0.1);
  const lastBeatRef = useRef(0);
  const burstParticlesRef = useRef<BurstParticle[]>([]);
  const burstGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  const burstPositionsRef = useRef<Float32Array | null>(null);
  const burstColorsRef = useRef<Float32Array | null>(null);
  const burstVisibleRef = useRef<boolean[]>([]);

  const ringGeometries = useMemo(
    () => RING_CONFIGS.map((c) => createRingGeometry(c.radius, 0.3)),
    [],
  );

  const { burstGeometry, burstMaterial } = useMemo(() => {
    const positions = new Float32Array(BURST_POOL_SIZE * 3);
    const colors = new Float32Array(BURST_POOL_SIZE * 3);
    const geo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(positions, 3);
    const colAttr = new THREE.BufferAttribute(colors, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    colAttr.setUsage(THREE.DynamicDrawUsage);
    posAttr.needsUpdate = false;
    colAttr.needsUpdate = false;
    geo.setAttribute('position', posAttr);
    geo.setAttribute('color', colAttr);
    const mat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 1,
      sizeAttenuation: true,
    });
    burstGeometryRef.current = geo;
    burstPositionsRef.current = positions;
    burstColorsRef.current = colors;
    for (let i = 0; i < BURST_POOL_SIZE; i++) {
      burstParticlesRef.current.push({
        position: new THREE.Vector3(0, -1000, 0),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: BURST_LIFETIME,
        color: new THREE.Color(),
        active: false,
      });
      burstVisibleRef.current.push(false);
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -1000;
      positions[i * 3 + 2] = 0;
    }
    return { burstGeometry: geo, burstMaterial: mat };
  }, []);

  useEffect(() => {
    return () => {
      ringGeometries.forEach((g) => g.dispose());
      burstGeometry.dispose();
      burstMaterial.dispose();
    };
  }, [ringGeometries, burstGeometry, burstMaterial]);

  const triggerBurst = () => {
    const particles = burstParticlesRef.current;
    let triggered = 0;
    for (let i = 0; i < particles.length && triggered < BURST_COUNT; i++) {
      if (!particles[i].active) {
        triggered++;
        const p = particles[i];
        const angle = Math.random() * Math.PI * 2;
        const yJitter = (Math.random() - 0.5) * 0.6;
        const speed = 1.5 + Math.random() * 1.5;
        p.position.set(Math.cos(angle) * 0.5, yJitter, Math.sin(angle) * 0.5);
        p.velocity.set(
          Math.cos(angle) * speed,
          (Math.random() - 0.5) * 1.2,
          Math.sin(angle) * speed,
        );
        p.color.copy(pickBurstColor());
        p.life = BURST_LIFETIME;
        p.maxLife = BURST_LIFETIME;
        p.active = true;
        burstVisibleRef.current[i] = true;
      }
    }
  };

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const effectiveDelta = Math.min(delta, 0.05);
    const elapsed = state.clock.elapsedTime;

    RING_CONFIGS.forEach((cfg, idx) => {
      const ring = ringRefs.current[idx];
      if (ring) ring.rotation.y = cfg.speed * elapsed;
    });

    if (beat > 0.6 && lastBeatRef.current <= 0.6) {
      scaleTargetRef.current = 1.3;
      scaleAnimStartRef.current = elapsed;
      scaleAnimDurationRef.current = 0.1;
      triggerBurst();
    }
    lastBeatRef.current = beat;

    const tScale = Math.min(1, (elapsed - scaleAnimStartRef.current) / scaleAnimDurationRef.current);
    const eased = 1 - Math.pow(1 - tScale, 3);
    const target = scaleTargetRef.current;
    const baseScale = 1;
    if (target > baseScale) {
      scaleCurrentRef.current = baseScale + (target - baseScale) * eased;
      if (tScale >= 1) {
        scaleTargetRef.current = 1;
        scaleAnimStartRef.current = elapsed;
        scaleAnimDurationRef.current = 0.15;
      }
    } else {
      scaleCurrentRef.current = baseScale;
    }
    group.scale.set(1, scaleCurrentRef.current, 1);

    const positions = burstPositionsRef.current!;
    const colors = burstColorsRef.current!;
    const particles = burstParticlesRef.current;
    let needUpdate = false;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (!p.active) {
        if (burstVisibleRef.current[i]) {
          burstVisibleRef.current[i] = false;
          positions[i * 3 + 1] = -1000;
          needUpdate = true;
        }
        continue;
      }
      p.life -= effectiveDelta;
      if (p.life <= 0) {
        p.active = false;
        burstVisibleRef.current[i] = false;
        positions[i * 3 + 1] = -1000;
        needUpdate = true;
        continue;
      }
      const lifeRatio = p.life / p.maxLife;
      p.position.addScaledVector(p.velocity, effectiveDelta);
      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;
      colors[i * 3] = p.color.r * lifeRatio;
      colors[i * 3 + 1] = p.color.g * lifeRatio;
      colors[i * 3 + 2] = p.color.b * lifeRatio;
      needUpdate = true;
    }

    if (needUpdate && burstGeometryRef.current) {
      (burstGeometryRef.current.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (burstGeometryRef.current.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  return {
    groupRef,
    ringRefs,
    ringGeometries,
    burstGeometry,
    burstMaterial,
    SCULPTURE_COLOR,
  };
};

export const Sculpture = () => {
  const {
    groupRef,
    ringRefs,
    ringGeometries,
    burstGeometry,
    burstMaterial,
    SCULPTURE_COLOR,
  } = useSculptureAnimation();

  return (
    <group>
      <group ref={groupRef}>
        {RING_CONFIGS.map((cfg, idx) => (
          <mesh
            key={idx}
            ref={(el) => {
              if (el) ringRefs.current[idx] = el;
            }}
            geometry={ringGeometries[idx]}
            position={[0, cfg.y, 0]}
          >
            <meshPhysicalMaterial
              color={SCULPTURE_COLOR}
              transparent
              opacity={0.5}
              roughness={0.2}
              metalness={0.1}
              transmission={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>
      <points geometry={burstGeometry} material={burstMaterial} frustumCulled={false} />
    </group>
  );
};
