import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
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
  const outlineRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current && meshRef.current.material instanceof THREE.MeshStandardMaterial) {
      meshRef.current.material.transparent = true;
      meshRef.current.material.opacity = opacity;
      meshRef.current.material.depthWrite = opacity > 0.5;
    }
    if (outlineRef.current && outlineRef.current.material instanceof THREE.MeshBasicMaterial) {
      outlineRef.current.material.transparent = true;
      outlineRef.current.material.opacity = isHighlighted ? 0.8 * opacity : 0;
    }
  });

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    onClick(building);
  }, [onClick, building]);

  const handlePointerOver = useCallback((e: any) => {
    e.stopPropagation();
    setHovered(true);
    onHover(building);
    document.body.style.cursor = 'pointer';
  }, [onHover, building]);

  const handlePointerOut = useCallback((e: any) => {
    e.stopPropagation();
    setHovered(false);
    onHover(null);
    document.body.style.cursor = 'auto';
  }, [onHover]);

  const outlineScale = 1.08;

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[building.position[0], building.height / 2, building.position[2]]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
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

      {isHighlighted && (
        <mesh
          ref={outlineRef}
          position={[building.position[0], building.height / 2, building.position[2]]}
          scale={outlineScale}
        >
          <boxGeometry args={[4, building.height, 4]} />
          <meshBasicMaterial
            color="#00d4ff"
            transparent
            opacity={0}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {hovered && (
        <Html
          position={[building.position[0], building.height + 2, building.position[2]]}
          center
          distanceFactor={10}
          style={{ pointerEvents: 'none' }}
        >
          <div className="building-label">{building.name}</div>
        </Html>
      )}
    </group>
  );
}

interface CityGroupProps {
  buildings: Building[];
  opacity: number;
  highlightedBuildingId: string | null;
  onBuildingClick: (building: Building) => void;
}

function CityGroup({ buildings, opacity, highlightedBuildingId, onBuildingClick }: CityGroupProps) {
  return (
    <group>
      {buildings.map(building => (
        <BuildingMesh
          key={building.id}
          building={building}
          opacity={opacity}
          isHighlighted={highlightedBuildingId === building.id}
          onClick={onBuildingClick}
          onHover={() => {}}
        />
      ))}
    </group>
  );
}

interface SingleSceneProps {
  oldModel: ModelData | null;
  newModel: ModelData | null;
  oldOpacity: number;
  newOpacity: number;
  highlightedBuildingId: string | null;
  onBuildingClick: (building: Building) => void;
  controlsRef: React.MutableRefObject<any>;
  resetTrigger: number;
}

