import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { usePipelineStore, generateId } from '@/store/pipelineStore';
import { checkCollisions, snapToAngleGrid, findNearestEndpoint } from '@/utils/collisionDetection';
import { CORRIDOR_WIDTH, CORRIDOR_HEIGHT, CORRIDOR_DEPTH } from '@/types';
import { PipelineMesh, CollisionMarker, PreviewPipeline, SnapIndicator } from './PipelineMesh';

const SCENE_LIGHTING_CONFIG = {
  ambientIntensity: 0.5,
  ambientColor: '#b0d4ff',
  directionalIntensity: 0.75,
  directionalPosition: [6, 12, 6] as [number, number, number],
  directionalColor: '#ffffff',
  shadowMapSize: 1024,
};

const GROUND_GRID_CONFIG = {
  size: 40,
  cellSize: 1,
  cellThickness: 0.6,
  cellColor: '#3a3a5c',
  sectionSize: 5,
  sectionThickness: 1.2,
  sectionColor: '#555577',
  fadeDistance: 35,
  fadeStrength: 1.2,
};

const TRANSPARENT_GROUND_CONFIG = {
  size: 20,
  color: '#888888',
  opacity: 0.3,
  positionY: 0.001,
};

function SceneContent() {
  const {
    pipelines,
    selectedPipelineId,
    collisions,
    isAddingPipeline,
    addingPipelineType,
    addingPipelineDiameter,
    addingStartPoint,
    setSelectedPipeline,
    setCollisions,
    addPipeline,
    setAddingStartPoint,
    setIsAddingPipeline,
    focusedCollisionId,
    updatePipeline,
  } = usePipelineStore();

  const { camera, raycaster } = useThree();
  const groundPlaneRef = useRef<THREE.Mesh>(null);
  const [mousePoint, setMousePoint] = useState<{ x: number; y: number; z: number } | null>(null);
  const [snapPoint, setSnapPoint] = useState<{ x: number; y: number; z: number } | null>(null);
  const dragStateRef = useRef<{
    pipelineId: string;
    endpoint: 'start' | 'end' | 'body';
    offset: THREE.Vector3;
    initialStart: THREE.Vector3;
    initialEnd: THREE.Vector3;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getGroundPoint = useCallback((): THREE.Vector3 | null => {
    if (!groundPlaneRef.current) return null;
    const intersects = raycaster.intersectObject(groundPlaneRef.current);
    if (intersects.length > 0) {
      return intersects[0].point.clone();
    }
    return null;
  }, [raycaster]);

  const handlePointerMove = useCallback(() => {
    const groundPt = getGroundPoint();
    if (!groundPt) return;

    setMousePoint({ x: groundPt.x, y: groundPt.y, z: groundPt.z });

    if (isAddingPipeline && addingStartPoint) {
      const snapped = snapToAngleGrid(
        addingStartPoint,
        { x: groundPt.x, y: groundPt.y, z: groundPt.z },
        10
      );
      const nearEndpoint = findNearestEndpoint(snapped, pipelines, '', 0.03);
      if (nearEndpoint) {
        setSnapPoint(nearEndpoint.point);
      } else {
        setSnapPoint(null);
      }
    } else if (dragStateRef.current) {
      const drag = dragStateRef.current;
      const point = groundPt;
      const offset = drag.offset;
      const targetPoint = new THREE.Vector3(
        point.x - offset.x,
        point.y - offset.y,
        point.z - offset.z
      );

      const pipeline = pipelines.find((p) => p.id === drag.pipelineId);
      if (!pipeline) return;

      if (drag.endpoint === 'start') {
        const newStart = snapToAngleGrid(
          pipeline.end,
          { x: targetPoint.x, y: targetPoint.y, z: targetPoint.z },
          10
        );
        const nearEndpoint = findNearestEndpoint(newStart, pipelines, pipeline.id, 0.03);
        const finalStart = nearEndpoint ? nearEndpoint.point : newStart;
        setSnapPoint(nearEndpoint ? nearEndpoint.point : null);
        updatePipeline(pipeline.id, { start: finalStart });
      } else if (drag.endpoint === 'end') {
        const newEnd = snapToAngleGrid(
          pipeline.start,
          { x: targetPoint.x, y: targetPoint.y, z: targetPoint.z },
          10
        );
        const nearEndpoint = findNearestEndpoint(newEnd, pipelines, pipeline.id, 0.03);
        const finalEnd = nearEndpoint ? nearEndpoint.point : newEnd;
        setSnapPoint(nearEndpoint ? nearEndpoint.point : null);
        updatePipeline(pipeline.id, { end: finalEnd });
      } else if (drag.endpoint === 'body') {
        const initialMid = new THREE.Vector3(
          (drag.initialStart.x + drag.initialEnd.x) / 2,
          (drag.initialStart.y + drag.initialEnd.y) / 2,
          (drag.initialStart.z + drag.initialEnd.z) / 2
        );
        const moveDx = targetPoint.x - initialMid.x;
        const moveDy = targetPoint.y - initialMid.y;
        const moveDz = targetPoint.z - initialMid.z;

        const newStart = {
          x: drag.initialStart.x + moveDx,
          y: drag.initialStart.y + moveDy,
          z: drag.initialStart.z + moveDz,
        };
        const newEnd = {
          x: drag.initialEnd.x + moveDx,
          y: drag.initialEnd.y + moveDy,
          z: drag.initialEnd.z + moveDz,
        };
        updatePipeline(pipeline.id, { start: newStart, end: newEnd });
      }
    }
  }, [getGroundPoint, isAddingPipeline, addingStartPoint, pipelines, updatePipeline]);

  const handleGroundClick = useCallback(() => {
    if (!isAddingPipeline || !addingPipelineType || !mousePoint) return;

    if (!addingStartPoint) {
      setAddingStartPoint({ x: mousePoint.x, y: mousePoint.y, z: mousePoint.z });
    } else {
      const endPoint = snapPoint || mousePoint;
      const snappedEnd = snapToAngleGrid(addingStartPoint, endPoint, 10);

      const dx = snappedEnd.x - addingStartPoint.x;
      const dy = snappedEnd.y - addingStartPoint.y;
      const dz = snappedEnd.z - addingStartPoint.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance > 0.1) {
        const newPipeline = {
          id: generateId(),
          type: addingPipelineType,
          diameter: addingPipelineDiameter,
          start: addingStartPoint,
          end: snappedEnd,
        };
        addPipeline(newPipeline);
      } else {
        setAddingStartPoint(null);
        setIsAddingPipeline(false);
      }
    }
  }, [isAddingPipeline, addingPipelineType, addingStartPoint, mousePoint, snapPoint, addPipeline, setAddingStartPoint, setIsAddingPipeline]);

  const handlePipelineClick = useCallback(
    (id: string) => {
      if (!isAddingPipeline && !isDragging) {
        setSelectedPipeline(id === selectedPipelineId ? null : id);
      }
    },
    [isAddingPipeline, isDragging, selectedPipelineId, setSelectedPipeline]
  );

  const handleEndpointPointerDown = useCallback(
    (pipelineId: string, endpoint: 'start' | 'end', e: ThreeEvent<PointerEvent>) => {
      if (isAddingPipeline) return;
      e.stopPropagation();

      const pipeline = pipelines.find((p) => p.id === pipelineId);
      if (!pipeline) return;

      const point = e.point.clone();
      const endpointPoint = endpoint === 'start' ? pipeline.start : pipeline.end;
      const offset = new THREE.Vector3(
        point.x - endpointPoint.x,
        point.y - endpointPoint.y,
        point.z - endpointPoint.z
      );

      dragStateRef.current = {
        pipelineId,
        endpoint,
        offset,
        initialStart: new THREE.Vector3(pipeline.start.x, pipeline.start.y, pipeline.start.z),
        initialEnd: new THREE.Vector3(pipeline.end.x, pipeline.end.y, pipeline.end.z),
      };
      setIsDragging(true);
      setSelectedPipeline(pipelineId);
    },
    [isAddingPipeline, pipelines, setSelectedPipeline]
  );

  const handleBodyPointerDown = useCallback(
    (pipelineId: string, e: ThreeEvent<PointerEvent>) => {
      if (isAddingPipeline) return;
      e.stopPropagation();

      const pipeline = pipelines.find((p) => p.id === pipelineId);
      if (!pipeline) return;

      const point = e.point.clone();
      const midPoint = new THREE.Vector3(
        (pipeline.start.x + pipeline.end.x) / 2,
        (pipeline.start.y + pipeline.end.y) / 2,
        (pipeline.start.z + pipeline.end.z) / 2
      );
      const offset = new THREE.Vector3(
        point.x - midPoint.x,
        point.y - midPoint.y,
        point.z - midPoint.z
      );

      dragStateRef.current = {
        pipelineId,
        endpoint: 'body',
        offset,
        initialStart: new THREE.Vector3(pipeline.start.x, pipeline.start.y, pipeline.start.z),
        initialEnd: new THREE.Vector3(pipeline.end.x, pipeline.end.y, pipeline.end.z),
      };
      setIsDragging(true);
      setSelectedPipeline(pipelineId);
    },
    [isAddingPipeline, pipelines, setSelectedPipeline]
  );

  const handlePointerUp = useCallback(() => {
    dragStateRef.current = null;
    setIsDragging(false);
    setSnapPoint(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAddingPipeline) {
        setAddingStartPoint(null);
        setIsAddingPipeline(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddingPipeline, setAddingStartPoint, setIsAddingPipeline]);

  const handleDetectCollisions = useCallback(() => {
    const results = checkCollisions(pipelines);
    setCollisions(results);
  }, [pipelines, setCollisions]);

  useEffect(() => {
    if (pipelines.length > 0) {
      handleDetectCollisions();
    }
  }, [pipelines.length, handleDetectCollisions]);

  const focusedCollision = useMemo(
    () => collisions.find((c) => c.id === focusedCollisionId),
    [collisions, focusedCollisionId]
  );

  useEffect(() => {
    if (focusedCollision && camera) {
      const target = new THREE.Vector3(
        focusedCollision.point.x,
        focusedCollision.point.y,
        focusedCollision.point.z
      );
      const newPos = new THREE.Vector3(target.x + 3, target.y + 3, target.z + 3);
      camera.position.lerp(newPos, 0.1);
    }
  }, [focusedCollision, camera]);

  const previewEnd = snapPoint || mousePoint;

  return (
    <>
      <ambientLight
        intensity={SCENE_LIGHTING_CONFIG.ambientIntensity}
        color={SCENE_LIGHTING_CONFIG.ambientColor}
      />
      <directionalLight
        position={SCENE_LIGHTING_CONFIG.directionalPosition}
        intensity={SCENE_LIGHTING_CONFIG.directionalIntensity}
        color={SCENE_LIGHTING_CONFIG.directionalColor}
        castShadow
        shadow-mapSize-width={SCENE_LIGHTING_CONFIG.shadowMapSize}
        shadow-mapSize-height={SCENE_LIGHTING_CONFIG.shadowMapSize}
      />

      <mesh
        ref={groundPlaneRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerMove={handlePointerMove}
        onClick={handleGroundClick}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, TRANSPARENT_GROUND_CONFIG.positionY, 0]}
      >
        <planeGeometry args={[TRANSPARENT_GROUND_CONFIG.size, TRANSPARENT_GROUND_CONFIG.size]} />
        <meshStandardMaterial
          color={TRANSPARENT_GROUND_CONFIG.color}
          transparent
          opacity={TRANSPARENT_GROUND_CONFIG.opacity}
          side={THREE.DoubleSide}
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>

      <Grid
        position={[0, 0, 0]}
        args={[GROUND_GRID_CONFIG.size, GROUND_GRID_CONFIG.size]}
        cellSize={GROUND_GRID_CONFIG.cellSize}
        cellThickness={GROUND_GRID_CONFIG.cellThickness}
        cellColor={GROUND_GRID_CONFIG.cellColor}
        sectionSize={GROUND_GRID_CONFIG.sectionSize}
        sectionThickness={GROUND_GRID_CONFIG.sectionThickness}
        sectionColor={GROUND_GRID_CONFIG.sectionColor}
        fadeDistance={GROUND_GRID_CONFIG.fadeDistance}
        fadeStrength={GROUND_GRID_CONFIG.fadeStrength}
        followCamera={false}
        infiniteGrid
      />

      <mesh position={[0, CORRIDOR_HEIGHT / 2, -CORRIDOR_DEPTH / 2]}>
        <boxGeometry args={[CORRIDOR_WIDTH, CORRIDOR_HEIGHT, 0.05]} />
        <meshStandardMaterial color="#16213e" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[-CORRIDOR_WIDTH / 2, CORRIDOR_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[CORRIDOR_DEPTH, CORRIDOR_HEIGHT, 0.05]} />
        <meshStandardMaterial color="#16213e" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[CORRIDOR_WIDTH / 2, CORRIDOR_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[CORRIDOR_DEPTH, CORRIDOR_HEIGHT, 0.05]} />
        <meshStandardMaterial color="#16213e" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, CORRIDOR_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[CORRIDOR_WIDTH, CORRIDOR_DEPTH, 0.05]} />
        <meshStandardMaterial color="#16213e" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {pipelines.map((pipeline) => (
        <PipelineMesh
          key={pipeline.id}
          pipeline={pipeline}
          selected={pipeline.id === selectedPipelineId}
          onClick={(e) => {
            e.stopPropagation();
            handlePipelineClick(pipeline.id);
          }}
          onBodyPointerDown={(e) => handleBodyPointerDown(pipeline.id, e)}
          onStartPointerDown={(e) => handleEndpointPointerDown(pipeline.id, 'start', e)}
          onEndPointerDown={(e) => handleEndpointPointerDown(pipeline.id, 'end', e)}
        />
      ))}

      {collisions.map((collision) => (
        <CollisionMarker
          key={collision.id}
          position={[collision.point.x, collision.point.y, collision.point.z]}
          focused={collision.id === focusedCollisionId}
        />
      ))}

      {isAddingPipeline && addingStartPoint && previewEnd && addingPipelineType && (
        <PreviewPipeline
          start={addingStartPoint}
          end={previewEnd}
          diameter={addingPipelineDiameter}
          type={addingPipelineType}
        />
      )}

      {snapPoint && <SnapIndicator position={[snapPoint.x, snapPoint.y, snapPoint.z]} />}

      <OrbitControls
        makeDefault
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={50}
        enabled={!isAddingPipeline && !isDragging}
      />

      <Stats className="fps-counter" />

      <axesHelper args={[1]} position={[-4.5, 0.1, -4.5]} />
    </>
  );
}

function Scene() {
  return (
    <Canvas
      camera={{ position: [8, 6, 8], fov: 50 }}
      gl={{ antialias: true }}
      dpr={[1, 2]}
      shadows
    >
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 20, 50]} />
      <SceneContent />
    </Canvas>
  );
}

export default Scene;
