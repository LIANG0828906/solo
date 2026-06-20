import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { themes } from '../types';
import { Starfield } from './Starfield';
import { BeatBars } from '../elements/BeatBars';
import { ParticleGalaxy } from '../elements/ParticleGalaxy';
import { WaveSphere } from '../elements/WaveSphere';
import { LightWall } from '../elements/LightWall';
import type { SceneElement } from '../types';

function SceneLighting() {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const theme = useStore((state) => state.theme);
  const frequencyData = useStore((state) => state.frequencyData);

  useFrame((state) => {
    if (lightRef.current) {
      const lowAvg = frequencyData.slice(0, Math.floor(frequencyData.length * 0.2))
        .reduce((a, b) => a + b, 0) / Math.floor(frequencyData.length * 0.2);
      const normalizedLow = lowAvg / 255;

      lightRef.current.intensity = 0.5 + normalizedLow * 0.3;
      lightRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.5) * 2 + normalizedLow * 0.5;
      lightRef.current.position.y = 3 + Math.sin(state.clock.elapsedTime * 0.3) * 0.5;
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
        position={[-5, 2, -5]}
        intensity={0.3}
        color={themeColors.secondary}
      />
    </>
  );
}

function SceneContent() {
  const elements = useStore((state) => state.elements);
  const selectElement = useStore((state) => state.selectElement);

  const handleSceneClick = (e: any) => {
    if (e.target === e.currentTarget || !e.object) {
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
    <>
      <SceneLighting />
      <Starfield />
      <group onClick={handleSceneClick}>
        {elements.map((element) => renderElement(element))}
      </group>
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={30}
      />
    </>
  );
}

interface SceneProps {
  canvasRef?: React.Ref<HTMLCanvasElement>;
}

export function Scene({ canvasRef }: SceneProps) {
  const theme = useStore((state) => state.theme);
  const themeColors = themes[theme];

  const bgColor = useMemo(() => {
    return new THREE.Color(themeColors.bg);
  }, [themeColors.bg]);

  return (
    <Canvas
      ref={canvasRef}
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

export default Scene;
