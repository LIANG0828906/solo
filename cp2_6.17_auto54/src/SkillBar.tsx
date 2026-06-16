import { useState, useEffect } from 'react';
import { useGameStore } from './gameStore';
import { SkillType } from './types';

interface SkillButtonProps {
  skill: {
    id: SkillType;
    name: string;
    key: string;
    cooldown: number;
    currentCooldown: number;
    energyCost: number;
    description: string;
    color: string;
  };
  onUse: () => void;
  canUse: boolean;
  index: number;
}

function SkillButton({ skill, onUse, canUse, index }: SkillButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cooldownPercent = skill.currentCooldown > 0 ? (skill.currentCooldown / skill.cooldown) * 100 : 0;

  const skillEmojis: Record<SkillType, string> = {
    slow: '❄️',
    shockwave: '💥',
  };

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 10,
            width: 160,
            padding: 10,
            backgroundColor: '#1A252F',
            borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 100,
            pointerEvents: 'none',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 'bold',
              color: skill.color,
              marginBottom: 6,
            }}
          >
            {skill.name}
          </div>
          <div style={{ fontSize: 12, color: '#BDC3C7', marginBottom: 6 }}>
            {skill.description}
          </div>
          <div style={{ fontSize: 11, color: '#7F8C8D' }}>
            消耗：{skill.energyCost} 能量 | 冷却：{skill.cooldown}秒
          </div>
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              border: '6px solid transparent',
              borderTopColor: '#1A252F',
            }}
          />
        </div>
      )}

      <button
        onClick={onUse}
        disabled={!canUse}
        style={{
          width: 48,
          height: 48,
          borderRadius: 6,
          border: `2px solid ${canUse ? skill.color : '#7F8C8D'}`,
          backgroundColor: '#1A252F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: canUse ? 'pointer' : 'not-allowed',
          fontSize: 28,
          position: 'relative',
          overflow: 'hidden',
          transform: isHovered && canUse ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          boxShadow: canUse ? `0 0 10px ${skill.color}40` : 'none',
        }}
      >
        <span style={{ filter: canUse ? 'none' : 'grayscale(100%)', opacity: canUse ? 1 : 0.5 }}>
          {skillEmojis[skill.id]}
        </span>
        
        {skill.currentCooldown > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              height: `${cooldownPercent}%`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>
              {Math.ceil(skill.currentCooldown)}s
            </span>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: skill.color,
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #2C3E50',
          }}
        >
          {skill.key}
        </div>
      </button>

      <div
        style={{
          textAlign: 'center',
          marginTop: 4,
          fontSize: 11,
          color: '#BDC3C7',
        }}
      >
        [{index + 1}] {skill.name}
      </div>
    </div>
  );
}

export default function SkillBar() {
  const { players, currentPlayerId, useSkill, mousePos } = useGameStore();

  const currentPlayer = players.find(p => p.id === currentPlayerId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentPlayer) return;
      
      if (e.key.toLowerCase() === 'q') {
        handleUseSkill('slow');
      } else if (e.key.toLowerCase() === 'e') {
        handleUseSkill('shockwave');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPlayer, mousePos]);

  const handleUseSkill = (skillId: SkillType) => {
    if (!currentPlayer) return;
    
    const skill = currentPlayer.skills.find(s => s.id === skillId);
    if (!skill || skill.currentCooldown > 0 || currentPlayer.energy < skill.energyCost) return;

    useSkill(currentPlayer.id, skillId, mousePos.x, mousePos.y);
  };

  const canUseSkill = (skillId: SkillType): boolean => {
    if (!currentPlayer) return false;
    const skill = currentPlayer.skills.find(s => s.id === skillId);
    if (!skill) return false;
    return skill.currentCooldown <= 0 && currentPlayer.energy >= skill.energyCost;
  };

  return (
    <div
      style={{
        height: 80,
        backgroundColor: '#2C3E50',
        border: '1px solid #7F8C8D',
        borderTop: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
        padding: '0 24px',
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
      }}
    >
      {currentPlayer?.skills.map((skill, index) => (
        <SkillButton
          key={skill.id}
          skill={skill}
          onUse={() => handleUseSkill(skill.id)}
          canUse={canUseSkill(skill.id)}
          index={index}
        />
      ))}

      <div style={{ marginLeft: 30, color: '#7F8C8D', fontSize: 12 }}>
        提示：点击格子移动，按 Q/E 释放技能
      </div>
    </div>
  );
}
