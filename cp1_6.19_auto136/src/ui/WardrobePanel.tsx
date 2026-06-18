import { useEffect, useRef } from 'react';
import { WardrobeItem } from '../types';
import { drawWardrobeIcon } from '../engine/pixelRenderer';

interface WardrobePanelProps {
  categories: { title: string; items: WardrobeItem[] }[];
  selectedIds: Set<string>;
  onSelect: (item: WardrobeItem) => void;
}

export function WardrobePanel({ categories, selectedIds, onSelect }: WardrobePanelProps) {
  return (
    <div style={styles.panel}>
      {categories.map((category) => (
        <div key={category.title} style={styles.category}>
          <h3 style={styles.categoryTitle}>{category.title}</h3>
          <div style={styles.itemGrid}>
            {category.items.map((item) => (
              <WardrobeIcon
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                onClick={() => onSelect(item)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface WardrobeIconProps {
  item: WardrobeItem;
  selected: boolean;
  onClick: () => void;
}

function WardrobeIcon({ item, selected, onClick }: WardrobeIconProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    drawWardrobeIcon(ctx, item.color, 64);
  }, [item.color]);

  return (
    <div
      className="item-wrapper"
      style={{
        ...styles.itemWrapper,
        border: selected ? '3px solid #FFD54F' : '2px solid transparent',
      }}
      onClick={onClick}
      title={item.name}
    >
      <canvas
        ref={canvasRef}
        width={64}
        height={64}
        style={styles.itemCanvas}
      />
      <span style={styles.itemName}>{item.name}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: '220px',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    height: 'calc(100% - 80px)',
    overflowY: 'auto',
    boxSizing: 'border-box',
  },
  category: {
    marginBottom: '20px',
  },
  categoryTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  itemWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    borderRadius: '8px',
    padding: '4px',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
    backgroundColor: '#FAFAFA',
  },
  itemCanvas: {
    imageRendering: 'pixelated',
  },
  itemName: {
    fontSize: '10px',
    color: '#666',
    marginTop: '4px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    textAlign: 'center',
  },
};

export default WardrobePanel;
