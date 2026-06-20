import React, { useEffect, useRef, useState, useCallback } from 'react';
import { create } from 'zustand';
import { EventBus } from '../EventBus';
import { GameLogic, PlayerState, Position, ItemType, InventoryItem } from '../GameLogic';
import { EventEngine } from '../EventEngine';

interface LogEntry {
  id: number;
  message: string;
  type: 'info' | 'danger' | 'success' | 'story' | 'puzzle' | 'merchant';
  name?: string;
}

interface ChoiceModal {
  title: string;
  message: string;
  choices: string[];
}

interface GameState {
  player: PlayerState | null;
  logs: LogEntry[];
  logIdCounter: number;
  choiceModal: ChoiceModal | null;
  gameOver: boolean;
  won: boolean;
  stats: { steps: number; coins: number; events: number; keysCollected: number } | null;
  animatingPosition: Position | null;
  showItemDetail: ItemType | null;
  setPlayer: (p: PlayerState) => void;
  addLog: (msg: string, type: LogEntry['type'], name?: string) => void;
  setChoiceModal: (m: ChoiceModal | null) => void;
  setGameOver: (v: boolean) => void;
  setWon: (v: boolean, stats: NonNullable<GameState['stats']>) => void;
  setAnimatingPosition: (p: Position | null) => void;
  setShowItemDetail: (t: ItemType | null) => void;
}

const useGameStore = create<GameState>((set, get) => ({
  player: null,
  logs: [],
  logIdCounter: 0,
  choiceModal: null,
  gameOver: false,
  won: false,
  stats: null,
  animatingPosition: null,
  showItemDetail: null,
  setPlayer: (p) => set({ player: p }),
  addLog: (msg, type, name) => set((s) => ({
    logs: [...s.logs.slice(-4), { id: s.logIdCounter, message: msg, type, name }],
    logIdCounter: s.logIdCounter + 1,
  })),
  setChoiceModal: (m) => set({ choiceModal: m }),
  setGameOver: (v) => set({ gameOver: v }),
  setWon: (v, stats) => set({ won: v, stats }),
  setAnimatingPosition: (p) => set({ animatingPosition: p }),
  setShowItemDetail: (t) => set({ showItemDetail: t }),
}));

const gameLogicRef: { current: GameLogic | null } = { current: null };

const CELL_SIZE = 30;
const MAZE_SIZE = 30;
const CANVAS_SIZE = MAZE_SIZE * CELL_SIZE;

const WALL_COLOR = '#3C3C3C';
const FLOOR_COLOR = '#E8D5B7';
const EXPLORED_FLOOR = '#C4B49A';
const EXIT_GLOW = '#FFD700';
const PATH_COLOR = 'rgba(78, 205, 196, 0.3)';