function SingleScene({
  oldModel,
  newModel,
  oldOpacity,
  newOpacity,
  highlightedBuildingId,
  onBuildingClick,
  controlsRef,
  resetTrigger
}: SingleSceneProps) {
  const { camera } = useThree();
  const initialPosition = useMemo(() => new THREE.Vector3(21, 21, 21), []);
  const initialTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useEffect(() => {
    gsap.to(camera.position, {
      x: initialPosition.x,
      y: initialPosition.y,
      z: initialPosition.z,
      duration: 1,
      ease: 'power2.inOut'
    });

    if (controlsRef.current) {
      gsap.to(controlsRef.current.target, {
        x: initialTarget.x,
        y: initialTarget.y,
        z: initialTarget.z,
        duration: 1,
        ease: 'power2.inOut'
      });
    }
  }, [resetTrigger, camera, initialPosition, initialTarget, controlsRef]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <directionalLight position={[-10, 10, -10]} intensity={0.5} />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          color="#2a2a4a"
          transparent
          opacity={0.35}
        />
      </mesh>

      <gridHelper args={[100, 20, '#3a3a5a', '#3a3a5a']} position={[0, 0.01, 0]} />

      {oldModel && oldOpacity > 0.01 && (
        <CityGroup
          buildings={oldModel.buildings}
          opacity={oldOpacity}
          highlightedBuildingId={highlightedBuildingId}
          onBuildingClick={onBuildingClick}
        />
      )}

      {newModel && newOpacity > 0.01 && (
        <CityGroup
          buildings={newModel.buildings}
          opacity={newOpacity}
          highlightedBuildingId={highlightedBuildingId}
          onBuildingClick={onBuildingClick}
        />
      )}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

interface SplitSceneProps {
  model: ModelData | null;
  highlightedBuildingId: string | null;
  onBuildingClick: (building: Building) => void;
  controlsRef: React.MutableRefObject<any>;
  resetTrigger: number;
  syncCameraRef?: React.MutableRefObject<{ position: THREE.Vector3; target: THREE.Vector3 } | null>;
  isSource?: boolean;
}

function SplitScene({
  model,
  highlightedBuildingId,
  onBuildingClick,
  controlsRef,
  resetTrigger,
  syncCameraRef,
  isSource = false
}: SplitSceneProps) {
  const { camera } = useThree();
  const initialPosition = useMemo(() => new THREE.Vector3(21, 21, 21), []);
  const initialTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useEffect(() => {
    gsap.to(camera.position, {
      x: initialPosition.x,
      y: initialPosition.y,
      z: initialPosition.z,
      duration: 1,
      ease: 'power2.inOut'
    });

    if (controlsRef.current) {
      gsap.to(controlsRef.current.target, {
        x: initialTarget.x,
        y: initialTarget.y,
        z: initialTarget.z,
        duration: 1,
        ease: 'power2.inOut'
      });
    }
  }, [resetTrigger, camera, initialPosition, initialTarget, controlsRef]);

  useFrame(() => {
    if (syncCameraRef && controlsRef.current) {
      if (isSource) {
        syncCameraRef.current = {
          position: camera.position.clone(),
          target: controlsRef.current.target.clone()
        };
      } else if (syncCameraRef.current) {
        camera.position.copy(syncCameraRef.current.position);
        controlsRef.current.target.copy(syncCameraRef.current.target);
        controlsRef.current.update();
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <directionalLight position={[-10, 10, -10]} intensity={0.5} />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#2a2a4a" transparent opacity={0.35} />
      </mesh>

      <gridHelper args={[100, 20, '#3a3a5a', '#3a3a5a']} position={[0, 0.01, 0]} />

      {model && (
        <CityGroup
          buildings={model.buildings}
          opacity={1}
          highlightedBuildingId={highlightedBuildingId}
          onBuildingClick={onBuildingClick}
        />
      )}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.1}
        enabled={isSource}
      />
    </>
  );
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
  const [oldModel, setOldModel] = useState<ModelData | null>(null);
  const [newModel, setNewModel] = useState<ModelData | null>(null);
  const [oldOpacity, setOldOpacity] = useState(0);
  const [newOpacity, setNewOpacity] = useState(1);
  const singleControlsRef = useRef<any>(null);
  const leftControlsRef = useRef<any>(null);
  const rightControlsRef = useRef<any>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const syncCameraRef = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  const oldYear = 2000;
  const newYear = 2024;

  useEffect(() => {
    let isMounted = true;
    fetchModelUrl(oldYear).then(data => {
      if (isMounted) {
        setOldModel(data);
        onModelLoaded(oldYear, data);
      }
    });
    return () => { isMounted = false; };
  }, [oldYear, onModelLoaded]);

  useEffect(() => {
    let isMounted = true;
    fetchModelUrl(newYear).then(data => {
      if (isMounted) {
        setNewModel(data);
        onModelLoaded(newYear, data);
      }
    });
    return () => { isMounted = false; };
  }, [newYear, onModelLoaded]);

  useEffect(() => {
    if (transitionTimelineRef.current) {
      transitionTimelineRef.current.kill();
    }

    if (isTransitioning) {
      const targetToNew = currentYear === newYear;

      transitionTimelineRef.current = gsap.timeline({
        onComplete: () => {
          transitionTimelineRef.current = null;
        }
      });

      const opacityState = { oldValue: targetToNew ? 1 : 0, newValue: targetToNew ? 0 : 1 };

      transitionTimelineRef.current.to(opacityState, {
        oldValue: targetToNew ? 0 : 1,
        newValue: targetToNew ? 1 : 0,
        duration: 1,
        ease: 'power2.inOut',
        onUpdate: () => {
          setOldOpacity(opacityState.oldValue);
          setNewOpacity(opacityState.newValue);
        }
      });
    } else {
      const targetToNew = currentYear === newYear;
      setOldOpacity(targetToNew ? 0 : 1);
      setNewOpacity(targetToNew ? 1 : 0);
    }

    return () => {
      if (transitionTimelineRef.current) {
        transitionTimelineRef.current.kill();
      }
    };
  }, [currentYear, isTransitioning, oldYear, newYear]);

  const handleBuildingClickInternal = useCallback(async (building: Building) => {
    const info = await fetchBuildingInfo(building.id);
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
  }, [onBuildingClick]);

  const sharedCameraProps = useMemo(() => ({
    fov: 50,
    near: 0.1,
    far: 1000,
    position: [21, 21, 21] as [number, number, number]
  }), []);

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
            <SplitScene
              model={oldModel}
              highlightedBuildingId={highlightedBuildingId}
              onBuildingClick={handleBuildingClickInternal}
              controlsRef={leftControlsRef}
              resetTrigger={resetTrigger}
              syncCameraRef={syncCameraRef}
              isSource={true}
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
            <SplitScene
              model={newModel}
              highlightedBuildingId={highlightedBuildingId}
              onBuildingClick={handleBuildingClickInternal}
              controlsRef={rightControlsRef}
              resetTrigger={resetTrigger}
              syncCameraRef={syncCameraRef}
              isSource={false}
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

        <SingleScene
          oldModel={oldModel}
          newModel={newModel}
          oldOpacity={oldOpacity}
          newOpacity={newOpacity}
          highlightedBuildingId={highlightedBuildingId}
          onBuildingClick={handleBuildingClickInternal}
          controlsRef={singleControlsRef}
          resetTrigger={resetTrigger}
        />
      </Canvas>
    </div>
  );
}
