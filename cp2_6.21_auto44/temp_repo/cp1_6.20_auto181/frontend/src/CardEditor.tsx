import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardEffect,
  Rarity,
  RARITY_LABELS,
  EFFECT_TYPE_COLORS,
  EFFECT_TYPE_LABELS,
} from './types';
import { calculateCard, fetchEffects, saveCard } from './apiService';
import { v4 as uuidv4 } from 'uuid';

interface CardEditorProps {
  onCardSaved: () => void;
}

const CardEditor: React.FC<CardEditorProps> = ({ onCardSaved }) => {
  const [cardName, setCardName] = useState('新卡牌');
  const [rarity, setRarity] = useState<Rarity>('common');
  const [selectedEffects, setSelectedEffects] = useState<CardEffect[]>([]);
  const [presetEffects, setPresetEffects] = useState<CardEffect[]>([]);
  const [power, setPower] = useState(0);
  const [cost, setCost] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const loadEffects = async () => {
      try {
        const effects = await fetchEffects();
        setPresetEffects(effects);
      } catch (err) {
        console.error('加载效果列表失败:', err);
      }
    };
    loadEffects();
  }, []);

  useEffect(() => {
    const savedDraft = localStorage.getItem('card_draft');
    if (savedDraft) {
      try {
        const draft: Card = JSON.parse(savedDraft);
        setCardName(draft.name);
        setRarity(draft.rarity);
        setSelectedEffects(draft.effects);
      } catch (err) {
        console.error('恢复草稿失败:', err);
      }
    }
  }, []);

  const updateCalculation = useCallback(async () => {
    if (selectedEffects.length === 0) {
      setPower(0);
      setCost(0);
      setError(undefined);
      return;
    }

    setIsCalculating(true);
    try {
      const result = await calculateCard(selectedEffects, rarity);
      setPower(result.power);
      setCost(result.cost);
      setError(result.error);
    } catch (err) {
      console.error('计算失败:', err);
    } finally {
      setIsCalculating(false);
    }
  }, [selectedEffects, rarity]);

  useEffect(() => {
    updateCalculation();
  }, [updateCalculation]);

  useEffect(() => {
    const draftCard: Card = {
      id: 'draft_' + uuidv4(),
      name: cardName,
      rarity,
      effects: selectedEffects,
      cost,
      power,
      isDraft: true,
    };
    localStorage.setItem('card_draft', JSON.stringify(draftCard));
  }, [cardName, rarity, selectedEffects, cost, power]);

  const toggleEffect = (effect: CardEffect) => {
    setSelectedEffects(prev => {
      const exists = prev.find(e => e.id === effect.id);
      if (exists) {
        return prev.filter(e => e.id !== effect.id);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, effect];
    });
  };

  const handleSaveCard = async () => {
    if (selectedEffects.length === 0) {
      setError('至少需要选择一个效果');
      return;
    }

    if (!cardName.trim()) {
      setError('请输入卡牌名称');
      return;
    }

    const newCard: Card = {
      id: uuidv4(),
      name: cardName.trim(),
      rarity,
      effects: selectedEffects,
      cost,
      power,
      isDraft: false,
    };

    try {
      await saveCard(newCard);
      localStorage.removeItem('card_draft');
      setCardName('新卡牌');
      setRarity('common');
      setSelectedEffects([]);
      onCardSaved();
    } catch (err) {
      setError('保存卡牌失败');
    }
  };

  const handleReset = () => {
    setCardName('新卡牌');
    setRarity('common');
    setSelectedEffects([]);
    localStorage.removeItem('card_draft');
  };

  return (
    <div className="card-editor">
      <div className="editor-panel">
        <h2 className="panel-title">卡牌配置</h2>

        <div className="form-group">
          <label className="form-label">卡牌名称</label>
          <input
            type="text"
            className="form-input"
            value={cardName}
            onChange={e => setCardName(e.target.value)}
            placeholder="请输入卡牌名称"
            maxLength={20}
          />
        </div>

        <div className="form-group">
          <label className="form-label">稀有度</label>
          <select
            className="form-select"
            value={rarity}
            onChange={e => setRarity(e.target.value as Rarity)}
          >
            <option value="common">{RARITY_LABELS.common} (x1.0)</option>
            <option value="rare">{RARITY_LABELS.rare} (x1.5)</option>
            <option value="epic">{RARITY_LABELS.epic} (x2.0)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            选择效果 ({selectedEffects.length}/5)
          </label>
          <div className="effects-list">
            {presetEffects.map(effect => {
              const isSelected = selectedEffects.some(e => e.id === effect.id);
              return (
                <div
                  key={effect.id}
                  className={`effect-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleEffect(effect)}
                >
                  <div className="effect-name">{effect.name}</div>
                  <div className="effect-desc">
                    {EFFECT_TYPE_LABELS[effect.type]} · {effect.description}
                  </div>
                  <span className="effect-cost">费用 {effect.baseCost}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="cost-display">
          <div className="cost-item">
            <span className="cost-label">总费用</span>
            <span className="cost-value">{isCalculating ? '...' : cost}</span>
          </div>
          <div className="cost-item">
            <span className="cost-label">战斗力</span>
            <span className="power-value">{isCalculating ? '...' : power}</span>
          </div>
          <div className="cost-item">
            <span className="cost-label">效果数</span>
            <span className="cost-value">{selectedEffects.length}</span>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#3d1a1a', borderRadius: '8px', color: '#e74c3c', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={handleReset}>
            重置
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSaveCard}
            disabled={selectedEffects.length === 0 || !cardName.trim()}
          >
            保存卡牌
          </button>
        </div>
      </div>

      <div className="editor-panel preview-panel">
        <h2 className="panel-title">卡牌预览</h2>
        <div className={`card-preview rarity-${rarity}`}>
          <div className="card-header">
            <div className="card-name">{cardName || '未命名'}</div>
            <span className={`card-rarity-badge rarity-${rarity}`}>
              {RARITY_LABELS[rarity]}
            </span>
          </div>

          <div className="card-effects">
            {selectedEffects.length === 0 ? (
              <div style={{ color: '#606070', fontSize: '13px', width: '100%', textAlign: 'center', padding: '20px' }}>
                请从左侧选择效果...
              </div>
            ) : (
              selectedEffects.map(effect => (
                <span
                  key={effect.id}
                  className="effect-tag"
                  style={{ backgroundColor: EFFECT_TYPE_COLORS[effect.type] }}
                >
                  {effect.name}
                </span>
              ))
            )}
          </div>

          <div className="card-footer">
            <div className="card-stats">
              <div className="card-stat">
                <div className="card-stat-icon cost">费</div>
                <span className="card-stat-value">{cost}</span>
              </div>
              <div className="card-stat">
                <div className="card-stat-icon power">力</div>
                <span className="card-stat-value">{power}</span>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#9090a0' }}>
              {selectedEffects.length > 0
                ? `已选 ${selectedEffects.length} 个效果`
                : '未选择效果'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardEditor;
