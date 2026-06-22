import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { ItemFragment, Equipment, InventoryFilter, Rarity, EquipmentSlot } from '../../types';
import { canCraft, filterFragments, sortFragments } from './inventoryManager';
import './inventoryUI.css';

interface InventoryUIProps {
  fragments: ItemFragment[];
  equipment: Equipment[];
  onCraft: (fragmentId: string) => void;
}

const rarityColors: Record<Rarity, string> = {
  common: '#7F8C8D',
  rare: '#2980B9',
  epic: '#8E44AD',
  legendary: '#F39C12',
};

const slotColors: Record<EquipmentSlot, string> = {
  weapon: '#E74C3C',
  armor: '#3498DB',
  accessory: '#2ECC71',
};

const slotNames: Record<EquipmentSlot, string> = {
  weapon: '武器',
  armor: '护甲',
  accessory: '饰品',
};

const rarityNames: Record<Rarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

function getRarityStars(rarity: Rarity): string {
  const counts: Record<Rarity, number> = {
    common: 1,
    rare: 2,
    epic: 3,
    legendary: 5,
  };
  return '★'.repeat(counts[rarity]);
}

interface FragmentItemProps {
  fragment: ItemFragment;
  onClick: () => void;
  onCraft: () => void;
  isVisible: boolean;
}

const FragmentItem: React.FC<FragmentItemProps> = React.memo(({ fragment, onClick, onCraft, isVisible }) => {
  const craftable = canCraft(fragment);
  const color = rarityColors[fragment.rarity];

  if (!isVisible) {
    return <div className="inventory-slot inventory-slot-placeholder" />;
  }

  return (
    <div
      className="inventory-slot"
      style={{
        borderColor: color,
        boxShadow: craftable ? `0 0 15px ${color}88` : 'none',
      }}
      onClick={onClick}
    >
      <div className="slot-icon">
        <SlotIcon slot={fragment.slot} color={slotColors[fragment.slot]} />
      </div>
      <div className="slot-stars" style={{ color }}>
        {getRarityStars(fragment.rarity)}
      </div>
      <div className="slot-quantity">x{fragment.quantity}</div>
      {craftable && (
        <button
          className="craft-button"
          onClick={(e) => {
            e.stopPropagation();
            onCraft();
          }}
        >
          合成
        </button>
      )}
    </div>
  );
});

FragmentItem.displayName = 'FragmentItem';

interface SlotIconProps {
  slot: EquipmentSlot;
  color: string;
}

const SlotIcon: React.FC<SlotIconProps> = ({ slot, color }) => {
  if (slot === 'weapon') {
    return (
      <div
        className="weapon-shape-inv"
        style={{ borderBottomColor: color }}
      />
    );
  }
  if (slot === 'armor') {
    return <div className="armor-shape-inv" style={{ backgroundColor: color }} />;
  }
  return <div className="accessory-shape-inv" style={{ backgroundColor: color }} />;
};

interface EquipmentItemProps {
  equipment: Equipment;
}

const EquipmentItem: React.FC<EquipmentItemProps> = ({ equipment }) => {
  const color = rarityColors[equipment.rarity];

  return (
    <div
      className="inventory-slot equipment-slot"
      style={{
        borderColor: color,
        boxShadow: `0 0 20px ${color}88`,
      }}
    >
      <div className="slot-icon equipment-icon">
        <SlotIcon slot={equipment.slot} color={slotColors[equipment.slot]} />
      </div>
      <div className="slot-stars" style={{ color }}>
        {getRarityStars(equipment.rarity)}
      </div>
      <div className="equipment-badge" style={{ backgroundColor: color }}>
        装备
      </div>
    </div>
  );
};

