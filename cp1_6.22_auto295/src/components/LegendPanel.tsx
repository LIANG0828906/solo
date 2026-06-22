import React from 'react';
import type { BuildingType } from '../types';
import { BUILDING_COLORS, BUILDING_LABELS } from '../types';

interface LegendPanelProps {
  schemeIndex: number;
}

const LegendPanel: React.FC<LegendPanelProps> = ({ schemeIndex }) => {
  const schemeLabels = ['改造前', '方案A', '方案B'];
  const currentLabel = schemeLabels[schemeIndex] || '';

  const buildingTypes: BuildingType[] = ['industrial', 'residential', 'commercial', 'facility'];

  return (
    <div
      style={{
        position: 'absolute',
        right: 16,
        top: 16,
        background: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 8,
        padding: 16,
        zIndex: 10,
        minWidth: 180,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          color: '#FFFFFF',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        当前方案: {currentLabel}
      </div>

      <div
        style={{
          color: '#CCCCCC',
          fontSize: 12,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          marginBottom: 8,
        }}
      >
        建筑类型
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {buildingTypes.map((type) => (
          <div
            key={type}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 3,
                background: BUILDING_COLORS[type],
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            />
            <span
              style={{
                color: '#FFFFFF',
                fontSize: 12,
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {BUILDING_LABELS[type]}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          color: '#CCCCCC',
          fontSize: 12,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          marginTop: 16,
          marginBottom: 8,
          paddingTop: 12,
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        公共设施
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#4169E1',
              boxShadow: '0 0 8px #4169E1',
            }}
          />
          <span style={{ color: '#FFFFFF', fontSize: 12 }}>学校</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#DC143C',
              boxShadow: '0 0 8px #DC143C',
            }}
          />
          <span style={{ color: '#FFFFFF', fontSize: 12 }}>医院</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#FFD700',
              boxShadow: '0 0 8px #FFD700',
            }}
          />
          <span style={{ color: '#FFFFFF', fontSize: 12 }}>文化中心</span>
        </div>
      </div>
    </div>
  );
};

export default LegendPanel;
