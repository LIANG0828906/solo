import { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Outlines, Html } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { fetchModelUrl, fetchBuildingInfo } from '../api';
import type { Building, ModelData, BuildingInfo } from '../types';
import './SceneViewer.css';

interface SceneViewerProps {
  currentYear: number;
  isSplitMode: boolean;
  isTransitioning: boolean;
  onBuildingClick: (building: BuildingInfo | null) => void;
  onModelLoaded: (year: number, data: ModelData) => void;
  resetTrigger: number;
}

interface BuildingMeshProps {
  building: Building;
  opacity: number;
  isHighlighted: boolean;
  onClick: (building: Building) => void;
  onHover: (building: Building | null) => void;
}

function BuildingMesh({ building, opacity, isHighlighted, onClick, onHover }: BuildingMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current && meshRef.current.material instanceof THREE.MeshStandardMaterial) {
      meshRef.current.material.transparent = true;
      meshRef.current.material.opacity = opacity;
    }
  });

  const meshElement = (
    <mesh
      ref={meshRef}
      position={[building.position[0], building.height / 2, building.position[2]]}
      onClick={(e) => {
        e.stopPropagation();
        onClick(building);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(building);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        onHover(null);
        document.body.style.cursor = 'auto';
      }}
    >
      <boxGeometry args={[4, building.height, 4]} />
      <meshStandardMaterial
        color={building.color}
        transparent
        opacity={opacity}
        metalness={0.3}
        roughness={0.7}
      />
    </mesh>
  );

  return (
    <group>
      {isHighlighted ? (
        <Outlines
          color="#00d4ff"
          thickness={2}
          transparent
          opacity={opacity}
        >
          {meshElement}
        </Outlines>
      ) : (
        meshElement
      )}
      {hovered && (
        <Html
          position={[building.position[0], building.height + 2, building.position[2]]}
          center
          distanceFactor={10}
        >
          <div className="building-label">{building.name}</div>
        </Html>
      )}
    </group>
  );
}

interface CitySceneProps {
  modelData: ModelData | null;
  opacity: number;
  highlightedBuildingId: string | null;
  onBuildingClick: (building: Building) => void;
  controlsRef?: React.RefObject<any>;
  resetTrigger: number;
}

function CityScene({
  modelData,
  opacity,
  highlightedBuildingId,
  onBuildingClick,
  controlsRef,
  resetTrigger
}: CitySceneProps) {
  const { camera } = useThree();
  const localControlsRef = useRef<any>(null);

  const initialPosition = useMemo(() => [21, 21, 21] as [number, number, number], []);
  const initialTarget = useMemo(() => [0, 0, 0] as [number, number, number], []);

  useEffect(() => {
    const targetPosition = new THREE.Vector3(...initialPosition);
    const targetLookAt = new THREE.Vector3(...initialTarget);
    
    gsap.to(camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: 1,
      ease: 'power2.inOut'
    });

    if (localControlsRef.current) {
      gsap.to(localControlsRef.current.target, {
        x: targetLookAt.x,
        y: targetLookAt.y,
        z: targetLookAt.z,
        duration: 1,
        ease: 'power2.inOut'
      });
    }
  }, [resetTrigger, camera, initialPosition, initialTarget]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <directionalLight position={[-10, 10, -10]} intensity={0.5} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#2a2a4a" transparent opacity={opacity * 0.5} />
      </mesh>

      <gridHelper args={[100, 20, '#3a3a5a', '#3a3a5a']} position={[0, 0.01, 0]} />

      {modelData?.buildings.map(building => (
        <BuildingMesh
          key={building.id}
          building={building}
          opacity={opacity}
          isHighlighted={highlightedBuildingId === building.id}
          onClick={onBuildingClick}
          onHover={() => {}}
        />
      ))}

      <OrbitControls
        ref={controlsRef || localControlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

interface SceneWrapperProps {
  year: number;
  opacity: number;
  highlightedBuildingId: string | null;
  onBuildingClick: (building: BuildingInfo | null) => void;
  onModelLoaded: (year: number, data: ModelData) => void;
  controlsRef?: React.RefObject<any>;
  resetTrigger: number;
}

function SceneWrapper({
  year,
  opacity,
  highlightedBuildingId,
  onBuildingClick,
  onModelLoaded,
  controlsRef,
  resetTrigger
}: SceneWrapperProps) {
  const [modelData, setModelData] = useState<ModelData | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchModelUrl(year).then(data => {
      if (isMounted) {
        setModelData(data);
        onModelLoaded(year, data);
      }
    });
    return () => { isMounted = false; };
  }, [year, onModelLoaded]);

  const handleBuildingClick = async (building: Building) => {
    const info = await fetchBuildingInfo(building.id);
    onBuildingClick(info);
  };

  return (
    <CityScene
      modelData={modelData}
      opacity={opacity}
      highlightedBuildingId={highlightedBuildingId}
      onBuildingClick={handleBuildingClick}
      controlsRef={controlsRef}
      resetTrigger={resetTrigger}
    />
  );
}

