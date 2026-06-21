import React, { useState, useCallback } from 'react';
import { useCharacterStore } from '../store/characterStore';
import {
  ClassType,
  RaceType,
  AbilityKey,
  ABILITY_NAMES,
  ALL_SKILLS,
  CASTER_CLASSES,
  Equipment,
  validateDamageDice,
} from '../types';

const CLASS_OPTIONS: ClassType[] = ['战士', '法师', '游荡者', '牧师', '游侠', '术士'];
const RACE_OPTIONS: RaceType[] = ['人类', '精灵', '矮人', '半兽人', '半身人', '龙裔'];
const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

const panelStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #f5e6c8 0%, #e8d5b0 50%, #f5e6c8 100%)',
  border: '2px solid #8b7355',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '16px',
  position: 'relative',
};

const panelTitleStyle: React.CSSProperties = {
  fontFamily: '"Cinzel", serif',
  fontWeight: 700,
  fontSize: '1.1rem',
  color: '#3e2723',
  marginBottom: '12px',
  borderBottom: '1px solid #8b7355',
  paddingBottom: '8px',
};

const btnStyle: React.CSSProperties = {
  background: '#8b7355',
  color: '#faf4e8',
  border: 'none',
  borderRadius: '4px',
  padding: '4px 10px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '1rem',
  transition: 'all 0.2s',
  minWidth: '30px',
};

const inputStyle: React.CSSProperties = {
  background: '#faf4e8',
  border: '1px solid #8b7355',
  borderRadius: '4px',
  padding: '6px 10px',
  color: '#3e2723',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const skillItemStyle = (isProficient: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '4px 8px',
  borderRadius: '4px',
  border: isProficient ? '2px solid #d4a017' : '1px solid transparent',
  background: isProficient ? 'rgba(212,160,23,0.1)' : 'transparent',
  cursor: 'pointer',
  transition: 'all 0.2s',
});

