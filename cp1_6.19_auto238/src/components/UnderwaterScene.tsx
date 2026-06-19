import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '@/store/useStore';
import { SonarController } from '@/core/SonarController';
import { TerrainReconstructor } from '@/core/TerrainReconstructor';
import './UnderwaterScene.css';

const PARTICLE_COUNT = 100;

const Particles: React.FC = () => {
  const meshRef = useRef<THREE.Points>(null);
  const particlesRef = useRef<{ speed: number; offset: number }[]>([]);

  const [positions, sizes, opacities] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const siz = new Float32Array(PARTICLE_COUNT);
    const opa = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 40 - 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      siz[i] = 2 + Math.random() * 2;
      opa[i] = 0.1 + Math.random() * 0.2;
      particlesRef.current[i] = {
        speed: 0.05 + Math.random() * 0.05,
        offset: Math.random() * Math.PI * 2,
      };
    }
    return [pos, siz, opa];
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const positions = meshRef.current.geometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const particle = particlesRef.current[i];
      const t = state.clock.elapsedTime * particle.speed + particle.offset;
      positions[i * 3] += Math.sin(t) * 0.02;
      positions[i * 3 + 1] += Math.cos(t * 0.7) * 0.01;
      positions[i * 3 + 2] += Math.sin(t * 0.5) * 0.015;

      if (positions[i * 3 + 1] > 30) positions[i * 3 + 1] = -10;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        color="#ffffff"
        transparent
        opacity={0.2}
        sizeAttenuation
      />
    </points>
  );
};

const SonarBeam: React.FC<{
  scanAngle: number;
  frequency: number;
  pulseWidth: number;
}> = ({ scanAngle, frequency, pulseWidth }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [progress, setProgress] = useState(0);
  const lastUpdateRef = useRef(0);

  useFrame((state) => {
    const now = state.clock.elapsedTime * 1000;
    const interval = 1000 / (frequency / 50);

    if (now - lastUpdateRef.current > interval) {
      lastUpdateRef.current = now;
    }

    const elapsed = now - lastUpdateRef.current;
    const prog = Math.min(1, elapsed / (pulseWidth * 50 + 100));
    setProgress(prog);
  });

  const radius = Math.tan((scanAngle / 2) * (Math.PI / 180)) * 60;
  const opacity = (0.1 + pulseWidth * 0.1) * (1 - progress * 0.7);

  return (
    <group position={[0, 0, 0]}>
      <mesh
        ref={meshRef}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -30 * progress]}
      >
        <coneGeometry args={[radius * progress, 60 * progress, 32, 1, true]} />
        <meshBasicMaterial
          color={new THREE.Color().setHSL(0.55, 0.8, 0.5 + progress * 0.3)}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0, -0.5]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#4A90D9" />
      </mesh>
    </group>
  );
};

