import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import {
  BuildingModelType,
  LIGHT_MODE_PRESETS,
  BUILDING_MODELS,
  LightModePreset,
} from '../types';

const DEG_TO_RAD = Math.PI / 180;
const LERP_DURATION = 0.5;

function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function computeSunPosition(azimuth: number, elevation: number): THREE.Vector3 {
  const az = azimuth * DEG_TO_RAD;
  const el = elevation * DEG_TO_RAD;
  const radius = 12;
  const x = radius * Math.cos(el) * Math.sin(az);
  const y = radius * Math.sin(el);
  const z = radius * Math.cos(el) * Math.cos(az);
  return new THREE.Vector3(x, y, z);
}

interface BuildingProps {
  type: BuildingModelType;
  introStart: number;
}

function VillaBuilding({ introStart }: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const model = BUILDING_MODELS[0];

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const elapsed = performance.now() / 1000 - introStart;
    if (elapsed < 3) {
      const t = elapsed / 3;
      groupRef.current.rotation.y = t * Math.PI * 2;
    } else {
      if (groupRef.current.rotation.y !== 0) {
        const mod = ((groupRef.current.rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(mod, 0, Math.min(1, delta * 2));
        if (Math.abs(groupRef.current.rotation.y) < 0.02) groupRef.current.rotation.y = 0;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
        <boxGeometry args={[4, 1.5, 3.2]} />
        <meshStandardMaterial color={model.wallsColor} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.95, 0]}>
        <boxGeometry args={[4.4, 0.15, 3.6]} />
        <meshStandardMaterial color={model.roofColor} roughness={0.7} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1.65, -0.6]}>
        <boxGeometry args={[1.6, 0.9, 0.08]} />
        <meshStandardMaterial color={model.wallsColor} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.65, 1.62]}>
        <boxGeometry args={[1.2, 1, 0.02]} />
        <meshStandardMaterial
          color={model.windowsColor}
          transparent
          opacity={0.55}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>
      {[-1.3, 1.3].map((x, i) => (
        <mesh key={`win1-${i}`} position={[x, 0.8, 1.61]}>
          <boxGeometry args={[0.7, 0.7, 0.02]} />
          <meshStandardMaterial
            color={model.windowsColor}
            transparent
            opacity={0.55}
            roughness={0.2}
          />
        </mesh>
      ))}
      {[-1.3, 1.3].map((x, i) => (
        <mesh key={`win2-${i}`} position={[x, 0.8, -1.61]}>
          <boxGeometry args={[0.7, 0.7, 0.02]} />
          <meshStandardMaterial
            color={model.windowsColor}
            transparent
            opacity={0.55}
            roughness={0.2}
          />
        </mesh>
      ))}
      {[-2.01, 2.01].map((x, i) => (
        <mesh key={`win3-${i}`} position={[x, 0.8, 0]}>
          <boxGeometry args={[0.02, 0.7, 0.9]} />
          <meshStandardMaterial
            color={model.windowsColor}
            transparent
            opacity={0.55}
            roughness={0.2}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[5, 0.04, 4.2]} />
        <meshStandardMaterial color="#C9BFAE" roughness={1} />
      </mesh>
    </group>
  );
}

