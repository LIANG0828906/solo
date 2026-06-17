import { useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  useFusionStore,
  Particle,
  CollisionEvent,
  hexToRgb,
} from '@/store/store';
import {
  generateInitialParticles,
  updateParticleCount,
  simulationStep,
  calculateReactionRate,
} from '@/simulation/particleSystem';
import {
  TORUS_MAJOR_RADIUS,
  TORUS_MINOR_RADIUS,
} from '@/simulation/physicsEngine';

const MIN_DISTANCE = 5;
const MAX_DISTANCE = 30;
const MAX_PHI = Math.PI / 4;
const ROT_SPEED_X = 0.005;
const ROT_SPEED_Y = 0.003;
const PAN_SPEED = 0.05;
const HISTORY_LENGTH = 50;
const FLASH_DURATION = 300;
const MARKER_DURATION = 1500;

function CameraController() {
  const { camera } = useThree();
  const cameraState = useFusionStore((state) => state.camera);
  const updateCamera = useFusionStore((state) => state.updateCamera);
  const isDragging = useRef(false);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const targetDistance = useRef(cameraState.distance);
  const animatingDistance = useRef(false);
  const distanceAnimStart = useRef({ from: 0, to: 0, startTime: 0 });

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
      } else if (e.button === 2) {
        isPanning.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) isDragging.current = false;
      if (e.button === 2) isPanning.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;

      if (isDragging.current) {
        const newTheta = cameraState.theta + dx * ROT_SPEED_X;
        const newPhi = Math.max(
          -MAX_PHI,
          Math.min(MAX_PHI, cameraState.phi + dy * ROT_SPEED_Y)
        );
        updateCamera({ theta: newTheta, phi: newPhi });
      }

      if (isPanning.current) {
        const newPanX = cameraState.panX - dx * PAN_SPEED * 0.1;
        const newPanY = cameraState.panY + dy * PAN_SPEED * 0.1;
        updateCamera({ panX: newPanX, panY: newPanY });
      }

      lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 : -1;
      const newDistance = Math.max(
        MIN_DISTANCE,
        Math.min(MAX_DISTANCE, targetDistance.current + delta * 0.5)
      );
      distanceAnimStart.current = {
        from: cameraState.distance,
        to: newDistance,
        startTime: Date.now(),
      };
      targetDistance.current = newDistance;
      animatingDistance.current = true;
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      canvas.addEventListener('contextmenu', handleContextMenu);
    }
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('wheel', handleWheel);
        canvas.removeEventListener('contextmenu', handleContextMenu);
      }
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [cameraState.theta, cameraState.phi, cameraState.panX, cameraState.panY, cameraState.distance, updateCamera]);

  useFrame(() => {
    if (animatingDistance.current) {
      const elapsed = Date.now() - distanceAnimStart.current.startTime;
      const progress = Math.min(1, elapsed / 200);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentDistance =
        distanceAnimStart.current.from +
        (distanceAnimStart.current.to - distanceAnimStart.current.from) * easeOut;
      updateCamera({ distance: currentDistance });
      if (progress >= 1) {
        animatingDistance.current = false;
      }
    }

    const { theta, phi, distance, panX, panY } = useFusionStore.getState().camera;
    const x = distance * Math.cos(phi) * Math.sin(theta) + panX;
    const y = distance * Math.sin(phi) + panY;
    const z = distance * Math.cos(phi) * Math.cos(theta);

    camera.position.set(x, y, z);
    camera.lookAt(panX, panY, 0);
  });

  return null;
}

function TokamakChamber() {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const scanLineRef = useRef<THREE.Mesh>(null);

  const torusGeometry = useMemo(() => {
    return new THREE.TorusGeometry(TORUS_MAJOR_RADIUS, TORUS_MINOR_RADIUS, 32, 128);
  }, []);

  const edgesGeometry = useMemo(() => {
    return new THREE.EdgesGeometry(
      new THREE.TorusGeometry(TORUS_MAJOR_RADIUS, TORUS_MINOR_RADIUS, 32, 128)
    );
  }, []);

  const scanLineGeometry = useMemo(() => {
    return new THREE.TorusGeometry(TORUS_MAJOR_RADIUS, TORUS_MINOR_RADIUS + 0.01, 8, 64);
  }, []);

  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: 0x2a4a7f,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      metalness: 0.9,
      transmission: 0.5,
      thickness: 0.5,
      side: THREE.DoubleSide,
    });
  }, []);

  const edgesMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.5,
    });
  }, []);

  const scanLineMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (scanLineRef.current) {
      const scanProgress = (time % 4) / 4;
      scanLineRef.current.rotation.x = scanProgress * Math.PI * 2;
      scanLineRef.current.rotation.y = scanProgress * Math.PI;
      scanLineMaterial.opacity = 0.3 + Math.sin(scanProgress * Math.PI) * 0.3;
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={torusGeometry}
        material={material}
        frustumCulled={true}
      />
      <lineSegments
        ref={edgesRef}
        geometry={edgesGeometry}
        material={edgesMaterial}
        frustumCulled={true}
      />
      <mesh
        ref={scanLineRef}
        geometry={scanLineGeometry}
        material={scanLineMaterial}
        frustumCulled={true}
      />
    </group>
  );
}

