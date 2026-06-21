import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  ParticleParams,
  ForceFieldParams,
  RenderParams,
} from '../types';
import { ParticleEngine } from '../utils/particleEngine';

interface ParticleSceneProps {
  particleParams: ParticleParams;
  forceFieldParams: ForceFieldParams;
  renderParams: RenderParams;
  resetSignal: number;
  canvasRef?: React.MutableRefObject<HTMLCanvasElement | null>;
  onFpsUpdate?: (fps: number) => void;
}

interface ParticleSystemProps {
  particleParams: ParticleParams;
  forceFieldParams: ForceFieldParams;
  renderParams: RenderParams;
  resetSignal: number;
  onFpsUpdate?: (fps: number) => void;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({
  particleParams,
  forceFieldParams,
  renderParams,
  resetSignal,
  onFpsUpdate,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());

  const pointGeom = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(500 * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(500 * 4), 4));
    return geo;
  }, []);

  const lineGeom = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const maxTrailSegs = 500 * 20 * 2;
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxTrailSegs * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxTrailSegs * 4), 4));
    return geo;
  }, []);

  useEffect(() => {
    engineRef.current = new ParticleEngine(
      particleParams,
      forceFieldParams,
      renderParams
    );
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateParams(
        particleParams,
        forceFieldParams,
        renderParams
      );
    }
  }, [particleParams, forceFieldParams, renderParams]);

  useEffect(() => {
    if (engineRef.current && resetSignal > 0) {
      engineRef.current.reset();
    }
  }, [resetSignal]);

  useFrame((_, delta) => {
    if (!engineRef.current) return;
    const safeDelta = Math.min(delta, 0.05);
    const data = engineRef.current.step(safeDelta);

    if (pointsRef.current) {
      const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colorAttr = pointsRef.current.geometry.getAttribute('color') as THREE.BufferAttribute;
      const count = particleParams.count;

      (posAttr.array as Float32Array).set(data.positions);
      (colorAttr.array as Float32Array).set(data.colors);
      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
      posAttr.count = count * 3 / 3;
      colorAttr.count = count * 4 / 4;
      pointsRef.current.geometry.setDrawRange(0, count);
    }

    if (linesRef.current) {
      const lposAttr = linesRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
      const lcolAttr = linesRef.current.geometry.getAttribute('color') as THREE.BufferAttribute;
      const trailLen = renderParams.trailLength;
      const totalSegs = particleParams.count * (trailLen - 1);

      (lposAttr.array as Float32Array).set(data.trailPositions);
      (lcolAttr.array as Float32Array).set(data.trailColors);
      lposAttr.needsUpdate = true;
      lcolAttr.needsUpdate = true;
      linesRef.current.geometry.setDrawRange(0, totalSegs * 2);
    }

    frameCountRef.current++;
    const now = performance.now();
    if (now - lastFpsTimeRef.current >= 500) {
      const fps = Math.round(
        (frameCountRef.current * 1000) / (now - lastFpsTimeRef.current)
      );
      onFpsUpdate?.(fps);
      frameCountRef.current = 0;
      lastFpsTimeRef.current = now;
    }
  });

  const pointsMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: particleParams.size,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useEffect(() => {
    pointsMaterial.size = particleParams.size;
  }, [particleParams.size, pointsMaterial]);

  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  return (
    <>
      <points ref={pointsRef} geometry={pointGeom} material={pointsMaterial} />
      <lineSegments ref={linesRef} geometry={lineGeom} material={lineMaterial} />
    </>
  );
};

