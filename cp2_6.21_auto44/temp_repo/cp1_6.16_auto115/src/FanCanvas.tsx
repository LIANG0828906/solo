import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore, type PatternElement } from './store/useAppStore';
import { ANCIENT_COLORS } from './utils/colorUtils';

const CANVAS_SIZE = 600;
const FAN_DIAMETER = CANVAS_SIZE * 0.6;
const FAN_CENTER = CANVAS_SIZE / 2;
const FAN_RADIUS = FAN_DIAMETER / 2;

function PeonyFlower({ element, isSelected, onClick }: {
  element: PatternElement;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const { x, y, scale, colors } = element;
  const layers = 6;
  const petalsPerLayer = 8;
  const baseSize = 100 * scale;

  const renderPetal = (angle: number, layerIndex: number, petalIndex: number, color: string) => {
    const layerRatio = (layerIndex + 1) / layers;
    const petalLength = baseSize * (0.4 + layerRatio * 0.6);
    const petalWidth = baseSize * (0.25 + layerRatio * 0.2);
    const inset = baseSize * 0.1 * (1 - layerRatio);

    const tipX = petalLength;
    const tipY = 0;

    const cp1x = petalLength * 0.8;
    const cp1y = -petalWidth * 0.6;
    const cp2x = petalLength * 0.8;
    const cp2y = petalWidth * 0.6;
    const cp3x = petalLength * 0.1;
    const cp3y = -petalWidth * 0.8;
    const cp4x = petalLength * 0.1;
    const cp4y = petalWidth * 0.8;

    const path = `
      M ${inset} 0
      C ${cp3x} ${cp3y}, ${cp1x} ${cp1y}, ${tipX} ${tipY}
      C ${cp2x} ${cp2y}, ${cp4x} ${cp4y}, ${inset} 0
    `;

    const angleOffset = (layerIndex % 2) * (360 / petalsPerLayer / 2);
    const rotation = angle + angleOffset;

    return (
      <g key={`${layerIndex}-${petalIndex}`} transform={`rotate(${rotation})`}>
        <path
          d={path}
          fill={color}
          stroke="rgba(139,69,19,0.15)"
          strokeWidth="0.5"
          style={{ transition: 'fill 0.5s ease-out' }}
        />
        <path
          d={`M ${petalLength * 0.5} ${-petalWidth * 0.1} Q ${petalLength * 0.75} 0, ${petalLength * 0.5} ${petalWidth * 0.1}`}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="0.8"
        />
      </g>
    );
  };

  const petals = [];
  for (let layer = layers - 1; layer >= 0; layer--) {
    const colorIndex = layer % colors.length;
    for (let i = 0; i < petalsPerLayer; i++) {
      const angle = (i * 360) / petalsPerLayer;
      petals.push(renderPetal(angle, layer, i, colors[colorIndex]));
    }
  }

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      className={isSelected ? 'selected-element' : ''}
    >
      {petals}
      <circle cx="0" cy="0" r={baseSize * 0.15} fill="#FFD700" />
      <circle cx="0" cy="0" r={baseSize * 0.1} fill="#FFA500" />
      {[...Array(12)].map((_, i) => {
        const angle = (i * 360) / 12;
        const rad = (angle * Math.PI) / 180;
        const rx = Math.cos(rad) * baseSize * 0.12;
        const ry = Math.sin(rad) * baseSize * 0.12;
        return (
          <circle
            key={i}
            cx={rx}
            cy={ry}
            r={baseSize * 0.035}
            fill="#DAA520"
          />
        );
      })}
      {isSelected && (
        <circle
          cx="0"
          cy="0"
          r={baseSize * 1.15}
          fill="none"
          stroke="#FFD700"
          strokeWidth="2"
          strokeDasharray="5,5"
          style={{ filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.8))' }}
        />
      )}
    </g>
  );
}

