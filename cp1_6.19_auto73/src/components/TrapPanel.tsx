import React from 'react';
import { TrapType, GuardType, TRAP_COST, GUARD_COST } from '../game/types';

interface TrapPanelProps {
  selectedItem: { type: 'trap' | 'guard'; subtype: TrapType | GuardType } | null;
  onSelectItem: (item: { type: 'trap' | 'guard'; subtype: TrapType | GuardType } | null) => void;
  gold: number;
}

const TrapPanel: React.FC<TrapPanelProps> = ({ selectedItem, onSelectItem, gold }) => {
  const traps: { type: TrapType; name: string; icon: string; desc: string }[] = [
    { type: 'spike', name: '尖刺陷阱', icon: '🔺', desc: '持续伤害10/秒，持续3秒' },
    { type: 'freeze', name: '冰冻陷阱', icon: '❄️', desc: '减速50%，持续5秒' },
    { type: 'bomb', name: '爆炸陷阱', icon: '💣', desc: '范围伤害80点，半径2格' },
  ];

  const guards: { type: GuardType; name: string; icon: string; desc: string }[] = [
    { type: 'swordsman', name: '剑士', icon: '⚔️', desc: '近战攻击30' },
    { type: 'archer', name: '弓箭手', icon: '🏹', desc: '远程攻击20，攻速1.5倍' },
    { type: 'mage', name: '法师', icon: '🧙', desc: '范围攻击15，附带减速' },
  ];

  const isSelected = (type: 'trap' | 'guard', subtype: string) =>
    selectedItem?.type === type && selectedItem?.subtype === subtype;

  const canAffordTrap = gold >= TRAP_COST;
  const canAffordGuard = gold >= GUARD_COST;

  return (
    <div
      style={{
        backgroundColor: '#4A3B32',
        padding: 16,
        borderRadius: 4,
        boxShadow: '0 0 10px rgba(0,0,0,0.3)',
        minWidth: 240,
      }}
    >
      <div
        style={{
          marginBottom: 16,
          paddingBottom: 8,
          borderBottom: '2px solid #D35400',
        }}
      >
        <h3 style={{ color: '#D35400', fontSize: 12, margin: 0 }}>陷阱 ({TRAP_COST}金币)</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {traps.map((trap) => {
          const selected = isSelected('trap', trap.type);
          return (
            <button
              key={trap.type}
              onClick={() =>
                onSelectItem(
                  selected ? null : { type: 'trap', subtype: trap.type }
                )
              }
              disabled={!canAffordTrap}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: 10,
                backgroundColor: selected ? '#D35400' : '#3A3A3A',
                border: selected ? '2px solid #FFD700' : '2px solid #2C1810',
                borderRadius: 4,
                cursor: canAffordTrap ? 'pointer' : 'not-allowed',
                color: canAffordTrap ? '#E8D5B7' : '#666',
                fontSize: 10,
                fontFamily: "'Press Start 2P', sans-serif",
                transition: 'all 0.15s ease',
                opacity: canAffordTrap ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                if (canAffordTrap && !selected) {
                  e.currentTarget.style.backgroundColor = '#555555';
                }
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  e.currentTarget.style.backgroundColor = '#3A3A3A';
                }
              }}
            >
              <span style={{ fontSize: 20 }}>{trap.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ marginBottom: 4 }}>{trap.name}</div>
                <div style={{ fontSize: 8, color: '#95A5A6' }}>{trap.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginBottom: 16,
          paddingBottom: 8,
          borderBottom: '2px solid #D35400',
        }}
      >
        <h3 style={{ color: '#D35400', fontSize: 12, margin: 0 }}>守卫 ({GUARD_COST}金币)</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {guards.map((guard) => {
          const selected = isSelected('guard', guard.type);
          return (
            <button
              key={guard.type}
              onClick={() =>
                onSelectItem(
                  selected ? null : { type: 'guard', subtype: guard.type }
                )
              }
              disabled={!canAffordGuard}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: 10,
                backgroundColor: selected ? '#D35400' : '#3A3A3A',
                border: selected ? '2px solid #FFD700' : '2px solid #2C1810',
                borderRadius: 4,
                cursor: canAffordGuard ? 'pointer' : 'not-allowed',
                color: canAffordGuard ? '#E8D5B7' : '#666',
                fontSize: 10,
                fontFamily: "'Press Start 2P', sans-serif",
                transition: 'all 0.15s ease',
                opacity: canAffordGuard ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                if (canAffordGuard && !selected) {
                  e.currentTarget.style.backgroundColor = '#555555';
                }
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  e.currentTarget.style.backgroundColor = '#3A3A3A';
                }
              }}
            >
              <span style={{ fontSize: 20 }}>{guard.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ marginBottom: 4 }}>{guard.name}</div>
                <div style={{ fontSize: 8, color: '#95A5A6' }}>{guard.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TrapPanel;