function OfficeBuilding({ introStart }: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const model = BUILDING_MODELS[1];
  const floors = 8;
  const floorHeight = 0.75;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const elapsed = performance.now() / 1000 - introStart;
    if (elapsed < 3) {
      const t = elapsed / 3;
      groupRef.current.rotation.y = t * Math.PI * 2;
    } else {
      const mod = ((groupRef.current.rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(mod, 0, Math.min(1, delta * 2));
      if (Math.abs(groupRef.current.rotation.y) < 0.02) groupRef.current.rotation.y = 0;
    }
  });

  const totalH = floors * floorHeight + 0.3;
  return (
    <group ref={groupRef}>
      <mesh castShadow receiveShadow position={[0, totalH / 2, 0]}>
        <boxGeometry args={[2.4, totalH, 2.4]} />
        <meshStandardMaterial color={model.wallsColor} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, totalH + 0.1, 0]}>
        <boxGeometry args={[2.6, 0.2, 2.6]} />
        <meshStandardMaterial color={model.roofColor} roughness={0.7} />
      </mesh>
      {Array.from({ length: floors }).map((_, f) => {
        const y = f * floorHeight + 0.55;
        const xs = [-0.8, 0, 0.8];
        return (
          <React.Fragment key={`floor-${f}`}>
            {xs.map((x, i) => (
              <mesh key={`z+-${f}-${i}`} position={[x, y, 1.21]}>
                <boxGeometry args={[0.5, 0.42, 0.02]} />
                <meshStandardMaterial
                  color={model.windowsColor}
                  transparent
                  opacity={0.5}
                  roughness={0.2}
                />
              </mesh>
            ))}
            {xs.map((x, i) => (
              <mesh key={`z--${f}-${i}`} position={[x, y, -1.21]}>
                <boxGeometry args={[0.5, 0.42, 0.02]} />
                <meshStandardMaterial
                  color={model.windowsColor}
                  transparent
                  opacity={0.5}
                  roughness={0.2}
                />
              </mesh>
            ))}
            {xs.map((z, i) => (
              <mesh key={`x+-${f}-${i}`} position={[1.21, y, z]}>
                <boxGeometry args={[0.02, 0.42, 0.5]} />
                <meshStandardMaterial
                  color={model.windowsColor}
                  transparent
                  opacity={0.5}
                  roughness={0.2}
                />
              </mesh>
            ))}
            {xs.map((z, i) => (
              <mesh key={`x--${f}-${i}`} position={[-1.21, y, z]}>
                <boxGeometry args={[0.02, 0.42, 0.5]} />
                <meshStandardMaterial
                  color={model.windowsColor}
                  transparent
                  opacity={0.5}
                  roughness={0.2}
                />
              </mesh>
            ))}
          </React.Fragment>
        );
      })}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[3.2, 0.04, 3.2]} />
        <meshStandardMaterial color="#C9BFAE" roughness={1} />
      </mesh>
    </group>
  );
}

function MuseumBuilding({ introStart }: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const model = BUILDING_MODELS[2];

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const elapsed = performance.now() / 1000 - introStart;
    if (elapsed < 3) {
      const t = elapsed / 3;
      groupRef.current.rotation.y = t * Math.PI * 2;
    } else {
      const mod = ((groupRef.current.rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(mod, 0, Math.min(1, delta * 2));
      if (Math.abs(groupRef.current.rotation.y) < 0.02) groupRef.current.rotation.y = 0;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow receiveShadow position={[-1.6, 1.2, 0]}>
        <boxGeometry args={[2, 2.4, 3.2]} />
        <meshStandardMaterial color={model.wallsColor} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[1.6, 1.8, 0]}>
        <boxGeometry args={[3.2, 3.6, 3.2]} />
        <meshStandardMaterial color={model.wallsColor} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[1.6, 3.75, 0]}>
        <cylinderGeometry args={[1.5, 1.8, 0.3, 32]} />
        <meshStandardMaterial color={model.roofColor} roughness={0.7} />
      </mesh>
      <mesh position={[1.6, 2.8, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.6, 16]} />
        <meshStandardMaterial
          color={model.windowsColor}
          transparent
          opacity={0.5}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[-1.6, 1.2, 1.61]}>
        <boxGeometry args={[1.2, 1, 0.02]} />
        <meshStandardMaterial
          color={model.windowsColor}
          transparent
          opacity={0.5}
          roughness={0.2}
        />
      </mesh>
      {[-1.6, 1.6].map((x, i) => (
        <mesh key={`entrance-${i}`} position={[x, 0.65, -1.61]}>
          <boxGeometry args={[1.2, 1.1, 0.02]} />
          <meshStandardMaterial
            color={model.windowsColor}
            transparent
            opacity={0.5}
            roughness={0.2}
          />
        </mesh>
      ))}
      <mesh position={[1.6, 1.6, 1.61]}>
        <boxGeometry args={[2.2, 1.2, 0.02]} />
        <meshStandardMaterial
          color={model.windowsColor}
          transparent
          opacity={0.5}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[5.6, 0.04, 4]} />
        <meshStandardMaterial color="#C9BFAE" roughness={1} />
      </mesh>
    </group>
  );
}

function BuildingRenderer({ type, introStart }: BuildingProps) {
  if (type === 'villa') return <VillaBuilding type={type} introStart={introStart} />;
  if (type === 'office') return <OfficeBuilding type={type} introStart={introStart} />;
  return <MuseumBuilding type={type} introStart={introStart} />;
}

interface SceneLightingProps {
  light: ReturnType<typeof useStore.getState>['lightConfig'];
  sunPosition: THREE.Vector3;
}

