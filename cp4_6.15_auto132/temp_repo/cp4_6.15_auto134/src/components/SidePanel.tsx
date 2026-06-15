import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Swords, Play, Pause, SkipForward } from 'lucide-react';
import type { MonsterTemplate, PlacedMonster, PlayerCharacter, AppMode } from '../types';
import { MONSTER_TEMPLATES, PLAYER_CLASSES, PLAYER_COLORS } from '../types';

interface SidePanelProps {
  mode: AppMode;
  monsters: PlacedMonster[];
  players: PlayerCharacter[];
  onAddPlayer: (player: PlayerCharacter) => void;
  onRemovePlayer: (id: string) => void;
  onStartBattle: () => void;
  onPauseBattle: () => void;
  onResumeBattle: () => void;
  onStepForward: () => void;
  isBattleRunning: boolean;
  isBattlePaused: boolean;
  isBattleFinished: boolean;
}

const MonsterCard: React.FC<{ template: MonsterTemplate }> = ({ template }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('monster-template-id', template.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className="monster-card relative cursor-grab active:cursor-grabbing select-none"
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div className={`monster-card-inner ${isFlipped ? 'monster-card-flipped' : ''}`}>
        <div className="monster-card-front flex items-center gap-2 p-2 rounded border border-amber-900/30 bg-stone-900/80 backdrop-blur-sm">
          <span className="text-xl">{template.silhouette}</span>
          <span className="text-amber-200/90 text-xs font-semibold">{template.name}</span>
          <span className="text-amber-400/60 text-[10px] ml-auto">CH {template.challengeRating}</span>
        </div>
        <div className="monster-card-back absolute inset-0 flex flex-col items-center justify-center p-2 rounded border border-amber-700/40 bg-stone-800/95 backdrop-blur-md">
          <span className="text-red-400 text-xs font-bold">❤️ {template.hp}</span>
          <span className="text-amber-300 text-xs">⚔️ {template.attackDice}</span>
          <span className="text-blue-300 text-xs">🛡️ AC {template.ac}</span>
        </div>
      </div>
    </div>
  );
};