function CameraController({
  sourceRef,
  targetRef
}: {
  sourceRef: React.RefObject<any>;
  targetRef: React.RefObject<any>;
}) {
  useFrame(() => {
    if (sourceRef.current && targetRef.current) {
      targetRef.current.target.copy(sourceRef.current.target);
    }
  });
  return null;
}

export default function SceneViewer({
  currentYear,
  isSplitMode,
  isTransitioning,
  onBuildingClick,
  onModelLoaded,
  resetTrigger
}: SceneViewerProps) {
  const [highlightedBuildingId, setHighlightedBuildingId] = useState<string | null>(null);
  const [fadeProgress, setFadeProgress] = useState(0);
  const leftControlsRef = useRef<any>(null);
  const rightControlsRef = useRef<any>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const oldYear = 2000;
  const newYear = 2024;

  useEffect(() => {
    if (isTransitioning) {
      const startTime = Date.now();
      const duration = 1000;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI);
        
        if (currentYear === oldYear) {
          setFadeProgress(1 - eased);
        } else {
          setFadeProgress(eased);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    } else {
      setFadeProgress(currentYear === newYear ? 1 : 0);
    }
  }, [currentYear, isTransitioning, oldYear, newYear]);

  const handleBuildingClickInternal = (info: BuildingInfo | null) => {
    if (info) {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      setHighlightedBuildingId(info.id);
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedBuildingId(null);
      }, 2000);
    }
    onBuildingClick(info);
  };

  const sharedCameraProps = {
    fov: 50,
    near: 0.1,
    far: 1000,
    position: [21, 21, 21] as [number, number, number]
  };

  if (isSplitMode) {
    return (
      <div className="scene-container split-mode">
        <div className="scene-view left-view">
          <div className="view-label">2000年</div>
          <Canvas
            camera={sharedCameraProps}
            shadows
            gl={{ antialias: true, alpha: false }}
          >
            <color attach="background" args={['#1a1a2e']} />
            <fog attach="fog" args={['#1a1a2e', 50, 100]} />
            <SceneWrapper
              year={2000}
              opacity={1}
              highlightedBuildingId={highlightedBuildingId}
              onBuildingClick={handleBuildingClickInternal}
              onModelLoaded={onModelLoaded}
              controlsRef={leftControlsRef}
              resetTrigger={resetTrigger}
            />
            <CameraController
              sourceRef={leftControlsRef}
              targetRef={rightControlsRef}
            />
          </Canvas>
        </div>
        <div className="split-divider"></div>
        <div className="scene-view right-view">
          <div className="view-label">2024年</div>
          <Canvas
            camera={sharedCameraProps}
            shadows
            gl={{ antialias: true, alpha: false }}
          >
            <color attach="background" args={['#1a1a2e']} />
            <fog attach="fog" args={['#1a1a2e', 50, 100]} />
            <SceneWrapper
              year={2024}
              opacity={1}
              highlightedBuildingId={highlightedBuildingId}
              onBuildingClick={handleBuildingClickInternal}
              onModelLoaded={onModelLoaded}
              controlsRef={rightControlsRef}
              resetTrigger={resetTrigger}
            />
          </Canvas>
        </div>
      </div>
    );
  }

  return (
    <div className="scene-container">
      <Canvas
        camera={sharedCameraProps}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#1a1a2e']} />
        <fog attach="fog" args={['#1a1a2e', 50, 100]} />
        
        <SceneWrapper
          year={oldYear}
          opacity={1 - fadeProgress}
          highlightedBuildingId={highlightedBuildingId}
          onBuildingClick={handleBuildingClickInternal}
          onModelLoaded={onModelLoaded}
          resetTrigger={resetTrigger}
        />
        
        <SceneWrapper
          year={newYear}
          opacity={fadeProgress}
          highlightedBuildingId={highlightedBuildingId}
          onBuildingClick={handleBuildingClickInternal}
          onModelLoaded={onModelLoaded}
          resetTrigger={resetTrigger}
        />
      </Canvas>
    </div>
  );
}
