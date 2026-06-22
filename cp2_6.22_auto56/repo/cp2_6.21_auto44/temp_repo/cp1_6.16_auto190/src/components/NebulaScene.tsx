import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useNebulaStore, ParticleData, NebulaParams } from '../store/useNebulaStore';
import { nebulaEngine } from '../core/nebulaEngine';

interface NebulaPointsProps {
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
}

const NebulaPoints: React.FC<NebulaPointsProps> = ({ cameraRef }) => {
  const particleData = useNebulaStore((s) => s.particleData);
  const setParticleData = useNebulaStore((s) => s.setParticleData);
  const params = useNebulaStore((s) => s.params);
  const { camera } = useThree();

  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const fadeRef = useRef(0);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    (cameraRef as React.MutableRefObject<any>).current = camera;
  }, [camera, cameraRef]);

  useEffect(() => {
    const callback = (data: ParticleData) => {
      setParticleData(data);
    };
    nebulaEngine.setUpdateCallback(callback);
    nebulaEngine.init(params);
    nebulaEngine.start();

    return () => {
      nebulaEngine.stop();
    };
  }, []);

  useEffect(() => {
    nebulaEngine.updateParams(params);
  }, [params]);

  const spriteTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  const updateGeometry = useCallback(() => {
    if (!geometryRef.current || !particleData) return;
    const geo = geometryRef.current;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const colorAttr = geo.getAttribute('color') as THREE.BufferAttribute;
    const sizeAttr = geo.getAttribute('size') as THREE.BufferAttribute;

    if (particleData.positions.length === posAttr.array.length) {
      (posAttr.array as Float32Array).set(particleData.positions);
      (colorAttr.array as Float32Array).set(particleData.colors);
      (sizeAttr.array as Float32Array).set(particleData.sizes);
      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
    }
  }, [particleData]);

  useEffect(() => {
    updateGeometry();
  }, [particleData, updateGeometry]);

  useFrame((state, delta) => {
    if (fadeRef.current < 1) {
      fadeRef.current = Math.min(1, fadeRef.current + delta / 2);
      setOpacity(fadeRef.current);
    }

    if (pointsRef.current) {
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = opacity;
    }
  });

  const count = params.particleCount;

  const initialGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 0.1;
      positions[i3 + 1] = (Math.random() - 0.5) * 0.1;
      positions[i3 + 2] = (Math.random() - 0.5) * 0.1;
      colors[i3] = 0;
      colors[i3 + 1] = 0.6;
      colors[i3 + 2] = 1;
      sizes[i] = 0.1;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [count]);

  return (
    <points ref={pointsRef} geometry={initialGeometry} frustumCulled={false}>
      <primitive object={initialGeometry} ref={geometryRef} attach="geometry" />
      <pointsMaterial
        size={params.particleSize * 2}
        vertexColors
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        map={spriteTexture}
      />
    </points>
  );
};

interface CameraControllerProps {
  autoRotate: boolean;
  autoRotateSpeed: number;
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
  controlsRef: React.MutableRefObject<any>;
}

const CameraController: React.FC<CameraControllerProps> = ({
  autoRotate,
  autoRotateSpeed,
  cameraRef,
  controlsRef
}) => {
  const angleRef = useRef(0);

  useFrame((state, delta) => {
    if (!autoRotate) return;
    const { camera } = state;
    if (cameraRef.current) {
      angleRef.current += delta * autoRotateSpeed * 0.3;
      const radius = 120;
      camera.position.x = Math.sin(angleRef.current) * radius;
      camera.position.z = Math.cos(angleRef.current) * radius;
      camera.position.y = 40;
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
    }
  });

  return null;
};

interface NebulaSceneProps {
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
  controlsRef: React.MutableRefObject<any>;
  autoRotate: boolean;
  autoRotateSpeed: number;
}

const NebulaScene: React.FC<NebulaSceneProps> = ({
  cameraRef,
  controlsRef,
  autoRotate,
  autoRotateSpeed
}) => {
  const params = useNebulaStore((s) => s.params);

  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true
      }}
      camera={{
        position: [0, 40, 120],
        fov: 60,
        near: 0.1,
        far: 2000
      }}
      dpr={[1, 2]}
      style={{ background: '#000000' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#000000');
      }}
    >
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#00D4FF" distance={100} />

      <NebulaPoints cameraRef={cameraRef} />

      <Stars
        radius={300}
        depth={60}
        count={2000}
        factor={7}
        saturation={0}
        fade
        speed={1}
      />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={20}
        maxDistance={300}
        enablePan={true}
        enableRotate={true}
        enableZoom={true}
      />

      <CameraController
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
        cameraRef={cameraRef}
        controlsRef={controlsRef}
      />
    </Canvas>
  );
};

export default NebulaScene;
