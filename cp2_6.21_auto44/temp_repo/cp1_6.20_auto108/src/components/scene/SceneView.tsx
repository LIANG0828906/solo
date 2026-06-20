import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { BuildingConfig, DisplayOptions, ShadowData, GroundClickInfo } from '../../types';
import { DEFAULT_LATITUDE, DEFAULT_LONGITUDE, GRID_SIZE } from '../../types';
import { getSunPosition } from '../../utils/suncalc';
import { computeShadowPolygon, computeAllShadowData, lookupPointInfo } from '../../utils/shadowcalc';
import ShadowHeatmap from '../analysis/ShadowHeatmap';

interface AnimatedSunProps {
  targetPosition: THREE.Vector3;
  targetAltitude: number;
}

function AnimatedSun({ targetPosition, targetAltitude }: AnimatedSunProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const currentPos = useRef(new THREE.Vector3().copy(targetPosition));

  useFrame((_state, delta) => {
    const speed = Math.min(delta * 1.5, 1);
    currentPos.current.lerp(targetPosition, speed);
    if (meshRef.current) {
      meshRef.current.position.copy(currentPos.current);
      const visible = targetAltitude > 0;
      meshRef.current.visible = visible;
      const s = visible ? 1 : 0.01;
      meshRef.current.scale.setScalar(meshRef.current.scale.x + (s - meshRef.current.scale.x) * speed);
    }
    if (pointLightRef.current) {
      pointLightRef.current.position.copy(currentPos.current);
      pointLightRef.current.visible = targetAltitude > 0;
    }
    if (lightRef.current) {
      lightRef.current.position.copy(currentPos.current);
      lightRef.current.target.position.set(0, 0, 0);
      lightRef.current.target.updateMatrixWorld();
      lightRef.current.visible = targetAltitude > 0;
      lightRef.current.intensity = THREE.MathUtils.lerp(
        lightRef.current.intensity,
        Math.max(0, Math.min(targetAltitude / 0.5, 1)) * 2.8,
        speed
      );
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial color="#fff59d" toneMapped={false} />
      </mesh>
      <pointLight ref={pointLightRef} color="#ffd54f" intensity={2.5} distance={200} decay={1.8} />
      <directionalLight
        ref={lightRef}
        castShadow
        color="#fffceb"
        intensity={2.5}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={500}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.0005}
      />
    </>
  );
}

interface BuildingProps {
  config: BuildingConfig;
}

function Building({ config }: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const currentHeight = useRef(config.floors * config.floorHeight);
  const currentLength = useRef(config.length);
  const currentWidth = useRef(config.width);

  const targetHeight = config.floors * config.floorHeight;

  useFrame((_state, delta) => {
    const speed = Math.min(delta * 3, 1);
    currentHeight.current = THREE.MathUtils.lerp(currentHeight.current, targetHeight, speed);
    currentLength.current = THREE.MathUtils.lerp(currentLength.current, config.length, speed);
    currentWidth.current = THREE.MathUtils.lerp(currentWidth.current, config.width, speed);
    if (meshRef.current) {
      meshRef.current.scale.set(
        currentLength.current / Math.max(config.length, 0.001),
        currentHeight.current / Math.max(targetHeight, 0.001),
        currentWidth.current / Math.max(config.width, 0.001)
      );
      meshRef.current.position.y = currentHeight.current / 2;
    }
    if (groupRef.current) {
      groupRef.current.scale.set(
        currentLength.current / Math.max(config.length, 0.001),
        currentHeight.current / Math.max(targetHeight, 0.001),
        currentWidth.current / Math.max(config.width, 0.001)
      );
    }
  });

  const floors = config.floors;
  const floorH = config.floorHeight;
  const buildingHeight = config.floors * config.floorHeight;

  const floorLines = useMemo(() => {
    const positions: number[] = [];
    const hl = config.length / 2;
    const hw = config.width / 2;
    for (let i = 1; i <= floors; i++) {
      const y = i * floorH;
      positions.push(-hl, y, -hw, hl, y, -hw);
      positions.push(hl, y, -hw, hl, y, hw);
      positions.push(hl, y, hw, -hl, y, hw);
      positions.push(-hl, y, hw, -hl, y, -hw);
    }
    return new Float32Array(positions);
  }, [config.length, config.width, floors, floorH]);

  const edgeLines = useMemo(() => {
    const positions: number[] = [];
    const hl = config.length / 2;
    const hw = config.width / 2;
    const h = buildingHeight;
    const corners = [
      [-hl, 0, -hw],
      [hl, 0, -hw],
      [hl, 0, hw],
      [-hl, 0, hw],
    ] as const;
    for (const c of corners) {
      positions.push(c[0], 0, c[2], c[0], h, c[2]);
    }
    return new Float32Array(positions);
  }, [config.length, config.width, buildingHeight]);

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={meshRef} castShadow receiveShadow position={[0, buildingHeight / 2, 0]}>
        <boxGeometry args={[config.length, buildingHeight, config.width]} />
        <meshPhysicalMaterial
          color="#a5c8ff"
          transmission={0.55}
          thickness={1.2}
          roughness={0.08}
          metalness={0.15}
          ior={1.45}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transparent
          opacity={0.78}
          reflectivity={0.55}
          envMapIntensity={1}
          attenuationColor="#7ab8ff"
          attenuationDistance={8}
        />
      </mesh>
      <group ref={groupRef}>
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={floorLines.length / 3}
              array={floorLines}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#3d8bff" transparent opacity={0.75} />
        </lineSegments>
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={edgeLines.length / 3}
              array={edgeLines}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#5da0ff" transparent opacity={0.9} />
        </lineSegments>
      </group>
      <mesh castShadow position={[0, buildingHeight + 0.15, 0]}>
        <boxGeometry args={[config.length + 0.8, 0.3, config.width + 0.8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.45} />
      </mesh>
    </group>
  );
}

interface ShadowPolygonLayerProps {
  polygon: THREE.Vector3[];
}

function ShadowPolygonLayer({ polygon }: ShadowPolygonLayerProps) {
  const geometry = useMemo(() => {
    if (polygon.length < 3) return new THREE.BufferGeometry();
    const shape = new THREE.Shape();
    shape.moveTo(polygon[0].x, polygon[0].z);
    for (let i = 1; i < polygon.length; i++) {
      shape.lineTo(polygon[i].x, polygon[i].z);
    }
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [polygon]);

  if (polygon.length < 3) return null;

  return (
    <group position={[0, 0.045, 0]}>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#0c1220" transparent opacity={0.62} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color="#e94560" transparent opacity={0.25} />
      </lineSegments>
    </group>
  );
}

interface TrailAndIsochronProps {
  shadowData: ShadowData;
  options: DisplayOptions;
}

function TrailAndIsochron({ shadowData, options }: TrailAndIsochronProps) {
  const trailGeom = useMemo(() => {
    if (!options.showShadowTrail || shadowData.shadowTrail.length < 2) return null;
    const positions: number[] = [];
    for (const p of shadowData.shadowTrail) {
      positions.push(p.x, 0.07, p.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.computeBoundingSphere();
    return geo;
  }, [shadowData.shadowTrail, options.showShadowTrail]);

  return (
    <group>
      {trailGeom && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={trailGeom.attributes.position.count}
              array={(trailGeom.attributes.position as THREE.BufferAttribute).array as Float32Array}
              itemSize={3}
            />
          </bufferGeometry>
          <lineDashedMaterial
            color="#e94560"
            dashSize={1.4}
            gapSize={1}
            transparent
            opacity={0.9}
          />
        </lineSegments>
      )}
      {options.showIsochron &&
        shadowData.isochrons.map((iso, idx) => {
          if (iso.points.length < 2) return null;
          const positions: number[] = [];
          for (const p of iso.points) positions.push(p.x, 0.065, p.z);
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
          const colors = ['#22c55e', '#84cc16', '#eab308', '#f97316'];
          return (
            <points key={idx}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={positions.length / 3}
                  array={new Float32Array(positions)}
                  itemSize={3}
                />
              </bufferGeometry>
              <pointsMaterial
                size={0.45}
                color={colors[idx % colors.length]}
                transparent
                opacity={0.9}
                sizeAttenuation
              />
            </points>
          );
        })}
    </group>
  );
}

interface ClickMarkerProps {
  point: THREE.Vector3 | null;
}

function ClickMarker({ point }: ClickMarkerProps) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ref.current) {
      const t = s.clock.getElapsedTime();
      ref.current.rotation.z = t * 1.5;
      const s2 = 1 + Math.sin(t * 3) * 0.08;
      ref.current.scale.setScalar(s2);
    }
  });
  if (!point) return null;
  return (
    <group position={[point.x, 0.12, point.z]}>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.55, 48]} />
        <meshBasicMaterial color="#e94560" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.12, 24]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  );
}

