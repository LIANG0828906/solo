import React from 'react';
import { useCharacterStore } from '../store/characterStore';
import {
  ABILITY_NAMES,
  ALL_SKILLS,
  AbilityKey,
  CASTER_CLASSES,
  calcModifier,
  calcProficiencyBonus,
  RACE_BONUSES,
  CLASS_BONUSES,
} from '../types';
import { generatePDF } from '../utils/pdfGenerator';

const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

const cardContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
};

const cardStyle: React.CSSProperties = {
  width: '148mm',
  minHeight: '210mm',
  background: '#faf4e8',
  border: '3px solid #3e2723',
  borderRadius: '8px',
  padding: '12mm',
  color: '#3e2723',
  fontFamily: '"Cinzel", serif',
  boxShadow: '4px 4px 12px rgba(62,39,35,0.3)',
  position: 'relative',
  overflow: 'hidden',
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: '"Cinzel", serif',
  fontWeight: 900,
  fontSize: '0.85rem',
  borderBottom: '2px solid #3e2723',
  paddingBottom: '3px',
  marginBottom: '6px',
  marginTop: '10px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

const exportBtnStyle: React.CSSProperties = {
  background: '#3e2723',
  color: '#faf4e8',
  border: '2px solid #8b7355',
  borderRadius: '6px',
  padding: '10px 28px',
  fontSize: '1rem',
  fontFamily: '"Cinzel", serif',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const CharacterCard: React.FC = () => {
  const store = useCharacterStore();

  const handleExport = async () => {
    const data = store.getCharacterData();
    await generatePDF(data);
  };

  const profBonus = calcProficiencyBonus(store.level);
  const isCaster = CASTER_CLASSES.includes(store.classType);
  const weapons = store.equipment.filter((e) => e.category === '武器');

  return (
    <div style={cardContainerStyle}>
      <div style={cardStyle} id="character-card">
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 900, fontSize: '1.4rem', letterSpacing: '2px' }}>
            {store.name || '未命名角色'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#8b7355', marginTop: '2px' }}>
            {store.classType} · {store.race} · 等级 {store.level}
            {store.experience > 0 && <span> · XP {store.experience}</span>}
          </div>
        </div>

        <div style={sectionTitleStyle}>属性 ABILITIES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {ABILITY_KEYS.map((key) => {
            const base = store.abilities[key];
            const raceB = (RACE_BONUSES[store.race] as Record<string, number>)[key] || 0;
            const classB = (CLASS_BONUSES[store.classType] as Record<string, number>)[key] || 0;
            const total = base + raceB + classB;
            const mod = calcModifier(total);
            return (
              <div
                key={key}
                style={{
                  textAlign: 'center',
                  background: '#f5e6c8',
                  borderRadius: '6px',
                  padding: '4px 2px',
                  border: '1px solid #8b7355',
                }}
              >
                <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px' }}>
                  {ABILITY_NAMES[key]}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900 }}>{total}</div>
                <div style={{ fontSize: '0.75rem', color: '#1565c0', fontWeight: 700 }}>
                  {mod >= 0 ? '+' : ''}{mod}
                </div>
                {(raceB + classB) > 0 && (
                  <div style={{ fontSize: '0.6rem', color: '#1565c0' }}>+{raceB + classB}</div>
                )}
              </div>
            );
          })}
        </div>

        <div style={sectionTitleStyle}>战斗 COMBAT</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', textAlign: 'center' }}>
          {[
            { label: 'AC', value: store.ac },
            { label: 'HP', value: store.hp },
            { label: '速度', value: store.speed },
            { label: '先攻', value: `${store.getTotalModifier('dex') >= 0 ? '+' : ''}${store.getTotalModifier('dex')}` },
            { label: '熟练', value: `+${profBonus}` },
          ].map((item) => (
            <div key={item.label} style={{ background: '#f5e6c8', borderRadius: '4px', padding: '3px', border: '1px solid #8b7355' }}>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '1px' }}>{item.label}</div>
              <div style={{ fontSize: '1rem', fontWeight: 900 }}>{item.value}</div>
            </div>
          ))}
        </div>

        {weapons.length > 0 && (
          <div style={{ marginTop: '4px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, marginBottom: '2px', borderBottom: '1px solid #8b7355' }}>武器</div>
            {weapons.map((w) => (
              <div key={w.id} style={{ display: 'flex', gap: '8px', fontSize: '0.7rem', padding: '1px 0' }}>
                <span style={{ fontWeight: 700, flex: 1 }}>{w.name}</span>
                <span>{w.damageDice}</span>
                <span>{w.attackBonus !== undefined ? (w.attackBonus >= 0 ? '+' : '') + w.attackBonus : ''}</span>
              </div>
            ))}
          </div>
        )}

        <div style={sectionTitleStyle}>技能 SKILLS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 8px', fontSize: '0.65rem' }}>
          {ALL_SKILLS.map((skill) => {
            const isProf = store.proficientSkills.includes(skill.key);
            const totalAbility = store.getTotalAbility(skill.ability);
            const abilityMod = calcModifier(totalAbility);
            const skillMod = abilityMod + (isProf ? profBonus : 0);
            return (
              <div
                key={skill.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '1px 3px',
                  borderRadius: '2px',
                  border: isProf ? '1px solid #d4a017' : 'none',
                  background: isProf ? 'rgba(212,160,23,0.1)' : 'transparent',
                }}
              >
                <span style={{ width: '10px', textAlign: 'center', color: isProf ? '#d4a017' : 'transparent', fontWeight: 900 }}>●</span>
                <span style={{ flex: 1 }}>{skill.name}</span>
                <span style={{ fontWeight: 700, color: isProf ? '#d4a017' : '#3e2723' }}>
                  {skillMod >= 0 ? '+' : ''}{skillMod}
                </span>
              </div>
            );
          })}
        </div>

        {isCaster && (
          <>
            <div style={sectionTitleStyle}>法术 SPELLS</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {Object.entries(store.spellSlots)
                .filter(([, slot]) => slot.total > 0)
                .map(([level, slot]) => (
                  <div
                    key={level}
                    style={{
                      textAlign: 'center',
                      background: '#f5e6c8',
                      borderRadius: '4px',
                      padding: '3px 6px',
                      border: '1px solid #8b7355',
                      minWidth: '36px',
                    }}
                  >
                    <div style={{ fontSize: '0.55rem', fontWeight: 700 }}>{level}环</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                      {Array.from({ length: slot.total }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: i < slot.used ? '#3e2723' : '#d4a017',
                            border: '1px solid #8b7355',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {store.equipment.length > 0 && (
          <>
            <div style={sectionTitleStyle}>装备 EQUIPMENT</div>
            <div style={{ fontSize: '0.65rem' }}>
              {store.equipment.map((eq) => (
                <div key={eq.id} style={{ display: 'flex', gap: '4px', padding: '1px 0' }}>
                  <span style={{ fontWeight: 700 }}>{eq.name}</span>
                  <span style={{ color: '#8b7355' }}>({eq.category})</span>
                  <span style={{ color: '#8b7355' }}>{eq.weight}lb</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <button
        style={exportBtnStyle}
        onClick={handleExport}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#5d4037';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '4px 6px 16px rgba(62,39,35,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#3e2723';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        📜 导出为PDF
      </button>
    </div>
  );
};

export default CharacterCard;
