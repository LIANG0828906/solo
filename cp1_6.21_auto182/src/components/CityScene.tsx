import { useContext, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { TimeContext } from '../context/TimeContext';
import { Buildings } from './Buildings';
import { Trees } from './Trees';
import { Ground } from './Ground';

interface SceneLightingProps {
  isNight: boolean;
}

function SceneLighting({ isNight }: SceneLightingProps) {
  const ctx = useContext(TimeContext);
  const directionalRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const moonRef = useRef<THREE.PointLight>(null);
  const { scene } = useThree();

  useEffect(() => {
    if (!ctx) return;
    const { lightParams } = ctx;

    if (directionalRef.current) {
      const dirLight = directionalRef.current;
      const [px, py, pz] = lightParams.sunPosition;
      const dist = 15;
      dirLight.position.set(px * dist, py * dist + 5, pz * dist);
      dirLight.color.set(lightParams.sunColor);
      dirLight.intensity = lightParams.sunIntensity;

      if (dirLight.shadow && dirLight.shadow.mapSize) {
        dirLight.shadow.radius = lightParams.shadowBlur * 5;
        dirLight.shadow.bias = -0.0005;
        dirLight.shadow.normalBias = 0.02;
      }
    }

    if (ambientRef.current) {
      ambientRef.current.color.set(lightParams.ambientColor);
      ambientRef.current.intensity = lightParams.ambientIntensity;
    }

    if (moonRef.current) {
      moonRef.current.color.set(lightParams.moonColor);
      moonRef.current.intensity = lightParams.moonIntensity;
    }

    scene.background = new THREE.Color(lightParams.skyColor);
  }, [ctx, scene, isNight]);

  useFrame(() => {
    if (!ctx) return;
    const { lightParams } = ctx;

    if (directionalRef.current) {
      const dirLight = directionalRef.current;
      const targetColor = new THREE.Color(lightParams.sunColor);
      dirLight.color.lerp(targetColor, 0.1);
      dirLight.intensity += (lightParams.sunIntensity - dirLight.intensity) * 0.1;
      const [px, py, pz] = lightParams.sunPosition;
      const dist = 15;
      const targetX = px * dist;
      const targetY = py * dist + 5;
      const targetZ = pz * dist;
      dirLight.position.x += (targetX - dirLight.position.x) * 0.1;
      dirLight.position.y += (targetY - dirLight.position.y) * 0.1;
      dirLight.position.z += (targetZ - dirLight.position.z) * 0.1;

      if (dirLight.shadow) {
        const targetRadius = lightParams.shadowBlur * 5;
        dirLight.shadow.radius += (targetRadius - dirLight.shadow.radius) * 0.1;
      }
    }

    if (ambientRef.current) {
      const targetColor = new THREE.Color(lightParams.ambientColor);
      ambientRef.current.color.lerp(targetColor, 0.1);
      ambientRef.current.intensity +=
        (lightParams.ambientIntensity - ambientRef.current.intensity) * 0.1;
    }

    if (moonRef.current) {
      const targetColor = new THREE.Color(lightParams.moonColor);
      moonRef.current.color.lerp(targetColor, 0.1);
      moonRef.current.intensity +=
        (lightParams.moonIntensity - moonRef.current.intensity) * 0.1;
    }

    const targetBg = new THREE.Color(ctx.lightParams.skyColor);
    if (scene.background instanceof THREE.Color) {
      scene.background.lerp(targetBg, 0.08);
    }
  });

  return (
    <>
      <directionalLight
        ref={directionalRef}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-color={isNight ? '#000000' : '#1E293B'}
      />
      <ambientLight ref={ambientRef} />
      <pointLight
        ref={moonRef}
        position={[0, 25, 0]}
        distance={80}
        decay={2}
      />
    </>
  );
}

function SceneContent() {
  const ctx = useContext(TimeContext);
  const isNight = ctx
    ? ctx.time < 5.5 || ctx.time > 20.5
    : true;

  return (
    <>
      <SceneLighting isNight={isNight} />
      <Ground />
      <Buildings />
      <Trees />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={8}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 2, 0]}
      />
    </>
  );
}

export function CityScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [18, 14, 18], fov: 50, near: 0.1, far: 200 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
    >
      <fog attach="fog" args={['#87CEEB', 40, 80]} />
      <SceneContent />
    </Canvas>
  );
}