function PlumFlower({ element, isSelected, onClick, onMouseDown }: {
  element: PatternElement;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  const { x, y, scale, rotation, colors, draggable } = element;
  const size = 30 * scale;
  const petals = 5;

  const renderPetal = (index: number) => {
    const angle = (index * 360) / petals - 90;
    const rad = (angle * Math.PI) / 180;
    const px = Math.cos(rad) * size * 0.5;
    const py = Math.sin(rad) * size * 0.5;

    return (
      <g key={index} transform={`translate(${px}, ${py}) rotate(${angle + 90})`}>
        <ellipse
          cx="0"
          cy="0"
          rx={size * 0.45}
          ry={size * 0.35}
          fill={colors[0]}
          stroke={colors[1]}
          strokeWidth="0.8"
          style={{ transition: 'fill 0.5s ease-out, stroke 0.5s ease-out' }}
        />
      </g>
    );
  };

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      onClick={onClick}
      onMouseDown={draggable ? onMouseDown : undefined}
      style={{ cursor: draggable ? 'grab' : 'pointer' }}
      className={isSelected ? 'selected-element' : ''}
    >
      {Array.from({ length: petals }, (_, i) => renderPetal(i))}
      <circle cx="0" cy="0" r={size * 0.15} fill="#FFD700" />
      {isSelected && (
        <circle
          cx="0"
          cy="0"
          r={size * 1.3}
          fill="none"
          stroke="#FFD700"
          strokeWidth="2"
          strokeDasharray="4,4"
          style={{ filter: 'drop-shadow(0 0 3px rgba(255,215,0,0.8))' }}
        />
      )}
    </g>
  );
}

function Butterfly({ element, isSelected, onClick, onMouseDown }: {
  element: PatternElement;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  const { x, y, scale, rotation, colors, draggable } = element;
  const size = 40 * scale;

  const wingPath = (side: 'left' | 'right') => {
    const s = side === 'left' ? 1 : -1;
    return `
      M 0 0
      C ${s * size * 0.8} ${-size * 0.6}, ${s * size * 1.2} ${-size * 0.3}, ${s * size * 0.9} ${size * 0.1}
      C ${s * size * 0.7} ${size * 0.4}, ${s * size * 0.3} ${size * 0.3}, 0 0
    `;
  };

  const lowerWingPath = (side: 'left' | 'right') => {
    const s = side === 'left' ? 1 : -1;
    return `
      M 0 ${size * 0.1}
      C ${s * size * 0.6} ${size * 0.2}, ${s * size * 0.8} ${size * 0.5}, ${s * size * 0.5} ${size * 0.7}
      C ${s * size * 0.2} ${size * 0.6}, 0 ${size * 0.4}, 0 ${size * 0.1}
    `;
  };

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      onClick={onClick}
      onMouseDown={draggable ? onMouseDown : undefined}
      style={{ cursor: draggable ? 'grab' : 'pointer' }}
      className={isSelected ? 'selected-element' : ''}
    >
      <path
        d={wingPath('left')}
        fill={colors[0]}
        stroke={colors[2]}
        strokeWidth="0.8"
        style={{ transition: 'fill 0.5s ease-out' }}
      />
      <path
        d={wingPath('right')}
        fill={colors[0]}
        stroke={colors[2]}
        strokeWidth="0.8"
        style={{ transition: 'fill 0.5s ease-out' }}
      />
      <path
        d={lowerWingPath('left')}
        fill={colors[1]}
        stroke={colors[2]}
        strokeWidth="0.6"
        style={{ transition: 'fill 0.5s ease-out' }}
      />
      <path
        d={lowerWingPath('right')}
        fill={colors[1]}
        stroke={colors[2]}
        strokeWidth="0.6"
        style={{ transition: 'fill 0.5s ease-out' }}
      />
      <ellipse cx="0" cy={size * 0.15} rx={size * 0.08} ry={size * 0.35} fill={colors[2]} />
      <circle cx={-size * 0.04} cy={-size * 0.15} r={size * 0.06} fill={colors[2]} />
      <circle cx={size * 0.04} cy={-size * 0.15} r={size * 0.06} fill={colors[2]} />
      <line
        x1={-size * 0.03}
        y1={-size * 0.2}
        x2={-size * 0.15}
        y2={-size * 0.35}
        stroke={colors[2]}
        strokeWidth="0.8"
      />
      <line
        x1={size * 0.03}
        y1={-size * 0.2}
        x2={size * 0.15}
        y2={-size * 0.35}
        stroke={colors[2]}
        strokeWidth="0.8"
      />
      {isSelected && (
        <ellipse
          cx="0"
          cy={size * 0.1}
          rx={size * 1.3}
          ry={size * 1.1}
          fill="none"
          stroke="#FFD700"
          strokeWidth="2"
          strokeDasharray="4,4"
          style={{ filter: 'drop-shadow(0 0 3px rgba(255,215,0,0.8))' }}
        />
      )}
    </g>
  );
}