const SidePanel: React.FC<SidePanelProps> = ({
  mode,
  monsters,
  players,
  onAddPlayer,
  onRemovePlayer,
  onStartBattle,
  onPauseBattle,
  onResumeBattle,
  onStepForward,
  isBattleRunning,
  isBattlePaused,
  isBattleFinished,
}) => {
  const [expandedCRs, setExpandedCRs] = useState<Set<number>>(new Set([0]));
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerClass, setNewPlayerClass] = useState(PLAYER_CLASSES[0]);
  const [newPlayerHp, setNewPlayerHp] = useState('20');
  const [newPlayerAc, setNewPlayerAc] = useState('14');
  const [newPlayerAttack, setNewPlayerAttack] = useState('1d8+3');

  const crGroups = MONSTER_TEMPLATES.reduce<Record<number, MonsterTemplate[]>>((acc, t) => {
    const cr = t.challengeRating;
    if (!acc[cr]) acc[cr] = [];
    acc[cr].push(t);
    return acc;
  }, {});

  const toggleCR = (cr: number) => {
    setExpandedCRs((prev) => {
      const next = new Set(prev);
      if (next.has(cr)) next.delete(cr);
      else next.add(cr);
      return next;
    });
  };

  const handleAddPlayer = () => {
    if (players.length >= 6) return;
    if (!newPlayerName.trim()) return;

    const player: PlayerCharacter = {
      id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newPlayerName.trim(),
      class: newPlayerClass,
      hp: parseInt(newPlayerHp) || 20,
      maxHp: parseInt(newPlayerHp) || 20,
      ac: parseInt(newPlayerAc) || 14,
      attackDice: newPlayerAttack || '1d8+3',
      initiative: 0,
      gridX: 0,
      gridY: 0,
      color: PLAYER_COLORS[players.length % PLAYER_COLORS.length],
    };
    onAddPlayer(player);
    setNewPlayerName('');
  };

  return (
    <div className="side-panel h-full flex flex-col">
      {mode === 'place' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          <h3 className="text-amber-300 font-medieval text-sm mb-3 tracking-wider">
            👹 怪物图鉴
          </h3>
          {Object.entries(crGroups)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([cr, templates]) => (
              <div key={cr} className="mb-2">
                <button
                  className="flex items-center gap-1 w-full text-amber-400/80 text-xs font-bold mb-1 hover:text-amber-300 transition-colors btn-press"
                  onClick={() => toggleCR(Number(cr))}
                >
                  {expandedCRs.has(Number(cr)) ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                  挑战等级 {cr}
                </button>
                {expandedCRs.has(Number(cr)) && (
                  <div className="space-y-1 ml-2">
                    {templates.map((t) => (
                      <MonsterCard key={t.id} template={t} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          {monsters.length > 0 && (
            <div className="mt-4 pt-3 border-t border-amber-900/30">
              <h4 className="text-amber-200/60 text-xs mb-2">已放置 ({monsters.length})</h4>
              {monsters.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-xs text-amber-200/70 mb-1">
                  <span>{m.icon}</span>
                  <span>{m.name}</span>
                  <span className="text-red-400">({m.hp}/{m.maxHp})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(mode === 'generate' || mode === 'place') && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          <h3 className="text-amber-300 font-medieval text-sm mb-3 tracking-wider">
            ⚔️ 玩家小队
          </h3>
          {players.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-2 p-2 mb-1 rounded border border-amber-900/30 bg-stone-900/60"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white border"
                style={{ backgroundColor: p.color + '33', borderColor: p.color }}
              >
                {p.class.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-amber-200/90 text-xs font-semibold truncate">{p.name}</div>
                <div className="text-amber-200/50 text-[10px]">
                  {p.class} | HP {p.hp} | AC {p.ac} | {p.attackDice}
                </div>
              </div>
              <button
                className="text-red-400/60 hover:text-red-400 transition-colors btn-press"
                onClick={() => onRemovePlayer(p.id)}
              >
                ✕
              </button>
            </div>
          ))}
          {players.length < 6 && (
            <div className="mt-2 p-2 rounded border border-amber-900/20 bg-stone-900/40">
              <div className="flex gap-1 mb-1">
                <input
                  type="text"
                  className="flex-1 bg-stone-800/80 border border-amber-900/30 rounded px-2 py-1 text-xs text-amber-200 placeholder-amber-200/30 focus:outline-none focus:border-amber-500/50"
                  placeholder="角色名"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                />
                <select
                  className="bg-stone-800/80 border border-amber-900/30 rounded px-1 py-1 text-xs text-amber-200 focus:outline-none"
                  value={newPlayerClass}
                  onChange={(e) => setNewPlayerClass(e.target.value)}
                >
                  {PLAYER_CLASSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-1 mb-1">
                <input
                  type="number"
                  className="w-16 bg-stone-800/80 border border-amber-900/30 rounded px-2 py-1 text-xs text-amber-200 focus:outline-none"
                  placeholder="HP"
                  value={newPlayerHp}
                  onChange={(e) => setNewPlayerHp(e.target.value)}
                />
                <input
                  type="number"
                  className="w-16 bg-stone-800/80 border border-amber-900/30 rounded px-2 py-1 text-xs text-amber-200 focus:outline-none"
                  placeholder="AC"
                  value={newPlayerAc}
                  onChange={(e) => setNewPlayerAc(e.target.value)}
                />
                <input
                  type="text"
                  className="flex-1 bg-stone-800/80 border border-amber-900/30 rounded px-2 py-1 text-xs text-amber-200 focus:outline-none"
                  placeholder="攻击骰"
                  value={newPlayerAttack}
                  onChange={(e) => setNewPlayerAttack(e.target.value)}
                />
              </div>
              <button
                className="w-full flex items-center justify-center gap-1 bg-amber-900/40 hover:bg-amber-800/50 border border-amber-700/30 rounded py-1 text-xs text-amber-300 transition-colors btn-press"
                onClick={handleAddPlayer}
              >
                <Plus size={12} /> 添加角色
              </button>
            </div>
          )}
        </div>
      )}

      {mode === 'battle' && (
        <div className="p-3 space-y-2">
          <h3 className="text-amber-300 font-medieval text-sm tracking-wider">
            ⚔️ 战斗控制
          </h3>
          <div className="flex flex-col gap-2">
            {!isBattleRunning && !isBattleFinished && (
              <button
                className="flex items-center justify-center gap-2 bg-red-900/60 hover:bg-red-800/60 border border-red-700/40 rounded py-2 text-sm text-red-200 font-bold transition-colors btn-press"
                onClick={onStartBattle}
              >
                <Swords size={16} /> 开始战斗
              </button>
            )}
            {isBattleRunning && !isBattlePaused && (
              <button
                className="flex items-center justify-center gap-2 bg-amber-900/50 hover:bg-amber-800/50 border border-amber-700/40 rounded py-2 text-sm text-amber-200 transition-colors btn-press"
                onClick={onPauseBattle}
              >
                <Pause size={14} /> 暂停
              </button>
            )}
            {isBattleRunning && isBattlePaused && (
              <button
                className="flex items-center justify-center gap-2 bg-green-900/50 hover:bg-green-800/50 border border-green-700/40 rounded py-2 text-sm text-green-200 transition-colors btn-press"
                onClick={onResumeBattle}
              >
                <Play size={14} /> 继续
              </button>
            )}
            {isBattleRunning && isBattlePaused && (
              <button
                className="flex items-center justify-center gap-2 bg-blue-900/50 hover:bg-blue-800/50 border border-blue-700/40 rounded py-2 text-sm text-blue-200 transition-colors btn-press"
                onClick={onStepForward}
              >
                <SkipForward size={14} /> 单步前进
              </button>
            )}
          </div>
          {players.length > 0 && (
            <div className="mt-3">
              <h4 className="text-amber-200/60 text-xs mb-1">小队成员</h4>
              {players.map((p) => (
                <div key={p.id} className="flex items-center gap-1 text-xs text-amber-200/70 mb-1">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white border"
                    style={{ backgroundColor: p.color + '33', borderColor: p.color }}
                  >
                    {p.class.charAt(0)}
                  </div>
                  <span className="truncate">{p.name}</span>
                  <span className="text-red-400 ml-auto">{p.hp}/{p.maxHp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SidePanel;
