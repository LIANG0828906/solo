import React, { useId } from 'react';
import type { Pet, ElementType } from '../types';
import { ELEMENT_COLORS, ELEMENT_NAMES } from '../types';

interface PetSelectProps {
  pets: Pet[];
  selectedIndices: number[];
  onSelect: (index: number) => void;
  onConfirm: () => void;
}

const PetSvg: React.FC<{ element: ElementType }> = ({ element }) => {
  const color = ELEMENT_COLORS[element];

  const decorations: Record<ElementType, React.ReactNode> = {
    fire: (
      <>
        <polygon points="30,55 40,25 50,55" fill={color} opacity="0.9" />
        <polygon points="50,55 58,30 66,55" fill={color} opacity="0.7" />
        <polygon points="15,58 22,35 29,58" fill={color} opacity="0.5" />
      </>
    ),
    water: (
      <>
        <path d="M25,45 Q45,35 65,45" fill="none" stroke="#ffffff60" strokeWidth="2" />
        <path d="M20,55 Q45,45 70,55" fill="none" stroke="#ffffff40" strokeWidth="2" />
        <path d="M25,65 Q45,55 65,65" fill="none" stroke="#ffffff30" strokeWidth="2" />
      </>
    ),
    grass: (
      <>
        <ellipse cx="45" cy="18" rx="8" ry="16" fill="#2d6a4f" opacity="0.8" />
        <ellipse cx="55" cy="22" rx="6" ry="13" fill="#40916c" opacity="0.7" />
        <ellipse cx="38" cy="24" rx="5" ry="11" fill="#52b788" opacity="0.6" />
      </>
    ),
    electric: (
      <>
        <polyline points="52,30 42,52 55,48 45,70" fill="none" stroke="#fff8" strokeWidth="3" strokeLinejoin="round" />
      </>
    ),
    wind: (
      <>
        <path d="M30,42 Q50,38 60,44 Q70,50 55,52" fill="none" stroke="#ffffff60" strokeWidth="2" />
        <path d="M25,55 Q45,50 65,56 Q72,60 60,62" fill="none" stroke="#ffffff40" strokeWidth="2" />
        <path d="M32,65 Q48,62 58,66" fill="none" stroke="#ffffff30" strokeWidth="2" />
      </>
    ),
    earth: (
      <>
        <line x1="30" y1="40" x2="50" y2="55" stroke="#00000040" strokeWidth="2" />
        <line x1="50" y1="55" x2="42" y2="70" stroke="#00000030" strokeWidth="2" />
        <line x1="50" y1="55" x2="65" y2="65" stroke="#00000030" strokeWidth="2" />
      </>
    ),
  };

  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <defs>
        <radialGradient id={`grad-${element}`} cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="45" fill={`url(#grad-${element})`} stroke={color} strokeWidth="2" opacity="0.9" />
      {decorations[element]}
    </svg>
  );
};

const keyframesStyle = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;900&family=Nunito:wght@400;600;700&display=swap');

@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 8px #ffd70060; }
  50% { box-shadow: 0 0 20px #ffd700a0; }
}

