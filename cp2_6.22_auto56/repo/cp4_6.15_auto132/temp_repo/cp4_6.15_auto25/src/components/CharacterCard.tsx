import React, { useState, useEffect } from 'react';
import type { Character } from '@/types';

interface CharacterCardProps {
  character: Character;
  isActive: boolean;
  animationType: 'hit' | 'attack' | 'heal' | 'defense' | 'buff' | null;
  onAnimationEnd?: () => void;
}

const statusIcons: Record<string, { icon: string; name: string }> = {
  shield: { icon: '🛡️', name: '护盾' },
  buff: { icon: '✨', name: '增益' },
  poison: { icon: '☠️', name: '中毒' },
  stun: { icon: '💫', name: '眩晕' },
};

const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isActive,
  animationType,
  onAnimationEnd,
}) => {
  const [showShield, setShowShield] = useState(false);
  const [showParticles, setShowParticles] = useState<string | null>(null);
  const [showHealParticles, setShowHealParticles] = useState(false);

  useEffect(() => {
    if (animationType === 'hit' || animationType === 'attack') {
      const timer = setTimeout(() => onAnimationEnd?.(), 600);
      return () => clearTimeout(timer);
    }
    if (animationType === 'defense') {
      setShowShield(true);
      const timer = setTimeout(() => {
        setShowShield(false);
        onAnimationEnd?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
    if (animationType === 'heal' || animationType === 'buff') {
      setShowHealParticles(true);
      const timer = setTimeout(() => {
        setShowHealParticles(false);
        onAnimationEnd?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [animationType, onAnimationEnd]);

  useEffect(() => {
    if (animationType === 'attack') {
      setShowParticles(character.race);
      const timer = setTimeout(() => setShowParticles(null), 800);
      return () => clearTimeout(timer);
    }
  }, [animationType, character.race]);

  const hpPercent = (character.currentHp / character.maxHp) * 100;
  const mpPercent = (character.currentMp / character.maxMp) * 100;

  const getHpBarColor = () => {
    if (hpPercent > 60) return 'linear-gradient(90deg, #10b981, #34d399)';
    if (hpPercent > 30) return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    return 'linear-gradient(90deg, #ef4444, #f87171)';
  };

  const raceNames: Record<string, string> = {
    human: '人类',
    elf: '精灵',
    undead: '亡灵',
  };

  const cardClasses = [
    'character-card',
    isActive ? 'character-card--active' : '',
    animationType === 'hit' ? 'character-card--hit' : '',
    animationType === 'attack' ? 'character-card--attack' : '',
    !character.isPlayer ? 'character-card--enemy' : '',
  ].join(' ');

  return (
    <div className={cardClasses}>
      {showShield && <div className="shield-overlay" />}
      {showParticles && (
        <div className={`particle-burst particle-burst--${showParticles}`}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                '--i': i,
                transform: `rotate(${i * 30}deg)`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}
      {showHealParticles && (
        <div className="heal-particles">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="heal-particle"
              style={{
                '--i': i,
                left: `${15 + i * 10}%`,
                animationDelay: `${i * 0.08}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      <div className="card-header">
        <div className="avatar-container">
          <span className="avatar">{character.avatar}</span>
        </div>
        <div className="card-info">
          <h3 className="character-name">{character.name}</h3>
          <p className="character-class">
            <span className="race-tag">{raceNames[character.race]}</span>
            <span className="divider">·</span>
            <span>{character.className}</span>
          </p>
        </div>
      </div>

      <div className="stats-container">
        <div className="stat-bar">
          <div className="stat-label">
            <span>HP</span>
            <span className="stat-value">
              {character.currentHp} / {character.maxHp}
            </span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill bar-fill--hp"
              style={{
                width: `${hpPercent}%`,
                background: getHpBarColor(),
              }}
            />
          </div>
        </div>

        <div className="stat-bar">
          <div className="stat-label">
            <span>MP</span>
            <span className="stat-value">
              {character.currentMp} / {character.maxMp}
            </span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill bar-fill--mp"
              style={{ width: `${mpPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="status-icons">
        {character.statuses.map((status, idx) => (
          <div key={idx} className="status-icon" title={statusIcons[status.type]?.name}>
            <span className="status-pulse" />
            <span className="status-emoji">{statusIcons[status.type]?.icon || '❓'}</span>
            {status.value > 0 && status.type === 'shield' && (
              <span className="status-value">{status.value}</span>
            )}
            <span className="status-duration">{status.duration}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterCard;
