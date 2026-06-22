import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Element, buildRecipeMap, ALL_ELEMENTS } from './synthesisData';

interface SynthesisFurnaceProps {
  slots: (Element | null)[];
  onSlotChange: (slotIndex: number, element: Element | null) => void;
  onSynthesis: (outputElement: Element, inputs: Element[]) => void;
}

const SynthesisFurnace: React.FC<SynthesisFurnaceProps> = React.memo(({
  slots,
  onSlotChange,
  onSynthesis,
}) => {
  const [flashSlots, setFlashSlots] = useState(false);
  const [flyingElement, setFlyingElement] = useState<Element | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const recipeMap = useMemo(() => buildRecipeMap(), []);
  const isSynthesizingRef = useRef(false);

  const matchedOutputId = useMemo(() => {
    const filledElements = slots.filter((s): s is Element => s !== null);
    if (filledElements.length < 2) return null;
    const key = filledElements.map(e => e.id).sort().join(',');
    return recipeMap.get(key) || null;
  }, [slots, recipeMap]);

  useEffect(() => {
    if (!matchedOutputId || isSynthesizingRef.current) return;
    const filledElements = slots.filter((s): s is Element => s !== null);
    const output = ALL_ELEMENTS[matchedOutputId];
    if (!output) return;

    isSynthesizingRef.current = true;
    setFlashSlots(true);
    setFlyingElement(output);

    const timer = setTimeout(() => {
      setFlashSlots(false);
      setFlyingElement(null);
      onSynthesis(output, filledElements);
      isSynthesizingRef.current = false;
    }, 500);

    return () => clearTimeout(timer);
  }, [matchedOutputId]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const elementId = e.dataTransfer.getData('text/plain');
    const element = ALL_ELEMENTS[elementId];
    if (element && !isSynthesizingRef.current) {
      onSlotChange(index, element);
    }
  };

  const handleSlotClick = (index: number) => {
    if (!isSynthesizingRef.current && slots[index]) {
      onSlotChange(index, null);
    }
  };

  const renderStars = (rarity: number) => '★'.repeat(rarity);

  return (
    <div style={styles.wrapper}>
      {flyingElement && (
        <div
          style={{
            ...styles.flyingCard,
            backgroundColor: flyingElement.color,
            animation: 'flyToInventory 0.5s ease-out forwards',
          }}
        >
          <div style={styles.flyingName}>{flyingElement.name}</div>
          <div style={styles.flyingStars}>{renderStars(flyingElement.rarity)}</div>
        </div>
      )}

      <div style={styles.titleRow}>
        <h2 style={styles.title}>合成炉</h2>
        {matchedOutputId && (
          <div style={styles.matchHint}>
            ✨ 合成中...
          </div>
        )}
      </div>

      <div style={styles.furnace}>
        {slots.map((slot, index) => (
          <div
            key={index}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onClick={() => handleSlotClick(index)}
            style={{
              ...styles.slot,
              borderColor: slot ? '#FFD700' : dragOverIndex === index ? '#FFD700' : '#5A5A5A',
              borderStyle: slot ? 'solid' : 'dashed',
              boxShadow: flashSlots ? '0 0 20px 8px #FFD700, 0 0 40px 4px #FFD700' : dragOverIndex === index ? '0 0 12px #FFD700' : 'none',
              animation: flashSlots ? 'goldFlash 0.5s ease-in-out' : undefined,
              cursor: slot ? 'pointer' : 'default',
            }}
          >
            {slot && (
              <div
                style={{
                  ...styles.slotElement,
                  backgroundColor: slot.color,
                }}
              >
                <div style={styles.slotName}>{slot.name}</div>
                <div style={styles.slotStars}>{renderStars(slot.rarity)}</div>
              </div>
            )}
            {!slot && (
              <div style={styles.slotPlaceholder}>槽 {index + 1}</div>
            )}
          </div>
        ))}
      </div>

      <div style={styles.tip}>
        💡 从左侧拖拽元素到槽位，点击槽位可移除元素
      </div>
    </div>
  );
});

SynthesisFurnace.displayName = 'SynthesisFurnace';

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 20px',
  },
  titleRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  title: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 600,
    margin: 0,
  },
  matchHint: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 600,
    padding: '4px 12px',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: 8,
    border: '1px solid #4CAF50',
  },
  furnace: {
    display: 'flex',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  slot: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    border: '2px dashed #5A5A5A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    padding: 8,
    boxSizing: 'border-box',
  },
  slotPlaceholder: {
    color: '#5A5A5A',
    fontSize: 14,
  },
  slotElement: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s',
  },
  slotName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 600,
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  },
  slotStars: {
    color: '#FFD700',
    fontSize: 14,
    marginTop: 6,
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  },
  tip: {
    color: '#888888',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  flyingCard: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 10,
    top: -20,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    pointerEvents: 'none',
    boxShadow: '0 0 20px #FFD700',
  },
  flyingName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  },
  flyingStars: {
    color: '#FFD700',
    fontSize: 12,
    marginTop: 4,
  },
};

export default SynthesisFurnace;
