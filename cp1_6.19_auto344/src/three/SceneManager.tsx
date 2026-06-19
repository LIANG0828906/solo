import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useExhibitStore } from '@/store/exhibitStore';
import { Exhibit, FLOOR_SIZE, LightConfig } from '@/types';
import { easeInOutCubic } from '@/utils/colorTemp';

interface ExhibitMeshProps {
  exhibit: Exhibit;
  isDragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrag: (id: string, position: { x: number; y: number; z: number }) => void;
}

function ExhibitMesh({ exhibit, isDragging, onDragStart, onDragEnd, onDrag }: ExhibitMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const offsetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const { camera, raycaster, pointer } = useThree();

  const handlePointerDown = useCallback(
    (e: any) => {
      e.stopPropagation();
      onDragStart(exhibit.id);
      const planeIntersect = new THREE.Vector3();
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(dragPlaneRef.current, planeIntersect)) {
        offsetRef.current.copy(planeIntersect).sub(meshRef.current!.position);
      }
      document.body.style.cursor = 'grabbing';
    },
    [exhibit.id, onDragStart, pointer, camera, raycaster]
  );

  const handlePointerMove = useCallback(
    (e: any) => {
      if (!isDragging) return;
      e.stopPropagation();
      const planeIntersect = new THREE.Vector3();
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(dragPlaneRef.current, planeIntersect)) {
        const newPos = planeIntersect.sub(offsetRef.current);
        newPos.y = 1.5;
        onDrag(exhibit.id, { x: newPos.x, y: newPos.y, z: newPos.z });
      }
    },
    [isDragging, exhibit.id, onDrag, pointer, camera, raycaster]
  );

  const handlePointerUp = useCallback(
    (e: any) => {
      e.stopPropagation();
      onDragEnd();
      document.body.style.cursor = hovered ? 'grab' : 'auto';
    },
    [onDragEnd, hovered]
  );

  useEffect(() => {
    if (shadowRef.current && meshRef.current) {
      shadowRef.current.position.x = meshRef.current.position.x;
      shadowRef.current.position.z = meshRef.current.position.z;
    }
  }, [exhibit.position]);

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[exhibit.position.x, exhibit.position.y, exhibit.position.z]}
        rotation={[exhibit.rotation.x, exhibit.rotation.y, exhibit.rotation.z]}
        scale={[exhibit.scale.x, exhibit.scale.y, exhibit.scale.z]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'grab';
        }}
        onPointerOut={() => {
          setHovered(false);
          if (!isDragging) document.body.style.cursor = 'auto';
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={exhibit.color}
          metalness={0.3}
          roughness={0.4}
          emissive={hovered || isDragging ? exhibit.color : '#000000'}
          emissiveIntensity={hovered || isDragging ? 0.2 : 0}
        />
      </mesh>

      <mesh
        ref={shadowRef}
        position={[exhibit.position.x, 0.01, exhibit.position.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={isDragging}
      >
        <circleGeometry args={[1.5, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function Lighting({ lightConfig }: { lightConfig: LightConfig }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const targetColorRef = useRef(new THREE.Color(lightConfig.color));
  const currentColorRef = useRef(new THREE.Color(lightConfig.color));

  useEffect(() => {
    targetColorRef.current.set(lightConfig.color);
  }, [lightConfig.color]);

  useFrame((_, delta) => {
    if (lightRef.current) {
      lightRef.current.position.set(
        lightConfig.position.x,
        lightConfig.position.y,
        lightConfig.position.z
      );
      lightRef.current.intensity = lightConfig.intensity;
      
      currentColorRef.current.lerp(targetColorRef.current, delta * 3);
      lightRef.current.color.copy(currentColorRef.current);
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight
        ref={lightRef}
        position={[lightConfig.position.x, lightConfig.position.y, lightConfig.position.z]}
        intensity={lightConfig.intensity}
        color={lightConfig.color}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <mesh
        position={[lightConfig.position.x, lightConfig.position.y, lightConfig.position.z]}
      >
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color={lightConfig.color} />
      </mesh>
    </>
  );
}

function Floor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
        <meshStandardMaterial color="#16213e" transparent opacity={0.8} />
      </mesh>
      <gridHelper
        args={[FLOOR_SIZE, 50, '#4a5568', '#2d3748']}
        position={[0, 0.001, 0]}
      />
    </group>
  );
}

interface CameraAnimatorProps {
  animateTo: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  } | null;
  onComplete: () => void;
  controlsRef: React.MutableRefObject<any>;
}

function CameraAnimator({ animateTo, onComplete, controlsRef }: CameraAnimatorProps) {
  const { camera } = useThree();
  const animationRef = useRef<{
    active: boolean;
    startTime: number;
    startPosition: THREE.Vector3;
    startTarget: THREE.Vector3;
    endPosition: THREE.Vector3;
    endTarget: THREE.Vector3;
  } | null>(null);

  useEffect(() => {
    if (animateTo && controlsRef.current) {
      animationRef.current = {
        active: true,
        startTime: performance.now(),
        startPosition: camera.position.clone(),
        startTarget: controlsRef.current.target.clone(),
        endPosition: new THREE.Vector3(
          animateTo.position.x,
          animateTo.position.y,
          animateTo.position.z
        ),
        endTarget: new THREE.Vector3(
          animateTo.target.x,
          animateTo.target.y,
          animateTo.target.z
        ),
      };
    }
  }, [animateTo, camera, controlsRef]);

  useFrame(() => {
    if (animationRef.current && animationRef.current.active) {
      const elapsed = performance.now() - animationRef.current.startTime;
      const duration = 1500;
      const t = Math.min(elapsed / duration, 1);
      const easedT = easeInOutCubic(t);

      camera.position.lerpVectors(
        animationRef.current.startPosition,
        animationRef.current.endPosition,
        easedT
      );
      controlsRef.current.target.lerpVectors(
        animationRef.current.startTarget,
        animationRef.current.endTarget,
        easedT
      );

      if (t >= 1) {
        animationRef.current.active = false;
        animationRef.current = null;
        onComplete();
      }
    }
  });

  return null;
}

interface SceneContentProps {
  animateTo: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  } | null;
  onAnimationComplete: () => void;
  setGetCameraState: (fn: () => {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  } | null) => void;
}

function SceneContent({ animateTo, onAnimationComplete, setGetCameraState }: SceneContentProps) {
  const { exhibits, lightConfig, draggingExhibitId, updateExhibitPosition, setDraggingExhibit } = useExhibitStore();
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    setGetCameraState(() => () => {
      if (controlsRef.current) {
        return {
          position: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
          },
          target: {
            x: controlsRef.current.target.x,
            y: controlsRef.current.target.y,
            z: controlsRef.current.target.z,
          },
        };
      }
      return null;
    });
  }, [camera, setGetCameraState]);

  const handleDragStart = useCallback((id: string) => {
    setDraggingExhibit(id);
  }, [setDraggingExhibit]);

  const handleDragEnd = useCallback(() => {
    setDraggingExhibit(null);
  }, [setDraggingExhibit]);

  const handleDrag = useCallback(
    (id: string, position: { x: number; y: number; z: number }) => {
      updateExhibitPosition(id, position);
    },
    [updateExhibitPosition]
  );

  return (
    <>
      <Lighting lightConfig={lightConfig} />
      <Floor />
      {exhibits.map((exhibit) => (
        <ExhibitMesh
          key={exhibit.id}
          exhibit={exhibit}
          isDragging={draggingExhibitId === exhibit.id}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrag={handleDrag}
        />
      ))}
      <CameraAnimator
        animateTo={animateTo}
        onComplete={onAnimationComplete}
        controlsRef={controlsRef}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />
    </>
  );
}

interface SceneManagerProps {
  animateTo: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  } | null;
  onAnimationComplete: () => void;
  getCameraState: () => {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  } | null;
  setGetCameraState: (fn: () => {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  } | null) => void;
}

export default function SceneManager({
  animateTo,
  onAnimationComplete,
  getCameraState,
  setGetCameraState,
}: SceneManagerProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 30, 40], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => {
        gl.setClearColor('#1a1a2e');
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <fog attach="fog" args={['#1a1a2e', 40, 80]} />
      <SceneContent
        animateTo={animateTo}
        onAnimationComplete={onAnimationComplete}
        setGetCameraState={setGetCameraState}
      />
    </Canvas>
  );
}