@keyframes confirmGlow {
  0%, 100% { box-shadow: 0 0 6px #ffd70040; }
  50% { box-shadow: 0 0 16px #ffd70080; }
}
`;

const PetSelect: React.FC<PetSelectProps> = ({ pets, selectedIndices, onSelect, onConfirm }) => {
  const scopeId = useId().replace(/:/g, '');

  const isSelected = (index: number) => selectedIndices.includes(index);
  const canSelect = selectedIndices.length < 3;

  const getGridStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'grid',
      gap: '24px',
      justifyContent: 'center',
      padding: '0 16px',
    };
    return { ...base, gridTemplateColumns: 'repeat(3, 240px)' };
  };

  return (
    <>
      <style>{keyframesStyle}</style>
      <style>{`
        @media (max-width: 1023px) and (min-width: 768px) {
          #pet-grid-${scopeId} {
            grid-template-columns: repeat(2, 240px) !important;
          }
        }
        @media (max-width: 767px) {
          #pet-grid-${scopeId} {
            grid-template-columns: 90% !important;
          }
          #pet-grid-${scopeId} > div {
            width: 100% !important;
          }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d1117 0%, #1b1c20 50%, #16213e 100%)',
        padding: '40px 20px 120px',
        fontFamily: 'Nunito, sans-serif',
        color: '#e0e1dd',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <h1 style={{
          fontFamily: 'Cinzel, serif',
          fontWeight: 900,
          fontSize: '48px',
          margin: '0 0 8px',
          background: 'linear-gradient(135deg, #ffd700, #f0a500)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '4px',
          textShadow: 'none',
        }}>
          宠物对战纪元
        </h1>
        <p style={{
          fontFamily: 'Nunito, sans-serif',
          fontSize: '18px',
          color: '#a0a0b0',
          margin: '0 0 40px',
          letterSpacing: '2px',
        }}>
          选择你的初始伙伴
        </p>

        <div id={`pet-grid-${scopeId}`} style={getGridStyle()}>
          {pets.map((pet, index) => {
            const selected = isSelected(index);
            const color = ELEMENT_COLORS[pet.element];

            return (
              <div
                key={pet.id}
                onClick={() => {
                  if (selected || canSelect) onSelect(index);
                }}
                style={{
                  width: '240px',
                  height: '320px',
                  background: 'linear-gradient(180deg, #1f4068, #1b1c20)',
                  borderRadius: '24px',
                  border: selected ? '3px solid #ffd700' : '2px solid #e0e1dd20',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: selected || canSelect ? 'pointer' : 'not-allowed',
                  opacity: !selected && !canSelect ? 0.5 : 1,
                  transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                  animation: selected ? `glowPulse 2s ease-in-out infinite` : 'none',
                  position: 'relative',
                  padding: '16px 12px',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = 'translateY(-8px)';
                  if (!selected) {
                    el.style.boxShadow = 'inset 0 0 2px #ffffff40';
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = 'translateY(0)';
                  if (!selected) {
                    el.style.boxShadow = 'none';
                  }
                }}
              >
                <div style={{
                  width: '120px',
                  height: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px',
                }}>
                  <PetSvg element={pet.element} />
                </div>

                <div style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 700,
                  fontSize: '18px',
                  color: '#e0e1dd',
                  marginBottom: '2px',
                }}>
                  {pet.name}
                </div>

                <div style={{
                  fontSize: '13px',
                  color: color,
                  fontWeight: 600,
                  marginBottom: '12px',
                  letterSpacing: '1px',
                }}>
                  {ELEMENT_NAMES[pet.element]}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '2px 16px',
                  fontSize: '12px',
                  color: '#a0a0b0',
                  width: '100%',
                  padding: '0 16px',
                  boxSizing: 'border-box',
                }}>
                  <span>HP <b style={{ color: '#e0e1dd' }}>{pet.maxHp}</b></span>
                  <span>ATK <b style={{ color: '#e0e1dd' }}>{pet.attack}</b></span>
                  <span>DEF <b style={{ color: '#e0e1dd' }}>{pet.defense}</b></span>
                  <span>SPD <b style={{ color: '#e0e1dd' }}>{pet.speed}</b></span>
                </div>

                {selected && (
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    fontSize: '13px',
                    color: '#ffd700',
                    fontWeight: 700,
                    letterSpacing: '1px',
                  }}>
                    已选择
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(180deg, transparent, #0d1117 30%)',
          padding: '24px 0 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          zIndex: 10,
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '14px', color: '#a0a0b0' }}>
              已选 {selectedIndices.length}/3
            </span>
            {selectedIndices.map((idx) => {
              const pet = pets[idx];
              return (
                <div key={pet.id} style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: ELEMENT_COLORS[pet.element],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#e0e1dd',
                  boxShadow: `0 0 8px ${ELEMENT_COLORS[pet.element]}60`,
                }}>
                  {pet.name[0]}
                </div>
              );
            })}
          </div>

          <button
            onClick={onConfirm}
            disabled={selectedIndices.length === 0}
            style={{
              background: selectedIndices.length > 0
                ? 'linear-gradient(135deg, #0f3460, #16213e)'
                : '#1b1c20',
              color: selectedIndices.length > 0 ? '#ffd700' : '#555',
              border: selectedIndices.length > 0 ? '2px solid #ffd70040' : '2px solid #333',
              borderRadius: '16px',
              padding: '12px 48px',
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'Nunito, sans-serif',
              cursor: selectedIndices.length > 0 ? 'pointer' : 'not-allowed',
              letterSpacing: '2px',
              transition: 'all 0.3s ease',
              animation: selectedIndices.length > 0 ? 'confirmGlow 2s ease-in-out infinite' : 'none',
            }}
            onMouseEnter={(e) => {
              if (selectedIndices.length > 0) {
                e.currentTarget.style.boxShadow = '0 0 20px #ffd70060';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = selectedIndices.length > 0 ? 'none' : 'none';
            }}
          >
            确认出战
          </button>
        </div>
      </div>
    </>
  );
};

export default PetSelect;
