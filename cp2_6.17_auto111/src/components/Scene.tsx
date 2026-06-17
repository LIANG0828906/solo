import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  VehicleState,
  IntersectionState,
  GridConfig,
  CAR_LENGTH,
  CAR_WIDTH,
  CAR_HEIGHT
} from '../engine/types';
import { CityGrid } from './CityGrid';
import { VehicleAI } from '../engine/VehicleAI';
import {
  useVehicles,
  useGridConfig,
  useLodEnabled,
  useFollowedVehicleId,
  useSimulationActions,
  useIsTransitioningCamera
} from '../store/useSimulationStore';

interface VehicleMeshProps {
  vehicle: VehicleState;
  useLOD: boolean;
  onClick: () => void;
  isFollowed: boolean;
}

const VehicleMesh: React.FC<VehicleMeshProps> = ({ vehicle, useLOD, onClick, isFollowed }) => {
  const groupRef = useRef<THREE.Group>(null);
  const blinkTimerRef = useRef(0);
  const [blinkState, setBlinkState] = useState(true);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x = vehicle.position.x;
      groupRef.current.position.z = vehicle.position.z;
      groupRef.current.rotation.y = vehicle.rotation;
    }

    if (vehicle.turnIndicatorActive) {
      blinkTimerRef.current += delta;
      const blinkPeriod = 0.5;
      if (blinkTimerRef.current >= blinkPeriod) {
        blinkTimerRef.current = 0;
        setBlinkState((prev: boolean) => !prev);
      }
    } else {
      blinkTimerRef.current = 0;
      setBlinkState(true);
    }
  });

  const indicatorOn = vehicle.turnIndicatorActive && blinkState;

  const showLeftIndicator = vehicle.nextTurn === 'left';
  const showRightIndicator = vehicle.nextTurn === 'right';

  if (useLOD) {
    return (
      <group ref={groupRef} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <mesh position={[0, CAR_HEIGHT / 2, 0]} castShadow>
          <boxGeometry args={[CAR_LENGTH, CAR_HEIGHT, CAR_WIDTH]} />
          <meshStandardMaterial color={vehicle.color} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh position={[0, CAR_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[CAR_LENGTH, CAR_HEIGHT * 0.7, CAR_WIDTH]} />
        <meshStandardMaterial color={vehicle.color} />
      </mesh>
      <mesh position={[-0.3, CAR_HEIGHT * 0.85, 0]} castShadow>
        <boxGeometry args={[CAR_LENGTH * 0.6, CAR_HEIGHT * 0.5, CAR_WIDTH * 0.9]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.7} />
      </mesh>
      {[-1, 1].map((side) => (
        <React.Fragment key={side}>
          <mesh position={[CAR_LENGTH * 0.3, 0.3, side * CAR_WIDTH * 0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
            <meshStandardMaterial color="#222222" />
          </mesh>
          <mesh position={[-CAR_LENGTH * 0.3, 0.3, side * CAR_WIDTH * 0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
            <meshStandardMaterial color="#222222" />
          </mesh>
        </React.Fragment>
      ))}
      <mesh position={[CAR_LENGTH * 0.45, CAR_HEIGHT * 0.3, CAR_WIDTH * 0.35]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[CAR_LENGTH * 0.45, CAR_HEIGHT * 0.3, -CAR_WIDTH * 0.35]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[-CAR_LENGTH * 0.45, CAR_HEIGHT * 0.3, CAR_WIDTH * 0.35]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#FF0000" />
      </mesh>
      <mesh position={[-CAR_LENGTH * 0.45, CAR_HEIGHT * 0.3, -CAR_WIDTH * 0.35]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#FF0000" />
      </mesh>

      {showLeftIndicator && (
        <group>
          <mesh position={[CAR_LENGTH * 0.42, CAR_HEIGHT * 0.25, -CAR_WIDTH * 0.52]}>
            <boxGeometry args={[0.3, 0.3, 0.1]} />
            <meshStandardMaterial
              color={indicatorOn ? '#FFFFCC' : '#444433'}
              emissive={indicatorOn ? '#FFFF99' : '#000000'}
              emissiveIntensity={indicatorOn ? 2 : 0}
            />
          </mesh>
          <mesh position={[-CAR_LENGTH * 0.42, CAR_HEIGHT * 0.25, -CAR_WIDTH * 0.52]}>
            <boxGeometry args={[0.3, 0.3, 0.1]} />
            <meshStandardMaterial
              color={indicatorOn ? '#FFFFCC' : '#444433'}
              emissive={indicatorOn ? '#FFFF99' : '#000000'}
              emissiveIntensity={indicatorOn ? 2 : 0}
            />
          </mesh>
        </group>
      )}

      {showRightIndicator && (
        <group>
          <mesh position={[CAR_LENGTH * 0.42, CAR_HEIGHT * 0.25, CAR_WIDTH * 0.52]}>
            <boxGeometry args={[0.3, 0.3, 0.1]} />
            <meshStandardMaterial
              color={indicatorOn ? '#FFFFCC' : '#444433'}
              emissive={indicatorOn ? '#FFFF99' : '#000000'}
              emissiveIntensity={indicatorOn ? 2 : 0}
            />
          </mesh>
          <mesh position={[-CAR_LENGTH * 0.42, CAR_HEIGHT * 0.25, CAR_WIDTH * 0.52]}>
            <boxGeometry args={[0.3, 0.3, 0.1]} />
            <meshStandardMaterial
              color={indicatorOn ? '#FFFFCC' : '#444433'}
              emissive={indicatorOn ? '#FFFF99' : '#000000'}
              emissiveIntensity={indicatorOn ? 2 : 0}
            />
          </mesh>
        </group>
      )}

      {isFollowed && (
        <mesh position={[0, CAR_HEIGHT + 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 2, 32]} />
          <meshBasicMaterial color="#00D4AA" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

interface TrafficLightProps {
  intersection: IntersectionState;
}

const TrafficLight: React.FC<TrafficLightProps> = ({ intersection }) => {
  const { trafficLight, centerX, centerZ } = intersection;

  const positions = useMemo(() => [
    { x: centerX - 12, z: centerZ - 12, rotation: Math.PI / 4 },
    { x: centerX + 12, z: centerZ - 12, rotation: -Math.PI / 4 },
    { x: centerX + 12, z: centerZ + 12, rotation: -3 * Math.PI / 4 },
    { x: centerX - 12, z: centerZ + 12, rotation: 3 * Math.PI / 4 }
  ], [centerX, centerZ]);

  return (
    <group>
      {positions.map((pos, idx) => {
        const isEastWest = idx % 2 === 0;
        const lights = isEastWest ? trafficLight.eastWest : trafficLight.northSouth;

        return (
          <group key={idx} position={[pos.x, 0, pos.z]} rotation={[0, pos.rotation, 0]}>
            <mesh position={[0, 2, 0]} castShadow>
              <cylinderGeometry args={[0.15, 0.2, 4, 8]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
            <mesh position={[0, 4, 1]} castShadow>
              <boxGeometry args={[0.1, 0.1, 2]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
            <group position={[0, 4, 2]}>
              <mesh position={[0, 0.6, 0]} castShadow>
                <boxGeometry args={[0.6, 1.6, 0.5]} />
                <meshStandardMaterial color="#222222" />
              </mesh>
              <mesh position={[0, 1, 0.3]}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial
                  color={lights.red ? '#FF0000' : '#660000'}
                  emissive={lights.red ? '#FF0000' : '#000000'}
                  emissiveIntensity={lights.red ? 1 : 0}
                />
              </mesh>
              <mesh position={[0, 0, 0.3]}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial
                  color={lights.yellow ? '#FFD700' : '#665500'}
                  emissive={lights.yellow ? '#FFD700' : '#000000'}
                  emissiveIntensity={lights.yellow ? 1 : 0}
                />
              </mesh>
              <mesh position={[0, -1, 0.3]}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial
                  color={lights.green ? '#00FF00' : '#006600'}
                  emissive={lights.green ? '#00FF00' : '#000000'}
                  emissiveIntensity={lights.green ? 1 : 0}
                />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
};

interface CameraControllerProps {}

const CameraController: React.FC<CameraControllerProps> = () => {
  const { camera } = useThree();
  const vehicles = useVehicles();
  const followedVehicleId = useFollowedVehicleId();
  const isTransitioning = useIsTransitioningCamera();
  const { followVehicle, setTransitioningCamera } = useSimulationActions();

  const controlsRef = useRef<any>(null);
  const transitionProgress = useRef(0);
  const startCameraPos = useRef(new THREE.Vector3());
  const startCameraTarget = useRef(new THREE.Vector3());
  const targetCameraPos = useRef(new THREE.Vector3());
  const targetCameraTarget = useRef(new THREE.Vector3());

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const getFollowedVehicle = useCallback(() => {
    return vehicles.find(v => v.id === followedVehicleId);
  }, [vehicles, followedVehicleId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && followedVehicleId) {
        followVehicle(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [followedVehicleId, followVehicle]);

  useEffect(() => {
    if (followedVehicleId && controlsRef.current) {
      const vehicle = getFollowedVehicle();
      if (!vehicle) return;

      startCameraPos.current.copy(camera.position);
      if (controlsRef.current.target) {
        startCameraTarget.current.copy(controlsRef.current.target);
      }

      transitionProgress.current = 0;
      setTransitioningCamera(true);
    } else if (!followedVehicleId && isTransitioning) {
      setTransitioningCamera(false);
    }
  }, [followedVehicleId, isTransitioning, camera, getFollowedVehicle, setTransitioningCamera]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (followedVehicleId) {
      const vehicle = getFollowedVehicle();
      if (!vehicle) {
        followVehicle(null);
        return;
      }

      const dirVec = VehicleAI.getDirectionVector(vehicle.direction);
      const cameraDistance = 15;
      const cameraHeight = 8;

      targetCameraPos.current.set(
        vehicle.position.x - dirVec.x * cameraDistance,
        cameraHeight,
        vehicle.position.z - dirVec.z * cameraDistance
      );

      targetCameraTarget.current.set(
        vehicle.position.x + dirVec.x * 5,
        CAR_HEIGHT * 0.8,
        vehicle.position.z + dirVec.z * 5
      );

      if (isTransitioning) {
        transitionProgress.current += delta / 1.5;
        const t = Math.min(transitionProgress.current, 1);
        const easedT = easeInOutCubic(t);

        camera.position.lerpVectors(
          startCameraPos.current,
          targetCameraPos.current,
          easedT
        );
        controlsRef.current.target.lerpVectors(
          startCameraTarget.current,
          targetCameraTarget.current,
          easedT
        );

        if (t >= 1) {
          setTransitioningCamera(false);
        }
      } else {
        camera.position.lerp(targetCameraPos.current, 0.1);
        controlsRef.current.target.lerp(targetCameraTarget.current, 0.1);
      }

      controlsRef.current.enabled = false;
    } else {
      controlsRef.current.enabled = true;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2}
      minDistance={10}
      maxDistance={200}
      enableDamping
      dampingFactor={0.05}
    />
  );
};

interface SceneContentProps {
  gridConfig: GridConfig;
  engineRef: React.MutableRefObject<any>;
}

const SceneContent: React.FC<SceneContentProps> = ({ gridConfig, engineRef }) => {
  const vehicles = useVehicles();
  const lodEnabled = useLodEnabled();
  const followedVehicleId = useFollowedVehicleId();
  const { camera } = useThree();
  const { followVehicle } = useSimulationActions();

  const intersections = useMemo(() => {
    return engineRef.current?.intersections || new Map();
  }, [engineRef]);

  const vehicleList = useMemo(() => {
    return vehicles.map((vehicle) => {
      let useLOD = false;
      if (lodEnabled && vehicles.length > 200) {
        const dx = vehicle.position.x - camera.position.x;
        const dz = vehicle.position.z - camera.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        useLOD = distance > 100;
      }

      return (
        <VehicleMesh
          key={vehicle.id}
          vehicle={vehicle}
          useLOD={useLOD}
          onClick={() => followVehicle(vehicle.id)}
          isFollowed={vehicle.id === followedVehicleId}
        />
      );
    });
  }, [vehicles, lodEnabled, camera, followedVehicleId, followVehicle]);

  const trafficLights = useMemo(() => {
    const lights: React.ReactNode[] = [];
    intersections.forEach((intersection: IntersectionState) => {
      lights.push(
        <TrafficLight key={intersection.id} intersection={intersection} />
      );
    });
    return lights;
  }, [intersections]);

  return (
    <>
      <CameraController />
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[100, 100, 50]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />
      <fog attach="fog" args={['#0F0F23', 100, 500]} />
      <CityGrid config={gridConfig} />
      {trafficLights}
      {vehicleList}
    </>
  );
};

interface SceneProps {
  engineRef: React.MutableRefObject<any>;
}

export const Scene: React.FC<SceneProps> = ({ engineRef }) => {
  const gridConfig = useGridConfig();

  return (
    <Canvas
      shadows
      camera={{
        position: [150, 120, 150],
        fov: 60,
        near: 0.1,
        far: 1000
      }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#0F0F23' }}
    >
      <SceneContent gridConfig={gridConfig} engineRef={engineRef} />
    </Canvas>
  );
};
