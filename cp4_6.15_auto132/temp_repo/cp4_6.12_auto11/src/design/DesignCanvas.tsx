import React, { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '../store/projectStore';

const CELL_SIZE = 24;

interface HoverInfo {
  index: number;
  x: number;
  y: number;
}

const DesignCanvas: React.FC = () => {
  const {
    currentProject,
    fabrics,
    setCell,
    swapCells,
  } = useProjectStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [draggedFabricId, setDraggedFabricId] = useState<number | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [animatingCells, setAnimatingCells] = useState<Set<number>>(new Set());
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);
  const [dragOverCell, setDragOverCell] = useState<number | null>(null);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedId = sessionStorage.getItem('draggedFabricId');
      if (storedId) {
        setDraggedFabricId(Number(storedId));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    handleStorageChange();
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!currentProject) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>🧵</div>
        <div style={styles.emptyTitle}>开始你的拼布之旅</div>
        <div style={styles.emptyText}>从左侧布料库拖拽色块到画布，或创建新项目开始设计</div>
      </div>
    );
  }

  const { gridCols, gridRows, layout } = currentProject;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCanvas(true);
  };

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setIsDragOverCanvas(false);
        setDragOverCell(null);
      }
    }
  };

  const handleCellDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverCell(index);
  };

  const handleCellDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDropOnCell = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    const fabricIdStr = e.dataTransfer.getData('fabricId');
    const fromIndexStr = e.dataTransfer.getData('cellIndex');

    if (fromIndexStr) {
      const fromIndex = Number(fromIndexStr);
      if (fromIndex !== index) {
        swapCells(fromIndex, index);
      }
    } else if (fabricIdStr) {
      const fabricId = Number(fabricIdStr);
      setCell(index, fabricId);
      setAnimatingCells((prev) => {
        const next = new Set(prev);
        next.add(index);
        return next;
      });
      setTimeout(() => {
        setAnimatingCells((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }, 220);
    }
    setDragFromIndex(null);
    setDraggedFabricId(null);
    setIsDragOverCanvas(false);
    setDragOverCell(null);
    sessionStorage.removeItem('draggedFabricId');
  };

  const handleCellDragStart = (e: React.DragEvent, index: number) => {
    if (layout[index]?.fabricId === null) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('cellIndex', String(index));
    e.dataTransfer.effectAllowed = 'move';
    setDragFromIndex(index);
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    e.dataTransfer.setDragImage(target, rect.width / 2, rect.height / 2);
  };

  const handleCellDragEnd = () => {
    setDragFromIndex(null);
    setIsDragOverCanvas(false);
    setDragOverCell(null);
  };

  const handleCellMouseEnter = (e: React.MouseEvent, index: number) => {
    if (layout[index]?.fabricId !== null) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      setHoverInfo({
        index,
        x: rect.left - (canvasRect?.left || 0) + CELL_SIZE + 8,
        y: rect.top - (canvasRect?.top || 0),
      });
    }
  };

  const handleCellMouseLeave = () => {
    setHoverInfo(null);
  };

  const fabricMap = new Map(fabrics.map((f) => [f.id, f]));

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < gridCols * gridRows; i++) {
    const cell = layout[i];
    const fabric = cell?.fabricId ? fabricMap.get(cell.fabricId) : undefined;
    const isAnimating = animatingCells.has(i);
    const isDragSource = dragFromIndex === i;
    const isDragOver = dragOverCell === i;

    cells.push(
      <div
        key={i}
        data-cell
        draggable={cell?.fabricId !== null}
        onDragStart={(e) => handleCellDragStart(e, i)}
        onDragEnd={handleCellDragEnd}
        onDragOver={handleDragOver}
        onDragEnter={(e) => handleCellDragEnter(e, i)}
        onDragLeave={handleCellDragLeave}
        onDrop={(e) => handleDropOnCell(e, i)}
        onMouseEnter={(e) => handleCellMouseEnter(e, i)}
        onMouseLeave={handleCellMouseLeave}
        style={{
          ...styles.cell,
          width: CELL_SIZE,
          height: CELL_SIZE,
          background: fabric?.gradient || (isDragOver ? 'rgba(184, 115, 51, 0.2)' : 'transparent'),
          opacity: isDragSource ? 0.4 : 1,
          transform: isAnimating ? 'scale(1)' : undefined,
          animation: isAnimating ? 'cellPopIn 0.2s ease-out' : undefined,
          boxShadow: isDragOver ? 'inset 0 0 0 2px #B87333' : undefined,
        }}
      />
    );
  }

  const hoveredFabric = hoverInfo && layout[hoverInfo.index]?.fabricId
    ? fabricMap.get(layout[hoverInfo.index].fabricId!)
    : undefined;

  return (
    <div ref={canvasRef} style={styles.canvasWrapper}>
      <div style={styles.dimensionLabel}>
        尺寸：{currentProject.widthCm} × {currentProject.heightCm} cm &nbsp;|&nbsp;
        网格：{gridCols} × {gridRows} 格
      </div>

      <div
        data-grid
        onDragOver={handleDragOver}
        onDragEnter={handleCanvasDragEnter}
        onDragLeave={handleCanvasDragLeave}
        onDrop={handleCanvasDrop}
        style={{
          ...styles.canvasGrid,
          gridTemplateColumns: `repeat(${gridCols}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${gridRows}, ${CELL_SIZE}px)`,
          width: gridCols * CELL_SIZE + 2,
          height: gridRows * CELL_SIZE + 2,
          outline: isDragOverCanvas ? '3px dashed #B87333' : 'none',
          outlineOffset: 4,
        }}
      >
        {cells}
      </div>

      {hoveredFabric && hoverInfo && (
        <div
          style={{
            ...styles.tooltip,
            left: hoverInfo.x,
            top: hoverInfo.y,
          }}
        >
          <div style={styles.tooltipName}>{hoveredFabric.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: hoveredFabric.colorCode,
                display: 'inline-block',
                border: '1px solid #D7C4A1',
              }}
            />
            <span style={styles.tooltipCode}>{hoveredFabric.colorCode}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes cellPopIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slideUp {
          0% { transform: translateX(-50%) translateY(100%); }
          100% { transform: translateX(-50%) translateY(0); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  canvasWrapper: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    overflow: 'auto',
  },
  dimensionLabel: {
    fontSize: 13,
    color: '#5D4037',
    fontWeight: 500,
    background: '#FFF8F0',
    padding: '6px 16px',
    borderRadius: 20,
    border: '1px solid #D7C4A1',
  },
  canvasGrid: {
    display: 'grid',
    gap: 0,
    background: '#8D6E63',
    border: '1px solid #5D4037',
    borderRadius: 4,
    padding: 1,
    boxShadow: '0 8px 32px rgba(93, 64, 55, 0.15)',
  },
  cell: {
    boxSizing: 'border-box',
    borderRight: '1px solid #8D6E63',
    borderBottom: '1px solid #8D6E63',
    cursor: 'pointer',
    transition: 'opacity 0.1s, background 0.1s',
    transformOrigin: 'center center',
  },
  tooltip: {
    position: 'absolute',
    background: '#5D4037',
    color: '#F5F0E8',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 12,
    pointerEvents: 'none',
    zIndex: 100,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    whiteSpace: 'nowrap',
  },
  tooltipName: {
    fontWeight: 600,
    marginBottom: 4,
  },
  tooltipCode: {
    fontFamily: 'monospace',
    fontSize: 11,
    opacity: 0.9,
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 64,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: '#5D4037',
  },
  emptyText: {
    fontSize: 14,
    color: '#8D6E63',
  },
};

export default DesignCanvas;
