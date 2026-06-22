import { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { SceneData } from '../types';
import { scenes } from '../data';
import './SceneViewer.css';
import * as THREE from 'three';

interface GeometryConfig {
  type: string;
  position: [number, number, number];
  scale: number;
  rotationSpeed: number;
  floatSpeed: number;
  floatOffset: number;
  color: string;
}

function generateGeometryConfigs(scene: SceneData, count: number): GeometryConfig[] {
  const configs: GeometryConfig[] = [];
  const { primaryColor, accentColor, geometryTypes } = scene;

  for (let i = 0; i < count; i++) {
    configs.push({
      type: geometryTypes[i % geometryTypes.length],
      position: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4,
      ],
      scale: 0.3 + Math.random() * 0.7,
      rotationSpeed: 0.5 + Math.random() * 1,
      floatSpeed: 1 + Math.random(),
      floatOffset: Math.random() * Math.PI * 2,
      color: i % 2 === 0 ? primaryColor : accentColor,
    });
  }
  return configs;
}

interface GeometryItemProps {
  config: GeometryConfig;
  opacity: number;
}

function GeometryItem({ config, opacity }: GeometryItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01 * config.rotationSpeed;
      meshRef.current.rotation.y += 0.012 * config.rotationSpeed;
    }
    if (groupRef.current) {
      const float = Math.sin(clock.elapsedTime * config.floatSpeed + config.floatOffset) * 0.2;
      groupRef.current.position.y = config.position[1] + float;
    }
  });

  const renderGeometry = () => {
    switch (config.type) {
      case 'box':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'sphere':
        return <sphereGeometry args={[0.6, 32, 32]} />;
      case 'cone':
        return <coneGeometry args={[0.6, 1.2, 32]} />;
      case 'cylinder':
        return <cylinderGeometry args={[0.4, 0.4, 1.2, 32]} />;
      case 'torus':
        return <torusGeometry args={[0.5, 0.2, 16, 48]} />;
      case 'torusKnot':
        return <torusKnotGeometry args={[0.5, 0.18, 128, 32]} />;
      case 'octahedron':
        return <octahedronGeometry args={[0.7]} />;
      case 'icosahedron':
        return <icosahedronGeometry args={[0.7]} />;
      case 'dodecahedron':
        return <dodecahedronGeometry args={[0.65]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <group
      ref={groupRef}
      position={[config.position[0], config.position[1], config.position[2]]}
      scale={config.scale}
    >
      <mesh ref={meshRef}>
        {renderGeometry()}
        <meshStandardMaterial
          color={config.color}
          metalness={0.3}
          roughness={0.4}
          transparent
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}

interface SceneContentProps {
  sceneData: SceneData;
  opacity: number;
}

function SceneContent({ sceneData, opacity }: SceneContentProps) {
  const groupRef = useRef<THREE.Group>(null);
  const configs = useMemo(() => generateGeometryConfigs(sceneData, 24), [sceneData]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  return (
    <group ref={groupRef}>
      {configs.map((config, index) => (
        <GeometryItem key={index} config={config} opacity={opacity} />
      ))}
    </group>
  );
}

interface SceneViewerProps {
  scene: SceneData;
  onBack: () => void;
  onSceneChange: (scene: SceneData) => void;
}

export function SceneViewer({ scene, onBack, onSceneChange }: SceneViewerProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [displayScene, setDisplayScene] = useState(scene);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSceneChange = useCallback(
    (newScene: SceneData) => {
      if (isTransitioning || newScene.id === displayScene.id) return;

      setIsTransitioning(true);
      setShowDropdown(false);

      setOpacity(0);
      setTimeout(() => {
        setDisplayScene(newScene);
        onSceneChange(newScene);
        setTimeout(() => {
          setOpacity(1);
          setIsTransitioning(false);
        }, 50);
      }, 400);
    },
    [displayScene.id, isTransitioning, onSceneChange]
  );

  return (
    <div className="scene-viewer">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-5, -3, -5]} intensity={0.3} />
        <SceneContent sceneData={displayScene} opacity={opacity} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={4}
          maxDistance={20}
          enablePan={false}
        />
      </Canvas>

      <button className="back-button" onClick={onBack}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="scene-selector">
        <button
          className="scene-label"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          {scene.name}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {showDropdown && (
          <div className="dropdown-menu">
            {scenes.map((s) => (
              <div
                key={s.id}
                className={`dropdown-item ${s.id === scene.id ? 'active' : ''}`}
                onClick={() => handleSceneChange(s)}
              >
                <div
                  className="color-dot"
                  style={{ backgroundColor: s.primaryColor }}
                />
                {s.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
