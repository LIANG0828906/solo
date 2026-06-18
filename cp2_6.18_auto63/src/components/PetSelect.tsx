import React, { useId, useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { Pet, ElementType } from '../types';
import { ELEMENT_COLORS, ELEMENT_NAMES } from '../types';

interface PetSelectProps {
  pets: Pet[];
  selectedIndices: number[];
  onSelect: (index: number) => void;
  onConfirm: () => void;
}

const STAT_MAX: Record<string, number> = {
  hp: 200,
  atk: 30,
  def: 30,
  spd: 30,
};

// ---------------- PetSvg ----------------

const PetSvg: React.FC<{ element: ElementType; breathingClass: string }> = ({ element, breathingClass }) => {
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
        willChange: 'transform, filter',
        transform: 'translateZ(0)',
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
          opacity: 1,
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

// ---------------- Particles (requestAnimationFrame driven) ----------------

interface ParticleData {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  angle: number;
  angularVel: number;
}

interface ParticlesProps {
  element: ElementType;
  active: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

const Particles: React.FC<ParticlesProps> = ({ element, active, containerRef }) => {
  const color = ELEMENT_COLORS[element];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ParticleData[]>([]);
  const rafRef = useRef<number>(0);
  const lastEmitRef = useRef<number>(0);
  const activeRef = useRef(active);
  const particleIdRef = useRef(0);

  const particleColors = useMemo(() => {
    switch (element) {
      case 'fire': return [color, '#ff8c42', '#ffd166', '#ff6b35'];
      case 'water': return [color, '#48cae4', '#90e0ef', '#caf0f8'];
      case 'grass': return [color, '#52b788', '#74c69d', '#95d5b2'];
      case 'electric': return [color, '#ffea00', '#fff3b0', '#ffffff'];
      case 'wind': return [color, '#caf0f8', '#edf2fb', '#e0e1dd'];
      case 'earth': return [color, '#d4a373', '#ccd5ae', '#8b5a2b'];
      default: return [color];
    }
  }, [element, color]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const emitParticle = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const canvas = canvasRef.current;
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const px = Math.random() * canvas.width;
    const py = canvas.height + 10;

    let vx: number, vy: number, angularVel: number;
    switch (element) {
      case 'fire':
        vx = (Math.random() - 0.5) * 2.5;
        vy = -1.5 - Math.random() * 3;
        angularVel = 0;
        break;
      case 'water':
        vx = (Math.random() - 0.5) * 4;
        vy = -0.5 - Math.random() * 1.5;
        angularVel = (Math.random() - 0.5) * 0.05;
        break;
      case 'grass':
        vx = (Math.random() - 0.5) * 1;
        vy = -0.8 - Math.random() * 1.2;
        angularVel = (Math.random() > 0.5 ? 1 : -1) * (0.02 + Math.random() * 0.04);
        break;
      case 'electric':
        vx = (Math.random() - 0.5) * 6;
        vy = -1 - Math.random() * 2;
        angularVel = 0;
        break;
      case 'wind':
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed * 0.5;
        angularVel = (Math.random() > 0.5 ? 1 : -1) * (0.08 + Math.random() * 0.08);
        break;
      case 'earth':
        vx = (Math.random() - 0.5) * 3;
        vy = -2 - Math.random() * 2;
        angularVel = (Math.random() - 0.5) * 0.03;
        break;
      default:
        vx = (Math.random() - 0.5) * 2;
        vy = -1 - Math.random() * 2;
        angularVel = 0;
    }

    const particle: ParticleData = {
      id: particleIdRef.current++,
      x: px,
      y: py,
      vx,
      vy,
      size: 2 + Math.random() * 3,
      life: 0,
      maxLife: 800 + Math.random() * 400,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      angle: Math.random() * Math.PI * 2,
      angularVel,
    };

    particlesRef.current.push(particle);
  }, [element, particleColors, containerRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      if (!containerRef.current || !canvasRef.current) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (activeRef.current) {
        if (time - lastEmitRef.current > 50 && particlesRef.current.length < 60) {
          emitParticle();
          lastEmitRef.current = time;
        }
      }

      const dt = delta / 16.67;
      const gravity = element === 'water' || element === 'earth' ? 0.08 : 0;
      const zigzagFreq = element === 'electric' ? 0.15 : 0;

      const alive: ParticleData[] = [];
      for (const p of particlesRef.current) {
        p.life += delta;
        if (p.life >= p.maxLife) continue;

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += gravity * dt;
        p.angle += p.angularVel * dt;

        if (element === 'electric') {
          p.x += Math.sin(p.life * zigzagFreq) * 0.8;
        }

        const t = p.life / p.maxLife;
        const alpha = t < 0.2 ? t * 5 : t > 0.8 ? (1 - t) * 5 : 1;
        const size = p.size * (1 - t * 0.5);

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 1.5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, size / 2), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        if (p.y > -20 && p.y < canvas.height + 20 && p.x > -20 && p.x < canvas.width + 20) {
          alive.push(p);
        }
      }
      particlesRef.current = alive;

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [element, emitParticle]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '24px',
        pointerEvents: 'none',
        opacity: active ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
    />
  );
};

// ---------------- StatBar (element color based) ----------------

interface StatBarProps {
  label: string;
  value: number;
  statKey: 'hp' | 'atk' | 'def' | 'spd';
  elementColor: string;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, statKey, elementColor }) => {
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
          background: `linear-gradient(90deg, ${elementColor}80, ${elementColor})`,
          borderRadius: '4px',
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 0 6px ${elementColor}60`,
          willChange: 'width',
          transform: 'translateZ(0)',
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

// ---------------- Main PetSelect ----------------

const PetSelect: React.FC<PetSelectProps> = ({ pets, selectedIndices, onSelect, onConfirm }) => {
  const scopeId = useId().replace(/:/g, '');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pulsingIndex, setPulsingIndex] = useState<number | null>(null);
  const isAnimatingRef = useRef<Record<number, boolean>>({});
  const timerRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const containerRefs = useRef<Record<number, React.RefObject<HTMLDivElement>>>({});

  for (let i = 0; i < pets.length; i++) {
    if (!containerRefs.current[i]) {
      containerRefs.current[i] = React.createRef<HTMLDivElement>();
    }
  }

  const isSelected = (index: number) => selectedIndices.includes(index);
  const canSelect = selectedIndices.length < 3;

  const handleClick = useCallback((index: number) => {
    const selected = isSelected(index);
    if (!selected && !canSelect) return;
    if (isAnimatingRef.current[index]) return;

    if (timerRef.current[index]) clearTimeout(timerRef.current[index]);

    isAnimatingRef.current[index] = true;
    setPulsingIndex(index);

    timerRef.current[index] = setTimeout(() => {
      setPulsingIndex(null);
      isAnimatingRef.current[index] = false;
    }, 400);

    onSelect(index);
  }, [onSelect, canSelect]);

  const breathingClass = `breathing-${scopeId}`;
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
    transform: translateZ(0) scale(1);
    filter: brightness(1);
  }
  50% {
    transform: translateZ(0) scale(1.04);
    filter: brightness(1.15);
  }
}

.${breathingClass} {
  animation: breath-${scopeId} 2.6s ease-in-out infinite;
}

@keyframes pulseAnim-${scopeId} {
  0% { transform: translateZ(0) scale(1); }
  30% { transform: translateZ(0) scale(1.10); }
  60% { transform: translateZ(0) scale(0.97); }
  100% { transform: translateZ(0) scale(1); }
}

.${pulseClass} {
  animation: pulseAnim-${scopeId} 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  z-index: 5;
}

@keyframes titleGlow {
  0%, 100% { text-shadow: 0 0 20px #ffd70040; }
  50% { text-shadow: 0 0 40px #ffd70080, 0 0 80px #ffd70030; }
}

.title-glow {
  animation: titleGlow 3s ease-in-out infinite;
}

.${cardClass}-hover {
  transform: translateZ(0) translateY(-10px) scale(1.05) !important;
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
          willChange: 'text-shadow',
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
                ref={containerRefs.current[index]}
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
                  willChange: 'transform, box-shadow',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                  perspective: '1000px',
                }}
              >
                <Particles
                  element={pet.element}
                  active={hovered || selected}
                  containerRef={containerRefs.current[index]}
                />

                <PetSvg
                  element={pet.element}
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
                  <StatBar label="HP" value={pet.maxHp} statKey="hp" elementColor={color} />
                  <StatBar label="ATK" value={pet.attack} statKey="atk" elementColor={color} />
                  <StatBar label="DEF" value={pet.defense} statKey="def" elementColor={color} />
                  <StatBar label="SPD" value={pet.speed} statKey="spd" elementColor={color} />
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
                  willChange: 'transform',
                  transform: 'translateZ(0)',
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
              willChange: 'transform, box-shadow',
              transform: 'translateZ(0)',
            }}
            onMouseEnter={(e) => {
              if (selectedIndices.length > 0) {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.03) translateZ(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px #ffd70040, 0 0 24px #ffd70060';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1) translateZ(0)';
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
