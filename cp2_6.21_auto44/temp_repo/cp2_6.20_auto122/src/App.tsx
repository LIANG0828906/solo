import { useEffect, useRef, useState, useCallback } from 'react';
import {
  useGameStore,
  type TerrainTheme,
  type ObjectType,
  CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
} from './store/gameStore';
import { GridRenderer } from './canvas/GridRenderer';
import { PhysicsEngine } from './physics/PhysicsEngine';
import { exportLevel, importLevel } from './utils/serializer';

const TERRAIN_THEMES: { value: TerrainTheme; label: string; color: string }[] = [
  { value: 'grass', label: '绿色草地', color: '#4ade80' },
  { value: 'stone', label: '灰色石砖', color: '#9ca3af' },
  { value: 'dirt', label: '棕色泥土', color: '#92400e' },
];

const OBJECT_TOOLS: { value: ObjectType; label: string; color: string; icon: string }[] = [
  { value: 'spawn', label: '出生点', color: '#3b82f6', icon: 'P' },
  { value: 'spike', label: '尖刺陷阱', color: '#ef4444', icon: '▲' },
  { value: 'movingPlatform', label: '移动平台', color: '#f97316', icon: '↔' },
  { value: 'coin', label: '金币', color: '#fbbf24', icon: '●' },
];

