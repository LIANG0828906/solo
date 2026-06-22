import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { ParticleSystem } from '../particleSystem';
import { useParticleStore } from '../store/useParticleStore';
import type { RenderMode } from '../store/useParticleStore';

interface ParticleSystemRendererProps {
  particleSystemRef: React.MutableRefObject<ParticleSystem | null>;
}

const ParticleSystemRenderer: React.FC<ParticleSystemRendererProps> = ({ particleSystemRef }) => {
  const params = useParticleStore((state) => state.params);
  const renderMode = useParticleStore((state) => state.renderMode);
  const updateTransition = useParticleStore((state) => state.updateTransition);
  const isTransitioning = useParticleStore((state) => state.isTransitioning);

  const pointsRef = useRef<THREE.Points>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const initializedRef = useRef(false);

  const circleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      particleSystemRef.current = new ParticleSystem(params);
      initializedRef.current = true;
    }
  }, [particleSystemRef, params]);

  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.setParams(params);
    }
  }, [params, particleSystemRef]);

  useFrame((_, delta) => {
    if (isTransitioning) {
      updateTransition(performance.now());
    }

    if (particleSystemRef.current) {
      particleSystemRef.current.update(delta);

      if (pointsRef.current) {
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        pointsRef.current.geometry.attributes.color.needsUpdate = true;
        pointsRef.current.geometry.attributes.size.needsUpdate = true;
      }
    }
  });

  const pointsMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: circleTexture,
      sizeAttenuation: true,
    });
  }, [circleTexture]);

  if (!particleSystemRef.current) {
    return null;
  }

  return (
    <group>
      <points
        ref={pointsRef}
        geometry={particleSystemRef.current.pointsGeometry}
        material={pointsMaterial}
        visible={renderMode === 'points'}
      />
      <primitive
        object={particleSystemRef.current.instancedMesh}
        visible={renderMode === 'mesh'}
      />
    </group>
  );
};

interface CameraControllerProps {
  autoRotate: boolean;
  controlsRef: React.MutableRefObject<any>;
}

const CameraController: React.FC<CameraControllerProps> = ({ autoRotate, controlsRef }) => {
  const { camera } = useThree();

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 0.5;
    }
  }, [autoRotate, controlsRef]);

  return null;
};

interface SceneContentProps {
  particleSystemRef: React.MutableRefObject<ParticleSystem | null>;
  controlsRef: React.MutableRefObject<any>;
}

const SceneContent: React.FC<SceneContentProps> = ({ particleSystemRef, controlsRef }) => {
  const autoRotate = useParticleStore((state) => state.autoRotate);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[-5, -5, -5]} intensity={0.4} color="#7C3AED" />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#00E5FF" />

      <Stars
        radius={50}
        depth={20}
        count={2000}
        factor={3}
        saturation={0}
        fade
        speed={0.5}
      />

      <ParticleSystemRenderer particleSystemRef={particleSystemRef} />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
      />

      <CameraController autoRotate={autoRotate} controlsRef={controlsRef} />
    </>
  );
};

interface SceneProps {
  particleSystemRef: React.MutableRefObject<ParticleSystem | null>;
  controlsRef: React.MutableRefObject<any>;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

export const Scene: React.FC<SceneProps> = ({ particleSystemRef, controlsRef, canvasRef }) => {
  return (
    <div className="canvas-container gradient-bg">
      <Canvas
        ref={(state) => {
          if (state?.gl?.domElement) {
            canvasRef.current = state.gl.domElement;
          }
        }}
        camera={{ position: [0, 2, 15], fov: 60, near: 0.1, far: 1000 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <fog attach="fog" args={['#0B1120', 20, 60]} />
        <SceneContent particleSystemRef={particleSystemRef} controlsRef={controlsRef} />
      </Canvas>
    </div>
  );
};
