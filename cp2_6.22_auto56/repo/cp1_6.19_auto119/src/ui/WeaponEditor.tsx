import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { eventBus, type WeaponType, type WeaponConfig } from '../eventBus';

interface WeaponEditorProps {
  weaponConfigs: Record<WeaponType, WeaponConfig>;
}

const WEAPON_INFO: Record<WeaponType, { name: string; icon: string }> = {
  laser: { name: '激光炮', icon: '⚡' },
  missile: { name: '导弹', icon: '🚀' },
  railgun: { name: '电磁炮', icon: '💥' },
};

export const WeaponEditor: React.FC<WeaponEditorProps> = ({ weaponConfigs }) => {
  const [activeWeapon, setActiveWeapon] = useState<WeaponType>('laser');

  const handleDamageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    eventBus.emit('weapon:update', {
      type: activeWeapon,
      config: { damage: value },
    });
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    eventBus.emit('weapon:update', {
      type: activeWeapon,
      config: { range: value },
    });
  };

  const handleFireRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    eventBus.emit('weapon:update', {
      type: activeWeapon,
      config: { fireRate: value },
    });
  };

  const currentConfig = weaponConfigs[activeWeapon];

  return (
    <div
      style={{
        background: 'rgba(11, 12, 16, 0.85)',
        border: '1px solid #45A29E',
        borderRadius: '8px',
        padding: '16px',
        color: '#C5C6C7',
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', color: '#66FCF1', fontSize: '16px', fontWeight: 600 }}>
        武器编辑器
      </h3>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(Object.keys(WEAPON_INFO) as WeaponType[]).map((type) => (
          <motion.button
            key={type}
            onClick={() => setActiveWeapon(type)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              flex: 1,
              padding: '10px 8px',
              border: '1px solid',
              borderColor: activeWeapon === type ? weaponConfigs[type].color : '#1F2833',
              borderRadius: '4px',
              background:
                activeWeapon === type
                  ? `${weaponConfigs[type].color}22`
                  : 'transparent',
              color: activeWeapon === type ? weaponConfigs[type].color : '#C5C6C7',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '20px' }}>{WEAPON_INFO[type].icon}</span>
            <span>{WEAPON_INFO[type].name}</span>
          </motion.button>
        ))}
      </div>

      <motion.div
        key={activeWeapon}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '13px',
            }}
          >
            <span>伤害</span>
            <input
              type="number"
              value={currentConfig.damage}
              onChange={handleDamageChange}
              style={{
                width: '60px',
                padding: '4px 8px',
                background: '#1F2833',
                border: '1px solid #45A29E',
                borderRadius: '3px',
                color: currentConfig.color,
                fontSize: '13px',
                textAlign: 'right',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '13px',
            }}
          >
            <span>射程</span>
            <span style={{ color: currentConfig.color }}>{currentConfig.range}px</span>
          </div>
          <input
            type="range"
            min="50"
            max="150"
            value={currentConfig.range}
            onChange={handleRangeChange}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: '#1F2833',
              appearance: 'none',
              cursor: 'pointer',
              accentColor: currentConfig.color,
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#666',
              marginTop: '4px',
            }}
          >
            <span>50</span>
            <span>150</span>
          </div>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '13px',
            }}
          >
            <span>攻击间隔</span>
            <span style={{ color: currentConfig.color }}>{currentConfig.fireRate.toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={currentConfig.fireRate}
            onChange={handleFireRateChange}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: '#1F2833',
              appearance: 'none',
              cursor: 'pointer',
              accentColor: currentConfig.color,
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#666',
              marginTop: '4px',
            }}
          >
            <span>0.5s</span>
            <span>3.0s</span>
          </div>
        </div>

        <div
          style={{
            padding: '12px',
            background: `${currentConfig.color}15`,
            borderRadius: '4px',
            border: `1px solid ${currentConfig.color}33`,
          }}
        >
          <div style={{ fontSize: '12px', color: currentConfig.color, marginBottom: '8px' }}>
            武器预览
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: `${currentConfig.color}33`,
                border: `2px solid ${currentConfig.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 15px ${currentConfig.color}66`,
              }}
            >
              {WEAPON_INFO[activeWeapon].icon}
            </div>
            <div style={{ flex: 1, fontSize: '12px', lineHeight: '1.8' }}>
              <div>
                伤害: <span style={{ color: currentConfig.color }}>{currentConfig.damage}</span>
              </div>
              <div>
                射程: <span style={{ color: currentConfig.color }}>{currentConfig.range}px</span>
              </div>
              <div>
                频率: <span style={{ color: currentConfig.color }}>{(1 / currentConfig.fireRate).toFixed(2)}/s</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
