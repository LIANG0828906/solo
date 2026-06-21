import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import type { Exhibit, PathPoint } from '@/types';
import { useSceneStore } from '@/store/useSceneStore';

interface ExhibitMeshProps {
  exhibit: Exhibit;
  isSelected: boolean;
  isOccluded: boolean;
  onSelect: () => void;
  onDragStart: (id: string) => void;
}

function ExhibitMesh({
  exhibit,
  isSelected,
  isOccluded,
  onSelect,
  onDragStart,
}: ExhibitMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [spawnScale, setSpawnScale] = useState(0);
  const [spawnOpacity, setSpawnOpacity] = useState(0);
  const spawnTimeRef = useRef(0);
  const spawned = useRef(false);
  const outlineRef = useRef<THREE.LineSegments>(null);

  const outlineGeometry = useMemo(() => {
    let geo: THREE.BufferGeometry;
    switch (exhibit.type) {
      case 'cube':
        geo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
        break;
      case 'sphere':
        geo = new THREE.SphereGeometry(0.51, 32, 32);
        break;
      case 'cylinder':
        geo = new THREE.CylinderGeometry(0.51, 0.51, 1.02, 32);
        break;
      case 'torus':
        geo = new THREE.TorusGeometry(0.51, 0.21, 16, 32);
        break;
      default:
        geo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
    }
    return new THREE.EdgesGeometry(geo);
  }, [exhibit.type]);

  useFrame((_, delta) => {
    if (spawned.current) return;
    spawnTimeRef.current += delta;
    const progress = Math.min(spawnTimeRef.current / 0.3, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    setSpawnScale(easeProgress);
    setSpawnOpacity(easeProgress);
    if (progress >= 1) spawned.current = true;
  });

  useFrame(({ clock }) => {
    if (isSelected && outlineRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * Math.PI * 2) * 0.03;
      outlineRef.current.scale.setScalar(pulse);
    }
  });

  const handlePointerDown = useCallback(
    (e: any) => {
      e.stopPropagation();
      onSelect();
      onDragStart(exhibit.id);
    },
    [exhibit.id, onSelect, onDragStart]
  );

  const handlePointerOver = useCallback((e: any) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  }, []);

  const finalColor = isOccluded ? '#FF4444' : exhibit.color;
  const finalOpacity = isOccluded ? 0.3 : exhibit.opacity;

  const renderGeometry = () => {
    switch (exhibit.type) {
      case 'cube':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'sphere':
        return <sphereGeometry args={[0.5, 32, 32]} />;
      case 'cylinder':
        return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case 'torus':
        return <torusGeometry args={[0.5, 0.2, 16, 32]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <group
      ref={groupRef}
      position={exhibit.position}
      rotation={exhibit.rotation}
      scale={spawnScale * exhibit.scale}
    >
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {renderGeometry()}
        <meshStandardMaterial
          color={finalColor}
          transparent={isOccluded || exhibit.opacity < 1}
          opacity={spawnOpacity * finalOpacity}
          roughness={0.3}
          metalness={0.1}
          emissive={hovered || isSelected ? '#0f3460' : '#000000'}
          emissiveIntensity={hovered || isSelected ? 0.15 : 0}
        />
      </mesh>

      {isOccluded && (
        <mesh>
          {renderGeometry()}
          <meshBasicMaterial
            color="#FF4444"
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      )}

      {isSelected && (
        <lineSegments ref={outlineRef} geometry={outlineGeometry}>
          <lineBasicMaterial color="#00d4ff" />
        </lineSegments>
      )}
    </group>
  );
}

function PathVisualization({
  points,
  isPlaying,
  progress,
}: {
  points: PathPoint[];
  isPlaying: boolean;
  progress: number;
}) {
  const lineRef = useRef<THREE.Line>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 50;

  const linePositions = useMemo(() => {
    const posArray: number[] = [];
    for (let i = 0; i < points.length; i++) {
      posArray.push(
        points[i].position[0],
        points[i].position[1],
        points[i].position[2]
      );
    }
    return new Float32Array(posArray);
  }, [points]);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    geo.computeBoundingSphere();
    return geo;
  }, [linePositions]);

  const particleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    return geo;
  }, []);

  useEffect(() => {
    if (lineRef.current) {
      lineRef.current.computeLineDistances();
    }
  }, [linePositions]);

  useFrame(() => {
    if (!particlesRef.current || points.length < 2) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const t = ((i / particleCount) + progress) % 1;
      const segmentIndex = Math.floor(t * (points.length - 1));
      const segmentT = (t * (points.length - 1)) % 1;

      const p1 = points[Math.min(segmentIndex, points.length - 1)].position;
      const p2 = points[Math.min(segmentIndex + 1, points.length - 1)].position;

      const x = p1[0] + (p2[0] - p1[0]) * segmentT;
      const y = p1[1] + (p2[1] - p1[1]) * segmentT;
      const z = p1[2] + (p2[2] - p1[2]) * segmentT;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (points.length === 0) return null;

  return (
    <group>
      {points.map((point) => (
        <mesh key={point.id} position={point.position}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial color="#00d4ff" />
        </mesh>
      ))}

      {points.length >= 2 && (
        <>
          <primitive
            object={new THREE.Line(
              lineGeometry,
              new THREE.LineDashedMaterial({
                color: '#00d4ff',
                dashSize: 0.3,
                gapSize: 0.15,
              })
            )}
            ref={(el) => {
              if (el) {
                lineRef.current = el as THREE.Line;
                el.computeLineDistances();
              }
            }}
          />
          {isPlaying && (
            <points ref={particlesRef} geometry={particleGeometry}>
              <pointsMaterial
                size={0.15}
                color="#ffffff"
                transparent
                opacity={0.8}
              />
            </points>
          )}
        </>
      )}
    </group>
  );
}

function DragHelper({
  isDragging,
  setIsDragging,
}: {
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
}) {
  const { camera } = useThree();
  const selectedExhibitId = useSceneStore((s) => s.selectedExhibitId);
  const currentScene = useSceneStore((s) => s.getCurrentScene());
  const updateExhibit = useSceneStore((s) => s.updateExhibit);

  const planeIntersection = useRef<THREE.Vector3 | null>(null);
  const dragOffset = useRef<THREE.Vector3>(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  const handlePointerMove = useCallback(
    (e: any) => {
      if (!isDragging || !selectedExhibitId) return;

      raycaster.current.setFromCamera(e.pointer, camera);

      const point = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(dragPlane.current, point);

      if (point && planeIntersection.current) {
        const newPos = point.add(dragOffset.current);
        updateExhibit(selectedExhibitId, {
          position: [newPos.x, newPos.y, newPos.z],
        });
      }
    },
    [isDragging, selectedExhibitId, camera, updateExhibit]
  );

  const handlePointerDown = useCallback(
    (e: any) => {
      if (!selectedExhibitId) return;

      const exhibit = currentScene?.exhibits.find(
        (ex) => ex.id === selectedExhibitId
      );
      if (!exhibit) return;

      raycaster.current.setFromCamera(e.pointer, camera);
      const point = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(dragPlane.current, point);
      if (point) {
        planeIntersection.current = point.clone();
        dragOffset.current = new THREE.Vector3(
          exhibit.position[0] - point.x,
          exhibit.position[1] - point.y,
          exhibit.position[2] - point.z
        );
      }
    },
    [selectedExhibitId, currentScene, camera]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    planeIntersection.current = null;
  }, [setIsDragging]);

  return (
    <mesh
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

function GroundPlane({ onPathDrawing }: { onPathDrawing: boolean }) {
  const addPathPoint = useSceneStore((s) => s.addPathPoint);

  const handleClick = useCallback(
    (e: any) => {
      if (!onPathDrawing) return;
      e.stopPropagation();
      const point = e.point;
      addPathPoint([point.x, 1.6, point.z]);
    },
    [onPathDrawing, addPathPoint]
  );

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        if (onPathDrawing) {
          e.stopPropagation();
          document.body.style.cursor = 'crosshair';
        }
      }}
      onPointerOut={() => {
        if (onPathDrawing) {
          document.body.style.cursor = 'auto';
        }
      }}
    >
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#2a2a4e" transparent opacity={0.01} />
    </mesh>
  );
}

