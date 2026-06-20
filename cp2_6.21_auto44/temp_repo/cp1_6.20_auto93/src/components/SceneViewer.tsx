import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { MaterialConfig, EnvironmentPreset, LoadingState } from '../types';
import { loadModel, LoadProgress } from '../utils/modelLoader';

interface ModelProps {
  modelSrc: string;
  materialConfig: MaterialConfig;
  onLoadProgress: (progress: LoadProgress) => void;
  onLoadError: (error: Error) => void;
  onLoadComplete: () => void;
  transitionKey: number;
}

function ProceduralModel({ modelId, materialConfig }: { modelId: string; materialConfig: MaterialConfig }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [scale, setScale] = useState(0);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 500;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setScale(eased);
      setOpacity(eased);
      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [modelId]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: materialConfig.color,
      opacity: materialConfig.opacity * opacity,
      transparent: materialConfig.opacity < 1,
      metalness: materialConfig.metalness,
      roughness: materialConfig.roughness,
      emissive: materialConfig.color,
      emissiveIntensity: materialConfig.emissiveIntensity * 0.1,
      envMapIntensity: materialConfig.useEnvMap ? 1 : 0,
    });
  }, [materialConfig, opacity]);

  const geometry = useMemo(() => {
    switch (modelId) {
      case 'cube':
        return new THREE.BoxGeometry(2, 2, 2);
      case 'sphere':
        return new THREE.SphereGeometry(1.2, 64, 64);
      case 'torus':
        return new THREE.TorusGeometry(1, 0.4, 32, 100);
      case 'cylinder':
        return new THREE.CylinderGeometry(1, 1, 2.2, 64);
      case 'cone':
        return new THREE.ConeGeometry(1.2, 2.2, 64);
      case 'knot':
        return new THREE.TorusKnotGeometry(0.9, 0.3, 128, 32);
      default:
        return new THREE.BoxGeometry(2, 2, 2);
    }
  }, [modelId]);

  return (
    <mesh ref={meshRef} scale={scale} castShadow receiveShadow>
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function LoadedModel({ 
  modelSrc, 
  materialConfig,
  onLoadProgress,
  onLoadError,
  onLoadComplete,
  transitionKey
}: ModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [scale, setScale] = useState(0);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setScene(null);
    setScale(0);
    setOpacity(0);

    const load = async () => {
      try {
        const loadedScene = await loadModel(modelSrc, {
          onProgress: onLoadProgress,
          onError: onLoadError,
        });
        if (!cancelled) {
          setScene(loadedScene);
          onLoadComplete();
          const startTime = Date.now();
          const duration = 500;
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const t = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setScale(eased);
            setOpacity(eased);
            if (t < 1 && !cancelled) requestAnimationFrame(animate);
          };
          animate();
        }
      } catch (err) {
        if (!cancelled) {
          onLoadError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [modelSrc, transitionKey, onLoadProgress, onLoadError, onLoadComplete]);

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.color.set(materialConfig.color);
            mat.opacity = materialConfig.opacity * opacity;
            mat.transparent = materialConfig.opacity < 1;
            mat.metalness = materialConfig.metalness;
            mat.roughness = materialConfig.roughness;
            mat.emissive.set(materialConfig.color);
            mat.emissiveIntensity = materialConfig.emissiveIntensity * 0.1;
            mat.envMapIntensity = materialConfig.useEnvMap ? 1 : 0;
            mat.needsUpdate = true;
          }
        });
      }
    });
  }, [scene, materialConfig, opacity]);

  if (!scene) return null;

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

function EnvironmentSetup({ preset }: { preset: EnvironmentPreset }) {
  const { scene } = useThree();

  useEffect(() => {
    switch (preset) {
      case 'solid_gray':
        scene.background = new THREE.Color(0x2a2a3e);
        break;
      case 'outdoor_hdr':
        scene.background = new THREE.Color(0x87ceeb);
        break;
      case 'indoor_warm':
        scene.background = new THREE.Color(0x2d1f1a);
        break;
      case 'starry_night':
        scene.background = new THREE.Color(0x0a0a1a);
        break;
      default:
        scene.background = new THREE.Color(0x1a1a2e);
    }
  }, [preset, scene]);

  if (preset === 'outdoor_hdr') {
    return <Environment preset="sunset" />;
  }
  if (preset === 'starry_night') {
    return (
      <>
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.1} />
      </>
    );
  }
  if (preset === 'indoor_warm') {
    return <Environment preset="warm" />;
  }
  return null;
}

