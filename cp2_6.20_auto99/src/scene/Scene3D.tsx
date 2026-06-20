import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { GeoVolume } from './GeoVolume';
import { CrossSection } from './CrossSection';
import { AnnotationMarkers } from './AnnotationMarkers';
import { useGeoStore, StressPoint } from '@/store/useGeoStore';

export type ViewPreset = 'top' | 'side' | 'section' | 'global';

export interface Scene3DHandle {
  animateToView: (view: ViewPreset) => void;
  exportScreenshot: () => string | null;
}

interface CameraControllerProps {
  controlsRef: React.RefObject<any>;
}

function CameraController({ controlsRef }: CameraControllerProps) {
  const { camera } = useThree();
  const { setCameraState } = useGeoStore();

  useFrame(() => {
    if (controlsRef.current) {
      const target = controlsRef.current.target;
      setCameraState({
        position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        target: { x: target.x, y: target.y, z: target.z }
      });
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={50}
      makeDefault
    />
  );
}

function StressPoints({ points }: { points: StressPoint[] }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(points.length * 3);
    points.forEach((p, i) => {
      arr[i * 3] = p.position.x;
      arr[i * 3 + 1] = p.position.y;
      arr[i * 3 + 2] = p.position.z;
    });
    return arr;
  }, [points]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const material = ref.current.material as THREE.PointsMaterial;
    material.opacity = 0.5 + Math.sin(clock.elapsedTime * Math.PI * 2) * 0.5;
    material.size = 0.1 + Math.sin(clock.elapsedTime * Math.PI * 2) * 0.05;
  });

  if (points.length === 0) return null;

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ff4444"
        size={0.1}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

interface SceneContentProps {
  onVoxelClick: (pos: { x: number; y: number; z: number }, density: number) => void;
  controlsRef: React.RefObject<any>;
}

function SceneContent({ onVoxelClick, controlsRef }: SceneContentProps) {
  const { annotations, stressPoints, removeAnnotation } = useGeoStore();

  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#4a6cf7', '#1e2029', 0.25]} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.0}
        color="#f0f4ff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-8, -3, -10]} intensity={0.25} color="#8b9cf7" />
      <pointLight position={[0, 8, 0]} intensity={0.3} color="#4ade80" distance={25} decay={2} />
      <pointLight position={[-6, -4, 6]} intensity={0.15} color="#f59e0b" distance={20} decay={2} />
      
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
      
      <GeoVolume onVoxelClick={onVoxelClick} />
      
      <CrossSection axis="x" />
      <CrossSection axis="y" />
      <CrossSection axis="z" />
      
      <AnnotationMarkers annotations={annotations} onRemove={removeAnnotation} />
      <StressPoints points={stressPoints} />
      
      <CameraController controlsRef={controlsRef} />
    </>
  );
}

interface Scene3DProps {
  onVoxelClick?: (pos: { x: number; y: number; z: number }, density: number) => void;
}

export const Scene3D = forwardRef<Scene3DHandle, Scene3DProps>(({ onVoxelClick }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useImperativeHandle(ref, () => ({
    animateToView: (view: ViewPreset) => {
      if (!controlsRef.current || !cameraRef.current) return;

      const controls = controlsRef.current;
      const camera = cameraRef.current;

      let targetPos = { x: 0, y: 0, z: 0 };
      let targetLook = { x: 0, y: 0, z: 0 };

      switch (view) {
        case 'top':
          targetPos = { x: 0, y: 25, z: 0.01 };
          targetLook = { x: 0, y: 0, z: 0 };
          break;
        case 'side':
          targetPos = { x: 25, y: 0, z: 0 };
          targetLook = { x: 0, y: 0, z: 0 };
          break;
        case 'section':
          targetPos = { x: 15, y: 10, z: 15 };
          targetLook = { x: 0, y: 0, z: 0 };
          break;
        case 'global':
          targetPos = { x: 20, y: 15, z: 20 };
          targetLook = { x: 0, y: 0, z: 0 };
          break;
      }

      gsap.to(camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 0.8,
        ease: 'power2.inOut',
        onUpdate: () => {
          controls.target.set(targetLook.x, targetLook.y, targetLook.z);
          controls.update();
        }
      });
    },
    exportScreenshot: () => {
      if (!canvasRef.current) return null;
      return canvasRef.current.toDataURL('image/png');
    }
  }));

  const handleCreated = ({ gl, camera }: any) => {
    canvasRef.current = gl.domElement;
    cameraRef.current = camera;
  };

  return (
    <Canvas
      camera={{ position: [20, 15, 20], fov: 45 }}
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
      style={{ width: '100%', height: '100%', background: '#0a0b10' }}
      dpr={[1, 2]}
      onCreated={handleCreated}
    >
      <color attach="background" args={['#0a0b10']} />
      <fog attach="fog" args={['#0a0b10', 30, 60]} />
      <SceneContent 
        onVoxelClick={onVoxelClick || (() => {})} 
        controlsRef={controlsRef}
      />
    </Canvas>
  );
});

Scene3D.displayName = 'Scene3D';

export default Scene3D;
