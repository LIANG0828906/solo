
import React from 'react';
import type { Unit, Skill, BattleLog, Buff } from '../../server/battleEngine';

interface InfoPanelProps {
  selectedUnit: Unit | null;
  currentUnit: Unit | null;
  logs: BattleLog[];
  round: number;
  turnOrder: Unit[];
  selectedSkill: Skill | null;
  onSkillSelect: (skill: Skill | null) => void;
  onEndTurn: () => void;
  gameOver: boolean;
  winner?: 'player' | 'enemy';
  onRestart: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({
  selectedUnit,
  currentUnit,
  logs,
  round,
  turnOrder,
  selectedSkill,
  onSkillSelect,
  onEndTurn,
  gameOver,
  winner,
  onRestart,
}) => {
  const getLogColor = (type: string) => {
    switch (type) {
      case 'player': return 'text-green-400 border-l-green-500';
      case 'enemy': return 'text-red-400 border-l-red-500';
      case 'system': return 'text-amber-400 border-l-amber-500';
      default: return 'text-gray-400 border-l-gray-500';
    }
  };

  const getSkillTypeLabel = (type: string) => {
    switch (type) {
      case 'damage': return '伤害';
      case 'heal': return '治疗';
      case 'shield': return '护盾';
      case 'buff': return '增益';
      default: return type;
    }
  };

  const getSkillTypeColor = (type: string) => {
    switch (type) {
      case 'damage': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'heal': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'shield': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'buff': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="bg-gradient-to-br from-indigo-900/90 to-indigo-950/90 rounded-2xl p-4 shadow-xl border border-indigo-500/30">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-amber-400">⚔️ 战斗信息</h2>
          <div className="px-3 py-1 bg-amber-500/20 rounded-full border border-amber-500/30">
            <span className="text-amber-300 font-semibold text-sm">第 {round} 回合</span>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="text-xs text-indigo-300 mb-2">行动顺序</div>
          <div className="flex gap-1 flex-wrap">
            {turnOrder.map((unit, index) => (
              <div
                key={unit.id}
                className={`relative w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all duration-200
                  ${currentUnit?.id === unit.id 
                    ? 'bg-amber-500 ring-2 ring-amber-300 scale-110 z-10' 
                    : unit.faction === 'player' 
                      ? 'bg-blue-600/70' 
                      : 'bg-red-600/70'
                  }
                  ${unit.hp <= 0 ? 'opacity-30 grayscale' : ''}
                `}
                title={`${unit.name} (速度: ${unit.speed})`}
              >
                <span className="text-xs">{index + 1}</span>
                {currentUnit?.id === unit.id && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>

        {currentUnit && !gameOver && (
          <div className="p-3 bg-indigo-800/50 rounded-xl border border-indigo-600/30">
            <div className="text-xs text-indigo-300 mb-1">当前行动</div>
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl
                ${currentUnit.faction === 'player' ? 'bg-blue-600' : 'bg-red-600'}`}
              >
                {currentUnit.faction === 'player' ? '⚔️' : '👹'}
              </div>
              <div>
                <div className="font-bold text-white">{currentUnit.name}</div>
                <div className="text-xs text-indigo-300">
                  {currentUnit.faction === 'player' ? '我方单位' : '敌方单位'}
                </div>
              </div>
            </div>
            {currentUnit.faction === 'player' && (
              <button
                onClick={onEndTurn}
                className="mt-3 w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 
                  text-white font-semibold rounded-lg transition-all duration-200 
                  active:scale-95 shadow-lg shadow-amber-500/30"
              >
                结束回合
              </button>
            )}
          </div>
        )}

        {gameOver && (
          <div className="p-4 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-xl border border-amber-500/40 text-center">
            <div className="text-2xl mb-2">🏆</div>
            <div className="text-xl font-bold text-amber-400 mb-2">战斗结束</div>
            <div className="text-white mb-3">
              {winner === 'player' ? '🎉 我方获胜！' : '💀 敌方获胜！'}
            </div>
            <button
              onClick={onRestart}
              className="w-full py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 
                text-white font-semibold rounded-lg transition-all duration-200 
                active:scale-95 shadow-lg shadow-indigo-500/30"
            >
              重新开始
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-4 shadow-xl border border-slate-600/30 overflow-hidden flex flex-col">
        <h3 className="text-lg font-bold text-amber-400 mb-3">📋 单位详情</h3>
        
        {selectedUnit ? (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-600/30">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-lg
                ${selectedUnit.faction === 'player' 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-700' 
                  : 'bg-gradient-to-br from-red-500 to-red-700'}`}
              >
                {selectedUnit.faction === 'player' ? '⚔️' : '👹'}
              </div>
              <div>
                <div className="font-bold text-white text-lg">{selectedUnit.name}</div>
                <div className={`text-sm ${selectedUnit.faction === 'player' ? 'text-blue-400' : 'text-red-400'}`}>
                  {selectedUnit.faction === 'player' ? '我方单位' : '敌方单位'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">生命值</span>
                  <span className="text-white font-medium">{selectedUnit.hp} / {selectedUnit.maxHp}</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 
                      ${selectedUnit.hp / selectedUnit.maxHp > 0.5 
                        ? 'bg-gradient-to-r from-green-400 to-green-500' 
                        : selectedUnit.hp / selectedUnit.maxHp > 0.25 
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                          : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                    style={{ width: `${(selectedUnit.hp / selectedUnit.maxHp) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-700/50 rounded-lg p-2">
                <div className="text-xs text-slate-400">攻击</div>
                <div className="text-lg font-bold text-orange-400">⚔️ {selectedUnit.attack}</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2">
                <div className="text-xs text-slate-400">防御</div>
                <div className="text-lg font-bold text-blue-400">🛡️ {selectedUnit.defense}</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2">
                <div className="text-xs text-slate-400">速度</div>
                <div className="text-lg font-bold text-green-400">💨 {selectedUnit.speed}</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2">
                <div className="text-xs text-slate-400">移动</div>
                <div className="text-lg font-bold text-purple-400">👟 {selectedUnit.moveRange}</div>
              </div>
            </div>

            {selectedUnit.buffs.length > 0 && (
              <div>
                <div className="text-sm text-slate-400 mb-2">状态效果</div>
                <div className="flex flex-wrap gap-2">
                  {selectedUnit.buffs.map(buff => (
                    <div
                      key={buff.id}
                      className={`px-2 py-1 rounded-lg text-sm border flex items-center gap-1
                        ${buff.type === 'buff' 
                          ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                          : 'bg-red-500/20 text-red-300 border-red-500/30'}`}
                      title={`${buff.name}: ${buff.value} (${buff.duration}回合)`}
                    >
                      <span>{buff.icon}</span>
                      <span className="text-xs">{buff.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-sm text-slate-400 mb-2">技能列表</div>
              <div className="space-y-2">
                {selectedUnit.skills.map(skill => {
                  const isOnCooldown = skill.currentCooldown > 0;
                  const isSelected = selectedSkill?.id === skill.id;
                  const canUse = selectedUnit.faction === 'player' && 
                                 currentUnit?.id === selectedUnit.id && 
                                 !isOnCooldown && 
                                 !selectedUnit.hasActed &&
                                 !gameOver;
                  
                  return (
                    <button
                      key={skill.id}
                      onClick={() => canUse && onSkillSelect(isSelected ? null : skill)}
                      disabled={!canUse}
                      className={`w-full p-2 rounded-xl border text-left transition-all duration-200
                        ${isSelected 
                          ? 'bg-amber-500/30 border-amber-400 ring-2 ring-amber-400/50 scale-[1.02]' 
                          : canUse
                            ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 hover:border-slate-500 cursor-pointer'
                            : 'bg-slate-800/50 border-slate-700 opacity-60 cursor-not-allowed'
                        }
                        ${canUse ? 'active:scale-[0.98]' : ''}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-slate-800/80 flex items-center justify-center text-xl">
                          {skill.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">{skill.name}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded border ${getSkillTypeColor(skill.type)}`}>
                              {getSkillTypeLabel(skill.type)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 truncate">{skill.description}</div>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="text-slate-400">
                          范围: <span className="text-blue-400">{skill.range}</span>
                        </span>
                        <span className="text-slate-400">
                          威力: <span className="text-orange-400">{skill.power}</span>
                        </span>
                        {skill.cooldown > 0 && (
                          <span className="text-slate-400">
                            冷却: <span className={isOnCooldown ? 'text-red-400' : 'text-green-400'}>
                              {isOnCooldown ? `${skill.currentCooldown}回合` : '就绪'}
                            </span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <div className="text-4xl mb-2">👆</div>
              <p>点击单位查看详情</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-4 shadow-xl border border-slate-600/30 h-48 flex flex-col">
        <h3 className="text-lg font-bold text-amber-400 mb-2">📜 战斗日志</h3>
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {logs.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-4">暂无日志</div>
          ) : (
            [...logs].reverse().map((log, index) => (
              <div
                key={log.id}
                className={`text-sm pl-2 border-l-2 py-1 animate-fade-in
                  ${getLogColor(log.type)}`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;

