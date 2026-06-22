import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './GameEngine';
import ControlPanel from './ControlPanel';
import {
  PlayerData,
  MonsterConfig,
  CombatStats,
  StatePreset,
  DEFAULT_PLAYER,
  DEFAULT_MONSTER,
  MAX_PRESETS,
  MAP_WIDTH,
  MAP_HEIGHT
} from './types';

const STORAGE_KEY = 'roguelike-combat-sandbox-presets';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [playerConfig, setPlayerConfig] = useState<PlayerData>({ ...DEFAULT_PLAYER });
  const [monsterConfig, setMonsterConfig] = useState<MonsterConfig>({ ...DEFAULT_MONSTER });
  const [combatStats, setCombatStats] = useState<CombatStats>({
    totalDamage: 0,
    dodgeCount: 0,
    hitCount: 0,
    monsterHpPercent: 100,
    currentDps: 0,
    dpsHistory: []
  });
  const [presets, setPresets] = useState<(StatePreset | null)[]>(
    Array.from({ length: MAX_PRESETS }, () => null)
  );
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === MAX_PRESETS) {
          setPresets(parsed);
        }
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    const handleResize = () => {
      setIsNarrow(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new GameEngine(canvas, playerConfig, monsterConfig);
    engineRef.current = engine;

    engine.setStatsCallback((stats) => {
      setCombatStats(stats);
    });

    const resizeCanvas = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const mapRatio = MAP_WIDTH / MAP_HEIGHT;
      let canvasWidth = containerWidth;
      let canvasHeight = containerWidth / mapRatio;

      if (canvasHeight > containerHeight) {
        canvasHeight = containerHeight;
        canvasWidth = containerHeight * mapRatio;
      }

      canvasRef.current.style.width = `${canvasWidth}px`;
      canvasRef.current.style.height = `${canvasHeight}px`;

      const dpr = window.devicePixelRatio || 1;
      canvasRef.current.width = Math.floor(canvasWidth * dpr);
      canvasRef.current.height = Math.floor(canvasHeight * dpr);
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      engine.resizeCanvas(Math.floor(canvasWidth * dpr), Math.floor(canvasHeight * dpr));
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    engine.start();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      engine.stop();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setPlayerConfig(playerConfig);
    }
  }, [playerConfig]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setMonsterConfig(monsterConfig);
    }
  }, [monsterConfig]);

  const handlePlayerChange = useCallback((key: keyof PlayerData, value: number) => {
    setPlayerConfig((prev) => ({ ...prev, [key]: value }));
    setSelectedPreset(null);
  }, []);

  const handleMonsterChange = useCallback((key: keyof MonsterConfig, value: number) => {
    setMonsterConfig((prev) => ({ ...prev, [key]: value }));
    setSelectedPreset(null);
  }, []);

  const handleSavePreset = useCallback(
    (index: number) => {
      const preset: StatePreset = {
        id: index,
        player: { ...playerConfig },
        monster: { ...monsterConfig },
        timestamp: Date.now()
      };
      setPresets((prev) => {
        const next = [...prev];
        next[index] = preset;
        return next;
      });
      setSelectedPreset(index);
    },
    [playerConfig, monsterConfig]
  );

  const handleLoadPreset = useCallback((index: number) => {
    setPresets((prev) => {
      const preset = prev[index];
      if (preset) {
        setPlayerConfig({ ...preset.player });
        setMonsterConfig({ ...preset.monster });
        setSelectedPreset(index);
      }
      return prev;
    });
  }, []);

  const handleReset = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
    }
  }, []);

  const layoutStyle: React.CSSProperties = isNarrow
    ? { display: 'flex', flexDirection: 'column', width: '100%', minWidth: 1024 }
    : { display: 'flex', flexDirection: 'row', width: '100%' };

  const gameContainerStyle: React.CSSProperties = isNarrow
    ? {
        width: '100%',
        height: '70vh',
        minHeight: 500,
        background: '#1A1A2E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative'
      }
    : {
        width: '70%',
        height: '100vh',
        background: '#1A1A2E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative'
      };

  const controlPanelStyle: React.CSSProperties = isNarrow
    ? { width: '100%', maxHeight: 'none' }
    : { width: '30%', height: '100vh' };

  return (
    <div
      style={{
        ...layoutStyle,
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        fontFamily: "'Segoe UI', sans-serif",
        background: '#16213E',
        minWidth: isNarrow ? 1024 : undefined
      }}
    >
      <div ref={containerRef} style={gameContainerStyle}>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            border: '1px solid #2D2D44',
            borderRadius: 4,
            boxShadow: '0 0 20px rgba(0,0,0,0.3)'
          }}
          tabIndex={0}
        />
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: 'rgba(22, 33, 62, 0.85)',
            padding: '10px 14px',
            borderRadius: 6,
            fontSize: 12,
            color: '#A0A0B0',
            lineHeight: 1.6,
            pointerEvents: 'none'
          }}
        >
          <div style={{ color: '#E94560', fontWeight: 700, marginBottom: 4 }}>CONTROLS</div>
          <div>WASD / Arrows - Move</div>
          <div>SPACE - Attack</div>
        </div>
      </div>

      <div style={controlPanelStyle}>
        <ControlPanel
          playerConfig={playerConfig}
          monsterConfig={monsterConfig}
          combatStats={combatStats}
          presets={presets}
          selectedPreset={selectedPreset}
          onPlayerChange={handlePlayerChange}
          onMonsterChange={handleMonsterChange}
          onSavePreset={handleSavePreset}
          onLoadPreset={handleLoadPreset}
          onReset={handleReset}
        />
      </div>
    </div>
  );
};

export default App;
