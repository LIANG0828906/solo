import React from 'react';
import type { StyleType, StyleConfig } from '../types';

const STYLES: StyleConfig[] = [
  {
    id: 'oil',
    name: '油画',
    gradient: 'linear-gradient(135deg, #8B4513 0%, #CD853F 50%, #DEB887 100%)'
  },
  {
    id: 'watercolor',
    name: '水彩',
    gradient: 'linear-gradient(135deg, #4A90D9 0%, #87CEEB 50%, #B0E0E6 100%)'
  },
  {
    id: 'sketch',
    name: '素描',
    gradient: 'linear-gradient(135deg, #2C2C2C 0%, #555555 50%, #888888 100%)'
  },
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    gradient: 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 50%, #FF00FF 100%)'
  }
];

interface StyleSelectorProps {
  currentStyle: StyleType;
  onStyleChange: (style: StyleType) => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ currentStyle, onStyleChange }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      marginTop: '24px'
    }}>
      {STYLES.map((style) => (
        <div
          key={style.id}
          onClick={() => onStyleChange(style.id)}
          style={{
            width: '100%',
            aspectRatio: '1',
            minWidth: '100px',
            borderRadius: '12px',
            background: style.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            border: currentStyle === style.id ? '3px solid #6366F1' : '2px solid transparent',
            transform: 'scale(1)',
            transition: 'transform 0.2s ease-out, border-color 0.2s ease-out, box-shadow 0.2s ease-out',
            boxShadow: currentStyle === style.id ? '0 0 20px rgba(99, 102, 241, 0.5)' : 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            zIndex: 1
          }} />
          <span style={{
            position: 'relative',
            zIndex: 2,
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 700,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
          }}>
            {style.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default StyleSelector;
