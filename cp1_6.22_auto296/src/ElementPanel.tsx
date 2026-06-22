import React, { useState } from 'react';
import { ElementType, ELEMENT_COLORS, ELEMENT_NAMES } from './types';

interface ElementPanelProps {
  inventory: Record<ElementType, number>;
  onDragStart: (element: ElementType) => void;
  onDragEnd: () => void;
  draggedElement: ElementType | null;
}

interface DragState {
  isDragging: boolean;
  element: ElementType | null;
  x: number;
  y: number;
}

const ElementPanel: React.FC<ElementPanelProps> = ({
  inventory,
  onDragStart,
  onDragEnd,
}) => {
  const [hoveredElement, setHoveredElement] = useState<ElementType | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    element: null,
    x: 0,
    y: 0,
  });

  const handleMouseDown = (e: React.MouseEvent, element: ElementType) => {
    if (inventory[element] <= 0) return;
    e.preventDefault();
    setDragState({
      isDragging: true,
      element,
      x: e.clientX,
      y: e.clientY,
    });
    onDragStart(element);

    const handleMouseMove = (ev: MouseEvent) => {
      setDragState((prev) => ({
        ...prev,
        x: ev.clientX,
        y: ev.clientY,
      }));
    };

    const handleMouseUp = () => {
      setDragState({
        isDragging: false,
        element: null,
        x: 0,
        y: 0,
      });
      onDragEnd();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
      <div
        style={{
          width: '220px',
          padding: '20px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#8888ff',
            textAlign: 'center',
            marginBottom: '8px',
          }}
        >
          ✦ 元素仓库
        </div>

        {Object.values(ElementType).map((element) => {
          const count = inventory[element];
          const isDisabled = count <= 0;
          const isHovered = hoveredElement === element;
          const color = ELEMENT_COLORS[element];

          return (
            <div
              key={element}
              onMouseEnter={() => setHoveredElement(element)}
              onMouseLeave={() => setHoveredElement(null)}
              onMouseDown={(e) => handleMouseDown(e, element)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px',
                borderRadius: '10px',
                background: isHovered ? 'rgba(255,255,255,0.08)' : 'transparent',
                cursor: isDisabled ? 'not-allowed' : 'grab',
                opacity: isDisabled ? 0.4 : 1,
                transition: 'all 0.2s ease',
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  width: isHovered && !isDisabled ? '52px' : '48px',
                  height: isHovered && !isDisabled ? '52px' : '48px',
                  borderRadius: '50%',
                  padding: '8px',
                  background: `radial-gradient(circle, ${color}44 0%, ${color}11 100%)`,
                  border: `2px solid ${color}`,
                  boxShadow: isHovered && !isDisabled
                    ? `0 0 20px ${color}, 0 0 40px ${color}66`
                    : `0 0 8px ${color}66`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: color,
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                  animation: isHovered && !isDisabled ? 'elementHover 1s ease-in-out infinite' : 'none',
                }}
              >
                {element === ElementType.Fire && '🔥'}
                {element === ElementType.Ice && '❄'}
                {element === ElementType.Lightning && '⚡'}
                {element === ElementType.Shadow && '🌑'}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: color,
                  }}
                >
                  {ELEMENT_NAMES[element]}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#888888',
                    marginTop: '2px',
                  }}
                >
                  剩余：<span style={{ color, fontWeight: 'bold' }}>{count}</span> / 3
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {dragState.isDragging && dragState.element && (
        <div
          style={{
            position: 'fixed',
            left: dragState.x - 28,
            top: dragState.y - 28,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${ELEMENT_COLORS[dragState.element]}66 0%, ${ELEMENT_COLORS[dragState.element]}22 100%)`,
            border: `2px solid ${ELEMENT_COLORS[dragState.element]}`,
            boxShadow: `0 0 30px ${ELEMENT_COLORS[dragState.element]}88, 0 8px 20px ${ELEMENT_COLORS[dragState.element]}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            pointerEvents: 'none',
            zIndex: 9999,
            opacity: 0.85,
          }}
        >
          {dragState.element === ElementType.Fire && '🔥'}
          {dragState.element === ElementType.Ice && '❄'}
          {dragState.element === ElementType.Lightning && '⚡'}
          {dragState.element === ElementType.Shadow && '🌑'}
        </div>
      )}
    </>
  );
};

export default ElementPanel;
