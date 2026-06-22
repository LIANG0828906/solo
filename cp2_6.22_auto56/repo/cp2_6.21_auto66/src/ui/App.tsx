import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { SceneManager, ModelData, MaterialType, EnvType } from '../engine/SceneManager';
import { BrushParams } from '../engine/BrushTool';
import { useAppStore, ModelId } from './store';
import { ControlPanel } from './ControlPanel';

interface Particle {
  id: number;
  position: THREE.Vector3;
  startTime: number;
  direction: THREE.Vector3;
}

interface SculptModelProps {
  modelId: ModelId;
  sceneManager: SceneManager;
  onModelReady: (modelId: ModelId, modelData: ModelData) => void;
  onBrushStroke: (
    modelId: ModelId,
    hitPoint: THREE.Vector3,
    viewDirection: THREE.Vector3
  ) => void;
  isSelected: boolean;
  materialType: MaterialType;
  onParticle: (position: THREE.Vector3) => void;
}

const SculptModel: React.FC<SculptModelProps> = ({
  modelId,
  sceneManager,
  onModelReady,
  onBrushStroke,
  isSelected,
  materialType,
  onParticle
}) => {
  const modelDataRef = useRef<ModelData | null>(null);
  const isDraggingRef = useRef(false);
  const lastHitPointRef = useRef<THREE.Vector3 | null>(null);
  const [mesh, setMesh] = useState<THREE.Mesh | null>(null);
  const { camera } = useThree();
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  useEffect(() => {
    if (!modelDataRef.current) {
      const modelData = sceneManager.createModel(
        modelId as 'sphere' | 'torusknot',
        modelId
      );
      modelDataRef.current = modelData;
      onModelReady(modelId, modelData);
      setMesh(modelData.mesh);
    }
  }, [modelId, sceneManager, onModelReady]);

  useEffect(() => {
    if (modelDataRef.current) {
      sceneManager.updateMaterial(modelId, materialType);
    }
  }, [materialType, modelId, sceneManager]);

  const performRaycast = useCallback(
    (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
      if (!modelDataRef.current) return null;

      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      const intersects = raycasterRef.current.intersectObject(
        modelDataRef.current.mesh
      );

      if (intersects.length > 0) {
        return intersects[0].point.clone();
      }
      return null;
    },
    [camera]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<THREE.Mesh>) => {
      if (!isSelected || !modelDataRef.current) return;
      e.stopPropagation();

      const target = e.target as unknown as { ownerDocument: { defaultView: { frameElement: HTMLCanvasElement | null } | null } | null };
      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      const hitPoint = performRaycast(e.clientX, e.clientY, canvas);
      if (!hitPoint) return;

      isDraggingRef.current = true;
      lastHitPointRef.current = hitPoint.clone();

      const viewDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(
        camera.quaternion
      );

      onBrushStroke(modelId, hitPoint, viewDirection);
      onParticle(hitPoint);
    },
    [isSelected, modelId, onBrushStroke, onParticle, camera, performRaycast]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<THREE.Mesh>) => {
      if (!isDraggingRef.current || !isSelected || !lastHitPointRef.current)
        return;
      e.stopPropagation();

      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      const hitPoint = performRaycast(e.clientX, e.clientY, canvas);
      if (!hitPoint) return;

      const distance = hitPoint.distanceTo(lastHitPointRef.current);
      if (distance > 0.02) {
        lastHitPointRef.current = hitPoint.clone();
        const viewDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(
          camera.quaternion
        );
        onBrushStroke(modelId, hitPoint, viewDirection);
        onParticle(hitPoint);
      }
    },
    [isSelected, modelId, onBrushStroke, onParticle, camera, performRaycast]
  );

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    lastHitPointRef.current = null;
  }, []);

  const position = modelId === 'sphere' ? [-1.5, 0, 0] : [1.5, 0, 0];

  if (!mesh) return null;

  return (
    <primitive
      object={mesh}
      position={position}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
};

