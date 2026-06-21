import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useSimulationStore } from '@/store/useSimulationStore';
import type { IStellarBody } from '@/utils/types';

interface BodyProps {
  body: IStellarBody;
  isSelected: boolean;
  onClick: () => void;
}

function StellarBody({ body, isSelected, onClick }: BodyProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    gradient.addColorStop(0, body.color);
    gradient.addColorStop(0.7, body.color + 'cc');
    gradient.addColorStop(1, body.color + '66');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = Math.random() * 2;
      const noise = Math.random() * 0.3 + 0.1;
      ctx.fillStyle = `rgba(255, 255, 255, ${noise})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }, [body.color]);

  const normalMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const imgData = ctx.createImageData(256, 256);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const x = (i / 4) % 256;
      const y = Math.floor(i / 4 / 256);
      const noise = (Math.sin(x * 0.1) * Math.cos(y * 0.1) + 1) * 127;
      imgData.data[i] = noise;
      imgData.data[i + 1] = noise;
      imgData.data[i + 2] = 255;
      imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }, []);

  const trajectoryGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(body.trajectory.length * 3);
    for (let i = 0; i < body.trajectory.length; i++) {
      positions[i * 3] = body.trajectory[i].x;
      positions[i * 3 + 1] = body.trajectory[i].y;
      positions[i * 3 + 2] = body.trajectory[i].z;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [body.trajectory]);

  useEffect(() => {
    const positions = trajectoryGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < body.trajectory.length; i++) {
      positions[i * 3] = body.trajectory[i].x;
      positions[i * 3 + 1] = body.trajectory[i].y;
      positions[i * 3 + 2] = body.trajectory[i].z;
    }
    trajectoryGeometry.attributes.position.needsUpdate = true;
    trajectoryGeometry.setDrawRange(0, body.trajectory.length);
  }, [body.trajectory, trajectoryGeometry]);

  const billboardPosition = useMemo(() => {
    return new THREE.Vector3(
      body.position.x,
      body.position.y + body.radius + 0.5,
      body.position.z
    );
  }, [body.position, body.radius]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  const labelScale = useMemo(() => {
    const dist = camera.position.distanceTo(new THREE.Vector3(body.position.x, body.position.y, body.position.z));
    return Math.max(0.5, Math.min(2, dist / 30));
  }, [camera.position, body.position]);

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[body.position.x, body.position.y, body.position.z]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[body.radius, 64, 64]} />
        <meshStandardMaterial
          map={texture}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.3, 0.3)}
          emissive={body.color}
          emissiveIntensity={isSelected ? 0.5 : 0.2}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {isSelected && (
        <mesh position={[body.position.x, body.position.y, body.position.z]}>
          <sphereGeometry args={[body.radius * 1.3, 64, 64]} />
          <meshBasicMaterial color={body.color} transparent opacity={0.2} side={THREE.BackSide} />
        </mesh>
      )}

      {body.trajectory.length > 1 && (
        <lineSegments geometry={trajectoryGeometry}>
          <lineBasicMaterial color={body.color} transparent opacity={0.5} />
        </lineSegments>
      )}

      {(hovered || isSelected) && (
        <group position={billboardPosition} scale={[labelScale, labelScale, labelScale]}>
          <Html center>
            <div
              style={{
                background: 'rgba(10, 14, 28, 0.9)',
                padding: '6px 10px',
                borderRadius: '6px',
                color: '#d0d0e0',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                border: `1px solid ${body.color}66`,
                backdropFilter: 'blur(4px)',
              }}
            >
              <div style={{ fontWeight: 'bold', color: body.color, marginBottom: '2px' }}>{body.name}</div>
              <div>
                X: {body.position.x.toFixed(2)} Y: {body.position.y.toFixed(2)} Z: {body.position.z.toFixed(2)}
              </div>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

function CollisionParticles() {
  const particles = useSimulationStore((state) => state.collisionParticles);
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, opacities } = useMemo(() => {
    const positions = new Float32Array(particles.length * 3);
    const opacities = new Float32Array(particles.length);

    for (let i = 0; i < particles.length; i++) {
      positions[i * 3] = particles[i].position.x;
      positions[i * 3 + 1] = particles[i].position.y;
      positions[i * 3 + 2] = particles[i].position.z;
      opacities[i] = particles[i].life / particles[i].maxLife;
    }

    return { positions, opacities };
  }, [particles]);

  if (particles.length === 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-opacity" count={opacities.length} array={opacities} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial size={0.15} color="#ffffff" transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

function SceneContent() {
  const { bodies, selectedBodyId, params, worker, initWorker } = useSimulationStore();
  const setSelectedBody = useSimulationStore((state) => state.setSelectedBody);
  const starFieldDensity = useSimulationStore((state) => state.starFieldDensity);
  const lastStepRef = useRef<number>(0);
  useThree();

  useEffect(() => {
    initWorker();
  }, [initWorker]);

  useFrame(() => {
    if (!worker || params.paused) return;

    const now = performance.now();
    const interval = 1000 / 60;

    if (now - lastStepRef.current >= interval) {
      worker.postMessage({
        type: 'step',
        payload: { dt: params.dt, speed: params.speed },
      });
      lastStepRef.current = now;
    }
  });

  const starsRadius = 500;
  const starsPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < starFieldDensity; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = starsRadius * (0.8 + Math.random() * 0.2);
      positions.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ]);
    }
    return positions;
  }, [starFieldDensity]);

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#ffffff" distance={200} />

      {starsPositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6 + Math.random() * 0.4} />
        </mesh>
      ))}

      {bodies.map((body) => (
        <StellarBody
          key={body.id}
          body={body}
          isSelected={selectedBodyId === body.id}
          onClick={() => setSelectedBody(body.id)}
        />
      ))}

      <CollisionParticles />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={200}
        makeDefault
      />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          height={300}
          intensity={1.5}
        />
      </EffectComposer>
    </>
  );
}

export function Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, 30, 60], fov: 60 }}
      style={{
        background: 'linear-gradient(to bottom, #0a0e1c, #1a2340)',
      }}
      gl={{ antialias: true, alpha: true }}
    >
      <fog attach="fog" args={['#0a0e1c', 50, 150]} />
      <SceneContent />
    </Canvas>
  );
}
