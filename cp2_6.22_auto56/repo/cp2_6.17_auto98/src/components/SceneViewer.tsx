import React, { useRef, useEffect, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { generateTree, BranchData } from '../utils/treeGenerator';
import { BranchMesh, LeafMesh } from './BranchMesh';
import { StarField } from './StarField';
import { useScene } from '../hooks/useScene';

interface SceneContentProps {
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
  onSceneReady?: (scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => void;
}

const SceneContent: React.FC<SceneContentProps> = ({ onCanvasReady, onSceneReady }) => {
  const params = useStore((state) => state.params);
  const selectedBranch = useStore((state) => state.selectedBranch);
  const setSelectedBranch = useStore((state) => state.setSelectedBranch);
  const setHighlightInfo = useStore((state) => state.setHighlightInfo);
  const { scene, camera, gl } = useThree();

  const treeData = React.useMemo(() => generateTree(params), [params]);

  useEffect(() => {
    onCanvasReady(gl.domElement);
    if (onSceneReady) {
      onSceneReady(scene, camera as THREE.PerspectiveCamera, gl);
    }
  }, [gl, scene, camera, onCanvasReady, onSceneReady]);

  const handleSelect = useCallback(
    (branch: BranchData) => {
      setSelectedBranch(branch.id);
      setHighlightInfo({
        level: branch.level + 1,
        angle: Math.round(branch.angle),
        length: Math.round(branch.length * 100) / 100,
      });

      setTimeout(() => {
        const currentSelected = useStore.getState().selectedBranch;
        if (currentSelected === branch.id) {
          setSelectedBranch(null);
          setHighlightInfo(null);
        }
      }, 500);
    },
    [setSelectedBranch, setHighlightInfo]
  );

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />

      <BranchMesh
        branches={treeData.branches}
        selectedId={selectedBranch}
        onSelect={handleSelect}
      />
      {treeData.leaves.length > 0 && <LeafMesh leaves={treeData.leaves} />}

      <StarField />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={30}
        makeDefault
      />
    </>
  );
};

interface SceneViewerProps {
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

export const SceneViewer: React.FC<SceneViewerProps> = ({ onCanvasReady }) => {
  const { setScene, setCamera, setRenderer } = useScene();
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const handleSceneReady = useCallback(
    (scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => {
      setScene(scene);
      setCamera(camera);
      setRenderer(renderer);
    },
    [setScene, setCamera, setRenderer]
  );

  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      }}
      camera={{
        position: [0, 3, 8],
        fov: 50,
        near: 0.1,
        far: 100,
      }}
      onCreated={({ camera }) => {
        cameraRef.current = camera as THREE.PerspectiveCamera;
      }}
      style={{ width: '100%', height: '100%', background: '#0B0B1E' }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#0B0B1E']} />
      <fog attach="fog" args={['#0B0B1E', 15, 50]} />
      <SceneContent onCanvasReady={onCanvasReady} onSceneReady={handleSceneReady} />
    </Canvas>
  );
};
