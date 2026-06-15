import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Maze } from './components/Maze';
import { Player } from './components/Player';
import { Effects } from './components/Effects';
import { UI } from './components/UI';
import { useGameState } from './hooks/useGameState';
import { LEVEL_CONFIGS } from './utils/constants';

function GameLoop() {
  const { updateBeams, isPaused, levelTransition } = useGameState();

  useFrame((_, delta) => {
    if (!isPaused && !levelTransition.active) {
      updateBeams(delta);
    }
  });

  return null;
}

function Scene() {
  const { level, initLevel, maze } = useGameState();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initLevel(0);
      initialized.current = true;
    }
  }, [initLevel]);

  if (!maze) return null;

  const config = LEVEL_CONFIGS[level];

  return (
    <>
      <color attach="background" args={['#0a0a0f']} />
      <Maze />
      <Player />
      <Effects />
      <GameLoop />
    </>
  );
}

export default function App() {
  const config = LEVEL_CONFIGS[0];

  return (
    <div className="w-full h-screen overflow-hidden bg-[#0a0a0f] relative">
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `
            radial-gradient(ellipse at top, ${config.colors.primary}10 0%, transparent 50%),
            radial-gradient(ellipse at bottom, ${config.colors.accent}10 0%, transparent 50%)
          `,
        }}
      />

      <Canvas
        shadows
        camera={{
          position: [0, 12, 10],
          fov: 60,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>

      <UI />

      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40 text-center pointer-events-none">
        <h1
          className="text-3xl font-bold tracking-widest"
          style={{
            background: 'linear-gradient(135deg, #9b59b6, #00e5ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(0, 229, 255, 0.3)',
          }}
        >
          幻境迷宫 · 光影回廊
        </h1>
      </div>
    </div>
  );
}