interface ItemDetailModalProps {
  fragment: ItemFragment | null;
  onClose: () => void;
  onCraft: () => void;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ fragment, onClose, onCraft }) => {
  if (!fragment) return null;

  const craftable = canCraft(fragment);
  const color = rarityColors[fragment.rarity];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ color }}>{fragment.name}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-icon-large">
            <SlotIcon slot={fragment.slot} color={slotColors[fragment.slot]} />
          </div>

          <div className="detail-info">
            <div className="detail-row">
              <span className="detail-label">部位</span>
              <span className="detail-value">{slotNames[fragment.slot]}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">稀有度</span>
              <span className="detail-value" style={{ color }}>
                {getRarityStars(fragment.rarity)} {rarityNames[fragment.rarity]}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">所属套装</span>
              <span className="detail-value">{fragment.setName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">持有数量</span>
              <span className="detail-value">
                <span style={{ color: craftable ? '#00d4aa' : '#e0e0e0' }}>
                  {fragment.quantity}
                </span>
                <span style={{ color: '#888' }}> / {fragment.requiredForCraft}</span>
              </span>
            </div>
          </div>

          <div className="craft-progress">
            <div
              className="craft-progress-bar"
              style={{
                width: `${Math.min(100, (fragment.quantity / fragment.requiredForCraft) * 100)}%`,
                backgroundColor: craftable ? '#00d4aa' : color,
              }}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            className={`craft-button-large ${craftable ? '' : 'disabled'}`}
            onClick={onCraft}
            disabled={!craftable}
          >
            {craftable ? '立即合成' : '碎片不足'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const InventoryUI: React.FC<InventoryUIProps> = ({
  fragments,
  equipment,
  onCraft,
}) => {
  const [filter, setFilter] = useState<InventoryFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedFragment, setSelectedFragment] = useState<ItemFragment | null>(null);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const displayedFragments = useMemo(() => {
    const filtered = filterFragments(fragments, filter, search);
    return sortFragments(filtered);
  }, [fragments, filter, search]);

  const allItems = useMemo(() => {
    return [...equipment.map((e) => ({ type: 'equipment' as const, data: e })),
      ...displayedFragments.map((f) => ({ type: 'fragment' as const, data: f }))];
  }, [equipment, displayedFragments]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkVisibility = () => {
      const containerRect = container.getBoundingClientRect();
      const newVisible = new Set<number>();
      const slotSize = 100;
      const gap = 12;
      const columns = Math.max(1, Math.floor(container.clientWidth / (slotSize + gap)));

      for (let i = 0; i < allItems.length; i++) {
        const row = Math.floor(i / columns);
        const itemTop = row * (slotSize + gap);
        const itemBottom = itemTop + slotSize;
        const viewTop = -container.scrollTop;
        const viewBottom = viewTop + container.clientHeight;

        if (itemBottom >= viewTop - 100 && itemTop <= viewBottom + 100) {
          newVisible.add(i);
        }
      }

      setVisibleItems(newVisible);
    };

    checkVisibility();
    container.addEventListener('scroll', checkVisibility, { passive: true });
    window.addEventListener('resize', checkVisibility);

    return () => {
      container.removeEventListener('scroll', checkVisibility);
      window.removeEventListener('resize', checkVisibility);
    };
  }, [allItems.length]);

  const handleCraft = (fragmentId: string) => {
    onCraft(fragmentId);
    setSelectedFragment(null);
  };

  const filterOptions: { value: InventoryFilter; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'weapon', label: '武器' },
    { value: 'armor', label: '护甲' },
    { value: 'accessory', label: '饰品' },
  ];

  return (
    <div className="inventory-panel">
      <div className="inventory-header">
        <h2 className="inventory-title">背包</h2>
        <div className="inventory-stats">
          <span>碎片: {fragments.reduce((s, f) => s + f.quantity, 0)}</span>
          <span>装备: {equipment.length}</span>
        </div>
      </div>

      <div className="inventory-toolbar">
        <input
          type="text"
          className="inventory-search"
          placeholder="搜索碎片..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="inventory-filters">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              className={`filter-btn ${filter === opt.value ? 'active' : ''}`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="inventory-grid-container" ref={containerRef}>
        <div className="inventory-grid">
          {allItems.map((item, index) =>
            item.type === 'equipment' ? (
              <EquipmentItem key={item.data.id} equipment={item.data} />
            ) : (
              <FragmentItem
                key={item.data.id}
                fragment={item.data}
                onClick={() => setSelectedFragment(item.data)}
                onCraft={() => handleCraft(item.data.id)}
                isVisible={visibleItems.has(index)}
              />
            )
          )}
        </div>
      </div>

      <ItemDetailModal
        fragment={selectedFragment}
        onClose={() => setSelectedFragment(null)}
        onCraft={() => selectedFragment && handleCraft(selectedFragment.id)}
      />
    </div>
  );
};