function SceneLighting({ light, sunPosition }: SceneLightingProps) {
  const directionalRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const fillRef = useRef<THREE.HemisphereLight>(null);
  const { scene } = useThree();

  const targetPreset: LightModePreset = LIGHT_MODE_PRESETS[light.mode];
  const targetAmbient = useMemo(() => hexToColor(targetPreset.ambientColor), [targetPreset.ambientColor]);
  const targetDirectional = useMemo(() => hexToColor(targetPreset.directionalColor), [targetPreset.directionalColor]);
  const targetFill = useMemo(() => hexToColor(targetPreset.fillColor), [targetPreset.fillColor]);

  const currentStateRef = useRef({
    ambientColor: targetAmbient.clone(),
    ambientIntensity: targetPreset.ambientIntensity,
    directionalColor: targetDirectional.clone(),
    directionalIntensity: targetPreset.directionalIntensity,
    fillColor: targetFill.clone(),
    fillIntensity: targetPreset.fillIntensity,
    sunPos: sunPosition.clone(),
    bgColor: hexToColor(targetPreset.background),
  });

  const prevModeRef = useRef(light.mode);
  if (prevModeRef.current !== light.mode) {
    prevModeRef.current = light.mode;
  }

  useEffect(() => {
    scene.background = hexToColor(targetPreset.background);
  }, [targetPreset.background, scene]);

  useFrame(() => {
    const t = Math.min(1, 1 / (LERP_DURATION * 60));
    const cs = currentStateRef.current;
    cs.ambientColor.lerp(targetAmbient, t);
    cs.directionalColor.lerp(targetDirectional, t);
    cs.fillColor.lerp(targetFill, t);
    cs.bgColor.lerp(hexToColor(targetPreset.background), t);
    scene.background = cs.bgColor;

    cs.ambientIntensity = THREE.MathUtils.lerp(cs.ambientIntensity, targetPreset.ambientIntensity, t);
    cs.directionalIntensity = THREE.MathUtils.lerp(cs.directionalIntensity, targetPreset.directionalIntensity, t);
    cs.fillIntensity = THREE.MathUtils.lerp(cs.fillIntensity, targetPreset.fillIntensity, t);
    cs.sunPos.lerp(sunPosition, t);

    if (ambientRef.current) {
      ambientRef.current.color.copy(cs.ambientColor);
      ambientRef.current.intensity = cs.ambientIntensity;
    }
    if (directionalRef.current) {
      directionalRef.current.color.copy(cs.directionalColor);
      directionalRef.current.intensity = cs.directionalIntensity;
      directionalRef.current.position.copy(cs.sunPos);
      directionalRef.current.target.position.set(0, 0, 0);
      directionalRef.current.target.updateMatrixWorld();
    }
    if (fillRef.current) {
      fillRef.current.color.copy(cs.fillColor);
      fillRef.current.groundColor.setHex(0x1a1a2e);
      fillRef.current.intensity = cs.fillIntensity;
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} />
      <hemisphereLight ref={fillRef} />
      <directionalLight
        ref={directionalRef}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
      />
    </>
  );
}

interface SunBeamProps {
  sunPosition: THREE.Vector3;
}

function SunBeam({ sunPosition }: SunBeamProps) {
  const lineRef = useRef<THREE.Line>(null);
  const pointsRef = useMemo(() => new Float32Array(6), []);

  const currentRef = useRef(new THREE.Vector3().copy(sunPosition));
  useFrame(() => {
    currentRef.current.lerp(sunPosition, Math.min(1, 1 / (LERP_DURATION * 60)));
    if (lineRef.current && lineRef.current.geometry) {
      const pos = lineRef.current.geometry.attributes.position;
      pos.setXYZ(0, currentRef.current.x, currentRef.current.y, currentRef.current.z);
      pos.setXYZ(1, 0, 0, 0);
      pos.needsUpdate = true;
      lineRef.current.geometry.computeBoundingSphere();
    }
  });

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={pointsRef}
          count={2}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#FFD54F" transparent opacity={0.7} linewidth={2} />
    </line>
  );
}

function SunMarker({ sunPosition }: SunBeamProps) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.position.lerp(sunPosition, Math.min(1, 1 / (LERP_DURATION * 60)));
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.18, 16, 16]} />
      <meshBasicMaterial color="#FFD54F" />
    </mesh>
  );
}

function GridGround() {
  const gridRef = useRef<THREE.GridHelper>(null);
  useFrame(() => {
    if (gridRef.current) {
      (gridRef.current.material as THREE.Material).opacity = 0.35;
    }
  });
  return (
    <gridHelper
      ref={gridRef}
      args={[4, 8, '#888888', '#888888']}
      position={[0, -0.01, 0]}
    >
      <meshBasicMaterial
        attach="material"
        color="#888888"
        transparent
        opacity={0.35}
      />
    </gridHelper>
  );
}

