import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import EquipmentCard from './EquipmentCard';
import {
  Equipment,
  FRAGMENT_TYPES,
  RARITY_COLORS,
  RARITY_LABELS,
  Rarity,
  STAT_LABELS,
} from '../types';

const WorkshopPanel: React.FC = () => {
  const [mode, setMode] = useState<'synth' | 'draw'>('draw');
  const [selectedFragments, setSelectedFragments] = useState<string[]>([]);
  const [generatedEquip, setGeneratedEquip] = useState<Equipment | null>(null);
  const drawEquipment = useGameStore(s => s.drawEquipment);
  const synthEquipment = useGameStore(s => s.synthEquipment);
  const logs = useGameStore(s => s.logs);
  const currency = useGameStore(s => s.currency);
  const fragments = useGameStore(s => s.fragments);
  const backpack = useGameStore(s => s.backpack);

  const toggleFragment = (fragId: string) => {
    setSelectedFragments(prev => {
      if (prev.includes(fragId)) {
        return prev.filter(f => f !== fragId);
      }
      if (prev.length >= 3) return prev;
      return [...prev, fragId];
    });
  };

  const handleGenerate = () => {
    if (mode === 'draw') {
      if (currency < 50) return;
      drawEquipment();
      const store = useGameStore.getState();
      if (store.backpack.length > backpack.length) {
        setGeneratedEquip(store.backpack[store.backpack.length - 1]);
      }
    } else {
      if (selectedFragments.length !== 3) return;
      synthEquipment(selectedFragments);
      const store = useGameStore.getState();
      if (store.backpack.length > backpack.length) {
        setGeneratedEquip(store.backpack[store.backpack.length - 1]);
      }
      setSelectedFragments([]);
    }
  };

  const compareStats = backpack.length > 1
    ? backpack[backpack.length - 2]?.stats ?? null
    : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
      <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid #30363d' }}>
        {(['draw', 'synth'] as const).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setSelectedFragments([]); }}
            style={{
              flex: 1,
              padding: '10px 0',
              background: mode === m ? '#1c2331' : '#161b22',
              color: mode === m ? '#58a6ff' : '#8b949e',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'Orbitron, sans-serif',
              borderBottom: mode === m ? '2px solid #58a6ff' : '2px solid transparent',
            }}
          >
            {m === 'draw' ? '⚡ 随机抽取' : '⚛ 碎片合成'}
          </button>
        ))}
      </div>

      {mode === 'draw' ? (
        <DrawPanel currency={currency} />
      ) : (
        <SynthPanel
          selectedFragments={selectedFragments}
          fragments={fragments}
          onToggle={toggleFragment}
        />
      )}

      <button
        onClick={handleGenerate}
        disabled={mode === 'draw' ? currency < 50 : selectedFragments.length !== 3}
        style={{
          padding: '12px 0',
          background: mode === 'draw'
            ? (currency >= 50 ? 'linear-gradient(135deg, #1a3a5c, #0d2137)' : '#1c2331')
            : (selectedFragments.length === 3 ? 'linear-gradient(135deg, #2a1a3c, #1a0d37)' : '#1c2331'),
          border: `1px solid ${mode === 'draw' ? '#58a6ff' : '#8b5cf6'}`,
          borderRadius: 8,
          color: '#e6edf3',
          fontSize: 15,
          fontWeight: 700,
          fontFamily: 'Orbitron, sans-serif',
          letterSpacing: 1,
        }}
      >
        {mode === 'draw'
          ? `抽取装备 (50 ¢)`
          : `合成装备 (${selectedFragments.length}/3)`}
      </button>

      {generatedEquip && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 8 }}>
          <EquipmentCard equipment={generatedEquip} compareStats={compareStats} />
        </div>
      )}

      <WorkshopLog logs={logs} />
    </div>
  );
};

