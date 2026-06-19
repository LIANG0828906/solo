import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Environment: React.FC = () => {
  const groundRef = useRef<THREE.Mesh>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (dirLightRef.current?.shadow) {
      dirLightRef.current.shadow.needsUpdate = true;
    }
  });

  return (
    <>
      <color attach="background" args={['#0A0B14']} />
      <fog attach="fog" args={['#0A0B14', 10, 50]} />

      <ambientLight intensity={0.3} />

      <directionalLight
        ref={dirLightRef}
        position={[10, 15, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0001}
      />

      <mesh
        ref={groundRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -4, 0]}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          color="#1a1c2e"
          metalness={0.3}
          roughness={0.2}
          envMapIntensity={0.5}
        />
      </mesh>

      <mesh position={[0, 0, -15]}>
        <sphereGeometry args={[30, 32, 32]} />
        <shaderMaterial
          side={THREE.BackSide}
          uniforms={{
            topColor: { value: new THREE.Color('#4A2A6A') },
            bottomColor: { value: new THREE.Color('#0B0D17') },
          }}
          vertexShader={`
            varying vec3 vWorldPosition;
            void main() {
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
              vWorldPosition = worldPosition.xyz;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            varying vec3 vWorldPosition;
            void main() {
              float h = normalize(vWorldPosition).y * 0.5 + 0.5;
              gl_FragColor = vec4(mix(bottomColor, topColor, h), 1.0);
            }
          `}
        />
      </mesh>
    </>
  );
};

export default Environment;