const EchoPoints: React.FC<{
  echoData: ReturnType<typeof useStore.getState>['echoData'];
  beamProgress: number;
}> = ({ echoData, beamProgress }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [flashStates, setFlashStates] = useState<Map<number, number>>(
    new Map()
  );

  useEffect(() => {
    echoData.forEach((echo) => {
      const distance = Math.sqrt(echo.x ** 2 + echo.z ** 2);
      const beamReach = beamProgress * 60;
      if (beamReach >= distance && !flashStates.has(echo.pointId)) {
        setFlashStates((prev) => {
          const next = new Map(prev);
          next.set(echo.pointId, 1);
          return next;
        });
        setTimeout(() => {
          setFlashStates((prev) => {
            const next = new Map(prev);
            next.delete(echo.pointId);
            return next;
          });
        }, 500);
      }
    });
  }, [beamProgress, echoData]);

  return (
    <group ref={groupRef}>
      {echoData.map((echo) => {
        const flashScale = flashStates.get(echo.pointId) || 0;
        const scale = 0.5 + flashScale * 0.7;
        return (
          <group key={echo.pointId} position={[echo.x, -echo.depth, echo.z]}>
            <mesh>
              <sphereGeometry args={[0.4 * scale, 16, 16]} />
              <meshBasicMaterial
                color={`rgba(255, 255, 200, ${0.5 + flashScale * 0.5})`}
              />
            </mesh>
            {flashScale > 0 && (
              <mesh scale={scale}>
                <ringGeometry args={[0.5, 0.7, 32]} />
                <meshBasicMaterial
                  color="#FFD700"
                  transparent
                  opacity={flashScale * 0.6}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

const TerrainMesh: React.FC<{
  geometry: THREE.BufferGeometry | null;
}> = ({ geometry }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.LineSegments>(null);

  useFrame(() => {});

  if (!geometry) return null;

  return (
    <group position={[0, -25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshPhongMaterial
          vertexColors
          side={THREE.DoubleSide}
          shininess={10}
        />
      </mesh>
      <lineSegments ref={wireframeRef} geometry={geometry}>
        <lineBasicMaterial color="#2C4C3B" transparent opacity={0.3} />
      </lineSegments>
    </group>
  );
};

const SceneContent: React.FC<{
  sonarController: SonarController | null;
  terrainReconstructor: TerrainReconstructor | null;
  terrainGeometry: THREE.BufferGeometry | null;
}> = ({ sonarController, terrainReconstructor, terrainGeometry }) => {
  const { params, echoData, beamState } = useStore();

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 30, 50]} fov={60} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={20}
        maxDistance={120}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />

      <ambientLight intensity={0.4} />
      <directionalLight
        position={[20, 40, 20]}
        intensity={0.8}
        color="#87CEEB"
      />
      <pointLight position={[0, 0, -20]} intensity={0.5} color="#4A90D9" />

      <Particles />
      <SonarBeam
        scanAngle={params.scanAngle}
        frequency={params.frequency}
        pulseWidth={params.pulseWidth}
      />
      <EchoPoints echoData={echoData} beamProgress={beamState.progress} />
      <TerrainMesh geometry={terrainGeometry} />

      <mesh position={[0, 0, -40]} rotation={[0, 0, 0]}>
        <planeGeometry args={[120, 80]} />
        <meshBasicMaterial color="#001833" transparent opacity={0.3} />
      </mesh>
    </>
  );
};

export const UnderwaterScene: React.FC = () => {
  const {
    params,
    setEchoData,
    setBeamState,
    setTerrainMetrics,
    setIsUpdating,
    setUpdateProgress,
  } = useStore();

  const [sonarController, setSonarController] =
    useState<SonarController | null>(null);
  const [terrainReconstructor, setTerrainReconstructor] =
    useState<TerrainReconstructor | null>(null);
  const [terrainGeometry, setTerrainGeometry] =
    useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    const controller = new SonarController({
      frequency: params.frequency,
      scanAngle: params.scanAngle,
      pulseWidth: params.pulseWidth,
    });

    const reconstructor = new TerrainReconstructor();

    const initialData = controller.getEchoData();
    setEchoData(initialData);

    const { geometry, metrics } = reconstructor.reconstruct(
      initialData,
      params.scanAngle
    );
    setTerrainGeometry(geometry);
    setTerrainMetrics(metrics);

    const unsubscribeEcho = controller.subscribe((data) => {
      setEchoData(data);
    });

    const unsubscribeBeam = controller.subscribeBeam((state) => {
      setBeamState(state);
    });

    setSonarController(controller);
    setTerrainReconstructor(reconstructor);

    return () => {
      unsubscribeEcho();
      unsubscribeBeam();
      controller.dispose();
      reconstructor.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sonarController || !terrainReconstructor) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let progressInterval: ReturnType<typeof setInterval>;

    setIsUpdating(true);
    setUpdateProgress(0);

    progressInterval = setInterval(() => {
      setUpdateProgress((prev) => Math.min(prev + 10, 90));
    }, 30);

    timeoutId = setTimeout(() => {
      sonarController.updateParams(params);
      const echoData = sonarController.getEchoData();
      const { geometry, metrics } = terrainReconstructor.reconstruct(
        echoData,
        params.scanAngle
      );
      setTerrainGeometry(geometry);
      setTerrainMetrics(metrics);
      setUpdateProgress(100);

      setTimeout(() => {
        setIsUpdating(false);
        setUpdateProgress(0);
      }, 200);

      clearInterval(progressInterval);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(progressInterval);
    };
  }, [params.frequency, params.scanAngle, params.pulseWidth]);

  return (
    <div className="underwater-scene-container">
      <Canvas
        gl={{ antialias: true }}
        style={{
          background: 'linear-gradient(180deg, #004466 0%, #001833 100%)',
        }}
      >
        <fog attach="fog" args={['#001833', 30, 100]} />
        <SceneContent
          sonarController={sonarController}
          terrainReconstructor={terrainReconstructor}
          terrainGeometry={terrainGeometry}
        />
      </Canvas>
    </div>
  );
};
