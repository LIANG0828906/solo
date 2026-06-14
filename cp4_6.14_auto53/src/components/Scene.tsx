import { forwardRef, useRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Edges, Html } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingBlock } from '../data/buildingData';
import { SunParams, SceneRef } from '../App';

interface SceneProps {
  buildings: BuildingBlock[];
  selectedBuildingId: string | null;
  onBuildingClick: (id: string | null) => void;
  sunParams: SunParams;
  isDragging: boolean;
  onDraggingChange: (v: boolean) => void;
  onBuildingUpdate: (id: string, updates: Partial<BuildingBlock>) => void;
}

interface BuildingMeshProps {
  building: BuildingBlock;
  isSelected: boolean;
  onClick: () => void;
  onDragEnd: (newX: number, newZ: number) => void;
  shadowColor: string;
  shadowIntensity: number;
}

const SUN_DISTANCE = 50;
const GROUND_SIZE = 80;

function calculateSunPosition(azimuth: number, altitude: number): [number, number, number] {
  const azimuthRad = (azimuth * Math.PI) / 180;
  const altitudeRad = (altitude * Math.PI) / 180;
  const x = SUN_DISTANCE * Math.cos(altitudeRad) * Math.sin(azimuthRad);
  const y = SUN_DISTANCE * Math.sin(altitudeRad);
  const z = SUN_DISTANCE * Math.cos(altitudeRad) * Math.cos(azimuthRad);
  return [x, y, z];
}

function BuildingMesh({ building, isSelected, onClick, onDragEnd, shadowColor, shadowIntensity }: BuildingMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const dragPlane = useRef<THREE.Plane | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef(new THREE.Vector3());
  const hitPoint = useRef(new THREE.Vector3());
  const targetPosition = useRef(new THREE.Vector3(...building.position));
  const springVelocity = useRef(new THREE.Vector3());

  useEffect(() => {
    targetPosition.current.set(...building.position);
  }, [building.position]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (!isDragging) {
      const current = meshRef.current.position;
      const target = targetPosition.current;
      const damping = 12;
      const stiffness = 60;
      const diff = new THREE.Vector3().subVectors(target, current);
      springVelocity.current.add(diff.multiplyScalar(stiffness * delta));
      springVelocity.current.multiplyScalar(Math.max(0, 1 - damping * delta));
      current.add(springVelocity.current.clone().multiplyScalar(delta));
      meshRef.current.position.copy(current);
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    onClick();
    if (isSelected) {
      setIsDragging(true);
      e.target.setPointerCapture(e.pointerId);
      const planeNormal = new THREE.Vector3(0, 1, 0);
      dragPlane.current = new THREE.Plane(planeNormal, 0);
      const point = e.point.clone();
      point.y = building.position[1];
      hitPoint.current.copy(point);
      dragOffset.current.copy(meshRef.current!.position).sub(point);
    }
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging || !dragPlane.current || !meshRef.current) return;
    e.stopPropagation();
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(e.pointer, e.camera);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane.current, intersect);
    if (intersect) {
      const newPos = intersect.add(dragOffset.current);
      meshRef.current.position.set(
        Math.max(-20, Math.min(20, newPos.x)),
        building.position[1],
        Math.max(-20, Math.min(20, newPos.z))
      );
    }
  };

  const handlePointerUp = (e: any) => {
    if (!isDragging || !meshRef.current) return;
    e.stopPropagation();
    setIsDragging(false);
    const pos = meshRef.current.position;
    targetPosition.current.set(pos.x, building.position[1], pos.z);
    onDragEnd(
      Math.round(pos.x * 2) / 2,
      Math.round(pos.z * 2) / 2
    );
  };

  const edgeColor = isSelected ? '#f97316' : '#64748b';
  const edgeOpacity = isSelected ? 1 : 0.3;

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[building.position[0], building.position[1], building.position[2]]}
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <boxGeometry args={building.size} />
        <meshStandardMaterial
          color={building.color}
          roughness={0.7}
          metalness={0.1}
        />
        <Edges
          threshold={15}
          color={edgeColor}
          scale={1.001}
          lineWidth={isSelected ? 2 : 1}
        />
      </mesh>
    </group>
  );
}

