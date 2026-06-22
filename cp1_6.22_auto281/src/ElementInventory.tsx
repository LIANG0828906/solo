import React from 'react';
import { Element } from './synthesisData';

interface ElementInventoryProps {
  elements: Element[];
  onDragStart: (element: Element) => void;
}

const ElementInventory: React.FC<ElementInventoryProps> = React.memo(({ elements, onDragStart }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, element: Element) => {
    e.dataTransfer.setData('text/plain', element.id);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(element);
  };

  const renderStars = (rarity: number) => {
    return '★'.repeat(rarity);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>元素仓库</h2>
      <div style={styles.grid}>
        {elements.map((element) => (
          <div
            key={element.id}
            draggable
            onDragStart={(e) => handleDragStart(e, element)}
            style={{
              ...styles.card,
              backgroundColor: element.color,
            }}
            className="element-card"
          >
            <div style={styles.cardName}>{element.name}</div>
            <div style={styles.cardStars}>{renderStars(element.rarity)}</div>
          </div>
        ))}
      </div>
    </div>
  );
});

ElementInventory.displayName = 'ElementInventory';

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 280,
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 16,
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  title: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 600,
    margin: '0 0 16px 0',
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
  },
  card: {
    width: 100,
    height: 100,
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
    transition: 'transform 0.2s, box-shadow 0.2s',
    userSelect: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    justifySelf: 'center',
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 600,
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  },
  cardStars: {
    color: '#FFD700',
    fontSize: 14,
    marginTop: 6,
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  },
};

export default ElementInventory;
