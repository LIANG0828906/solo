import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useGameStore } from '../../store/gameStore';
import { CharacterAPI } from './CharacterAPI';
import { roll4d6DropLowest, getAttributeModifier } from '../../utils/dice';
import {
  CLASS_DATA,
  STARTER_ITEMS,
  AVATAR_COLORS,
  AVATAR_SHAPES,
  getAttributeNames,
} from '../../data/gameData';
import type { CharacterClass, Attributes } from '../../types';
import DiceRoller from '../../components/DiceRoller';
import './CharacterCreation.css';

function CharacterCreation() {
  const navigate = useNavigate();
  const { setCharacter } = useGameStore();

  const [step, setStep] = useState<'class' | 'attributes' | 'customize' | 'confirm'>(
    'class'
  );
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('warrior');
  const [attributes, setAttributes] = useState<Attributes>({
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  });
  const [rolledAttributes, setRolledAttributes] = useState<Attributes | null>(null);
  const [name, setName] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [avatarShape, setAvatarShape] = useState<'circle' | 'square' | 'diamond'>(
    'circle'
  );
  const [isRolling, setIsRolling] = useState(false);

  const rollAttributes = () => {
    setIsRolling(true);
    setTimeout(() => {
      const newAttrs: Attributes = {
        strength: roll4d6DropLowest(),
        dexterity: roll4d6DropLowest(),
        constitution: roll4d6DropLowest(),
        intelligence: roll4d6DropLowest(),
        wisdom: roll4d6DropLowest(),
        charisma: roll4d6DropLowest(),
      };
      setRolledAttributes(newAttrs);
      setAttributes(newAttrs);
      setIsRolling(false);
    }, 1500);
  };

  useEffect(() => {
    if (step === 'attributes' && !rolledAttributes) {
      rollAttributes();
    }
  }, [step]);

  const createCharacter = async () => {
    const classData = CLASS_DATA[selectedClass];

    const finalAttributes = { ...attributes };
    Object.keys(classData.baseAttributes).forEach((key) => {
      const k = key as keyof Attributes;
      finalAttributes[k] += classData.baseAttributes[k] - 10;
    });

    const baseHealth = classData.baseHealth + finalAttributes.constitution * 5;
    const baseMana = classData.baseMana + finalAttributes.wisdom * 3;

    const starterItemsWithIds = STARTER_ITEMS.map((item) => ({
      ...item,
      id: `${item.id}-${uuidv4().slice(0, 8)}`,
    }));

    const character = {
      id: `char-${uuidv4()}`,
      name: name || '无名英雄',
      class: selectedClass,
      level: 1,
      experience: 0,
      experienceToNext: 100,
      attributes: finalAttributes,
      baseAttributes: { ...finalAttributes },
      maxHealth: baseHealth,
      currentHealth: baseHealth,
      maxMana: baseMana,
      currentMana: baseMana,
      skillPoints: 3,
      skills: [],
      equipment: {
        head: null,
        body: starterItemsWithIds.find((i) => i.slot === 'body') || null,
        weapon: starterItemsWithIds.find((i) => i.slot === 'weapon') || null,
        ring: null,
      },
      inventory: starterItemsWithIds.filter(
        (i) => i.slot !== 'body' && i.slot !== 'weapon'
      ),
      gold: 50,
      avatarColor,
      avatarShape,
    };

    try {
      await CharacterAPI.saveCharacter(character);
    } catch (e) {
      console.warn('Could not save to backend');
    }

    setCharacter(character);
    navigate('/game');
  };

  const classList: CharacterClass[] = ['warrior', 'mage', 'rogue', 'cleric'];

  return (
    <div className="character-creation">
      <div className="creation-container parchment-panel">
        <h1 className="creation-title">创建你的角色</h1>

        <div className="steps-indicator">
          {['选择职业', '属性投骰', '个性化', '确认'].map((s, i) => {
            const stepKeys = ['class', 'attributes', 'customize', 'confirm'];
            return (
              <div
                key={s}
                className={`step ${stepKeys[i] === step ? 'active' : ''}`}
              >
                <span className="step-number">{i + 1}</span>
                <span className="step-label">{s}</span>
              </div>
            );
          })}
        </div>

        {step === 'class' && (
          <div className="step-content fade-in">
            <h2>选择你的职业</h2>
            <div className="class-grid">
              {classList.map((cls) => (
                <div
                  key={cls}
                  className={`class-card ${selectedClass === cls ? 'selected' : ''}`}
                  onClick={() => setSelectedClass(cls)}
                >
                  <div className="class-icon">{CLASS_DATA[cls].icon}</div>
                  <h3>{CLASS_DATA[cls].name}</h3>
                  <p className="class-desc">{CLASS_DATA[cls].description}</p>
                  <div className="class-stats">
                    <span>❤️ {CLASS_DATA[cls].baseHealth}</span>
                    <span>💧 {CLASS_DATA[cls].baseMana}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="step-actions">
              <button
                className="btn-primary"
                onClick={() => setStep('attributes')}
              >
                下一步 →
              </button>
            </div>
          </div>
        )}

        {step === 'attributes' && (
          <div className="step-content fade-in">
            <h2>投掷属性骰</h2>
            <p className="step-desc">
              投掷 4d6 取最高 3 个之和，决定你的六项基础属性。
            </p>

            {isRolling ? (
              <div className="dice-rolling-section">
                <DiceRoller autoRoll showResult={false} size="large" />
                <p>正在投掷命运之骰...</p>
              </div>
            ) : (
              <>
                <div className="attributes-grid">
                  {(Object.keys(attributes) as (keyof Attributes)[]).map((key) => (
                    <div key={key} className="attribute-item">
                      <span className="attr-name">{getAttributeNames[key]}</span>
                      <span className="attr-value">{attributes[key]}</span>
                      <span className="attr-modifier">
                        ({getAttributeModifier(attributes[key]) >= 0 ? '+' : ''}
                        {getAttributeModifier(attributes[key])})
                      </span>
                    </div>
                  ))}
                </div>
                <div className="reroll-section">
                  <button className="btn-secondary" onClick={rollAttributes}>
                    🎲 重新投掷
                  </button>
                  <p className="reroll-hint">你可以无限次重新投掷</p>
                </div>
              </>
            )}

            <div className="step-actions">
              <button
                className="btn-secondary"
                onClick={() => setStep('class')}
                disabled={isRolling}
              >
                ← 上一步
              </button>
              <button
                className="btn-primary"
                onClick={() => setStep('customize')}
                disabled={isRolling}
              >
                下一步 →
              </button>
            </div>
          </div>
        )}

        {step === 'customize' && (
          <div className="step-content fade-in">
            <h2>个性化你的角色</h2>

            <div className="customize-section">
              <label className="input-label">角色名称</label>
              <input
                type="text"
                className="text-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入角色名称..."
                maxLength={20}
              />
            </div>

            <div className="customize-section">
              <label className="input-label">头像颜色</label>
              <div className="color-picker">
                {AVATAR_COLORS.map((color) => (
                  <div
                    key={color}
                    className={`color-option ${avatarColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setAvatarColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="customize-section">
              <label className="input-label">头像形状</label>
              <div className="shape-picker">
                {AVATAR_SHAPES.map((shape) => (
                  <div
                    key={shape}
                    className={`shape-option ${avatarShape === shape ? 'selected' : ''}`}
                    onClick={() => setAvatarShape(shape)}
                  >
                    <div
                      className={`shape-preview shape-${shape}`}
                      style={{ backgroundColor: avatarColor }}
                    />
                    <span>
                      {shape === 'circle' && '圆形'}
                      {shape === 'square' && '方形'}
                      {shape === 'diamond' && '菱形'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="avatar-preview-section">
              <label className="input-label">预览</label>
              <div
                className={`avatar-preview shape-${avatarShape}`}
                style={{ backgroundColor: avatarColor }}
              >
                {(name || '英').charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="step-actions">
              <button className="btn-secondary" onClick={() => setStep('attributes')}>
                ← 上一步
              </button>
              <button className="btn-primary" onClick={() => setStep('confirm')}>
                下一步 →
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="step-content fade-in">
            <h2>确认角色</h2>

            <div className="character-summary">
              <div className="summary-avatar-section">
                <div
                  className={`avatar-large shape-${avatarShape}`}
                  style={{ backgroundColor: avatarColor }}
                >
                  {(name || '英').charAt(0).toUpperCase()}
                </div>
                <h3 className="summary-name">{name || '无名英雄'}</h3>
                <p className="summary-class">
                  {CLASS_DATA[selectedClass].name} · Lv.1
                </p>
              </div>

              <div className="summary-attributes">
                <h4>基础属性</h4>
                <div className="attributes-list">
                  {(Object.keys(attributes) as (keyof Attributes)[]).map((key) => (
                    <div key={key} className="attr-row">
                      <span className="attr-label">{getAttributeNames[key]}</span>
                      <span className="attr-val">{attributes[key]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="summary-stats">
                <div className="stat-item">
                  <span>❤️ 生命值</span>
                  <strong>{CLASS_DATA[selectedClass].baseHealth}</strong>
                </div>
                <div className="stat-item">
                  <span>💧 法力值</span>
                  <strong>{CLASS_DATA[selectedClass].baseMana}</strong>
                </div>
                <div className="stat-item">
                  <span>💰 金币</span>
                  <strong>50</strong>
                </div>
              </div>
            </div>

            <div className="step-actions">
              <button className="btn-secondary" onClick={() => setStep('customize')}>
                ← 上一步
              </button>
              <button className="btn-primary" onClick={createCharacter}>
                ✨ 创建角色
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CharacterCreation;
