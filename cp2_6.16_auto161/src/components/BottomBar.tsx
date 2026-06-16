import React, { useState } from 'react';
import { BeeType } from '../types';

interface BottomBarProps {
  selectedBeeType: BeeType | null;
  onSelectBeeType: (type: BeeType | null) => void;
  onUpgradeHive: () => void;
  hiveLevel: number;
  maxHiveLevel: number;
  upgradeCost: number;
  canUpgrade: boolean;
  honey: number;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  selectedBeeType,
  onSelectBeeType,
  onUpgradeHive,
  hiveLevel,
  maxHiveLevel,
  upgradeCost,
  canUpgrade,
  honey,
}) => {
  const [pressedButton, setPressedButton] = useState<BeeType | 'upgrade' | null>(null);

  const beeTypes: { type: BeeType; name: string; cost: number; icon: string; hotkey: string; color: string }[] = [
    { type: 'collector', name: '采集蜂', cost: 10, icon: '🐝', hotkey: 'Q', color: '#FFD700' },
    { type: 'scout', name: '侦察蜂', cost: 15, icon: '🔍', hotkey: 'W', color: '#C0C0C0' },
    { type: 'guardian', name: '护卫蜂', cost: 25, icon: '⚔️', hotkey: 'E', color: '#DC143C' },
  ];

  const handleBeeClick = (type: BeeType) => {
    setPressedButton(type);
    setTimeout(() => setPressedButton(null), 150);
    onSelectBeeType(selectedBeeType === type ? null : type);
  };

  const handleUpgradeClick = () => {
    if (!canUpgrade) return;
    setPressedButton('upgrade');
    setTimeout(() => setPressedButton(null), 150);
    onUpgradeHive();
  };

  return (
    <div className="bottom-bar">
      <div className="bee-selector">
        {beeTypes.map((bee) => {
          const isSelected = selectedBeeType === bee.type;
          const isPressed = pressedButton === bee.type;
          const canAfford = honey >= bee.cost;
          
          return (
            <button
              key={bee.type}
              className={`bee-btn ${isSelected ? 'selected' : ''} ${isPressed ? 'pressed' : ''} ${!canAfford ? 'disabled' : ''}`}
              onClick={() => canAfford && handleBeeClick(bee.type)}
              style={{
                borderColor: isSelected ? bee.color : undefined,
                boxShadow: isSelected ? `0 0 12px ${bee.color}80` : undefined,
              }}
            >
              <span className="bee-icon">{bee.icon}</span>
              <span className="bee-name">{bee.name}</span>
              <span className="bee-cost">🍯 {bee.cost}</span>
              <span className="hotkey-badge">{bee.hotkey}</span>
            </button>
          );
        })}
      </div>

      <div className="hive-upgrade">
        <button
          className={`upgrade-btn ${pressedButton === 'upgrade' ? 'pressed' : ''} ${!canUpgrade ? 'disabled' : ''}`}
          onClick={handleUpgradeClick}
          disabled={!canUpgrade}
        >
          <span className="upgrade-icon">⬆</span>
          <span className="upgrade-text">
            {hiveLevel >= maxHiveLevel 
              ? '已满级' 
              : `升级蜂巢 (Lv.${hiveLevel} → Lv.${hiveLevel + 1})`
            }
          </span>
          {hiveLevel < maxHiveLevel && (
            <span className="upgrade-cost">🍯 {upgradeCost}</span>
          )}
        </button>
      </div>

      <div className="tips">
        <span>提示：选择蜜蜂类型后点击地图派遣 | 快捷键 Q/W/E 选择蜜蜂类型</span>
      </div>
    </div>
  );
};
