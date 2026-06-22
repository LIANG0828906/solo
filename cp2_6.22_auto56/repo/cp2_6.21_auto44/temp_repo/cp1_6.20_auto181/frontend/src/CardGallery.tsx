import React, { useState } from 'react';
import {
  Card,
  EffectType,
  RARITY_LABELS,
  EFFECT_TYPE_COLORS,
  EFFECT_TYPE_LABELS,
} from './types';

interface CardGalleryProps {
  cards: Card[];
  onRefresh: () => void;
}

const CardGallery: React.FC<CardGalleryProps> = ({ cards, onRefresh }) => {
  const [filterType, setFilterType] = useState<EffectType | 'all'>('all');

  const filteredCards = cards.filter(card => {
    if (filterType === 'all') return true;
    return card.effects.some(e => e.type === filterType);
  });

  return (
    <div className="card-gallery">
      <div className="gallery-header">
        <h2 className="panel-title" style={{ marginBottom: 0 }}>
          卡牌图鉴 ({filteredCards.length} 张)
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            className="form-select filter-select"
            value={filterType}
            onChange={e => setFilterType(e.target.value as EffectType | 'all')}
          >
            <option value="all">全部效果类型</option>
            <option value="attack">攻击类</option>
            <option value="defense">防御类</option>
            <option value="draw">抽牌类</option>
            <option value="heal">回复类</option>
          </select>
          <button
            className="btn btn-secondary"
            onClick={onRefresh}
            style={{ flex: 'none', padding: '10px 16px' }}
          >
            刷新
          </button>
        </div>
      </div>

      {filteredCards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🃏</div>
          <div className="empty-state-text">
            {cards.length === 0
              ? '暂无卡牌，请先在编辑器中创建卡牌'
              : '没有符合筛选条件的卡牌'}
          </div>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredCards.map(card => (
            <div
              key={card.id}
              className={`gallery-card rarity-${card.rarity} ${card.isDraft ? 'is-draft' : ''}`}
            >
              {card.isDraft && <span className="draft-badge">草稿</span>}
              <div className="gallery-card-name">{card.name}</div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#9090a0',
                  marginBottom: '8px',
                }}
              >
                {RARITY_LABELS[card.rarity]}
              </div>
              <div className="gallery-card-effects">
                {card.effects.map(effect => (
                  <span
                    key={effect.id}
                    className="effect-tag"
                    style={{
                      backgroundColor: EFFECT_TYPE_COLORS[effect.type],
                      padding: '3px 8px',
                      fontSize: '10px',
                    }}
                  >
                    {EFFECT_TYPE_LABELS[effect.type]}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: '#b0b0c0', marginBottom: '8px' }}>
                {card.effects.map(e => e.name).join(' · ')}
              </div>
              <div className="gallery-card-footer">
                <span className="gallery-card-stat">
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#f39c12',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: 'white',
                      fontWeight: '700',
                    }}
                  >
                    费
                  </span>
                  {card.cost}
                </span>
                <span className="gallery-card-stat">
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#e74c3c',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: 'white',
                      fontWeight: '700',
                    }}
                  >
                    力
                  </span>
                  {card.power}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CardGallery;