interface SceneInnerProps {
  buildingConfig: BuildingConfig;
  sunPos: ReturnType<typeof getSunPosition>;
  displayOptions: DisplayOptions;
  shadowData: ShadowData | null;
  onGroundClick: (info: GroundClickInfo) => void;
  dateStr: string;
}

function SceneInner({
  buildingConfig,
  sunPos,
  displayOptions,
  shadowData,
  onGroundClick,
  dateStr,
}: SceneInnerProps) {
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const [hoverPoint, setHoverPoint] = useState<THREE.Vector3 | null>(null);

  const liveShadowPolygon = useMemo(
    () => computeShadowPolygon(buildingConfig, sunPos.direction),
    [buildingConfig, sunPos.direction]
  );

  useEffect(() => {
    const canvas = gl.domElement;
    const handleMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const point = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(ground, point)) {
        const half = GRID_SIZE / 2;
        if (
          point.x >= -half &&
          point.x <= half &&
          point.z >= -half &&
          point.z <= half
        ) {
          setHoverPoint(point.clone());
          canvas.style.cursor = 'crosshair';
          return;
        }
      }
      setHoverPoint(null);
    };
    const handleLeave = () => {
      setHoverPoint(null);
    };
    const handleClick = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const point = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(ground, point) && shadowData) {
        const info = lookupPointInfo(
          shadowData.heatmapGrid,
          shadowData.gridBounds,
          point.x,
          point.z
        );
        onGroundClick({
          point: { x: point.x, z: point.z },
          dateStr,
          timeSlots: info?.timeSlots || [],
          shadowCoverageRatio: info?.shadowCoverageRatio || 0,
        });
      }
    };
    canvas.addEventListener('pointermove', handleMove);
    canvas.addEventListener('pointerleave', handleLeave);
    canvas.addEventListener('click', handleClick);
    return () => {
      canvas.removeEventListener('pointermove', handleMove);
      canvas.removeEventListener('pointerleave', handleLeave);
      canvas.removeEventListener('click', handleClick);
    };
  }, [camera, gl, shadowData, onGroundClick, dateStr, raycaster, pointer]);

  return (
    <>
      <fog attach="fog" args={['#0f172a', 80, 280]} />
      <color attach="background" args={['#0f172a']} />

      <ambientLight intensity={0.38} color="#cfe2ff" />
      <hemisphereLight args={['#93c5fd', '#1e293b', 0.45]} />

      <Stars radius={150} depth={80} count={1800} factor={3} fade speed={0.4} />

      <AnimatedSun targetPosition={sunPos.vector3} targetAltitude={sunPos.altitude} />
      <Building config={buildingConfig} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
        <meshStandardMaterial color="#2a3448" roughness={0.98} metalness={0.03} />
      </mesh>

      <Grid
        args={[GRID_SIZE, GRID_SIZE]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#3b4662"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#516083"
        fadeDistance={140}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
        position={[0, 0.015, 0]}
      />

      <ShadowPolygonLayer polygon={liveShadowPolygon} />
      {shadowData && <TrailAndIsochron shadowData={shadowData} options={displayOptions} />}
      {shadowData && displayOptions.showHeatmap && (
        <ShadowHeatmap shadowData={shadowData} visible={displayOptions.showHeatmap} />
      )}

      <ClickMarker point={hoverPoint} />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={15}
        maxDistance={200}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 5, 0]}
        makeDefault
      />
    </>
  );
}

