import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useParticleStore } from './store';
import { updateParticles } from './ForceSystem';
import type { Particle, TrailData, Vector3 } from './types';

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [r, g, b];
}

function ParticlePoints() {
  const pointsRef = useRef<THREE.Points>(null);
  const { particles } = useParticleStore();

  const { geometry, colors } = useMemo(() => {
    const count = particles.length;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;
      const [r, g, b] = hslToRgb(p.color.h, p.color.s, p.color.l);
      cols[i * 3] = r;
      cols[i * 3 + 1] = g;
      cols[i * 3 + 2] = b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return { geometry: geo, colors: cols };
  }, [particles.length]);

  useEffect(() => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = pointsRef.current.geometry.getAttribute('color') as THREE.BufferAttribute;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      posAttr.array[i * 3] = p.position.x;
      posAttr.array[i * 3 + 1] = p.position.y;
      posAttr.array[i * 3 + 2] = p.position.z;
      const [r, g, b] = hslToRgb(p.color.h, p.color.s, p.color.l);
      colAttr.array[i * 3] = r;
      colAttr.array[i * 3 + 1] = g;
      colAttr.array[i * 3 + 2] = b;
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }, [particles]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.95}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function TrailLines({ onTrailHover }: { onTrailHover: (id: number | null) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const lineRefs = useRef<Map<number, THREE.Line>>(new Map());
  const { trails, hoveredTrailId } = useParticleStore();

  useEffect(() => {
    if (!groupRef.current) return;
    const existingIds = new Set(lineRefs.current.keys());
    const trailIds = new Set(trails.map((t) => t.particleId));

    for (const id of existingIds) {
      if (!trailIds.has(id)) {
        const line = lineRefs.current.get(id);
        if (line) {
          groupRef.current!.remove(line);
          line.geometry.dispose();
          (line.material as THREE.Material).dispose();
        }
        lineRefs.current.delete(id);
      }
    }

    for (const trail of trails) {
      let line = lineRefs.current.get(trail.particleId);
      if (!line) {
        const geo = new THREE.BufferGeometry();
        const maxPoints = 200;
        const positions = new Float32Array(maxPoints * 3);
        const colors = new Float32Array(maxPoints * 4);
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 4));
        geo.setDrawRange(0, 0);

        const mat = new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 1,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });

        line = new THREE.Line(geo, mat);
        line.userData.particleId = trail.particleId;
        groupRef.current.add(line);
        lineRefs.current.set(trail.particleId, line);
      }
    }
  }, [trails.length]);

  useEffect(() => {
    for (const trail of trails) {
      const line = lineRefs.current.get(trail.particleId);
      if (!line) continue;

      const geo = line.geometry as THREE.BufferGeometry;
      const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
      const colAttr = geo.getAttribute('color') as THREE.BufferAttribute;
      const len = trail.positions.length;
      const [cr, cg, cb] = hslToRgb(trail.color.h, trail.color.s, trail.color.l);

      for (let i = 0; i < len; i++) {
        const pos = trail.positions[i];
        posAttr.array[i * 3] = pos.x;
        posAttr.array[i * 3 + 1] = pos.y;
        posAttr.array[i * 3 + 2] = pos.z;

        const t = i / Math.max(1, len - 1);
        const isHovered = hoveredTrailId === trail.particleId;
        const baseAlpha = 0.3 - t * 0.25;
        const alpha = isHovered ? 0.8 : baseAlpha;
        colAttr.array[i * 4] = cr;
        colAttr.array[i * 4 + 1] = cg;
        colAttr.array[i * 4 + 2] = cb;
        colAttr.array[i * 4 + 3] = alpha;
      }

      geo.setDrawRange(0, Math.max(1, len));
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      const mat = line.material as THREE.LineBasicMaterial;
      mat.linewidth = hoveredTrailId === trail.particleId ? 2 : 1;
      mat.needsUpdate = true;
    }
  }, [trails, hoveredTrailId]);

  return <group ref={groupRef} />;
}

function FieldMarkers() {
  const { fieldConfig } = useParticleStore();

  return (
    <group>
      {fieldConfig.attractors.map((a) => (
        <mesh key={`att-${a.id}`} position={[a.position.x, a.position.y, a.position.z]}>
          <sphereGeometry args={[0.15 + a.strength * 0.05, 16, 16]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.8} />
        </mesh>
      ))}
      {fieldConfig.repulsors.map((r) => (
        <group key={`rep-${r.id}`} position={[r.position.x, r.position.y, r.position.z]}>
          <mesh>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color="#ff4444" transparent opacity={0.9} />
          </mesh>
          <mesh>
            <sphereGeometry args={[r.radius, 16, 16]} />
            <meshBasicMaterial color="#ff4444" transparent opacity={0.08} wireframe />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SimulationUpdater() {
  const accumulatorRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const maxFrameTime = 100;
  const physicsStep = 16.67;

  const particles = useParticleStore((s) => s.particles);
  const trails = useParticleStore((s) => s.trails);
  const fieldConfig = useParticleStore((s) => s.fieldConfig);
  const isRunning = useParticleStore((s) => s.isRunning);
  const setParticlesAndTrails = useParticleStore((s) => s.setParticlesAndTrails);

  useFrame(() => {
    if (!isRunning) {
      lastTimeRef.current = performance.now();
      return;
    }

    const now = performance.now();
    let frameTime = now - lastTimeRef.current;
    lastTimeRef.current = now;

    if (frameTime > maxFrameTime) {
      frameTime = maxFrameTime;
    }

    accumulatorRef.current += frameTime;

    let steps = 0;
    const maxStepsPerFrame = 4;

    while (accumulatorRef.current >= physicsStep && steps < maxStepsPerFrame) {
      accumulatorRef.current -= physicsStep;
      steps++;
    }

    if (steps > 0) {
      const result = updateParticles(particles, trails, fieldConfig, steps);
      setParticlesAndTrails(result.particles, result.trails);
    }
  });

  return null;
}

function FPSUpdater() {
  const framesRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const setFps = useParticleStore((s) => s.setFps);

  useFrame(() => {
    framesRef.current++;
    const now = performance.now();
    if (now - lastTimeRef.current >= 1000) {
      setFps(framesRef.current);
      framesRef.current = 0;
      lastTimeRef.current = now;
    }
  });

  return null;
}

function FPSDisplay() {
  const fps = useParticleStore((s) => s.fps);

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        color: '#00ffcc',
        fontFamily: 'monospace',
        fontSize: 14,
        padding: '6px 12px',
        background: 'rgba(0,0,0,0.6)',
        borderRadius: 4,
        border: '1px solid rgba(0,255,204,0.3)',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      FPS: {fps}
    </div>
  );
}

export default function ParticleScene() {
  const setHoveredTrailId = useParticleStore((s) => s.setHoveredTrailId);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <FPSDisplay />
      <Canvas
        camera={{ position: [0, 8, 25], fov: 60, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ background: '#000000' }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        <FPSUpdater />
        <SimulationUpdater />
        <ParticlePoints />
        <TrailLines onTrailHover={setHoveredTrailId} />
        <FieldMarkers />
        <OrbitControls
          enableDamping
          dampingFactor={0.15}
          minDistance={5}
          maxDistance={50}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
