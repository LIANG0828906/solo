import React, { useId, useState, useMemo, useRef } from 'react';
import type { Pet, ElementType } from '../types';
import { ELEMENT_COLORS, ELEMENT_NAMES } from '../types';

interface PetSelectProps {
  pets: Pet[];
  selectedIndices: number[];
  onSelect: (index: number) => void;
  onConfirm: () => void;
}

const STAT_COLORS: Record<string, string> = {
  hp: '#e63946',
  atk: '#fb8500',
  def: '#457b9d',
  spd: '#2d6a4f',
};

const STAT_MAX: Record<string, number> = {
  hp: 200,
  atk: 30,
  def: 30,
  spd: 30,
};

const PetSvg: React.FC<{ element: ElementType; breathing: boolean; breathingClass: string }> = ({ element, breathing, breathingClass }) => {
  const color = ELEMENT_COLORS[element];
  const scopeId = useId().replace(/:/g, '');

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
    <div
      className={breathingClass}
      style={{
        position: 'relative',
        width: '140px',
        height: '140px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '130px',
          height: '130px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}50 0%, transparent 70%)`,
          filter: 'blur(8px)',
          opacity: breathing ? 1 : 0.4,
          transition: 'opacity 0.5s ease',
        }}
      />
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'relative', zIndex: 1 }}>
        <defs>
          <radialGradient id={`grad-${element}-${scopeId}`} cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.95" />
            <stop offset="100%" stopColor={color} stopOpacity="0.55" />
          </radialGradient>
        </defs>
        <circle
          cx="60"
          cy="60"
          r="45"
          fill={`url(#grad-${element}-${scopeId})`}
          stroke={color}
          strokeWidth="2"
          opacity="0.95"
        />
        {decorations[element]}
        <circle cx="50" cy="55" r="4" fill="#ffffff" />
        <circle cx="70" cy="55" r="4" fill="#ffffff" />
        <circle cx="51" cy="55" r="2" fill="#1a1a2e" />
        <circle cx="71" cy="55" r="2" fill="#1a1a2e" />
      </svg>
    </div>
  );
};

interface ParticlesProps {
  element: ElementType;
  active: boolean;
  particlesClass: string;
}

const Particles: React.FC<ParticlesProps> = ({ element, active, particlesClass }) => {
  const color = ELEMENT_COLORS[element];
  const particles = useMemo(() => {
    const list: { id: number; size: number; left: number; top: number; delay: number; duration: number; dx: number }[] = [];
    for (let i = 0; i < 20; i++) {
      list.push({
        id: i,
        size: 2 + Math.random() * 3,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 1.5 + Math.random() * 2,
        dx: (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 40),
      });
    }
    return list;
  }, []);

  return (
    <div
      className={particlesClass}
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '24px',
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: active ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: color,
            left: `${p.left}%`,
            top: `${p.top}%`,
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
            ['--dx' as string]: `${p.dx}px`,
            animation: `floatUp-${particlesClass} ${p.duration}s ease-in-out ${p.delay}s infinite`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

interface StatBarProps {
  label: string;
  value: number;
  statKey: 'hp' | 'atk' | 'def' | 'spd';
}

const StatBar: React.FC<StatBarProps> = ({ label, value, statKey }) => {
  const color = STAT_COLORS[statKey];
  const max = STAT_MAX[statKey];
  const percent = Math.min(100, (value / max) * 100);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '6px',
    }}>
      <span style={{
        fontSize: '11px',
        color: '#a0a0b0',
        width: '28px',
        fontWeight: 700,
      }}>
        {label}
      </span>
      <div style={{
        flex: 1,
        height: '8px',
        background: '#0d1117',
        borderRadius: '4px',
        overflow: 'hidden',
        border: '1px solid #ffffff10',
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color}90, ${color})`,
          borderRadius: '4px',
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 0 6px ${color}80`,
        }} />
      </div>
      <span style={{
        fontSize: '11px',
        color: '#e0e1dd',
        width: '30px',
        textAlign: 'right',
        fontWeight: 700,
      }}>
        {value}
      </span>
    </div>
  );
};

const PetSelect: React.FC<PetSelectProps> = ({ pets, selectedIndices, onSelect, onConfirm }) => {
  const scopeId = useId().replace(/:/g, '');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pulsingIndex, setPulsingIndex] = useState<number | null>(null);
  const timerRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const isSelected = (index: number) => selectedIndices.includes(index);
  const canSelect = selectedIndices.length < 3;

  const handleClick = (index: number) => {
    if (!isSelected(index) && !canSelect) return;
    onSelect(index);
    if (timerRef.current[index]) clearTimeout(timerRef.current[index]);
    setPulsingIndex(index);
    timerRef.current[index] = setTimeout(() => {
      setPulsingIndex(null);
    }, 400);
  };

  const breathingClass = `breathing-${scopeId}`;
  const particlesClass = `particles-${scopeId}`;
  const cardClass = `card-${scopeId}`;
  const pulseClass = `pulse-${scopeId}`;

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Nunito:wght@400;600;700;800&display=swap');

