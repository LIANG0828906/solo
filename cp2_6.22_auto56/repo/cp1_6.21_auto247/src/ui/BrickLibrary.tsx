import { useState } from 'react';
import { BrickType, BRICK_COLORS } from '../store/useAppStore';

interface BrickLibraryProps {
  brickTypes: BrickType[];
}

export default function BrickLibrary({ brickTypes }: BrickLibraryProps) {
  const [selectedColor, setSelectedColor] = useState(BRICK_COLORS[0]);

  const handleDragStart = (e: React.DragEvent, brickType: BrickType) => {
    const data = { type: brickType.id, color: selectedColor };
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>积木库</h3>

      <div style={styles.colorSection}>
        <span style={styles.colorLabel}>颜色：</span>
        <div style={styles.colorOptions}>
          {BRICK_COLORS.map((color) => (
            <button
              key={color}
              style={{
                ...styles.colorBtn,
                backgroundColor: color,
                border: selectedColor === color ? '2px solid #fff' : '2px solid transparent',
              }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
      </div>

      <div style={styles.brickGrid}>
        {brickTypes.map((brickType) => (
          <div
            key={brickType.id}
            draggable
            onDragStart={(e) => handleDragStart(e, brickType)}
            style={styles.brickCard}
          >
            <div style={styles.brickPreview}>
              <div
                style={{
                  ...styles.brickShape,
                  backgroundColor: selectedColor,
                  width: Math.min(brickType.width * 15, 50),
                  height: Math.min(brickType.height * 15, 20),
                  borderRadius: 3,
                }}
              />
            </div>
            <span style={styles.brickName}>{brickType.name}</span>
          </div>
        ))}
      </div>

      <div style={styles.hint}>
        <p style={styles.hintText}>拖拽积木到场景中</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 240,
    padding: 12,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    flexShrink: 0,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
  },
  colorSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  colorLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  colorOptions: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  colorBtn: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
    padding: 0,
  },
  brickGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  },
  brickCard: {
    width: '100%',
    height: 96,
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 8,
    cursor: 'grab',
    transition: 'all 0.2s ease-out',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    userSelect: 'none',
  },
  brickPreview: {
    width: 64,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brickShape: {
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  brickName: {
    color: '#E2E8F0',
    fontSize: 11,
    textAlign: 'center',
  },
  hint: {
    marginTop: 'auto',
    padding: '8px 0',
  },
  hintText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    margin: 0,
  },
};
