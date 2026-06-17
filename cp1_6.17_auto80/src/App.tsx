import { useEffect, useRef, useState, useCallback } from 'react';
import {
  useGameStore,
  formatNumber,
  getMineralValue,
  getMineralColor,
  getMineralName,
  getUpgradeCost,
  createMineral
} from './store';
import {
  calculateFrame,
  handleClick as handleLogicClick,
  createShockwave,
  performAutoMine,
  getClickPowerAmount,
  getAutoMineAmount
} from './gameLogic';
import { render as renderCanvas } from './renderer';
import { MineralType } from './types';

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const gameStateRef = useRef(useGameStore.getState());
  const autoMineAccumulatorRef = useRef<number>(0);

  const [resourceAnimKey, setResourceAnimKey] = useState(0);
  const [, forceUpdate] = useState(0);

  const {
    canvasWidth,
    canvasHeight,
    setCanvasSize,
    initializeMinerals,
    updateMinerals,
    addResource,
    addShockwave,
    setAutoMineRate,
    upgradeClickPower,
    upgradeAutoMine,
    mineralUnlocks,
    upgrades,
    autoMineRate,
    resources,
    addMineral
  } = useGameStore();

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const w = Math.floor(rect.width);
        const h = Math.floor(rect.height);
        setCanvasSize(w, h);
        if (canvasRef.current) {
          canvasRef.current.width = w;
          canvasRef.current.height = h;
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [setCanvasSize]);

  useEffect(() => {
    if (canvasWidth > 0 && canvasHeight > 0) {
      initializeMinerals();
      gameStateRef.current = useGameStore.getState();
    }
  }, [canvasWidth, canvasHeight, initializeMinerals]);

  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state) => {
      gameStateRef.current = state;
      forceUpdate(x => x + 1);
    });
    return unsubscribe;
  }, []);

  const gameLoop = useCallback((currentTime: number) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const deltaTime = lastTimeRef.current ? currentTime - lastTimeRef.current : 16.67;
    lastTimeRef.current = currentTime;

    const state = gameStateRef.current;
    const newState = calculateFrame({
      gameState: state,
      deltaTime: Math.min(deltaTime, 50),
      currentTime,
      canvasWidth: state.canvasWidth,
      canvasHeight: state.canvasHeight
    });

    useGameStore.setState({
      minerals: newState.minerals,
      shockwaves: newState.shockwaves,
      meteorEvent: newState.meteorEvent,
      productionPaused: newState.productionPaused,
      productionPausedUntil: newState.productionPausedUntil,
      recoveryStartTime: newState.recoveryStartTime,
      nextMeteorTime: newState.nextMeteorTime
    });

    if ('requestIdleCallback' in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
        autoMineAccumulatorRef.current += deltaTime;
        const stateNow = gameStateRef.current;
        if (autoMineAccumulatorRef.current >= 500 && !stateNow.productionPaused) {
          autoMineAccumulatorRef.current = 0;
          const result = performAutoMine(stateNow);
          if (result) {
            const amount = getAutoMineAmount(stateNow, result.type);
            addResource(result.type, amount);
            const sw = createShockwave(result.x, result.y, currentTime);
            addShockwave(sw);
            setResourceAnimKey(k => k + 1);
          }
        }
      });
    } else {
      autoMineAccumulatorRef.current += deltaTime;
      if (autoMineAccumulatorRef.current >= 500 && !gameStateRef.current.productionPaused) {
        autoMineAccumulatorRef.current = 0;
        const result = performAutoMine(gameStateRef.current);
        if (result) {
          const amount = getAutoMineAmount(gameStateRef.current, result.type);
          addResource(result.type, amount);
          const sw = createShockwave(result.x, result.y, currentTime);
          addShockwave(sw);
          setResourceAnimKey(k => k + 1);
        }
      }
    }

    renderCanvas({
      ctx,
      gameState: gameStateRef.current,
      canvasWidth: gameStateRef.current.canvasWidth,
      canvasHeight: gameStateRef.current.canvasHeight,
      currentTime
    });

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [addResource, addShockwave]);

  useEffect(() => {
    if (canvasWidth > 0 && canvasHeight > 0) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [canvasWidth, canvasHeight, gameLoop]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const currentTime = performance.now();

    const state = gameStateRef.current;
    const { newState, result } = handleLogicClick(state, x, y, currentTime);

    if (result.destroyedMeteorId) {
      useGameStore.setState({
        meteorEvent: newState.meteorEvent
      });
      const sw = createShockwave(x, y, currentTime);
      addShockwave(sw);
      return;
    }

    if (result.collected && result.mineralType !== undefined) {
      const sw = createShockwave(result.collectedX ?? x, result.collectedY ?? y, currentTime);
      addShockwave(sw);

      const amount = getClickPowerAmount(state, result.mineralType);
      addResource(result.mineralType, amount);
      setResourceAnimKey(k => k + 1);

      const remainingMinerals = state.minerals.filter(m => {
        const dx = x - m.x;
        const dy = y - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist > m.size + 5;
      });

      if (state.mineralUnlocks[result.mineralType]) {
        remainingMinerals.push(
          createMineral(result.mineralType, state.canvasWidth, state.canvasHeight)
        );
      }
      updateMinerals(remainingMinerals);
    }
  };

  const clickUpgradeCost = getUpgradeCost(upgrades.clickPower, 10, 1.8);
  const autoUpgradeCost = getUpgradeCost(upgrades.autoMine, 25, 2);
  const midUnlockCost = 100;
  const deepUnlockCost = 1000;

  const handleUnlockMid = () => {
    if (resources.total >= midUnlockCost && !mineralUnlocks.mid) {
      useGameStore.setState(s => ({
        resources: { ...s.resources, total: s.resources.total - midUnlockCost },
        mineralUnlocks: { ...s.mineralUnlocks, mid: true }
      }));
      for (let i = 0; i < 3; i++) {
        addMineral(createMineral(MineralType.Mid, canvasWidth, canvasHeight));
      }
    }
  };

  const handleUnlockDeep = () => {
    if (resources.total >= deepUnlockCost && !mineralUnlocks.deep) {
      useGameStore.setState(s => ({
        resources: { ...s.resources, total: s.resources.total - deepUnlockCost },
        mineralUnlocks: { ...s.mineralUnlocks, deep: true }
      }));
      for (let i = 0; i < 2; i++) {
        addMineral(createMineral(MineralType.Deep, canvasWidth, canvasHeight));
      }
    }
  };

  return (
    <div style={styles.app}>
      <div ref={containerRef} style={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          style={styles.canvas}
          onClick={handleCanvasClick}
        />
      </div>

      <div style={styles.sidebar}>
        <div style={styles.header}>
          <h1 style={styles.title}>星际矿脉大师</h1>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>资源总量</div>
          <div
            key={resourceAnimKey}
            style={{
              ...styles.resourceValue,
              animation: 'scalePop 0.3s ease-out'
            }}
          >
            {formatNumber(resources.total)}
          </div>
          <div style={styles.resourceBreakdown}>
            {mineralUnlocks.surface && (
              <div style={styles.resourceItem}>
                <span style={{ ...styles.resourceDot, background: getMineralColor(MineralType.Surface) }} />
                <span style={styles.resourceLabel}>{getMineralName(MineralType.Surface)}</span>
                <span style={styles.resourceNum}>{formatNumber(resources.surface)}</span>
              </div>
            )}
            {mineralUnlocks.mid && (
              <div style={styles.resourceItem}>
                <span style={{ ...styles.resourceDot, background: getMineralColor(MineralType.Mid) }} />
                <span style={styles.resourceLabel}>{getMineralName(MineralType.Mid)}</span>
                <span style={styles.resourceNum}>{formatNumber(resources.mid)}</span>
              </div>
            )}
            {mineralUnlocks.deep && (
              <div style={styles.resourceItem}>
                <span style={{ ...styles.resourceDot, background: getMineralColor(MineralType.Deep) }} />
                <span style={styles.resourceLabel}>{getMineralName(MineralType.Deep)}</span>
                <span style={styles.resourceNum}>{formatNumber(resources.deep)}</span>
              </div>
            )}
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>升级</div>
          <button
            style={{
              ...styles.upgradeBtn,
              opacity: resources.total >= clickUpgradeCost ? 1 : 0.5
            }}
            onClick={upgradeClickPower}
            disabled={resources.total < clickUpgradeCost}
          >
            <span style={styles.upgradeBtnText}>点击力量 Lv.{upgrades.clickPower}</span>
            <span style={styles.upgradeBtnCost}>{formatNumber(clickUpgradeCost)}</span>
          </button>
          <button
            style={{
              ...styles.upgradeBtn,
              opacity: resources.total >= autoUpgradeCost ? 1 : 0.5
            }}
            onClick={upgradeAutoMine}
            disabled={resources.total < autoUpgradeCost}
          >
            <span style={styles.upgradeBtnText}>自动挖矿 Lv.{upgrades.autoMine}</span>
            <span style={styles.upgradeBtnCost}>{formatNumber(autoUpgradeCost)}</span>
          </button>

          {!mineralUnlocks.mid && (
            <button
              style={{
                ...styles.upgradeBtn,
                background: '#006666',
                opacity: resources.total >= midUnlockCost ? 1 : 0.5
              }}
              onClick={handleUnlockMid}
              disabled={resources.total < midUnlockCost}
            >
              <span style={styles.upgradeBtnText}>解锁 虚空晶</span>
              <span style={styles.upgradeBtnCost}>{formatNumber(midUnlockCost)}</span>
            </button>
          )}
          {mineralUnlocks.mid && !mineralUnlocks.deep && (
            <button
              style={{
                ...styles.upgradeBtn,
                background: '#B8860B',
                opacity: resources.total >= deepUnlockCost ? 1 : 0.5
              }}
              onClick={handleUnlockDeep}
              disabled={resources.total < deepUnlockCost}
            >
              <span style={styles.upgradeBtnText}>解锁 宇宙核</span>
              <span style={styles.upgradeBtnCost}>{formatNumber(deepUnlockCost)}</span>
            </button>
          )}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>自动挖矿倍率</div>
          <div style={styles.sliderContainer}>
            <span style={styles.sliderLabel}>0.5x</span>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={autoMineRate}
              onChange={(e) => setAutoMineRate(parseFloat(e.target.value))}
              style={styles.slider}
            />
            <span style={styles.sliderLabel}>5x</span>
          </div>
          <div style={styles.sliderValue}>当前: {autoMineRate.toFixed(1)}x</div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>矿物图鉴</div>
          <div style={styles.codexGrid}>
            <div
              style={{
                ...styles.codexItem,
                boxShadow: `0 0 10px ${getMineralColor(MineralType.Surface)}`
              }}
            >
              <div style={{ ...styles.codexShape, background: getMineralColor(MineralType.Surface), borderRadius: 3 }} />
              <div style={styles.codexName}>{getMineralName(MineralType.Surface)}</div>
              <div style={styles.codexValue}>+{getMineralValue(MineralType.Surface)}</div>
            </div>
            {mineralUnlocks.mid && (
              <div
                style={{
                  ...styles.codexItem,
                  boxShadow: `0 0 10px ${getMineralColor(MineralType.Mid)}`
                }}
              >
                <div style={{
                  ...styles.codexShape,
                  background: getMineralColor(MineralType.Mid),
                  transform: 'rotate(45deg)',
                  borderRadius: 2
                }} />
                <div style={styles.codexName}>{getMineralName(MineralType.Mid)}</div>
                <div style={styles.codexValue}>+{getMineralValue(MineralType.Mid)}</div>
              </div>
            )}
            {mineralUnlocks.deep && (
              <div
                style={{
                  ...styles.codexItem,
                  boxShadow: `0 0 10px ${getMineralColor(MineralType.Deep)}`
                }}
              >
                <div style={{
                  ...styles.codexShape,
                  background: getMineralColor(MineralType.Deep),
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                }} />
                <div style={styles.codexName}>{getMineralName(MineralType.Deep)}</div>
                <div style={styles.codexValue}>+{getMineralValue(MineralType.Deep)}</div>
              </div>
            )}
            {!mineralUnlocks.mid && (
              <div style={{ ...styles.codexItem, opacity: 0.3 }}>
                <div style={{ ...styles.codexShape, background: '#444', transform: 'rotate(45deg)' }} />
                <div style={styles.codexName}>???</div>
                <div style={styles.codexValue}>未解锁</div>
              </div>
            )}
            {!mineralUnlocks.deep && (
              <div style={{ ...styles.codexItem, opacity: 0.3 }}>
                <div style={{
                  ...styles.codexShape,
                  background: '#444',
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                }} />
                <div style={styles.codexName}>???</div>
                <div style={styles.codexValue}>未解锁</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scalePop {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #00FFFF;
          cursor: pointer;
          box-shadow: 0 0 10px #00FFFF;
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #00FFFF;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px #00FFFF;
        }
        button {
          transition: all 0.2s ease;
        }
        button:hover:not(:disabled) {
          background: #9400D3 !important;
          box-shadow: 0 0 15px rgba(148, 0, 211, 0.6);
          transform: translateY(-1px);
        }
        button:active:not(:disabled) {
          background: #2F0047 !important;
          transform: translateY(0);
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(30, 20, 60, 0.5);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: #4B0082;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #9400D3;
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    background: '#0A0515',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden'
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '100%',
    cursor: 'pointer'
  },
  sidebar: {
    width: 280,
    background: 'rgba(30, 20, 60, 0.85)',
    backdropFilter: 'blur(10px)',
    borderRadius: 12,
    margin: 12,
    padding: 16,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    border: '1px solid rgba(123, 104, 238, 0.3)'
  },
  header: {
    textAlign: 'center',
    paddingBottom: 8,
    borderBottom: '1px solid rgba(123, 104, 238, 0.3)'
  },
  title: {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 14,
    color: '#00FF7F',
    margin: 0,
    textShadow: '0 0 10px rgba(0, 255, 127, 0.5)',
    lineHeight: 1.5
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  sectionTitle: {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 9,
    color: '#9400D3',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  resourceValue: {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 20,
    color: '#00FF7F',
    textAlign: 'center',
    padding: '12px 0',
    textShadow: '0 0 15px rgba(0, 255, 127, 0.7)',
    letterSpacing: 1
  },
  resourceBreakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginTop: 4
  },
  resourceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    color: '#ccc'
  },
  resourceDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    boxShadow: '0 0 6px currentColor'
  },
  resourceLabel: {
    flex: 1,
    fontSize: 10
  },
  resourceNum: {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 9,
    color: '#00FF7F'
  },
  upgradeBtn: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    background: '#4B0082',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    fontSize: 11
  },
  upgradeBtnText: {
    fontSize: 11
  },
  upgradeBtnCost: {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 9,
    color: '#FFD700'
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  sliderLabel: {
    fontSize: 9,
    color: '#888',
    fontFamily: '"Press Start 2P", monospace'
  },
  slider: {
    flex: 1,
    height: 6,
    background: '#3A2A5A',
    borderRadius: 3,
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none'
  },
  sliderValue: {
    textAlign: 'center',
    fontSize: 10,
    color: '#00FFFF',
    fontFamily: '"Press Start 2P", monospace',
    marginTop: 4
  },
  codexGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8
  },
  codexItem: {
    background: '#252040',
    borderRadius: 6,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4
  },
  codexShape: {
    width: 24,
    height: 24,
    marginBottom: 2
  },
  codexName: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 500
  },
  codexValue: {
    fontSize: 9,
    color: '#00FF7F',
    fontFamily: '"Press Start 2P", monospace'
  }
};

export default App;
