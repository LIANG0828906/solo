import { useRef, useCallback, useEffect, useState, createContext, useContext } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { StarField } from './components/StarField';
import { GalaxyBackground } from './components/GalaxyBackground';
import { StarInfo } from './components/StarInfo';
import { ConstellationEditor } from './components/ConstellationEditor';
import { SearchBar } from './components/SearchBar';
import { ControlButtons } from './components/ControlButtons';
import { useStarStore } from './store/starStore';
import { useFpsMonitor } from './hooks/useFpsMonitor';
import { useCameraFlight } from './hooks/useCameraFlight';
import { useTouchControls } from './hooks/useTouchControls';
import './App.css';

interface CameraContextType {
  flyTo: (position: [number, number, number], starId?: string) => void;
  controlsRef: React.RefObject<OrbitControlsImpl>;
}

const CameraContext = createContext<CameraContextType | null>(null);

export function useCamera() {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCamera must be used within CameraProvider');
  }
  return context;
}

function Scene3D({ onCameraReady }: { onCameraReady: (ctx: CameraContextType) => void }) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const isFlying = useStarStore((state) => state.isFlying);
  const setCameraState = useStarStore((state) => state.setCameraState);

  useFpsMonitor();
  const { flyTo } = useCameraFlight(controlsRef, { duration: 2000 });
  const { setContainer } = useTouchControls(controlsRef, {
    minDistance: 5,
    maxDistance: 200,
  });

  const handleStarClick = useCallback(() => {}, []);

  const handleStarDragStart = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }
  }, []);

  const handleStarDragEnd = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }
  }, []);

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas && canvas.parentElement) {
      setContainer(canvas.parentElement as HTMLDivElement);
    }
  }, [setContainer]);

  useEffect(() => {
    onCameraReady({ flyTo, controlsRef });
  }, [onCameraReady, flyTo, controlsRef]);

  return (
    <>
      <ambientLight intensity={0.1} />

      <GalaxyBackground />
      <StarField
        onStarClick={handleStarClick}
        onStarDragStart={handleStarDragStart}
        onStarDragEnd={handleStarDragEnd}
      />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={200}
        enablePan={false}
        zoomSpeed={0.8}
        rotateSpeed={0.5}
        autoRotate
        autoRotateSpeed={0.3}
        enabled={!isFlying}
        onEnd={() => {
          if (controlsRef.current) {
            const { position } = controlsRef.current.object;
            const { target } = controlsRef.current;
            setCameraState({
              position: [position.x, position.y, position.z],
              target: [target.x, target.y, target.z],
            });
          }
        }}
      />

      <Stars
        radius={300}
        depth={60}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />
    </>
  );
}

function SceneContainer({ onCameraReady }: { onCameraReady: (ctx: CameraContextType) => void }) {
  return (
    <Canvas
      camera={{ position: [0, 30, 80], fov: 60, near: 0.1, far: 1000 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <color attach="background" args={['#000008']} />
      <fog attach="fog" args={['#000008', 50, 250]} />
      <Scene3D onCameraReady={onCameraReady} />
    </Canvas>
  );
}

function FpsDisplay() {
  const fps = useStarStore((state) => state.fps);
  const visibleStarCount = useStarStore((state) => state.visibleStarCount);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        setShow((s) => !s);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!show) return null;

  return (
    <div className="fps-display">
      <div className="fps-row">
        <span className="fps-label">FPS:</span>
        <span className={`fps-value ${fps < 50 ? 'low' : fps < 58 ? 'medium' : 'high'}`}>
          {fps.toFixed(0)}
        </span>
      </div>
      <div className="fps-row">
        <span className="fps-label">Stars:</span>
        <span className="fps-value">{visibleStarCount}</span>
      </div>
    </div>
  );
}

export function App() {
  const [cameraCtx, setCameraCtx] = useState<CameraContextType | null>(null);

  const findStarByName = useStarStore((state) => state.findStarByName);

  const handleSearch = useCallback(
    (starName: string): boolean => {
      const star = findStarByName(starName);
      if (star && cameraCtx) {
        cameraCtx.flyTo([star.x, star.y, star.z], star.id);
        return true;
      }
      return false;
    },
    [findStarByName, cameraCtx]
  );

  const handleCameraReady = useCallback((ctx: CameraContextType) => {
    setCameraCtx(ctx);
  }, []);

  return (
    <div className="app-container">
      <div className="background-gradient" />
      <CameraContext.Provider value={cameraCtx}>
        <SceneContainer onCameraReady={handleCameraReady} />
        <SearchBar onSearch={handleSearch} />
        <StarInfo />
        <ConstellationEditor />
        <ControlButtons />
        <FpsDisplay />
      </CameraContext.Provider>
    </div>
  );
}
