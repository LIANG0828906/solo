import React, { useRef, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlantStore } from '../stores/plantStore';
import {
  applyWind,
  applyGravity,
  detectCollision,
  applySupportForces,
  updateGrowthAnimation,
} from '../physics/plantPhysics';
import { usePerfMonitor } from '../utils/perfMonitor';
import type { Plant, PlantNode, SupportConnection } from '../stores/plantStore';

const CYLINDER_SEGMENTS = 8;

interface PlantRendererProps {
  plant: Plant;
  onNodeClick: (plantId: string, nodeId: string) => void;
  selectedNodeId: string | null;
  leafDetailLevel: 'full' | 'reduced';
  textureResolution: 256 | 128;
}

const PlantRenderer: React.FC<PlantRendererProps> = ({
  plant,
  onNodeClick,
  selectedNodeId,
  leafDetailLevel,
  textureResolution,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  const nodes = useMemo(() => Array.from(plant.nodes.values()), [plant.nodes]);

  const leafTexture = useMemo(() => {
    const size = textureResolution;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, '#7acf7a');
    gradient.addColorStop(0.5, '#5ab05a');
    gradient.addColorStop(1, '#3d7a3d');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(size / 2, size / 2, size * 0.45, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2d5a2d';
    ctx.lineWidth = size * 0.02;
    ctx.beginPath();
    ctx.moveTo(size * 0.1, size / 2);
    ctx.lineTo(size * 0.9, size / 2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [textureResolution]);

  const renderNode = useCallback((node: PlantNode) => {
    const isSelected = node.id === selectedNodeId;
    const growthScale = node.growthProgress;

    if (node.type === 'leaf') {
      const windStrength = usePlantStore.getState().environment.windStrength;
      const colorT = Math.min(1, windStrength / 20);
      const leafColor = new THREE.Color('#4a9e4a');
      const lightLeafColor = new THREE.Color('#7acf7a');
      const finalColor = leafColor.clone().lerp(lightLeafColor, colorT);

      const scale = growthScale;
      const side = leafDetailLevel === 'full' ? THREE.DoubleSide : THREE.FrontSide;

      return (
        <group
          key={node.id}
          position={node.position.toArray()}
          rotation={[node.currentRotation.x, node.currentRotation.y, node.currentRotation.z]}
          onClick={(e) => {
            e.stopPropagation();
            onNodeClick(plant.id, node.id);
          }}
        >
          <mesh scale={[scale, scale, scale]}>
            <planeGeometry args={[node.length, node.length * 0.5, 1, 1]} />
            <meshStandardMaterial
              color={finalColor}
              map={leafTexture}
              transparent
              opacity={0.9}
              side={side}
            />
          </mesh>
          {isSelected && (
            <lineSegments>
              <edgesGeometry args={[new THREE.PlaneGeometry(node.length * 1.05, node.length * 0.55)]} />
              <lineBasicMaterial color="#ff4444" />
            </lineSegments>
          )}
        </group>
      );
    }

    const length = node.length * growthScale;
    const radius = node.radius;
    const color = node.type === 'trunk' ? '#5d4037' : '#6d4c41';
    const midY = length / 2;

    return (
      <group
        key={node.id}
        position={node.position.toArray()}
        rotation={[node.currentRotation.x, node.currentRotation.y, node.currentRotation.z]}
      >
        <mesh
          position={[0, midY, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onNodeClick(plant.id, node.id);
          }}
          castShadow
        >
          <cylinderGeometry
            args={[radius * 0.8, radius, length, CYLINDER_SEGMENTS]}
          />
          <meshStandardMaterial color={color} />
        </mesh>
        {isSelected && (
          <mesh position={[0, midY, 0]}>
            <cylinderGeometry
              args={[radius * 1.1, radius * 1.1, length * 1.02, CYLINDER_SEGMENTS]}
            />
            <meshBasicMaterial color="#ff4444" transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    );
  }, [plant.id, selectedNodeId, leafDetailLevel, leafTexture, onNodeClick]);

  return (
    <group ref={groupRef}>
      {nodes.map(renderNode)}
    </group>
  );
};

interface SupportLinesProps {
  connections: SupportConnection[];
  plants: Plant[];
  time: number;
}

const SupportLines: React.FC<SupportLinesProps> = ({ connections, plants, time }) => {
  const plantMap = useMemo(() => {
    const map = new Map<string, Plant>();
    plants.forEach((p) => map.set(p.id, p));
    return map;
  }, [plants]);

  const lines = useMemo(() => {
    return connections.map((conn) => {
      const plantA = plantMap.get(conn.plantAId);
      const plantB = plantMap.get(conn.plantBId);
      if (!plantA || !plantB) return null;

      const nodeA = plantA.nodes.get(conn.nodeAId);
      const nodeB = plantB.nodes.get(conn.nodeBId);
      if (!nodeA || !nodeB) return null;

      const springOffset = Math.sin(time * 3) * 0.05 * conn.tension;
      const midPoint = nodeA.position.clone().lerp(nodeB.position, 0.5);
      midPoint.y += springOffset;

      const curve = new THREE.QuadraticBezierCurve3(
        nodeA.position.clone(),
        midPoint,
        nodeB.position.clone()
      );
      const points = curve.getPoints(10);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      return (
        <line key={conn.id}>
          <bufferGeometry attach="geometry" {...geometry} />
          <lineBasicMaterial
            color="#00ff88"
            transparent
            opacity={0.7}
          />
        </line>
      );
    }).filter(Boolean);
  }, [connections, plantMap, time]);

  return <>{lines}</>;
};

interface WindArrowProps {
  windStrength: number;
  windDirection: number;
}

const WindArrow: React.FC<WindArrowProps> = ({ windStrength, windDirection }) => {
  const groupRef = useRef<THREE.Group>(null);
  const maxLength = 5;
  const length = (windStrength / 20) * maxLength;
  const windRad = (windDirection * Math.PI) / 180;
  const direction = new THREE.Vector3(Math.sin(windRad), 0, Math.cos(windRad)).normalize();
  const origin = new THREE.Vector3(8, 3, 8);

  const arrowLength = Math.max(0.1, length);
  const headLength = arrowLength * 0.3;
  const headWidth = arrowLength * 0.15;

  return (
    <group ref={groupRef}>
      <arrowHelper
        args={[direction, origin, arrowLength, 0xff4444, headLength, headWidth]}
      />
      <pointLight position={origin.toArray()} color="#ff4444" intensity={0.5} distance={3} />
    </group>
  );
};

interface GravityIndicatorProps {
  gravityDirection: THREE.Vector3;
  onDrag: (newDir: THREE.Vector3) => void;
}

const GravityIndicator: React.FC<GravityIndicatorProps> = ({ gravityDirection, onDrag }) => {
  const groupRef = useRef<THREE.Group>(null);
  const isDragging = useRef(false);
  const { camera, raycaster, pointer } = useThree();

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation();
    isDragging.current = true;
    e.target.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: any) => {
    if (!isDragging.current) return;
    e.stopPropagation();

    const planeNormal = new THREE.Vector3(0, 0, 1);
    const planePoint = new THREE.Vector3(-8, 5, 0);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, planePoint);
    const intersectPoint = new THREE.Vector3();

    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.ray.intersectPlane(plane, intersectPoint);

    if (hit) {
      const localPoint = intersectPoint.clone().sub(planePoint);
      const newDir = new THREE.Vector3(localPoint.x, -Math.abs(localPoint.y) * 0.5 - 1, 0).normalize();
      onDrag(newDir);
    }
  }, [camera, pointer, raycaster, onDrag]);

  const handlePointerUp = useCallback((e: any) => {
    isDragging.current = false;
    if (e.target.releasePointerCapture) {
      e.target.releasePointerCapture(e.pointerId);
    }
  }, []);

  const length = 3;
  const origin = new THREE.Vector3(-8, 5, 0);
  const dir = gravityDirection.clone().normalize();

  return (
    <group ref={groupRef} position={origin.toArray()}>
      <group
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <arrowHelper
          args={[dir, new THREE.Vector3(0, 0, 0), length, 0x00ff88, length * 0.3, length * 0.15]}
        />
        <mesh position={dir.clone().multiplyScalar(length * 0.5).toArray()}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.2} />
        </mesh>
      </group>
      <pointLight position={[0, 0, 0]} color="#00ff88" intensity={0.8} distance={4} />
    </group>
  );
};

interface PlantRendererContainerProps {
  onSceneClick?: (point: THREE.Vector3) => void;
}

const PlantRendererContainer: React.FC<PlantRendererContainerProps> = ({ onSceneClick }) => {
  const {
    plants,
    environment,
    selectedNodeId,
    selectedPlantId,
    supportConnections,
    isGrowthAnimating,
    growthStartTime,
    leafUpdateInterval,
    leafSwingIterations,
    leafDetailLevel,
    textureResolution,
    selectNode,
    addSupportConnection,
    updatePlants,
    setGravityDirection,
  } = usePlantStore();

  const { tick } = usePerfMonitor();
  const timeRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastUpdateRef = useRef(performance.now());

  const handleNodeClick = useCallback((plantId: string, nodeId: string) => {
    if (selectedNodeId === nodeId && selectedPlantId === plantId) {
      selectNode(null, null);
    } else {
      selectNode(plantId, nodeId);
    }
  }, [selectedNodeId, selectedPlantId, selectNode]);

  const handleSceneClick = useCallback((e: any) => {
    e.stopPropagation();
    if (onSceneClick) {
      onSceneClick(e.point);
    }
    selectNode(null, null);
  }, [onSceneClick, selectNode]);

  const handleGravityDrag = useCallback((newDir: THREE.Vector3) => {
    setGravityDirection(newDir);
  }, [setGravityDirection]);

  useFrame((_, delta) => {
    const currentTime = performance.now();
    const dt = Math.min(delta, 0.05);
    timeRef.current += dt;
    frameCountRef.current += 1;

    tick();

    let currentPlants = plants;
    let currentEnv = environment;

    if (isGrowthAnimating) {
      const elapsed = (currentTime - growthStartTime) / 1000;
      const result = updateGrowthAnimation(currentPlants, elapsed);
      currentPlants = result.plants;

      if (result.isComplete) {
        usePlantStore.setState({ isGrowthAnimating: false });
      }
    }

    if (!isGrowthAnimating || timeRef.current > 0) {
      const gravityResult = applyGravity(currentPlants, currentEnv, dt);
      currentPlants = gravityResult.plants;
      currentEnv = gravityResult.environment;

      currentPlants = applyWind(
        currentPlants,
        currentEnv,
        dt,
        timeRef.current,
        leafUpdateInterval,
        leafSwingIterations,
        frameCountRef.current
      );

      if (supportConnections.length > 0) {
        currentPlants = applySupportForces(currentPlants, supportConnections, dt);
      }

      if (currentPlants.length > 1) {
        const newConnections = detectCollision(currentPlants, supportConnections);
        if (newConnections.length > 0) {
          newConnections.forEach((conn) => addSupportConnection(conn));
        }
      }
    }

    if (currentPlants !== plants) {
      updatePlants(currentPlants);
    }
    if (currentEnv !== environment) {
      usePlantStore.setState({ environment: currentEnv });
    }

    lastUpdateRef.current = currentTime;
  });

  return (
    <>
      {plants.map((plant) => (
        <PlantRenderer
          key={plant.id}
          plant={plant}
          onNodeClick={handleNodeClick}
          selectedNodeId={selectedNodeId}
          leafDetailLevel={leafDetailLevel}
          textureResolution={textureResolution}
        />
      ))}

      <SupportLines
        connections={supportConnections}
        plants={plants}
        time={timeRef.current}
      />

      <WindArrow
        windStrength={environment.windStrength}
        windDirection={environment.windDirection}
      />

      <GravityIndicator
        gravityDirection={environment.gravityDirection}
        onDrag={handleGravityDrag}
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        onClick={handleSceneClick}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
};

export default PlantRendererContainer;
export { PlantRenderer };
