import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Card } from './types';

interface CardEditorProps {
  cardLibrary: Card[];
  onAddCard: (card: Card) => void;
}

const CardEditor: React.FC<CardEditorProps> = ({ cardLibrary, onAddCard }) => {
  const [name, setName] = useState('');
  const [cost, setCost] = useState(3);
  const [attack, setAttack] = useState(3);
  const [health, setHealth] = useState(5);
  const [effectText, setEffectText] = useState('');

  const isEffectOverLimit = effectText.length > 100;

  const handleCostChange = useCallback((delta: number) => {
    setCost(prev => Math.max(1, Math.min(10, prev + delta)));
  }, []);

  const handleAttackChange = useCallback((delta: number) => {
    setAttack(prev => Math.max(1, Math.min(20, prev + delta)));
  }, []);

  const handleHealthChange = useCallback((delta: number) => {
    setHealth(prev => Math.max(1, Math.min(30, prev + delta)));
  }, []);

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;
    if (isEffectOverLimit) return;

    const newCard: Card = {
      id: uuidv4(),
      name: name.trim(),
      cost,
      attack,
      health,
      maxHealth: health,
      effectText: effectText.trim(),
    };
    onAddCard(newCard);
    setName('');
    setEffectText('');
  }, [name, cost, attack, health, effectText, isEffectOverLimit, onAddCard]);

  const btnBaseStyle: React.CSSProperties = {
    backgroundColor: '#0ea5e9',
    color: '#fff',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'background-color 0.2s',
  };

  const btnDisabledStyle: React.CSSProperties = {
    backgroundColor: '#475569',
    color: '#94a3b8',
    opacity: 0.5,
    cursor: 'not-allowed',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '14px',
    fontWeight: 600,
    pointerEvents: 'none',
  };

  const Counter: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    onDec: () => void;
    onInc: () => void;
    accentColor?: string;
  }> = ({ label, value, min, max, onDec, onInc, accentColor }) => (
    <div style={{ marginBottom: '14px' }}>
      <label style={{
        display: 'block',
        marginBottom: '6px',
        fontSize: '13px',
        color: '#cbd5e1',
        fontWeight: 500,
      }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onDec}
          disabled={value <= min}
          style={value <= min ? btnDisabledStyle : btnBaseStyle}
          onMouseEnter={(e) => { if (value > min) (e.currentTarget.style.backgroundColor = '#0284c7'); }}
          onMouseLeave={(e) => { if (value > min) (e.currentTarget.style.backgroundColor = '#0ea5e9'); }}
          onMouseDown={(e) => { if (value > min) (e.currentTarget.style.backgroundColor = '#0369a1'); }}
          onMouseUp={(e) => { if (value > min) (e.currentTarget.style.backgroundColor = '#0284c7'); }}
        >
          −
        </button>
        <span style={{
          flex: 1,
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 700,
          color: accentColor || '#f8fafc',
          minWidth: '40px',
        }}>
          {value}
        </span>
        <button
          onClick={onInc}
          disabled={value >= max}
          style={value >= max ? btnDisabledStyle : btnBaseStyle}
          onMouseEnter={(e) => { if (value < max) (e.currentTarget.style.backgroundColor = '#0284c7'); }}
          onMouseLeave={(e) => { if (value < max) (e.currentTarget.style.backgroundColor = '#0ea5e9'); }}
          onMouseDown={(e) => { if (value < max) (e.currentTarget.style.backgroundColor = '#0369a1'); }}
          onMouseUp={(e) => { if (value < max) (e.currentTarget.style.backgroundColor = '#0284c7'); }}
        >
          +
        </button>
      </div>
    </div>
  );

  const CardPreview: React.FC<{ card: Card; isPreview?: boolean }> = ({ card, isPreview }) => (
    <div
      style={{
        width: '180px',
        height: '250px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '2px solid #94a3b8',
        padding: '10px',
        color: '#1e293b',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s',
        cursor: isPreview ? 'default' : 'pointer',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
      className={isPreview ? '' : 'library-card'}
      onMouseEnter={(e) => {
        if (!isPreview) {
          e.currentTarget.style.borderColor = '#f59e0b';
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.25)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isPreview) {
          e.currentTarget.style.borderColor = '#94a3b8';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
      }}>
        <span style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#1e293b',
          maxWidth: '110px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {card.name}
        </span>
        <span style={{
          backgroundColor: '#0ea5e9',
          color: '#fff',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {card.cost}
        </span>
      </div>

      <div style={{
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderRadius: '8px',
        marginBottom: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '36px',
        background: `linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)`,
      }}>
        ⚔️
      </div>

      <div style={{
        fontSize: '10px',
        color: '#475569',
        minHeight: '28px',
        lineHeight: 1.3,
        marginBottom: '6px',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {card.effectText || '（无特效）'}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          backgroundColor: '#ef4444',
          color: '#fff',
          borderRadius: '6px',
          padding: '2px 8px',
          fontSize: '12px',
          fontWeight: 700,
        }}>
          ⚔ {card.attack}
        </span>
        <span style={{
          backgroundColor: '#22c55e',
          color: '#fff',
          borderRadius: '6px',
          padding: '2px 8px',
          fontSize: '12px',
          fontWeight: 700,
        }}>
          ❤ {card.health}
        </span>
      </div>
    </div>
  );

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0f172a',
      borderRadius: '12px',
      padding: '16px',
      overflow: 'hidden',
    }}>
      <h2 style={{
        fontSize: '18px',
        fontWeight: 700,
        marginBottom: '16px',
        color: '#f8fafc',
        borderBottom: '1px solid #334155',
        paddingBottom: '10px',
      }}>
        🎴 卡牌编辑器
      </h2>

      <div style={{ display: 'flex', gap: '16px', flex: 1, overflow: 'hidden' }}>
        <div style={{
          width: '220px',
          flexShrink: 0,
          overflowY: 'auto',
          paddingRight: '8px',
        }}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '13px',
              color: '#cbd5e1',
              fontWeight: 500,
            }}>
              卡牌名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入卡牌名称..."
              maxLength={20}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #475569',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                fontSize: '13px',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#0ea5e9')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#475569')}
            />
          </div>

          <Counter
            label="费用 (1-10)"
            value={cost}
            min={1}
            max={10}
            onDec={() => handleCostChange(-1)}
            onInc={() => handleCostChange(1)}
            accentColor="#38bdf8"
          />
          <Counter
            label="攻击力 (1-20)"
            value={attack}
            min={1}
            max={20}
            onDec={() => handleAttackChange(-1)}
            onInc={() => handleAttackChange(1)}
            accentColor="#f87171"
          />
          <Counter
            label="生命值 (1-30)"
            value={health}
            min={1}
            max={30}
            onDec={() => handleHealthChange(-1)}
            onInc={() => handleHealthChange(1)}
            accentColor="#4ade80"
          />

          <div style={{ marginBottom: '14px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '13px',
              color: '#cbd5e1',
              fontWeight: 500,
            }}>
              效果文本 ({effectText.length}/100)
            </label>
            <textarea
              value={effectText}
              onChange={(e) => setEffectText(e.target.value)}
              placeholder="描述卡牌效果..."
              rows={3}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: isEffectOverLimit ? '2px solid #ef4444' : '1px solid #475569',
                backgroundColor: '#1e293b',
                color: isEffectOverLimit ? '#ef4444' : '#f8fafc',
                fontSize: '12px',
                resize: 'none',
                transition: 'border-color 0.2s',
                lineHeight: 1.4,
              }}
              onFocus={(e) => {
                if (!isEffectOverLimit) e.currentTarget.style.borderColor = '#0ea5e9';
              }}
              onBlur={(e) => {
                if (!isEffectOverLimit) e.currentTarget.style.borderColor = '#475569';
              }}
            />
            {isEffectOverLimit && (
              <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>
                文本超过100字限制！
              </p>
            )}
          </div>

          <button
            onClick={handleCreate}
            disabled={!name.trim() || isEffectOverLimit}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: (!name.trim() || isEffectOverLimit) ? '#475569' : '#0ea5e9',
              color: '#fff',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: (!name.trim() || isEffectOverLimit) ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (name.trim() && !isEffectOverLimit) {
                e.currentTarget.style.backgroundColor = '#0284c7';
              }
            }}
            onMouseLeave={(e) => {
              if (name.trim() && !isEffectOverLimit) {
                e.currentTarget.style.backgroundColor = '#0ea5e9';
              }
            }}
            onMouseDown={(e) => {
              if (name.trim() && !isEffectOverLimit) {
                e.currentTarget.style.backgroundColor = '#0369a1';
              }
            }}
            onMouseUp={(e) => {
              if (name.trim() && !isEffectOverLimit) {
                e.currentTarget.style.backgroundColor = '#0284c7';
              }
            }}
          >
            ✨ 创建卡牌
          </button>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderLeft: '1px solid #334155',
          paddingLeft: '16px',
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#94a3b8',
            marginBottom: '12px',
          }}>
            卡牌库 ({cardLibrary.length}张)
          </h3>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 180px)',
            gap: '12px',
            alignContent: 'start',
            paddingRight: '4px',
          }}>
            {name.trim() && !isEffectOverLimit && (
              <CardPreview
                isPreview
                card={{
                  id: 'preview',
                  name: name.trim(),
                  cost,
                  attack,
                  health,
                  maxHealth: health,
                  effectText: effectText.trim(),
                }}
              />
            )}
            {cardLibrary.map(card => (
              <CardPreview key={card.id} card={card} />
            ))}
            {cardLibrary.length === 0 && !name.trim() && (
              <div style={{
                gridColumn: '1 / -1',
                padding: '40px 20px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '13px',
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                border: '2px dashed #334155',
              }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>📦</div>
                <p>卡牌库为空</p>
                <p style={{ marginTop: '4px', fontSize: '12px' }}>在左侧创建你的第一张卡牌吧！</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardEditor;
