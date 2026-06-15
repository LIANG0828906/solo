import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TerrainParams, VoxelData } from '../utils/terrainGenerator';
import { generateTerrain, exportHeightmapJSON } from '../utils/terrainGenerator';
import VoxelTerrain from './VoxelTerrain';
import ControlPanel from './ControlPanel';

const WORLD_SIZE = 56;

const DEFAULT_PARAMS: TerrainParams = {
  amplitude: 64,
  treeDensity: 48,
  waterRatio: 42,
  caveComplexity: 1,
  seed: undefined,
};

const INITIAL_SEED = 133742069;

export default function WorldGenerator() {
  const [params, setParams] = useState<TerrainParams>(DEFAULT_PARAMS);
  const [voxelData, setVoxelData] = useState<VoxelData | null>(null);
  const [prevVoxelData, setPrevVoxelData] = useState<VoxelData | null>(null);
  const [generationKey, setGenerationKey] = useState(0);
  const debounceRef = useRef<number | null>(null);
  const initialSeed = useRef<number>(INITIAL_SEED);

  const triggerGeneration = useCallback(
    (newParams: TerrainParams, savePrev: boolean = true) => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      debounceRef.current = window.setTimeout(() => {
        const genParams = { ...newParams };
        if (genParams.seed === undefined) {
          genParams.seed = initialSeed.current;
        }
        if (savePrev) {
          setPrevVoxelData(voxelData);
        }
        const newData = generateTerrain(genParams, WORLD_SIZE);
        setVoxelData(newData);
        setGenerationKey((k) => k + 1);
      }, 90);
    },
    [voxelData]
  );

  useEffect(() => {
    triggerGeneration({ ...params, seed: initialSeed.current }, false);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
     
  }, []);

  const handleParamsChange = useCallback(
    (newParams: TerrainParams) => {
      setParams(newParams);
      triggerGeneration(newParams, true);
    },
    [triggerGeneration]
  );

  const handleRegenerate = useCallback(() => {
    const newSeed = Date.now();
    initialSeed.current = newSeed;
    const newParams = { ...params, seed: newSeed };
    setParams(newParams);
    triggerGeneration(newParams, true);
  }, [params, triggerGeneration]);

  const handleExport = useCallback(() => {
    if (!voxelData) return;
    const json = exportHeightmapJSON(voxelData);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `abyss-echo-heightmap-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [voxelData]);

  const skyColor = useMemo(() => new THREE.Color('#0c1a2e'), []);

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        dpr={[1, 2]}
        camera={{
          position: [32, 36, 64],
          fov: 50,
          near: 0.1,
          far: 600,
        }}
        onCreated={({ gl, scene, camera }) => {
          gl.setClearColor(skyColor);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          scene.fog = new THREE.FogExp2('#0f1e38', 0.011);
          camera.lookAt(0, 6, 0);
        }}
      >
        <color attach="background" args={[skyColor]} />

        <VoxelTerrain
          voxelData={voxelData}
          prevVoxelData={prevVoxelData}
          generationKey={generationKey}
        />

        <StarsLayer />
      </Canvas>

      <ControlPanel
        params={params}
        onParamsChange={handleParamsChange}
        onExport={handleExport}
        onRegenerate={handleRegenerate}
      />

      <HudOverlay voxelData={voxelData} />
    </div>
  );
}

function StarsLayer() {
  const starsRef = useRef<THREE.Points>(null);
  const count = 500;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 180 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.45;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = Math.max(40, r * Math.cos(phi));
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, []);

  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const brightness = 0.7 + Math.random() * 0.3;
      if (t < 0.7) {
        arr[i * 3] = brightness;
        arr[i * 3 + 1] = brightness * 0.92;
        arr[i * 3 + 2] = brightness * 0.85;
      } else if (t < 0.9) {
        arr[i * 3] = brightness * 0.7;
        arr[i * 3 + 1] = brightness * 0.82;
        arr[i * 3 + 2] = brightness;
      } else {
        arr[i * 3] = brightness;
        arr[i * 3 + 1] = brightness * 0.75;
        arr[i * 3 + 2] = brightness * 0.68;
      }
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = clock.getElapsedTime() * 0.004;
    }
  });

  return (
    <points ref={starsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.1}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function HudOverlay({ voxelData }: { voxelData: VoxelData | null }) {
  if (!voxelData) return null;
  const maxH = Math.max(...voxelData.heights.flat());
  return (
    <div className="hud-overlay">
      <div className="hud-item">
        <span className="hud-label">方块尺寸</span>
        <span className="hud-value">{voxelData.size} × {voxelData.size}</span>
      </div>
      <div className="hud-item">
        <span className="hud-label">最高海拔</span>
        <span className="hud-value">{maxH}</span>
      </div>
      <div className="hud-item">
        <span className="hud-label">水位线</span>
        <span className="hud-value">{voxelData.waterLevel}</span>
      </div>
      <div className="hud-item">
        <span className="hud-label">树木</span>
        <span className="hud-value">{voxelData.treePositions.length}</span>
      </div>
      <style>{`
        .hud-overlay {
          position: fixed;
          left: 20px;
          bottom: 22px;
          display: flex;
          gap: 14px;
          z-index: 50;
          pointer-events: none;
        }
        .hud-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 10px 16px;
          background: rgba(16, 28, 52, 0.55);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(120, 160, 230, 0.18);
          border-radius: 12px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.3);
          min-width: 78px;
        }
        .hud-label {
          font-size: 10px;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          color: #7a8fb3;
          font-weight: 600;
        }
        .hud-value {
          font-size: 15px;
          font-weight: 700;
          color: #dfe9fb;
          font-variant-numeric: tabular-nums;
          background: linear-gradient(135deg, #ffffff, #a8c5ff);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
}
