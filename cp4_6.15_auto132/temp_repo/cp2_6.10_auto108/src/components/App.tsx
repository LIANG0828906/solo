import React, { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import ArmillarySphere from './ArmillarySphere';
import UIOverlay from './UIOverlay';

const CameraController: React.FC = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
};

const SceneController: React.FC = () => {
  const { gl } = useThree();

  useEffect(() => {
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.2;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl]);

  return null;
};

const Lighting: React.FC = () => {
  return (
    <>
      <ambientLight intensity={0.3} color="#404060" />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.2}
        color="#fff8e7"
        castShadow
      />
      <directionalLight
        position={[-5, 5, -5]}
        intensity={0.4}
        color="#8b5e3c"
      />
      <pointLight
        position={[0, 3, 0]}
        intensity={0.6}
        color="#ffd700"
        distance={15}
      />
      <hemisphereLight
        color="#1a1a4e"
        groundColor="#0a0a1e"
        intensity={0.4}
      />
    </>
  );
};

const StarsBackground: React.FC = () => {
  const starsRef = useRef<THREE.Points>(null);

  const starGeometry = React.useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    
    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 50 + Math.random() * 30;
      
      positions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      
      const starColor = new THREE.Color();
      starColor.setHSL(0.1 + Math.random() * 0.1, 0.2, 0.7 + Math.random() * 0.3);
      colors.push(starColor.r, starColor.g, starColor.b);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    return geometry;
  }, []);

  const starMaterial = React.useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
  }, []);

  useFrame((_state, delta: number) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.005;
    }
  });

  return (
    <points ref={starsRef} geometry={starGeometry} material={starMaterial} />
  );
};

const App: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f23 100%)' }}
        onCreated={({ gl, scene }) => {
          scene.background = new THREE.Color('#0f0f23');
          gl.setClearColor('#0f0f23', 1);
        }}
      >
        <CameraController />
        <SceneController />
        <Lighting />
        <StarsBackground />
        
        <ArmillarySphere />
        
        <OrbitControls
          enablePan={false}
          minDistance={2.4}
          maxDistance={20}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI * 3 / 4}
          enableDamping
          dampingFactor={0.05}
          autoRotate={false}
        />

        <fog attach="fog" args={['#0a0a1a', 10, 60]} />
      </Canvas>
      
      <UIOverlay />
    </div>
  );
};

export default App;
