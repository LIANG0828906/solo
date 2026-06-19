import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BattleGrid from './components/BattleGrid';
import FleetPanel from './components/FleetPanel';
import { useGameStore } from './store/gameStore';
import { aiLogic } from './utils/aiLogic';
import { SHIP_CONFIGS } from './types';

function App() {
  const phase = useGameStore((state) => state.phase);
  const turn = useGameStore((state) => state.turn);
  const round = useGameStore((state) => state.round);
  const selectedShip = useGameStore((state) => state.selectedShip);
  const placementDirection = useGameStore((state) => state.placementDirection);
  const winner = useGameStore((state) => state.winner);
  const isAiThinking = useGameStore((state) => state.isAiThinking);
  const playerHits = useGameStore((state) => state.playerHits);
  const playerMisses = useGameStore((state) => state.playerMisses);
  const aiHits = useGameStore((state) => state.aiHits);
  const aiMisses = useGameStore((state) => state.aiMisses);
  const canStart = useGameStore((state) => state.canStartBattle());
  const playerGrid = useGameStore((state) => state.playerGrid);

  const selectShip = useGameStore((state) => state.selectShip);
  const toggleDirection = useGameStore((state) => state.toggleDirection);
  const startBattle = useGameStore((state) => state.startBattle);
  const setTurn = useGameStore((state) => state.setTurn);
  const setAiThinking = useGameStore((state) => state.setAiThinking);
  const aiAttack = useGameStore((state) => state.aiAttack);
  const incrementRound = useGameStore((state) => state.incrementRound);
  const resetGame = useGameStore((state) => state.resetGame);
  const setHitAnimation = useGameStore((state) => state.setHitAnimation);

  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerAttackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPlayerShotsRef = useRef(0);

  const playerShips = useGameStore((state) => state.playerShips);
  const aiShips = useGameStore((state) => state.aiShips);

  const playerTotalShots = playerHits + playerMisses;
  const aiTotalShots = aiHits + aiMisses;
  const playerHitRate = playerTotalShots > 0 ? ((playerHits / playerTotalShots) * 100).toFixed(1) : '0.0';
  const aiHitRate = aiTotalShots > 0 ? ((aiHits / aiTotalShots) * 100).toFixed(1) : '0.0';

  const playerSunkCount = playerShips.filter(s => s.isPlaced && s.isSunk).length;
  const aiSunkCount = aiShips.filter(s => s.isPlaced && s.isSunk).length;

  const runAiTurn = useCallback(() => {
    setAiThinking(true);
    const thinkTime = 600 + Math.random() * 400;

    aiTimeoutRef.current = setTimeout(() => {
      const currentGrid = useGameStore.getState().playerGrid;
      const target = aiLogic.getNextTarget(currentGrid);
      const hit = aiAttack(target.x, target.y);
      aiLogic.recordHit(target.x, target.y, hit);

      setTimeout(() => {
        setHitAnimation(null);
      }, 600);

      setTimeout(() => {
        const state = useGameStore.getState();
        if (state.phase === 'battle') {
          setTurn('player');
          incrementRound();
        }
        setAiThinking(false);
      }, 700);
    }, thinkTime);
  }, [setAiThinking, aiAttack, setHitAnimation, setTurn, incrementRound]);

  useEffect(() => {
    if (phase === 'battle' && turn === 'ai' && !isAiThinking) {
      runAiTurn();
    }

    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, [turn, phase, isAiThinking, runAiTurn]);

  useEffect(() => {
    if (phase !== 'battle') {
      prevPlayerShotsRef.current = playerTotalShots;
      return;
    }

    if (playerTotalShots > prevPlayerShotsRef.current && turn === 'player') {
      prevPlayerShotsRef.current = playerTotalShots;

      if (playerAttackTimeoutRef.current) {
        clearTimeout(playerAttackTimeoutRef.current);
      }

      playerAttackTimeoutRef.current = setTimeout(() => {
        const state = useGameStore.getState();
        if (state.phase === 'battle' && state.turn === 'player') {
          setTurn('ai');
        }
      }, 800);
    }

    return () => {
      if (playerAttackTimeoutRef.current) {
        clearTimeout(playerAttackTimeoutRef.current);
      }
    };
  }, [playerTotalShots, phase, turn, setTurn]);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #1A237E 0%, #0D47A1 50%, #01579B 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: 20, zIndex: 1 }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: '#ECF0F1',
            margin: 0,
            textShadow: '0 4px 8px rgba(0,0,0,0.5)',
            fontFamily: 'monospace',
            letterSpacing: 4,
          }}
        >
          ⚓ 海战棋 ⚓
        </h1>
        <div
          style={{
            fontSize: 24,
            fontFamily: 'monospace',
            color: '#F39C12',
            marginTop: 8,
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          第 {round} 回合
        </div>
        <div style={{ fontSize: 14, color: '#BDC3C7', marginTop: 4 }}>
          {phase === 'placement' && '布阵阶段 - 选择船只并放置到网格'}
          {phase === 'battle' && turn === 'player' && '你的回合 - 点击敌方海域攻击'}
          {phase === 'battle' && turn === 'ai' && 'AI回合 - 敌方正在瞄准...'}
          {phase === 'gameOver' && '游戏结束'}
        </div>
      </motion.div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 20,
          zIndex: 1,
        }}
      >
        <FleetPanel side="player" title="我方舰队" />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <BattleGrid side="player" title="我方海域" />

            <div
              style={{
                width: 2,
                height: 420,
                backgroundColor: '#7F8C8D',
                boxShadow: '0 0 10px rgba(0,0,0,0.5)',
              }}
            />

            <BattleGrid side="ai" title="敌方海域" />
          </div>

          {phase === 'placement' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              style={{
                backgroundColor: 'rgba(44, 62, 80, 0.9)',
                borderRadius: 12,
                padding: 16,
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  color: '#ECF0F1',
                  marginBottom: 12,
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                选择战舰
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                {SHIP_CONFIGS.map((config) => {
                  const isSelected = selectedShip === config.type;
                  return (
                    <motion.button
                      key={config.type}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: isSelected ? '2px solid white' : '2px solid transparent',
                        backgroundColor: config.color,
                        color: 'white',
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        minWidth: 70,
                        boxShadow: isSelected ? '0 0 15px rgba(255,255,255,0.5)' : 'none',
                      }}
                      whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => selectShip(isSelected ? null : config.type)}
                    >
                      <span style={{ fontSize: 20 }}>{config.emoji}</span>
                      <span style={{ fontSize: 12 }}>{config.name}</span>
                      <span style={{ fontSize: 10, opacity: 0.8 }}>{config.length}格</span>
                    </motion.button>
                  );
                })}
              </div>

              {selectedShip && (
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 10 }}>
                  <motion.button
                    style={{
                      padding: '6px 16px',
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: '#3498DB',
                      color: 'white',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleDirection}
                  >
                    方向: {placementDirection === 'horizontal' ? '水平' : '垂直'}
                  </motion.button>
                </div>
              )}

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                <motion.button
                  style={{
                    padding: '12px 40px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: canStart ? '#E74C3C' : '#7F8C8D',
                    color: 'white',
                    fontSize: 18,
                    fontWeight: 'bold',
                    cursor: canStart ? 'pointer' : 'not-allowed',
                    boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)',
                  }}
                  whileHover={canStart ? { scale: 1.05, boxShadow: '0 6px 20px rgba(231, 76, 60, 0.6)' } : {}}
                  whileTap={canStart ? { scale: 0.95 } : {}}
                  onClick={startBattle}
                  disabled={!canStart}
                >
                  ⚔️ 开战
                </motion.button>
              </div>
            </motion.div>
          )}

          {phase === 'battle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ width: '100%', maxWidth: 460 }}
            >
              <div
                style={{
                  height: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  style={{
                    height: '100%',
                    backgroundColor: turn === 'player' ? '#2ECC71' : '#E74C3C',
                    borderRadius: 4,
                  }}
                  initial={false}
                  animate={{
                    width: turn === 'ai' && isAiThinking ? '100%' : '100%',
                  }}
                  transition={{ duration: turn === 'ai' && isAiThinking ? 1.3 : 0.3 }}
                />
              </div>
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 12,
                  color: '#BDC3C7',
                  marginTop: 4,
                }}
              >
                {turn === 'player' ? '🟢 你的回合' : '🔴 AI正在瞄准...'}
              </div>
            </motion.div>
          )}
        </div>

        <FleetPanel side="ai" title="敌方舰队" />
      </div>

      <AnimatePresence>
        {phase === 'gameOver' && winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              style={{
                backgroundColor: '#2C3E50',
                borderRadius: 16,
                padding: 40,
                textAlign: 'center',
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                minWidth: 350,
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  marginBottom: 16,
                }}
              >
                {winner === 'player' ? '🏆' : '💀'}
              </div>
              <h2
                style={{
                  fontSize: 32,
                  color: winner === 'player' ? '#2ECC71' : '#E74C3C',
                  margin: '0 0 24px 0',
                  textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }}
              >
                {winner === 'player' ? '胜利！' : '失败...'}
              </h2>

              <div
                style={{
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    color: '#ECF0F1',
                    marginBottom: 12,
                    fontWeight: 'bold',
                  }}
                >
                  战斗统计
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', gap: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#BDC3C7', marginBottom: 4 }}>我方</div>
                    <div style={{ fontSize: 18, color: '#3498DB', fontWeight: 'bold' }}>
                      命中率: {playerHitRate}%
                    </div>
                    <div style={{ fontSize: 14, color: '#2ECC71', marginTop: 4 }}>
                      击沉: {aiSunkCount} 艘
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#BDC3C7', marginBottom: 4 }}>敌方</div>
                    <div style={{ fontSize: 18, color: '#E74C3C', fontWeight: 'bold' }}>
                      命中率: {aiHitRate}%
                    </div>
                    <div style={{ fontSize: 14, color: '#E74C3C', marginTop: 4 }}>
                      击沉: {playerSunkCount} 艘
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    fontSize: 14,
                    color: '#F39C12',
                  }}
                >
                  总回合数: {round}
                </div>
              </div>

              <motion.button
                style={{
                  padding: '14px 48px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#3498DB',
                  color: 'white',
                  fontSize: 18,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(52, 152, 219, 0.4)',
                }}
                whileHover={{ scale: 1.05, boxShadow: '0 6px 20px rgba(52, 152, 219, 0.6)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  aiLogic.reset();
                  resetGame();
                }}
              >
                🔄 再来一局
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