interface AnalysisPointCubeProps {
  pointId: string;
  position: { x: number; y: number; z: number };
  illuminance: number;
  onRemove: () => void;
  sunDirection: THREE.Vector3;
  lightIntensity: number;
  updateIlluminance: (id: string, v: number) => void;
}

function AnalysisPointCube({
  pointId,
  position,
  onRemove,
  sunDirection,
  lightIntensity,
  updateIlluminance,
}: AnalysisPointCubeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseScale = 1;
  const pos = useMemo(
    () => new THREE.Vector3(position.x, position.y, position.z),
    [position.x, position.y, position.z]
  );

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime;
      const pulse = 1 + Math.sin(t * 3) * 0.25;
      meshRef.current.scale.setScalar(baseScale * pulse);
    }
    const normal = new THREE.Vector3(0, 1, 0);
    const dot = Math.max(0, normal.dot(sunDirection.clone().normalize()));
    const ambientLux = 150;
    const directLux = dot * lightIntensity * 800;
    const lux = Math.round(ambientLux + directLux);
    updateIlluminance(pointId, lux);
  });

  return (
    <group position={pos}>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#FFFF00" emissive="#FFAA00" emissiveIntensity={0.4} roughness={0.5} />
      </mesh>
      <Html
        position={[0, 0.25, 0]}
        center
        zIndexRange={[10, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          onClick={onRemove}
          style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#FFFFFF',
            textShadow: '0 0 4px #000, 0 0 4px #000, 0 0 4px #000',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            pointerEvents: 'auto',
            cursor: 'pointer',
            padding: '2px 5px',
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '3px',
          }}
          title="点击删除此分析点"
        >
          {Math.round(
            150 +
              Math.max(0, new THREE.Vector3(0, 1, 0).dot(sunDirection.clone().normalize())) *
                lightIntensity *
                800
          )}
          lux ✕
        </div>
      </Html>
    </group>
  );
}

interface DragTrajectoryProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
}

function DragTrajectory({ start, end }: DragTrajectoryProps) {
  const lineRef = useRef<THREE.Line>(null);
  const pointsRef = useMemo(() => new Float32Array(6), []);
  useEffect(() => {
    pointsRef[0] = start.x;
    pointsRef[1] = start.y;
    pointsRef[2] = start.z;
    pointsRef[3] = end.x;
    pointsRef[4] = end.y;
    pointsRef[5] = end.z;
  }, [start, end, pointsRef]);

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={pointsRef}
          count={2}
          itemSize={3}
        />
      </bufferGeometry>
      <lineDashedMaterial
        color="#4FC3F7"
        transparent
        opacity={0.7}
        dashSize={0.15}
        gapSize={0.08}
        linewidth={1}
      />
    </line>
  );
}

interface BuildingClickReceiverProps {
  onClickModel: (pos: THREE.Vector3) => void;
  onPointerOver: (pos: THREE.Vector3 | null) => void;
  isDraggingPoint: boolean;
  type: BuildingModelType;
  introStart: number;
  hoverPosition: React.MutableRefObject<THREE.Vector3 | null>;
}

function BuildingClickReceiver({
  onClickModel,
  onPointerOver,
  isDraggingPoint,
  type,
  introStart,
  hoverPosition,
}: BuildingClickReceiverProps) {
  const groupRef = useRef<THREE.Group>(null);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!isDraggingPoint) return;
      e.stopPropagation();
      onClickModel(e.point.clone());
    },
    [isDraggingPoint, onClickModel]
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDraggingPoint) return;
      e.stopPropagation();
      const p = e.point.clone();
      hoverPosition.current = p;
      onPointerOver(p);
    },
    [isDraggingPoint, onPointerOver, hoverPosition]
  );

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerOut={() => onPointerOver(null)}
    >
      <BuildingRenderer type={type} introStart={introStart} />
    </group>
  );
}

interface SceneContentProps {
  introStart: number;
  onCameraPosChange: (p: [number, number, number]) => void;
}