function ParticleSystem() {
  const pointsRef = useRef<THREE.Points>(null);
  const particles = useFusionStore((state) => state.particles);
  const params = useFusionStore((state) => state.params);
  const updateParticles = useFusionStore((state) => state.updateParticles);
  const addCollision = useFusionStore((state) => state.addCollision);
  const updateDiagnostics = useFusionStore((state) => state.updateDiagnostics);
  const lastCollisionCheck = useRef(new Map<string, number>());
  const lastUpdateTime = useRef(Date.now());
  const reactionRateWindow = useRef<number[]>([]);
  const windowStartTime = useRef(Date.now());
  const initialized = useRef(false);

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(500 * 3);
    const colors = new Float32Array(500 * 3);
    const sizes = new Float32Array(500);

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat };
  }, []);

  useEffect(() => {
    if (!initialized.current) {
      const initialParticles = generateInitialParticles(params);
      updateParticles(initialParticles);
      initialized.current = true;
      lastUpdateTime.current = Date.now();
      windowStartTime.current = Date.now();
    }
  }, [params, updateParticles]);

  useEffect(() => {
    if (particles.length > 0) {
      const updated = updateParticleCount(particles, params.particleCount, params);
      if (updated.length !== particles.length) {
        updateParticles(updated);
      }
    }
  }, [params.particleCount]);

  useFrame(() => {
    if (particles.length === 0) return;

    const now = Date.now();
    const deltaTime = Math.min((now - lastUpdateTime.current) / 1000, 0.1);
    lastUpdateTime.current = now;

    const result = simulationStep(
      particles,
      params,
      deltaTime,
      lastCollisionCheck.current
    );

    updateParticles(result.particles);

    result.collisions.forEach((pos) => {
      addCollision(pos);
      reactionRateWindow.current.push(now);
    });

    const cutoffTime = now - 1000;
    reactionRateWindow.current = reactionRateWindow.current.filter(
      (t) => t > cutoffTime
    );
    const reactionRate = calculateReactionRate(
      reactionRateWindow.current.length,
      Math.min(1000, now - windowStartTime.current)
    );

    const diagnostics = useFusionStore.getState().diagnostics;
    const tempHistory = [...diagnostics.temperatureHistory, result.averageTemperature];
    if (tempHistory.length > HISTORY_LENGTH) tempHistory.shift();

    updateDiagnostics({
      reactionRate,
      averageTemperature: result.averageTemperature,
      temperatureHistory: tempHistory,
    });

    if (pointsRef.current) {
      const positions = geometry.attributes.position.array as Float32Array;
      const colors = geometry.attributes.color.array as Float32Array;
      const sizes = geometry.attributes.size.array as Float32Array;

      result.particles.forEach((p: Particle, i: number) => {
        positions[i * 3] = p.position.x;
        positions[i * 3 + 1] = p.position.y;
        positions[i * 3 + 2] = p.position.z;

        const rgb = hexToRgb(p.color);
        colors[i * 3] = rgb.r / 255;
        colors[i * 3 + 1] = rgb.g / 255;
        colors[i * 3 + 2] = rgb.b / 255;

        sizes[i] = p.size / 50;
      });

      for (let i = result.particles.length; i < 500; i++) {
        positions[i * 3] = 9999;
        positions[i * 3 + 1] = 9999;
        positions[i * 3 + 2] = 9999;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      geometry.attributes.size.needsUpdate = true;
      geometry.setDrawRange(0, result.particles.length);
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={true} />
  );
}

function CollisionEffects() {
  const collisions = useFusionStore((state) => state.collisions);
  const updateCollisionOpacity = useFusionStore((state) => state.updateCollisionOpacity);
  const removeCollision = useFusionStore((state) => state.removeCollision);

  useFrame(() => {
    const now = Date.now();
    collisions.forEach((c: CollisionEvent) => {
      const elapsed = now - c.timestamp;
      const flashOpacity = Math.max(0, 1 - elapsed / FLASH_DURATION);
      const markerOpacity = Math.max(0, 1 - elapsed / MARKER_DURATION);

      if (flashOpacity <= 0 && markerOpacity <= 0) {
        removeCollision(c.id);
      } else {
        updateCollisionOpacity(c.id, flashOpacity, markerOpacity);
      }
    });
  });

  return (
    <group>
      {collisions.map((c: CollisionEvent) => (
        <group key={c.id} position={[c.position.x, c.position.y, c.position.z]}>
          <mesh frustumCulled={true}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial
              color={0xffffff}
              transparent
              opacity={c.flashOpacity}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh frustumCulled={true}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial
              color={0xffd700}
              transparent
              opacity={c.markerOpacity}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color={0xffffff} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color={0x00e5ff} />
    </>
  );
}

export default function SceneManager() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0A0A1A']} />
        <fog attach="fog" args={['#0A0A1A', 10, 50]} />
        <SceneLights />
        <TokamakChamber />
        <ParticleSystem />
        <CollisionEffects />
        <CameraController />
      </Canvas>
    </div>
  );
}
