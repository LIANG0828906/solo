import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import type { PlayerId } from '../types';

interface HeroPanelProps {
  heroId: PlayerId;
}

export const HeroPanel: React.FC<HeroPanelProps> = ({ heroId }) => {
  const { hero, currentPlayer, phase, selectedSkill, selectSkill, canUseSkillCheck } = useGameStore(
    useShallow((s) => ({
      hero: s.heroes[heroId],
      currentPlayer: s.currentPlayer,
      phase: s.phase,
      selectedSkill: s.selectedSkill,
      selectSkill: s.selectSkill,
      canUseSkillCheck: (skId: string) => {
        const target = heroId === 'player' ? 'ai' : 'player';
        const sk = s.heroes[heroId].skills.find((x) => x.id === skId);
        if (!sk || sk.currentCooldown > 0) return false;
        if (s.heroes[heroId].hasActed) return false;
        if (s.heroes[heroId].stunned > 0) return false;
        const dist = Math.abs(s.heroes[heroId].position.x - s.heroes[target].position.x) +
          Math.abs(s.heroes[heroId].position.y - s.heroes[target].position.y);
        if (dist > sk.range) return false;
        if (sk.type === 'damage') {
          return s.heroes[heroId].position.x === s.heroes[target].position.x ||
            s.heroes[heroId].position.y === s.heroes[target].position.y;
        }
        return true;
      },
    }))
  );

  const isOwnTurn = currentPlayer === heroId && phase !== 'game_over';
  const bgColor = heroId === 'player' ? '#4A90D9' : '#E74C3C';
  const hpPercent = (hero.currentHp / hero.maxHp) * 100;

  const handleSkillClick = (skillId: string) => {
    if (heroId !== 'player') return;
    if (!isOwnTurn) return;
    const skill = hero.skills.find((s) => s.id === skillId);
    if (!skill) return;
    if (skill.currentCooldown > 0) return;
    if (hero.hasActed) return;
    if (hero.stunned > 0) return;

    if (selectedSkill === skillId) {
      selectSkill(null);
    } else {
      if (canUseSkillCheck(skillId)) {
        selectSkill(skillId);
      }
    }
  };

  return (
    <div
      style={{
        background: '#1E1E2E',
        borderRadius: 12,
        padding: 16,
        color: 'white',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: bgColor,
            border: '2px solid #FFD700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 'bold',
            flexShrink: 0,
          }}
        >
          {heroId === 'player' ? '勇' : '刺'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
            {hero.name}
            {hero.stunned > 0 && (
              <span style={{ marginLeft: 8, color: '#FFD700', fontSize: 12 }}>
                眩晕{hero.stunned}回合
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            攻击力: {hero.attack} | 移动: {hero.hasMoved ? '已移动' : `${hero.moveRange}步`} | 行动: {hero.hasActed ? '已行动' : '可用'}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
          <span>生命值</span>
          <span>{hero.currentHp} / {hero.maxHp}</span>
        </div>
        <div style={{ height: 10, background: '#333', borderRadius: 5, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${hpPercent}%`,
              background: hpPercent > 50 ? '#4CAF50' : hpPercent > 25 ? '#FFC107' : '#F44336',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>技能</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {hero.skills.map((skill) => {
            const onCooldown = skill.currentCooldown > 0;
            const canUse = heroId === 'player' && isOwnTurn && !onCooldown && !hero.hasActed && hero.stunned === 0 && canUseSkillCheck(skill.id);
            const isSelected = selectedSkill === skill.id;

            return (
              <button
                key={skill.id}
                onClick={() => handleSkillClick(skill.id)}
                disabled={heroId !== 'player' || !canUse}
                style={{
                  padding: '10px 12px',
                  background: isSelected
                    ? 'rgba(74, 144, 217, 0.5)'
                    : onCooldown
                    ? '#333'
                    : heroId === 'player'
                    ? '#2D2D44'
                    : '#2D2D44',
                  border: isSelected ? '1px solid #4A90D9' : '1px solid #3A3A5A',
                  borderRadius: 8,
                  color: onCooldown ? '#888' : 'white',
                  cursor: heroId === 'player' && canUse ? 'pointer' : 'not-allowed',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  opacity: onCooldown ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (heroId === 'player' && canUse) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 0 8px rgba(106, 159, 181, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: 13 }}>
                    {skill.name}
                    {skill.type === 'control' ? ' (控)' : ' (伤)'}
                  </span>
                  {onCooldown ? (
                    <span style={{ fontSize: 11, color: '#FFC107' }}>
                      冷却 {skill.currentCooldown}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, opacity: 0.7 }}>CD {skill.cooldown}</span>
                  )}
                </div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                  {skill.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
