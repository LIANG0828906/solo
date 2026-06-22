import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameEngine } from './GameEngine';
import AsteroidField from './AsteroidField';
import DronePanel from './DronePanel';
import {
  GameState,
  ORE_COLORS,
  ORE_NAMES,
  ORE_PRICES,
  CANVAS_WIDTH,
} from './store';

function TopBar({ state }: { state: GameState }) {
  const progress = state.timeRemaining / state.totalTime;
  const minutes = Math.floor(state.timeRemaining / 60);
  const seconds = state.timeRemaining % 60;
  const timerColor =
    progress > 0.5 ? '#00C853' : progress > 0.25 ? '#FFD600' : '#FF1744';

  const ores: Array<'iron' | 'copper' | 'crystal'> = ['iron', 'copper', 'crystal'];

  return (
    <div
      style={{
        width: CANVAS_WIDTH + 'px',
        height: '50px',
        background: 'rgba(11, 11, 26, 0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '12px',
        padding: '0 20px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        border: '1px solid rgba(0, 229, 255, 0.18)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.35)',
        marginBottom: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontSize: '12px',
            color: '#8888AA',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}
        >
          资金
        </span>
        <span
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#FFD700',
            fontFamily: '"Courier New", monospace',
            textShadow: '0 0 12px rgba(255, 215, 0, 0.4)',
            letterSpacing: '0.5px',
          }}
        >
          {state.money.toLocaleString()}
        </span>
      </div>

      <div
        style={{
          width: '1px',
          height: '24px',
          background: 'rgba(0, 229, 255, 0.15)',
          flexShrink: 0,
        }}
      />

      {ores.map((ore) => (
        <div key={ore} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: ORE_COLORS[ore],
              boxShadow: `0 0 8px ${ORE_COLORS[ore]}60`,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '11px',
              color: '#AAAACC',
              letterSpacing: '0.3px',
            }}
          >
            {ORE_NAMES[ore]}
          </span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#FFFFFF',
              fontFamily: '"Courier New", monospace',
            }}
          >
            {state.inventory[ore]}
          </span>
        </div>
      ))}

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '2px',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              color: '#8888AA',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            剩余时间
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 'bold',
              color: timerColor,
              fontFamily: '"Courier New", monospace',
              textShadow: progress <= 0.25 ? `0 0 8px ${timerColor}80` : 'none',
            }}
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>

        <div
          style={{
            width: '150px',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '4px',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <motion.div
            initial={false}
            animate={{
              width: `${progress * 100}%`,
              backgroundColor: timerColor,
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              height: '100%',
              borderRadius: '4px',
              boxShadow: `0 0 8px ${timerColor}60`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface GameOverModalProps {
  state: GameState;
  onRestart: () => void;
}

function GameOverModal({ state, onRestart }: GameOverModalProps) {
  const [showReport, setShowReport] = useState(false);
  const ironValue = state.inventory.iron * ORE_PRICES.iron;
  const copperValue = state.inventory.copper * ORE_PRICES.copper;
  const crystalValue = state.inventory.crystal * ORE_PRICES.crystal;
  const totalValue = ironValue + copperValue + crystalValue;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          width: showReport ? '500px' : '400px',
          minHeight: showReport ? '480px' : '300px',
          background: '#1A1A2E',
          borderRadius: '16px',
          padding: '32px',
          boxSizing: 'border-box',
          color: '#FFFFFF',
          border: '1px solid rgba(0, 229, 255, 0.25)',
          boxShadow:
            '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 60px rgba(0, 229, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div
            style={{
              fontSize: '13px',
              color: '#8888AA',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            任务结算
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 700,
              color: '#00E5FF',
              marginBottom: '24px',
              letterSpacing: '0.5px',
            }}
          >
            采矿时间结束
          </h2>

          <div
            style={{
              fontSize: '12px',
              color: '#8888AA',
              marginBottom: '4px',
              letterSpacing: '0.5px',
            }}
          >
            最终收益
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4, type: 'spring' }}
            style={{
              fontSize: '48px',
              fontWeight: 900,
              color: '#FFD700',
              fontFamily: '"Courier New", monospace',
              textShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
              letterSpacing: '2px',
              lineHeight: 1.1,
              marginBottom: showReport ? '24px' : '8px',
            }}
          >
            {totalValue.toLocaleString()}
          </motion.div>
          <div
            style={{
              fontSize: '12px',
              color: '#AAAAAA',
              marginBottom: showReport ? '16px' : '32px',
            }}
          >
            银河信用点
          </div>

          <AnimatePresence>
            {showReport && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '10px',
                  padding: '16px',
                  boxSizing: 'border-box',
                  marginBottom: '16px',
                  border: '1px solid rgba(0, 229, 255, 0.1)',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: '#00E5FF',
                    fontWeight: 600,
                    marginBottom: '12px',
                    letterSpacing: '0.5px',
                    textAlign: 'left',
                  }}
                >
                  详尽报告
                </div>
                {(['iron', 'copper', 'crystal'] as const).map((ore) => {
                  const amount = state.inventory[ore];
                  const value = amount * ORE_PRICES[ore];
                  const percent = totalValue > 0 ? (value / totalValue) * 100 : 0;
                  return (
                    <div
                      key={ore}
                      style={{
                        marginBottom: '10px',
                        textAlign: 'left',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '4px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              background: ORE_COLORS[ore],
                              boxShadow: `0 0 6px ${ORE_COLORS[ore]}`,
                            }}
                          />
                          <span style={{ fontSize: '12px', color: '#CCCCEE' }}>
                            {ORE_NAMES[ore]}矿石
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#FFFFFF', fontFamily: '"Courier New", monospace' }}>
                          {amount} × {ORE_PRICES[ore]} ={' '}
                          <span style={{ color: '#FFD700', fontWeight: 'bold' }}>
                            {value}
                          </span>
                        </span>
                      </div>
                      <div
                        style={{
                          height: '4px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${percent}%`,
                            height: '100%',
                            background: ORE_COLORS[ore],
                            borderRadius: '2px',
                            transition: 'width 0.5s ease-out',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div
                  style={{
                    marginTop: '14px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#AAAAAA' }}>
                    无人机状态
                  </span>
                  <span style={{ fontSize: '12px', color: '#FFFFFF' }}>
                    {state.drones.filter((d) => d.status !== 'crashed').length}/
                    {state.drones.length} 存活
                  </span>
                </div>

                <div
                  style={{
                    marginTop: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#AAAAAA' }}>
                    小行星开采率
                  </span>
                  <span style={{ fontSize: '12px', color: '#FFFFFF' }}>
                    {state.asteroids.filter((a) => a.oreReserve <= 0).length}/
                    {state.asteroids.length}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            width: '100%',
          }}
        >
          <motion.button
            whileHover={{ scale: 1.03, filter: 'brightness(1.2)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            onClick={onRestart}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: '#2979FF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 16px rgba(41, 121, 255, 0.35)',
            }}
          >
            再来一局
          </motion.button>

          <motion.button
            whileHover={{
              scale: 1.03,
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
              borderColor: 'rgba(0, 229, 255, 0.6)',
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowReport((s) => !s)}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: 'transparent',
              color: '#00E5FF',
              border: '1px solid rgba(0, 229, 255, 0.35)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            {showReport ? '收起报告' : '详尽报告'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function App() {
  const { state, dispatch } = useGameEngine();

  const handleCanvasClick = useCallback(
    (x: number, y: number) => {
      if (state.isGameOver) return;
      dispatch({ type: 'DISPATCH_DRONES', x, y });
    },
    [state.isGameOver]
  );

  const handleRecallDrone = useCallback(
    (droneId: string) => {
      dispatch({ type: 'RECALL_DRONE', droneId });
    },
    []
  );

  const handleRestart = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at 30% 20%, rgba(0, 229, 255, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(255, 215, 0, 0.04) 0%, transparent 50%), #0B0B1A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '20px',
          alignItems: 'flex-start',
        }}
      >
        <DronePanel state={state} onRecallDrone={handleRecallDrone} />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <TopBar state={state} />
          <div style={{ position: 'relative' }}>
            <AsteroidField state={state} onCanvasClick={handleCanvasClick} />

            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                padding: '6px 12px',
                background: 'rgba(0, 0, 0, 0.45)',
                borderRadius: '6px',
                color: '#AAAAAA',
                fontSize: '11px',
                pointerEvents: 'none',
                letterSpacing: '0.3px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              点击画布派遣空闲无人机
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {state.isGameOver && (
          <GameOverModal state={state} onRestart={handleRestart} />
        )}
      </AnimatePresence>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
