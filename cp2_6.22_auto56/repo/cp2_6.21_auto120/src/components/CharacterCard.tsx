import React, { useMemo } from 'react';
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
  Skill,
} from '../types';
import { generatePDF } from '../utils/pdfGenerator';

const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

const paperTextureBg: React.CSSProperties = {
  background: `
    radial-gradient(ellipse at 20% 30%, rgba(139, 115, 85, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(139, 115, 85, 0.06) 0%, transparent 50%),
    repeating-linear-gradient(
      45deg,
      transparent 0px,
      transparent 2px,
      rgba(139, 115, 85, 0.03) 2px,
      rgba(139, 115, 85, 0.03) 4px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent 0px,
      transparent 2px,
      rgba(139, 115, 85, 0.02) 2px,
      rgba(139, 115, 85, 0.02) 4px
    ),
    linear-gradient(135deg, #faf4e8 0%, #f5e6c8 50%, #faf0d8 100%)
  `,
};

const cardContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
};

const cardStyle: React.CSSProperties = {
  width: '148mm',
  minHeight: '210mm',
  ...paperTextureBg,
  border: '3px solid #5d4037',
  borderRadius: '4px',
  padding: '10mm 8mm',
  color: '#3e2723',
  fontFamily: '"Cinzel", serif',
  boxShadow: '0 8px 24px rgba(62,39,35,0.35), inset 0 0 30px rgba(139,115,85,0.1)',
  position: 'relative',
  overflow: 'hidden',
};

const cardInnerBorder: React.CSSProperties = {
  position: 'absolute',
  top: '4mm',
  left: '4mm',
  right: '4mm',
  bottom: '4mm',
  border: '1px solid #8b7355',
  pointerEvents: 'none',
  borderRadius: '2px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: '"Cinzel", serif',
  fontWeight: 900,
  fontSize: '0.82rem',
  color: '#3e2723',
  borderBottom: '2px double #5d4037',
  paddingBottom: '2px',
  marginBottom: '8px',
  marginTop: '12px',
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const abilityGroupLabelStyle: React.CSSProperties = {
  fontFamily: '"Cinzel", serif',
  fontWeight: 700,
  fontSize: '0.65rem',
  color: '#8b7355',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  marginBottom: '2px',
  marginTop: '6px',
  borderBottom: '1px dashed #d4b896',
  paddingBottom: '1px',
};

const exportBtnStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, #5d4037 0%, #3e2723 100%)',
  color: '#faf4e8',
  border: '2px solid #8b7355',
  borderRadius: '6px',
  padding: '10px 28px',
  fontSize: '1rem',
  fontFamily: '"Cinzel", serif',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: '0 3px 10px rgba(62,39,35,0.3)',
};

const skillRowStyle = (isProficient: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 4px',
  borderRadius: '2px',
  border: isProficient ? '1px solid #d4a017' : '1px solid transparent',
  background: isProficient
    ? 'linear-gradient(90deg, rgba(212,160,23,0.15) 0%, rgba(212,160,23,0.05) 100%)'
    : 'transparent',
});

interface SkillGroup {
  ability: AbilityKey;
  skills: Skill[];
}

function groupSkillsByAbility(): SkillGroup[] {
  const groups: Record<AbilityKey, Skill[]> = {
    str: [],
    dex: [],
    con: [],
    int: [],
    wis: [],
    cha: [],
  };
  ALL_SKILLS.forEach((skill) => {
    groups[skill.ability].push(skill);
  });
  return ABILITY_KEYS.map((ability) => ({
    ability,
    skills: groups[ability],
  })).filter((g) => g.skills.length > 0);
}

