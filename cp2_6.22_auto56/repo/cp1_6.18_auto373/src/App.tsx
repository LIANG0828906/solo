import { useRef, useCallback, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import ParticleSystem from './ParticleSystem';
import UIOverlay from './UIOverlay';
import { useParticleStore, createParticleBatch } from './particleStore';

interface MouseTrackerProps {
  onTrail: (x: number, y: number, speed: number) => void;
}

function MouseTracker({ onTrail }: MouseTrackerProps) {
  const { camera, gl } = useThree();
  const isDraggingRef = useRef(false);
  const lastSampleTimeRef = useRef(0);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const lastMouseTimeRef = useRef(0);
  const raycaster = useRef(new THREE.Raycaster());
  const ndc = useRef(new THREE.Vector2());
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const intersectPoint = useRef(new THREE.Vector3());

  const getWorldPosition = useCallback((clientX: number, clientY: number) => {
    const rect = gl.domElement.getBoundingClientRect();
    ndc.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.current.setFromCamera(ndc.current, camera);
    raycaster.current.ray.intersectPlane(plane.current, intersectPoint.current);
    return { x: intersectPoint.current.x, y: intersectPoint.current.y };
  }, [camera, gl]);

  const handlePointerDown = useCallback((e: PointerEvent) => {
    isDraggingRef.current = true;
    const pos = getWorldPosition(e.clientX, e.clientY);
    lastMousePosRef.current = pos;
    lastMouseTimeRef.current = performance.now();
    lastSampleTimeRef.current = 0;
  }, [getWorldPosition]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current) return;

    const now = performance.now();
    const pos = getWorldPosition(e.clientX, e.clientY);
    const dx = pos.x - lastMousePosRef.current.x;
    const dy = pos.y - lastMousePosRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dt = (now - lastMouseTimeRef.current) / 1000;
    const speed = dt > 0 ? dist / dt : 0;

    if (now - lastSampleTimeRef.current >= 50) {
      onTrail(pos.x, pos.y, speed);
      lastSampleTimeRef.current = now;
    }

    lastMousePosRef.current = pos;
    lastMouseTimeRef.current = now;
  }, [getWorldPosition, onTrail]);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [gl, handlePointerDown, handlePointerMove, handlePointerUp]);

  return null;
}

function Scene() {
  const addParticles = useParticleStore((s) => s.addParticles);

  const handleTrail = useCallback((x: number, y: number, speed: number) => {
    const count = Math.floor(20 + Math.random() * 31);
    const batch = createParticleBatch(x, y, speed, count);
    addParticles(batch);
  }, [addParticles]);

  return (
    <>
      <MouseTracker onTrail={handleTrail} />
      <ParticleSystem />
    </>
  );
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [0, 0, 300], fov: 60 }}
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0B0B1A 0%, #1A1A3E 100%)',
        }}
      >
        <Scene />
      </Canvas>
      <UIOverlay />
    </div>
  );
}