function drawMaze(
  ctx: CanvasRenderingContext2D,
  grid: GameLogic['maze']['grid'],
  explored: Set<string>,
  playerPos: Position,
  exitPos: Position,
  pathToExit: Position[],
  keysNeeded: number,
  keysHave: number,
  animOffset: Position | null,
  pulsePhase: number,
) {
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  for (let y = 0; y < MAZE_SIZE; y++) {
    for (let x = 0; x < MAZE_SIZE; x++) {
      const key = `${x},${y}`;
      const isExplored = explored.has(key);
      const px = x * CELL_SIZE;
      const py = y * CELL_SIZE;

      if (!isExplored) {
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
        continue;
      }

      const cell = grid[y][x];
      ctx.fillStyle = FLOOR_COLOR;
      ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

      if (cell.walls.top) {
        ctx.fillStyle = WALL_COLOR;
        ctx.fillRect(px, py, CELL_SIZE, 2);
      }
      if (cell.walls.right) {
        ctx.fillStyle = WALL_COLOR;
        ctx.fillRect(px + CELL_SIZE - 2, py, 2, CELL_SIZE);
      }
      if (cell.walls.bottom) {
        ctx.fillStyle = WALL_COLOR;
        ctx.fillRect(px, py + CELL_SIZE - 2, CELL_SIZE, 2);
      }
      if (cell.walls.left) {
        ctx.fillStyle = WALL_COLOR;
        ctx.fillRect(px, py, 2, CELL_SIZE);
      }

      if (x === exitPos.x && y === exitPos.y) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
        const glowIntensity = 0.3 + 0.2 * Math.sin(pulsePhase * 2);
        ctx.strokeStyle = keysHave >= keysNeeded
          ? `rgba(255, 215, 0, ${glowIntensity + 0.4})`
          : `rgba(255, 100, 100, ${glowIntensity})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      }
    }
  }

  if (pathToExit.length > 1) {
    ctx.fillStyle = PATH_COLOR;
    for (const p of pathToExit) {
      const ppx = p.x * CELL_SIZE + 4;
      const ppy = p.y * CELL_SIZE + 4;
      ctx.fillRect(ppx, ppy, CELL_SIZE - 8, CELL_SIZE - 8);
    }
  }

  const drawPx = animOffset ? animOffset.x * CELL_SIZE + CELL_SIZE / 2 : playerPos.x * CELL_SIZE + CELL_SIZE / 2;
  const drawPy = animOffset ? animOffset.y * CELL_SIZE + CELL_SIZE / 2 : playerPos.y * CELL_SIZE + CELL_SIZE / 2;

  const pulseRadius = 6 + 3 * Math.sin(pulsePhase * 3);
  const gradient = ctx.createRadialGradient(drawPx, drawPy, 0, drawPx, drawPy, pulseRadius + 8);
  gradient.addColorStop(0, 'rgba(100, 180, 255, 0.8)');
  gradient.addColorStop(0.5, 'rgba(100, 180, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(drawPx, drawPy, pulseRadius + 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#64B4FF';
  ctx.beginPath();
  ctx.arc(drawPx, drawPy, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = '#64B4FF';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#A0D4FF';
  ctx.beginPath();
  ctx.arc(drawPx, drawPy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

const ITEM_ORDER: ItemType[] = ['key', 'potion', 'torch', 'map', 'shield', 'coin'];

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const pulseRef = useRef<number>(0);
  const animatingFromRef = useRef<Position | null>(null);
  const animatingToRef = useRef<Position | null>(null);
  const animProgressRef = useRef<number>(1);
  const eventEngineRef = useRef<EventEngine | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[]>([]);

  const {
    player, logs, choiceModal, gameOver, won, stats,
    animatingPosition, showItemDetail,
    setPlayer, addLog, setChoiceModal, setGameOver, setWon,
    setAnimatingPosition, setShowItemDetail,
  } = useGameStore();

  useEffect(() => {
    const game = new GameLogic();
    gameLogicRef.current = game;
    const engine = new EventEngine(game);
    eventEngineRef.current = engine;
    setPlayer(game.getPlayerInfo());
    addLog('你进入了古老的迷宫，寻找三把钥匙以打开出口...', 'info');

    const unsubState = EventBus.on<PlayerState>('player:stateChanged', (p) => {
      setPlayer(p);
    });

    const unsubMoved = EventBus.on<{ from: Position; to: Position }>('player:moved', (data) => {
      animatingFromRef.current = data.from;
      animatingToRef.current = data.to;
      animProgressRef.current = 0;
    });

    const unsubEvent = EventBus.on<{ message: string; type: LogEntry['type']; name?: string }>('event:triggered', (data) => {
      addLog(data.message, data.type, data.name);
    });

    const unsubAction = EventBus.on<{ message: string; type?: string }>('event:action', (data) => {
      addLog(data.message, 'info');
    });

    const unsubItem = EventBus.on<{ item: string; message: string }>('event:itemFound', (data) => {
      addLog(data.message, 'success');
    });

    const unsubChoices = EventBus.on<{ title: string; message: string; choices: string[] }>('event:showChoices', (data) => {
      setChoiceModal(data);
    });

    const unsubOutcome = EventBus.on<{ message: string; type: string }>('event:outcome', (data) => {
      addLog(data.message, 'info');
    });

    const unsubDied = EventBus.on('player:died', () => {
      setGameOver(true);
      addLog('你倒在了迷宫的黑暗中...', 'danger');
    });

    const unsubWon = EventBus.on<{ steps: number; coins: number; events: number; keysCollected: number }>('player:won', (s) => {
      setWon(true, s);
      addLog('你成功逃出了迷宫！', 'success');
    });

    return () => {
      unsubState();
      unsubMoved();
      unsubEvent();
      unsubAction();
      unsubItem();
      unsubChoices();
      unsubOutcome();
      unsubDied();
      unsubWon();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameLogicRef.current) return;
      const game = gameLogicRef.current;
      if (gameOver || won || choiceModal) return;

      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          e.preventDefault(); game.move(0, -1); break;
        case 'ArrowDown': case 's': case 'S':
          e.preventDefault(); game.move(0, 1); break;
        case 'ArrowLeft': case 'a': case 'A':
          e.preventDefault(); game.move(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D':
          e.preventDefault(); game.move(1, 0); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, won, choiceModal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameLogicRef.current) return;
    const ctx = canvas.getContext('2d')!;
    const game = gameLogicRef.current;

    const render = () => {
      pulseRef.current += 0.02;

      if (animProgressRef.current < 1 && animatingFromRef.current && animatingToRef.current) {
        animProgressRef.current = Math.min(1, animProgressRef.current + 0.05);
      }

      const currentPos = game.player.position;
      let drawOffset: Position | null = null;

      if (animProgressRef.current < 1 && animatingFromRef.current && animatingToRef.current) {
        const t = easeOutCubic(animProgressRef.current);
        drawOffset = {
          x: animatingFromRef.current.x + (animatingToRef.current.x - animatingFromRef.current.x) * t,
          y: animatingFromRef.current.y + (animatingToRef.current.y - animatingFromRef.current.y) * t,
        };
      }

      drawMaze(
        ctx, game.maze.grid, game.player.explored,
        currentPos, game.maze.exit, game.player.pathToExit,
        3, game.player.inventory.key.quantity,
        drawOffset, pulseRef.current,
      );

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [player]);

  useEffect(() => {
    if (!won || !particleCanvasRef.current) return;
    const canvas = particleCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = 800;
    canvas.height = 800;

    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#FF9FF3'];
    for (let i = 0; i < 100; i++) {
      particlesRef.current.push({
        x: 400,
        y: 400,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 3,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2,
      });
    }

    const animateParticles = () => {
      ctx.clearRect(0, 0, 800, 800);
      let alive = false;
      for (const p of particlesRef.current) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life -= 0.008;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (alive) requestAnimationFrame(animateParticles);
    };
    animateParticles();
  }, [won]);

  const handleChoice = useCallback((index: number) => {
    setChoiceModal(null);
    EventBus.emit('event:choiceMade', { choiceIndex: index });
  }, [setChoiceModal]);

  const handleReset = useCallback(() => {
    if (!gameLogicRef.current) return;
    gameLogicRef.current.reset();
    EventBus.emit('game:reset', {});
    setGameOver(false);
    setWon(false, { steps: 0, coins: 0, events: 0, keysCollected: 0 });
    setChoiceModal(null);
    setShowItemDetail(null);
    useGameStore.setState({ logs: [], logIdCounter: 0 });
    addLog('你重新踏入了迷宫...', 'info');
  }, [setGameOver, setWon, setChoiceModal, setShowItemDetail, addLog]);

  const handleUseItem = useCallback((type: ItemType) => {
    if (!gameLogicRef.current || gameOver || won) return;
    gameLogicRef.current.useItem(type);
    setShowItemDetail(null);
  }, [gameOver, won, setShowItemDetail]);

  const hpPercent = player ? (player.hp / player.maxHp) * 100 : 100;
  const staminaPercent = player ? (player.stamina / player.maxStamina) * 100 : 100;
  const hpLow = hpPercent < 20;

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      gap: '16px', padding: '20px', minHeight: '100vh',
      background: 'linear-gradient(135deg, #1E1B18 0%, #2A2520 50%, #1E1B18 100%)',
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: '#E8D5B7',
    }}>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{
            border: '3px solid #4A3728',
            borderRadius: '8px',
            maxWidth: '800px',
            maxHeight: '800px',
            boxShadow: '0 0 30px rgba(0,0,0,0.5)',
          }}
        />
        {won && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #1A1A2E, #2E5984)',
            borderRadius: '8px', zIndex: 10,
            animation: 'fadeIn 1s ease',
          }}>
            <canvas ref={particleCanvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />
            <div style={{ zIndex: 2, textAlign: 'center' }}>
              <h1 style={{ fontSize: '48px', color: '#FFD700', textShadow: '0 0 20px rgba(255,215,0,0.5)', marginBottom: '20px' }}>
                🏰 逃出迷宫！
              </h1>
              {stats && (
                <div style={{ fontSize: '18px', lineHeight: '2', color: '#E8D5B7' }}>
                  <div>👣 总步数：{stats.steps}</div>
                  <div>🪙 金币数：{stats.coins}</div>
                  <div>⚡ 遭遇事件：{stats.events}</div>
                  <div>🔑 收集钥匙：{stats.keysCollected}</div>
                </div>
              )}
              <button onClick={handleReset} style={{
                marginTop: '24px', padding: '12px 32px', fontSize: '18px',
                background: 'linear-gradient(135deg, #4A3728, #6B4F3A)', color: '#E8D5B7',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                transition: 'all 0.3s', fontFamily: 'inherit',
              }}>
                再来一次
              </button>
            </div>
          </div>
        )}
        {gameOver && !won && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.85)',
            borderRadius: '8px', zIndex: 10,
            animation: 'fadeIn 1s ease',
          }}>
            <h1 style={{ fontSize: '42px', color: '#FF4444', textShadow: '0 0 20px rgba(255,0,0,0.3)', marginBottom: '16px' }}>
              💀 你已倒下
            </h1>
            <p style={{ fontSize: '18px', marginBottom: '24px', color: '#999' }}>
              迷宫的黑暗吞噬了你...
            </p>
            <button onClick={handleReset} style={{
              padding: '12px 32px', fontSize: '18px',
              background: 'linear-gradient(135deg, #4A3728, #6B4F3A)', color: '#E8D5B7',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              transition: 'all 0.3s', fontFamily: 'inherit',
            }}>
              重新开始
            </button>
          </div>
        )}
      </div>

      <div style={{
        width: '240px', display: 'flex', flexDirection: 'column', gap: '12px',
        paddingTop: '4px',
      }}>
        <div style={{
          background: '#2A2520CC', borderRadius: '8px', padding: '16px',
          border: '1px solid #4A372866',
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#E8D5B7', borderBottom: '1px solid #4A372866', paddingBottom: '8px' }}>
            ⚔️ 冒险者状态
          </h3>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
              <span>❤️ 生命</span>
              <span>{player?.hp ?? 0}/{player?.maxHp ?? 100}</span>
            </div>
            <div style={{
              width: '100%', height: '14px', background: '#1A1A1A', borderRadius: '7px', overflow: 'hidden',
              border: '1px solid #4A372866',
            }}>
              <div style={{
                width: `${hpPercent}%`, height: '100%',
                background: `linear-gradient(90deg, #FF4444, ${hpPercent > 50 ? '#44FF44' : hpPercent > 25 ? '#FFAA44' : '#FF4444'})`,
                borderRadius: '7px',
                transition: 'width 0.3s ease',
                animation: hpLow ? 'hpBlink 0.5s infinite' : 'none',
              }} />
            </div>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
              <span>⚡ 体力</span>
              <span>{player?.stamina ?? 0}/{player?.maxStamina ?? 100}</span>
            </div>
            <div style={{
              width: '100%', height: '14px', background: '#1A1A1A', borderRadius: '7px', overflow: 'hidden',
              border: '1px solid #4A372866',
            }}>
              <div style={{
                width: `${staminaPercent}%`, height: '100%',
                background: 'linear-gradient(90deg, #45B7D1, #4ECDC4)',
                borderRadius: '7px',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#B8A88A' }}>
            <div>🔑 钥匙：{player?.inventory.key.quantity ?? 0}/3</div>
            <div>🪙 金币：{player?.inventory.coin.quantity ?? 0}</div>
            <div>👣 步数：{player?.steps ?? 0}</div>
            <div>📍 位置：({player?.position.x ?? 0}, {player?.position.y ?? 0})</div>
          </div>
          {player?.shieldActive && <div style={{ fontSize: '12px', color: '#4ECDC4', marginTop: '4px' }}>🛡️ 护盾生效中</div>}
          {player?.torchActive && <div style={{ fontSize: '12px', color: '#FF9F43', marginTop: '4px' }}>🔥 火把照明中</div>}
          {player?.mapActive && <div style={{ fontSize: '12px', color: '#45B7D1', marginTop: '4px' }}>🗺️ 地图路径标记中</div>}
        </div>

        <div style={{
          background: '#2A2520CC', borderRadius: '8px', padding: '16px',
          border: '1px solid #4A372866',
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#E8D5B7', borderBottom: '1px solid #4A372866', paddingBottom: '8px' }}>
            🎒 道具背包
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {player && ITEM_ORDER.map((type) => {
              const item = player.inventory[type];
              return (
                <div
                  key={type}
                  onClick={() => setShowItemDetail(showItemDetail === type ? null : type)}
                  style={{
                    width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: item.quantity > 0 ? '#3A3025' : '#1A1A1A',
                    borderRadius: '4px', cursor: 'pointer', fontSize: '20px',
                    border: `1px solid ${item.quantity > 0 ? '#6B4F3A66' : '#333'}`,
                    transition: 'all 0.3s',
                    position: 'relative',
                    transform: showItemDetail === type ? 'scale(1.1)' : 'scale(1)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = showItemDetail === type ? 'scale(1.1)' : 'scale(1)'; }}
                >
                  {item.icon}
                  {item.quantity > 0 && (
                    <span style={{
                      position: 'absolute', bottom: '-2px', right: '-2px',
                      fontSize: '10px', background: '#4A3728', color: '#E8D5B7',
                      borderRadius: '4px', padding: '0 3px', lineHeight: '14px',
                    }}>
                      {item.quantity}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {showItemDetail && player && (
            <div style={{
              marginTop: '8px', padding: '8px', background: '#1A1A1A', borderRadius: '6px',
              fontSize: '12px', lineHeight: '1.6',
              animation: 'fadeIn 0.2s ease',
            }}>
              <div style={{ color: '#E8D5B7', fontWeight: 'bold' }}>{player.inventory[showItemDetail].icon} {player.inventory[showItemDetail].name}</div>
              <div style={{ color: '#B8A88A' }}>{player.inventory[showItemDetail].description}</div>
              <div style={{ color: '#B8A88A' }}>数量：{player.inventory[showItemDetail].quantity}</div>
              {['potion', 'torch', 'map', 'shield'].includes(showItemDetail) && player.inventory[showItemDetail].quantity > 0 && (
                <button
                  onClick={() => handleUseItem(showItemDetail)}
                  style={{
                    marginTop: '6px', padding: '4px 12px', fontSize: '12px',
                    background: 'linear-gradient(135deg, #4A3728, #6B4F3A)', color: '#E8D5B7',
                    border: 'none', borderRadius: '4px', cursor: 'pointer',
                    transition: 'all 0.3s', fontFamily: 'inherit',
                  }}
                >
                  使用
                </button>
              )}
            </div>
          )}
        </div>

        <div style={{
          background: '#2A2520CC', borderRadius: '8px', padding: '16px',
          border: '1px solid #4A372866', flex: 1,
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#E8D5B7', borderBottom: '1px solid #4A372866', paddingBottom: '8px' }}>
            📜 事件日志
          </h3>
          <div style={{
            height: '120px', overflowY: 'auto', paddingRight: '4px',
            scrollbarWidth: 'thin', scrollbarColor: '#4A3728 #1A1A1A',
          }} className="custom-scroll">
            {logs.map((log, i) => (
              <div key={log.id} style={{
                fontSize: '12px', lineHeight: '1.5', marginBottom: '6px',
                padding: '4px 6px', borderRadius: '4px',
                background: log.type === 'danger' ? 'rgba(255,68,68,0.1)' :
                  log.type === 'success' ? 'rgba(68,255,68,0.1)' :
                  log.type === 'story' ? 'rgba(78,205,196,0.1)' :
                  log.type === 'puzzle' ? 'rgba(255,165,0,0.1)' :
                  log.type === 'merchant' ? 'rgba(255,215,0,0.1)' : 'rgba(232,213,183,0.05)',
                color: log.type === 'danger' ? '#FF6B6B' :
                  log.type === 'success' ? '#96E6A1' :
                  log.type === 'story' ? '#4ECDC4' :
                  log.type === 'puzzle' ? '#FFA500' :
                  log.type === 'merchant' ? '#FFD700' : '#B8A88A',
                borderLeft: `2px solid ${
                  log.type === 'danger' ? '#FF4444' :
                  log.type === 'success' ? '#44FF44' :
                  log.type === 'story' ? '#4ECDC4' :
                  log.type === 'puzzle' ? '#FFA500' :
                  log.type === 'merchant' ? '#FFD700' : '#4A3728'
                }`,
                animation: 'fadeIn 0.3s ease',
              }}>
                {log.message}
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#6B5B4A', textAlign: 'center', marginTop: '4px' }}>
          方向键/WASD 移动 | 收集3把🔑打开出口
        </div>
      </div>

      {choiceModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, animation: 'fadeIn 0.3s ease',
        }} onClick={(e) => { if (e.target === e.currentTarget) setChoiceModal(null); }}>
          <div style={{
            width: '400px', background: '#2C2F33', borderRadius: '12px', padding: '24px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            animation: 'modalIn 0.3s ease',
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#E8D5B7', fontSize: '20px' }}>
              {choiceModal.title}
            </h3>
            <p style={{ color: '#B8A88A', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
              {choiceModal.message}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {choiceModal.choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => handleChoice(i)}
                  style={{
                    padding: '10px 16px', fontSize: '14px',
                    background: 'linear-gradient(135deg, #4A3728, #6B4F3A)', color: '#E8D5B7',
                    border: '1px solid #6B4F3A44', borderRadius: '8px', cursor: 'pointer',
                    transition: 'all 0.3s', fontFamily: 'inherit', textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #6B4F3A, #8B6F5A)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #4A3728, #6B4F3A)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes hpBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: #1A1A1A;
          border-radius: 3px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #4A3728;
          border-radius: 3px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #6B4F3A;
        }
        button:hover {
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default App;