function ColorPicker({ element, onClose, onColorChange }: {
  element: PatternElement;
  onClose: () => void;
  onColorChange: (colorIndex: number, color: string) => void;
}) {
  const [activeColorIndex, setActiveColorIndex] = useState(0);

  return (
    <div
      className="color-picker-popup"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: element.y + 50,
        left: element.x + 50,
        background: '#FFFEF0',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(139,90,43,0.25)',
        border: '1px solid rgba(139,69,19,0.2)',
        zIndex: 100,
        minWidth: '200px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontFamily: 'serif', color: '#8B4513', fontSize: '14px' }}>选择颜色</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#8B4513',
            fontSize: '16px',
            padding: '0 4px',
          }}
        >
          ×
        </button>
      </div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {element.colors.map((color, index) => (
          <div
            key={index}
            onClick={() => setActiveColorIndex(index)}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: color,
              cursor: 'pointer',
              border: activeColorIndex === index ? '2px solid #FFD700' : '2px solid transparent',
              boxShadow: activeColorIndex === index ? '0 0 4px rgba(255,215,0,0.8)' : 'none',
              transition: 'all 0.2s ease',
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '4px',
        }}
      >
        {ANCIENT_COLORS.map((c) => (
          <div
            key={c.hex}
            title={c.name}
            onClick={() => onColorChange(activeColorIndex, c.hex)}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              backgroundColor: c.hex,
              cursor: 'pointer',
              border: '1px solid rgba(139,69,19,0.15)',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLDivElement).style.transform = 'scale(1.15)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLDivElement).style.transform = 'scale(1)';
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function FanCanvas() {
  const {
    fanShape,
    elements,
    selectedElementId,
    isBreathing,
    selectElement,
    updateElementColor,
    updateElementPosition,
  } = useAppStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const [shapeAnimating, setShapeAnimating] = useState(false);
  const [displayShape, setDisplayShape] = useState(fanShape);

  useEffect(() => {
    if (fanShape !== displayShape) {
      setShapeAnimating(true);
      const timer = setTimeout(() => {
        setDisplayShape(fanShape);
        setShapeAnimating(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [fanShape, displayShape]);

  const getFanPath = useCallback((shape: 'circle' | 'begonia') => {
    if (shape === 'circle') {
      return null;
    }

    const cx = FAN_CENTER;
    const cy = FAN_CENTER;
    const r = FAN_RADIUS;
    const petals = 5;
    let path = '';

    for (let i = 0; i < petals; i++) {
      const angle1 = (i * 360) / petals - 90;
      const angle2 = ((i + 0.5) * 360) / petals - 90;
      const angle3 = ((i + 1) * 360) / petals - 90;

      const rad1 = (angle1 * Math.PI) / 180;
      const rad2 = (angle2 * Math.PI) / 180;
      const rad3 = (angle3 * Math.PI) / 180;

      const x1 = cx + Math.cos(rad1) * r * 0.85;
      const y1 = cy + Math.sin(rad1) * r * 0.85;
      const x2 = cx + Math.cos(rad2) * r * 1.05;
      const y2 = cy + Math.sin(rad2) * r * 1.05;
      const x3 = cx + Math.cos(rad3) * r * 0.85;
      const y3 = cy + Math.sin(rad3) * r * 0.85;

      const cp1x = cx + Math.cos(rad1 * 0.8 + rad2 * 0.2) * r * 1.0;
      const cp1y = cy + Math.sin(rad1 * 0.8 + rad2 * 0.2) * r * 1.0;
      const cp2x = cx + Math.cos(rad2 * 0.8 + rad3 * 0.2) * r * 1.0;
      const cp2y = cy + Math.sin(rad2 * 0.8 + rad3 * 0.2) * r * 1.0;

      if (i === 0) {
        path += `M ${x1} ${y1} `;
      }
      path += `Q ${cp1x} ${cp1y}, ${x2} ${y2} Q ${cp2x} ${cp2y}, ${x3} ${y3} `;
    }
    path += 'Z';
    return path;
  }, []);

  const handleElementClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (draggingId) return;
    selectElement(selectedElementId === id ? null : id);
  };

  const handleDragStart = (id: string, e: React.MouseEvent) => {
    const element = elements.find((el) => el.id === id);
    if (!element || !element.draggable) return;

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    setDraggingId(id);
    setDragOffset({
      x: mouseX - element.x,
      y: mouseY - element.y,
    });
    selectElement(id);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingId || !svgRef.current) return;

      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const scaleX = CANVAS_SIZE / rect.width;
      const scaleY = CANVAS_SIZE / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      const newX = mouseX - dragOffset.x;
      const newY = mouseY - dragOffset.y;

      const dx = newX - FAN_CENTER;
      const dy = newY - FAN_CENTER;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = FAN_RADIUS * 0.85;

      if (dist > maxDist) {
        const ratio = maxDist / dist;
        updateElementPosition(draggingId, FAN_CENTER + dx * ratio, FAN_CENTER + dy * ratio);
      } else {
        updateElementPosition(draggingId, newX, newY);
      }
    },
    [draggingId, dragOffset, updateElementPosition]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, handleMouseMove, handleMouseUp]);

  const handleCanvasClick = () => {
    selectElement(null);
  };

  const handleShapeSwitch = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipple({ x, y, id: Date.now() });
    setTimeout(() => setRipple(null), 600);

    useAppStore.getState().setFanShape(fanShape === 'circle' ? 'begonia' : 'circle');
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId);
  const fanPath = getFanPath(displayShape);

  return (
    <div
      className="fan-canvas-container"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <button
        className="shape-switch-btn"
        onClick={handleShapeSwitch}
        style={{
          position: 'relative',
          background: 'transparent',
          border: '1px solid rgba(139,69,19,0.3)',
          borderRadius: '8px',
          padding: '8px 20px',
          marginBottom: '16px',
          cursor: 'pointer',
          fontFamily: 'serif',
          fontSize: '14px',
          color: '#8B4513',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(139,69,19,0.05)';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
        }}
      >
        {fanShape === 'circle' ? '海棠形' : '圆形'}
        {ripple && (
          <span
            key={ripple.id}
            style={{
              position: 'absolute',
              left: ripple.x - 40,
              top: ripple.y - 40,
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#FFF0D5',
              opacity: 0.6,
              animation: 'ripple 0.6s ease-out forwards',
              pointerEvents: 'none',
            }}
          />
        )}
      </button>

      <div
        className="fan-svg-wrapper"
        id="fan-canvas-wrapper"
        style={{
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.3)',
          boxShadow: '0 8px 24px rgba(139,90,43,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isBreathing ? 'scale(1.01)' : 'scale(1)',
          transition: shapeAnimating ? 'none' : 'transform 2s ease-in-out infinite',
          animation: isBreathing && !shapeAnimating ? 'breathe 2s ease-in-out infinite' : 'none',
        }}
      >
        <svg
          ref={svgRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
          onClick={handleCanvasClick}
          style={{
            transition: shapeAnimating ? 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          }}
        >
          <defs>
            <radialGradient id="fanGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F5E6CA" />
              <stop offset="100%" stopColor="#E8D5B5" />
            </radialGradient>
            <clipPath id="fanClip">
              {fanPath ? (
                <path d={fanPath} />
              ) : (
                <circle cx={FAN_CENTER} cy={FAN_CENTER} r={FAN_RADIUS} />
              )}
            </clipPath>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {fanPath ? (
            <path d={fanPath} fill="url(#fanGradient)" opacity="0.9" />
          ) : (
            <circle
              cx={FAN_CENTER}
              cy={FAN_CENTER}
              r={FAN_RADIUS}
              fill="url(#fanGradient)"
              opacity="0.9"
            />
          )}

          <g clipPath="url(#fanClip)">
            {elements.map((element) => {
              const isSelected = selectedElementId === element.id;
              const commonProps = {
                element,
                isSelected,
                onClick: (e: React.MouseEvent) => handleElementClick(element.id, e),
              };

              if (element.type === 'peony') {
                return <PeonyFlower key={element.id} {...commonProps} />;
              }
              if (element.type === 'plum') {
                return (
                  <PlumFlower
                    key={element.id}
                    {...commonProps}
                    onMouseDown={(e) => handleDragStart(element.id, e)}
                  />
                );
              }
              if (element.type === 'butterfly') {
                return (
                  <Butterfly
                    key={element.id}
                    {...commonProps}
                    onMouseDown={(e) => handleDragStart(element.id, e)}
                  />
                );
              }
              return null;
            })}
          </g>

          {fanPath ? (
            <path
              d={fanPath}
              fill="none"
              stroke="rgba(139,69,19,0.3)"
              strokeWidth="2"
            />
          ) : (
            <circle
              cx={FAN_CENTER}
              cy={FAN_CENTER}
              r={FAN_RADIUS}
              fill="none"
              stroke="rgba(139,69,19,0.3)"
              strokeWidth="2"
            />
          )}
        </svg>

        {selectedElement && (
          <ColorPicker
            element={selectedElement}
            onClose={() => selectElement(null)}
            onColorChange={(colorIndex, color) => {
              updateElementColor(selectedElement.id, colorIndex, color);
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 0.6;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.01);
          }
        }
      `}</style>
    </div>
  );
}