const CharacterForm: React.FC = () => {
  const store = useCharacterStore();
  const [newEquipName, setNewEquipName] = useState('');
  const [newEquipCategory, setNewEquipCategory] = useState<'武器' | '护甲' | '消耗品'>('武器');
  const [newEquipWeight, setNewEquipWeight] = useState('0');
  const [newEquipDamage, setNewEquipDamage] = useState('');
  const [newEquipAttack, setNewEquipAttack] = useState('0');
  const [diceError, setDiceError] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'skills' | 'equip' | 'spells'>('basic');

  const remainingPoints = store.getRemainingPoints();

  const handleAddEquipment = useCallback(() => {
    if (!newEquipName.trim()) return;
    if (newEquipCategory === '武器' && newEquipDamage && !validateDamageDice(newEquipDamage)) {
      setDiceError('伤害骰格式错误，请使用如 1d8 格式');
      return;
    }
    setDiceError('');
    const equip: Equipment = {
      id: Date.now().toString(),
      name: newEquipName.trim(),
      category: newEquipCategory,
      weight: parseFloat(newEquipWeight) || 0,
      ...(newEquipCategory === '武器' && newEquipDamage ? { damageDice: newEquipDamage } : {}),
      ...(newEquipCategory === '武器' ? { attackBonus: parseInt(newEquipAttack) || 0 } : {}),
    };
    store.addEquipment(equip);
    setNewEquipName('');
    setNewEquipDamage('');
    setNewEquipAttack('0');
    setNewEquipWeight('0');
  }, [newEquipName, newEquipCategory, newEquipWeight, newEquipDamage, newEquipAttack, store]);

  const tabItems: { key: typeof activeTab; label: string }[] = [
    { key: 'basic', label: '基本信息' },
    { key: 'skills', label: '技能配置' },
    { key: 'equip', label: '装备物品' },
    ...(CASTER_CLASSES.includes(store.classType) ? [{ key: 'spells' as const, label: '法术槽位' }] : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {tabItems.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...btnStyle,
              background: activeTab === tab.key ? '#3e2723' : '#8b7355',
              fontSize: '0.85rem',
              padding: '6px 14px',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {activeTab === 'basic' && (
          <div>
            <div style={panelStyle}>
              <div style={panelTitleStyle}>角色信息</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>角色名</label>
                  <input
                    style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                    value={store.name}
                    onChange={(e) => store.setName(e.target.value)}
                    placeholder="输入角色名"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>等级 (1-20)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                    value={store.level}
                    onChange={(e) => store.setLevel(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>职业</label>
                  <select
                    style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}
                    value={store.classType}
                    onChange={(e) => store.setClassType(e.target.value as ClassType)}
                  >
                    {CLASS_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>种族</label>
                  <select
                    style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}
                    value={store.race}
                    onChange={(e) => store.setRace(e.target.value as RaceType)}
                  >
                    {RACE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>经验值</label>
                  <input
                    type="number"
                    min={0}
                    style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                    value={store.experience}
                    onChange={(e) => store.setExperience(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <div style={panelStyle}>
              <div style={panelTitleStyle}>
                属性点分配
                <span style={{ float: 'right', fontSize: '0.9rem', fontWeight: 400 }}>
                  剩余: <span style={{ color: remainingPoints > 0 ? '#b71c1c' : '#2e7d32', fontWeight: 700 }}>{remainingPoints}</span> / 72
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {ABILITY_KEYS.map((key) => {
                  const base = store.abilities[key];
                  const raceB = store.getRaceBonus(key);
                  const classB = store.getClassBonus(key);
                  const total = base + raceB + classB;
                  const mod = store.getTotalModifier(key);
                  return (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px',
                        background: '#faf4e8',
                        borderRadius: '6px',
                        border: '1px solid #d4b896',
                      }}
                    >
                      <span style={{ fontWeight: 700, minWidth: '36px', fontSize: '0.85rem' }}>
                        {ABILITY_NAMES[key]}
                      </span>
                      <button
                        style={{ ...btnStyle, padding: '2px 8px', fontSize: '0.85rem' }}
                        onClick={() => store.decrementAbility(key)}
                      >
                        −
                      </button>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '1.2rem',
                          minWidth: '24px',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        {base}
                      </span>
                      <button
                        style={{ ...btnStyle, padding: '2px 8px', fontSize: '0.85rem' }}
                        onClick={() => store.incrementAbility(key)}
                      >
                        +
                      </button>
                      <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: '0.8rem' }}>
                        <div style={{ color: '#1565c0', fontWeight: 700 }}>
                          总{total} ({mod >= 0 ? '+' : ''}{mod})
                        </div>
                        {(raceB + classB) > 0 && (
                          <div style={{ color: '#1565c0', fontSize: '0.7rem' }}>
                            +{raceB + classB} 加值
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={panelStyle}>
              <div style={panelTitleStyle}>战斗数据</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>HP</label>
                  <input
                    type="number"
                    style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                    value={store.hp}
                    onChange={(e) => store.setHp(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>AC</label>
                  <input
                    type="number"
                    style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                    value={store.ac}
                    onChange={(e) => store.setAc(parseInt(e.target.value) || 10)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>速度</label>
                  <input
                    type="number"
                    style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                    value={store.speed}
                    onChange={(e) => store.setSpeed(parseInt(e.target.value) || 30)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div style={panelStyle}>
            <div style={panelTitleStyle}>
              技能配置
              <span style={{ float: 'right', fontSize: '0.9rem', fontWeight: 400 }}>
                已选: <span style={{ fontWeight: 700 }}>{store.proficientSkills.length}</span> / {store.getMaxSkillSlots()}
                <span style={{ marginLeft: '12px', color: '#1565c0' }}>熟练加值: +{store.getProficiencyBonus()}</span>
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {ALL_SKILLS.map((skill) => {
                const isProf = store.proficientSkills.includes(skill.key);
                const mod = store.getSkillModifier(skill.key, skill.ability);
                return (
                  <div
                    key={skill.key}
                    style={skillItemStyle(isProf)}
                    onClick={() => store.toggleSkillProficiency(skill.key)}
                  >
                    <span
                      style={{
                        width: '16px',
                        height: '16px',
                        border: isProf ? '2px solid #d4a017' : '1px solid #8b7355',
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isProf ? '#d4a017' : 'transparent',
                        flexShrink: 0,
                      }}
                    >
                      {isProf && <span style={{ color: '#faf4e8', fontSize: '0.7rem', fontWeight: 900 }}>✓</span>}
                    </span>
                    <span style={{ fontSize: '0.85rem', flex: 1 }}>{skill.name}</span>
                    <span style={{ fontSize: '0.8rem', color: '#8b7355' }}>({ABILITY_NAMES[skill.ability]})</span>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: isProf ? '#d4a017' : '#3e2723',
                      minWidth: '30px',
                      textAlign: 'right',
                    }}>
                      {mod >= 0 ? '+' : ''}{mod}
                    </span>
                  </div>
                );
              })}
            </div>
            {store.proficientSkills.length >= store.getMaxSkillSlots() && (
              <div style={{ color: '#b71c1c', fontSize: '0.85rem', marginTop: '8px', fontStyle: 'italic' }}>
                已达到该职业最大熟练技能数量限制
              </div>
            )}
          </div>
        )}

        {activeTab === 'equip' && (
          <div style={panelStyle}>
            <div style={panelTitleStyle}>装备物品</div>
            <div style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>名称</label>
                <input
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                  value={newEquipName}
                  onChange={(e) => setNewEquipName(e.target.value)}
                  placeholder="装备名称"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>类别</label>
                <select
                  style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}
                  value={newEquipCategory}
                  onChange={(e) => setNewEquipCategory(e.target.value as '武器' | '护甲' | '消耗品')}
                >
                  <option value="武器">武器</option>
                  <option value="护甲">护甲</option>
                  <option value="消耗品">消耗品</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>重量</label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                  value={newEquipWeight}
                  onChange={(e) => setNewEquipWeight(e.target.value)}
                />
              </div>
              {newEquipCategory === '武器' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>伤害骰 (如 1d8)</label>
                    <input
                      style={{
                        ...inputStyle,
                        width: '100%',
                        boxSizing: 'border-box',
                        borderColor: diceError ? '#b71c1c' : '#8b7355',
                      }}
                      value={newEquipDamage}
                      onChange={(e) => { setNewEquipDamage(e.target.value); setDiceError(''); }}
                      placeholder="1d8"
                    />
                    {diceError && <div style={{ color: '#b71c1c', fontSize: '0.75rem', marginTop: '2px' }}>{diceError}</div>}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>攻击加值</label>
                    <input
                      type="number"
                      style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                      value={newEquipAttack}
                      onChange={(e) => setNewEquipAttack(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
            <button
              style={{
                ...btnStyle,
                padding: '6px 16px',
                fontSize: '0.9rem',
                marginBottom: '12px',
              }}
              onClick={handleAddEquipment}
            >
              添加装备
            </button>

            {store.equipment.length > 0 && (
              <div>
                {store.equipment.map((eq) => (
                  <div
                    key={eq.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      borderBottom: '1px solid #d4b896',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ fontWeight: 700, flex: 1 }}>{eq.name}</span>
                    <span style={{ color: '#8b7355' }}>{eq.category}</span>
                    {eq.damageDice && (
                      <span style={{ color: '#1565c0', fontWeight: 700 }}>{eq.damageDice}</span>
                    )}
                    <span style={{ color: '#8b7355' }}>{eq.weight}lb</span>
                    <button
                      style={{ ...btnStyle, background: '#b71c1c', padding: '2px 8px', fontSize: '0.75rem' }}
                      onClick={() => store.removeEquipment(eq.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'spells' && CASTER_CLASSES.includes(store.classType) && (
          <div style={panelStyle}>
            <div style={panelTitleStyle}>
              法术槽位
              <button
                style={{
                  ...btnStyle,
                  float: 'right',
                  fontSize: '0.8rem',
                  padding: '4px 12px',
                  background: '#2e7d32',
                }}
                onClick={() => store.restoreAllSpellSlots()}
              >
                全部恢复
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {Object.entries(store.spellSlots)
                .filter(([, slot]) => slot.total > 0)
                .map(([level, slot]) => (
                  <div
                    key={level}
                    style={{
                      background: '#faf4e8',
                      borderRadius: '6px',
                      padding: '8px',
                      border: '1px solid #d4b896',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                      {level}环法术
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
                      {Array.from({ length: slot.total }).map((_, i) => (
                        <div
                          key={i}
                          onClick={() =>
                            i < slot.used ? store.restoreSpellSlot(Number(level)) : store.useSpellSlot(Number(level))
                          }
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            border: '2px solid #8b7355',
                            background: i < slot.used ? '#3e2723' : '#d4a017',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          title={i < slot.used ? '点击恢复' : '点击消耗'}
                        />
                      ))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#8b7355', marginTop: '4px' }}>
                      {slot.total - slot.used} / {slot.total}
                    </div>
                  </div>
                ))}
            </div>
            {Object.values(store.spellSlots).every((s) => s.total === 0) && (
              <div style={{ textAlign: 'center', color: '#8b7355', fontSize: '0.9rem', padding: '20px' }}>
                当前等级无可用法术槽位
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterForm;
