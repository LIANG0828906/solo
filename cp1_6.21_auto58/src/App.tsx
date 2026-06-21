import { useEffect, useRef, useState, useCallback } from 'react';
import { generateMaze, findPath, isWalkable, type CellType, type Position } from './maze';
import { RUNE_CONFIG, canAttack, findTargetsInRange, calculateDamage, findChainTargets, type Rune, type RuneType } from './rune';
import { updateMonster, damageMonster, applySlowEffect, getMonsterColor, type Monster } from './monster';

const MAZE_SIZE = 10;
const WAVE_INTERVAL = 5000;
const CELL_SIZE = 50;
const MAX_MONSTERS_PER_FRAME = 100;

interface RuneInventory {
  fire: number;
  ice: number;
  lightning: number;
}

interface Trail {
  x: number;
  y: number;
  time: number;
}

interface RunePlacement {
  x: number;
  y: number;
  time: number;
  color: string;
}

export default function App() {
  const [maze, setMaze] = useState<CellType[][]>([]);
  const [path, setPath] = useState<Position[]>([]);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [runes, setRunes] = useState<Rune[]>([]);
  const [inventory, setInventory] = useState<RuneInventory>({ fire: 10, ice: 10, lightning: 10 });
  const [selectedRune, setSelectedRune] = useState<RuneType | null>(null);
  const [wave, setWave] = useState(0);
  const [nextWaveTime, setNextWaveTime] = useState(WAVE_INTERVAL);
  const [health, setHealth] = useState(10);
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [doubleEffect, setDoubleEffect] = useState(false);
  const [doubleEffectEndTime, setDoubleEffectEndTime] = useState(0);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [placements, setPlacements] = useState<RunePlacement[]>([]);
  const [doubleEffectTriggered, setDoubleEffectTriggered] = useState(false);

  const gameLoopRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const monstersRef = useRef<Monster[]>([]);
  const runesRef = useRef<Rune[]>([]);
  const trailsRef = useRef<Trail[]>([]);
  const placementsRef = useRef<RunePlacement[]>([]);
  const nextWaveTimeRef = useRef(WAVE_INTERVAL);
  const waveRef = useRef(0);
  const scoreRef = useRef(0);
  const doubleEffectRef = useRef(false);
  const doubleEffectEndTimeRef = useRef(0);
  const doubleEffectTriggeredRef = useRef(false);
  const killsRef = useRef(0);

  const initGame = useCallback(async () => {
    let newMaze: CellType[][];
    let newPath: Position[] | null;
    
    do {
      newMaze = generateMaze(MAZE_SIZE);
      newPath = findPath(newMaze, { x: 0, y: 0 }, { x: MAZE_SIZE - 1, y: MAZE_SIZE - 1 });
    } while (!newPath || newPath.length < 5);

    setMaze(newMaze);
    setPath(newPath);

    try {
      await fetch('/api/game/reset', { method: 'POST' });
      const invRes = await fetch('/api/runes/inventory');
      const invData = await invRes.json();
      setInventory(invData);
    } catch (e) {
      console.log('Using local state only');
    }

    setMonsters([]);
    setRunes([]);
    setWave(0);
    setNextWaveTime(WAVE_INTERVAL);
    setHealth(10);
    setScore(0);
    setKills(0);
    setIsGameOver(false);
    setDoubleEffect(false);
    setDoubleEffectEndTime(0);
    setTrails([]);
    setPlacements([]);
    setDoubleEffectTriggered(false);
    setSelectedRune(null);

    monstersRef.current = [];
    runesRef.current = [];
    trailsRef.current = [];
    placementsRef.current = [];
    nextWaveTimeRef.current = WAVE_INTERVAL;
    waveRef.current = 0;
    scoreRef.current = 0;
    doubleEffectRef.current = false;
    doubleEffectEndTimeRef.current = 0;
    doubleEffectTriggeredRef.current = false;
    killsRef.current = 0;
    lastTimeRef.current = performance.now();
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const spawnWave = useCallback(async () => {
    const newWave = waveRef.current + 1;
    waveRef.current = newWave;
    setWave(newWave);

    try {
      const res = await fetch('/api/game/wave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wave: newWave, path }),
      });
      const data = await res.json();
      if (data.monsters) {
        monstersRef.current = [...monstersRef.current, ...data.monsters];
        setMonsters([...monstersRef.current]);
      }
    } catch (e) {
      const monsterCount = 3 + newWave - 1;
      const healthMultiplier = 1 + (newWave - 1) * 0.2;
      const newMonsters: Monster[] = [];

      for (let i = 0; i < monsterCount; i++) {
        const monster: Monster = {
          id: `monster-${Date.now()}-${i}`,
          position: { x: -i * 0.5, y: 0 },
          path: path,
          pathIndex: 0,
          health: 100 * healthMultiplier,
          maxHealth: 100 * healthMultiplier,
          speed: 1.5,
          status: 'alive',
          slowEffect: 1,
          slowEndTime: 0,
        };
        newMonsters.push(monster);
      }

      monstersRef.current = [...monstersRef.current, ...newMonsters];
      setMonsters([...monstersRef.current]);
    }

    nextWaveTimeRef.current = WAVE_INTERVAL;
    setNextWaveTime(WAVE_INTERVAL);
  }, [path]);

  const placeRune = useCallback(async (x: number, y: number) => {
    if (!selectedRune || maze[y]?.[x] !== 'path') return;
    if (inventory[selectedRune] <= 0) return;
    
    const existingRune = runesRef.current.find(r => r.position.x === x && r.position.y === y);
    if (existingRune) return;

    try {
      const res = await fetch('/api/runes/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedRune, position: { x, y } }),
      });
      const data = await res.json();
      if (data.success) {
        runesRef.current = [...runesRef.current, data.rune];
        setRunes([...runesRef.current]);
        setInventory(data.inventory);
      }
    } catch (e) {
      const newRune: Rune = {
        id: `rune-${Date.now()}`,
        type: selectedRune,
        position: { x, y },
        damage: RUNE_CONFIG[selectedRune].damage,
        range: RUNE_CONFIG[selectedRune].range,
        cooldown: RUNE_CONFIG[selectedRune].cooldown,
        lastAttack: 0,
        slowAmount: RUNE_CONFIG[selectedRune].slowAmount,
        slowDuration: RUNE_CONFIG[selectedRune].slowDuration,
        chainCount: RUNE_CONFIG[selectedRune].chainCount,
        chainRange: RUNE_CONFIG[selectedRune].chainRange,
      };
      runesRef.current = [...runesRef.current, newRune];
      setRunes([...runesRef.current]);
      setInventory(prev => ({ ...prev, [selectedRune]: prev[selectedRune] - 1 }));
    }

    placementsRef.current.push({
      x,
      y,
      time: performance.now(),
      color: RUNE_CONFIG[selectedRune].color,
    });
    setPlacements([...placementsRef.current]);
  }, [selectedRune, maze, inventory]);

  useEffect(() => {
    if (maze.length === 0 || path.length === 0) return;

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      if (isGameOver) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      nextWaveTimeRef.current -= deltaTime;
      if (nextWaveTimeRef.current <= 0) {
        spawnWave();
      }
      setNextWaveTime(Math.max(0, nextWaveTimeRef.current));

      if (doubleEffectRef.current && currentTime > doubleEffectEndTimeRef.current) {
        doubleEffectRef.current = false;
        setDoubleEffect(false);
      }

      if (!doubleEffectTriggeredRef.current && scoreRef.current >= 50) {
        doubleEffectTriggeredRef.current = true;
        doubleEffectRef.current = true;
        doubleEffectEndTimeRef.current = currentTime + 15000;
        setDoubleEffectTriggered(true);
        setDoubleEffect(true);
        setDoubleEffectEndTime(doubleEffectEndTimeRef.current);
        fetch('/api/double-effect/trigger', { method: 'POST' }).catch(() => {});
      }

      const monstersToProcess = monstersRef.current.slice(0, MAX_MONSTERS_PER_FRAME);
      let newKills = 0;
      let newScore = 0;
      let healthLoss = 0;

      for (const monster of monstersToProcess) {
        if (monster.status !== 'alive') continue;

        const prevX = Math.floor(monster.position.x);
        const prevY = Math.floor(monster.position.y);

        const result = updateMonster(monster, deltaTime, currentTime);

        const currX = Math.floor(monster.position.x);
        const currY = Math.floor(monster.position.y);
        
        if (result.moved && (prevX !== currX || prevY !== currY)) {
          if (currX >= 0 && currX < MAZE_SIZE && currY >= 0 && currY < MAZE_SIZE) {
            trailsRef.current.push({ x: currX, y: currY, time: currentTime });
          }
        }

        if (result.reachedEnd) {
          healthLoss++;
        }
      }

      trailsRef.current = trailsRef.current.filter(t => currentTime - t.time < 500);
      setTrails([...trailsRef.current]);

      placementsRef.current = placementsRef.current.filter(p => currentTime - p.time < 300);
      setPlacements([...placementsRef.current]);

      for (const rune of runesRef.current) {
        if (!canAttack(rune, currentTime)) continue;

        const targets = findTargetsInRange(rune, monstersRef.current, doubleEffectRef.current);
        if (targets.length === 0) continue;

        rune.lastAttack = currentTime;

        const primaryTarget = targets[0];
        const { damage, slowAmount, slowDuration } = calculateDamage(rune, primaryTarget, doubleEffectRef.current);
        
        const dmgResult = damageMonster(primaryTarget, damage);
        if (dmgResult.killed) {
          newKills++;
          newScore += 10;
        }

        if (slowAmount > 0) {
          applySlowEffect(primaryTarget, slowAmount, slowDuration, currentTime);
        }

        if (rune.type === 'lightning') {
          const chainTargets = findChainTargets(rune, primaryTarget, monstersRef.current, doubleEffectRef.current);
          for (const chainTarget of chainTargets) {
            const chainDmg = calculateDamage(rune, chainTarget, doubleEffectRef.current);
            const chainResult = damageMonster(chainTarget, chainDmg.damage * 0.7);
            if (chainResult.killed) {
              newKills++;
              newScore += 10;
            }
          }
        }
      }

      monstersRef.current = monstersRef.current.filter(m => m.status === 'alive');
      setMonsters([...monstersRef.current]);

      if (newKills > 0) {
        killsRef.current += newKills;
        setKills(prev => prev + newKills);
      }
      if (newScore > 0) {
        scoreRef.current += newScore;
        setScore(prev => prev + newScore);
      }
      if (healthLoss > 0) {
        const newHealth = Math.max(0, health - healthLoss);
        setHealth(newHealth);
        if (newHealth <= 0) {
          setIsGameOver(true);
        }
        fetch('/api/health/damage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ damage: healthLoss }),
        }).catch(() => {});
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    lastTimeRef.current = performance.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [maze, path, isGameOver, spawnWave, health, kills]);

  const handleCellClick = (x: number, y: number) => {
    if (isGameOver) return;
    if (!isWalkable(maze, { x, y })) return;
    if (x === 0 && y === 0) return;
    if (x === MAZE_SIZE - 1 && y === MAZE_SIZE - 1) return;
    placeRune(x, y);
  };

  const renderCell = (x: number, y: number) => {
    const isPath = maze[y]?.[x] === 'path';
    const isStart = x === 0 && y === 0;
    const isEnd = x === MAZE_SIZE - 1 && y === MAZE_SIZE - 1;
    const rune = runes.find(r => r.position.x === x && r.position.y === y);
    const trail = trails.find(t => t.x === x && t.y === y);
    const placement = placements.find(p => p.x === x && p.y === y);
    const trailOpacity = trail ? Math.max(0, 1 - (performance.now() - trail.time) / 500) : 0;
    const placementProgress = placement ? (performance.now() - placement.time) / 300 : 0;

    return (
      <div
        key={`${x}-${y}`}
        onClick={() => handleCellClick(x, y)}
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          backgroundColor: isPath ? '#C9B79C' : '#2C2C2C',
          border: '1px solid rgba(0,0,0,0.3)',
          position: 'relative',
          cursor: isPath && !isStart && !isEnd ? 'pointer' : 'default',
          transition: 'background-color 0.1s',
        }}
        className={isPath && !isStart && !isEnd && selectedRune ? 'hover:brightness-110' : ''}
      >
        {trail && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: `rgba(255, 215, 0, ${trailOpacity * 0.3})`,
              pointerEvents: 'none',
            }}
          />
        )}

        {placement && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: placement.color,
              opacity: placementProgress < 0.5 ? 1 - placementProgress * 2 : 0,
              transform: `scale(${1 + placementProgress})`,
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
        )}

        {isStart && (
          <div style={{
            position: 'absolute',
            inset: 4,
            backgroundColor: '#4A90D9',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 12,
            fontWeight: 'bold',
          }}>
            入
          </div>
        )}

        {isEnd && (
          <div style={{
            position: 'absolute',
            inset: 2,
            backgroundColor: '#FFD700',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px #FFD700',
            animation: 'treasureGlow 2s infinite',
          }}>
            <span style={{ fontSize: 24 }}>💎</span>
          </div>
        )}

        {rune && (
          <div
            style={{
              position: 'absolute',
              inset: 6,
              backgroundColor: RUNE_CONFIG[rune.type].color,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 15px ${RUNE_CONFIG[rune.type].color}`,
            }}
            className="rune-glow"
          >
            <span style={{ fontSize: 20 }}>
              {rune.type === 'fire' ? '🔥' : rune.type === 'ice' ? '❄️' : '⚡'}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderMonsters = () => {
    return monsters
      .filter(m => m.status === 'alive')
      .map(monster => {
        const left = monster.position.x * CELL_SIZE + CELL_SIZE / 2;
        const top = monster.position.y * CELL_SIZE + CELL_SIZE / 2;
        const healthPercent = monster.health / monster.maxHealth;
        const color = getMonsterColor(monster);
        const isSlowed = monster.slowEffect < 1;

        return (
          <div
            key={monster.id}
            style={{
              position: 'absolute',
              left: left - 15,
              top: top - 15,
              width: 30,
              height: 30,
              backgroundColor: color,
              borderRadius: '50%',
              boxShadow: `0 0 8px ${color}`,
              border: isSlowed ? '2px solid #00BFFF' : 'none',
              transition: 'left 0.05s linear, top 0.05s linear',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <div style={{
              position: 'absolute',
              top: -8,
              left: -5,
              width: 40,
              height: 4,
              backgroundColor: '#333',
              borderRadius: 2,
            }}>
              <div style={{
                width: `${healthPercent * 100}%`,
                height: '100%',
                backgroundColor: color,
                borderRadius: 2,
                transition: 'width 0.1s',
              }} />
            </div>
          </div>
        );
      });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1A1A2E 0%, #000000 100%)',
      color: 'white',
      fontFamily: '"Microsoft YaHei", sans-serif',
    }}>
      <style>{`
        @keyframes runeGlow {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.2; }
        }
        @keyframes treasureGlow {
          0%, 100% { box-shadow: 0 0 10px #FFD700; }
          50% { box-shadow: 0 0 25px #FFD700, 0 0 40px #FFD700; }
        }
        @keyframes borderFlash {
          0%, 100% { box-shadow: 0 0 0 2px #FFD700, 0 0 20px #FFD700; }
          50% { box-shadow: 0 0 0 4px #FFD700, 0 0 40px #FFD700; }
        }
        @keyframes panelScale {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .rune-glow::after {
          content: '';
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          background: inherit;
          animation: runeGlow 2s infinite;
          pointer-events: none;
        }
        .double-effect-active {
          animation: borderFlash 0.5s infinite;
        }
        .game-over-panel {
          animation: panelScale 0.4s ease-out;
        }
        @media (max-width: 768px) {
          .game-container {
            flex-direction: column !important;
          }
          .rune-bar {
            width: 100% !important;
            flex-direction: row !important;
            padding: 12px !important;
            min-height: auto !important;
          }
          .game-board-container {
            width: 100% !important;
          }
        }
      `}</style>

      <div style={{
        backgroundColor: '#3E2723',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <span style={{ opacity: 0.7, fontSize: 14 }}>波次</span>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{wave}</div>
          </div>
          <div>
            <span style={{ opacity: 0.7, fontSize: 14 }}>怪物</span>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>
              {monsters.filter(m => m.status === 'alive').length}
            </div>
          </div>
          <div>
            <span style={{ opacity: 0.7, fontSize: 14 }}>生命</span>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: health <= 3 ? '#E74C3C' : 'white' }}>
              {'❤️'.repeat(Math.max(0, health))}
            </div>
          </div>
          <div>
            <span style={{ opacity: 0.7, fontSize: 14 }}>得分</span>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#FFD700' }}>{score}</div>
          </div>
          <div>
            <span style={{ opacity: 0.7, fontSize: 14 }}>击杀</span>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{kills}</div>
          </div>
        </div>
        <div style={{
          padding: '8px 16px',
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: 8,
          fontSize: 18,
          fontWeight: 'bold',
          minWidth: 100,
          textAlign: 'center',
        }}>
          {wave === 0 ? '准备中...' : `下一波: ${Math.ceil(nextWaveTime / 1000)}s`}
        </div>
        {doubleEffect && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#FFD700',
            color: '#000',
            borderRadius: 8,
            fontWeight: 'bold',
            animation: 'borderFlash 0.5s infinite',
          }}>
            ⚡ 效果翻倍! {Math.ceil((doubleEffectEndTime - performance.now()) / 1000)}s
          </div>
        )}
      </div>

      <div className="game-container" style={{ display: 'flex', padding: 20, gap: 20 }}>
        <div className="game-board-container" style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            position: 'relative',
            width: MAZE_SIZE * CELL_SIZE,
            maxWidth: '100%',
            margin: '0 auto',
            border: '4px solid #4A235A',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 0 30px rgba(74, 35, 90, 0.5)',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${MAZE_SIZE}, 1fr)`,
              aspectRatio: '1',
            }}>
              {Array.from({ length: MAZE_SIZE }).map((_, y) =>
                Array.from({ length: MAZE_SIZE }).map((_, x) => renderCell(x, y))
              )}
            </div>
            {renderMonsters()}
          </div>
          <div style={{ textAlign: 'center', marginTop: 16, opacity: 0.7, fontSize: 14 }}>
            点击通道格子放置符文 · 从入口(蓝色)到宝箱(金色)防守
          </div>
        </div>

        <div 
          className={`rune-bar ${doubleEffect ? 'double-effect-active' : ''}`}
          style={{
            width: 240,
            minWidth: 240,
            backgroundColor: '#4A235A',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            minHeight: 'fit-content',
            transition: 'box-shadow 0.3s',
          }}
        >
          <h3 style={{ margin: 0, textAlign: 'center', fontSize: 18 }}>符文栏</h3>
          
          {(['fire', 'ice', 'lightning'] as RuneType[]).map(type => {
            const config = RUNE_CONFIG[type];
            const isSelected = selectedRune === type;
            const count = inventory[type];

            return (
              <div
                key={type}
                onClick={() => count > 0 && setSelectedRune(isSelected ? null : type)}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
                  border: `2px solid ${isSelected ? config.color : 'transparent'}`,
                  cursor: count > 0 ? 'pointer' : 'not-allowed',
                  opacity: count > 0 ? 1 : 0.5,
                  transition: 'all 0.2s',
                }}
                className={count > 0 ? 'hover:brightness-110' : ''}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    backgroundColor: config.color,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    boxShadow: `0 0 15px ${config.color}`,
                  }} className="rune-glow">
                    {type === 'fire' ? '🔥' : type === 'ice' ? '❄️' : '⚡'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 14 }}>{config.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>{config.description}</div>
                    <div style={{ fontSize: 11, marginTop: 2 }}>
                      伤害: {config.damage} | 射程: {config.range}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: config.color,
                    minWidth: 30,
                    textAlign: 'right',
                  }}>
                    {count}
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.6 }}>
              <div>💡 提示:</div>
              <div>• 火焰符文: 高伤害近战</div>
              <div>• 冰冻符文: 减速敌人</div>
              <div>• 闪电符文: 链式攻击</div>
              <div style={{ marginTop: 8, color: '#FFD700' }}>
                ⭐ 50分解锁双倍效果!
              </div>
            </div>
          </div>
        </div>
      </div>

      {isGameOver && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20,
        }}>
          <div className="game-over-panel" style={{
            backgroundColor: 'white',
            color: '#333',
            padding: 40,
            borderRadius: 16,
            textAlign: 'center',
            maxWidth: 400,
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <h2 style={{ margin: 0, marginBottom: 20, fontSize: 28, color: '#E74C3C' }}>
              游戏结束
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30 }}>
              <div style={{ fontSize: 16 }}>
                最终得分: <span style={{ fontSize: 32, fontWeight: 'bold', color: '#FFD700' }}>{score}</span>
              </div>
              <div style={{ fontSize: 16 }}>
                击杀怪物: <span style={{ fontWeight: 'bold', color: '#E74C3C' }}>{kills}</span> 只
              </div>
              <div style={{ fontSize: 16 }}>
                到达波次: <span style={{ fontWeight: 'bold', color: '#4A235A' }}>{wave}</span>
              </div>
            </div>
            <button
              onClick={initGame}
              style={{
                padding: '14px 40px',
                fontSize: 18,
                fontWeight: 'bold',
                backgroundColor: '#4A235A',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              className="hover:brightness-110"
            >
              再来一局
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
