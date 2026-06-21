import React, { useState, useMemo } from 'react';
import type { Unit, UnitType } from '../types';
import { UNIT_ICONS, UNIT_COLORS, UNIT_SKILLS } from '../data/units';
import { useGameStore } from '../store/useGameStore';
import { Sword, Zap, Heart, Clock } from 'lucide-react';

interface UnitCardProps {
  unit: Unit | UnitType;
  selected?: boolean;
  onClick?: () => void;
  showDetails?: boolean;
}

function isUnitInstance(u: Unit | UnitType): u is Unit {
  return typeof u !== 'string';
}

export const UnitCard: React.FC<UnitCardProps> = React.memo(
  ({ unit, selected = false, onClick, showDetails = false }) => {
    const [showPopup, setShowPopup] = useState(false);
    const { animationState } = useGameStore();

    const unitData = useMemo(() => {
      if (isUnitInstance(unit)) {
        return {
          type: unit.type,
          name: unit.name,
          health: unit.health,
          maxHealth: unit.maxHealth,
          attack: unit.attack,
          skillCooldown: unit.skillCooldown,
          currentCooldown: unit.currentCooldown,
          skillTriggered: unit.skillTriggered,
          isDead: unit.health <= 0,
          id: unit.id,
        };
      }
      const preset = {
        warrior: { name: '战士', health: 120, maxHealth: 120, attack: 25, skillCooldown: 3 },
        mage: { name: '法师', health: 70, maxHealth: 70, attack: 40, skillCooldown: 2 },
        archer: { name: '射手', health: 90, maxHealth: 90, attack: 30, skillCooldown: 2 },
      }[unit];
      return {
        type: unit,
        name: preset.name,
        health: preset.health,
        maxHealth: preset.maxHealth,
        attack: preset.attack,
        skillCooldown: preset.skillCooldown,
        currentCooldown: 0,
        skillTriggered: 0,
        isDead: false,
        id: null,
      };
    }, [unit]);

    const isAnimating = useMemo(() => {
      if (!unitData.id) return false;
      return (
        animationState.sourceUnitId === unitData.id ||
        animationState.targetUnitId === unitData.id
      );
    }, [animationState, unitData.id]);

    const animationClass = useMemo(() => {
      if (!isAnimating) return '';
      if (animationState.sourceUnitId === unitData.id) {
        return animationState.type === 'skill' ? 'attack-animation' : 'attack-animation';
      }
      return 'attack-animation';
    }, [isAnimating, animationState, unitData.id]);

    const skill = UNIT_SKILLS[unitData.type];
    const icon = UNIT_ICONS[unitData.type];
    const color = UNIT_COLORS[unitData.type];

    return (
      <div className="relative">
        <div
          className={`unit-card ${selected ? 'selected' : ''} ${unitData.isDead ? 'dead' : ''} ${animationClass}`}
          onClick={onClick}
          onMouseEnter={() => showDetails && setShowPopup(true)}
          onMouseLeave={() => setShowPopup(false)}
        >
          {animationState.type === 'skill' && animationState.sourceUnitId === unitData.id && (
            <div className="skill-wave w-full h-full" />
          )}
          
          <div 
            className="text-4xl mb-2"
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          >
            {icon}
          </div>
          
          <div className="text-sm font-bold mb-1">{unitData.name}</div>
          
          <div className="w-full space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-400" />
                <span>{unitData.health}/{unitData.maxHealth}</span>
              </div>
              <div className="flex items-center gap-1">
                <Sword className="w-3 h-3 text-yellow-400" />
                <span>{unitData.attack}</span>
              </div>
            </div>
            
            {unitData.id && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-400" />
                  <span>{unitData.currentCooldown}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-purple-400" />
                  <span>{unitData.skillTriggered}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="w-full h-1 bg-black/30 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(unitData.health / unitData.maxHealth) * 100}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>

        {showPopup && (
          <div className="absolute z-20 left-1/2 -translate-x-1/2 bottom-full mb-2 w-60 p-4 glass-card pointer-events-none">
            <div className="text-center">
              <div className="text-3xl mb-2">{icon}</div>
              <div className="font-bold text-lg mb-2">{unitData.name}</div>
              <div className="text-xs text-white/70 space-y-1 text-left">
                <div className="flex justify-between">
                  <span>攻击力</span>
                  <span className="text-yellow-400">{unitData.attack}</span>
                </div>
                <div className="flex justify-between">
                  <span>生命值</span>
                  <span className="text-red-400">{unitData.health}/{unitData.maxHealth}</span>
                </div>
                <div className="flex justify-between">
                  <span>技能冷却</span>
                  <span className="text-blue-400">{unitData.skillCooldown}回合</span>
                </div>
                <div className="pt-2 border-t border-white/10 mt-2">
                  <div className="text-purple-400 font-bold">{skill.name}</div>
                  <div className="text-white/60">{skill.description}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

UnitCard.displayName = 'UnitCard';
