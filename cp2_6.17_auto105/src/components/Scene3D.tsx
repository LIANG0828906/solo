import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import type { ParticleState } from '../engine/types';

interface ParticleSystemProps {
  particles: ParticleState[];
}

function ParticleSystem({ particles }: ParticleSystemProps) {
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  const positions = useMemo(() => new Float32Array(10000 * 3), []);
  const colors = useMemo(() => new Float32Array(10000 * 3), []);
  const sizes = useMemo(() => new Float32Array(10000), []);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame(() => {
    if (!geometryRef.current) return;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const i3 = i * 3;

      positions[i3] = p.x;
      positions[i3 + 1] = p.y;
      positions[i3 + 2] = p.z;

      const heightFactor = Math.max(0, Math.min(1, (p.y + 10) / 20));
      const r1 = 0, g1 = 0.8, b1 = 1;
      const r2 = 1, g2 = 0.42, b2 = 0.42;

      colors[i3] = r1 + (r2 - r1) * heightFactor;
      colors[i3 + 1] = g1 + (g2 - g1) * heightFactor;
      colors[i3 + 2] = b1 + (b2 - b1) * heightFactor;

      const ageFactor = p.age / p.life;
      sizes[i] = 1 + ageFactor * 3;

      if (ageFactor > 0.8) {
        const fadeFactor = (1 - ageFactor) / 0.2;
        const flicker = Math.sin(ageFactor * 50) * 0.3 + 0.7;
        sizes[i] *= fadeFactor * flicker;
      }
    }

    geometryRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometryRef.current.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometryRef.current.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometryRef.current.setDrawRange(0, particles.length);

    geometryRef.current.attributes.position.needsUpdate = true;
    geometryRef.current.attributes.color.needsUpdate = true;
    geometryRef.current.attributes.size.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geometryRef} />
      <pointsMaterial
        size={0.1}
        map={texture}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function SceneContent() {
  const particles = useStore((state) => state.particleState);
  const setGestureForce = useStore((state) => state.setGestureForce);
  const emitParticles = useStore((state) => state.emitParticles);
  const incrementEmittedCount = useStore((state) => state.incrementEmittedCount);
  const { camera } = useThree();
  const lastMousePos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current) return;

    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;

    const strength = Math.min(1, Math.sqrt(dx * dx + dy * dy) / 100);

    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    const right = new THREE.Vector3().crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3(0, -1, 0);

    const forceX = right.x * dx * 0.01 + up.x * dy * 0.01;
    const forceY = right.y * dx * 0.01 + up.y * dy * 0.01;
    const forceZ = right.z * dx * 0.01 + up.z * dy * 0.01;

    setGestureForce({
      x: forceX,
      y: forceY,
      z: forceZ,
      strength,
    });

    lastMousePos.current = { x: e.clientX, y: e.clientY };

    emitParticles(1, [e.point.x, e.point.y, e.point.z]);
    incrementEmittedCount(1);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    emitParticles(100, [e.point.x, e.point.y, e.point.z]);
    incrementEmittedCount(100);
  };

  useEffect(() => {
    let animationId: number;
    const damping = 0.95;

    const dampForce = () => {
      const state = useStore.getState();
      if (state.gestureForce.strength > 0.001) {
        setGestureForce({
          x: state.gestureForce.x * damping,
          y: state.gestureForce.y * damping,
          z: state.gestureForce.z * damping,
          strength: state.gestureForce.strength * damping,
        });
      } else if (state.gestureForce.strength > 0) {
        setGestureForce({ x: 0, y: 0, z: 0, strength: 0 });
      }
      animationId = requestAnimationFrame(dampForce);
    };

    animationId = requestAnimationFrame(dampForce);
    return () => cancelAnimationFrame(animationId);
  }, [setGestureForce]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 15]} fov={60} />
      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        minDistance={1}
        maxDistance={50}
        makeDefault
      />
      <ambientLight intensity={0.5} />
      <ParticleSystem particles={particles} />
      <mesh
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleClick}
        position={[0, 0, 0]}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}

function PerformanceIndicator() {
  const fps = useStore((state) => state.fps);
  const particles = useStore((state) => state.particleState);
  const emittedPerSecond = useStore((state) => state.particlesEmittedThisSecond);

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#FFFFFF',
        backgroundColor: '#00000066',
        borderRadius: '4px',
        padding: '4px 8px',
        lineHeight: 1.6,
        pointerEvents: 'none',
      }}
    >
      <div>FPS: {fps.toFixed(0)}</div>
      <div>Particles: {particles.length}</div>
      <div>Emitted/s: {emittedPerSecond}</div>
    </div>
  );
}

export default function Scene3D() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        gl={{ antialias: true, alpha: true }}
        style={{ background: '#0A0A15' }}
      >
        <SceneContent />
      </Canvas>
      <PerformanceIndicator />
    </div>
  );
}
