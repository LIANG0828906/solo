import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import EquipmentCard from './EquipmentCard';
import {
  Equipment,
  Rarity,
  RARITY_COLORS,
  RARITY_LABELS,
} from '../types';

const BackpackSidebar: React.FC = () => {
  const {
    backpack,
    backpackOpen,
    toggleBackpack,
    backpackFilter,
    setBackpackFilter,
    backpackSearch,
    setBackpackSearch,
    selectEquipment,
    selectedEquipment,
  } = useGameStore();

  const filtered = useMemo(() => {
    let items = backpack;
    if (backpackFilter !== 'all') {
      items = items.filter(e => e.rarity === backpackFilter);
    }
    if (backpackSearch.trim()) {
      const q = backpackSearch.trim().toLowerCase();
      items = items.filter(e => e.itemName.toLowerCase().includes(q));
    }
    return items;
  }, [backpack, backpackFilter, backpackSearch]);

  if (!backpackOpen) return null;

  return (
    <>
      <div
        onClick={toggleBackpack}
        style={{
          position: 'fixed',
          inset: 0,
          background: '#00000070',
          zIndex: 150,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 320,
          background: '#161b22',
          borderLeft: '1px solid #30363d',
          zIndex: 151,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInLeft 0.35s',
        }}
      >
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #30363d',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Orbitron, sans-serif', color: '#58a6ff' }}>
            🎒 背包
          </span>
          <button
            onClick={toggleBackpack}
            style={{
              background: 'transparent',
              border: '1px solid #30363d',
              borderRadius: 6,
              color: '#8b949e',
              padding: '4px 8px',
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '8px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={backpackSearch}
            onChange={e => setBackpackSearch(e.target.value)}
            placeholder="搜索装备..."
            style={{ flex: 1, minWidth: 100, padding: '6px 10px', fontSize: 12 }}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map(r => (
              <button
                key={r}
                onClick={() => setBackpackFilter(r)}
                style={{
                  padding: '3px 6px',
                  background: backpackFilter === r ? (r === 'all' ? '#1c2331' : `${RARITY_COLORS[r]}20`) : 'transparent',
                  border: `1px solid ${backpackFilter === r ? (r === 'all' ? '#58a6ff' : RARITY_COLORS[r]) : '#30363d'}`,
                  borderRadius: 4,
                  color: backpackFilter === r ? (r === 'all' ? '#58a6ff' : RARITY_COLORS[r]) : '#8b949e',
                  fontSize: 10,
                }}
              >
                {r === 'all' ? '全部' : RARITY_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 8,
          }}>
            {filtered.map(eq => (
              <EquipmentCard
                key={eq.id}
                equipment={eq}
                size="small"
                onClick={() => selectEquipment(eq === selectedEquipment ? null : eq)}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: '#8b949e', padding: 24, fontSize: 13 }}>
              背包为空
            </div>
          )}
        </div>

        {selectedEquipment && (
          <EquipmentActionMenu equipment={selectedEquipment} />
        )}
      </div>
    </>
  );
};

const EquipmentActionMenu: React.FC<{ equipment: Equipment }> = ({ equipment }) => {
  const { selectEquipment, setListModalOpen, decomposeItem } = useGameStore();
  const rarityColor = RARITY_COLORS[equipment.rarity];

  return (
    <div style={{
      borderTop: '1px solid #30363d',
      padding: 16,
      background: '#0d1117',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ color: rarityColor, fontWeight: 700, fontSize: 14 }}>{equipment.itemName}</span>
        <button
          onClick={() => selectEquipment(null)}
          style={{ background: 'transparent', border: 'none', color: '#8b949e', fontSize: 14, padding: 4 }}
        >
          ✕
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setListModalOpen(true)}
          style={{
            flex: 1,
            padding: '8px 0',
            background: '#1a2a4a',
            border: '1px solid #58a6ff',
            borderRadius: 6,
            color: '#58a6ff',
            fontSize: 13,
          }}
        >
          📤 上架市场
        </button>
        <button
          onClick={() => decomposeItem(equipment.id)}
          style={{
            flex: 1,
            padding: '8px 0',
            background: '#2a1a1a',
            border: '1px solid #f85149',
            borderRadius: 6,
            color: '#f85149',
            fontSize: 13,
          }}
        >
          🔨 分解
        </button>
      </div>
    </div>
  );
};

export default BackpackSidebar;