function SceneContent({
  occludedIds,
  isPlaying,
  pathProgress,
  isDragging,
  setIsDragging,
}: {
  occludedIds: Set<string>;
  isPlaying: boolean;
  pathProgress: number;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
}) {
  const currentScene = useSceneStore((s) => s.getCurrentScene());
  const selectedExhibitId = useSceneStore((s) => s.selectedExhibitId);
  const setSelectedExhibitId = useSceneStore((s) => s.setSelectedExhibitId);
  const editorMode = useSceneStore((s) => s.editorMode);

  const handleSelectExhibit = useCallback(
    (id: string) => {
      setSelectedExhibitId(id);
    },
    [setSelectedExhibitId]
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, [setIsDragging]);

  if (!currentScene) return null;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.8}
        castShadow
      />
      <spotLight
        position={[0, 15, 0]}
        angle={0.5}
        penumbra={0.5}
        intensity={0.6}
        color="#ffffff"
      />

      <Grid
        args={[30, 30]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#3a3a5e"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#4a4a6e"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
        position={[0, 0, 0]}
      />

      <GroundPlane onPathDrawing={editorMode === 'drawPath'} />

      {currentScene.exhibits.map((exhibit) => (
        <ExhibitMesh
          key={exhibit.id}
          exhibit={exhibit}
          isSelected={selectedExhibitId === exhibit.id}
          isOccluded={occludedIds.has(exhibit.id)}
          onSelect={() => handleSelectExhibit(exhibit.id)}
          onDragStart={handleDragStart}
        />
      ))}

      <PathVisualization
        points={currentScene.path}
        isPlaying={isPlaying}
        progress={pathProgress}
      />

      {isDragging && (
        <DragHelper isDragging={isDragging} setIsDragging={setIsDragging} />
      )}
    </>
  );
}

function CameraTracker() {
  const { camera } = useThree();
  const setCameraPosition = useSceneStore((s) => s.setCameraPosition);

  useEffect(() => {
    const interval = setInterval(() => {
      setCameraPosition(camera.position.toArray() as [number, number, number]);
    }, 100);
    return () => clearInterval(interval);
  }, [camera, setCameraPosition]);

  return null;
}

interface SceneEditorProps {
  occludedIds: Set<string>;
}

export default function SceneEditor({ occludedIds }: SceneEditorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const isPlaying = useSceneStore((s) => s.isPlayingPath);
  const pathProgress = useSceneStore((s) => s.pathProgress);

  return (
    <>
      <SceneContent
        occludedIds={occludedIds}
        isPlaying={isPlaying}
        pathProgress={pathProgress}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
      />
      <CameraTracker />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enablePan={!isDragging}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2 - Math.PI / 6}
        makeDefault
      />
    </>
  );
}
