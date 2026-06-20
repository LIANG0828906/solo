import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../store';
import { stepRootGrowth, getGrowthSpeed } from '../engine/RootGrowthEngine';
import {
  initializeNutrients,
  updateParticleNutrients,
  diffuseNutrients,
  getNutrientAtPosition,
  getAverageNutrientConcentration,
} from '../engine/NutrientSimulator';
import { RootNode, NutrientParticle, TipInfo } from '../types';

const SOIL_COLOR = '#8B4513';
const ROOT_COLOR_START = '#6B4226';
const ROOT_COLOR_END = '#D2B48C';
const N_COLOR = '#2196F3';
const P_COLOR = '#4CAF50';
const K_COLOR = '#FF5722';

const RootSegments = ({ nodes }: { nodes: RootNode[] }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const segments = useMemo(() => {
    const segs: {
      start: [number, number, number];
      end: [number, number, number];
      radius: number;
      depth: number;
    }[] = [];

    const nodeMap = new Map<string, RootNode>();
    for (const node of nodes) {
      nodeMap.set(node.id, node);
    }

    for (const node of nodes) {
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          segs.push({
            start: parent.position,
            end: node.position,
            radius: node.radius,
            depth: node.depth,
          });
        }
      }
    }

    return segs;
  }, [nodes]);

  useFrame(() => {
    if (!meshRef.current || segments.length === 0) return;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const start = new THREE.Vector3(...seg.start);
      const end = new THREE.Vector3(...seg.end);
      const direction = end.clone().sub(start);
      const length = direction.length();
      if (length < 0.001) continue;
      const mid = start.clone().add(end).multiplyScalar(0.5);

      dummy.position.copy(mid);
      dummy.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize()
      );
      dummy.scale.set(seg.radius * 2, length, seg.radius * 2);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      const colorT = Math.min(1, seg.depth / 8);
      const color = new THREE.Color().lerpColors(
        new THREE.Color(ROOT_COLOR_START),
        new THREE.Color(ROOT_COLOR_END),
        colorT
      );
      meshRef.current.setColorAt(i, color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  if (segments.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, segments.length]}>
      <cylinderGeometry args={[0.5, 0.5, 1, 8]} />
      <meshStandardMaterial emissive={ROOT_COLOR_START} emissiveIntensity={0.3} />
    </instancedMesh>
  );
};

const NutrientParticles = ({ particles }: { particles: NutrientParticle[] }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!meshRef.current || particles.length === 0) return;

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      dummy.position.set(...particle.position);
      dummy.scale.setScalar(0.08 + particle.baseOpacity * 0.05);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      const total = particle.nitrogen + particle.phosphorus + particle.potassium;
      if (total > 0) {
        const nRatio = particle.nitrogen / total;
        const pRatio = particle.phosphorus / total;
        const kRatio = particle.potassium / total;

        const nCol = new THREE.Color(N_COLOR);
        const pCol = new THREE.Color(P_COLOR);
        const kCol = new THREE.Color(K_COLOR);

        const color = new THREE.Color(
          nCol.r * nRatio + pCol.r * pRatio + kCol.r * kRatio,
          nCol.g * nRatio + pCol.g * pRatio + kCol.g * kRatio,
          nCol.b * nRatio + pCol.b * pRatio + kCol.b * kRatio
        );
        meshRef.current.setColorAt(i, color);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  if (particles.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial transparent opacity={0.8} />
    </instancedMesh>
  );
};

const SoilCube = () => {
  const edges = useMemo(() => {
    const geometry = new THREE.BoxGeometry(8, 8, 8);
    const edges = new THREE.EdgesGeometry(geometry);
    return edges;
  }, []);

  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[8, 8, 8]} />
        <meshStandardMaterial
          color={SOIL_COLOR}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#D2B48C" linewidth={2} />
      </lineSegments>
    </group>
  );
};

