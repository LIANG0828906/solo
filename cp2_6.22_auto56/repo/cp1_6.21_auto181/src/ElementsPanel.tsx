import React, { useState, useRef, useCallback, useEffect } from 'react';
import { getElementById, getBasicElements, type Element } from './RecipeManager';

interface ElementsPanelProps {
  slots: (string | null)[];
  unlockedElements: string[];
  onSlotChange: (slotIndex: number, elementId: string | null) => void;
  onSynthesize: () => void;
  canSynthesize: boolean;
}

interface DragState {
  elementId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  fromSlot: number | null;
}

const ElementsPanel: React.FC<ElementsPanelProps> = ({
  slots,
  unlockedElements,
  onSlotChange,
  onSynthesize,
  canSynthesize
}) => {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [bounceSlot, setBounceSlot] = useState<number | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const basicElements = getBasicElements();
  const allUnlockedElements = unlockedElements
    .map(id => getElementById(id))
    .filter((e): e is Element => e !== undefined);

  const handleMouseDown = useCallback((
    e: React.MouseEvent,
    elementId: string,
    fromSlot: number | null = null
  ) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragState({
      elementId,
      startX: rect.left + rect.width / 2,
      startY: rect.top + rect.height / 2,
      currentX: e.clientX,
      currentY: e.clientY,
      fromSlot
    });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState) return;
    setDragState(prev => prev ? {
      ...prev,
      currentX: e.clientX,
      currentY: e.clientY
    } : null);
  }, [dragState]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragState) return;

    let dropped = false;

    for (let i = 0; i < slotRefs.current.length; i++) {
      const slotEl = slotRefs.current[i];
      if (!slotEl) continue;

      const rect = slotEl.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        if (dragState.fromSlot !== null && dragState.fromSlot === i) {
          dropped = true;
          break;
        }

        onSlotChange(i, dragState.elementId);

        if (dragState.fromSlot !== null) {
          onSlotChange(dragState.fromSlot, null);
        }

        dropped = true;
        break;
      }
    }

    if (!dropped && dragState.fromSlot !== null) {
      setBounceSlot(dragState.fromSlot);
      setTimeout(() => setBounceSlot(null), 300);
    }

    setDragState(null);
  }, [dragState, onSlotChange]);

  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  const dragElement = dragState ? getElementById(dragState.elementId) : null;

  const renderElementSlot = (element: Element, keyPrefix: string) => {
    return (
      <div
        key={`${keyPrefix}-${element.id}`}
        className="element-slot"
        style={{
          ...styles.elementSlot,
          borderColor: element.color + '40'
        }}
        onMouseDown={(e) => handleMouseDown(e, element.id)}
        title={element.name}
      >
        <span style={{ fontSize: '28px' }}>{element.icon}</span>
        <span style={{ ...styles.elementName, color: element.color }}>{element.name}</span>
      </div>
    );
  };

  return (
    <div style={styles.panel}>
      <div style={styles.synthesisArea}>
        <div style={styles.slotLabel}>合成槽 1</div>
        <div
          ref={el => slotRefs.current[0] = el}
          className={`synthesis-slot ${bounceSlot === 0 ? 'bounce' : ''}`}
          style={{
            ...styles.synthesisSlot,
            animation: bounceSlot === 0 ? 'bounceBack 0.3s ease-out' : 'none'
          }}
          onMouseDown={(e) => {
            if (slots[0]) {
              handleMouseDown(e, slots[0]!, 0);
            }
          }}
        >
          {slots[0] && (() => {
            const el = getElementById(slots[0]!);
            return el ? (
              <>
                <span style={{ fontSize: '32px' }}>{el.icon}</span>
                <span style={{ ...styles.slotElementName, color: el.color }}>{el.name}</span>
              </>
            ) : null;
          })()}
          {!slots[0] && <span style={styles.slotPlaceholder}>+</span>}
        </div>

        <div style={styles.plusSign}>+</div>

        <div
          ref={el => slotRefs.current[1] = el}
          className={`synthesis-slot ${bounceSlot === 1 ? 'bounce' : ''}`}
          style={{
            ...styles.synthesisSlot,
            animation: bounceSlot === 1 ? 'bounceBack 0.3s ease-out' : 'none'
          }}
          onMouseDown={(e) => {
            if (slots[1]) {
              handleMouseDown(e, slots[1]!, 1);
            }
          }}
        >
          {slots[1] && (() => {
            const el = getElementById(slots[1]!);
            return el ? (
              <>
                <span style={{ fontSize: '32px' }}>{el.icon}</span>
                <span style={{ ...styles.slotElementName, color: el.color }}>{el.name}</span>
              </>
            ) : null;
          })()}
          {!slots[1] && <span style={styles.slotPlaceholder}>+</span>}
        </div>
        <div style={styles.slotLabel}>合成槽 2</div>
      </div>

      <button
        style={{
          ...styles.synthesizeBtn,
          background: canSynthesize ? '#16A34A' : '#374151',
          cursor: canSynthesize ? 'pointer' : 'not-allowed',
          opacity: canSynthesize ? 1 : 0.5
        }}
        onClick={onSynthesize}
        disabled={!canSynthesize}
        className="synthesize-btn"
      >
        ⚗️ 合成
      </button>

      <div style={styles.elementsSection}>
        <div style={styles.sectionTitle}>基础元素</div>
        <div style={styles.elementGrid}>
          {basicElements.map(el => renderElementSlot(el, 'basic'))}
        </div>

        {allUnlockedElements.filter(e => e.tier !== 'basic').length > 0 && (
          <>
            <div style={styles.sectionTitle}>已解锁材料</div>
            <div style={styles.elementGrid}>
              {allUnlockedElements
                .filter(e => e.tier !== 'basic')
                .map(el => renderElementSlot(el, 'unlocked'))}
            </div>
          </>
        )}
      </div>

      {dragState && dragElement && (
        <div
          style={{
            ...styles.dragElement,
            left: dragState.currentX - 30,
            top: dragState.currentY - 30,
            opacity: 0.7
          }}
        >
          <span style={{ fontSize: '36px' }}>{dragElement.icon}</span>
        </div>
      )}

      <style>{`
        @keyframes bounceBack {
          0% { transform: scale(1); }
          30% { transform: scale(1.2); }
          50% { transform: scale(0.9); }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .element-slot:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .element-slot:active {
          transform: translateY(2px);
        }

        .synthesize-btn:hover:not(:disabled) {
          background: #22C55E !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
        }

        .synthesize-btn:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }

        .synthesis-slot:hover {
          border-color: #6366F1 !important;
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: '#1E293B',
    borderRadius: '8px',
    border: '2px solid #334155',
    width: '280px',
    position: 'relative'
  },
  synthesisArea: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    position: 'relative',
    width: '100%'
  },
  slotLabel: {
    position: 'absolute',
    top: '-20px',
    fontSize: '10px',
    color: '#94A3B8',
    fontFamily: "'Courier New', monospace"
  },
  synthesisSlot: {
    width: 60,
    height: 60,
    background: '#0F172A',
    border: '2px dashed #475569',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    gap: '2px'
  },
  slotElementName: {
    fontSize: '10px',
    fontFamily: "'Courier New', monospace"
  },
  slotPlaceholder: {
    fontSize: '24px',
    color: '#475569'
  },
  plusSign: {
    fontSize: '24px',
    color: '#64748B',
    fontWeight: 'bold'
  },
  synthesizeBtn: {
    width: '100%',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontFamily: "'Courier New', monospace",
    textTransform: 'uppercase',
    letterSpacing: '1px',
    transition: 'all 0.15s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    borderBottom: '3px solid #166534'
  },
  elementsSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  sectionTitle: {
    fontSize: '12px',
    color: '#94A3B8',
    fontFamily: "'Courier New', monospace",
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginTop: '8px'
  },
  elementGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px'
  },
  elementSlot: {
    width: 56,
    height: 56,
    background: '#0F172A',
    border: '2px solid #374151',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
    transition: 'all 0.15s ease',
    userSelect: 'none',
    gap: '2px'
  },
  elementName: {
    fontSize: '9px',
    fontFamily: "'Courier New', monospace"
  },
  dragElement: {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 1000,
    width: 60,
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '2px solid #6366F1',
    borderRadius: '4px'
  }
};

export default ElementsPanel;