@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 10px #ffd70070, 0 0 2px #ffffff40 inset; }
  50% { box-shadow: 0 0 28px #ffd700b0, 0 0 4px #ffffff60 inset; }
}

@keyframes confirmGlow {
  0%, 100% { box-shadow: 0 0 8px #ffd70040; }
  50% { box-shadow: 0 0 20px #ffd70090; }
}

@keyframes breath-${scopeId} {
  0%, 100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.04);
    filter: brightness(1.15);
  }
}

.${breathingClass} {
  animation: breath-${scopeId} 2.6s ease-in-out infinite;
}

@keyframes floatUp-${particlesClass} {
  0% {
    transform: translateY(0) translateX(0) scale(0.6);
    opacity: 0;
  }
  20% {
    opacity: 0.9;
  }
  100% {
    transform: translateY(-120px) translateX(var(--dx, 0px)) scale(0);
    opacity: 0;
  }
}

@keyframes pulseAnim-${scopeId} {
  0% { transform: scale(1); }
  30% { transform: scale(1.10); }
  60% { transform: scale(0.97); }
  100% { transform: scale(1); }
}

.${pulseClass} {
  animation: pulseAnim-${scopeId} 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  z-index: 5;
}

.${cardClass}-hover {
  transform: translateY(-10px) scale(1.05) !important;
}

