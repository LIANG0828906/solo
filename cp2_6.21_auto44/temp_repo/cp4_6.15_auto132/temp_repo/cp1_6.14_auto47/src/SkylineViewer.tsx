import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
import { Building, BuildingShape, ClimateParams } from './types';

interface BuildingMeshProps {
  building: Building;
  onDrag: (id: string, position: [number, number, number]) => void;
  onRightClick: (id: string) => void;
  onTopClick: (building: Building) => void;
}

function BuildingMesh({ building, onDrag, onRightClick, onTopClick }: BuildingMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [scale, setScale] = useState(building.isAnimating ? 0.01 : 1);
  const [isDragging, setIsDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { camera, raycaster, scene } = useThree();

  useEffect(() => {
    if (building.isAnimating) {
      const startTime = Date.now();
      const duration = 500;
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const bounce = progress < 0.7 ? progress / 0.7 : 1 + (progress - 0.7) * 0.5 * Math.sin((progress - 0.7) * Math.PI * 5);
        setScale(easeOut * bounce);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setScale(1);
        }
      };
      animate();
    }
  }, [building.isAnimating]);

  const handlePointerDown = useCallback((e: any) => {
    if (e.button === 2) {
      e.stopPropagation();
      onRightClick(building.id);
      return;
    }
    if (e.button === 0) {
      e.stopPropagation();
      const intersectPoint = e.point.clone();
      const topY = building.position[1] + building.height;
      if (Math.abs(intersectPoint.y - topY) < 0.5) {
        onTopClick(building);
        return;
      }
      setIsDragging(true);
      e.target.setPointerCapture(e.pointerId);
    }
  }, [building, onRightClick, onTopClick]);

  const handlePointerMove = useCallback((e: any) => {
    if (isDragging) {
      e.stopPropagation();
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectPoint = new THREE.Vector3();
      raycaster.setFromCamera(e.pointer, camera);
      raycaster.ray.intersectPlane(groundPlane, intersectPoint);
      if (intersectPoint) {
        const newPos: [number, number, number] = [
          Math.round(intersectPoint.x),
          0,
          Math.round(intersectPoint.z)
        ];
        onDrag(building.id, newPos);
      }
    }
  }, [isDragging, building.id, onDrag, raycaster, camera]);

  const handlePointerUp = useCallback((e: any) => {
    setIsDragging(false);
  }, []);

  const geometry = useMemo(() => {
    switch (building.shape) {
      case 'box':
        return new THREE.BoxGeometry(building.width, building.height, building.depth);
      case 'cylinder':
        return new THREE.CylinderGeometry(building.width / 2, building.width / 2, building.height, 16);
      case 'pyramid':
        return new THREE.ConeGeometry(building.width / 2, building.height, 4);
      default:
        return new THREE.BoxGeometry(building.width, building.height, building.depth);
    }
  }, [building.shape, building.width, building.height, building.depth]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: hovered ? '#6b8cff' : '#4a6cf7',
      metalness: 0.3,
      roughness: 0.5,
      transparent: isDragging,
      opacity: isDragging ? 0.6 : 1,
    });
  }, [hovered, isDragging]);

  return (
    <group
      ref={groupRef}
      position={[building.position[0], building.height / 2, building.position[2]]}
      scale={[scale, scale, scale]}
    >
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerUp}
        onPointerOver={() => setHovered(true)}
        onPointerOutCapture={() => setHovered(false)}
      />
      {isDragging && (
        <lineSegments>
          <edgesGeometry args={[geometry]} />
          <lineBasicMaterial color="#8ab4ff" transparent opacity={0.8} />
        </lineSegments>
      )}
    </group>
  );
}

interface GroundProps {
  onClick: (position: [number, number, number]) => void;
}

function Ground({ onClick }: GroundProps) {
  const gridRef = useRef<THREE.GridHelper>(null);

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    const pos: [number, number, number] = [
      Math.round(e.point.x),
      0,
      Math.round(e.point.z)
    ];
    onClick(pos);
  }, [onClick]);

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
        onClick={handleClick}
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color="#1a2a4a"
          transparent
          opacity={0.3}
        />
      </mesh>
      <gridHelper
        ref={gridRef}
        args={[200, 40, '#3a4a6a', '#2a3a5a']}
        position={[0, 0.01, 0]}
      />
    </group>
  );
}