const TERRAIN_TOOLS = new Set(['grass', 'stone', 'dirt']);

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GridRenderer | null>(null);
  const physicsRef = useRef<PhysicsEngine | null>(null);
  const animationRef = useRef<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [draggingObject, setDraggingObject] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);

  const {
    grid,
    objects,
    selectedTool,
    selectedObjectId,
    isPlaying,
    player,
    exportedJson,
    hoveredCell,
    toggleCell,
    fillRow,
    clearColumn,
    setSelectedTool,
    placeObject,
    selectObject,
    moveObject,
    deleteObject,
    setPlaying,
    updatePlayer,
    setExportedJson,
    setHoveredCell,
    setGrid,
    setObjects,
  } = useGameStore();

  useEffect(() => {
    if (!canvasRef.current) return;
    rendererRef.current = new GridRenderer(canvasRef.current);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (physicsRef.current) {
        physicsRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!rendererRef.current) return;

    const renderLoop = (time: number) => {
      if (rendererRef.current) {
        rendererRef.current.drawFrame(
          grid,
          objects,
          selectedObjectId,
          hoveredCell,
          isPlaying,
          player,
          time
        );
      }
      animationRef.current = requestAnimationFrame(renderLoop);
    };

    animationRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [grid, objects, selectedObjectId, hoveredCell, isPlaying, player]);

  useEffect(() => {
    if (isPlaying) {
      if (!physicsRef.current) {
        physicsRef.current = new PhysicsEngine(player, updatePlayer);
      }
      physicsRef.current.setLevel(grid, objects);
      physicsRef.current.setPlayer(player);
      physicsRef.current.start();

      const handleCoinCollect = (e: Event) => {
        const customEvent = e as CustomEvent<{ ids: string[] }>;
        setObjects(objects.filter((o) => !customEvent.detail.ids.includes(o.id)));
        if (physicsRef.current) {
          physicsRef.current.setLevel(grid, physicsRef.current.getObjects());
        }
      };

      window.addEventListener('coins-collected', handleCoinCollect);
      return () => {
        window.removeEventListener('coins-collected', handleCoinCollect);
        if (physicsRef.current) {
          physicsRef.current.stop();
        }
      };
    } else {
      if (physicsRef.current) {
        physicsRef.current.stop();
      }
    }
  }, [isPlaying]);

  const getGridPosition = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
      const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
      if (x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS) {
        return { x, y };
      }
      return null;
    },
    []
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPlaying) return;
      const pos = getGridPosition(e);
      setHoveredCell(pos);

      if (draggingObject && pos && dragStartPos) {
        const dx = pos.x - dragStartPos.x;
        const dy = pos.y - dragStartPos.y;
        if (Math.abs(dx) >= 1 || Math.abs(dy) >= 1) {
          const obj = objects.find((o) => o.id === draggingObject);
          if (obj) {
            const newX = obj.gridX + dx;
            const newY = obj.gridY + dy;
            moveObject(draggingObject, newX, newY);
            setDragStartPos({ x: pos.x, y: pos.y });
          }
        }
      }
    },
    [isPlaying, getGridPosition, draggingObject, dragStartPos, objects, moveObject, setHoveredCell]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPlaying) return;
      const pos = getGridPosition(e);
      if (!pos) return;

      const clickedObject = objects.find(
        (obj) => obj.gridX === pos.x && obj.gridY === pos.y
      );

      if (clickedObject && !selectedTool) {
        selectObject(clickedObject.id);
        return;
      }

      if (selectedTool && TERRAIN_TOOLS.has(selectedTool)) {
        toggleCell(pos.x, pos.y, selectedTool as TerrainTheme);
      } else if (selectedTool && !TERRAIN_TOOLS.has(selectedTool)) {
        placeObject(selectedTool as ObjectType, pos.x, pos.y);
      } else {
        selectObject(null);
      }
    },
    [isPlaying, getGridPosition, objects, selectedTool, toggleCell, placeObject, selectObject]
  );

  const handleCanvasContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (isPlaying) return;
      const pos = getGridPosition(e);
      if (!pos) return;

      const clickedObject = objects.find(
        (obj) => obj.gridX === pos.x && obj.gridY === pos.y
      );
      if (clickedObject) {
        deleteObject(clickedObject.id);
      }
    },
    [isPlaying, getGridPosition, objects, deleteObject]
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPlaying) return;
      if (e.button !== 0) return;
      const pos = getGridPosition(e);
      if (!pos) return;

      const clickedObject = objects.find(
        (obj) => obj.gridX === pos.x && obj.gridY === pos.y
      );
      if (clickedObject) {
        setDraggingObject(clickedObject.id);
        setDragStartPos(pos);
        selectObject(clickedObject.id);
      }
    },
    [isPlaying, getGridPosition, objects, selectObject]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setDraggingObject(null);
    setDragStartPos(null);
  }, []);

  const handleCanvasMouseLeave = useCallback(() => {
    setHoveredCell(null);
    setDraggingObject(null);
    setDragStartPos(null);
  }, [setHoveredCell]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPlaying) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const pos = hoveredCell;
      if (!pos) return;

      if (e.key.toLowerCase() === 'g' && selectedTool && TERRAIN_TOOLS.has(selectedTool)) {
        fillRow(pos.y, selectedTool as TerrainTheme);
      } else if (e.key.toLowerCase() === 'd') {
        clearColumn(pos.x);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjectId) {
          deleteObject(selectedObjectId);
        }
      } else if (e.key === 'Escape') {
        setSelectedTool(null);
        selectObject(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, hoveredCell, selectedTool, selectedObjectId, fillRow, clearColumn, deleteObject, setSelectedTool, selectObject]);

  const handleExport = useCallback(() => {
    const json = exportLevel(grid, objects);
    setExportedJson(json);
  }, [grid, objects, setExportedJson]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportedJson);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [exportedJson]);

  const handleImport = useCallback(() => {
    const data = importLevel(importText);
    if (data) {
      setGrid(data.grid);
      setObjects(data.objects);
      setShowImportModal(false);
      setImportText('');
      selectObject(null);
      setSelectedTool(null);
    } else {
      alert('JSON格式无效，请检查数据');
    }
  }, [importText, setGrid, setObjects, selectObject, setSelectedTool]);

  const handlePlayToggle = useCallback(() => {
    if (!isPlaying) {
      const hasSpawn = objects.some((o) => o.type === 'spawn');
      if (!hasSpawn) {
        alert('请先放置玩家出生点');
        return;
      }
    }
    setPlaying(!isPlaying);
  }, [isPlaying, objects, setPlaying]);

  return (
    <div style={styles.appContainer}>
      <div style={styles.toolPanel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>关卡编辑器</h2>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>地形主题</h3>
          <div style={styles.toolGrid}>
            {TERRAIN_THEMES.map((theme) => (
              <button
                key={theme.value}
                onClick={() => setSelectedTool(selectedTool === theme.value ? null : theme.value)}
                style={{
                  ...styles.toolButton,
                  ...(selectedTool === theme.value ? styles.toolButtonActive : {}),
                  borderColor: theme.color,
                }}
              >
                <div style={{ ...styles.toolIcon, backgroundColor: theme.color }} />
                <span style={styles.toolLabel}>{theme.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>物件工具</h3>
          <div style={styles.toolGrid}>
            {OBJECT_TOOLS.map((tool) => (
              <button
                key={tool.value}
                onClick={() => setSelectedTool(selectedTool === tool.value ? null : tool.value)}
                style={{
                  ...styles.toolButton,
                  ...(selectedTool === tool.value ? styles.toolButtonActive : {}),
                  borderColor: tool.color,
                }}
              >
                <div
                  style={{
                    ...styles.toolIcon,
                    backgroundColor: tool.color,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                  }}
                >
                  {tool.icon}
                </div>
                <span style={styles.toolLabel}>{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>快捷键</h3>
          <div style={styles.shortcutList}>
            <div style={styles.shortcutItem}>
              <kbd style={styles.kbd}>G</kbd>
              <span>填充整行</span>
            </div>
            <div style={styles.shortcutItem}>
              <kbd style={styles.kbd}>D</kbd>
              <span>清空整列</span>
            </div>
            <div style={styles.shortcutItem}>
              <kbd style={styles.kbd}>右键</kbd>
              <span>删除物件</span>
            </div>
            <div style={styles.shortcutItem}>
              <kbd style={styles.kbd}>Esc</kbd>
              <span>取消选择</span>
            </div>
          </div>
        </div>

        {selectedObjectId && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>选中物件</h3>
            <div style={styles.selectedInfo}>
              <span>
                {objects.find((o) => o.id === selectedObjectId)?.type}
              </span>
              <button
                onClick={() => deleteObject(selectedObjectId)}
                style={styles.deleteButton}
              >
                删除
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={styles.mainArea}>
        <div style={styles.actionBar}>
          <button
            onClick={handlePlayToggle}
            style={{
              ...styles.playButton,
              ...(isPlaying ? styles.stopButton : styles.startButton),
            }}
          >
            {isPlaying ? '■' : '▶'}
          </button>

          <button onClick={handleExport} style={styles.exportButton}>
            导出 JSON
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            style={styles.importButton}
          >
            导入 JSON
          </button>
        </div>

        <div style={styles.canvasContainer}>
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseDown={handleCanvasMouseDown}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseLeave}
            onContextMenu={handleCanvasContextMenu}
            style={styles.canvas}
          />
        </div>

        {isPlaying && (
          <div style={styles.playingHint}>
            <kbd style={styles.kbd}>WASD</kbd> 或 <kbd style={styles.kbd}>方向键</kbd> 移动 |{' '}
            <kbd style={styles.kbd}>空格</kbd> 跳跃
          </div>
        )}
      </div>

      <div style={styles.previewPanel}>
        <div style={styles.panelHeader}>
          <h3 style={styles.panelTitle}>JSON 预览</h3>
          {exportedJson && (
            <button onClick={handleCopy} style={styles.copyButton}>
              {copySuccess ? '已复制 ✓' : '复制'}
            </button>
          )}
        </div>
        <div style={styles.jsonContainer}>
          <pre style={styles.jsonText}>
            {exportedJson || '点击"导出 JSON"按钮生成关卡数据'}
          </pre>
        </div>
      </div>

      {showImportModal && (
        <div style={styles.modalOverlay} onClick={() => setShowImportModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>导入关卡</h3>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="粘贴 JSON 数据..."
              style={styles.textarea}
            />
            <div style={styles.modalButtons}>
              <button
                onClick={() => setShowImportModal(false)}
                style={styles.cancelButton}
              >
                取消
              </button>
              <button onClick={handleImport} style={styles.confirmButton}>
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: 'flex',
    width: '100%',
    height: '100%',
    backgroundColor: '#0f0f0f',
    overflow: 'hidden',
  },
  toolPanel: {
    width: '280px',
    backgroundColor: '#2d2d2d',
    borderRadius: '8px',
    margin: '12px',
    padding: '16px',
    overflowY: 'auto',
    flexShrink: 0,
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #3a3a3a',
  },
  panelTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  toolGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  toolButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 8px',
    backgroundColor: '#1f1f1f',
    borderRadius: '6px',
    border: '2px solid transparent',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  toolButtonActive: {
    backgroundColor: '#3a3a3a',
  },
  toolIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '4px',
  },
  toolLabel: {
    fontSize: '11px',
    color: '#d1d5db',
    textAlign: 'center',
  },
  shortcutList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  shortcutItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '12px',
    color: '#9ca3af',
  },
  kbd: {
    backgroundColor: '#1f1f1f',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#e5e7eb',
    border: '1px solid #3a3a3a',
    minWidth: '24px',
    textAlign: 'center',
  },
  selectedInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
    padding: '10px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#e5e7eb',
    textTransform: 'capitalize',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    transition: 'filter 0.2s',
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: '12px',
    minWidth: '600px',
  },
  actionBar: {
    position: 'absolute',
    top: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '12px',
    padding: '12px 20px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(6px)',
    borderRadius: '12px',
    zIndex: 10,
  },
  playButton: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ffffff',
    transition: 'all 0.2s ease',
  },
  startButton: {
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
  },
  stopButton: {
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
  },
  exportButton: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    padding: '0 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'filter 0.2s',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },
  importButton: {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    padding: '0 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'filter 0.2s',
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
  },
  canvasContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  },
  canvas: {
    display: 'block',
    cursor: 'crosshair',
    borderRadius: '4px',
  },
  playingHint: {
    position: 'absolute',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#9ca3af',
    animation: 'fadeIn 0.3s ease',
  },
  previewPanel: {
    width: '320px',
    backgroundColor: '#2d2d2d',
    borderRadius: '8px',
    margin: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  copyButton: {
    backgroundColor: '#374151',
    color: '#e5e7eb',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  jsonContainer: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: '#1a1a1a',
    borderRadius: '6px',
    padding: '12px',
    minHeight: '200px',
  },
  jsonText: {
    fontSize: '11px',
    lineHeight: '1.6',
    color: '#9ca3af',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    fontFamily: "'JetBrains Mono', monospace",
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
    padding: '24px',
    width: '500px',
    maxWidth: '90vw',
    animation: 'scaleIn 0.2s ease',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '16px',
  },
  textarea: {
    width: '100%',
    height: '200px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #3a3a3a',
    borderRadius: '8px',
    padding: '12px',
    color: '#e5e7eb',
    fontSize: '12px',
    fontFamily: "'JetBrains Mono', monospace",
    resize: 'none',
    marginBottom: '16px',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelButton: {
    backgroundColor: '#374151',
    color: '#e5e7eb',
    padding: '8px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'filter 0.2s',
  },
  confirmButton: {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    padding: '8px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'filter 0.2s',
  },
};
