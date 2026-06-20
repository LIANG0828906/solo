import { useRef, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { FractalType } from '../types';
import vertexShader from '../shaders/vertex.glsl?raw';
import fragmentShader from '../shaders/fragment.glsl?raw';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function FractalPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const { size } = useThree();
  const startTime = useMemo(() => Date.now(), []);

  const fractalType = useStore((state) => state.fractalType);
  const currentParams = useStore((state) => state.currentParams);
  const colorMap = useStore((state) => state.colorMap);
  const viewState = useStore((state) => state.viewState);
  const setIsRendering = useStore((state) => state.setIsRendering);
  const setFps = useStore((state) => state.setFps);

  const smoothedView = useRef({ ...viewState });
  const frameCount = useRef(0);
  const lastFpsUpdate = useRef(Date.now());

  const uniforms = useMemo(
    () => ({
      uResolution: { value: new THREE.Vector3(size.width, size.height, 1) },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uFractalType: { value: 0 },
      uIterations: { value: currentParams.iterations },
      uEscapeRadius: { value: currentParams.escapeRadius },
      uPower: { value: currentParams.power },
      uJuliaConstant: { value: new THREE.Vector3(...currentParams.juliaConstant) },
      uAmbientOcclusion: { value: currentParams.ambientOcclusion },
      uInternalColoring: { value: currentParams.internalColoring },
      uCamPos: { value: new THREE.Vector3(0, 0, viewState.zoom) },
      uCamTarget: { value: new THREE.Vector3(viewState.panX, viewState.panY, 0) },
      uCamRotation: { value: new THREE.Matrix4() },
      uColor0: { value: new THREE.Color(...colorMap.colors[0].rgb) },
      uColor1: { value: new THREE.Color(...colorMap.colors[1].rgb) },
      uColor2: { value: new THREE.Color(...colorMap.colors[2].rgb) },
      uColor3: { value: new THREE.Color(...colorMap.colors[3].rgb) }
    }),
    []
  );

  useEffect(() => {
    const fractalTypeMap: Record<FractalType, number> = {
      [FractalType.MANDELBULB]: 0,
      [FractalType.JULIA_SET]: 1,
      [FractalType.QUATERNION]: 2
    };

    if (materialRef.current) {
      materialRef.current.uniforms.uFractalType.value = fractalTypeMap[fractalType];
      materialRef.current.uniforms.uIterations.value = currentParams.iterations;
      materialRef.current.uniforms.uEscapeRadius.value = currentParams.escapeRadius;
      materialRef.current.uniforms.uPower.value = currentParams.power;
      materialRef.current.uniforms.uJuliaConstant.value.set(
        currentParams.juliaConstant[0],
        currentParams.juliaConstant[1],
        currentParams.juliaConstant[2]
      );
      materialRef.current.uniforms.uAmbientOcclusion.value = currentParams.ambientOcclusion;
      materialRef.current.uniforms.uInternalColoring.value = currentParams.internalColoring;
      materialRef.current.uniforms.uColor0.value.set(...colorMap.colors[0].rgb);
      materialRef.current.uniforms.uColor1.value.set(...colorMap.colors[1].rgb);
      materialRef.current.uniforms.uColor2.value.set(...colorMap.colors[2].rgb);
      materialRef.current.uniforms.uColor3.value.set(...colorMap.colors[3].rgb);

      const renderTimer = setTimeout(() => {
        setIsRendering(false);
      }, 200);

      return () => clearTimeout(renderTimer);
    }
  }, [fractalType, currentParams, colorMap, setIsRendering]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uResolution.value.set(size.width, size.height, 1);
    }
  }, [size.width, size.height]);

  useFrame(() => {
    if (!materialRef.current) return;

    const now = Date.now();
    frameCount.current++;

    if (now - lastFpsUpdate.current >= 500) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastFpsUpdate.current));
      setFps(fps);
      frameCount.current = 0;
      lastFpsUpdate.current = now;
    }

    materialRef.current.uniforms.uTime.value = (now - startTime) * 0.001;

    const smoothing = 0.1;
    smoothedView.current.rotationX = lerp(smoothedView.current.rotationX, viewState.rotationX, smoothing);
    smoothedView.current.rotationY = lerp(smoothedView.current.rotationY, viewState.rotationY, smoothing);
    smoothedView.current.zoom = lerp(smoothedView.current.zoom, viewState.zoom, smoothing);
    smoothedView.current.panX = lerp(smoothedView.current.panX, viewState.panX, smoothing);
    smoothedView.current.panY = lerp(smoothedView.current.panY, viewState.panY, smoothing);

    const camDist = smoothedView.current.zoom;
    const rotX = smoothedView.current.rotationX;
    const rotY = smoothedView.current.rotationY;

    const camX = camDist * Math.sin(rotY) * Math.cos(rotX);
    const camY = camDist * Math.sin(rotX);
    const camZ = camDist * Math.cos(rotY) * Math.cos(rotX);

    materialRef.current.uniforms.uCamPos.value.set(
      camX + smoothedView.current.panX,
      camY + smoothedView.current.panY,
      camZ
    );

    materialRef.current.uniforms.uCamTarget.value.set(
      smoothedView.current.panX,
      smoothedView.current.panY,
      0
    );

    const rotMatrix = new THREE.Matrix4();
    rotMatrix.makeRotationFromEuler(new THREE.Euler(rotX, rotY, 0, 'YXZ'));
    materialRef.current.uniforms.uCamRotation.value.copy(rotMatrix);
  });

  const handleMaterialInit = useCallback((material: THREE.ShaderMaterial) => {
    materialRef.current = material;
  }, []);

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[4, 4]} />
      <shaderMaterial
        ref={handleMaterialInit as unknown as React.RefObject<THREE.ShaderMaterial>}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function Scene() {
  const updateViewState = useStore((state) => state.updateViewState);
  const viewState = useStore((state) => state.viewState);

  const handlePointerDown = useCallback(() => {
    updateViewState(viewState);
  }, [updateViewState, viewState]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const panSpeed = 0.1;
      const currentPanX = useStore.getState().viewState.panX;
      const currentPanY = useStore.getState().viewState.panY;

      switch (e.key.toLowerCase()) {
        case 'w':
          updateViewState({ panY: currentPanY + panSpeed });
          break;
        case 's':
          updateViewState({ panY: currentPanY - panSpeed });
          break;
        case 'a':
          updateViewState({ panX: currentPanX - panSpeed });
          break;
        case 'd':
          updateViewState({ panX: currentPanX + panSpeed });
          break;
      }
    },
    [updateViewState]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? 1.1 : 0.9;
      const newZoom = Math.min(10, Math.max(0.5, viewState.zoom * delta));
      updateViewState({ zoom: newZoom });
    },
    [updateViewState, viewState.zoom]
  );

  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
      handlePointerDown();
    },
    [handlePointerDown]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - lastPos.current.x;
      const deltaY = e.clientY - lastPos.current.y;

      lastPos.current = { x: e.clientX, y: e.clientY };

      const rotSpeed = 0.005;
      const currentState = useStore.getState().viewState;

      updateViewState({
        rotationY: currentState.rotationY + deltaX * rotSpeed,
        rotationX: Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, currentState.rotationX + deltaY * rotSpeed))
      });
    },
    [updateViewState]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.setClearColor('#1a1a2e');
        }}
      >
        <FractalPlane />
      </Canvas>
    </div>
  );
}
