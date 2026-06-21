import React, { useRef, useState, useEffect, useCallback } from 'react';
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
}

const SculptModel: React.FC<SculptModelProps> = ({
  modelId,
  sceneManager,
  onModelReady,
  onBrushStroke,
  isSelected,
  materialType
}) => {
  const modelDataRef = useRef<ModelData | null>(null);
  const isDraggingRef = useRef(false);
  const lastHitPointRef = useRef<THREE.Vector3 | null>(null);
  const [mesh, setMesh] = useState<THREE.Mesh | null>(null);

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

  const handlePointerDown = useCallback(
    (e: any) => {
      if (!isSelected || !modelDataRef.current) return;
      e.stopPropagation();
      isDraggingRef.current = true;
      lastHitPointRef.current = e.point.clone();
      const viewDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(
        e.camera.quaternion
      );
      onBrushStroke(modelId, e.point.clone(), viewDirection);
    },
    [isSelected, modelId, onBrushStroke]
  );

  const handlePointerMove = useCallback(
    (e: any) => {
      if (!isDraggingRef.current || !isSelected || !lastHitPointRef.current)
        return;
      e.stopPropagation();

      const distance = e.point.distanceTo(lastHitPointRef.current);
      if (distance > 0.05) {
        lastHitPointRef.current = e.point.clone();
        const viewDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(
          e.camera.quaternion
        );
        onBrushStroke(modelId, e.point.clone(), viewDirection);
      }
    },
    [isSelected, modelId, onBrushStroke]
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
  onAddParticle: (position: THREE.Vector3) => void;
  currentModel: ModelId;
  materialType: MaterialType;
  envType: EnvType;
}

const Scene: React.FC<SceneProps> = ({
  sceneManager,
  onModelReady,
  onBrushStroke,
  onAddParticle,
  currentModel,
  materialType,
  envType
}) => {
  const { scene } = useThree();
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);

  useEffect(() => {
    const envTexture = sceneManager.createEnvironmentTexture(envType);
    scene.environment = envTexture;
    scene.background = envTexture;
  }, [envType, scene, sceneManager]);

  const handleBrushStroke = useCallback(
    (
      modelId: ModelId,
      hitPoint: THREE.Vector3,
      viewDirection: THREE.Vector3
    ) => {
      onBrushStroke(modelId, hitPoint, viewDirection);
      onAddParticle(hitPoint.clone());

      const directions = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, -1, 0)
      ];

      const newParticles: Particle[] = directions.map((dir) => ({
        id: particleIdRef.current++,
        position: hitPoint.clone(),
        startTime: performance.now(),
        direction: dir
      }));

      setParticles((prev) => [...prev, ...newParticles]);

      setTimeout(() => {
        setParticles((prev) =>
          prev.filter((p) => !newParticles.find((np) => np.id === p.id))
        );
      }, 300);
    },
    [onBrushStroke, onAddParticle]
  );

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
        onBrushStroke={handleBrushStroke}
        isSelected={currentModel === 'sphere'}
        materialType={materialType}
      />

      <SculptModel
        modelId="torusknot"
        sceneManager={sceneManager}
        onModelReady={onModelReady}
        onBrushStroke={handleBrushStroke}
        isSelected={currentModel === 'torusknot'}
        materialType={materialType}
      />

      {particles.map((particle) => (
        <BrushParticle key={particle.id} particle={particle} />
      ))}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={10}
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
    sceneManagerRef.current = new SceneManager();
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

      const params: BrushParams = {
        ...brushParams,
        intensity: brushParams.intensity * (brushDirection === 'in' ? -1 : 1)
      };

      const direction = viewDirection.clone().normalize();
      if (brushDirection === 'in') {
        direction.negate();
      }

      sceneManagerRef.current.applyBrush(modelId, hitPoint, direction, params);

      const count = sceneManagerRef.current.getVertexCount(modelId);
      setVertexCount(count);
      forceUpdate((n) => n + 1);
    },
    [brushParams, brushDirection, pushUndoSnapshot, setVertexCount]
  );

  const handleAddParticle = useCallback(() => {}, []);

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

  if (!sceneReady || !sceneManagerRef.current) {
    return (
      <div className="w-full h-screen bg-[#1e1e2e] flex items-center justify-center">
        <div className="text-[#d0d0e0] text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-screen flex flex-col md:flex-row bg-[#1e1e2e] font-sans transition-opacity duration-200 ${
        isUndoing ? 'opacity-80' : 'opacity-100'
      }`}
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      <div className="relative w-full md:w-[70%] h-[60%] md:h-full">
        <div className="absolute top-4 left-4 z-10 bg-[#2a2a40]/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#3a3a55]">
          <div className="text-xs text-[#8888aa]">顶点数</div>
          <div className="text-xl font-mono text-[#7f8cff]">
            {useAppStore.getState().vertexCount.toLocaleString()}
          </div>
        </div>

        <Canvas
          shadows
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          <Scene
            sceneManager={sceneManagerRef.current}
            onModelReady={handleModelReady}
            onBrushStroke={handleBrushStroke}
            onAddParticle={handleAddParticle}
            currentModel={currentModel}
            materialType={materialType}
            envType={envType}
          />
        </Canvas>
      </div>

      <div className="w-full md:w-[30%] md:min-w-[320px] h-[40%] md:h-full border-l border-[#3a3a55]">
        <ControlPanel onUndo={handleUndo} onReset={handleReset} />
      </div>
    </div>
  );
};
