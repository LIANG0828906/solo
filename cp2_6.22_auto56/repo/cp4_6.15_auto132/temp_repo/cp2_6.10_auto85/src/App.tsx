import { useEffect, useCallback, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from './store/useGameStore';
import { gameTimeToChineseTime, clampToPitch, calculateShotPower, COLORS } from './gameLogic';
import Player from './components/Player';
import Pitch from './components/Pitch';
import Ball from './components/Ball';
import TacticsPanel from './components/TacticsPanel';
import EnergyPanel from './components/EnergyPanel';
import Scoreboard from './components/Scoreboard';
import Broadcast from './components/Broadcast';

function GameScene() {
  const {
    players,
    ball,
    selectedPlayerId,
    isDragging,
    dragStartPos,
    setSelectedPlayer,
    setPlayerTargetPosition,
    passOrShoot,
    updateGame,
    setDragging,
  } = useGameStore();

  const lastTimeRef = useRef<number>(performance.now());
  const dragStartWorldPos = useRef<{ x: number; z: number } | null>(null);

  useFrame(() => {
    const now = performance.now();
    const delta = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;
    updateGame(delta);
  });

  const handleSelectPlayer = useCallback((id: number) => {
    setSelectedPlayer(id);
  }, [setSelectedPlayer]);

  const handleDragStart = useCallback((id: number, position: { x: number; z: number }) => {
    dragStartWorldPos.current = position;
    setDragging(true, position);
  }, [setDragging]);

  const handleDragMove = useCallback((id: number, position: { x: number; z: number }) => {
    const clampedPos = clampToPitch(position);
    setPlayerTargetPosition(id, clampedPos.x, clampedPos.z);
  }, [setPlayerTargetPosition]);

  const handleDragEnd = useCallback(() => {
    setDragging(false);
    dragStartWorldPos.current = null;
  }, [setDragging]);

  const handlePitchClick = useCallback((position: { x: number; z: number }) => {
    const state = useGameStore.getState();
    const playerWithBall = state.players.find((p) => p.hasBall && p.team === 'player');
    
    if (playerWithBall) {
      const power = calculateShotPower(playerWithBall.position, position);
      passOrShoot(position.x, position.z, power);
    } else if (selectedPlayerId !== null) {
      const clampedPos = clampToPitch(position);
      setPlayerTargetPosition(selectedPlayerId, clampedPos.x, clampedPos.z);
    }
  }, [selectedPlayerId, passOrShoot, setPlayerTargetPosition]);

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[0, 20, 15]}
        zoom={45}
        near={0.1}
        far={100}
      />
      
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-10, 10, -10]} intensity={0.3} />
      <hemisphereLight args={[COLORS.background, COLORS.pitch, 0.4]} />

      <Pitch onClick={handlePitchClick} />
      
      {players.map((player) => (
        <Player
          key={player.id}
          player={player}
          isSelected={selectedPlayerId === player.id}
          onSelect={handleSelectPlayer}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onClickEmpty={handlePitchClick}
        />
      ))}
      
      <Ball ball={ball} />
    </>
  );
}

export default function App() {
  const {
    score,
    gameTime,
    players,
    currentTactics,
    tacticsTransition,
    broadcastMessage,
    changeTactics,
  } = useGameStore();

  const chineseTime = gameTimeToChineseTime(gameTime);
  const isTransitioning = tacticsTransition < 1;

  useEffect(() => {
    document.body.style.background = COLORS.background;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.background = '';
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm2.99-42.01c2.761 0 5.001-2.24 5.001-5s-2.24-5-5.001-5-5 2.24-5 5 2.24 5 5.001 5z' fill='%23b87333' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }}
      />

      <Canvas
        shadows
        gl={{ antialias: true, alpha: false }}
        style={{ background: COLORS.background }}
        onPointerMissed={() => useGameStore.getState().setSelectedPlayer(null)}
      >
        <color attach="background" args={[COLORS.background]} />
        <fog attach="fog" args={[COLORS.background, 20, 50]} />
        <GameScene />
      </Canvas>

      <Scoreboard
        playerScore={score.player}
        aiScore={score.ai}
        gameTime={chineseTime}
      />

      <TacticsPanel
        currentTactics={currentTactics}
        onChangeTactics={changeTactics}
        isTransitioning={isTransitioning}
      />

      <EnergyPanel players={players} />

      <Broadcast message={broadcastMessage} />

      <div className="absolute bottom-4 left-4 z-10">
        <div
          className="px-4 py-2 rounded-lg text-white/80 text-xs"
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div>🖱️ 拖拽球员移动 | 点击空地传球射门</div>
          <div>🎯 选中球员后点击目标位置移动</div>
        </div>
      </div>
    </div>
  );
}
