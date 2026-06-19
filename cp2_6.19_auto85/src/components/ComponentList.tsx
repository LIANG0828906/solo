import React from 'react';
import { Icon } from '@iconify/react';
import type { ComponentDefinition } from '../types';

interface ComponentListProps {
  components: ComponentDefinition[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const ComponentList: React.FC<ComponentListProps> = ({ components, selectedId, onSelect }) => {
  return (
    <div
      style={{
        width: '240px',
        minWidth: '240px',
        height: '100%',
        backgroundColor: '#1e1e2e',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #313244',
      }}
    >
      <div
        style={{
          padding: '20px 16px',
          borderBottom: '1px solid #313244',
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#cdd6f4',
            marginBottom: '4px',
          }}
        >
          组件库
        </h2>
        <p style={{ fontSize: '12px', color: '#6c7086' }}>
          选择组件开始调试
        </p>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {components.map((comp) => {
          const isActive = comp.id === selectedId;
          return (
            <div
              key={comp.id}
              onClick={() => onSelect(comp.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: isActive ? '#313244' : 'transparent',
                borderLeft: isActive ? '3px solid #89b4fa' : '3px solid transparent',
                paddingLeft: isActive ? '11px' : '14px',
                marginBottom: '2px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#313244';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <Icon
                icon={comp.icon}
                width={20}
                height={20}
                color={isActive ? '#89b4fa' : '#a6adc8'}
              />
              <span
                style={{
                  fontSize: '14px',
                  color: isActive ? '#cdd6f4' : '#a6adc8',
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {comp.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
