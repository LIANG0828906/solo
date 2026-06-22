import React from 'react';
import type { Rarity } from '../../server/database';
import { rarityLabel } from '../../server/database';
import type { ApiItem } from '../api/ApiClient';

interface RatingPanelProps {
  item: ApiItem | null;
  onRate: (rarity: Rarity) => void;
  disabled: boolean;
}

const rarityBtnClass: Record<Rarity, string> = {
  common: 'btn-common',
  rare: 'btn-rare',
  epic: 'btn-epic',
  legendary: 'btn-legendary',
};

const RatingPanel: React.FC<RatingPanelProps> = ({ item, onRate, disabled }) => {
  return (
    <div className="rating-panel">
      {item ? (
        <>
          <div className="item-name">{item.name}</div>
          <div className="item-desc">{item.description}</div>
          <div className="item-attrs">
            {item.attributes.map((a, idx) => (
              <span key={idx} className="attr-tag">
                {a.name}+{a.value}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className="item-desc">正在加载物品...</div>
      )}

      <div className="rating-btn-row">
        {(['common', 'rare', 'epic', 'legendary'] as Rarity[]).map((r) => (
          <button
            key={r}
            className={`game-btn ${rarityBtnClass[r]}`}
            onClick={() => onRate(r)}
            disabled={disabled || !item}
          >
            {rarityLabel(r)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RatingPanel;
