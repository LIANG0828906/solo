import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameEngine, Direction, Item, Trap, ItemType } from './gameEngine';
import { MazeGrid, MazePosition } from './mazeGenerator';
import { FaHeart, FaShieldAlt, FaGem, FaKey, FaFlask } from 'react-icons/fa';

interface PickupToast {
  id: string;
  message: string;
  x: number;
  y: number;
}

const CELL_SIZE = 40;
const MAZE_SIZE = 8;

export default function App() {
  const [maze, setMaze] = useState<MazeGrid>([]);
  const [playerPosition, setPlayerPosition] = useState<MazePosition>({ row: 0, col: 0 });
  const [exitPosition, setExitPosition] = useState<MazePosition>({ row: 7, col: 7 });
  const [health, setHealth] = useState(3);
  const [maxHealth, setMaxHealth] = useState(3);
  const [score, setScore] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [traps, setTraps] = useState<Trap[]>([]);
  const [hasShield, setHasShield] = useState(false);
  const [inventory, setInventory] = useState<ItemType[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [showCollision, setShowCollision] = useState(false);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [pickupToasts, setPickupToasts] = useState<PickupToast[]>([]);
  const [cellSize, setCellSize] = useState(CELL_SIZE);

  const engineRef = useRef<GameEngine | null>(null);
  const toastIdRef = useRef(0);

  const updateState = useCallback(() => {
    if (!engineRef.current) return;
    const state = engineRef.current.getState();
    setMaze(state.maze);
    setPlayerPosition(state.playerPosition);
    setExitPosition(state.exitPosition);
    setHealth(state.health);
    setMaxHealth(state.maxHealth);
    setScore(state.score);
    setItems(state.items);
    setTraps(state.traps);
    setHasShield(state.hasShield);
    setInventory(state.inventory);
    setGameOver(state.gameOver);
    setGameWon(state.gameWon);
  }, []);

  useEffect(() => {
    engineRef.current = new GameEngine({
      onMove: () => updateState(),
      onCollision: () => {
        setShowCollision(true);
        setTimeout(() => setShowCollision(false), 200);
      },
      onItemPickup: (item) => {
        updateState();
        const messages: Record<ItemType, string> = {
          potion: '生命恢复 +1',
          key: '获得护盾',
          gem: '分数 +10'
        };
        const toast: PickupToast = {
          id: `toast-${toastIdRef.current++}`,
          message: messages[item.type],
          x: item.position.col,
          y: item.position.row
        };
        setPickupToasts(prev => [...prev, toast]);
        setTimeout(() => {
          setPickupToasts(prev => prev.filter(t => t.id !== toast.id));
        }, 500);
      },
      onTrapTrigger: (_trap, blocked) => {
        updateState();
        if (!blocked) {
          setShakeScreen(true);
          setTimeout(() => setShakeScreen(false), 100);
        }
      },
      onHealthChange: () => updateState(),
      onScoreChange: () => updateState(),
      onShieldChange: () => updateState(),
      onGameOver: () => updateState(),
      onGameWon: () => updateState(),
      onReset: () => {
        updateState();
        setPickupToasts([]);
        setShowCollision(false);
        setShakeScreen(false);
      }
    });
    updateState();
  }, [updateState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current || gameOver || gameWon) return;

      let direction: Direction | null = null;
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          direction = 'up';
          break;
        case 's':
        case 'arrowdown':
          direction = 'down';
          break;
        case 'a':
        case 'arrowleft':
          direction = 'left';
          break;
        case 'd':
        case 'arrowright':
          direction = 'right';
          break;
      }

      if (direction) {
        e.preventDefault();
        engineRef.current.move(direction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, gameWon]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setCellSize(30);
      } else if (width < 768) {
        setCellSize(35);
      } else {
        setCellSize(CELL_SIZE);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleReset = () => {
    engineRef.current?.reset();
  };

  const getItemIcon = (type: ItemType, size: number = 20) => {
    const iconProps = { size, style: { verticalAlign: 'middle' } };
    switch (type) {
      case 'potion':
        return <FaFlask {...iconProps} color="#E53935" />;
      case 'key':
        return <FaKey {...iconProps} color="#1E88E5" />;
      case 'gem':
        return <FaGem {...iconProps} color="#43A047" />;
    }
  };

  const isExit = (row: number, col: number) =>
    row === exitPosition.row && col === exitPosition.col;

  const getItemAt = (row: number, col: number) =>
    items.find(i => !i.collected && i.position.row === row && i.position.col === col);

  const getTrapAt = (row: number, col: number) =>
    traps.find(t => !t.triggered && t.position.row === row && t.position.col === col);

  return (
    <div className="app-container">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #1a1a2e;
          color: #e0e0e0;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .app-container {
          min-height: 100vh;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .game-header {
          width: 100%;
          max-width: 900px;
          margin-bottom: 20px;
        }

        .game-title {
          font-size: 2rem;
          font-weight: bold;
          color: #e94560;
          text-align: center;
          margin-bottom: 15px;
          text-shadow: 0 0 10px rgba(233, 69, 96, 0.3);
        }

        .reset-btn {
          display: block;
          margin: 0 auto;
          padding: 10px 24px;
          background: #e94560;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(233, 69, 96, 0.4);
        }

        .reset-btn:hover {
          background: #ff6b8a;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(233, 69, 96, 0.6);
        }

        .reset-btn:active {
          transform: translateY(0);
        }

        .game-layout {
          display: grid;
          grid-template-columns: auto auto;
          gap: 30px;
          align-items: start;
          justify-content: center;
          width: 100%;
          max-width: 900px;
        }

        .maze-wrapper {
          position: relative;
          transition: transform 0.1s ease;
        }

        .maze-wrapper.shake {
          animation: shake 0.1s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-3px, 3px); }
          50% { transform: translate(3px, -3px); }
          75% { transform: translate(-3px, -3px); }
        }

        .maze-grid {
          display: grid;
          grid-template-columns: repeat(${MAZE_SIZE}, ${cellSize}px);
          grid-template-rows: repeat(${MAZE_SIZE}, ${cellSize}px);
          gap: 1px;
          background: #0f3460;
          padding: 2px;
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          border: 2px solid #16213e;
        }

        .cell {
          width: ${cellSize}px;
          height: ${cellSize}px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: background-color 0.1s ease;
        }

        .cell.floor {
          background: #d9d9d9;
        }

        .cell.wall {
          background: #444444;
        }

        .cell.exit {
          animation: exitPulse 0.5s ease-in-out infinite alternate;
        }

        @keyframes exitPulse {
          from {
            background: #FFD700;
            box-shadow: 0 0 5px #FFD700, inset 0 0 5px rgba(255, 255, 255, 0.3);
          }
          to {
            background: #FFA500;
            box-shadow: 0 0 15px #FFD700, inset 0 0 10px rgba(255, 255, 255, 0.5);
          }
        }

        .cell.collision {
          animation: collisionFlash 0.2s ease;
        }

        @keyframes collisionFlash {
          0%, 100% { background: #d9d9d9; }
          50% { background: #E53935; }
        }

        .player {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #4FC3F7;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(79, 195, 247, 0.8);
          transition: left 0.15s ease, top 0.15s ease;
          z-index: 10;
        }

        .player.shield {
          box-shadow: 0 0 15px rgba(30, 136, 229, 0.8), 0 0 20px rgba(30, 136, 229, 0.4);
        }

        .item {
          position: absolute;
          z-index: 5;
          animation: itemFloat 1s ease-in-out infinite alternate;
        }

        @keyframes itemFloat {
          from { transform: translateY(0); }
          to { transform: translateY(-3px); }
        }

        .trap {
          position: absolute;
          width: 0;
          height: 0;
          border-left: ${cellSize * 0.25}px solid transparent;
          border-right: ${cellSize * 0.25}px solid transparent;
          border-bottom: ${cellSize * 0.45}px solid #7B1FA2;
          z-index: 5;
          filter: drop-shadow(0 0 5px rgba(123, 31, 162, 0.6));
        }

        .pickup-toast {
          position: absolute;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
          pointer-events: none;
          z-index: 20;
          animation: toastFade 0.5s ease-out forwards;
        }

        @keyframes toastFade {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-20px);
          }
        }

        .status-panel {
          background: #16213e;
          padding: 20px;
          border-radius: 12px;
          min-width: 180px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          border: 1px solid #0f3460;
        }

        .status-section {
          margin-bottom: 20px;
        }

        .status-section:last-child {
          margin-bottom: 0;
        }

        .status-label {
          font-size: 0.85rem;
          color: #a0a0a0;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .health-display {
          display: flex;
          gap: 5px;
          align-items: center;
        }

        .heart-icon {
          color: #E53935;
          transition: all 0.3s ease;
        }

        .heart-icon.empty {
          color: #3a3a3a;
        }

        .score-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #e94560;
        }

        .shield-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(30, 136, 229, 0.2);
          border-radius: 8px;
          border: 1px solid rgba(30, 136, 229, 0.3);
        }

        .shield-status.inactive {
          background: rgba(100, 100, 100, 0.1);
          border-color: rgba(100, 100, 100, 0.2);
          opacity: 0.5;
        }

        .shield-status span {
          font-size: 0.9rem;
        }

        .inventory-display {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          min-height: 30px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }

        .inventory-slot {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-card {
          background: #0f3460;
          padding: 30px;
          border-radius: 16px;
          width: 300px;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
          border: 1px solid #16213e;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .modal-title.win {
          color: #4CAF50;
        }

        .modal-title.lose {
          color: #E53935;
        }

        .modal-message {
          color: #a0a0a0;
          margin-bottom: 20px;
        }

        .modal-score {
          font-size: 2rem;
          font-weight: bold;
          color: #e94560;
          margin-bottom: 20px;
        }

        .modal-btn {
          padding: 12px 30px;
          background: #e94560;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .modal-btn:hover {
          background: #ff6b8a;
          transform: translateY(-2px);
        }

        .controls-hint {
          margin-top: 15px;
          text-align: center;
          color: #666;
          font-size: 0.85rem;
        }

        @media (max-width: 768px) {
          .game-layout {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .status-panel {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            min-width: auto;
          }

          .status-section {
            margin-bottom: 0;
          }

          .maze-wrapper {
            display: flex;
            justify-content: center;
          }

          .game-title {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .app-container {
            padding: 10px;
          }

          .status-panel {
            grid-template-columns: 1fr;
          }

          .modal-card {
            width: 90%;
            max-width: 300px;
          }
        }
      `}</style>

      <div className="game-header">
        <h1 className="game-title">迷宫探险</h1>
        <button className="reset-btn" onClick={handleReset}>
          重新生成迷宫
        </button>
      </div>

      <div className="game-layout">
        <div className={`maze-wrapper ${shakeScreen ? 'shake' : ''}`}>
          <div
            className="maze-grid"
            style={{
              gridTemplateColumns: `repeat(${MAZE_SIZE}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${MAZE_SIZE}, ${cellSize}px)`
            }}
          >
            {maze.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isExitCell = isExit(rowIndex, colIndex);
                const item = getItemAt(rowIndex, colIndex);
                const trap = getTrapAt(rowIndex, colIndex);

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`cell ${cell} ${isExitCell ? 'exit' : ''} ${
                      showCollision && cell === 'wall' ? 'collision' : ''
                    }`}
                    style={{ width: cellSize, height: cellSize }}
                  >
                    {isExitCell && (
                      <span style={{ fontSize: cellSize * 0.5 }}>🚪</span>
                    )}
                    {item && (
                      <div className="item">
                        {getItemIcon(item.type, cellSize * 0.5)}
                      </div>
                    )}
                    {trap && (
                      <div
                        className="trap"
                        style={{
                          borderLeftWidth: cellSize * 0.25,
                          borderRightWidth: cellSize * 0.25,
                          borderBottomWidth: cellSize * 0.45
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div
            className={`player ${hasShield ? 'shield' : ''}`}
            style={{
              width: cellSize * 0.5,
              height: cellSize * 0.5,
              left: playerPosition.col * cellSize + cellSize * 0.25 + 2,
              top: playerPosition.row * cellSize + cellSize * 0.25 + 2
            }}
          />

          {pickupToasts.map(toast => (
            <div
              key={toast.id}
              className="pickup-toast"
              style={{
                left: toast.x * cellSize + cellSize * 0.3 + 2,
                top: toast.y * cellSize + 2,
                fontSize: Math.max(10, cellSize * 0.3)
              }}
            >
              {toast.message}
            </div>
          ))}
        </div>

        <div className="status-panel">
          <div className="status-section">
            <div className="status-label">生命值</div>
            <div className="health-display">
              {Array.from({ length: maxHealth }).map((_, i) => (
                <FaHeart
                  key={i}
                  size={24}
                  className={`heart-icon ${i >= health ? 'empty' : ''}`}
                />
              ))}
            </div>
          </div>

          <div className="status-section">
            <div className="status-label">分数</div>
            <div className="score-value">{score}</div>
          </div>

          <div className="status-section">
            <div className="status-label">护盾</div>
            <div className={`shield-status ${hasShield ? '' : 'inactive'}`}>
              <FaShieldAlt color={hasShield ? '#1E88E5' : '#666'} size={20} />
              <span>{hasShield ? '已激活' : '未激活'}</span>
            </div>
          </div>

          <div className="status-section">
            <div className="status-label">道具栏</div>
            <div className="inventory-display">
              {inventory.length === 0 ? (
                <span style={{ color: '#666', fontSize: '0.8rem' }}>暂无道具</span>
              ) : (
                inventory.map((itemType, index) => (
                  <div key={index} className="inventory-slot">
                    {getItemIcon(itemType, 16)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="controls-hint">
        使用 WASD 或 方向键 移动角色 | 目标：到达右下角出口 🚪
      </div>

      {(gameOver || gameWon) && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 className={`modal-title ${gameWon ? 'win' : 'lose'}`}>
              {gameWon ? '🎉 恭喜通关！' : '💀 游戏结束'}
            </h2>
            <p className="modal-message">
              {gameWon
                ? '你成功找到了出口！'
                : '你在迷宫中迷失了...'}
            </p>
            <div className="modal-score">得分: {score}</div>
            <button className="modal-btn" onClick={handleReset}>
              再来一局
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
