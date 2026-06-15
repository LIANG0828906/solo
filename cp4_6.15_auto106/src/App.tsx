import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { generateDungeon, getWalkablePositions } from './dungeonGenerator';
import {
  createPlayer,
  createMonster,
  isWalkable,
  isPositionOccupied,
  isAdjacent,
  findAdjacentMonster,
  playerAttack,
  useSkill,
  processMonsterTurn,
  decrementSkillCooldowns,
  createLogEntry,
} from './combatSystem';
import {
  DungeonMap,
  Player,
  Monster,
  LogEntry,
  HistoryRecord,
  GeneratorParams,
  TileType,
  Skill,
} from './types';

const ANIMATION_DURATION = 250;
const TILE_SIZE = 32;
const MAX_LOG_ENTRIES = 100;

type Direction = 'up' | 'down' | 'left' | 'right';

interface AnimatedPosition {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startTime: number;
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const [mapWidth, setMapWidth] = useState(15);
  const [mapHeight, setMapHeight] = useState(15);
  const [roomCount, setRoomCount] = useState(5);
  const [monsterCount, setMonsterCount] = useState(4);

  const [dungeonMap, setDungeonMap] = useState<DungeonMap | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

  const playerAnimRef = useRef<AnimatedPosition | null>(null);
  const monsterAnimsRef = useRef<Map<string, AnimatedPosition>>(new Map());
  const frameTimeRef = useRef<number>(0);

  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => {
      const updated = [...prev, entry];
      if (updated.length > MAX_LOG_ENTRIES) {
        return updated.slice(updated.length - MAX_LOG_ENTRIES);
      }
      return updated;
    });
  }, []);

  const initializeGame = useCallback((params: GeneratorParams, saveHistory: boolean = true) => {
    const map = generateDungeon(params);
    setDungeonMap(map);

    const walkable = getWalkablePositions(map);
    if (walkable.length === 0) return;

    const shuffled = [...walkable].sort(() => Math.random() - 0.5);
    const playerPos = shuffled[0];
    const newPlayer = createPlayer(playerPos);
    setPlayer(newPlayer);

    const newMonsters: Monster[] = [];
    const usedPositions = new Set([`${playerPos.x},${playerPos.y}`]);
    let idx = 1;
    for (let i = 0; i < params.monsterCount && idx < shuffled.length; i++, idx++) {
      const pos = shuffled[idx];
      const key = `${pos.x},${pos.y}`;
      if (usedPositions.has(key)) {
        i--;
        continue;
      }
      usedPositions.add(key);
      newMonsters.push(createMonster(pos, i));
    }
    setMonsters(newMonsters);
    setGameOver(false);
    setLogs([]);
    playerAnimRef.current = null;
    monsterAnimsRef.current.clear();

    addLog(createLogEntry(`新地图已生成！种子: ${map.seed}`, 'system'));
    addLog(createLogEntry(`地图大小: ${map.width}x${map.height}, 房间: ${map.rooms.length}, 怪物: ${newMonsters.length}`, 'system'));

    if (saveHistory) {
      const record: HistoryRecord = {
        id: uuidv4(),
        timestamp: new Date(),
        seed: map.seed,
        mapWidth: params.width,
        mapHeight: params.height,
        roomCount: params.roomCount,
        monsterCount: params.monsterCount,
      };
      setHistory((prev) => [record, ...prev].slice(0, 20));
    }
  }, [addLog]);

  useEffect(() => {
    initializeGame({
      width: mapWidth,
      height: mapHeight,
      roomCount,
      monsterCount,
    });
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dungeonMap || !player) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    const t = Math.min(1, (now - frameTimeRef.current) / ANIMATION_DURATION);

    const width = dungeonMap.width * TILE_SIZE;
    const height = dungeonMap.height * TILE_SIZE;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < dungeonMap.height; y++) {
      for (let x = 0; x < dungeonMap.width; x++) {
        const tile = dungeonMap.tiles[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (tile === TileType.WALL) {
          ctx.fillStyle = '#0a0a14';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#12121f';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        } else if (tile === TileType.FLOOR) {
          ctx.fillStyle = '#5a5a6e';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#4a4a5e';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        } else if (tile === TileType.CORRIDOR) {
          ctx.fillStyle = '#3a3a4e';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.2,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.75
    );
    gradient.addColorStop(0, 'rgba(80, 120, 255, 0)');
    gradient.addColorStop(0.6, 'rgba(100, 80, 200, 0.08)');
    gradient.addColorStop(1, 'rgba(180, 100, 255, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#4a3aff';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, width - 3, height - 3);
    ctx.strokeStyle = 'rgba(180, 100, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(4.5, 4.5, width - 9, height - 9);

    const drawMonster = (monster: Monster) => {
      if (monster.hp <= 0) return;
      let mx = monster.x;
      let my = monster.y;
      const anim = monsterAnimsRef.current.get(monster.id);
      if (anim) {
        const mt = Math.min(1, (now - anim.startTime) / ANIMATION_DURATION);
        mx = lerp(anim.fromX, anim.toX, mt);
        my = lerp(anim.fromY, anim.toY, mt);
      }
      const mpx = mx * TILE_SIZE;
      const mpy = my * TILE_SIZE;
      const pulse = 0.7 + Math.sin(now / 200) * 0.3;

      ctx.fillStyle = `rgba(255, 60, 60, ${pulse})`;
      ctx.shadowColor = '#ff3333';
      ctx.shadowBlur = 10;
      ctx.fillRect(mpx + 4, mpy + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mpx + 9, mpy + 11, 4, 4);
      ctx.fillRect(mpx + TILE_SIZE - 13, mpy + 11, 4, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(mpx + 10, mpy + 12, 2, 2);
      ctx.fillRect(mpx + TILE_SIZE - 12, mpy + 12, 2, 2);

      const hpRatio = monster.hp / monster.maxHp;
      ctx.fillStyle = '#333333';
      ctx.fillRect(mpx + 4, mpy - 4, TILE_SIZE - 8, 3);
      ctx.fillStyle = hpRatio > 0.5 ? '#44ff44' : hpRatio > 0.25 ? '#ffaa00' : '#ff4444';
      ctx.fillRect(mpx + 4, mpy - 4, (TILE_SIZE - 8) * hpRatio, 3);
    };

    for (const monster of monsters) {
      drawMonster(monster);
    }

    let px = player.x;
    let py = player.y;
    const pAnim = playerAnimRef.current;
    if (pAnim) {
      px = lerp(pAnim.fromX, pAnim.toX, t);
      py = lerp(pAnim.fromY, pAnim.toY, t);
    }
    const ppx = px * TILE_SIZE;
    const ppy = py * TILE_SIZE;

    const glowPulse = 0.6 + Math.sin(now / 300) * 0.4;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 15 * glowPulse;
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(ppx + 3, ppy + 3, TILE_SIZE - 6, TILE_SIZE - 6);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#88ffbb';
    ctx.fillRect(ppx + 6, ppy + 6, TILE_SIZE - 12, TILE_SIZE - 12);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ppx + 9, ppy + 12, 4, 4);
    ctx.fillRect(ppx + TILE_SIZE - 13, ppy + 12, 4, 4);
    ctx.fillStyle = '#000000';
    ctx.fillRect(ppx + 10, ppy + 13, 2, 2);
    ctx.fillRect(ppx + TILE_SIZE - 12, ppy + 13, 2, 2);
  }, [dungeonMap, player, monsters]);

  useEffect(() => {
    const loop = () => {
      renderCanvas();
      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [renderCanvas]);

  const movePlayer = useCallback((dir: Direction) => {
    if (!dungeonMap || !player || isAnimating || gameOver) return;

    const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
    const dy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
    const newX = player.x + dx;
    const newY = player.y + dy;

    if (!isWalkable(dungeonMap, newX, newY)) return;
    if (isPositionOccupied(newX, newY, player, monsters)) {
      const target = monsters.find((m) => m.hp > 0 && m.x === newX && m.y === newY);
      if (target && isAdjacent(player, target)) {
        const updatedPlayer = { ...player };
        const updatedMonsters = monsters.map((m) => ({ ...m }));
        const targetIdx = updatedMonsters.findIndex((m) => m.id === target.id);
        if (targetIdx >= 0) {
          playerAttack(updatedPlayer, updatedMonsters[targetIdx], addLog);
          setPlayer(updatedPlayer);
          setMonsters(updatedMonsters);

          if (updatedPlayer.hp > 0 && updatedMonsters.some((m) => m.hp > 0)) {
            setIsAnimating(true);
            setTimeout(() => {
              const afterPlayer = { ...updatedPlayer };
              const afterMonsters = updatedMonsters.map((m) => ({ ...m }));
              processMonsterTurn(afterMonsters, afterPlayer, dungeonMap, addLog);
              decrementSkillCooldowns(afterPlayer);
              setPlayer(afterPlayer);
              setMonsters(afterMonsters);
              setIsAnimating(false);
              if (afterPlayer.hp <= 0) setGameOver(true);
            }, 200);
          }
        }
      }
      return;
    }

    frameTimeRef.current = performance.now();
    playerAnimRef.current = {
      fromX: player.x,
      fromY: player.y,
      toX: newX,
      toY: newY,
      startTime: performance.now(),
    };

    setIsAnimating(true);

    const monsterAnimStart = performance.now() + ANIMATION_DURATION * 0.3;
    const updatedMonsters = monsters.map((m) => ({ ...m }));
    const updatedPlayer = { ...player, x: newX, y: newY };

    for (const m of updatedMonsters) {
      if (m.hp <= 0) continue;
      const mdx = Math.sign(updatedPlayer.x - m.x);
      const mdy = Math.sign(updatedPlayer.y - m.y);
      let tryMoves: Array<{ x: number; y: number }> = [];
      if (Math.abs(updatedPlayer.x - m.x) > Math.abs(updatedPlayer.y - m.y)) {
        if (mdx !== 0) tryMoves.push({ x: m.x + mdx, y: m.y });
        if (mdy !== 0) tryMoves.push({ x: m.x, y: m.y + mdy });
      } else {
        if (mdy !== 0) tryMoves.push({ x: m.x, y: m.y + mdy });
        if (mdx !== 0) tryMoves.push({ x: m.x + mdx, y: m.y });
      }
      for (const move of tryMoves) {
        if (
          isWalkable(dungeonMap, move.x, move.y) &&
          !isPositionOccupied(
            move.x,
            move.y,
            updatedPlayer,
            updatedMonsters.filter((om) => om.id !== m.id)
          )
        ) {
          monsterAnimsRef.current.set(m.id, {
            fromX: m.x,
            fromY: m.y,
            toX: move.x,
            toY: move.y,
            startTime: monsterAnimStart,
          });
          m.x = move.x;
          m.y = move.y;
          break;
        }
      }
    }

    setTimeout(() => {
      const afterPlayer = { ...updatedPlayer };
      const afterMonsters = updatedMonsters.map((m) => ({ ...m }));
      const adjacentMonster = findAdjacentMonster(afterPlayer, afterMonsters);
      if (adjacentMonster) {
        const tIdx = afterMonsters.findIndex((m) => m.id === adjacentMonster.id);
        if (tIdx >= 0) {
          playerAttack(afterPlayer, afterMonsters[tIdx], addLog);
        }
      }
      processMonsterTurn(afterMonsters, afterPlayer, dungeonMap, addLog);
      decrementSkillCooldowns(afterPlayer);
      setPlayer(afterPlayer);
      setMonsters(afterMonsters);
      setIsAnimating(false);
      playerAnimRef.current = null;
      monsterAnimsRef.current.clear();
      if (afterPlayer.hp <= 0) setGameOver(true);
    }, ANIMATION_DURATION + 50);

    setPlayer(updatedPlayer);
    setMonsters(updatedMonsters);
  }, [dungeonMap, player, monsters, isAnimating, gameOver, addLog]);

  const handleSkillUse = useCallback((skill: Skill) => {
    if (!player || !monsters || isAnimating || gameOver) return;

    const updatedPlayer = {
      ...player,
      skills: player.skills.map((s) => ({ ...s })),
    };
    const updatedMonsters = monsters.map((m) => ({ ...m }));
    const skillCopy = updatedPlayer.skills.find((s) => s.id === skill.id);
    if (!skillCopy) return;

    const used = useSkill(updatedPlayer, skillCopy, updatedMonsters, addLog);
    if (!used) {
      setPlayer(updatedPlayer);
      return;
    }

    setPlayer(updatedPlayer);
    setMonsters(updatedMonsters);
    setIsAnimating(true);

    setTimeout(() => {
      const afterPlayer = { ...updatedPlayer };
      const afterMonsters = updatedMonsters.map((m) => ({ ...m }));
      processMonsterTurn(afterMonsters, afterPlayer, dungeonMap!, addLog);
      setPlayer(afterPlayer);
      setMonsters(afterMonsters);
      setIsAnimating(false);
      if (afterPlayer.hp <= 0) setGameOver(true);
    }, 200);
  }, [player, monsters, isAnimating, gameOver, dungeonMap, addLog]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          e.preventDefault();
          movePlayer('up');
          break;
        case 's':
        case 'arrowdown':
          e.preventDefault();
          movePlayer('down');
          break;
        case 'a':
        case 'arrowleft':
          e.preventDefault();
          movePlayer('left');
          break;
        case 'd':
        case 'arrowright':
          e.preventDefault();
          movePlayer('right');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, gameOver]);

  const handleGenerate = () => {
    initializeGame({
      width: mapWidth,
      height: mapHeight,
      roomCount,
      monsterCount,
    });
  };

  const handleHistoryClick = (record: HistoryRecord) => {
    setMapWidth(record.mapWidth);
    setMapHeight(record.mapHeight);
    setRoomCount(record.roomCount);
    setMonsterCount(record.monsterCount);
    initializeGame(
      {
        width: record.mapWidth,
        height: record.mapHeight,
        roomCount: record.roomCount,
        monsterCount: record.monsterCount,
        seed: record.seed,
      },
      false
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour12: false });
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="game-title">⚔️ Roguelike 地下城生成器</h1>
        <p className="game-subtitle">程序化地图生成 · 回合制战斗模拟</p>
      </header>

      <div className="main-layout">
        <div className="game-area">
          <div className="controls-bar">
            <div className="control-group">
              <label>地图宽度</label>
              <input
                type="range"
                min="10"
                max="20"
                value={mapWidth}
                onChange={(e) => setMapWidth(Number(e.target.value))}
                disabled={isAnimating}
              />
              <span className="control-value">{mapWidth}</span>
            </div>
            <div className="control-group">
              <label>地图高度</label>
              <input
                type="range"
                min="10"
                max="20"
                value={mapHeight}
                onChange={(e) => setMapHeight(Number(e.target.value))}
                disabled={isAnimating}
              />
              <span className="control-value">{mapHeight}</span>
            </div>
            <div className="control-group">
              <label>房间数量</label>
              <input
                type="range"
                min="3"
                max="8"
                value={roomCount}
                onChange={(e) => setRoomCount(Number(e.target.value))}
                disabled={isAnimating}
              />
              <span className="control-value">{roomCount}</span>
            </div>
            <div className="control-group">
              <label>怪物数量</label>
              <input
                type="range"
                min="3"
                max="5"
                value={monsterCount}
                onChange={(e) => setMonsterCount(Number(e.target.value))}
                disabled={isAnimating}
              />
              <span className="control-value">{monsterCount}</span>
            </div>
            <button className="glow-button" onClick={handleGenerate} disabled={isAnimating}>
              🗺️ 生成新地图
            </button>
          </div>

          <div className="canvas-wrapper">
            <canvas ref={canvasRef} className="game-canvas" />
            {gameOver && (
              <div className="game-over-overlay">
                <div className="game-over-content">
                  <h2>💀 你已阵亡</h2>
                  <p>勇敢的冒险者倒下了...</p>
                  <button className="glow-button" onClick={handleGenerate}>
                    重新开始
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mobile-controls">
            <div className="dpad">
              <button className="dpad-btn dpad-up" onClick={() => movePlayer('up')} disabled={isAnimating || gameOver}>
                ▲
              </button>
              <button className="dpad-btn dpad-left" onClick={() => movePlayer('left')} disabled={isAnimating || gameOver}>
                ◀
              </button>
              <button className="dpad-btn dpad-right" onClick={() => movePlayer('right')} disabled={isAnimating || gameOver}>
                ▶
              </button>
              <button className="dpad-btn dpad-down" onClick={() => movePlayer('down')} disabled={isAnimating || gameOver}>
                ▼
              </button>
            </div>
          </div>

          <div className="combat-log-section">
            <h3 className="section-title">📜 战斗日志</h3>
            <div className="combat-log" ref={logContainerRef}>
              {logs.map((log) => (
                <div key={log.id} className={`log-entry log-${log.type}`}>
                  <span className="log-time">[{formatTime(log.timestamp)}]</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="status-panel">
          <h3 className="panel-title">🧙 冒险者状态</h3>

          {player && (
            <>
              <div className="stat-bar-container">
                <div className="stat-label">
                  <span>HP</span>
                  <span>{player.hp} / {player.maxHp}</span>
                </div>
                <div className="stat-bar">
                  <div
                    className="stat-fill hp-fill"
                    style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                  />
                </div>
              </div>

              <div className="stat-bar-container">
                <div className="stat-label">
                  <span>MP</span>
                  <span>{player.mp} / {player.maxMp}</span>
                </div>
                <div className="stat-bar">
                  <div
                    className="stat-fill mp-fill"
                    style={{ width: `${(player.mp / player.maxMp) * 100}%` }}
                  />
                </div>
              </div>

              <div className="stats-info">
                <div className="stat-item">
                  <span className="stat-icon">⚔️</span>
                  <span>攻击力: {player.attack}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">📍</span>
                  <span>位置: ({player.x}, {player.y})</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">👹</span>
                  <span>存活怪物: {monsters.filter((m) => m.hp > 0).length}</span>
                </div>
              </div>

              <h4 className="panel-subtitle">技能</h4>
              <div className="skills-container">
                {player.skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="skill-wrapper"
                    onMouseEnter={() => setHoveredSkill(skill.id)}
                    onMouseLeave={() => setHoveredSkill(null)}
                  >
                    <button
                      className={`skill-button ${skill.currentCooldown > 0 ? 'on-cooldown' : ''}`}
                      onClick={() => handleSkillUse(skill)}
                      disabled={isAnimating || gameOver || skill.currentCooldown > 0 || player.mp < skill.mpCost}
                    >
                      <span className="skill-icon">{skill.icon}</span>
                      {skill.currentCooldown > 0 && (
                        <span className="skill-cooldown">{skill.currentCooldown}</span>
                      )}
                    </button>
                    {hoveredSkill === skill.id && (
                      <div className="skill-tooltip">
                        <div className="tooltip-name">{skill.name}</div>
                        <div className="tooltip-desc">{skill.description}</div>
                        <div className="tooltip-stats">
                          <span>消耗: {skill.mpCost} MP</span>
                          <span>冷却: {skill.cooldown} 回合</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="controls-hint">
                <p>🎮 使用 WASD 或方向键移动</p>
                <p>⚔️ 移动到怪物旁自动攻击</p>
              </div>
            </>
          )}
        </aside>
      </div>

      <div className="history-section">
        <h3 className="section-title">🕰️ 生成历史</h3>
        <div className="history-cards">
          {history.length === 0 ? (
            <p className="history-empty">暂无历史记录，生成地图后将显示在这里</p>
          ) : (
            history.map((record) => (
              <div
                key={record.id}
                className="history-card"
                onClick={() => handleHistoryClick(record)}
              >
                <div className="history-seed">#{record.seed}</div>
                <div className="history-params">
                  <span>📐 {record.mapWidth}×{record.mapHeight}</span>
                  <span>🏠 {record.roomCount}</span>
                  <span>👹 {record.monsterCount}</span>
                </div>
                <div className="history-time">{formatTime(record.timestamp)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