const TipMarkers = ({ nodes }: { nodes: RootNode[] }) => {
  const setSelectedTip = useSimulationStore((state) => state.setSelectedTip);
  const params = useSimulationStore((state) => state.params);
  const selectedTip = useSimulationStore((state) => state.selectedTip);

  const tipNodes = nodes.filter((n) => n.isTip);

  const handleClick = (node: RootNode) => {
    const nutrients = getNutrientAtPosition(node.position);
    const speed = getGrowthSpeed(params.lightIntensity);
    const tipInfo: TipInfo = {
      id: node.id,
      position: node.position,
      growthSpeed: speed,
      nitrogen: nutrients.nitrogen,
      phosphorus: nutrients.phosphorus,
      potassium: nutrients.potassium,
      depth: -node.position[1] + 4,
    };
    setSelectedTip(tipInfo);
  };

  return (
    <>
      {tipNodes.map((node) => (
        <mesh
          key={node.id}
          position={node.position}
          onClick={(e) => {
            e.stopPropagation();
            handleClick(node);
          }}
        >
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
      ))}
      {selectedTip && (
        <Html position={selectedTip.position} center distanceFactor={10}>
          <div
            style={{
              width: 180,
              height: 100,
              background: '#FFFFFF',
              borderRadius: 8,
              padding: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              fontSize: 12,
              color: '#333',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: 6 }}>根尖信息</div>
            <div>生长速度: {selectedTip.growthSpeed.toFixed(3)} 单位/帧</div>
            <div>氮: {selectedTip.nitrogen.toFixed(2)}</div>
            <div>磷: {selectedTip.phosphorus.toFixed(2)}</div>
            <div>钾: {selectedTip.potassium.toFixed(2)}</div>
            <div>深度: {selectedTip.depth.toFixed(2)} 单位</div>
          </div>
        </Html>
      )}
    </>
  );
};

const SimulationController = () => {
  const params = useSimulationStore((state) => state.params);
  const isRunning = useSimulationStore((state) => state.isRunning);
  const frameCountRef = useRef(0);
  const initializedRef = useRef(false);
  const lastSoilTypeRef = useRef(params.soilType);

  useEffect(() => {
    if (!initializedRef.current) {
      const particles = initializeNutrients(params.soilType);
      useSimulationStore.getState().updateNutrientDistribution(particles);
      initializedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (lastSoilTypeRef.current !== params.soilType) {
      const particles = initializeNutrients(params.soilType);
      useSimulationStore.getState().updateNutrientDistribution(particles);
      lastSoilTypeRef.current = params.soilType;
      useSimulationStore.getState().resetSimulation();
    }
  }, [params.soilType]);

  useFrame(() => {
    if (!isRunning) return;

    frameCountRef.current++;

    const state = useSimulationStore.getState();
    const currentRootNodes = state.rootNodes;
    const currentParticles = state.nutrientParticles;

    const result = stepRootGrowth(
      currentRootNodes,
      params,
      state.timeStep,
      getAverageNutrientConcentration
    );

    let allNodes = [...result.updatedNodes, ...result.newNodes];

    if (allNodes.length > 2000) {
      const excess = allNodes.length - 2000;
      const tipsToRemove = allNodes
        .filter((n) => n.isTip && n.order > 1)
        .sort((a, b) => a.age - b.age)
        .slice(0, excess);

      const idsToRemove = new Set(tipsToRemove.map((n) => n.id));
      allNodes = allNodes.filter((n) => !idsToRemove.has(n.id));
    }

    useSimulationStore.setState({ rootNodes: allNodes });

    if (currentParticles.length > 0) {
      const updatedParticles = updateParticleNutrients(currentParticles, allNodes);
      useSimulationStore.setState({ nutrientParticles: updatedParticles });

      const diffRate =
        params.soilType === 'sand' ? 0.5 : params.soilType === 'loam' ? 0.3 : 0.1;
      diffuseNutrients(diffRate);
    }

    useSimulationStore.getState().incrementTimeStep();
  });

  return null;
};

const SceneContent = () => {
  const rootNodes = useSimulationStore((state) => state.rootNodes);
  const nutrientParticles = useSimulationStore((state) => state.nutrientParticles);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[0, 6, 4]} intensity={0.8} color="#FFD700" />
      <spotLight
        position={[0, 6, 4]}
        angle={0.6}
        penumbra={0.5}
        intensity={0.7}
        color="#FFF8DC"
      />
      <pointLight position={[-5, 3, -5]} intensity={0.3} color="#FFD700" />

      <SoilCube />
      <NutrientParticles particles={nutrientParticles} />
      <RootSegments nodes={rootNodes} />
      <TipMarkers nodes={rootNodes} />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={30}
        enableDamping
        dampingFactor={0.05}
      />

      <SimulationController />
    </>
  );
};

const Scene = () => {
  return (
    <Canvas
      camera={{ position: [8, 4, 8], fov: 50 }}
      style={{ background: '#2A1E14' }}
      onPointerMissed={() => useSimulationStore.getState().setSelectedTip(null)}
    >
      <SceneContent />
    </Canvas>
  );
};

export default Scene;
