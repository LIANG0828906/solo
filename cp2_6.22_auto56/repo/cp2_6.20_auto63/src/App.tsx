import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { SceneManager } from '@/game/SceneManager';
import { NodeSystem } from '@/game/NodeSystem';
import { MatrixPuzzle } from '@/game/MatrixPuzzle';
import { useGameStore } from '@/store/useGameStore';
import ParticleField from '@/components/ParticleField';
import VoidBackground from '@/components/VoidBackground';
import FloatingPlatform from '@/components/FloatingPlatform';
import EnergyNode from '@/components/EnergyNode';
import RelicFragment from '@/components/RelicFragment';
import ParticleTrail from '@/components/ParticleTrail';
import VoidRift from '@/components/VoidRift';
import EnergyMatrix from '@/components/EnergyMatrix';
import VictoryBurst from '@/components/VictoryBurst';
import UILayer from '@/ui/UILayer';
import './index.css';

const SceneInitializer: React.FC<{ sceneManager: SceneManager }> = ({ sceneManager }) => {
  const { gl, scene } = useThree();

  useEffect(() => {
    sceneManager.setRenderer(gl);
    scene.background = null;
  }, [sceneManager, gl, scene]);

  useEffect(() => {
    const handleResize = () => {
      sceneManager.updateSize(window.innerWidth, window.innerHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sceneManager]);

  return null;
};

const GameLoop: React.FC<{
  sceneManager: SceneManager;
  nodeSystem: NodeSystem;
  matrixPuzzle: MatrixPuzzle;
}> = ({ sceneManager, nodeSystem, matrixPuzzle }) => {
  const initLevel = useGameStore((s) => s.initLevel);
  const nodes = useGameStore((s) => s.nodes);
  const fragments = useGameStore((s) => s.fragments);
  const runes = useGameStore((s) => s.runes);
  const showRift = useGameStore((s) => s.showRift);
  const phase = useGameStore((s) => s.phase);
  const successBurstNodeId = useGameStore((s) => s.successBurstNodeId);
  const initMatrix = useGameStore((s) => s.initMatrix);

  const initializedRef = useRef(false);
  const nodesInitedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      initLevel();
    }
  }, [initLevel]);

  useEffect(() => {
    if (nodes.length > 0 && !nodesInitedRef.current) {
      nodesInitedRef.current = true;
      nodes.forEach((node) => {
        sceneManager.addNode(node);
      });
      fragments.forEach((frag) => {
        sceneManager.addFragment(frag);
      });
    }
  }, [nodes, fragments, sceneManager]);

  useEffect(() => {
    if (showRift && phase === 'matrix' && runes.length === 0) {
      const newRunes = matrixPuzzle.generateRunes();
      useGameStore.setState({ runes: newRunes });
    }
  }, [showRift, phase, runes.length, matrixPuzzle]);

  useFrame((_, dt) => {
    const delta = Math.min(dt, 0.05);
    nodeSystem.tick(delta);
    matrixPuzzle.tick(delta);
  });

  return (
    <>
      <SceneInitializer sceneManager={sceneManager} />
      <VoidBackground />
      <ParticleField count={1200} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 10, 7]} intensity={0.4} color="#6677ff" />

      {sceneManager.getPlatforms().map((platform, i) => (
        <FloatingPlatform
          key={i}
          position={platform.position}
          scale={platform.scale}
          index={i}
        />
      ))}

      {nodes.map((node) => (
        <EnergyNode
          key={node.id}
          nodeId={node.id}
          position={node.position}
          color={node.acceptElement}
          isLit={node.isLit}
          isError={node.isError}
          nodeSystem={nodeSystem}
          burstActive={successBurstNodeId === node.id}
        />
      ))}

      {fragments.map((fragment) => (
        <RelicFragment
          key={fragment.id}
          fragment={fragment}
          nodeSystem={nodeSystem}
        />
      ))}

      <ParticleTrail />

      {showRift && (
        <>
          <VoidRift />
          {phase === 'matrix' && runes.length > 0 && (
            <EnergyMatrix runes={runes} matrixPuzzle={matrixPuzzle} />
          )}
        </>
      )}

      <VictoryBurst />

      <EffectComposer>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.3} darkness={0.7} />
      </EffectComposer>
    </>
  );
};

const App: React.FC = () => {
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const nodeSystemRef = useRef<NodeSystem | null>(null);
  const matrixPuzzleRef = useRef<MatrixPuzzle | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sm = new SceneManager();
    sceneManagerRef.current = sm;
    nodeSystemRef.current = new NodeSystem(sm);
    matrixPuzzleRef.current = new MatrixPuzzle();
    setReady(true);

    return () => {
      sm.dispose();
      nodeSystemRef.current?.dispose();
      matrixPuzzleRef.current?.dispose();
    };
  }, []);

  if (!ready || !sceneManagerRef.current || !nodeSystemRef.current || !matrixPuzzleRef.current) {
    return null;
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #0a1628 0%, #1a0a2e 100%)',
      }}
    >
      <Canvas
        camera={{ position: [0, 5, 15], fov: 60, near: 0.1, far: 200 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <GameLoop
          sceneManager={sceneManagerRef.current}
          nodeSystem={nodeSystemRef.current}
          matrixPuzzle={matrixPuzzleRef.current}
        />
      </Canvas>
      <UILayer />
    </div>
  );
};

export default App;
