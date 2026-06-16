import React from 'react';
import type { EcosystemParams } from './creatures';

interface ControlPanelProps {
  onAddCreature: (type: 'producer' | 'consumer' | 'decomposer') => void;
  onParamsChange: (params: Partial<EcosystemParams>) => void;
  onReset: () => void;
  params: EcosystemParams;
  disabled?: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onAddCreature,
  onParamsChange,
  onReset,
  params,
  disabled = false,
}) => {
  const handlePoolSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    onParamsChange({
      poolWidth: value,
      poolHeight: value * 0.75,
    });
  };

  const handleEnergyDecayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onParamsChange({ energyDecayRate: Number(e.target.value) });
  };

  const handleReproductionThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onParamsChange({ reproductionThresholdMultiplier: Number(e.target.value) });
  };

  const handleMovementSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onParamsChange({ movementSpeedMultiplier: Number(e.target.value) });
  };

  return (
    <div
      style={{
        width: '280px',
        backgroundColor: '#16213e',
        padding: '20px',
        borderRadius: '12px',
        fontFamily: "'JetBrains Mono', monospace",
        color: '#e0e0e0',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      }}
    >
      <h2
        style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '20px',
          color: '#00ff88',
          textShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
          textAlign: 'center',
        }}
      >
        控制面板
      </h2>

      <div style={{ marginBottom: '24px' }}>
        <h3
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '12px',
            color: '#8892b0',
          }}
        >
          投放生物
        </h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
          <button
            type="button"
            onClick={() => onAddCreature('producer')}
            disabled={disabled}
            style={{
              flex: 1,
              minWidth: '48px',
              minHeight: '48px',
              padding: '12px 8px',
              backgroundColor: '#00ff88',
              color: '#0a192f',
              border: 'none',
              borderRadius: '8px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: disabled ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.filter = 'brightness(1.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 255, 136, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid #00ff88';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.outlineOffset = '0';
            }}
          >
            生产者
          </button>

          <button
            type="button"
            onClick={() => onAddCreature('consumer')}
            disabled={disabled}
            style={{
              flex: 1,
              minWidth: '48px',
              minHeight: '48px',
              padding: '12px 8px',
              backgroundColor: '#ff6b6b',
              color: '#0a192f',
              border: 'none',
              borderRadius: '8px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: disabled ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.filter = 'brightness(1.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid #ff6b6b';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.outlineOffset = '0';
            }}
          >
            消费者
          </button>

          <button
            type="button"
            onClick={() => onAddCreature('decomposer')}
            disabled={disabled}
            style={{
              flex: 1,
              minWidth: '48px',
              minHeight: '48px',
              padding: '12px 8px',
              backgroundColor: '#a0a0a0',
              color: '#0a192f',
              border: 'none',
              borderRadius: '8px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: disabled ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.filter = 'brightness(1.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(160, 160, 160, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid #a0a0a0';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.outlineOffset = '0';
            }}
          >
            分解者
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '16px',
            color: '#8892b0',
          }}
        >
          生态参数
        </h3>

        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              fontSize: '12px',
            }}
          >
            <span>生态池大小</span>
            <span style={{ color: '#00ff88', fontWeight: 500 }}>{params.poolWidth}</span>
          </div>
          <input
            type="range"
            min="600"
            max="1000"
            step="10"
            value={params.poolWidth}
            onChange={handlePoolSizeChange}
            disabled={disabled}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: '#0f3460',
              outline: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              accentColor: '#00ff88',
              opacity: disabled ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              fontSize: '12px',
            }}
          >
            <span>能量衰减速率</span>
            <span style={{ color: '#ff6b6b', fontWeight: 500 }}>
              {params.energyDecayRate.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={params.energyDecayRate}
            onChange={handleEnergyDecayChange}
            disabled={disabled}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: '#0f3460',
              outline: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              accentColor: '#ff6b6b',
              opacity: disabled ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              fontSize: '12px',
            }}
          >
            <span>繁殖阈值系数</span>
            <span style={{ color: '#ffd93d', fontWeight: 500 }}>
              {params.reproductionThresholdMultiplier.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={params.reproductionThresholdMultiplier}
            onChange={handleReproductionThresholdChange}
            disabled={disabled}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: '#0f3460',
              outline: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              accentColor: '#ffd93d',
              opacity: disabled ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              fontSize: '12px',
            }}
          >
            <span>生物移动速度</span>
            <span style={{ color: '#4ecdc4', fontWeight: 500 }}>
              {params.movementSpeedMultiplier}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={params.movementSpeedMultiplier}
            onChange={handleMovementSpeedChange}
            disabled={disabled}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: '#0f3460',
              outline: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              accentColor: '#4ecdc4',
              opacity: disabled ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        disabled={disabled}
        style={{
          width: '100%',
          minWidth: '48px',
          minHeight: '48px',
          padding: '14px',
          backgroundColor: '#e94560',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '14px',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.5 : 1,
          letterSpacing: '1px',
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.filter = 'brightness(1.1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(233, 69, 96, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'brightness(1)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        onFocus={(e) => {
          e.currentTarget.style.outline = '2px solid #e94560';
          e.currentTarget.style.outlineOffset = '2px';
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = 'none';
          e.currentTarget.style.outlineOffset = '0';
        }}
      >
        重置生态
      </button>
    </div>
  );
};

export default ControlPanel;