function SceneContent({ introStart, onCameraPosChange }: SceneContentProps) {
  const {
    currentModelId,
    lightConfig,
    analysisPoints,
    isDraggingPoint,
    addAnalysisPoint,
    removeAnalysisPoint,
    updatePointIlluminance,
    setPendingPoint,
    pendingPoint,
  } = useStore();

  const [hoverWorld, setHoverWorld] = useState<THREE.Vector3 | null>(null);
  const hoverPositionRef = useRef<THREE.Vector3 | null>(null);
  const { camera } = useThree();

  const sunPosition = useMemo(
    () => computeSunPosition(lightConfig.sunAzimuth, lightConfig.sunElevation),
    [lightConfig.sunAzimuth, lightConfig.sunElevation]
  );
  const sunDirection = useMemo(
    () => sunPosition.clone().multiplyScalar(-1).normalize(),
    [sunPosition]
  );
  const preset = LIGHT_MODE_PRESETS[lightConfig.mode];
  const lightIntensity = preset.directionalIntensity;

  useEffect(() => {
    const id = setInterval(() => {
      onCameraPosChange([camera.position.x, camera.position.y, camera.position.z]);
    }, 400);
    return () => clearInterval(id);
  }, [camera, onCameraPosChange]);

  const origin = useMemo(() => new THREE.Vector3(0, 0.2, 0), []);

  return (
    <>
      <SceneLighting light={lightConfig} sunPosition={sunPosition} />
      <SunBeam sunPosition={sunPosition} />
      <SunMarker sunPosition={sunPosition} />
      <GridGround />

      <BuildingClickReceiver
        type={currentModelId}
        introStart={introStart}
        isDraggingPoint={isDraggingPoint}
        onClickModel={(p) => {
          addAnalysisPoint({ x: p.x, y: p.y, z: p.z });
          setPendingPoint(null);
        }}
        onPointerOver={(p) => {
          setHoverWorld(p);
          if (p) setPendingPoint({ x: p.x, y: p.y, z: p.z });
        }}
        hoverPosition={hoverPositionRef}
      />

      {isDraggingPoint && hoverWorld && pendingPoint && (
        <DragTrajectory start={origin} end={hoverWorld} />
      )}

      {analysisPoints.map((pt) => (
        <AnalysisPointCube
          key={pt.id}
          pointId={pt.id}
          position={pt.position}
          illuminance={pt.illuminance}
          onRemove={() => removeAnalysisPoint(pt.id)}
          sunDirection={sunDirection}
          lightIntensity={lightIntensity}
          updateIlluminance={updatePointIlluminance}
        />
      ))}

      {isDraggingPoint && hoverWorld && (
        <mesh position={hoverWorld}>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshStandardMaterial
            color="#FFFF00"
            transparent
            opacity={0.5}
            emissive="#FFAA00"
            emissiveIntensity={0.2}
          />
        </mesh>
      )}

      <OrbitControls
        enablePan={false}
        enableRotate={true}
        minDistance={4}
        maxDistance={25}
        target={[0, 1.5, 0]}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.1}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

export default function ScenePanel() {
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const cameraPosRef = useRef<[number, number, number]>([8, 5, 8]);
  const [introStart, setIntroStart] = useState<number>(performance.now() / 1000);
  const { currentModelId } = useStore();
  const prevModelIdRef = useRef(currentModelId);

  useEffect(() => {
    if (prevModelIdRef.current !== currentModelId) {
      prevModelIdRef.current = currentModelId;
      setIntroStart(performance.now() / 1000);
    }
  }, [currentModelId]);

  const onCameraPosChange = useCallback((p: [number, number, number]) => {
    cameraPosRef.current = p;
  }, []);

  useEffect(() => {
    window.__getCameraPosition = () => [...cameraPosRef.current] as [number, number, number];
    window.__getSceneSnapshot = () => {
      const wrap = canvasWrapRef.current;
      if (!wrap) return null;
      const canvas = wrap.querySelector('canvas') as HTMLCanvasElement | null;
      if (!canvas) return null;
      return canvas.toDataURL('image/png');
    };
    return () => {
      window.__getCameraPosition = undefined;
      window.__getSceneSnapshot = undefined;
    };
  }, []);

  return (
    <div
      ref={canvasWrapRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#1A1A2E',
      }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [8, 5, 8], fov: 45 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <SceneContent introStart={introStart} onCameraPosChange={onCameraPosChange} />
      </Canvas>
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          background: 'rgba(0,0,0,0.35)',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#C0B8D0',
          pointerEvents: 'none',
          backdropFilter: 'blur(4px)',
        }}
      >
        拖拽旋转 · 滚轮缩放 · 左侧启用采光点后单击模型表面放置
      </div>
    </div>
  );
}