const ForceFieldVisuals: React.FC<{ forceFieldParams: ForceFieldParams }> = ({
  forceFieldParams,
}) => {
  const { gravity, vortex, wind } = forceFieldParams;

  const gravArrow = useMemo(() => {
    const dir = new THREE.Vector3();
    const len = Math.min(Math.abs(gravity.strength) * 0.3, 2);
    const origin = new THREE.Vector3(0, 6, -6);
    const axisVec = new THREE.Vector3(
      gravity.axis === 'x' ? 1 : 0,
      gravity.axis === 'y' ? 1 : 0,
      gravity.axis === 'z' ? 1 : 0
    );
    axisVec.multiplyScalar(Math.sign(gravity.strength) || 1);
    return { dir: axisVec, origin, len };
  }, [gravity]);

  const windArrow = useMemo(() => {
    const origin = new THREE.Vector3(-6, 0, 6);
    const rad = (wind.angle * Math.PI) / 180;
    const dir = new THREE.Vector3(Math.cos(rad), 0, Math.sin(rad));
    const len = Math.min(wind.strength * 0.15, 3);
    return { dir, origin, len };
  }, [wind]);

  return (
    <group>
      {Math.abs(gravity.strength) > 0.01 && (
        <>
          <arrowHelper
            args={[
              gravArrow.dir,
              gravArrow.origin,
              gravArrow.len,
              0xfc8181,
              0.4,
              0.2,
            ]}
          />
          <mesh position={[gravArrow.origin.x, gravArrow.origin.y, gravArrow.origin.z]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={0xfc8181} transparent opacity={0.8} />
          </mesh>
        </>
      )}

      {wind.strength > 0.01 && (
        <>
          <arrowHelper
            args={[
              windArrow.dir,
              windArrow.origin,
              windArrow.len,
              0x4fd1c5,
              0.4,
              0.2,
            ]}
          />
          <mesh position={[windArrow.origin.x, windArrow.origin.y, windArrow.origin.z]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={0x4fd1c5} transparent opacity={0.8} />
          </mesh>
        </>
      )}

      {vortex.strength > 0.01 && (
        <group position={[vortex.position.x, vortex.position.y, vortex.position.z]}>
          <mesh>
            <sphereGeometry args={[Math.min(vortex.radius * 0.05, 3), 32, 32]} />
            <meshBasicMaterial
              color={0xb794f0}
              transparent
              opacity={0.15}
              depthWrite={false}
            />
          </mesh>
          <mesh>
            <ringGeometry
              args={[Math.min(vortex.radius * 0.04, 2.5), Math.min(vortex.radius * 0.05, 3), 64]}
            />
            <meshBasicMaterial
              color={0xb794f0}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <VortexIndicator strength={vortex.strength} />
        </group>
      )}
    </group>
  );
};

const VortexIndicator: React.FC<{ strength: number }> = ({ strength }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * Math.min(strength * 0.1, 2);
    }
  });
  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1, 0.02, 8, 48]} />
      <meshBasicMaterial color={0x9f7aea} transparent opacity={0.6} />
    </mesh>
  );
};

const SceneReferenceGrid = () => {
  return (
    <group>
      <gridHelper
        args={[20, 20, 0x2d3748, 0x1a202c]}
        position={[0, -2, 0]}
      />
      <axesHelper args={[3]} />
    </group>
  );
};

interface CameraControllerProps {
  resetSignal: number;
}

const CameraController: React.FC<CameraControllerProps> = ({ resetSignal }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const prevReset = useRef(resetSignal);

  useEffect(() => {
    if (resetSignal !== prevReset.current) {
      prevReset.current = resetSignal;
      const startPos = new THREE.Vector3().copy(camera.position);
      const targetPos = new THREE.Vector3(8, 8, 12);
      const startTime = performance.now();
      const duration = 600;

      const animate = () => {
        const now = performance.now();
        const t = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        camera.position.lerpVectors(startPos, targetPos, eased);
        camera.lookAt(0, 2, 0);
        if (controlsRef.current) {
          controlsRef.current.target.lerp(new THREE.Vector3(0, 2, 0), eased);
          controlsRef.current.update();
        }
        if (t < 1) requestAnimationFrame(animate);
      };
      animate();
    }
  }, [resetSignal, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.5}
      minDistance={3}
      maxDistance={60}
      target={[0, 2, 0]}
    />
  );
};

const CaptureCanvas: React.FC<{
  canvasRef?: React.MutableRefObject<HTMLCanvasElement | null>;
}> = ({ canvasRef }) => {
  const { gl } = useThree();
  useEffect(() => {
    if (canvasRef) {
      canvasRef.current = gl.domElement;
    }
  }, [gl, canvasRef]);
  return null;
};

const ParticleScene: React.FC<ParticleSceneProps> = ({
  particleParams,
  forceFieldParams,
  renderParams,
  resetSignal,
  canvasRef,
  onFpsUpdate,
}) => {
  return (
    <Canvas
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
      camera={{ position: [8, 8, 12], fov: 60, near: 0.1, far: 200 }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x0f172a);
        scene.background = new THREE.Color(0x0f172a);
      }}
    >
      <CaptureCanvas canvasRef={canvasRef} />
      <CameraController resetSignal={resetSignal} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 10]} intensity={0.4} />

      <SceneReferenceGrid />
      <ForceFieldVisuals forceFieldParams={forceFieldParams} />
      <ParticleSystem
        particleParams={particleParams}
        forceFieldParams={forceFieldParams}
        renderParams={renderParams}
        resetSignal={resetSignal}
        onFpsUpdate={onFpsUpdate}
      />
    </Canvas>
  );
};

export default ParticleScene;
