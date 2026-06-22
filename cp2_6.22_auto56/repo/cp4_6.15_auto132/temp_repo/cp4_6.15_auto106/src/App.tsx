import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { generateDungeon, getWalkablePositions, benchmarkGeneration } from './dungeonGenerator';
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

/** 线性插值 - 用于250ms移动/攻击动画的60FPS过渡 */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fpsCounterRef = useRef<{ frames: number; lastTime: number; fps: number }>({
    frames: 0,
    lastTime: performance.now(),
    fps: 60,
  });

  /** 地图生成参数控制 */
  const [mapWidth, setMapWidth] = useState(15);
  const [mapHeight, setMapHeight] = useState(15);
  const [roomCount, setRoomCount] = useState(5);
  const [monsterCount, setMonsterCount] = useState(4);

  /** 游戏状态 */
  const [dungeonMap, setDungeonMap] = useState<DungeonMap | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const [perfStats, setPerfStats] = useState<{ fps: number; genTime: number }>({ fps: 60, genTime: 0 });

  /** 动画状态引用（避免触发重渲染） */
  const playerAnimRef = useRef<AnimatedPosition | null>(null);
  const monsterAnimsRef = useRef<Map<string, AnimatedPosition>>(new Map());
  const frameTimeRef = useRef<number>(0);

  /**
   * 添加战斗日志条目
   * 自动限制为100条，超出丢弃最旧的
   */
  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => {
      const updated = [...prev, entry];
      if (updated.length > MAX_LOG_ENTRIES) {
        return updated.slice(updated.length - MAX_LOG_ENTRIES);
      }
      return updated;
    });
  }, []);

  /** 监听窗口尺寸变化 - 用于响应式Canvas缩放 */
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * 初始化游戏（生成地图 + 放置玩家和怪物）
   * @param params 地图生成参数（含可选seed用于还原历史地图）
   * @param saveHistory 是否保存到历史记录（还原历史时传false）
   */
  const initializeGame = useCallback((params: GeneratorParams, saveHistory: boolean = true) => {
    const genStart = performance.now();
    const map = generateDungeon(params);
    const genTime = performance.now() - genStart;
    setPerfStats((p) => ({ ...p, genTime }));
    setDungeonMap(map);

    const walkable = getWalkablePositions(map);
    if (walkable.length === 0) return;

    /** 用基于seed的打乱保证可复现性 */
    const shuffled = [...walkable].sort(() => {
      if (params.seed !== undefined) {
        const x = Math.sin(params.seed + walkable.indexOf(params.seed as never)) * 10000;
        return x - Math.floor(x) - 0.5;
      }
      return Math.random() - 0.5;
    });

    const playerPos = map.rooms[0]
      ? { x: map.rooms[0].centerX, y: map.rooms[0].centerY }
      : shuffled[0];

    const newPlayer = createPlayer(playerPos);
    setPlayer(newPlayer);

    /** 在除第一个房间外的其他房间放置怪物 */
    const newMonsters: Monster[] = [];
    const monsterRoomPositions: Array<{ x: number; y: number }> = [];
    for (let i = 1; i < map.rooms.length; i++) {
      const room = map.rooms[i];
      monsterRoomPositions.push({ x: room.centerX, y: room.centerY });
      if (room.width >= 4 && room.height >= 4) {
        monsterRoomPositions.push({ x: room.x + 1, y: room.y + 1 });
      }
    }

    let mIdx = 0;
    for (let i = 0; i < params.monsterCount && (mIdx < monsterRoomPositions.length || mIdx < shuffled.length); i++) {
      let pos: { x: number; y: number };
      if (mIdx < monsterRoomPositions.length) {
        pos = monsterRoomPositions[mIdx];
        mIdx++;
      } else {
        pos = shuffled[mIdx + 1] || shuffled[mIdx];
        mIdx++;
      }

      /** 跳过与玩家/已有怪物重叠的位置 */
      const occupied = newMonsters.some((m) => m.x === pos.x && m.y === pos.y)
        || (pos.x === newPlayer.x && pos.y === newPlayer.y);
      if (occupied) {
        i--;
        continue;
      }

      newMonsters.push(createMonster(pos, i));
    }
    setMonsters(newMonsters);
    setGameOver(false);
    setLogs([]);
    playerAnimRef.current = null;
    monsterAnimsRef.current.clear();

    addLog(createLogEntry(`🗺️ 新地图已生成！种子: #${map.seed}（生成耗时 ${genTime.toFixed(1)}ms）`, 'system'));
    addLog(createLogEntry(`📐 地图 ${map.width}×${map.height} | 🏠 房间 ${map.rooms.length} | 👹 怪物 ${newMonsters.length}`, 'system'));

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

  /** 首次加载初始化默认地图 + 执行性能基准测试 */
  useEffect(() => {
    initializeGame({
      width: mapWidth,
      height: mapHeight,
      roomCount,
      monsterCount,
    });
    const bench = benchmarkGeneration(20);
    console.log('%c=== 性能基准测试 ===', 'color: #4a3aff; font-weight: bold;');
    console.log(`地图生成 - 平均: ${bench.avg.toFixed(2)}ms, 最大: ${bench.max.toFixed(2)}ms, 最小: ${bench.min.toFixed(2)}ms`);
    console.log(`性能约束 (≤50ms): ${bench.max < 50 ? '✅ 通过' : '❌ 未通过'}`);
  }, []);

  /** 日志自动滚动到底部 */
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  /**
   * ============================================================
   * Canvas渲染函数（60FPS主循环）
   * 包含: 瓦片渲染 + 蓝紫边际渐变光效 + 玩家/怪物 + HP条
   * ============================================================
   */
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dungeonMap || !player) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    const t = Math.min(1, (now - frameTimeRef.current) / ANIMATION_DURATION);

    /** FPS计算 */
    fpsCounterRef.current.frames++;
    if (now - fpsCounterRef.current.lastTime >= 1000) {
      const fps = fpsCounterRef.current.frames;
      fpsCounterRef.current.fps = fps;
      fpsCounterRef.current.frames = 0;
      fpsCounterRef.current.lastTime = now;
      setPerfStats((p) => ({ ...p, fps }));
    }

    /** 根据视口宽度计算Canvas缩放比例（移动端自动适配100%宽度） */
    const canvasLogicalWidth = dungeonMap.width * TILE_SIZE;
    const canvasLogicalHeight = dungeonMap.height * TILE_SIZE;

    const container = canvasContainerRef.current;
    let scale = 1;
    if (container) {
      const availableWidth = container.clientWidth - 16;
      if (canvasLogicalWidth > availableWidth) {
        scale = availableWidth / canvasLogicalWidth;
      }
    }

    canvas.width = canvasLogicalWidth;
    canvas.height = canvasLogicalHeight;
    canvas.style.width = `${canvasLogicalWidth * scale}px`;
    canvas.style.height = `${canvasLogicalHeight * scale}px`;

    /** 1. 绘制背景 */
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, canvasLogicalWidth, canvasLogicalHeight);

    /** 2. 绘制瓦片 */
    for (let y = 0; y < dungeonMap.height; y++) {
      for (let x = 0; x < dungeonMap.width; x++) {
        const tile = dungeonMap.tiles[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (tile === TileType.WALL) {
          ctx.fillStyle = '#0a0a14';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#16162a';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        } else if (tile === TileType.FLOOR) {
          /** 房间地板 - 浅灰色 */
          ctx.fillStyle = '#5a5a6e';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#4a4a5e';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        } else if (tile === TileType.CORRIDOR) {
          /** 走廊 - 深灰色窄条 */
          ctx.fillStyle = '#3a3a4e';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    /**
     * 3. 绘制蓝色到紫色的渐变边际光效
     * 算法: 检测每个墙壁/地板边界，在边缘绘制径向渐变
     * 从四周墙壁向地图中心形成蓝→紫的光晕衰减
     */
    ctx.save();
    const edgeGradient = ctx.createRadialGradient(
      canvasLogicalWidth / 2,
      canvasLogicalHeight / 2,
      Math.min(canvasLogicalWidth, canvasLogicalHeight) * 0.15,
      canvasLogicalWidth / 2,
      canvasLogicalHeight / 2,
      Math.max(canvasLogicalWidth, canvasLogicalHeight) * 0.7
    );
    edgeGradient.addColorStop(0, 'rgba(60, 120, 255, 0)');
    edgeGradient.addColorStop(0.4, 'rgba(100, 90, 220, 0.10)');
    edgeGradient.addColorStop(0.7, 'rgba(150, 80, 220, 0.18)');
    edgeGradient.addColorStop(1, 'rgba(180, 100, 255, 0.28)');
    ctx.fillStyle = edgeGradient;
    ctx.fillRect(0, 0, canvasLogicalWidth, canvasLogicalHeight);
    ctx.restore();

    /**
     * 额外: 沿地图外边缘绘制更强烈的边界光带
     * 模拟复古CRT显示器的边缘发光效果
     */
    const borderThickness = Math.ceil(TILE_SIZE * 0.6);
    for (let i = 0; i < borderThickness; i++) {
      const alpha = (1 - i / borderThickness) * 0.35;
      const hue = 240 + (i / borderThickness) * 60;
      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(
        i + 0.5,
        i + 0.5,
        canvasLogicalWidth - i * 2 - 1,
        canvasLogicalHeight - i * 2 - 1
      );
    }

    /** 4. 绘制最外围粗边框（蓝紫渐变） */
    const outerGrad = ctx.createLinearGradient(0, 0, canvasLogicalWidth, canvasLogicalHeight);
    outerGrad.addColorStop(0, '#3b5cff');
    outerGrad.addColorStop(0.5, '#7c3aed');
    outerGrad.addColorStop(1, '#c026d3');
    ctx.strokeStyle = outerGrad;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvasLogicalWidth - 4, canvasLogicalHeight - 4);

    /** 内层装饰边框 */
    ctx.strokeStyle = 'rgba(180, 100, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(6, 6, canvasLogicalWidth - 12, canvasLogicalHeight - 12);

    /** 5. 绘制怪物（带闪烁效果 + HP条） */
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
      const pulse = 0.6 + Math.sin(now / 180) * 0.4;

      /** 怪物红色闪烁发光方块 */
      ctx.shadowColor = '#ff3333';
      ctx.shadowBlur = 12 * pulse;
      ctx.fillStyle = `rgba(255, ${40 + Math.floor(pulse * 30)}, ${40 + Math.floor(pulse * 20)}, 0.95)`;
      ctx.fillRect(mpx + 4, mpy + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      ctx.shadowBlur = 0;

      /** 怪物内部装饰 */
      ctx.fillStyle = '#ff8080';
      ctx.fillRect(mpx + 7, mpy + 7, TILE_SIZE - 14, TILE_SIZE - 14);

      /** 怪物眼睛 */
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mpx + 9, mpy + 11, 4, 4);
      ctx.fillRect(mpx + TILE_SIZE - 13, mpy + 11, 4, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(mpx + 10, mpy + 12, 2, 2);
      ctx.fillRect(mpx + TILE_SIZE - 12, mpy + 12, 2, 2);

      /** 怪物血条 */
      const hpRatio = monster.hp / monster.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(mpx + 3, mpy - 5, TILE_SIZE - 6, 4);
      ctx.fillStyle = hpRatio > 0.5 ? '#4ade80' : hpRatio > 0.25 ? '#fbbf24' : '#ef4444';
      ctx.fillRect(mpx + 3, mpy - 5, (TILE_SIZE - 6) * hpRatio, 4);
    };

    for (const monster of monsters) {
      drawMonster(monster);
    }

    /** 6. 绘制玩家（绿色发光方块 + 插值动画） */
    let px = player.x;
    let py = player.y;
    const pAnim = playerAnimRef.current;
    if (pAnim) {
      px = lerp(pAnim.fromX, pAnim.toX, t);
      py = lerp(pAnim.fromY, pAnim.toY, t);
    }
    const ppx = px * TILE_SIZE;
    const ppy = py * TILE_SIZE;

    const glowPulse = 0.55 + Math.sin(now / 280) * 0.45;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 18 * glowPulse;
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(ppx + 3, ppy + 3, TILE_SIZE - 6, TILE_SIZE - 6);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#88ffbb';
    ctx.fillRect(ppx + 6, ppy + 6, TILE_SIZE - 12, TILE_SIZE - 12);

    /** 玩家眼睛 */
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ppx + 9, ppy + 12, 4, 4);
    ctx.fillRect(ppx + TILE_SIZE - 13, ppy + 12, 4, 4);
    ctx.fillStyle = '#000000';
    ctx.fillRect(ppx + 10, ppy + 13, 2, 2);
    ctx.fillRect(ppx + TILE_SIZE - 12, ppy + 13, 2, 2);
  }, [dungeonMap, player, monsters]);

  /** 启动60FPS渲染循环 */
  useEffect(() => {
    const loop = () => {
      renderCanvas();
      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [renderCanvas]);

  /**
   * 玩家移动处理
   * 包含: 墙壁检测 → 碰撞检测 → 攻击触发 → 怪物AI → 冷却更新
   */
  const movePlayer = useCallback((dir: Direction) => {
    if (!dungeonMap || !player || isAnimating || gameOver) return;

    const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
    const dy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
    const newX = player.x + dx;
    const newY = player.y + dy;

    if (!isWalkable(dungeonMap, newX, newY)) return;

    /** 目标格被怪物占据 → 直接攻击，不移动 */
    if (isPositionOccupied(newX, newY, player, monsters)) {
      const target = monsters.find((m) => m.hp > 0 && m.x === newX && m.y === newY);
      if (target && isAdjacent(player, target)) {
        const updatedPlayer = { ...player, skills: player.skills.map((s) => ({ ...s })) };
        const updatedMonsters = monsters.map((m) => ({ ...m }));
        const targetIdx = updatedMonsters.findIndex((m) => m.id === target.id);
        if (targetIdx >= 0) {
          playerAttack(updatedPlayer, updatedMonsters[targetIdx], addLog);
          setPlayer(updatedPlayer);
          setMonsters(updatedMonsters);

          if (updatedPlayer.hp > 0 && updatedMonsters.some((m) => m.hp > 0)) {
            setIsAnimating(true);
            setTimeout(() => {
              const afterPlayer = { ...updatedPlayer, skills: updatedPlayer.skills.map((s) => ({ ...s })) };
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

    /** 正常移动流程 - 启动动画 */
    frameTimeRef.current = performance.now();
    playerAnimRef.current = {
      fromX: player.x,
      fromY: player.y,
      toX: newX,
      toY: newY,
      startTime: performance.now(),
    };

    setIsAnimating(true);

    /** 怪物移动动画延迟启动 */
    const monsterAnimStart = performance.now() + ANIMATION_DURATION * 0.3;
    const updatedMonsters = monsters.map((m) => ({ ...m }));
    const updatedPlayer = { ...player, x: newX, y: newY, skills: player.skills.map((s) => ({ ...s })) };

    for (const m of updatedMonsters) {
      if (m.hp <= 0) continue;
      const mdx = Math.sign(updatedPlayer.x - m.x);
      const mdy = Math.sign(updatedPlayer.y - m.y);
      const tryMoves: Array<{ x: number; y: number }> = [];
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

    /** 动画结束后处理战斗逻辑 */
    setTimeout(() => {
      const afterPlayer = { ...updatedPlayer, skills: updatedPlayer.skills.map((s) => ({ ...s })) };
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

  /**
   * 技能使用处理
   */
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
      const afterPlayer = { ...updatedPlayer, skills: updatedPlayer.skills.map((s) => ({ ...s })) };
      const afterMonsters = updatedMonsters.map((m) => ({ ...m }));
      processMonsterTurn(afterMonsters, afterPlayer, dungeonMap!, addLog);
      setPlayer(afterPlayer);
      setMonsters(afterMonsters);
      setIsAnimating(false);
      if (afterPlayer.hp <= 0) setGameOver(true);
    }, 250);
  }, [player, monsters, isAnimating, gameOver, dungeonMap, addLog]);

  /** WASD / 方向键监听 */
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

  /** 生成新地图按钮 */
  const handleGenerate = () => {
    initializeGame({
      width: mapWidth,
      height: mapHeight,
      roomCount,
      monsterCount,
    });
  };

  /**
   * 历史记录卡片点击还原地图
   * 调用dungeonGenerator并传入record.seed，不保存新的历史
   */
  const handleHistoryClick = (record: HistoryRecord) => {
    setMapWidth(record.mapWidth);
    setMapHeight(record.mapHeight);
    setRoomCount(record.roomCount);
    setMonsterCount(record.monsterCount);
    addLog(createLogEntry(`⏪ 正在还原地图 #${record.seed}...`, 'system'));
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

  const isMobile = viewportWidth <= 768;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="game-title">⚔️ Roguelike 地下城生成器</h1>
        <p className="game-subtitle">程序化地图生成 · 回合制战斗模拟</p>
        <div className="perf-indicator">
          <span title="帧率">🎬 {perfStats.fps} FPS</span>
          <span title="上次地图生成耗时">⚡ {perfStats.genTime.toFixed(1)}ms</span>
        </div>
      </header>

      <div className={`main-layout ${isMobile ? 'layout-mobile' : 'layout-desktop'}`}>
        <div className="game-area">
          {/* 控制面板 */}
          <div className="controls-bar">
            <div className="control-group">
              <label>宽度</label>
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
              <label>高度</label>
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
              <label>房间</label>
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
              <label>怪物</label>
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

          {/* Canvas游戏区 - 响应式宽度 */}
          <div className="canvas-wrapper" ref={canvasContainerRef}>
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

          {/* 移动端虚拟方向键 */}
          <div className="mobile-controls">
            <div className="dpad">
              <button className="dpad-btn dpad-up" onClick={() => movePlayer('up')} disabled={isAnimating || gameOver}>▲</button>
              <button className="dpad-btn dpad-left" onClick={() => movePlayer('left')} disabled={isAnimating || gameOver}>◀</button>
              <button className="dpad-btn dpad-right" onClick={() => movePlayer('right')} disabled={isAnimating || gameOver}>▶</button>
              <button className="dpad-btn dpad-down" onClick={() => movePlayer('down')} disabled={isAnimating || gameOver}>▼</button>
            </div>
          </div>

          {/* 战斗日志区域 - 敌我交替底色 */}
          <div className="combat-log-section">
            <h3 className="section-title">📜 战斗日志 <span className="log-count">({logs.length}/{MAX_LOG_ENTRIES})</span></h3>
            <div className="combat-log" ref={logContainerRef}>
              {logs.length === 0 ? (
                <p className="log-empty">等待战斗开始... 用WASD移动角色</p>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={log.id}
                    className={`log-entry log-${log.type} log-alt-${index % 2}`}
                  >
                    <span className="log-time">[{formatTime(log.timestamp)}]</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 状态面板 - 桌面端右侧 / 移动端底部横向条带 */}
        <aside className={`status-panel ${isMobile ? 'panel-mobile' : 'panel-desktop'}`}>
          <h3 className="panel-title">🧙 冒险者状态</h3>

          {player && (
            <div className={`panel-content ${isMobile ? 'panel-content-row' : 'panel-content-col'}`}>
              {/* HP/MP进度条 */}
              <div className="stat-bars-wrap">
                <div className="stat-bar-container" key={`hp-${player.hp}`}>
                  <div className="stat-label">
                    <span className="stat-label-name">❤️ HP</span>
                    <span className="stat-label-value">{player.hp} / {player.maxHp}</span>
                  </div>
                  <div className="stat-bar">
                    <div
                      className="stat-fill hp-fill spring-animate"
                      style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="stat-bar-container" key={`mp-${player.mp}`}>
                  <div className="stat-label">
                    <span className="stat-label-name">💧 MP</span>
                    <span className="stat-label-value">{player.mp} / {player.maxMp}</span>
                  </div>
                  <div className="stat-bar">
                    <div
                      className="stat-fill mp-fill spring-animate"
                      style={{ width: `${(player.mp / player.maxMp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 属性信息 */}
              <div className="stats-info">
                <div className="stat-item">
                  <span className="stat-icon">⚔️</span>
                  <span>攻击: {player.attack}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">📍</span>
                  <span>({player.x},{player.y})</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">👹</span>
                  <span>存活: {monsters.filter((m) => m.hp > 0).length}</span>
                </div>
              </div>

              {/* 技能图标 */}
              <div className="skills-wrap">
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
                        title={`${skill.name}: ${skill.description}`}
                      >
                        <span className="skill-icon">{skill.icon}</span>
                        {skill.currentCooldown > 0 && (
                          <span className="skill-cooldown">{skill.currentCooldown}</span>
                        )}
                      </button>
                      {hoveredSkill === skill.id && (
                        <div className={`skill-tooltip ${isMobile ? 'tooltip-up' : ''}`}>
                          <div className="tooltip-name">{skill.name}</div>
                          <div className="tooltip-desc">{skill.description}</div>
                          <div className="tooltip-stats">
                            <span>消耗: {skill.mpCost} MP</span>
                            <span>冷却: {skill.cooldown}回合</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 操作提示 - 仅桌面端显示 */}
              {!isMobile && (
                <div className="controls-hint">
                  <p>🎮 WASD / 方向键移动</p>
                  <p>⚔️ 撞向怪物自动攻击</p>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* 历史记录卡片 */}
      <div className="history-section">
        <h3 className="section-title">🕰️ 生成历史 <span className="section-sub">（点击卡片还原地图）</span></h3>
        <div className="history-cards">
          {history.length === 0 ? (
            <p className="history-empty">暂无历史记录，生成新地图后将显示在这里</p>
          ) : (
            history.map((record) => (
              <div
                key={record.id}
                className="history-card"
                onClick={() => handleHistoryClick(record)}
                title={`点击还原 #${record.seed}`}
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
