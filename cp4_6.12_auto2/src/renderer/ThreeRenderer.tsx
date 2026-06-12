import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useComparisonStore, THEMES } from '@/store/useComparisonStore';
import ModelManager from '@/models/ModelManager';
import ComparisonController from '@/comparison/ComparisonController';
import AnnotationSystem from '@/comparison/AnnotationSystem';
import type { MeasurementPoint } from '@/types';

interface SceneProps {
  modelId: 'A' | 'B';
  viewportWidth: number;
  viewportHeight: number;
  onPointerDown?: (e: any) => void;
  onPointerMove?: (e: any) => void;
  onPointerUp?: (e: any) => void;
}

const MeasurementLines: React.FC<{ camera: THREE.Camera }> = ({ camera }) => {
  const { measurements, activeMeasurement, mode, splitRatio } =
    useComparisonStore();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;

    while (groupRef.current.children.length > 0) {
      const child = groupRef.current.children[0];
      (child as THREE.Line).geometry?.dispose?.();
      ((child as THREE.Line).material as THREE.Material)?.dispose?.();
      groupRef.current.remove(child);
    }

    const allLines = [...measurements];
    if (activeMeasurement?.end) {
      allLines.push(activeMeasurement);
    }

    allLines.forEach((line) => {
      if (!line.end) return;

      const points = [
        new THREE.Vector3(...line.start.position),
        new THREE.Vector3(...line.end.position),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineDashedMaterial({
        color: 0xffffff,
        dashSize: 0.15,
        gapSize: 0.1,
        linewidth: 2,
        transparent: true,
        opacity: line.complete ? 0.9 : 0.6,
      });

      const dashedLine = new THREE.Line(geometry, material);
      dashedLine.computeLineDistances();
      dashedLine.name = `meas_line_${line.id}`;
      dashedLine.userData = { measurementId: line.id, clickable: line.complete };
      groupRef.current!.add(dashedLine);

      const addCube = (pos: [number, number, number], color: number) => {
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.08, 0.08),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
        );
        cube.position.set(...pos);
        groupRef.current!.add(cube);
      };

      addCube(line.start.position, 0xff6b35);
      addCube(line.end.position, 0xffffff);
    });
  });

  return <group ref={groupRef} />;
};

const SceneContent: React.FC<SceneProps> = ({
  modelId,
  viewportWidth,
  viewportHeight,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const {
    theme,
    themeConfig,
    cameraA,
    cameraB,
    viewSync,
    mode,
    overlayOpacity,
    measurementMode,
    activeMeasurement,
    startMeasurement,
    updateMeasurement,
    completeMeasurement,
  } = useComparisonStore();

  const wrapper = ModelManager.getWrapper(modelId);
  const camState = modelId === 'A' ? cameraA : cameraB;

  useEffect(() => {
    if (controlsRef.current && !viewSync.enabled) {
      const pos = new THREE.Vector3(...camState.position);
      const target = new THREE.Vector3(...camState.target);
      camera.position.copy(pos);
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    }
  }, []);

  useFrame(() => {
    if (controlsRef.current) {
      if (viewSync.enabled && viewSync.source !== modelId) {
        const sourceState = viewSync.source === 'A' ? cameraA : cameraB;
        camera.position.set(...sourceState.position);
        controlsRef.current.target.set(...sourceState.target);
      }
      ComparisonController.onCameraChange(
        modelId,
        camera,
        controlsRef.current.target
      );
    }
  });

  const ambientColor = useMemo(
    () => new THREE.Color(themeConfig.ambientColor),
    [themeConfig.ambientColor]
  );
  const directionalColor = useMemo(
    () => new THREE.Color(themeConfig.directionalColor),
    [themeConfig.directionalColor]
  );

  const bgStyle = useMemo(
    () => ({ background: new THREE.Color(themeConfig.backgroundColor) }),
    [themeConfig.backgroundColor]
  );

  const handleClick = useCallback(
    (event: any) => {
      event.stopPropagation();
      const { offsetX, offsetY } = event;

      if (measurementMode) {
        const point = AnnotationSystem.handleMeasurementClick(
          offsetX,
          offsetY,
          camera,
          modelId,
          viewportWidth,
          viewportHeight
        );
        if (!point) return;

        if (!activeMeasurement) {
          startMeasurement(point);
        } else {
          const distance = ComparisonController.computeDistance3D(
            activeMeasurement.start.position,
            point.position
          );
          completeMeasurement(point, distance);
        }
        return;
      }

      const hit = AnnotationSystem.handleModelClick(
        offsetX,
        offsetY,
        camera,
        modelId,
        viewportWidth,
        viewportHeight
      );

      if (hit) {
        let screenX = offsetX;
        if (mode === 'split' && modelId === 'B') {
          screenX += useComparisonStore.getState().splitRatio * window.innerWidth;
        }
        AnnotationSystem.showAnnotationForHit(hit, {
          x: screenX,
          y: offsetY + 56,
        });
      } else {
        AnnotationSystem.hideAnnotation();
      }
    },
    [
      camera,
      measurementMode,
      activeMeasurement,
      startMeasurement,
      completeMeasurement,
      mode,
      modelId,
      viewportWidth,
      viewportHeight,
    ]
  );

  const handleMove = useCallback(
    (event: any) => {
      if (!measurementMode || !activeMeasurement) return;
      const { offsetX, offsetY } = event;

      const point = AnnotationSystem.handleMeasurementMove(
        offsetX,
        offsetY,
        camera,
        modelId,
        viewportWidth,
        viewportHeight
      );
      if (point) {
        const distance = ComparisonController.computeDistance3D(
          activeMeasurement.start.position,
          point.position
        );
        updateMeasurement(point, distance);
      }
    },
    [
      camera,
      measurementMode,
      activeMeasurement,
      updateMeasurement,
      modelId,
      viewportWidth,
      viewportHeight,
    ]
  );

  return (
    <>
      <color attach="background" args={[bgStyle.background]} />

      <ambientLight
        color={ambientColor}
        intensity={themeConfig.ambientIntensity}
      />

      <directionalLight
        color={directionalColor}
        intensity={themeConfig.directionalIntensity}
        position={[10, 15, 8]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0005}
      />

      {themeConfig.hasPointLight && themeConfig.pointLightPosition && (
        <pointLight
          color={themeConfig.pointLightColor || '#FFD54F'}
          intensity={themeConfig.pointLightIntensity || 2}
          position={themeConfig.pointLightPosition}
          distance={30}
          decay={1.5}
          castShadow
        />
      )}

      <group
        onClick={handleClick}
        onPointerMove={handleMove}
        onPointerUp={onPointerUp}
      >
        {wrapper && (
          <primitive object={wrapper} castShadow receiveShadow />
        )}
      </group>

      <MeasurementLines camera={camera} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.1}
        target={[...camState.target] as [number, number, number]}
        enablePan={true}
        panSpeed={0.8}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
      />
    </>
  );
};

