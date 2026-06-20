import React from 'react';
import { Creature, getElementColor } from '../creatures';
import { useGameStore } from '../store';

interface CreatureDetailProps {
  creature: Creature;
  onClose: () => void;
}

const CreatureDetail: React.FC<CreatureDetailProps> = ({ creature, onClose }) => {
  const { gold, upgradeTeamCreature, team, level } = useGameStore();
  const elementColor = getElementColor(creature.element);
  
  const upgradeCost = creature.cost * creature.level;
  const canUpgrade = gold >= upgradeCost;
  
  const position = team.findIndex(c => c?.id === creature.id);
  const isInTeam = position !== -1;

  const handleUpgrade = () => {
    if (isInTeam && canUpgrade) {
      upgradeTeamCreature(position);
    }
  };

  const elementNames: Record<string, string> = {
    fire: '火系',
    ice: '冰系',
    thunder: '雷系',
    dark: '暗系',
    light: '光系',
    wind: '风系',
    earth: '土系',
    water: '水系',
    poison: '毒系',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="relative w-[400px] rounded-2xl p-6 animate-scale-in"
        style={{
          background: 'linear-gradient(180deg, #1a1a3a 0%, #0a0a2a 100%)',
          border: `2px solid ${elementColor}`,
          boxShadow: `0 0 60px ${elementColor}40, inset 0 0 40px ${elementColor}10`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div
            className="text-6xl mb-3"
            style={{
              filter: `drop-shadow(0 0 20px ${elementColor})`,
            }}
          >
            {creature.emoji}
          </div>
          <h2 className="text-2xl font-bold" style={{ color: elementColor }}>
            {creature.name}
          </h2>
          <div className="flex justify-center gap-2 mt-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{
                background: `${elementColor}30`,
                color: elementColor,
                border: `1px solid ${elementColor}60`,
              }}
            >
              {elementNames[creature.element]}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-700 text-gray-300">
              Lv.{creature.level}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-red-900/20 border border-red-600/30">
            <div className="text-xs text-gray-400 mb-1">生命值</div>
            <div className="text-xl font-bold text-red-400">❤️ {creature.maxHp}</div>
          </div>
          <div className="p-3 rounded-xl bg-orange-900/20 border border-orange-600/30">
            <div className="text-xs text-gray-400 mb-1">攻击力</div>
            <div className="text-xl font-bold text-orange-400">⚔️ {creature.attack}</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-900/20 border border-blue-600/30">
            <div className="text-xs text-gray-400 mb-1">防御力</div>
            <div className="text-xl font-bold text-blue-400">🛡️ {creature.defense}</div>
          </div>
          <div className="p-3 rounded-xl bg-green-900/20 border border-green-600/30">
            <div className="text-xs text-gray-400 mb-1">速度</div>
            <div className="text-xl font-bold text-green-400">💨 {creature.speed}</div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div
            className="p-3 rounded-xl"
            style={{
              background: `${elementColor}10`,
              border: `1px solid ${elementColor}40`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">✨</span>
              <span className="font-bold" style={{ color: elementColor }}>
                主技能：{creature.mainSkill.name}
              </span>
            </div>
            <p className="text-sm text-gray-300">{creature.mainSkill.description}</p>
            <div className="flex gap-3 mt-2 text-xs text-gray-400">
              <span>伤害：{creature.mainSkill.damage}</span>
              <span>冷却：{creature.mainSkill.cooldown}回合</span>
              <span>范围：{creature.mainSkill.range}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-600/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🌟</span>
              <span className="font-bold text-gray-300">
                被动：{creature.passiveSkill.name}
              </span>
            </div>
            <p className="text-sm text-gray-400">{creature.passiveSkill.description}</p>
          </div>

          {creature.equippedSkills.length > 0 && (
            <div className="p-3 rounded-xl bg-purple-900/20 border border-purple-600/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💎</span>
                <span className="font-bold text-purple-300">
                  已装备技能 ({creature.equippedSkills.length}/{level})
                </span>
              </div>
              <div className="space-y-1">
                {creature.equippedSkills.map((skill, index) => (
                  <div key={index} className="text-sm text-gray-400">
                    • {skill.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {isInTeam && !creature.isEnemy && (
          <button
            onClick={handleUpgrade}
            disabled={!canUpgrade}
            className="w-full py-3 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: canUpgrade
                ? 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)'
                : 'linear-gradient(135deg, #555 0%, #777 100%)',
              color: '#1a1a1a',
              boxShadow: canUpgrade
                ? '0 4px 20px rgba(212, 175, 55, 0.5)'
                : 'none',
            }}
          >
            升级 (💰{upgradeCost})
          </button>
        )}
      </div>

      <style>{`
        @keyframes scale-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CreatureDetail;
