import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { SKILL_TREES, getAttributeNames } from '../../data/gameData';
import { getAttributeModifier } from '../../utils/dice';
import type { EquipmentSlot } from '../../types';
import './CharacterSheet.css';

interface CharacterSheetProps {
  compact?: boolean;
}

function CharacterSheet({ compact = false }: CharacterSheetProps) {
  const { character, unequipItem } = useGameStore();
  const [activeTab, setActiveTab] = useState<'attributes' | 'skills' | 'equipment'>('attributes');

  if (!character) return null;

  const classNameMap: Record<string, string> = {
    warrior: '战士',
    mage: '法师',
    rogue: '盗贼',
    cleric: '牧师',
  };

  const slotNames: Record<EquipmentSlot, string> = {
    head: '头盔',
    body: '护甲',
    weapon: '武器',
    ring: '戒指',
  };

  const skills = SKILL_TREES[character.class];
  const unlockedSkills = skills.filter((s) => character.skills.includes(s.id));

  if (compact) {
    return (
      <div className="character-sheet-compact parchment-panel">
        <h4 className="compact-title">角色属性</h4>
        <div className="compact-attributes">
          {(Object.keys(character.attributes) as (keyof typeof character.attributes)[]).map(
            (key) => (
              <div key={key} className="compact-attr-item">
                <span className="compact-attr-name">{getAttributeNames[key]}</span>
                <span className="compact-attr-value">{character.attributes[key]}</span>
                <span className="compact-attr-mod">
                  ({getAttributeModifier(character.attributes[key]) >= 0 ? '+' : ''}
                  {getAttributeModifier(character.attributes[key])})
                </span>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="character-sheet parchment-panel">
      <div className="sheet-header">
        <div
          className={`sheet-avatar shape-${character.avatarShape}`}
          style={{ backgroundColor: character.avatarColor }}
        >
          {character.name.charAt(0).toUpperCase()}
        </div>
        <div className="sheet-header-info">
          <h2>{character.name}</h2>
          <p className="sheet-class">
            {classNameMap[character.class]} · Lv.{character.level}
          </p>
          <p className="sheet-exp">
            经验: {character.experience}/{character.experienceToNext} · 技能点:{' '}
            {character.skillPoints}
          </p>
        </div>
      </div>

      <div className="sheet-tabs">
        <button
          className={`sheet-tab ${activeTab === 'attributes' ? 'active' : ''}`}
          onClick={() => setActiveTab('attributes')}
        >
          属性
        </button>
        <button
          className={`sheet-tab ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          技能
        </button>
        <button
          className={`sheet-tab ${activeTab === 'equipment' ? 'active' : ''}`}
          onClick={() => setActiveTab('equipment')}
        >
          装备
        </button>
      </div>

      <div className="sheet-content">
        {activeTab === 'attributes' && (
          <div className="attributes-section fade-in">
            <div className="stats-row">
              <div className="stat-box">
                <span className="stat-label">❤️ 生命值</span>
                <span className="stat-value">
                  {character.currentHealth}/{character.maxHealth}
                </span>
              </div>
              <div className="stat-box">
                <span className="stat-label">💧 法力值</span>
                <span className="stat-value">
                  {character.currentMana}/{character.maxMana}
                </span>
              </div>
              <div className="stat-box">
                <span className="stat-label">💰 金币</span>
                <span className="stat-value">{character.gold}</span>
              </div>
            </div>

            <h4 className="section-title">基础属性</h4>
            <div className="attributes-grid-full">
              {(Object.keys(character.attributes) as (keyof typeof character.attributes)[]).map(
                (key) => (
                  <div key={key} className="attr-card">
                    <span className="attr-card-name">{getAttributeNames[key]}</span>
                    <span className="attr-card-value">{character.attributes[key]}</span>
                    <span className="attr-card-mod">
                      {getAttributeModifier(character.attributes[key]) >= 0 ? '+' : ''}
                      {getAttributeModifier(character.attributes[key])}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="skills-section fade-in">
            <p className="skill-points-info">
              可用技能点: <strong>{character.skillPoints}</strong>
            </p>
            <div className="skills-list">
              {skills.map((skill) => {
                const unlocked = character.skills.includes(skill.id);
                return (
                  <div
                    key={skill.id}
                    className={`skill-item ${unlocked ? 'unlocked' : ''}`}
                  >
                    <div className="skill-info">
                      <h5 className="skill-name">{skill.name}</h5>
                      <p className="skill-desc">{skill.description}</p>
                    </div>
                    <div className="skill-cost">
                      <span>{skill.cost} 点</span>
                      {unlocked ? (
                        <span className="skill-unlocked-badge">已解锁</span>
                      ) : (
                        <button
                          className="btn-secondary"
                          disabled={character.skillPoints < skill.cost}
                        >
                          解锁
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="equipment-section fade-in">
            <div className="equipment-slots">
              {(Object.keys(character.equipment) as EquipmentSlot[]).map((slot) => {
                const item = character.equipment[slot];
                return (
                  <div key={slot} className="equip-slot">
                    <span className="equip-slot-label">{slotNames[slot]}</span>
                    <div className={`equip-slot-box ${item ? 'filled' : ''}`}>
                      {item ? (
                        <>
                          <span className="equip-item-icon">{item.icon}</span>
                          <span className="equip-item-name">{item.name}</span>
                          <button
                            className="unequip-btn"
                            onClick={() => unequipItem(slot)}
                          >
                            卸下
                          </button>
                        </>
                      ) : (
                        <span className="equip-empty">空</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CharacterSheet;