interface SceneProps {
  sceneManager: SceneManager;
  onModelReady: (modelId: ModelId, modelData: ModelData) => void;
  onBrushStroke: (
    modelId: ModelId,
    hitPoint: THREE.Vector3,
    viewDirection: THREE.Vector3
  ) => void;
  currentModel: ModelId;
  materialType: MaterialType;
  envType: EnvType;
}

const Scene: React.FC<SceneProps> = ({
  sceneManager,
  onModelReady,
  onBrushStroke,
  currentModel,
  materialType,
  envType
}) => {
  const { scene, camera } = useThree();
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const startTime = performance.now();
    const envTexture = sceneManager.createEnvironmentTexture(envType);
    scene.environment = envTexture;
    scene.background = envTexture;
    const endTime = performance.now();
    console.log(`Environment switch: ${(endTime - startTime).toFixed(2)}ms`);
  }, [envType, scene, sceneManager]);

  const handleParticle = useCallback((position: THREE.Vector3) => {
    const directions = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, -1, 0)
    ];

    const newParticles: Particle[] = directions.map((dir) => ({
      id: particleIdRef.current++,
      position: position.clone(),
      startTime: performance.now(),
      direction: dir
    }));

    setParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles((prev) =>
        prev.filter((p) => !newParticles.find((np) => np.id === p.id))
      );
    }, 300);
  }, []);

  return (
    <>
      <ambientLight color="#404060" intensity={0.5} />
      <directionalLight
        color="#ffffff"
        intensity={0.8}
        position={[5, 5, 5]}
        castShadow
      />
      <directionalLight
        color="#ffffff"
        intensity={0.3}
        position={[-5, -5, -5]}
      />

      <SculptModel
        modelId="sphere"
        sceneManager={sceneManager}
        onModelReady={onModelReady}
        onBrushStroke={onBrushStroke}
        isSelected={currentModel === 'sphere'}
        materialType={materialType}
        onParticle={handleParticle}
      />

      <SculptModel
        modelId="torusknot"
        sceneManager={sceneManager}
        onModelReady={onModelReady}
        onBrushStroke={onBrushStroke}
        isSelected={currentModel === 'torusknot'}
        materialType={materialType}
        onParticle={handleParticle}
      />

      {particles.map((particle) => (
        <BrushParticle key={particle.id} particle={particle} />
      ))}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={10}
        mouseButtons={{
          LEFT: null as any,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE
        }}
      />
    </>
  );
};

const BrushParticle: React.FC<{ particle: Particle }> = ({ particle }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;

    const elapsed = (performance.now() - particle.startTime) / 300;
    if (elapsed >= 1) return;

    const scale = 1 + elapsed * 2;
    const opacity = 1 - elapsed;

    meshRef.current.scale.setScalar(scale);
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = opacity * 0.5;

    const offset = particle.direction.clone().multiplyScalar(elapsed * 0.5);
    meshRef.current.position.copy(particle.position).add(offset);
  });

  return (
    <mesh ref={meshRef} position={particle.position}>
      <circleGeometry args={[0.1, 16]} />
      <meshBasicMaterial
        color="#7f8cff"
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
};

