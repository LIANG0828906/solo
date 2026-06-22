import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Tree, TreeParams } from './treeModel';

interface TreeSceneProps {
  params: TreeParams;
  onWaterTrigger?: () => void;
  onNutrientTrigger?: () => void;
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[50, 50, 20, 20]} />
      <meshStandardMaterial
        color="#064E3B"
        transparent
        opacity={0.7}
        wireframe={false}
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
}

function Grid() {
  return (
    <gridHelper
      args={[50, 50, '#065F46', '#064E3B']}
      position={[0, 0.001, 0]}
    />
  );
}

function Lights({ lightIntensity }: { lightIntensity: number }) {
  return (
    <>
      <ambientLight intensity={0.3 * lightIntensity} color="#94A3B8" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.0 * lightIntensity}
        color="#FEF3C7"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight
        position={[-3, 4, -3]}
        intensity={0.5 * lightIntensity}
        color="#60A5FA"
      />
    </>
  );
}

interface TreeMeshProps {
  params: TreeParams;
}

function TreeMesh({ params }: TreeMeshProps) {
  const treeRef = useRef<Tree | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const prevWaterRef = useRef(params.waterAmount);
  const prevNutrientRef = useRef(params.nutrientAmount);

  useEffect(() => {
    try {
      localStorage.removeItem('magicTree_growthTime');
    } catch (e) {
      console.warn(e);
    }
  }, []);

  useEffect(() => {
    if (groupRef.current && !treeRef.current) {
      treeRef.current = new Tree(params);
      groupRef.current.add(treeRef.current.group);
    }
    return () => {
      if (treeRef.current && groupRef.current) {
        groupRef.current.remove(treeRef.current.group);
        treeRef.current.dispose();
        treeRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (treeRef.current) {
      if (params.waterAmount > prevWaterRef.current) {
        const diff = params.waterAmount - prevWaterRef.current;
        if (diff > 0.05) {
          treeRef.current.triggerWaterParticles();
        }
      }
      if (params.nutrientAmount > prevNutrientRef.current) {
        const diff = params.nutrientAmount - prevNutrientRef.current;
        if (diff > 0.05) {
          treeRef.current.triggerNutrientParticles();
        }
      }
      prevWaterRef.current = params.waterAmount;
      prevNutrientRef.current = params.nutrientAmount;
    }
  }, [params.waterAmount, params.nutrientAmount]);

  useFrame((_, delta) => {
    if (treeRef.current) {
      treeRef.current.update(delta, params);
    }
  });

  return <group ref={groupRef} />;
}

function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(4, 3, 6);
    camera.lookAt(0, 1.5, 0);
  }, [camera]);
  return null;
}

export default function TreeScene({ params }: TreeSceneProps) {
  return (
    <Canvas
      shadows
      camera={{ fov: 60, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#0F172A' }}
    >
      <color attach="background" args={['#0F172A']} />
      <fog attach="fog" args={['#0F172A', 10, 30]} />
      <CameraSetup />
      <Lights lightIntensity={params.lightIntensity} />
      <Ground />
      <Grid />
      <TreeMesh params={params} />
      <OrbitControls
        enableDamping
        dampingFactor={0.8}
        minDistance={2}
        maxDistance={15}
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}