interface SceneViewProps {
  buildingConfig: BuildingConfig;
  currentDate: Date;
  currentHour: number;
  displayOptions: DisplayOptions;
  shadowData: ShadowData | null;
  onGroundClick: (info: GroundClickInfo) => void;
  dateStr: string;
  onShadowDataReady?: (data: ShadowData) => void;
}

export default function SceneView({
  buildingConfig,
  currentDate,
  currentHour,
  displayOptions,
  shadowData,
  onGroundClick,
  dateStr,
  onShadowDataReady,
}: SceneViewProps) {
  const sunPos = useMemo(
    () => getSunPosition(currentDate, currentHour, DEFAULT_LATITUDE, DEFAULT_LONGITUDE),
    [currentDate, currentHour]
  );

  useEffect(() => {
    if (onShadowDataReady && !shadowData) {
      const t0 = performance.now();
      const data = computeAllShadowData(
        buildingConfig,
        currentDate,
        currentHour,
        DEFAULT_LATITUDE,
        DEFAULT_LONGITUDE
      );
      console.log(`[ShadowCalc] Initial data computed in ${(performance.now() - t0).toFixed(0)}ms`);
      onShadowDataReady(data);
    }
  }, [buildingConfig, currentDate, shadowData, onShadowDataReady, currentHour]);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [50, 38, 58], fov: 48, near: 0.1, far: 1000 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        gl.setClearColor(new THREE.Color('#0f172a'));
      }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <SceneInner
        buildingConfig={buildingConfig}
        sunPos={sunPos}
        displayOptions={displayOptions}
        shadowData={shadowData}
        onGroundClick={onGroundClick}
        dateStr={dateStr}
      />
    </Canvas>
  );
}
