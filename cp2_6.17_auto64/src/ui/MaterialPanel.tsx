import React, { useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { MATERIALS, getMaterialById } from '../materials/materialStore';

const MaterialPanel: React.FC = () => {
  const { currentMaterial, setMaterial } = useEditorStore();
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          right: '20px',
          top: '20px',
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: '#1E1E2E',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          color: '#ffffff',
          fontSize: '22px',
          cursor: 'pointer',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            '0 0 0 2px #00E5FF, 0 4px 20px rgba(0, 0, 0, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
        }}
      >
        🎨
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: '20px',
        top: '20px',
        width: '300px',
        backgroundColor: 'rgba(30, 30, 46, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        zIndex: 100,
        border: '1px solid rgba(0, 229, 255, 0.15)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#ffffff',
            letterSpacing: '0.5px',
          }}
        >
          材质选择
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#808090',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#808090';
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
        }}
      >
        {MATERIALS.map((mat) => {
          const isSelected = currentMaterial === mat.id;
          return (
            <div
              key={mat.id}
              onClick={() => setMaterial(mat.id)}
              style={{
                position: 'relative',
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                backgroundColor: mat.color,
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                transform: isSelected ? 'scale(1)' : 'scale(1)',
                boxShadow: isSelected
                  ? `0 0 0 2px #ffffff, 0 0 16px ${mat.color}, 0 4px 16px rgba(0,0,0,0.4)`
                  : '0 2px 8px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: '4px',
                overflow: 'hidden',
                border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                if (!isSelected) {
                  e.currentTarget.style.boxShadow =
                    '0 8px 24px rgba(0,0,0,0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = isSelected ? 'scale(1)' : 'scale(1)';
                if (!isSelected) {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                }
              }}
            >
              {mat.emissive && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '8px',
                    boxShadow: `inset 0 0 20px ${mat.emissive}`,
                    opacity: 0.6,
                    pointerEvents: 'none',
                  }}
                />
              )}
              {mat.transparent && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '8px',
                    background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)`,
                    pointerEvents: 'none',
                  }}
                />
              )}
              <span
                style={{
                  position: 'relative',
                  fontSize: '10px',
                  color: isBrightColor(mat.color) ? '#202030' : '#ffffff',
                  fontWeight: 600,
                  textShadow: isBrightColor(mat.color)
                    ? 'none'
                    : '0 1px 2px rgba(0,0,0,0.6)',
                  zIndex: 1,
                }}
              >
                {mat.name}
              </span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: '12px',
          color: '#808090',
        }}
      >
        <div>体素数量：<span style={{ color: '#00E5FF', fontWeight: 600 }}>{useEditorStore.getState().voxels.length}</span></div>
      </div>
    </div>
  );
};

function isBrightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 160;
}

export default MaterialPanel;