function SunLight({ sunParams }: { sunParams: SunParams }) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const shadowCameraSize = 35;

  useFrame(() => {
    if (!lightRef.current) return;
    const [x, y, z] = calculateSunPosition(sunParams.azimuth, sunParams.altitude);
    lightRef.current.position.set(x, y, z);
    lightRef.current.target.position.set(0, 0, 0);
    lightRef.current.target.updateMatrixWorld();
  });

  useEffect(() => {
    if (!lightRef.current) return;
    const shadowColor = new THREE.Color(sunParams.shadowColor);
    const light = lightRef.current;
    light.intensity = 1.5 + sunParams.altitude / 60;
    light.shadow.bias = -0.0001;
    light.shadow.normalBias = 0.02;
    light.shadow.camera.left = -shadowCameraSize;
    light.shadow.camera.right = shadowCameraSize;
    light.shadow.camera.top = shadowCameraSize;
    light.shadow.camera.bottom = -shadowCameraSize;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 200;
  }, [sunParams]);

  const shadowMapSize = 2048;
  const pcfSoftness = sunParams.shadowSoftness;

  return (
    <directionalLight
      ref={lightRef}
      color="#ffffff"
      intensity={2}
      castShadow
      shadow-mapSize-width={shadowMapSize}
      shadow-mapSize-height={shadowMapSize}
      shadow-camera-near={0.1}
      shadow-camera-far={200}
      shadow-camera-left={-shadowCameraSize}
      shadow-camera-right={shadowCameraSize}
      shadow-camera-top={shadowCameraSize}
      shadow-camera-bottom={-shadowCameraSize}
      shadow-bias={-0.0005}
      shadow-normalBias={0.02}
      shadow-radius={pcfSoftness}
    />
  );
}

function Ground({ shadowColor, shadowIntensity }: { shadowColor: string; shadowIntensity: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#2d4a2d');
    gradient.addColorStop(1, '#1a3a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 20; i++) {
      const pos = (i / 20) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(canvas.width, pos);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.needsUpdate = true;
    textureRef.current = texture;
  }, []);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      <meshStandardMaterial
        map={textureRef.current || undefined}
        color="#2d4a2d"
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

function GridHelperComponent() {
  return (
    <gridHelper
      args={[GROUND_SIZE, 40, '#475569', '#334155']}
      position={[0, 0.01, 0]}
    />
  );
}

function AxesHelperComponent() {
  return (
    <axesHelper args={[5]} position={[0, 0.02, 0]} />
  );
}

function SceneContent({
  buildings,
  selectedBuildingId,
  onBuildingClick,
  sunParams,
  onBuildingUpdate
}: Omit<SceneProps, 'isDragging' | 'onDraggingChange'>) {
  const controlsRef = useRef<any>(null);
  const { gl, scene } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color('#1e293b');
    scene.fog = new THREE.Fog('#1e293b', 60, 150);
  }, [scene]);

  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
  }, [gl]);

  const handleCanvasClick = (e: any) => {
    if (e.target === e.currentTarget || e.object?.type === 'Mesh' && !buildings.find(b => e.object?.uuid && true)) {
      onBuildingClick(null);
    }
  };

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 3, 0]}
      />

      <ambientLight intensity={0.4} color="#e2e8f0" />
      <hemisphereLight args={['#87ceeb', '#2d4a2d', 0.3]} />
      <SunLight sunParams={sunParams} />

      <Ground
        shadowColor={sunParams.shadowColor}
        shadowIntensity={sunParams.shadowIntensity}
      />
      <GridHelperComponent />
      <AxesHelperComponent />

      {buildings.map(building => (
        <BuildingMesh
          key={building.id}
          building={building}
          isSelected={selectedBuildingId === building.id}
          onClick={() => onBuildingClick(building.id)}
          onDragEnd={(x, z) => {
            const currentBuilding = buildings.find(b => b.id === building.id);
            if (currentBuilding) {
              onBuildingUpdate(building.id, {
                position: [x, currentBuilding.position[1], z]
              });
            }
          }}
          shadowColor={sunParams.shadowColor}
          shadowIntensity={sunParams.shadowIntensity}
        />
      ))}
    </>
  );
}

const Scene = forwardRef<SceneRef, SceneProps>((props, ref) => {
  const { sunParams, buildings, onBuildingUpdate } = props;

  useImperativeHandle(ref, () => ({
    updateSun: (_params: SunParams) => {
    },
    updateBuilding: (id: string, updates: Partial<BuildingBlock>) => {
    },
    getShadowCanvas: () => null
  }));

  return (
    <Canvas
      shadows
      camera={{ position: [25, 20, 25], fov: 50, near: 0.1, far: 500 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      }}
      onPointerMissed={() => props.onBuildingClick(null)}
    >
      <SceneContent {...props} />
    </Canvas>
  );
});

Scene.displayName = 'Scene';

export default Scene;
