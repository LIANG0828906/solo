import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameStore } from '../store';
import { initGame } from '../engine/particleSystem';
import { GameState, Warning } from '../engine/types';

export const Hud: React.FC = () => {
  const [state, setState] = useState<GameState>(gameStore.getState());
  const [showGameOver, setShowGameOver] = useState(false);

  useEffect(() => {
    return gameStore.subscribe((newState) => {
      setState(newState);
      if (newState.gameStatus === 'gameover') {
        setShowGameOver(true);
      }
    });
  }, []);

  const handleRestart = () => {
    setShowGameOver(false);
    gameStore.restart();
    setTimeout(() => {
      initGame();
    }, 50);
  };

  const collectedParts = state.satelliteParts.filter((p) => p.collected).length;
  const totalParts = state.satelliteParts.length;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          width: 180,
          height: 60,
          background: 'rgba(10, 25, 47, 0.85)',
          borderRadius: 8,
          border: '1px solid rgba(33, 150, 243, 0.3)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: 12,
          boxShadow: '0 0 20px rgba(33, 150, 243, 0.2)',
        }}
      >
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: `14px solid ${i < state.ship.lives ? '#FF5252' : '#555'}`,
                filter: i < state.ship.lives ? 'drop-shadow(0 0 4px rgba(255, 82, 82, 0.6))' : 'none',
                transition: 'border-bottom-color 0.3s',
              }}
            />
          ))}
        </div>

        <div style={{ position: 'relative', width: 30, height: 30 }}>
          <svg
            width="30"
            height="30"
            viewBox="0 0 30 30"
            style={{
              animation: 'spin 2s linear infinite',
              transformOrigin: 'center',
            }}
          >
            <circle
              cx="15"
              cy="15"
              r="12"
              fill="none"
              stroke="#333"
              strokeWidth="3"
            />
            <circle
              cx="15"
              cy="15"
              r="12"
              fill="none"
              stroke="#2196F3"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 12}
              strokeDashoffset={2 * Math.PI * 12 * (state.beamCooldown / 1.0)}
              style={{
                filter: 'drop-shadow(0 0 4px rgba(33, 150, 243, 0.6))',
              }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 9,
              color: '#2196F3',
              fontWeight: 'bold',
            }}
          >
            {state.beamCooldown > 0 ? state.beamCooldown.toFixed(1) : 'OK'}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        style={{
          position: 'absolute',
          top: 90,
          left: 20,
          width: 150,
          height: 400,
          background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: 8,
          border: '1px solid rgba(255, 215, 0, 0.3)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          color: 'white',
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>得分</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: '#FFD700',
              textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
            }}
          >
            {state.score}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>最高分</div>
          <div style={{ fontSize: 16, color: '#FFA500' }}>{state.highScore}</div>
        </div>

        <div
          style={{
            height: 1,
            background: 'linear-gradient(to right, transparent, rgba(255, 215, 0, 0.5), transparent)',
          }}
        />

        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>部件收集</div>
          <div style={{ fontSize: 14 }}>
            <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{collectedParts}</span>
            <span style={{ color: '#666' }}> / {totalParts}</span>
          </div>
          <div
            style={{
              marginTop: 6,
              height: 6,
              background: '#222',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(to right, #FFD700, #FFA500)',
                borderRadius: 3,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${(collectedParts / totalParts) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div
          style={{
            height: 1,
            background: 'linear-gradient(to right, transparent, rgba(255, 215, 0, 0.5), transparent)',
          }}
        />

        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>难度等级</div>
          <div style={{ fontSize: 14 }}>
            <span style={{ color: '#2196F3', fontWeight: 'bold' }}>
              {state.difficultyMultiplier.toFixed(1)}x
            </span>
          </div>
          <div
            style={{
              marginTop: 6,
              height: 6,
              background: '#222',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(to right, #2196F3, #21CBF3)',
                borderRadius: 3,
              }}
              initial={{ width: '50%' }}
              animate={{ width: `${((state.difficultyMultiplier - 1) / 1) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 200,
          height: 120,
          background: 'rgba(183, 28, 28, 0.9)',
          borderRadius: 8,
          padding: 10,
          color: 'white',
          boxShadow: '0 0 20px rgba(255, 82, 82, 0.3)',
          border: '1px solid rgba(255, 82, 82, 0.5)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 'bold',
            marginBottom: 6,
            paddingBottom: 4,
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: state.warnings.length > 0 ? '#FF5252' : '#666',
              boxShadow: state.warnings.length > 0 ? '0 0 8px #FF5252' : 'none',
            }}
          />
          碰撞预警
        </div>
        {state.warnings.length === 0 ? (
          <div
            style={{
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
            }}
          >
            暂无高危碎片
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              overflow: 'hidden',
              flex: 1,
            }}
          >
            {state.warnings.slice(0, 3).map((warning, index) => (
              <WarningItem key={warning.debrisId} warning={warning} index={index} />
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        style={{
          position: 'absolute',
          bottom: 60,
          right: 20,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'rgba(0, 0, 0, 0.6)',
          border: '2px solid #555',
          overflow: 'hidden',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        <MiniMap state={state} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 40,
          background: 'rgba(34, 34, 34, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 13,
          gap: 30,
        }}
      >
        <span>
          <span style={{ color: '#2196F3', fontWeight: 'bold' }}>WASD</span> 移动飞船
        </span>
        <span>
          <span style={{ color: '#FFD700', fontWeight: 'bold' }}>鼠标左键</span> 牵引光束
        </span>
      </motion.div>

      <AnimatePresence>
        {showGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}
              style={{
                width: 400,
                height: 300,
                background: '#333333',
                borderRadius: 16,
                padding: 32,
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 60px rgba(0, 0, 0, 0.8)',
                border: '1px solid #555',
              }}
            >
              <h2
                style={{
                  fontSize: 28,
                  margin: 0,
                  marginBottom: 20,
                  color: '#FF5252',
                  textShadow: '0 0 20px rgba(255, 82, 82, 0.5)',
                }}
              >
                游戏结束
              </h2>
              <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>最终得分</div>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 'bold',
                  color: '#FFD700',
                  marginBottom: 8,
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                }}
              >
                {state.score}
              </div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>
                最高分: {state.highScore}
              </div>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRestart}
                style={{
                  padding: '12px 40px',
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: 'white',
                  background: '#4CAF50',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
                  transition: 'all 0.2s',
                }}
              >
                重新开始
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const WarningItem: React.FC<{ warning: Warning; index: number }> = ({ warning, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      style={{
        fontSize: 11,
        padding: '4px 6px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 4,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ color: '#FFAB91' }}>#{index + 1} {warning.direction}</span>
      <span style={{ color: '#FFCDD2', fontWeight: 'bold' }}>
        {warning.timeToCollision.toFixed(1)}s
      </span>
    </motion.div>
  );
};

const MiniMap: React.FC<{ state: GameState }> = ({ state }) => {
  const mapSize = 160;
  const scale = mapSize / Math.max(state.canvasWidth, state.canvasHeight);
  const offsetX = (mapSize - state.canvasWidth * scale) / 2;
  const offsetY = (mapSize - state.canvasHeight * scale) / 2;

  return (
    <svg width={mapSize} height={mapSize} viewBox={`0 0 ${mapSize} ${mapSize}`}>
      {state.debrisList.map((debris) => (
        <circle
          key={debris.id}
          cx={offsetX + debris.x * scale}
          cy={offsetY + debris.y * scale}
          r={1.5}
          fill="#FF5252"
        />
      ))}
      {state.satelliteParts
        .filter((p) => !p.collected)
        .map((part) => (
          <circle
            key={part.id}
            cx={offsetX + part.x * scale}
            cy={offsetY + part.y * scale}
            r={2}
            fill="#FFD700"
          />
        ))}
      <polygon
        points={`
          ${offsetX + state.ship.x * scale + 4},${offsetY + state.ship.y * scale}
          ${offsetX + state.ship.x * scale - 3},${offsetY + state.ship.y * scale - 3}
          ${offsetX + state.ship.x * scale - 3},${offsetY + state.ship.y * scale + 3}
        `}
        fill="#4CAF50"
      />
    </svg>
  );
};
