import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from './store/useStore';
import { themes } from './types';
import { Starfield } from './scene/Starfield';
import { BeatBars } from './elements/BeatBars';
import { ParticleGalaxy } from './elements/ParticleGalaxy';
import { WaveSphere } from './elements/WaveSphere';
import { LightWall } from './elements/LightWall';
import type { SceneElement } from './types';

function SceneLighting() {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const theme = useStore((state) => state.theme);

  useFrame((state) => {
    const storeState = useStore.getState();
    const frequencyData = storeState.frequencyData;
    const currentTheme = storeState.theme;
    const themeColors = themes[currentTheme];

    if (lightRef.current) {
      const lowEnd = Math.floor(frequencyData.length * 0.2);
      let lowSum = 0;
      for (let i = 0; i < lowEnd; i++) {
        lowSum += frequencyData[i];
      }
      const lowAvg = lowEnd > 0 ? lowSum / lowEnd : 0;
      const normalizedLow = lowAvg / 255;

      lightRef.current.intensity = 0.5 + normalizedLow * 0.3;
      lightRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.5) * 2 + normalizedLow * 0.5;
      lightRef.current.position.y = 3 + Math.sin(state.clock.elapsedTime * 0.3) * 0.5;
      lightRef.current.color.set(themeColors.lightColor);
    }

    if (pointLightRef.current) {
      pointLightRef.current.color.set(themeColors.secondary);
    }
  });

  const themeColors = themes[theme];

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight
        ref={lightRef}
        position={[5, 5, 5]}
        intensity={0.5}
        color={themeColors.lightColor}
      />
      <pointLight
        ref={pointLightRef}
        position={[-5, 2, -5]}
        intensity={0.3}
        color={themeColors.secondary}
      />
    </>
  );
}

function SceneBackground() {
  const { scene } = useThree();
  const theme = useStore((state) => state.theme);

  useFrame(() => {
    const currentTheme = useStore.getState().theme;
    const themeColors = themes[currentTheme];
    scene.background = new THREE.Color(themeColors.bg);
  });

  return null;
}

function ElementsRenderer() {
  const elements = useStore((state) => state.elements);
  const selectElement = useStore((state) => state.selectElement);

  const handleSceneClick = (e: any) => {
    if (e.target === e.currentTarget || !e.object || e.object.userData?.isBackground) {
      selectElement(null);
    }
  };

  const renderElement = (element: SceneElement) => {
    switch (element.type) {
      case 'beatBars':
        return <BeatBars key={element.id} element={element} />;
      case 'particleGalaxy':
        return <ParticleGalaxy key={element.id} element={element} />;
      case 'waveSphere':
        return <WaveSphere key={element.id} element={element} />;
      case 'lightWall':
        return <LightWall key={element.id} element={element} />;
      default:
        return null;
    }
  };

  return (
    <group onClick={handleSceneClick}>
      {elements.map((element) => renderElement(element))}
    </group>
  );
}

function SceneContent() {
  return (
    <>
      <SceneBackground />
      <SceneLighting />
      <Starfield />
      <ElementsRenderer />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={30}
      />
    </>
  );
}

export function SceneManager() {
  const theme = useStore((state) => state.theme);
  const themeColors = themes[theme];

  const bgColor = useMemo(() => {
    return new THREE.Color(themeColors.bg);
  }, [themeColors.bg]);

  return (
    <Canvas
      camera={{ position: [0, 2, 8], fov: 60 }}
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
      onCreated={({ gl, scene }) => {
        scene.background = bgColor;
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }}
    >
      <SceneContent />
    </Canvas>
  );
}

export default SceneManager;