function SceneContent({
  modelId,
  modelSrc,
  materialConfig,
  envPreset,
  loadingState,
  onLoadProgress,
  onLoadError,
  onLoadComplete,
  transitionKey,
  useProcedural
}: {
  modelId: string;
  modelSrc: string;
  materialConfig: MaterialConfig;
  envPreset: EnvironmentPreset;
  loadingState: LoadingState;
  onLoadProgress: (progress: LoadProgress) => void;
  onLoadError: (error: Error) => void;
  onLoadComplete: () => void;
  transitionKey: number;
  useProcedural: boolean;
}) {
  return (
    <>
      <ambientLight intensity={envPreset === 'starry_night' ? 0.2 : 0.5} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={envPreset === 'indoor_warm' ? 1.2 : envPreset === 'starry_night' ? 0.3 : 1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-3, 2, -3]} intensity={0.3} />
      
      <EnvironmentSetup preset={envPreset} />

      {useProcedural ? (
        <ProceduralModel modelId={modelId} materialConfig={materialConfig} />
      ) : (
        <LoadedModel
          modelSrc={modelSrc}
          materialConfig={materialConfig}
          onLoadProgress={onLoadProgress}
          onLoadError={onLoadError}
          onLoadComplete={onLoadComplete}
          transitionKey={transitionKey}
        />
      )}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={10}
        enablePan={true}
        panSpeed={0.5}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />
    </>
  );
}

interface SceneViewerProps {
  modelId: string;
  modelSrc: string;
  materialConfig: MaterialConfig;
  envPreset: EnvironmentPreset;
  loadingState: LoadingState;
  loadProgress: LoadProgress | null;
  loadError: string | null;
  onLoadProgress: (progress: LoadProgress) => void;
  onLoadError: (error: Error) => void;
  onLoadComplete: () => void;
  onRetry: () => void;
  transitionKey: number;
  useProcedural: boolean;
}

export function SceneViewer({
  modelId,
  modelSrc,
  materialConfig,
  envPreset,
  loadingState,
  loadProgress,
  loadError,
  onLoadProgress,
  onLoadError,
  onLoadComplete,
  onRetry,
  transitionKey,
  useProcedural,
}: SceneViewerProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <SceneContent
          modelId={modelId}
          modelSrc={modelSrc}
          materialConfig={materialConfig}
          envPreset={envPreset}
          loadingState={loadingState}
          onLoadProgress={onLoadProgress}
          onLoadError={onLoadError}
          onLoadComplete={onLoadComplete}
          transitionKey={transitionKey}
          useProcedural={useProcedural}
        />
      </Canvas>

      {loadingState === 'loading' && !useProcedural && (
        <div style={loaderStyle}>
          <div style={spinnerStyle}>
            <div style={spinnerInnerStyle} />
          </div>
          <div style={progressTextStyle}>
            {loadProgress ? `${loadProgress.percentage}%` : '加载中...'}
          </div>
        </div>
      )}

      {loadingState === 'error' && !useProcedural && (
        <div style={errorContainerStyle}>
          <div style={errorCardStyle}>
            <div style={errorIconStyle}>!</div>
            <div style={errorTextStyle}>加载失败</div>
            <div style={errorDetailStyle}>{loadError || '未知错误'}</div>
            <button style={retryButtonStyle} onClick={onRetry}>
              重试
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const loaderStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(26, 26, 46, 0.7)',
  backdropFilter: 'blur(4px)',
  pointerEvents: 'none',
};

const spinnerStyle: React.CSSProperties = {
  width: 60,
  height: 60,
  borderRadius: '50%',
  border: '3px solid rgba(233, 69, 96, 0.2)',
  borderTopColor: '#e94560',
  animation: 'spin 1s linear infinite',
  marginBottom: 16,
};

const spinnerInnerStyle: React.CSSProperties = {};

const progressTextStyle: React.CSSProperties = {
  color: '#e0e0e0',
  fontSize: 16,
  fontWeight: 500,
};

const errorContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(26, 26, 46, 0.7)',
  backdropFilter: 'blur(4px)',
};

const errorCardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(22, 33, 62, 0.95)',
  borderRadius: 12,
  padding: 32,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  border: '1px solid rgba(233, 69, 96, 0.3)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
};

const errorIconStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: '50%',
  backgroundColor: 'rgba(233, 69, 96, 0.2)',
  color: '#e94560',
  fontSize: 28,
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 16,
};

const errorTextStyle: React.CSSProperties = {
  color: '#e94560',
  fontSize: 18,
  fontWeight: 600,
  marginBottom: 8,
};

const errorDetailStyle: React.CSSProperties = {
  color: '#a0a0b0',
  fontSize: 14,
  marginBottom: 20,
  textAlign: 'center',
};

const retryButtonStyle: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: '#e94560',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};