interface ViewportProps {
  modelId: 'A' | 'B';
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

const Viewport: React.FC<ViewportProps> = ({
  modelId,
  left = 0,
  top = 0,
  width = 1,
  height = 1,
  style,
}) => {
  const glRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth * width;
      const h = (window.innerHeight - 56 - 70) * height;
      setDimensions({ w, h });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [width, height]);

  return (
    <div
      ref={(el) => {
        if (el) glRef.current = el.querySelector('canvas');
      }}
      style={{
        position: 'absolute',
        left: `${left * 100}%`,
        top: `${top * 100}%`,
        width: `${width * 100}%`,
        height: `${height * 100}%`,
        overflow: 'hidden',
        ...style,
      }}
    >
      <Canvas
        shadows
        camera={{
          fov: 50,
          near: 0.1,
          far: 1000,
          position: modelId === 'A'
            ? useComparisonStore.getState().cameraA.position
            : useComparisonStore.getState().cameraB.position,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <SceneContent
          modelId={modelId}
          viewportWidth={dimensions.w}
          viewportHeight={dimensions.h}
        />
      </Canvas>
    </div>
  );
};

const SplitView: React.FC = () => {
  const splitRatio = useComparisonStore((s) => s.splitRatio);

  return (
    <>
      <Viewport
        modelId="A"
        left={0}
        width={splitRatio}
        style={{ paddingRight: 1.5 }}
      />
      <Viewport
        modelId="B"
        left={splitRatio}
        width={1 - splitRatio}
        style={{ paddingLeft: 1.5 }}
      />
    </>
  );
};

const OverlayView: React.FC = () => {
  return (
    <>
      <Viewport modelId="A" width={1} height={1} />
      <Viewport modelId="B" width={1} height={1} />
    </>
  );
};

export interface ThreeRendererHandle {
  getAnnotationPositions: () => Map<
    string,
    { x: number; y: number; visible: boolean }
  >;
}

export const ThreeRenderer: React.FC = () => {
  const mode = useComparisonStore((s) => s.mode);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefA = useRef<HTMLCanvasElement | null>(null);
  const canvasRefB = useRef<HTMLCanvasElement | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceUpdate((v) => v + 1), 32);
    return () => clearInterval(interval);
  }, []);

  const getAnnotationPositions = useCallback(() => {
    const findCanvas = (modelId: 'A' | 'B'): HTMLCanvasElement | null => {
      const selectors = [
        'canvas',
        modelId === 'A'
          ? 'div[style*="left: 0%"] canvas'
          : 'div[style*="left: 50%"] canvas',
      ];
      for (const sel of selectors) {
        const el = containerRef.current?.querySelectorAll(sel);
        if (el && el.length > 0) {
          return el[modelId === 'A' ? 0 : Math.min(1, el.length - 1)] as HTMLCanvasElement;
        }
      }
      return null;
    };

    const camA = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    const camB = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);

    const s = useComparisonStore.getState();
    camA.position.set(...s.cameraA.position);
    camA.lookAt(...s.cameraA.target);
    camB.position.set(...s.cameraB.position);
    camB.lookAt(...s.cameraB.target);

    const w = window.innerWidth;
    const h = window.innerHeight - 56 - 70;
    const splitW = w * s.splitRatio;

    return AnnotationSystem.updateAnnotationPositions(
      camA,
      camB,
      s.mode === 'split' ? splitW : w,
      h,
      s.mode === 'split' ? w - splitW : w,
      h
    );
  }, []);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const state = useComparisonStore.getState();
        if (state.measurementMode) {
          ComparisonController.toggleMeasurementMode();
        } else if (state.activeAnnotation) {
          AnnotationSystem.hideAnnotation();
        }
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, []);

  const value = useMemo(
    () => ({ getAnnotationPositions }),
    [getAnnotationPositions]
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 56,
        width: '100%',
        height: 'calc(100% - 56px - 70px)',
        background: '#121212',
        overflow: 'hidden',
      }}
    >
      {mode === 'split' ? <SplitView /> : <OverlayView />}
    </div>
  );
};

export default ThreeRenderer;
