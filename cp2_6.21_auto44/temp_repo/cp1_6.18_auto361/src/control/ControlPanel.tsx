import React, { useState } from 'react';
import { useMineralStore } from '../store/mineralStore';
import { MINERAL_TYPES, MINERAL_ID_LIST } from '../data/oreData';

interface ControlPanelProps {}

const ControlPanel: React.FC<ControlPanelProps> = () => {
  const {
    timeSpeed,
    setTimeSpeed,
    visibleMinerals,
    setMineralVisible,
    resetAll,
  } = useMineralStore();

  const [isResetting, setIsResetting] = useState(false);

  const handleReset = () => {
    setIsResetting(true);
    resetAll();
    setTimeout(() => setIsResetting(false), 300);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        right: '10px',
        transform: 'translateY(-50%)',
        width: '220px',
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        borderRadius: '8px',
        padding: '16px',
        color: '#FFFFFF',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px',
            letterSpacing: '0.5px',
          }}
        >
          控制面板
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
            生长速度
          </span>
          <span
            style={{
              fontSize: '12px',
              color: '#4FC3F7',
              fontWeight: '600',
            }}
          >
            {timeSpeed.toFixed(1)}x
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="5"
          step="0.5"
          value={timeSpeed}
          onChange={(e) => setTimeSpeed(parseFloat(e.target.value))}
          style={{
            width: '100%',
            height: '4px',
            appearance: 'none',
            background: 'linear-gradient(to right, #4FC3F7, #1976D2)',
            borderRadius: '2px',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.5)',
            marginTop: '4px',
          }}
        >
          <span>1x</span>
          <span>5x</span>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '10px',
          }}
        >
          矿物类型筛选
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MINERAL_ID_LIST.map((mineralId) => {
            const mineral = MINERAL_TYPES[mineralId];
            const isChecked = visibleMinerals[mineralId] ?? true;
            return (
              <label
                key={mineralId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  backgroundColor: isChecked
                    ? 'rgba(255,255,255,0.05)'
                    : 'transparent',
                  transition: 'background-color 0.3s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setMineralVisible(mineralId, e.target.checked)}
                  style={{
                    display: 'none',
                  }}
                />
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '3px',
                    backgroundColor: mineral.color,
                    marginRight: '10px',
                    border: isChecked
                      ? '2px solid #FFFFFF'
                      : '2px solid rgba(255,255,255,0.3)',
                    boxShadow: isChecked
                      ? `0 0 8px ${mineral.color}80`
                      : 'none',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                  }}
                >
                  {isChecked && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '1px',
                        left: '3px',
                        width: '6px',
                        height: '10px',
                        border: 'solid #fff',
                        borderWidth: '0 2px 2px 0',
                        transform: 'rotate(45deg)',
                      }}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    color: isChecked ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {mineral.name}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleReset}
        style={{
          width: '120px',
          height: '36px',
          backgroundColor: isResetting ? '#FF6666' : '#FF4444',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '600',
          margin: '0 auto',
          display: 'block',
          transition: 'all 0.3s ease',
          boxShadow: isResetting
            ? '0 0 12px rgba(255,68,68,0.6)'
            : '0 2px 8px rgba(255,68,68,0.3)',
          letterSpacing: '0.5px',
        }}
        onMouseEnter={(e) => {
          if (!isResetting) {
            e.currentTarget.style.backgroundColor = '#FF5555';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,68,68,0.5)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isResetting) {
            e.currentTarget.style.backgroundColor = '#FF4444';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(255,68,68,0.3)';
          }
        }}
      >
        {isResetting ? '重置中...' : '重置场景'}
      </button>
    </div>
  );
};

export default ControlPanel;
