import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RenderEngine } from './modules/render/renderEngine';
import { gameEngine } from './modules/game/gameEngine';
import { judgeModule } from './modules/game/judgeModule';
import { useGameStore } from './store/useGameStore';
import { KEY_MAP } from './types/game';
import { UIOverlay } from './modules/render/UIOverlay';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderRef = useRef<RenderEngine | null>(null);
  const [, forceUpdate] = useState(0);

  const handleStart = useCallback(async () => {
    await gameEngine.start();
    renderRef.current?.start();
    forceUpdate((x) => x + 1);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const render = new RenderEngine(canvasRef.current);
    renderRef.current = render;
    render.render();

    const handleResize = () => {
      render.resize();
    };
    window.addEventListener('resize', handleResize);

    const startMethod = async () => {
      useGameStore.setState({ startTime: performance.now() });
    };
    (useGameStore.getState() as unknown as { _start?: () => Promise<void> })._start =
      handleStart;
    (useGameStore.getState() as unknown as { _reset?: () => void })._reset = () => {
      gameEngine.reset();
      render.stop();
    };
    void startMethod;

    return () => {
      window.removeEventListener('resize', handleResize);
      render.stop();
      gameEngine.stop();
    };
  }, [handleStart]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const state = useGameStore.getState();
      if (!state.isPlaying) return;

      const currentTime = state.currentTime;

      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault();
        judgeModule.handleArrowKey(e.code, currentTime);
        return;
      }

      const track = KEY_MAP[e.code];
      if (track !== undefined) {
        e.preventDefault();
        judgeModule.handleKeyDown(e.code, track, currentTime);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const state = useGameStore.getState();
      if (!state.isPlaying) return;
      const currentTime = state.currentTime;
      const track = KEY_MAP[e.code];
      if (track !== undefined) {
        e.preventDefault();
        judgeModule.handleKeyUp(e.code, track, currentTime);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ minWidth: 1280, minHeight: 720 }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />
      <UIOverlay onStart={handleStart} />
    </div>
  );
}
