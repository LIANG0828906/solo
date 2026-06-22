import React, { memo, useRef, useCallback } from 'react';
import type { Material } from '../types';

interface MaterialWarehouseProps {
  discoveredMaterialIds: string[];
  materials: Record<string, Material>;
  resultSlotMaterialId: string | null;
  onDragStart: (materialId: string, e: React.DragEvent) => void;
  onClearResult: () => void;
}

const GRID_CELL = 65;
const GAP = 10;

const MaterialWarehouseComponent: React.FC<MaterialWarehouseProps> = ({
  discoveredMaterialIds,
  materials,
  resultSlotMaterialId,
  onDragStart,
  onClearResult,
}) => {
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const handleDragStart = useCallback(
    (materialId: string, e: React.DragEvent<HTMLDivElement>) => {
      const mat = materials[materialId];
      if (!mat) return;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/x-material-id', materialId);

      const img = document.createElement('canvas');
      img.width = 1;
      img.height = 1;
      const ctx = img.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, 1, 1);
      }
      try {
        e.dataTransfer.setDragImage(img, 0, 0);
      } catch {}

      const ghost = document.createElement('div');
      ghost.style.cssText = `
        position: fixed;
        z-index: 9999;
        pointer-events: none;
        width: ${GRID_CELL}px;
        height: ${GRID_CELL}px;
        background: rgba(61, 43, 26, 0.95);
        border: 2px solid #c9a961;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36px;
        box-shadow: 4px 4px 8px rgba(0,0,0,0.66);
        transform: translate(-50%, -50%) scale(0.9);
        transition: opacity 0.15s;
        opacity: 0;
      `;
      ghost.textContent = mat.emoji;
      document.body.appendChild(ghost);
      ghostRef.current = ghost;

      requestAnimationFrame(() => {
        ghost.style.opacity = '1';
      });

      onDragStart(materialId, e);
    },
    [materials, onDragStart]
  );

  React.useEffect(() => {
    const handleDragMove = (e: DragEvent) => {
      if (!ghostRef.current) return;
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        if (ghostRef.current) {
          ghostRef.current.style.left = `${e.clientX}px`;
          ghostRef.current.style.top = `${e.clientY}px`;
        }
        rafRef.current = null;
      });
    };
    const handleDragEnd = () => {
      if (ghostRef.current) {
        ghostRef.current.style.opacity = '0';
        const g = ghostRef.current;
        setTimeout(() => g.remove(), 150);
        ghostRef.current = null;
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    window.addEventListener('dragover', handleDragMove);
    window.addEventListener('dragend', handleDragEnd);
    return () => {
      window.removeEventListener('dragover', handleDragMove);
      window.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  const resultMaterial = resultSlotMaterialId ? materials[resultSlotMaterialId] : null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🏺 材料仓库</h2>
        <span style={styles.count}>{discoveredMaterialIds.length} 种</span>
      </div>

      {resultMaterial && (
        <div style={styles.resultBox} onClick={onClearResult} title="点击清空结果">
          <div style={styles.resultLabel}>最近合成</div>
          <div
            style={{
              ...styles.resultItem,
              animation: 'alchemyResultDrop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <span style={styles.resultEmoji}>{resultMaterial.emoji}</span>
            <div style={styles.resultMeta}>
              <div style={styles.resultName}>{resultMaterial.name}</div>
              <div style={styles.resultElement}>
                {elementLabel(resultMaterial.elementType)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.gridContainer}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, ${GRID_CELL}px)`,
            gap: GAP,
            padding: 4,
          }}
        >
          {discoveredMaterialIds.map((id) => {
            const mat = materials[id];
            if (!mat) return null;
            return (
              <div
                key={id}
                draggable
                onDragStart={(e) => handleDragStart(id, e)}
                style={styles.cell}
                title={`${mat.name} · ${elementLabel(mat.elementType)}`}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform =
                    'scale(1.05) translateY(-2px)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#c9a961';
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    '0 6px 14px rgba(201,169,97,0.2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#4a4a6a';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <span style={styles.cellEmoji}>{mat.emoji}</span>
                <span style={styles.cellName}>{mat.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function elementLabel(t: string): string {
  const m: Record<string, string> = {
    fire: '🔥火',
    water: '💧水',
    earth: '🪨土',
    air: '💨风',
    chaos: '🔮混沌',
    spirit: '✨灵',
    metal: '⚙️金',
    nature: '🌿木',
  };
  return m[t] || t;
}

const styles: Record<string, React.CSSProperties | string> = {
  container: {
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: 12,
    background:
      'linear-gradient(135deg, rgba(26,26,46,0.6) 0%, rgba(15,15,30,0.8) 100%)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderBottom: '1px solid #3a3a5a',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontFamily: "'Cinzel', serif",
    fontSize: 16,
    fontWeight: 700,
    color: '#ffd54f',
    margin: 0,
    letterSpacing: 0.5,
  },
  count: {
    fontFamily: "'Crimson Text', serif",
    fontSize: 12,
    color: '#7a7aaa',
    background: '#1e1e3e',
    padding: '2px 8px',
    borderRadius: 10,
    border: '1px solid #3a3a5a',
  },
  resultBox: {
    background: 'linear-gradient(135deg, #2a2a4a 0%, #1e1e3e 100%)',
    border: '1px solid #4a4a6a',
    borderRadius: 8,
    padding: 10,
    cursor: 'pointer',
    transition: 'transform 0.3s ease-out, border-color 0.3s',
  },
  resultLabel: {
    fontFamily: "'Crimson Text', serif",
    fontSize: 11,
    color: '#7a7aaa',
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  resultEmoji: {
    fontSize: 36,
  },
  resultMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  resultName: {
    fontFamily: "'Cinzel', serif",
    fontSize: 14,
    fontWeight: 600,
    color: '#ffd54f',
  },
  resultElement: {
    fontFamily: "'Crimson Text', serif",
    fontSize: 12,
    color: '#b8b8d0',
  },
  gridContainer: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'thin',
    scrollbarColor: '#3a3a5a transparent',
  },
  cell: {
    width: GRID_CELL,
    height: GRID_CELL + 14,
    background: 'rgba(42, 42, 74, 0.7)',
    border: '1px solid #4a4a6a',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
    transition: 'transform 0.3s ease-out, border-color 0.3s, box-shadow 0.3s',
    userSelect: 'none',
  },
  cellEmoji: {
    fontSize: 28,
    lineHeight: 1,
  },
  cellName: {
    marginTop: 4,
    fontFamily: "'Crimson Text', serif",
    fontSize: 10,
    color: '#b8b8d0',
    textAlign: 'center',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: GRID_CELL - 8,
  },
};

export const MaterialWarehouse = memo(MaterialWarehouseComponent);
