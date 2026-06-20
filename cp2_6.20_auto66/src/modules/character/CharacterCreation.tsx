import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useGameStore } from '../../store/gameStore';
import { CharacterAPI } from './CharacterAPI';
import { rollD6, getAttributeModifier } from '../../utils/dice';
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

interface RollDetail {
  rolls: number[];
  dropped: number;
  total: number;
}

function roll4d6WithDetail(): RollDetail {
  const rolls = [rollD6(), rollD6(), rollD6(), rollD6()];
  const sorted = [...rolls].sort((a, b) => a - b);
  const dropped = sorted[0];
  const total = sorted[1] + sorted[2] + sorted[3];
  return { rolls, dropped, total };
}

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
  const [rollDetails, setRollDetails] = useState<Record<keyof Attributes, RollDetail | null>>({
    strength: null,
    dexterity: null,
    constitution: null,
    intelligence: null,
    wisdom: null,
    charisma: null,
  });
  const [currentRollingAttr, setCurrentRollingAttr] = useState<keyof Attributes | null>(null);
  const [name, setName] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [avatarShape, setAvatarShape] = useState<'circle' | 'square' | 'diamond'>(
    'circle'
  );
  const [isRolling, setIsRolling] = useState(false);
  const [adjustmentsLeft, setAdjustmentsLeft] = useState(2);
  const rollTimerRef = useRef<NodeJS.Timeout[]>([]);

  const clearRollTimers = () => {
    rollTimerRef.current.forEach((t) => clearTimeout(t));
    rollTimerRef.current = [];
  };

  const rollSingleAttribute = (attrKey: keyof Attributes, delay: number): Promise<RollDetail> => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        setCurrentRollingAttr(attrKey);
        const detail = roll4d6WithDetail();
        setRollDetails((prev) => ({ ...prev, [attrKey]: detail }));
        setAttributes((prev) => ({ ...prev, [attrKey]: detail.total }));
        resolve(detail);
      }, delay);
      rollTimerRef.current.push(timer);
    });
  };

  const rollAttributes = async () => {
    if (isRolling) return;
    clearRollTimers();
    setIsRolling(true);
    setCurrentRollingAttr(null);
    setAdjustmentsLeft(2);

    const attrKeys: (keyof Attributes)[] = [
      'strength',
      'dexterity',
      'constitution',
      'intelligence',
      'wisdom',
      'charisma',
    ];

    const newRollDetails: Record<keyof Attributes, RollDetail | null> = {
      strength: null,
      dexterity: null,
      constitution: null,
      intelligence: null,
      wisdom: null,
      charisma: null,
    };

    for (let i = 0; i < attrKeys.length; i++) {
      const detail = await rollSingleAttribute(attrKeys[i], i * 450);
      newRollDetails[attrKeys[i]] = detail;
    }

    const finalAttrs: Attributes = {
      strength: newRollDetails.strength!.total,
      dexterity: newRollDetails.dexterity!.total,
      constitution: newRollDetails.constitution!.total,
      intelligence: newRollDetails.intelligence!.total,
      wisdom: newRollDetails.wisdom!.total,
      charisma: newRollDetails.charisma!.total,
    };

    setTimeout(() => {
      setRolledAttributes(finalAttrs);
      setCurrentRollingAttr(null);
      setIsRolling(false);
    }, 500);
  };

  const adjustAttribute = (attrKey: keyof Attributes, delta: number) => {
    if (adjustmentsLeft <= 0) return;
    if (delta > 0 && adjustmentsLeft <= 0) return;
    const newValue = attributes[attrKey] + delta;
    if (newValue < 3 || newValue > 20) return;

    setAttributes((prev) => ({ ...prev, [attrKey]: newValue }));
    setAdjustmentsLeft((prev) => prev - (delta > 0 ? 1 : delta < 0 ? 0 : 0));
    if (delta < 0) {
      setAdjustmentsLeft((prev) => Math.min(prev + 1, 5));
    }
  };

  useEffect(() => {
    if (step === 'attributes' && !rolledAttributes) {
      rollAttributes();
    }
    return () => {
      clearRollTimers();
    };
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

            <div className="attributes-rolling-section">
              {isRolling && (
                <div className="rolling-status">
                  <DiceRoller autoRoll showResult={false} size="small" />
                  <p className="rolling-text">
                    {currentRollingAttr ? `投掷中: ${getAttributeNames[currentRollingAttr]}` : '准备投骰...'}
                  </p>
                </div>
              )}

              <div className="attributes-grid detailed">
                {(Object.keys(attributes) as (keyof Attributes)[]).map((key) => {
                  const detail = rollDetails[key];
                  const isCurrentRolling = currentRollingAttr === key;
                  const modifier = getAttributeModifier(attributes[key]);
                  return (
                    <div
                      key={key}
                      className={`attribute-item detailed ${isCurrentRolling ? 'rolling' : ''} ${detail ? 'rolled' : ''}`}
                    >
                      <div className="attr-header">
                        <span className="attr-name">{getAttributeNames[key]}</span>
                        <div className="attr-value-group">
                          <span className="attr-value">{attributes[key]}</span>
                          <span className={`attr-modifier ${modifier >= 0 ? 'positive' : 'negative'}`}>
                            ({modifier >= 0 ? '+' : ''}{modifier})
                          </span>
                        </div>
                      </div>
                      {detail && (
                        <div className="roll-detail">
                          <div className="dice-rolls">
                            {detail.rolls.map((r, i) => {
                              const sorted = [...detail.rolls].sort((a, b) => a - b);
                              const isDropped = r === sorted[0] && detail.rolls.filter(x => x === sorted[0]).length - detail.rolls.slice().sort().indexOf(sorted[0]) <= 0 ? i === detail.rolls.indexOf(sorted[0]) : false;
                              return (
                                <span
                                  key={i}
                                  className={`mini-dice ${isDropped ? 'dropped' : ''}`}
                                >
                                  {r}
                                </span>
                              );
                            })}
                          </div>
                          <span className="roll-total">= {detail.total}</span>
                        </div>
                      )}
                      {!isRolling && rolledAttributes && (
                        <div className="attr-adjust">
                          <button
                            className="adjust-btn minus"
                            onClick={() => adjustAttribute(key, -1)}
                            disabled={attributes[key] <= 3}
                          >
                            −
                          </button>
                          <span className="adjust-label">微调</span>
                          <button
                            className="adjust-btn plus"
                            onClick={() => adjustAttribute(key, 1)}
                            disabled={attributes[key] >= 20 || adjustmentsLeft <= 0}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!isRolling && rolledAttributes && (
                <div className="reroll-section">
                  <div className="adjustments-info">
                    <span>剩余微调点数: <strong>{adjustmentsLeft}</strong></span>
                  </div>
                  <button className="btn-secondary" onClick={rollAttributes}>
                    🎲 重新投掷
                  </button>
                  <p className="reroll-hint">你可以无限次重新投掷，或使用微调点手动调整</p>
                </div>
              )}
            </div>

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