const DrawPanel: React.FC<{ currency: number }> = ({ currency }) => {
  return (
    <div style={{
      background: '#1c233180',
      backdropFilter: 'blur(6px)',
      border: '1px solid #30363d',
      borderRadius: 10,
      padding: 20,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>🎰</div>
      <div style={{ color: '#8b949e', fontSize: 13 }}>
        消耗 <span style={{ color: '#f5a623', fontWeight: 700 }}>50 信用点</span> 随机获取一件装备
      </div>
      <div style={{ color: '#8b949e', fontSize: 12, marginTop: 4 }}>
        当前余额: <span style={{ color: currency >= 50 ? '#f5a623' : '#f85149' }}>{currency} ¢</span>
      </div>
    </div>
  );
};

const SynthPanel: React.FC<{
  selectedFragments: string[];
  fragments: Record<string, number>;
  onToggle: (id: string) => void;
}> = ({ selectedFragments, fragments, onToggle }) => {
  return (
    <div style={{
      background: '#1c233180',
      backdropFilter: 'blur(6px)',
      border: '1px solid #30363d',
      borderRadius: 10,
      padding: 20,
    }}>
      <div style={{ color: '#8b949e', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
        选择 <span style={{ color: '#58a6ff' }}>3个碎片</span> 进行合成
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {FRAGMENT_TYPES.map(f => {
          const selected = selectedFragments.includes(f.id);
          const count = fragments[f.id] || 0;
          const selectedCount = selectedFragments.filter(s => s === f.id).length;
          const available = count - selectedCount;
          return (
            <button
              key={f.id}
              onClick={() => onToggle(f.id)}
              style={{
                width: 80,
                padding: '12px 0',
                background: selected ? '#1a2a4a' : '#161b22',
                border: `1px solid ${selected ? '#58a6ff' : '#30363d'}`,
                borderRadius: 8,
                color: selected ? '#58a6ff' : '#8b949e',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                boxShadow: selected ? '0 0 10px #58a6ff30' : 'none',
                transition: 'all 0.25s',
              }}
            >
              <span style={{ fontSize: 22 }}>{f.icon}</span>
              <span style={{ fontSize: 11 }}>{f.name}</span>
              <span style={{ fontSize: 10, color: available > 0 ? '#3fb950' : '#f85149' }}>×{count}</span>
            </button>
          );
        })}
      </div>
      {selectedFragments.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', gap: 6, justifyContent: 'center' }}>
          {selectedFragments.map((fId, i) => {
            const frag = FRAGMENT_TYPES.find(ft => ft.id === fId);
            return (
              <div key={i} style={{ fontSize: 20, animation: 'fadeIn 0.2s' }}>
                {frag?.icon}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const WorkshopLog: React.FC<{ logs: { id: string; equipment: Equipment; mode: 'synth' | 'draw'; timestamp: number }[] }> = ({ logs }) => {
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 6, fontFamily: 'Orbitron, sans-serif' }}>
        工坊日志
      </div>
      <div style={{ flex: 1, overflow: 'auto', borderRadius: 8, border: '1px solid #30363d' }}>
        {logs.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: '#8b949e', fontSize: 12, background: '#1c2331' }}>
            尚无生成记录
          </div>
        ) : (
          logs.map((log, i) => {
            const rarityColor = RARITY_COLORS[log.equipment.rarity];
            const secondsAgo = Math.floor((Date.now() - log.timestamp) / 1000);
            const timeStr = secondsAgo < 60 ? `${secondsAgo}秒前` : `${Math.floor(secondsAgo / 60)}分钟前`;
            return (
              <div
                key={log.id}
                style={{
                  padding: '8px 12px',
                  background: i % 2 === 0 ? '#1c2331' : '#242d3d',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  animation: 'slideInRight 0.3s',
                  fontSize: 13,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: rarityColor, flexShrink: 0 }} />
                <span style={{ color: rarityColor, flex: 1 }}>{log.equipment.itemName}</span>
                <span style={{ fontSize: 11, color: '#8b949e' }}>{log.mode === 'draw' ? '抽取' : '合成'}</span>
                <span style={{ fontSize: 11, color: '#8b949e' }}>{timeStr}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default WorkshopPanel;