@keyframes titleGlow {
  0%, 100% { text-shadow: 0 0 20px #ffd70040; }
  50% { text-shadow: 0 0 40px #ffd70080, 0 0 80px #ffd70030; }
}

.title-glow {
  animation: titleGlow 3s ease-in-out infinite;
}

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
        background: `
          radial-gradient(circle at 20% 10%, #16213e40 0%, transparent 50%),
          radial-gradient(circle at 80% 90%, #0f346040 0%, transparent 50%),
          linear-gradient(135deg, #0d1117 0%, #1a1a2e 50%, #16213e 100%)
        `,
        padding: '40px 20px 160px',
        fontFamily: 'Nunito, sans-serif',
        color: '#e0e1dd',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        <h1 className="title-glow" style={{
          fontFamily: 'Cinzel, serif',
          fontWeight: 900,
          fontSize: '52px',
          margin: '0 0 8px',
          background: 'linear-gradient(135deg, #ffd700, #f0a500, #ffd700)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '6px',
        }}>
          宠物对战纪元
        </h1>
        <p style={{
          fontFamily: 'Nunito, sans-serif',
          fontSize: '18px',
          color: '#a0a0b0',
          margin: '0 0 48px',
          letterSpacing: '3px',
        }}>
          ✦ 选择你的初始伙伴 ✦
        </p>

        <div id={`pet-grid-${scopeId}`} style={{
          display: 'grid',
          gap: '32px',
          justifyContent: 'center',
          padding: '0 16px',
          gridTemplateColumns: 'repeat(3, 260px)',
        }}>
          {pets.map((pet, index) => {
            const selected = isSelected(index);
            const hovered = hoveredIndex === index;
            const pulsing = pulsingIndex === index;
            const color = ELEMENT_COLORS[pet.element];
            const disabled = !selected && !canSelect;

            const borderColor = selected
              ? '#ffd700'
              : hovered
                ? color
                : '#e0e1dd20';
            const borderWidth = selected ? '3px' : '2px';

            return (
              <div
                key={pet.id}
                className={`${hovered ? `${cardClass}-hover` : ''} ${pulsing ? pulseClass : ''}`}
                onClick={() => handleClick(index)}
                onMouseEnter={() => !disabled && setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex((v) => (v === index ? null : v))}
                style={{
                  width: '260px',
                  minHeight: '380px',
                  background: `
                    linear-gradient(180deg, ${color}18 0%, #1f406840 30%, #1b1c20 100%)
                  `,
                  borderRadius: '24px',
                  border: `${borderWidth} solid ${borderColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.45 : 1,
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease, box-shadow 0.3s ease, background 0.4s ease',
                  animation: selected ? `glowPulse 1.8s ease-in-out infinite` : 'none',
                  position: 'relative',
                  padding: '20px 18px 18px',
                  boxSizing: 'border-box',
                  boxShadow: hovered && !selected
                    ? `0 12px 40px ${color}30, 0 0 18px ${color}50, 0 0 2px #ffffff40 inset`
                    : selected
                      ? undefined
                      : hovered
                        ? '0 8px 28px rgba(0,0,0,0.4)'
                        : '0 2px 12px rgba(0,0,0,0.2)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <Particles element={pet.element} active={hovered || selected} particlesClass={particlesClass} />

                <PetSvg
                  element={pet.element}
                  breathing={true}
                  breathingClass={breathingClass}
                />

                <div style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 800,
                  fontSize: '20px',
                  color: '#e0e1dd',
                  margin: '4px 0 2px',
                  letterSpacing: '1px',
                  textShadow: selected ? '0 0 8px #ffd70060' : 'none',
                }}>
                  {pet.name}
                </div>

                <div style={{
                  fontSize: '13px',
                  color: color,
                  fontWeight: 700,
                  marginBottom: '14px',
                  letterSpacing: '2px',
                  padding: '2px 12px',
                  background: `${color}20`,
                  borderRadius: '10px',
                  border: `1px solid ${color}50`,
                }}>
                  {ELEMENT_NAMES[pet.element]}
                </div>

                <div style={{
                  width: '100%',
                  padding: '0 4px',
                }}>
                  <StatBar label="HP" value={pet.maxHp} statKey="hp" />
                  <StatBar label="ATK" value={pet.attack} statKey="atk" />
                  <StatBar label="DEF" value={pet.defense} statKey="def" />
                  <StatBar label="SPD" value={pet.speed} statKey="spd" />
                </div>

                {selected && (
                  <div style={{
                    position: 'absolute',
                    bottom: '14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '13px',
                    color: '#ffd700',
                    fontWeight: 800,
                    letterSpacing: '2px',
                    padding: '4px 16px',
                    background: 'linear-gradient(90deg, #ffd70020, #ffd70010, #ffd70020)',
                    borderRadius: '10px',
                    border: '1px solid #ffd70060',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 0 10px #ffd70030',
                  }}>
                    ✦ 已选择 ✦
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
          background: 'linear-gradient(180deg, transparent, #0d1117 25%, #0d1117 100%)',
          padding: '24px 0 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          zIndex: 10,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            display: 'flex',
            gap: '14px',
            alignItems: 'center',
          }}>
            <span style={{
              fontSize: '14px',
              color: '#a0a0b0',
              fontFamily: 'Nunito, sans-serif',
              letterSpacing: '1px',
            }}>
              队伍 <b style={{ color: '#ffd700', fontWeight: 800 }}>{selectedIndices.length}/3</b>
            </span>
            {[0, 1, 2].map((slot) => {
              const idx = selectedIndices[slot];
              const pet = idx !== undefined ? pets[idx] : null;
              const color = pet ? ELEMENT_COLORS[pet.element] : '#222';
              return (
                <div key={slot} style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: pet
                    ? `radial-gradient(circle, ${color}60, ${color}30)`
                    : 'linear-gradient(135deg, #1a1a2e, #0d1117)',
                  border: pet
                    ? `2px solid ${color}`
                    : '2px dashed #3a3a4a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: pet ? '14px' : '20px',
                  fontWeight: 800,
                  color: pet ? '#e0e1dd' : '#555',
                  boxShadow: pet ? `0 0 12px ${color}70` : 'none',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                }}>
                  {pet ? pet.name[0] : '+'}
                </div>
              );
            })}
          </div>

          <button
            onClick={onConfirm}
            disabled={selectedIndices.length === 0}
            style={{
              background: selectedIndices.length > 0
                ? 'linear-gradient(135deg, #ffd70030, #0f3460, #16213e, #ffd70020)'
                : 'linear-gradient(135deg, #1b1c20, #0d1117)',
              color: selectedIndices.length > 0 ? '#ffd700' : '#555',
              border: selectedIndices.length > 0 ? '2px solid #ffd70060' : '2px solid #333',
              borderRadius: '18px',
              padding: '14px 56px',
              fontSize: '17px',
              fontWeight: 800,
              fontFamily: 'Nunito, sans-serif',
              cursor: selectedIndices.length > 0 ? 'pointer' : 'not-allowed',
              letterSpacing: '3px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: selectedIndices.length > 0 ? 'confirmGlow 2s ease-in-out infinite' : 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              if (selectedIndices.length > 0) {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                e.currentTarget.style.boxShadow = '0 10px 30px #ffd70040, 0 0 24px #ffd70060';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = 'none';
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
