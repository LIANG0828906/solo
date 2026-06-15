import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { DungeonData, PlacedMonster, PlayerCharacter, AppMode, MonsterEdit, CombatParticipant, CombatAction } from './types';
import { MONSTER_TEMPLATES } from './types';
import { generateDungeon } from './dungeonGen';
import { CombatEngine } from './combatEngine';
import MapView from './components/MapView';
import SidePanel from './components/SidePanel';
import BattleLog from './components/BattleLog';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('generate');
  const [prevMode, setPrevMode] = useState<AppMode>('generate');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [seed, setSeed] = useState('');
  const [dungeon, setDungeon] = useState<DungeonData | null>(null);
  const [monsters, setMonsters] = useState<PlacedMonster[]>([]);
  const [players, setPlayers] = useState<PlayerCharacter[]>([]);
  const [editingMonster, setEditingMonster] = useState<MonsterEdit | null>(null);

  const [combatEngine, setCombatEngine] = useState<CombatEngine | null>(null);
  const [combatParticipants, setCombatParticipants] = useState<CombatParticipant[]>([]);
  const [combatLogs, setCombatLogs] = useState<CombatAction[]>([]);
  const [currentActorId, setCurrentActorId] = useState<string | null>(null);
  const [isBattleRunning, setIsBattleRunning] = useState(false);
  const [isBattlePaused, setIsBattlePaused] = useState(false);
  const [isBattleFinished, setIsBattleFinished] = useState(false);

  const [shakeMap, setShakeMap] = useState(false);
  const [hitEffect, setHitEffect] = useState<{ x: number; y: number } | null>(null);

  const [leftPanelHover, setLeftPanelHover] = useState(false);
  const [rightPanelHover, setRightPanelHover] = useState(false);

  const engineRef = useRef<CombatEngine | null>(null);

  const transitionTo = useCallback((newMode: AppMode) => {
    if (newMode === mode || isTransitioning) return;
    setIsTransitioning(true);
    setPrevMode(mode);
    setTimeout(() => {
      setMode(newMode);
      setTimeout(() => setIsTransitioning(false), 500);
    }, 300);
  }, [mode, isTransitioning]);

  const handleGenerate = useCallback(() => {
    const usedSeed = seed || String(Date.now());
    const data = generateDungeon(usedSeed);
    setDungeon(data);
    setMonsters([]);
    setCombatEngine(null);
    setCombatParticipants([]);
    setCombatLogs([]);
    setCurrentActorId(null);
    setIsBattleRunning(false);
    setIsBattlePaused(false);
    setIsBattleFinished(false);
  }, [seed]);

  const handleDropMonster = useCallback(
    (templateId: string, x: number, y: number) => {
      const template = MONSTER_TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;

      const occupied = monsters.some((m) => m.gridX === x && m.gridY === y);
      const playerOccupied = players.some((p) => p.gridX === x && p.gridY === y);
      if (occupied || playerOccupied) return;

      const monster: PlacedMonster = {
        id: `monster-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        templateId: template.id,
        name: template.name,
        challengeRating: template.challengeRating,
        hp: template.hp,
        maxHp: template.hp,
        ac: template.ac,
        attackDice: template.attackDice,
        icon: template.icon,
        gridX: x,
        gridY: y,
      };
      setMonsters((prev) => [...prev, monster]);
    },
    [monsters, players]
  );

  const handleMonsterDoubleClick = useCallback((monsterId: string) => {
    const monster = monsters.find((m) => m.id === monsterId);
    if (!monster) return;
    setEditingMonster({
      monsterId: monster.id,
      hp: monster.hp,
      maxHp: monster.maxHp,
      ac: monster.ac,
      attackDice: monster.attackDice,
    });
  }, [monsters]);

  const handleSaveMonsterEdit = useCallback(() => {
    if (!editingMonster) return;
    setMonsters((prev) =>
      prev.map((m) =>
        m.id === editingMonster.monsterId
          ? { ...m, hp: editingMonster.hp, maxHp: editingMonster.maxHp, ac: editingMonster.ac, attackDice: editingMonster.attackDice }
          : m
      )
    );
    setEditingMonster(null);
  }, [editingMonster]);

  const handleAddPlayer = useCallback((player: PlayerCharacter) => {
    setPlayers((prev) => {
      if (prev.length >= 6) return prev;
      if (!dungeon) return [...prev, player];
      const floorCells: { x: number; y: number }[] = [];
      dungeon.grid.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell.type === 'floor' || cell.type === 'room_entrance') {
            const occupied =
              prev.some((p) => p.gridX === x && p.gridY === y) ||
              monsters.some((m) => m.gridX === x && m.gridY === y);
            if (!occupied) floorCells.push({ x, y });
          }
        });
      });
      const pos = floorCells[Math.floor(Math.random() * floorCells.length)] || { x: 0, y: 0 };
      return [...prev, { ...player, gridX: pos.x, gridY: pos.y }];
    });
  }, [dungeon, monsters]);

  const handleRemovePlayer = useCallback((id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleStartBattle = useCallback(() => {
    if (monsters.length === 0 || players.length === 0) return;

    const engine = new CombatEngine(monsters, players);
    engineRef.current = engine;

    engine.on('combatStart', () => {
      setIsBattleRunning(true);
      setIsBattlePaused(false);
      setIsBattleFinished(false);
      setCombatParticipants(engine.getParticipants());
    });

    engine.on('action', (action: unknown) => {
      const a = action as CombatAction;
      setCombatLogs((prev) => [...prev, a]);
      setCombatParticipants(engine.getParticipants());
      setCurrentActorId(a.actorId);

      if (a.hit && a.damage > 0) {
        setShakeMap(true);
        setHitEffect({ x: 0, y: 0 });
        const target = engine.getParticipants().find(p => p.id === a.targetId);
        if (target) {
          setHitEffect({ x: target.gridX, y: target.gridY });
        }
        setTimeout(() => {
          setShakeMap(false);
          setHitEffect(null);
        }, 300);
      }
    });

    engine.on('combatEnd', () => {
      setIsBattleFinished(true);
      setIsBattleRunning(false);
      setCombatParticipants(engine.getParticipants());
    });

    engine.start();
    setCombatEngine(engine);
    engine.startAuto(1500);
    setIsBattleRunning(true);
  }, [monsters, players]);

  const handlePauseBattle = useCallback(() => {
    engineRef.current?.pause();
    setIsBattlePaused(true);
  }, []);

  const handleResumeBattle = useCallback(() => {
    engineRef.current?.resume();
    setIsBattlePaused(false);
  }, []);

  const handleStepForward = useCallback(() => {
    engineRef.current?.nextTurn();
  }, []);

  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.pause();
      }
    };
  }, []);

  const canStartBattle = monsters.length > 0 && players.length > 0;

  return (
    <div className="app-container h-screen w-screen overflow-hidden flex flex-col">
      <header className="app-header flex items-center justify-between px-4 py-2 border-b border-amber-900/40">
        <div className="flex items-center gap-3">
          <h1 className="font-medieval text-amber-300 text-lg tracking-widest">🏰 地牢主持人工具</h1>
        </div>
        <nav className="flex items-center gap-2">
          {(['generate', 'place', 'battle'] as AppMode[]).map((m) => (
            <button
              key={m}
              className={`mode-btn px-3 py-1.5 rounded text-xs font-bold transition-all duration-200 border btn-press ${
                mode === m
                  ? 'bg-amber-900/60 border-amber-600/50 text-amber-200'
                  : 'bg-stone-900/40 border-amber-900/20 text-amber-200/50 hover:text-amber-200/80 hover:border-amber-700/30'
              }`}
              onClick={() => transitionTo(m)}
              disabled={m === 'battle' && !canStartBattle}
            >
              {m === 'generate' ? '🗺️ 地牢生成' : m === 'place' ? '👹 怪物放置' : '⚔️ 战斗模拟'}
            </button>
          ))}
        </nav>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div
          className={`left-panel ${leftPanelHover ? 'panel-active' : ''}`}
          onMouseEnter={() => setLeftPanelHover(true)}
          onMouseLeave={() => setLeftPanelHover(false)}
        >
          {mode === 'generate' && (
            <div className="p-4 space-y-3">
              <h3 className="text-amber-300 font-medieval text-sm tracking-wider">🗺️ 地牢生成</h3>
              <div>
                <label className="text-amber-200/60 text-xs block mb-1">种子值</label>
                <input
                  type="text"
                  className="w-full bg-stone-800/80 border border-amber-900/30 rounded px-3 py-1.5 text-sm text-amber-200 placeholder-amber-200/30 focus:outline-none focus:border-amber-500/50"
                  placeholder="输入种子（留空随机）"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                />
              </div>
              <button
                className="w-full bg-amber-900/50 hover:bg-amber-800/50 border border-amber-600/40 rounded py-2 text-amber-200 font-bold text-sm transition-colors btn-press"
                onClick={handleGenerate}
              >
                ⚡ 生成地牢
              </button>
              {dungeon && (
                <div className="text-amber-200/40 text-[10px] font-mono">
                  种子哈希: {dungeon.seedHash}
                </div>
              )}
              {dungeon && (
                <div className="space-y-1 text-[10px] text-amber-200/50">
                  <div>房间数: {dungeon.rooms.length}</div>
                  <div>网格: {dungeon.grid[0].length}×{dungeon.grid.length}</div>
                </div>
              )}
            </div>
          )}
          {(mode === 'place' || mode === 'battle') && (
            <SidePanel
              mode={mode}
              monsters={monsters}
              players={players}
              onAddPlayer={handleAddPlayer}
              onRemovePlayer={handleRemovePlayer}
              onStartBattle={handleStartBattle}
              onPauseBattle={handlePauseBattle}
              onResumeBattle={handleResumeBattle}
              onStepForward={handleStepForward}
              isBattleRunning={isBattleRunning}
              isBattlePaused={isBattlePaused}
              isBattleFinished={isBattleFinished}
            />
          )}
        </div>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className={`cube-transition ${isTransitioning ? 'cube-rotating' : ''}`}>
            <div className="flex-1 flex items-center justify-center overflow-auto p-4">
              {mode === 'battle' && combatParticipants.length > 0 && (
                <div className="initiative-bar mb-3">
                  {combatParticipants.map((p) => (
                    <div
                      key={p.id}
                      className={`initiative-slot ${
                        currentActorId === p.id ? 'active-slot' : ''
                      } ${p.type === 'player' ? 'player-slot' : 'monster-slot'}`}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2"
                        style={{
                          backgroundColor: p.color + '33',
                          borderColor: p.color,
                        }}
                      >
                        {p.type === 'monster' ? p.icon : p.name.charAt(0)}
                      </div>
                      <span className="text-[10px] text-amber-200/80 truncate max-w-[50px]">
                        {p.name}
                      </span>
                      <span className="text-[9px] text-amber-200/40">{p.initiative}</span>
                    </div>
                  ))}
                </div>
              )}
              <MapView
                dungeon={dungeon}
                monsters={monsters}
                players={players}
                mode={mode}
                onDropMonster={handleDropMonster}
                onMonsterDoubleClick={handleMonsterDoubleClick}
                currentActorId={currentActorId}
                combatParticipants={combatParticipants}
                shakeMap={shakeMap}
                hitEffect={hitEffect}
              />
            </div>
          </div>

          {mode === 'battle' && (
            <div className="h-40 border-t border-amber-900/40 bg-stone-950/60 backdrop-blur-sm">
              <BattleLog logs={combatLogs} />
            </div>
          )}
        </main>

        <div
          className={`right-panel ${rightPanelHover ? 'panel-active' : ''}`}
          onMouseEnter={() => setRightPanelHover(true)}
          onMouseLeave={() => setRightPanelHover(false)}
        >
          {mode === 'place' && (
            <SidePanel
              mode={mode}
              monsters={monsters}
              players={players}
              onAddPlayer={handleAddPlayer}
              onRemovePlayer={handleRemovePlayer}
              onStartBattle={handleStartBattle}
              onPauseBattle={handlePauseBattle}
              onResumeBattle={handleResumeBattle}
              onStepForward={handleStepForward}
              isBattleRunning={isBattleRunning}
              isBattlePaused={isBattlePaused}
              isBattleFinished={isBattleFinished}
            />
          )}
          {mode !== 'place' && mode !== 'battle' && (
            <div className="p-3">
              <h3 className="text-amber-300/50 font-medieval text-xs tracking-wider mb-2">提示</h3>
              <p className="text-amber-200/30 text-[10px] leading-relaxed">
                生成地牢后，切换到"怪物放置"模式从右侧图鉴拖拽怪物到地图上
              </p>
            </div>
          )}
          {dungeon && (
            <div className="absolute bottom-2 right-2 text-amber-200/30 text-[10px] font-mono">
              #{dungeon.seedHash}
            </div>
          )}
        </div>
      </div>

      {editingMonster && (
        <div className="modal-overlay" onClick={() => setEditingMonster(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-amber-300 font-medieval text-sm mb-3 tracking-wider">
              ✏️ 编辑怪物属性
            </h3>
            <div className="space-y-2">
              <div>
                <label className="text-amber-200/60 text-xs block mb-1">当前 HP</label>
                <input
                  type="number"
                  className="w-full bg-stone-800/80 border border-amber-900/30 rounded px-3 py-1.5 text-sm text-amber-200 focus:outline-none focus:border-amber-500/50"
                  value={editingMonster.hp}
                  onChange={(e) =>
                    setEditingMonster({ ...editingMonster, hp: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label className="text-amber-200/60 text-xs block mb-1">最大 HP</label>
                <input
                  type="number"
                  className="w-full bg-stone-800/80 border border-amber-900/30 rounded px-3 py-1.5 text-sm text-amber-200 focus:outline-none focus:border-amber-500/50"
                  value={editingMonster.maxHp}
                  onChange={(e) =>
                    setEditingMonster({ ...editingMonster, maxHp: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
              <div>
                <label className="text-amber-200/60 text-xs block mb-1">AC（护甲等级）</label>
                <input
                  type="number"
                  className="w-full bg-stone-800/80 border border-amber-900/30 rounded px-3 py-1.5 text-sm text-amber-200 focus:outline-none focus:border-amber-500/50"
                  value={editingMonster.ac}
                  onChange={(e) =>
                    setEditingMonster({ ...editingMonster, ac: parseInt(e.target.value) || 10 })
                  }
                />
              </div>
              <div>
                <label className="text-amber-200/60 text-xs block mb-1">攻击骰</label>
                <input
                  type="text"
                  className="w-full bg-stone-800/80 border border-amber-900/30 rounded px-3 py-1.5 text-sm text-amber-200 focus:outline-none focus:border-amber-500/50"
                  value={editingMonster.attackDice}
                  onChange={(e) =>
                    setEditingMonster({ ...editingMonster, attackDice: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 bg-amber-900/50 hover:bg-amber-800/50 border border-amber-600/40 rounded py-1.5 text-amber-200 text-sm font-bold transition-colors btn-press"
                onClick={handleSaveMonsterEdit}
              >
                保存
              </button>
              <button
                className="flex-1 bg-stone-800/50 hover:bg-stone-700/50 border border-amber-900/30 rounded py-1.5 text-amber-200/60 text-sm transition-colors btn-press"
                onClick={() => setEditingMonster(null)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