interface SkylineLineProps {
  buildings: Building[];
}

function SkylineLine({ buildings }: SkylineLineProps) {
  const lineRef = useRef<THREE.Line>(null);
  const { camera } = useThree();

  const calculateSkylinePoints = useCallback(() => {
    if (buildings.length === 0) return new Float32Array();

    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    cameraDir.y = 0;
    cameraDir.normalize();

    const rightDir = new THREE.Vector3().crossVectors(cameraDir, new THREE.Vector3(0, 1, 0)).normalize();

    const edges: { x: number; y: number; dist: number }[] = [];

    buildings.forEach(building => {
      const centerX = building.position[0];
      const centerZ = building.position[2];
      const topY = building.height;

      const halfWidth = building.width / 2;
      const halfDepth = building.depth / 2;

      const corners = [
        [centerX - halfWidth, centerZ - halfDepth],
        [centerX + halfWidth, centerZ - halfDepth],
        [centerX + halfWidth, centerZ + halfDepth],
        [centerX - halfWidth, centerZ + halfDepth],
      ];

      corners.forEach(([x, z]) => {
        const projectedX = x * rightDir.x + z * rightDir.z;
        const distToCam = x * cameraDir.x + z * cameraDir.z;
        edges.push({ x: projectedX, y: topY, dist: distToCam });
      });
    });

    if (edges.length === 0) return new Float32Array();

    edges.sort((a, b) => a.x - b.x);

    const step = 0.5;
    const minX = edges[0].x;
    const maxX = edges[edges.length - 1].x;
    const points: number[] = [];

    for (let x = minX - 5; x <= maxX + 5; x += step) {
      let maxY = 0;
      edges.forEach(edge => {
        if (Math.abs(edge.x - x) < step * 2) {
          if (edge.y > maxY) maxY = edge.y;
        }
      });
      points.push(x, maxY + 0.5, -10);
    }

    return new Float32Array(points);
  }, [buildings, camera]);

  useFrame(() => {
    if (lineRef.current) {
      const positions = calculateSkylinePoints();
      if (positions.length > 0) {
        const geometry = lineRef.current.geometry as THREE.BufferGeometry;
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.attributes.position.needsUpdate = true;
      }
    }
  });

  const initialPositions = calculateSkylinePoints();

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={initialPositions.length / 3}
          array={initialPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#ffd700"
        transparent
        opacity={0.7}
        linewidth={2}
      />
    </line>
  );
}

interface LightingProps {
  climate: ClimateParams;
}

function Lighting({ climate }: LightingProps) {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);

  useEffect(() => {
    if (directionalLightRef.current) {
      directionalLightRef.current.intensity = climate.directionalIntensity;
      directionalLightRef.current.color.set(climate.lightColor);
      directionalLightRef.current.position.set(...climate.sunPosition);
      directionalLightRef.current.shadow.mapSize.width = 2048;
      directionalLightRef.current.shadow.mapSize.height = 2048;
      directionalLightRef.current.shadow.camera.near = 0.5;
      directionalLightRef.current.shadow.camera.far = 200;
      directionalLightRef.current.shadow.camera.left = -50;
      directionalLightRef.current.shadow.camera.right = 50;
      directionalLightRef.current.shadow.camera.top = 50;
      directionalLightRef.current.shadow.camera.bottom = -50;
      directionalLightRef.current.shadow.bias = -0.0001;
      directionalLightRef.current.shadow.normalBias = 0.02;
    }
  }, [climate]);

  return (
    <>
      <ambientLight
        intensity={climate.ambientIntensity}
        color={climate.ambientColor}
      />
      <directionalLight
        ref={directionalLightRef}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
    </>
  );
}

interface DragPreviewProps {
  position: [number, number, number] | null;
  shape: BuildingShape;
  height: number;
  width: number;
}

