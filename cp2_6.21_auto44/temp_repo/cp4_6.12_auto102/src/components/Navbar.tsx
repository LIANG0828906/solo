import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { RARITY_COLORS, RARITY_LABELS, Rarity, FRAGMENT_TYPES } from '../types';

const Navbar: React.FC = () => {
  const { playerName, currency, backpack, backpackOpen, toggleBackpack } = useGameStore();
  const hasNewItems = backpack.length > 0;

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        background: '#161b22',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#30363d',
            border: '2px solid #58a6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            color: '#58a6ff',
            fontFamily: 'Orbitron, sans-serif',
          }}
        >
          {playerName[0]}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{playerName}</div>
          <div style={{ fontSize: 18, color: '#f5a623', fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>
            {currency.toLocaleString()} ¢
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {FRAGMENT_TYPES.map(f => {
            const count = useGameStore(s => s.fragments[f.id]);
            return (
              <div key={f.id} title={`${f.name}: ${count}`} style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 2 }}>
                <span>{f.icon}</span>
                <span style={{ fontSize: 11, color: '#8b949e' }}>{count}</span>
              </div>
            );
          })}
        </div>
        <button
          onClick={toggleBackpack}
          style={{
            background: 'transparent',
            border: `1px solid ${backpackOpen ? '#58a6ff' : '#30363d'}`,
            borderRadius: 8,
            padding: '6px 12px',
            color: '#e6edf3',
            fontSize: 14,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
          title="背包"
        >
          <span>🎒</span>
          <span style={{ fontSize: 12, color: '#8b949e' }}>{backpack.length}</span>
          {hasNewItems && (
            <div style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderRadius: '50%', background: '#f85149' }} />
          )}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