const CharacterCard: React.FC = () => {
  const store = useCharacterStore();

  const handleExport = async () => {
    const data = store.getCharacterData();
    await generatePDF(data);
  };

  const profBonus = calcProficiencyBonus(store.level);
  const isCaster = CASTER_CLASSES.includes(store.classType);
  const weapons = store.equipment.filter((e) => e.category === '武器');

  const skillGroups = useMemo(() => groupSkillsByAbility(), []);

  const getSpellcastingAbility = (): AbilityKey => {
    switch (store.classType) {
      case '法师': return 'int';
      case '术士': return 'cha';
      case '牧师': return 'wis';
      default: return 'int';
    }
  };

  const castingAbility = isCaster ? getSpellcastingAbility() : 'str';
  const spellAttackMod = isCaster
    ? store.getTotalModifier(castingAbility) + profBonus
    : 0;
  const spellSaveDC = isCaster
    ? 8 + store.getTotalModifier(castingAbility) + profBonus
    : 0;

  return (
    <div style={cardContainerStyle}>
      <div style={cardStyle} id="character-card">
        <div style={cardInnerBorder} />

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              fontFamily: '"Cinzel", serif',
              fontWeight: 900,
              fontSize: '1.6rem',
              letterSpacing: '3px',
              color: '#3e2723',
              textShadow: '1px 1px 0 rgba(250,244,232,0.8)',
            }}
          >
            {store.name || '未命名角色'}
          </div>
          <div
            style={{
              fontSize: '0.65rem',
              color: '#5d4037',
              marginTop: '4px',
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}
          >
            <span>职业：{store.classType}</span>
            <span style={{ color: '#b0a090' }}>|</span>
            <span>种族：{store.race}</span>
            <span style={{ color: '#b0a090' }}>|</span>
            <span>等级：{store.level}</span>
            {store.experience > 0 && (
              <>
                <span style={{ color: '#b0a090' }}>|</span>
                <span>XP：{store.experience}</span>
              </>
            )}
          </div>
        </div>

        <div style={{ ...sectionTitleStyle, marginTop: '8px' }}>
          <span>角色属性</span>
          <span style={{ fontSize: '0.6rem', fontWeight: 400, color: '#8b7355' }}>ABILITIES</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 10px',
                  background: 'linear-gradient(135deg, #f5e6c8 0%, #efe0c0 100%)',
                  borderRadius: '4px',
                  border: '1px solid #8b7355',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      color: '#5d4037',
                      textTransform: 'uppercase',
                    }}
                  >
                    {ABILITY_NAMES[key]}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#8b7355' }}>
                    {key.toUpperCase()}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 900,
                    color: '#3e2723',
                    minWidth: '36px',
                    textAlign: 'center',
                    fontFamily: '"Cinzel", serif',
                  }}
                >
                  {total}
                </div>
                <div
                  style={{
                    minWidth: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 900,
                    boxShadow: '0 2px 4px rgba(21,101,192,0.3)',
                  }}
                >
                  {mod >= 0 ? '+' : ''}{mod}
                </div>
              </div>
            );
          })}
        </div>

        <div style={sectionTitleStyle}>
          <span>战斗属性</span>
          <span style={{ fontSize: '0.6rem', fontWeight: 400, color: '#8b7355' }}>COMBAT</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '4px',
            textAlign: 'center',
          }}
        >
          {[
            { label: '防御等级', abbr: 'AC', value: String(store.ac) },
            { label: '生命', abbr: 'HP', value: String(store.hp) },
            { label: '速度', abbr: 'SPD', value: String(store.speed) },
            {
              label: '先攻',
              abbr: 'INIT',
              value: `${store.getTotalModifier('dex') >= 0 ? '+' : ''}${store.getTotalModifier('dex')}`,
            },
            { label: '熟练加值', abbr: 'PROF', value: `+${profBonus}` },
          ].map((item) => (
            <div
              key={item.abbr}
              style={{
                background: 'linear-gradient(180deg, #f5e6c8 0%, #ede0c0 100%)',
                borderRadius: '4px',
                padding: '4px 2px',
                border: '1px solid #8b7355',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
              }}
            >
              <div style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '1px', color: '#5d4037' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#3e2723' }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isCaster ? '1fr 1fr' : '1fr',
            gap: '8px',
            marginTop: '6px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #f5e6c8 0%, #f0e0c0 100%)',
              borderRadius: '4px',
              padding: '6px 8px',
              border: '1px solid #8b7355',
            }}
          >
            <div
              style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                color: '#5d4037',
                marginBottom: '2px',
                letterSpacing: '0.5px',
              }}
            >
              攻击加值
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#3e2723' }}>
              +{store.getTotalModifier('str') + profBonus} 近战
              <span style={{ color: '#8b7355', fontWeight: 400, margin: '0 4px' }}>/</span>
              +{store.getTotalModifier('dex') + profBonus} 远程
            </div>
          </div>

          {isCaster && (
            <div
              style={{
                background: 'linear-gradient(135deg, #f5e6c8 0%, #f0e0c0 100%)',
                borderRadius: '4px',
                padding: '6px 8px',
                border: '1px solid #8b7355',
              }}
            >
              <div
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: '#5d4037',
                  marginBottom: '2px',
                  letterSpacing: '0.5px',
                }}
              >
                施法能力 ({ABILITY_NAMES[castingAbility]})
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#3e2723' }}>
                DC {spellSaveDC}
                <span style={{ color: '#8b7355', fontWeight: 400, margin: '0 4px' }}>/</span>
                +{spellAttackMod} 攻击
              </div>
            </div>
          )}
        </div>

        {weapons.length > 0 && (
          <div style={{ marginTop: '6px' }}>
            <div
              style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                color: '#5d4037',
                letterSpacing: '0.5px',
                marginBottom: '3px',
                borderBottom: '1px dashed #b0a090',
                paddingBottom: '2px',
              }}
            >
              武器 WEAPONS
            </div>
            {weapons.map((w) => (
              <div
                key={w.id}
                style={{
                  display: 'flex',
                  gap: '10px',
                  fontSize: '0.7rem',
                  padding: '2px 4px',
                }}
              >
                <span style={{ fontWeight: 700, flex: 1, color: '#3e2723' }}>{w.name}</span>
                <span style={{ color: '#5d4037' }}>{w.damageDice}</span>
                <span style={{ color: '#1565c0', fontWeight: 700 }}>
                  {w.attackBonus !== undefined
                    ? `${w.attackBonus >= 0 ? '+' : ''}${w.attackBonus}`
                    : ''}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={sectionTitleStyle}>
          <span>技能列表</span>
          <span style={{ fontSize: '0.6rem', fontWeight: 400, color: '#8b7355' }}>SKILLS</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
          {skillGroups.slice(0, 3).map((group) => (
            <div key={group.ability}>
              <div style={abilityGroupLabelStyle}>
                {ABILITY_NAMES[group.ability]} ({group.ability.toUpperCase()})
              </div>
              {group.skills.map((skill) => {
                const isProf = store.proficientSkills.includes(skill.key);
                const totalAbility = store.getTotalAbility(skill.ability);
                const abilityMod = calcModifier(totalAbility);
                const skillMod = abilityMod + (isProf ? profBonus : 0);
                return (
                  <div key={skill.key} style={skillRowStyle(isProf)}>
                    <span
                      style={{
                        width: '10px',
                        textAlign: 'center',
                        fontSize: '0.6rem',
                        color: isProf ? '#d4a017' : 'transparent',
                        fontWeight: 900,
                      }}
                    >
                      ●
                    </span>
                    <span style={{ flex: 1, fontSize: '0.65rem' }}>{skill.name}</span>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        color: isProf ? '#d4a017' : '#3e2723',
                        minWidth: '24px',
                        textAlign: 'right',
                      }}
                    >
                      {skillMod >= 0 ? '+' : ''}{skillMod}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
          {skillGroups.slice(3).map((group) => (
            <div key={group.ability}>
              <div style={abilityGroupLabelStyle}>
                {ABILITY_NAMES[group.ability]} ({group.ability.toUpperCase()})
              </div>
              {group.skills.map((skill) => {
                const isProf = store.proficientSkills.includes(skill.key);
                const totalAbility = store.getTotalAbility(skill.ability);
                const abilityMod = calcModifier(totalAbility);
                const skillMod = abilityMod + (isProf ? profBonus : 0);
                return (
                  <div key={skill.key} style={skillRowStyle(isProf)}>
                    <span
                      style={{
                        width: '10px',
                        textAlign: 'center',
                        fontSize: '0.6rem',
                        color: isProf ? '#d4a017' : 'transparent',
                        fontWeight: 900,
                      }}
                    >
                      ●
                    </span>
                    <span style={{ flex: 1, fontSize: '0.65rem' }}>{skill.name}</span>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        color: isProf ? '#d4a017' : '#3e2723',
                        minWidth: '24px',
                        textAlign: 'right',
                      }}
                    >
                      {skillMod >= 0 ? '+' : ''}{skillMod}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {isCaster && (
          <>
            <div style={sectionTitleStyle}>
              <span>法术槽位</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 400, color: '#8b7355' }}>
                SPELL SLOTS ({ABILITY_NAMES[castingAbility]})
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {Object.entries(store.spellSlots)
                .filter(([, slot]) => slot.total > 0)
                .map(([level, slot]) => (
                  <div
                    key={level}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 8px',
                      background: 'linear-gradient(90deg, rgba(245,230,200,0.6) 0%, rgba(245,230,200,0.2) 100%)',
                      borderRadius: '4px',
                      border: '1px solid #b0a090',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: '#5d4037',
                        minWidth: '50px',
                      }}
                    >
                      {level}环法术
                    </div>
                    <div style={{ display: 'flex', gap: '3px', flex: 1 }}>
                      {Array.from({ length: slot.total }).map((_, i) => {
                        const isUsed = i < slot.used;
                        return (
                          <div
                            key={i}
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              border: '1px solid #8b7355',
                              background: isUsed
                                ? 'linear-gradient(135deg, #5d4037 0%, #3e2723 100%)'
                                : 'radial-gradient(circle at 30% 30%, #ffd54f 0%, #d4a017 100%)',
                              boxShadow: isUsed
                                ? 'inset 0 1px 2px rgba(0,0,0,0.3)'
                                : 'inset 0 1px 2px rgba(255,255,255,0.5), 0 1px 3px rgba(212,160,23,0.4)',
                            }}
                            title={isUsed ? '已使用' : '未使用'}
                          />
                        );
                      })}
                    </div>
                    <div
                      style={{
                        fontSize: '0.6rem',
                        color: '#8b7355',
                        fontWeight: 600,
                        minWidth: '36px',
                        textAlign: 'right',
                      }}
                    >
                      {slot.total - slot.used} / {slot.total}
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {store.equipment.length > 0 && (
          <>
            <div style={sectionTitleStyle}>
              <span>装备物品</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 400, color: '#8b7355' }}>EQUIPMENT</span>
            </div>
            <div style={{ fontSize: '0.65rem' }}>
              {store.equipment.map((eq) => (
                <div
                  key={eq.id}
                  style={{
                    display: 'flex',
                    gap: '6px',
                    padding: '2px 4px',
                    borderBottom: '1px dashed #d4b896',
                  }}
                >
                  <span style={{ fontWeight: 700, flex: 1, color: '#3e2723' }}>{eq.name}</span>
                  <span style={{ color: '#8b7355' }}>{eq.category}</span>
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
          e.currentTarget.style.background = 'linear-gradient(180deg, #6d4c41 0%, #4e342e 100%)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '4px 6px 16px rgba(62,39,35,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(180deg, #5d4037 0%, #3e2723 100%)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 3px 10px rgba(62,39,35,0.3)';
        }}
      >
        📜 导出为PDF
      </button>
    </div>
  );
};

export default CharacterCard;