export const App: React.FC = () => {
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const modelDataRef = useRef<Map<ModelId, ModelData>>(new Map());
  const [sceneReady, setSceneReady] = useState(false);
  const [, forceUpdate] = useState(0);
  const vertexCount = useAppStore((state) => state.vertexCount);

  const {
    currentModel,
    brushParams,
    brushDirection,
    materialType,
    envType,
    isUndoing,
    setVertexCount,
    pushUndoSnapshot,
    undo,
    resetModel,
    clearUndoStack
  } = useAppStore();

  useEffect(() => {
    const manager = new SceneManager();
    manager.preloadEnvironmentTextures();
    sceneManagerRef.current = manager;
    setSceneReady(true);

    return () => {
      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (sceneManagerRef.current && modelDataRef.current.has(currentModel)) {
      const count = sceneManagerRef.current.getVertexCount(currentModel);
      setVertexCount(count);
    }
  }, [currentModel, setVertexCount]);

  const handleModelReady = useCallback(
    (modelId: ModelId, modelData: ModelData) => {
      modelDataRef.current.set(modelId, modelData);
      if (modelId === currentModel && sceneManagerRef.current) {
        const count = sceneManagerRef.current.getVertexCount(modelId);
        setVertexCount(count);
      }
    },
    [currentModel, setVertexCount]
  );

  const handleBrushStroke = useCallback(
    (
      modelId: ModelId,
      hitPoint: THREE.Vector3,
      viewDirection: THREE.Vector3
    ) => {
      if (!sceneManagerRef.current) return;

      const currentPositions = sceneManagerRef.current.getCurrentPositions(modelId);
      pushUndoSnapshot(currentPositions);

      const direction = viewDirection.clone().normalize();
      if (brushDirection === 'in') {
        direction.negate();
      }

      const params: BrushParams = {
        ...brushParams,
        intensity: Math.abs(brushParams.intensity)
      };

      const startTime = performance.now();
      sceneManagerRef.current.applyBrush(modelId, hitPoint, direction, params);
      const endTime = performance.now();

      if (endTime - startTime > 16) {
        console.warn(`Brush stroke took ${(endTime - startTime).toFixed(2)}ms`);
      }

      forceUpdate((n) => n + 1);
    },
    [brushParams, brushDirection, pushUndoSnapshot]
  );

  const handleUndo = useCallback(() => {
    const snapshot = undo();
    if (snapshot && sceneManagerRef.current) {
      sceneManagerRef.current.restorePositions(currentModel, snapshot);
      const count = sceneManagerRef.current.getVertexCount(currentModel);
      setVertexCount(count);
      forceUpdate((n) => n + 1);
    }
  }, [undo, currentModel, setVertexCount]);

  const handleReset = useCallback(() => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.resetModel(currentModel);
    clearUndoStack();
    resetModel();
    const count = sceneManagerRef.current.getVertexCount(currentModel);
    setVertexCount(count);
    forceUpdate((n) => n + 1);
  }, [currentModel, clearUndoStack, resetModel, setVertexCount]);

  const containerStyle = useMemo(
    () => ({
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    }),
    []
  );

  if (!sceneReady || !sceneManagerRef.current) {
    return (
      <div className="w-full h-screen bg-[#1e1e2e] flex items-center justify-center">
        <div className="text-[#d0d0e0] text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full flex flex-col bg-[#1e1e2e] font-sans transition-opacity duration-200 ${
        isUndoing ? 'opacity-80' : 'opacity-100'
      }`}
      style={containerStyle}
    >
      <div className="flex flex-col md:flex-row w-full h-full">
        <div className="relative w-full md:w-[70%] h-[60%] md:h-full flex-shrink-0">
          <div className="absolute top-4 left-4 z-10 bg-[#2a2a40]/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#3a3a55]">
            <div className="text-xs text-[#8888aa]">顶点数</div>
            <div className="text-xl font-mono text-[#7f8cff]">
              {vertexCount.toLocaleString()}
            </div>
          </div>

          <div className="absolute top-4 right-4 z-10 bg-[#2a2a40]/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#3a3a55]">
            <div className="text-xs text-[#8888aa]">当前模型</div>
            <div className="text-sm font-medium text-[#d0d0e0]">
              {currentModel === 'sphere' ? '低面球体' : '圆环结'}
            </div>
          </div>

          <Canvas
            shadows
            camera={{ position: [0, 0, 5], fov: 50 }}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            dpr={[1, 2]}
          >
            <Scene
              sceneManager={sceneManagerRef.current}
              onModelReady={handleModelReady}
              onBrushStroke={handleBrushStroke}
              currentModel={currentModel}
              materialType={materialType}
              envType={envType}
            />
          </Canvas>
        </div>

        <div className="w-full md:w-[30%] md:min-w-[320px] h-[40%] md:h-full border-t md:border-t-0 md:border-l border-[#3a3a55] flex-shrink-0 overflow-hidden">
          <ControlPanel onUndo={handleUndo} onReset={handleReset} />
        </div>
      </div>
    </div>
  );
};
