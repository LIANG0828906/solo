import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useMindMapStore } from './store';
import { NodeComponent } from './NodeComponent';
import { ConnectionLine } from './ConnectionLine';
import { MindMapNode } from './types';

interface DragState {
  nodeId: string;
  startX: number;
  startY: number;
  nodeStartX: number;
  nodeStartY: number;
  moved: boolean;
}

interface PanState {
  isPanning: boolean;
  startX: number;
  startY: number;
  offsetStartX: number;
  offsetStartY: number;
}

export const Canvas: React.FC = () => {
  const {
    nodes,
    selectedNodeId,
    scale,
    offsetX,
    offsetY,
    selectNode,
    moveNode,
    setScale,
    setOffset,
    saveSnapshot,
    setHighlightNode,
  } = useMindMapStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [panState, setPanState] = useState<PanState | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [showRestoreAnimation, setShowRestoreAnimation] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            useMindMapStore.getState().redo();
          } else {
            useMindMapStore.getState().undo();
          }
        }
      }
      if (e.key === 'Delete' && selectedNodeId) {
        const node = nodes[selectedNodeId];
        if (node && node.parentId) {
          useMindMapStore.getState().removeNode(selectedNodeId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, nodes]);

  useEffect(() => {
    const store = useMindMapStore;
    const originalRestore = store.getState().restore;
    store.setState({
      restore: (historyId: string) => {
        originalRestore(historyId);
        setShowRestoreAnimation(true);
        setTimeout(() => setShowRestoreAnimation(false), 800);
      },
    });
  }, []);

  const getSvgPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (clientX - rect.left - rect.width / 2 - offsetX) / scale;
      const y = (clientY - rect.top - rect.height / 2 - offsetY) / scale;
      return { x, y };
    },
    [offsetX, offsetY, scale]
  );

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      if (e.button !== 0) return;
      const node = nodes[nodeId];
      if (!node) return;

      const point = getSvgPoint(e.clientX, e.clientY);
      setDragState({
        nodeId,
        startX: point.x,
        startY: point.y,
        nodeStartX: node.x,
        nodeStartY: node.y,
        moved: false,
      });
      setDraggingNodeId(nodeId);
      selectNode(nodeId);
      e.stopPropagation();
    },
    [nodes, getSvgPoint, selectNode]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragState) {
        const point = getSvgPoint(e.clientX, e.clientY);
        const dx = point.x - dragState.startX;
        const dy = point.y - dragState.startY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          const newX = dragState.nodeStartX + dx;
          const newY = dragState.nodeStartY + dy;
          moveNode(dragState.nodeId, newX, newY);
          setDragState((prev) => (prev ? { ...prev, moved: true } : null));
        }
      } else if (panState) {
        const dx = e.clientX - panState.startX;
        const dy = e.clientY - panState.startY;
        setOffset(panState.offsetStartX + dx, panState.offsetStartY + dy);
      }
    },
    [dragState, panState, getSvgPoint, moveNode, setOffset]
  );

  const handleMouseUp = useCallback(() => {
    if (dragState && dragState.moved) {
      saveSnapshot('移动节点');
    }
    setDragState(null);
    setPanState(null);
    setDraggingNodeId(null);
  }, [dragState, saveSnapshot]);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg') {
        selectNode(null);
        setHighlightNode(null);
        if (e.button === 0 || e.button === 1) {
          setPanState({
            isPanning: true,
            startX: e.clientX,
            startY: e.clientY,
            offsetStartX: offsetX,
            offsetStartY: offsetY,
          });
        }
      }
    },
    [selectNode, setHighlightNode, offsetX, offsetY]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(scale + delta);
    },
    [scale, setScale]
  );

  const nodesList = Object.values(nodes);
  const connectionLines: { parent: MindMapNode; child: MindMapNode }[] = [];
  nodesList.forEach((node) => {
    if (node.parentId && nodes[node.parentId]) {
      connectionLines.push({ parent: nodes[node.parentId], child: node });
    }
  });

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        backgroundColor: '#1a1a2e',
        overflow: 'hidden',
        cursor: panState ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
          backgroundPosition: `${offsetX}px ${offsetY}px`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        <svg
          style={{
            position: 'absolute',
            left: '-5000px',
            top: '-5000px',
            width: '10000px',
            height: '10000px',
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          <g transform="translate(5000, 5000)">
            {connectionLines.map(({ parent, child }) => (
              <ConnectionLine key={`${parent.id}-${child.id}`} parent={parent} child={child} />
            ))}
          </g>
        </svg>

        {nodesList.map((node) => (
          <NodeComponent
            key={node.id}
            node={node}
            isDragging={draggingNodeId === node.id}
            onMouseDown={handleNodeMouseDown}
          />
        ))}
      </div>

      {showRestoreAnimation && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 10000,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: '3px solid #e94560',
              animation: 'restoreRipple 0.8s ease-out forwards',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#e94560',
              fontSize: 14,
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              animation: 'restoreText 0.8s ease-out forwards',
            }}
          >
            版本已恢复
          </div>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          backgroundColor: '#16213e',
          borderRadius: 6,
          padding: '6px 12px',
          color: 'white',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <button
          onClick={() => setScale(scale - 0.1)}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 16 }}
        >
          −
        </button>
        <span style={{ minWidth: 40, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
        <button
          onClick={() => setScale(scale + 0.1)}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 16 }}
        >
          +
        </button>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
        <button
          onClick={() => {
            setScale(1);
            setOffset(0, 0);
          }}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 12 }}
        >
          重置
        </button>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(22, 33, 62, 0.9)',
          borderRadius: 6,
          padding: '8px 16px',
          color: 'rgba(255,255,255,0.7)',
          fontSize: 12,
          backdropFilter: 'blur(4px)',
        }}
      >
        双击节点编辑文字 · 拖拽节点移动位置 · 滚轮缩放画布 · Ctrl+Z 撤销
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-5px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; r: 36; }
          50% { opacity: 0.5; r: 42; }
        }
        @keyframes restoreRipple {
          0% { width: 20px; height: 20px; opacity: 1; margin-left: 0; margin-top: 0; }
          100% { width: 300px; height: 300px; opacity: 0; margin-left: -140px; margin-top: -140px; }
        }
        @keyframes restoreText {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
    </div>
  );
};
