import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { PlantRenderer } from './PlantRenderer';
import { usePlantStore, slotPosition } from '../store/plantStateStore';
import { useEnvParamsStore } from '../store/envParamsStore';
import { useGeneWeightsStore, registerPlantGenes } from '../store/geneWeightsStore';
import { useLogStore } from '../store/logStore';
import { growthStep } from '../core/plantGrowthEngine';
import { calculatePhotosyntheticEfficiency } from '../core/envParams';
import { createDefaultGeneWeights, createRandomGeneWeights } from '../core/geneWeights';

function Lawn() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const pos = meshRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const original = (meshRef.current.geometry as any)._original;
    if (!original) {
      (meshRef.current.geometry as any)._original = pos.array.slice() as Float32Array;
      return;
    }
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const ox = original[i];
      const oz = original[i + 2];
      const d = Math.sqrt(ox * ox + oz * oz);
      if (d < 9.9) {
        arr[i + 1] = original[i + 1] + Math.sin(t * 1.5 + d * 0.8) * 0.03;
      }
    }
    pos.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });
  return (
    <mesh ref={meshRef} receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[10, 80]} />
      <meshStandardMaterial
        color="#7CB342"
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  );
}

function DynamicLights() {
  const env = useEnvParamsStore((s) => s.params);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);

  useFrame((_, delta) => {
    if (dirRef.current && ambRef.current) {
      const lightRatio = env.light / 100;
      const temp = env.temperature;
      const warmT = Math.max(0, Math.min(1, (temp - 10) / 30));
      const r = 1;
      const g = 0.9 + (1 - warmT) * 0.1;
      const b = 0.85 + (1 - warmT) * 0.15;

      const targetIntensity = 0.4 + lightRatio * 1.4;
      const t = 1 - Math.exp(-6 * delta);
      dirRef.current.intensity += (targetIntensity - dirRef.current.intensity) * t;
      dirRef.current.color.lerp(new THREE.Color(r, g, b), t);

      const ambTarget = 0.3 + lightRatio * 0.4;
      ambRef.current.intensity += (ambTarget - ambRef.current.intensity) * t;
      ambRef.current.color.lerp(new THREE.Color(r * 0.9, g * 0.95, b), t);
    }
  });

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.6} color="#D7E3FF" />
      <directionalLight
        ref={dirRef}
        position={[6, 10, 6]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
    </>
  );
}

function SkyDome() {
  const { scene } = useThree();
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#0D47A1');
    grad.addColorStop(0.5, '#42587A');
    grad.addColorStop(1, '#616161');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 512);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    scene.background = tex;
    return () => {
      tex.dispose();
    };
  }, [scene]);
  return null;
}

function GrowthLoop() {
  const plants = usePlantStore((s) => s.plants);
  const order = usePlantStore((s) => s.order);
  const updatePlant = usePlantStore((s) => s.updatePlantState);
  const incGlobal = usePlantStore((s) => s.setGlobalTime);
  const env = useEnvParamsStore((s) => s.params);
  const genePlants = useGeneWeightsStore((s) => s.plants);
  const addLog = useLogStore((s) => s.addLog);
  const incLogTime = useLogStore((s) => s.setGlobalTime);
  const clockRef = useRef({ last: performance.now(), global: 0 });

  useFrame(() => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - clockRef.current.last) / 1000);
    clockRef.current.last = now;
    clockRef.current.global += dt;
    incGlobal(clockRef.current.global);
    incLogTime(clockRef.current.global);

    for (const id of order) {
      const plant = plants[id];
      if (!plant) continue;
      const genes = genePlants[id] ?? plant.geneWeights;
      const newTime = plant.growthTime + dt;
      const result = growthStep({
        plantId: id,
        geneWeights: genes,
        growthTime: newTime,
        prevState: plant.state,
        env,
        dt,
      });
      updatePlant(id, result.state, newTime);
      if (result.stageChanged && result.prevStage !== null) {
        const stageLabels: Record<string, string> = {
          seed: '种子萌发',
          vegetative: '营养生长',
          reproductive: '生殖生长',
          fruiting: '果实成熟',
        };
        const flowerTendency =
          genes.flowerColor > 0.6 ? '红色' : genes.flowerColor < 0.3 ? '白色' : '粉色';
        addLog(
          'stage',
          `植物${id}进入${stageLabels[result.state.stage]}阶段${result.state.stage === 'reproductive' ? `，花色趋向${flowerTendency}` : ''}`,
          { plantId: id, stage: result.state.stage }
        );
      }
    }
  });

  return null;
}

function ScenePlants() {
  const plants = usePlantStore((s) => s.plants);
  const order = usePlantStore((s) => s.order);
  const selectedId = usePlantStore((s) => s.selectedId);
  const breedingId = useGeneWeightsStore((s) => s.breedingParentId);
  const selectPlant = usePlantStore((s) => s.selectPlant);

  return (
    <>
      {order.map((id) => {
        const plant = plants[id];
        if (!plant) return null;
        const [x, y, z] = slotPosition(plant.slotIndex);
        return (
          <group key={id} position={[x, y, z]}>
            <PlantRenderer
              plant={plant}
              selected={selectedId === id}
              breeding={breedingId === id}
              onClick={() => selectPlant(id)}
            />
          </group>
        );
      })}
    </>
  );
}

function SeedInitializer() {
  const addPlant = usePlantStore((s) => s.addPlant);
  const plants = usePlantStore((s) => s.plants);
  const addLog = useLogStore((s) => s.addLog);

  useEffect(() => {
    if (Object.keys(plants).length === 0) {
      const genes1 = createDefaultGeneWeights();
      const id1 = addPlant({
        geneWeights: { ...genes1 },
        tagRole: 'parent',
        initialGrowthTime: 0,
      });
      if (id1) {
        registerPlantGenes(id1, genes1);
        addLog('stage', `初始植物${id1}开始种子萌发`, { plantId: id1 });
      }
      const genes2 = createRandomGeneWeights();
      const id2 = addPlant({
        geneWeights: { ...genes2 },
        tagRole: 'mother',
        initialGrowthTime: 0,
      });
      if (id2) {
        registerPlantGenes(id2, genes2);
        addLog('stage', `初始植物${id2}开始种子萌发`, { plantId: id2 });
      }
    }
  }, []);
  return null;
}

export function SceneContainer() {
  return (
    <Canvas
      shadows
      camera={{ position: [14, 10, 14], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <SkyDome />
      <DynamicLights />
      <Lawn />
      <ScenePlants />
      <GrowthLoop />
      <SeedInitializer />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2 - 0.05}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />
      <fog attach="fog" args={['#616161', 25, 60]} />
    </Canvas>
  );
}
