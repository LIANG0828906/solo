import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import {
  GameState,
  initializeGame,
  setPlayerTarget,
  adjustFlashlightAngle,
  updateGame,
  goToNextLevel,
  allButtonsActivated,
} from './gameLogic';
import {
  drawScene,
  PlayerRenderState,
  FlashlightRenderState,
  ButtonRenderState,
  DoorRenderState,
  PlatformRenderState,
  BatteryPackRenderState,
} from './renderEngine';

const GameUI: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 1000, height: 600 });
  const [tick, setTick] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [gameComplete, setGameComplete] = useState(false);

  useEffect(() => {
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    const init = async () => {
      try {
        gameStateRef.current = await initializeGame();
        setIsLoading(false);
      } catch (e) {
        console.error('初始化游戏失败:', e);
        setIsLoading(false);
      }
    };
    init();

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    let animFrameId: number;
    let lastTime = performance.now();

    const gameLoop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const state = gameStateRef.current;
      const layer = layerRef.current;
      if (state && layer) {
        updateGame(state, dt, viewportSize.width, viewportSize.height);

        const player: PlayerRenderState = {
          x: state.player.x,
          y: state.player.y,
          radius: state.player.radius,
        };

        const flashlight: FlashlightRenderState = {
          angle: state.flashlight.angle,
          range: state.flashlight.range,
          coneAngle: state.flashlight.coneAngle,
          isOn: state.flashlight.battery > 0,
          isFlickering: state.flashlight.isFlickering,
        };

        const buttons: ButtonRenderState[] = state.buttons.map((b) => ({
          id: b.id,
          x: b.x,
          y: b.y,
          radius: b.radius,
          activated: b.activated,
          pulsePhase: Math.sin(b.pulsePhase * Math.PI * 2),
        }));

        const doors: DoorRenderState[] = state.doors.map((d) => ({
          id: d.id,
          x: d.x,
          y: d.y,
          width: d.width,
          height: d.height,
          openProgress: d.openProgress,
        }));

        const platforms: PlatformRenderState[] = state.platforms.map((p) => ({
          id: p.id,
          x: p.x,
          y: p.y,
          width: p.width,
          height: p.height,
        }));

        const batteryPacks: BatteryPackRenderState[] = state.batteryPacks
          .filter((bp) => !bp.collected)
          .map((bp) => ({
            id: bp.id,
            x: bp.x,
            y: bp.y,
            size: bp.size,
            pulsePhase: Math.sin(bp.pulsePhase * Math.PI * 2),
          }));

        const level = state.levels[state.currentLevelIndex];
        const shakeX = state.shakeTime > 0 ? (Math.random() - 0.5) * 4 : 0;

        drawScene({
          layer,
          width: viewportSize.width,
          height: viewportSize.height,
          player,
          flashlight,
          obstacles: level.obstacles,
          buttons,
          doors,
          platforms,
          shadows: state.shadows,
          particles: state.particles,
          batteryPacks,
          exit: level.exit,
          allButtonsActivated: allButtonsActivated(state),
        });

        if (shakeX !== 0 && layer) {
          layer.x(shakeX);
        } else if (layer) {
          layer.x(0);
        }

        setTick((t) => t + 1);
      }

      animFrameId = requestAnimationFrame(gameLoop);
    };

    animFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameId);
  }, [isLoading, viewportSize]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const state = gameStateRef.current;
    if (!state || state.isLevelComplete) return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (pos) {
      setPlayerTarget(state, pos.x, pos.y);
    }
  }, []);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const state = gameStateRef.current;
    if (!state || state.isLevelComplete) return;
    if (e.evt.buttons === 1) {
      const pos = e.target.getStage()?.getPointerPosition();
      if (pos) {
        setPlayerTarget(state, pos.x, pos.y);
      }
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const state = gameStateRef.current;
    if (!state || state.isLevelComplete) return;
    const delta = e.deltaY > 0 ? 5 : -5;
    adjustFlashlightAngle(state, delta);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      if (!state || state.isLevelComplete) return;
      if (e.key === 'q' || e.key === 'Q') {
        adjustFlashlightAngle(state, -5);
      } else if (e.key === 'e' || e.key === 'E') {
        adjustFlashlightAngle(state, 5);
      }
    };

    const wheelHandler = (e: WheelEvent) => {
      const state = gameStateRef.current;
      if (!state || state.isLevelComplete) return;
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNextLevel = useCallback(() => {
    const state = gameStateRef.current;
    if (!state) return;
    const hasNext = goToNextLevel(state);
    if (!hasNext) {
      setGameComplete(true);
    }
    setTick((t) => t + 1);
  }, []);

  const state = gameStateRef.current;
  const batteryPercent = state?.flashlight.battery ?? 0;
  const batteryColor = batteryPercent > 50 ? '#22C55E' : batteryPercent > 20 ? '#EAB308' : '#EF4444';

  const isSmallScreen = viewportSize.width < 768;
  const hudScale = isSmallScreen ? 0.8 : 1;

  if (isLoading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingText}>正在加载光影解谜...</div>
      </div>
    );
  }

  if (gameComplete) {
    return (
      <div style={styles.loading}>
        <div style={{ ...styles.victoryText, color: '#22C55E' }}>恭喜通关！</div>
        <div style={styles.subText}>感谢游玩光影解谜</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        ...styles.container,
        transform: state?.shakeTime && state.shakeTime > 0
          ? `translateX(${2 * Math.sin(tick)}px)`
          : 'none',
        transition: 'transform 0.1s',
      }}
      onWheel={handleWheel}
    >
      <Stage
        ref={(s) => {
          stageRef.current = s;
        }}
        width={viewportSize.width}
        height={viewportSize.height}
        style={{ background: '#1A1A2E' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <Layer
          ref={(l) => {
            layerRef.current = l;
          }}
        />
      </Stage>

      <div
        style={{
          ...styles.hud,
          transform: `scale(${hudScale})`,
          transformOrigin: 'top left',
          flexDirection: isSmallScreen ? 'column' : 'row',
          alignItems: isSmallScreen ? 'flex-start' : 'center',
        }}
      >
        <div style={styles.levelText}>
          关卡 {state ? state.currentLevelIndex + 1 : 1} / {state?.levels.length ?? 3}
        </div>
        <div style={{ ...styles.batteryContainer, marginLeft: isSmallScreen ? 0 : 20, marginTop: isSmallScreen ? 10 : 0 }}>
          <div style={styles.batteryLabel}>电量</div>
          <div style={styles.batteryBarBg}>
            <div
              style={{
                ...styles.batteryBarFill,
                width: `${batteryPercent}%`,
                background: `linear-gradient(90deg, #22C55E, ${batteryColor})`,
              }}
            />
          </div>
          <div style={styles.batteryPercent}>{Math.round(batteryPercent)}%</div>
        </div>
        {state?.fastestTime !== undefined && state?.fastestTime !== null && (
          <div style={{ ...styles.fastestTime, marginLeft: isSmallScreen ? 0 : 20, marginTop: isSmallScreen ? 10 : 0 }}>
            本关最快：{state.fastestTime.toFixed(1)}秒
          </div>
        )}
      </div>

      <div
        style={{
          ...styles.controls,
          transform: `scale(${hudScale})`,
          transformOrigin: 'bottom left',
        }}
      >
        <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="#AAAAAA" strokeWidth="2">
          <rect x="6" y="3" width="12" height="14" rx="2" />
          <line x1="12" y1="17" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="#AAAAAA" strokeWidth="2">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <line x1="6" y1="12" x2="6" y2="12" />
          <line x1="10" y1="12" x2="10" y2="12" />
          <circle cx="18" cy="12" r="1" />
        </svg>
        <span style={styles.controlsText}>点击移动 · 滚轮/Q/E调角度</span>
      </div>

      {state?.isLevelComplete && (
        <div
          style={{
            ...styles.overlay,
            opacity: state.isTransitioning ? 0 : 1,
            transition: 'opacity 0.5s',
          }}
        >
          <div
            style={{
              ...styles.victoryBox,
              animation: 'victoryPop 0.5s ease-out',
            }}
          >
            <div style={{ ...styles.victoryText, color: '#22C55E' }}>关卡通过</div>
            {state.fastestTime !== null && (
              <div style={styles.fastestDisplay}>
                通关时间：{((performance.now() - state.levelStartTime) / 1000).toFixed(1)}秒
              </div>
            )}
            <button style={styles.nextButton} onClick={handleNextLevel}>
              {state.currentLevelIndex + 1 >= (state.levels?.length ?? 0) ? '完成游戏' : '下一关'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes victoryPop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    background: '#1A1A2E',
    fontFamily: "'Press Start 2P', cursive",
  },
  loading: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: '#1A1A2E',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Press Start 2P', cursive",
  },
  loadingText: {
    color: '#FFFED4',
    fontSize: '18px',
    textShadow: '0 0 10px #FFFED4',
  },
  hud: {
    position: 'absolute',
    top: 20,
    left: 20,
    display: 'flex',
    gap: 8,
    pointerEvents: 'none',
    zIndex: 10,
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: '18px',
    textShadow: '0 0 8px rgba(255,255,255,0.5)',
  },
  batteryContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  batteryLabel: {
    color: '#AAAAAA',
    fontSize: '10px',
  },
  batteryBarBg: {
    width: 150,
    height: 10,
    background: '#333333',
    borderRadius: 2,
    overflow: 'hidden',
    border: '1px solid #555',
  },
  batteryBarFill: {
    height: '100%',
    transition: 'width 0.3s ease, background 0.3s ease',
    borderRadius: 2,
  },
  batteryPercent: {
    color: '#AAAAAA',
    fontSize: '10px',
    minWidth: 40,
  },
  fastestTime: {
    color: '#FFFED4',
    fontSize: '10px',
    textShadow: '0 0 5px rgba(255,254,212,0.5)',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    pointerEvents: 'none',
    zIndex: 10,
  },
  icon: {
    width: 24,
    height: 24,
  },
  controlsText: {
    color: '#AAAAAA',
    fontSize: '12px',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  victoryBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
    padding: '40px 60px',
    background: 'rgba(26, 26, 46, 0.95)',
    border: '2px solid #22C55E',
    borderRadius: 8,
    boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)',
  },
  victoryText: {
    fontSize: '32px',
    textShadow: '0 0 20px currentColor',
  },
  fastestDisplay: {
    color: '#AAAAAA',
    fontSize: '12px',
  },
  subText: {
    color: '#AAAAAA',
    fontSize: '12px',
    marginTop: 16,
  },
  nextButton: {
    fontFamily: "'Press Start 2P', cursive",
    fontSize: '14px',
    padding: '12px 32px',
    background: '#22C55E',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)',
  },
};

export default GameUI;
