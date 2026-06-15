import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import Ocean from './Ocean';
import Ship from './Ship';
import { useStore } from '@/store/useStore';

const SceneController = () => {
  const { camera, scene } = useThree();
  const calculatePhysics = useStore((state) => state.calculatePhysics);
  const autoRecordLog = useStore((state) => state.autoRecordLog);
  const shipPosition = useStore((state) => state.shipPosition);
  const shipRotation = useStore((state) => state.shipRotation);
  const speed = useStore((state) => state.speed);
  const rudderAngle = useStore((state) => state.rudderAngle);
  const roll = useStore((state) => state.roll);
  const screenBrightness = useStore((state) => state.screenBrightness);
  const elapsedTimeRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    scene.background = new THREE.Color('#0a1a2a');
    scene.fog = new THREE.FogExp2('#0a1a2a', 0.02);
  }, [scene]);

  useFrame((state, delta) => {
    const elapsedTime = state.clock.getElapsedTime();
    const deltaTime = Math.min(delta, 0.1);
    elapsedTimeRef.current = elapsedTime;

    calculatePhysics(deltaTime, elapsedTime);

    const currentTime = Date.now();
    if (currentTime - lastTimeRef.current >= 1000) {
      autoRecordLog(currentTime);
      lastTimeRef.current = currentTime;
    }

    const targetX = shipPosition[0] + Math.sin((shipRotation[1] + rudderAngle * 0.01) * deltaTime) * speed * deltaTime;
    const targetZ = shipPosition[2] + Math.cos((shipRotation[1] + rudderAngle * 0.01) * deltaTime) * speed * deltaTime;
    const newY = Math.sin(elapsedTime * 0.5) * 0.1;

    const newRotation: [number, number, number] = [
      shipRotation[0],
      shipRotation[1] + (rudderAngle * 0.005 * deltaTime * 60),
      shipRotation[2],
    ];

    useStore.getState().setShipPosition([targetX, newY, targetZ]);
    useStore.getState().setShipRotation(newRotation);

    const cameraOffset = new THREE.Vector3(
      Math.sin(shipRotation[1]) * 8,
      4,
      Math.cos(shipRotation[1]) * 8
    );
    const targetCameraPos = new THREE.Vector3(
      shipPosition[0] + cameraOffset.x,
      shipPosition[1] + cameraOffset.y,
      shipPosition[2] + cameraOffset.z
    );
    camera.position.lerp(targetCameraPos, 0.05);
    camera.lookAt(shipPosition[0], shipPosition[1] + 1, shipPosition[2]);

    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.density = 0.02 + (1 - screenBrightness) * 0.02;
    }
  });

  return null;
};

const SceneContent = () => {
  const windLevel = useStore((state) => state.windLevel);
  const screenBrightness = useStore((state) => state.screenBrightness);

  const ambientIntensity = 0.3 + screenBrightness * 0.3;
  const directionalIntensity = 0.5 + screenBrightness * 0.5;

  return (
    <>
      <ambientLight intensity={ambientIntensity} color="#aabbcc" />
      <directionalLight
        position={[10, 10, 5]}
        intensity={directionalIntensity}
        color="#ffffff"
        castShadow
      />
      
      <Sky
        distance={450000}
        sunPosition={[100, 20 - windLevel * 10, 100]}
        inclination={0.5 + windLevel * 0.1}
        azimuth={0.25}
      />
      
      <Ocean />
      <Ship />
      <SceneController />
    </>
  );
};

const Scene = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 4, 8], fov: 60 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneContent />
    </Canvas>
  );
};

export default Scene;