function DragPreview({ position, shape, height, width }: DragPreviewProps) {
  if (!position) return null;

  const geometry = useMemo(() => {
    switch (shape) {
      case 'box':
        return new THREE.BoxGeometry(width, height, width);
      case 'cylinder':
        return new THREE.CylinderGeometry(width / 2, width / 2, height, 16);
      case 'pyramid':
        return new THREE.ConeGeometry(width / 2, height, 4);
      default:
        return new THREE.BoxGeometry(width, height, width);
    }
  }, [shape, width, height]);

  return (
    <group position={[position[0], height / 2, position[2]]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#8b5cf6"
          transparent
          opacity={0.4}
          wireframe={false}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color="#4a6cf7" transparent opacity={0.8} />
      </lineSegments>
    </group>
  );
}

interface SkylineViewerProps {
  buildings: Building[];
  climate: ClimateParams;
  onAddBuilding: (building: Omit<Building, 'id' | 'isAnimating'>) => void;
  onDeleteBuilding: (id: string) => void;
  onMoveBuilding: (id: string, position: [number, number, number]) => void;
  selectedShape: BuildingShape;
  selectedHeight: number;
  selectedWidth: number;
  cameraTarget?: [number, number, number];
}

export default function SkylineViewer({
  buildings,
  climate,
  onAddBuilding,
  onDeleteBuilding,
  onMoveBuilding,
  selectedShape,
  selectedHeight,
  selectedWidth,
  cameraTarget,
}: SkylineViewerProps) {
  const [previewPos, setPreviewPos] = useState<[number, number, number] | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<any>(null);

  const handleGroundClick = useCallback((position: [number, number, number]) => {
    if (buildings.length >= 30) {
      alert('最多只能添加30个楼宇！');
      return;
    }
    onAddBuilding({
      shape: selectedShape,
      position,
      height: selectedHeight,
      width: selectedWidth,
      depth: selectedWidth,
    });
  }, [selectedShape, selectedHeight, selectedWidth, buildings.length, onAddBuilding]);

  const handleTopClick = useCallback((building: Building) => {
    if (buildings.length >= 30) {
      alert('最多只能添加30个楼宇！');
      return;
    }
    const newPos: [number, number, number] = [
      building.position[0],
      building.height,
      building.position[2]
    ];
    onAddBuilding({
      shape: selectedShape,
      position: newPos,
      height: selectedHeight,
      width: Math.min(selectedWidth, building.width * 0.8),
      depth: Math.min(selectedWidth, building.width * 0.8),
    });
  }, [selectedShape, selectedHeight, selectedWidth, buildings.length, onAddBuilding]);

  useEffect(() => {
    if (cameraTarget && controlsRef.current) {
      controlsRef.current.target.set(...cameraTarget);
    }
  }, [cameraTarget]);

  const handlePointerMove = useCallback((e: any) => {
    if (e.intersections.length > 0 && !e.dragging) {
      const ground = e.intersections.find((i: any) => i.object.type === 'Mesh');
      if (ground) {
        setPreviewPos([
          Math.round(ground.point.x),
          0,
          Math.round(ground.point.z)
        ]);
      }
    }
  }, []);

  const handlePointerOut = useCallback(() => {
    setPreviewPos(null);
  }, []);

  return (
    <div className="canvas-container" onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}>
      <Canvas
        ref={canvasRef}
        shadows
        camera={{ position: [30, 25, 30], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#0a1628']} />
        <fog attach="fog" args={['#0a1628', 50, 150]} />

        <Lighting climate={climate} />

        <Ground onClick={handleGroundClick} />

        {buildings.map(building => (
          <BuildingMesh
            key={building.id}
            building={building}
            onDrag={onMoveBuilding}
            onRightClick={onDeleteBuilding}
            onTopClick={handleTopClick}
          />
        ))}

        <DragPreview
          position={previewPos}
          shape={selectedShape}
          height={selectedHeight}
          width={selectedWidth}
        />

        <SkylineLine buildings={buildings} />

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={100}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
}

export function exportScreenshot() {
  const canvas = document.querySelector('.canvas-container canvas') as HTMLCanvasElement;
  if (canvas) {
    const link = document.createElement('a');
    link.download = `skyline-screenshot-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}
