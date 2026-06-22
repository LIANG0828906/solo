import React, { useState } from 'react';
import { LightSourceData } from '@/scene/LightSource';

export interface SchemeData {
  id: string;
  label: string;
  lights: LightSourceData[];
  thumbnail: string;
}

interface Props {
  schemes: SchemeData[];
  onSave: (label: string) => void;
  onDelete: (schemeId: string) => void;
  onSwitch: (schemeId: string) => void;
  activeSchemeId: string | null;
}

const SavedSchemesPanel: React.FC<Props> = ({
  schemes,
  onSave,
  onDelete,
  onSwitch,
  activeSchemeId,
}) => {
  const [label, setLabel] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleSave = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setLabel('');
  };

  return (
    <div
      style={{
        width: 200,
        minWidth: 200,
        height: '100%',
        background: 'rgba(30,30,30,0.7)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontSize: 12,
        userSelect: 'none',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        style={{
          padding: '14px 14px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: 0.5,
        }}
      >
        已保存方案
      </div>

      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="方案标签..."
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4,
              color: '#fff',
              padding: '5px 8px',
              fontSize: 11,
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#4A90D9')}
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')
            }
          />
          <button
            onClick={handleSave}
            disabled={!label.trim()}
            style={{
              padding: '5px 10px',
              background: label.trim() ? '#4A90D9' : '#333',
              color: label.trim() ? '#fff' : '#666',
              borderRadius: 4,
              fontSize: 11,
              transition: 'all 0.2s ease',
              opacity: label.trim() ? 1 : 0.5,
            }}
          >
            保存
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 14px',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 8,
          alignContent: 'start',
        }}
      >
        {schemes.map((scheme) => {
          const isActive = scheme.id === activeSchemeId;
          const isHovered = scheme.id === hoveredId;
          return (
            <div
              key={scheme.id}
              onClick={() => onSwitch(scheme.id)}
              onMouseEnter={() => setHoveredId(scheme.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                position: 'relative',
                width: '100%',
                borderRadius: 8,
                overflow: 'hidden',
                background: isActive
                  ? 'rgba(74,144,217,0.2)'
                  : 'rgba(255,255,255,0.05)',
                border: isActive
                  ? '1px solid rgba(74,144,217,0.5)'
                  : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isHovered
                  ? '0 4px 16px rgba(0,0,0,0.5)'
                  : '0 1px 4px rgba(0,0,0,0.2)',
              }}
            >
              <img
                src={scheme.thumbnail}
                alt={scheme.label}
                style={{
                  width: '100%',
                  height: 70,
                  objectFit: 'cover',
                  display: 'block',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  padding: '4px 6px',
                  fontSize: 10,
                  color: '#ddd',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {scheme.label}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(scheme.id);
                }}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#aaa',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isHovered ? 1 : 0,
                  transition: 'all 0.2s ease',
                  padding: 0,
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#e55')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#aaa')}
              >
                ×
              </button>
            </div>
          );
        })}

        {schemes.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#666',
              padding: 30,
              fontSize: 11,
            }}
          >
            暂无保存方案
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedSchemesPanel;
