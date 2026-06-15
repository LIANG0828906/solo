import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AudioEngine } from './audio/AudioEngine';
import { ParticleEngine } from './engine/ParticleEngine';
import { useGameState } from './game/GameState';
import { UploadArea, HUD, StatsPanel } from './ui/HUD';

const App = () => {
  const phase = useGameState(s => s.phase);
  const startGame = useGameState(s => s.startGame);
  const endGame = useGameState(s => s.endGame);
  const resetGame = useGameState(s => s.resetGame);
  const recordBeat = useGameState(s => s.recordBeat);
  const judgeInput = useGameState(s => s.judgeInput);
  const updateCurrentTime = useGameState(s => s.updateCurrentTime);
  const effectLevel = useGameState(s => s.effectLevel);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const particleEngineRef = useRef<ParticleEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const [loadingFile, setLoadingFile] = useState(false);
  const prevEffectLevelRef = useRef(0);

  useEffect(() => {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    canvasRef.current = canvas;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particleEngineRef.current?.resize(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const engine = new ParticleEngine(canvas);
    particleEngineRef.current = engine;

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
      audioEngineRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (phase === 'playing' && particleEngineRef.current) {
      particleEngineRef.current.setEffectLevel(effectLevel);
    }
  }, [effectLevel, phase]);

  useEffect(() => {
    if (effectLevel === 4 && prevEffectLevelRef.current < 4 && particleEngineRef.current) {
      particleEngineRef.current.triggerStarburst();
    }
    prevEffectLevelRef.current = effectLevel;
  }, [effectLevel]);

  useEffect(() => {
    if (phase !== 'playing') {
      cancelAnimationFrame(rafRef.current);
      if (phase === 'upload') {
        audioEngineRef.current?.dispose();
        audioEngineRef.current = null;
      }
      return;
    }

    const ae = audioEngineRef.current;
    const pe = particleEngineRef.current;
    if (!ae || !pe) return;

    const loop = (timestamp: number) => {
      pe.render(timestamp);
      updateCurrentTime(ae.currentTime);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [phase, updateCurrentTime]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && phase === 'playing') {
        e.preventDefault();
        const audioEngine = audioEngineRef.current;
        if (!audioEngine) return;
        const currentTime = audioEngine.currentTime;
        const judgment = judgeInput(currentTime);
        particleEngineRef.current?.onJudgment(judgment);
      }
    };

    const handleClick = () => {
      if (phase === 'playing') {
        const audioEngine = audioEngineRef.current;
        if (!audioEngine) return;
        const currentTime = audioEngine.currentTime;
        const judgment = judgeInput(currentTime);
        particleEngineRef.current?.onJudgment(judgment);
      }
    };

    window.addEventListener('keydown', handleKey);
    const canvas = canvasRef.current;
    canvas?.addEventListener('mousedown', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKey);
      canvas?.removeEventListener('mousedown', handleClick);
    };
  }, [phase, judgeInput]);

  const handleFileSelect = useCallback(async (file: File) => {
    setLoadingFile(true);
    const ae = new AudioEngine();
    audioEngineRef.current = ae;

    try {
      await ae.loadFile(file);

      ae.onBeat((beat) => {
        recordBeat(beat.time);
        particleEngineRef.current?.onBeat(beat);
      });

      ae.onWaveform((data) => {
        particleEngineRef.current?.onWaveform(data);
      });

      ae.onEnded(() => {
        endGame();
      });

      const duration = ae.getDuration();
      startGame(file.name, duration);
      ae.play();
    } catch (err) {
      console.error('Failed to load audio:', err);
    } finally {
      setLoadingFile(false);
    }
  }, [recordBeat, endGame, startGame]);

  useEffect(() => {
    if (phase === 'upload' && resetGame) {
      if (audioEngineRef.current) {
        audioEngineRef.current.dispose();
        audioEngineRef.current = null;
      }
    }
  }, [phase, resetGame]);

  return (
    <>
      {phase === 'upload' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
          <UploadArea onFileSelect={handleFileSelect} />
        </div>
      )}
      <HUD />
      <StatsPanel />
    </>
  );
};

const root = createRoot(document.getElementById('hud-root')!);
root.render(<App />);
