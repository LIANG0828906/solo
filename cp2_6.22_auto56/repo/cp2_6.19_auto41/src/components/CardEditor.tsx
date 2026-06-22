import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { SKILL_LIST, SkillType } from '../utils/battleEngine';

interface NumAnimProps {
  value: number;
}

function AnimatedNumber({ value }: NumAnimProps) {
  const prevRef = useRef(value);
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => {
    if (prevRef.current !== value) {
      setAnimKey((k) => k + 1);
      prevRef.current = value;
    }
  }, [value]);
  return (
    <span className="num-display" key={animKey}>
      <span className="num-animate">{value}</span>
    </span>
  );
}

interface EditCardProps {
  side: 'red' | 'blue';
}

function EditableCard({ side }: EditCardProps) {
  const card = useGameStore((s) => (side === 'red' ? s.redCard : s.blueCard));
  const updateCard = useGameStore((s) => s.updateCard);
  const isBattling = useGameStore((s) => s.isBattling);
  const [flipped, setFlipped] = useState(false);

  const clampHp = (v: number) => Math.max(1, Math.min(999, Math.floor(v)));
  const clampAtk = (v: number) => Math.max(1, Math.min(99, Math.floor(v)));

  const handleChange = (field: string, raw: string) => {
    if (field === 'name') {
      updateCard(side, { name: raw.slice(0, 20) });
    } else if (field === 'skill') {
      updateCard(side, { skill: raw as SkillType });
    } else if (field === 'hp') {
      const n = parseInt(raw, 10);
      if (!isNaN(n)) updateCard(side, { hp: clampHp(n) });
    } else if (field === 'attack') {
      const n = parseInt(raw, 10);
      if (!isNaN(n)) updateCard(side, { attack: clampAtk(n) });
    }
  };

  const skillLabel = SKILL_LIST.find((s) => s.value === card.skill)?.label ?? '无技能';

  return (
    <div className={`card-edit-item glass-card side-${side}`}>
      <div
        className={`skill-glow-wrap skill-${card.skill} ${card.skill !== 'none' ? 'active' : ''}`}
      />
      <div className="card-edit-inner">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="card-side-label">
            <span className="dot" />
            {side === 'red' ? '红方卡牌' : '蓝方卡牌'}
          </div>
          <button
            type="button"
            className="flip-toggle-btn"
            onClick={() => setFlipped((f) => !f)}
            disabled={isBattling}
          >
            {flipped ? '← 返回编辑' : '预览 →'}
          </button>
        </div>

        <div className={`card-flip ${flipped ? 'flipped' : ''}`}>
          <div className="card-flip-inner" style={{ position: 'relative', minHeight: '240px' }}>
            <div className="flip-face">
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">卡牌名称</label>
                  <input
                    className="form-input"
                    type="text"
                    value={card.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    disabled={isBattling}
                    placeholder="输入名称（最多20字）"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    生命值 HP <AnimatedNumber value={card.hp} />
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    max={999}
                    value={card.hp}
                    onChange={(e) => handleChange('hp', e.target.value)}
                    disabled={isBattling}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    攻击力 ATK <AnimatedNumber value={card.attack} />
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    max={99}
                    value={card.attack}
                    onChange={(e) => handleChange('attack', e.target.value)}
                    disabled={isBattling}
                  />
                </div>
                <div className="form-group full">
                  <label className="form-label">技能选择</label>
                  <div className="skill-option-grid">
                    {SKILL_LIST.map((sk) => (
                      <div
                        key={sk.value}
                        data-skill={sk.value}
                        className={`skill-option ${card.skill === sk.value ? 'selected' : ''}`}
                        onClick={() => !isBattling && handleChange('skill', sk.value)}
                        style={isBattling ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                      >
                        <span className="skill-option-name">{sk.label}</span>
                        <span className="skill-option-desc">{sk.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-group full">
                  <label className="form-label">技能描述（最多50字）</label>
                  <textarea
                    className="form-textarea"
                    value={SKILL_LIST.find((s) => s.value === card.skill)?.desc ?? ''}
                    readOnly
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="flip-face flip-face-back glass-card" style={{ border: '1px dashed var(--glass-border)' }}>
              <div className={`preview-name side-${side === 'red' ? 'red' : 'blue'}`}
                style={{ color: side === 'red' ? 'var(--color-red)' : 'var(--color-blue)' }}>
                {card.name}
              </div>
              <div className="preview-stats">
                <span className="hp">❤ {card.hp}</span>
                <span className="atk">⚔ {card.attack}</span>
              </div>
              <div
                className={`preview-skill skill-${card.skill}`}
                style={{
                  color:
                    card.skill === 'combo' ? 'var(--color-combo)' :
                    card.skill === 'lifesteal' ? 'var(--color-lifesteal)' :
                    card.skill === 'shield' ? 'var(--color-shield)' :
                    card.skill === 'burn' ? 'var(--color-burn)' : 'var(--color-text-dim)',
                }}
              >
                {skillLabel}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-dim)', fontStyle: 'italic', marginTop: 8 }}>
                {SKILL_LIST.find((s) => s.value === card.skill)?.desc}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CardEditor() {
  return (
    <div className="card-editor-wrap">
      <EditableCard side="red" />
      <EditableCard side="blue" />
    </div>
  );
}
