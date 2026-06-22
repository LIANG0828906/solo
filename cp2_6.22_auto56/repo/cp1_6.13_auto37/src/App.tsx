import { useState, useEffect, useRef, useCallback } from 'react';
import { DataModel, type Layer, type Transform, type Point, type PathBounds } from './modules/DataModel';
import { StrokeToPath } from './modules/StrokeToPath';
import { SVGEditor } from './modules/SVGEditor';
import { CanvasCapture } from './modules/CanvasCapture';
import { LayerPanel } from './modules/LayerPanel';
import { ExportTool } from './modules/ExportTool';
import { ExportModal } from './modules/ExportModal';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const SIMPLIFY_THRESHOLD = 2;

function App() {
  const dataModelRef = useRef<DataModel>(new DataModel(CANVAS_WIDTH, CANVAS_HEIGHT));
  const exportToolRef = useRef<ExportTool>(new ExportTool(dataModelRef.current));
  const strokeProcessorRef = useRef<StrokeToPath>(new StrokeToPath(SIMPLIFY_THRESHOLD, 0.25));

  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [previewPath, setPreviewPath] = useState<string>('');
  const [currentPointCount, setCurrentPointCount] = useState(0);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(false);

  const updateState = useCallback(() => {
    const dm = dataModelRef.current;
    setLayers(dm.getLayers());
    setSelectedIds(dm.getSelectedLayerIds());
    setCanUndo(dm.canUndo());
    setCanRedo(dm.canRedo());
  }, []);

  useEffect(() => {
    const dm = dataModelRef.current;
    const unsubscribe = dm.subscribe(updateState);
    updateState();
    return unsubscribe;
  }, [updateState]);

  const handleStrokeComplete = useCallback((data: {
    points: Point[];
    pathString: string;
    bounds: PathBounds;
  }) => {
    const dm = dataModelRef.current;
    dm.addLayerFromPathString(data.pathString, data.points, data.bounds, {
      color: '#4a9eff',
      strokeWidth: 2
    });
    setPreviewPath('');
    setCurrentPointCount(0);
  }, []);

  const handleStrokeProgress = useCallback((path: string, count: number) => {
    setPreviewPath(path);
    setCurrentPointCount(count);
  }, []);

  const handleSelect = useCallback((id: string, additive: boolean) => {
    const dm = dataModelRef.current;
    if (additive) {
      dm.toggleLayerSelection(id);
    } else {
      dm.selectLayer(id, 'single');
    }
  }, []);

  const handleClearSelection = useCallback(() => {
    dataModelRef.current.clearSelection();
  }, []);

  const handleTransformUpdate = useCallback((id: string, transform: Partial<Transform>) => {
    dataModelRef.current.updateLayerTransform(id, transform);
  }, []);

  const handleTransformCommit = useCallback((ids: string[]) => {
    dataModelRef.current.commitLayersTransform(ids);
  }, []);

  const handleDelete = useCallback((id: string) => {
    dataModelRef.current.deleteLayer(id);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    dataModelRef.current.deleteSelectedLayers();
  }, []);

  const handleRename = useCallback((id: string, name: string) => {
    dataModelRef.current.renameLayer(id, name);
  }, []);

  const handleReorder = useCallback((id: string, newZIndex: number) => {
    dataModelRef.current.reorderLayer(id, newZIndex);
  }, []);

  const handleToggleVisibility = useCallback((id: string) => {
    dataModelRef.current.toggleLayerVisibility(id);
  }, []);

  const handleToggleLock = useCallback((id: string) => {
    dataModelRef.current.toggleLayerLock(id);
  }, []);

  const handleDuplicate = useCallback((id: string) => {
    dataModelRef.current.duplicateLayer(id);
  }, []);

  const handleMoveUp = useCallback((id: string) => {
    dataModelRef.current.moveLayerUp(id);
  }, []);

  const handleMoveDown = useCallback((id: string) => {
    dataModelRef.current.moveLayerDown(id);
  }, []);

  const handleMergeSelected = useCallback(() => {
    dataModelRef.current.mergeSelectedLayers();
  }, []);

  const handleUndo = useCallback(() => {
    dataModelRef.current.undo();
  }, []);

  const handleRedo = useCallback(() => {
    dataModelRef.current.redo();
  }, []);

  const handleClearAll = useCallback(() => {
    if (layers.length === 0) return;
    if (confirm('确定要清空所有路径吗？此操作可撤销。')) {
      dataModelRef.current.clearAll();
    }
  }, [layers.length]);

  const handleExportSVG = useCallback(() => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    exportToolRef.current.exportSVG(`sketch-to-shape-${dateStr}.svg`);
  }, []);

  const handleExportPNG = useCallback(() => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    exportToolRef.current.exportPNG(`sketch-to-shape-${dateStr}.png`, 2);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        dataModelRef.current.selectAll();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setExportModalVisible(true);
      } else if (e.key === 'Shift') {
        setMaintainAspectRatio(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setMaintainAspectRatio(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleUndo, handleRedo, handleDeleteSelected, selectedIds.length]);

  const totalPoints = layers.reduce((sum, l) => sum + l.path.points.length, 0);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        background: '#1e1e2e',
        color: '#e0e0e0',
        overflow: 'hidden'
      }}
    >
      {/* 顶部工具栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: '#252538',
          borderBottom: '1px solid #3d3d5c',
          flexShrink: 0,
          height: 48
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>
            ✏️ SketchToShape
          </span>
          <span style={{ fontSize: 11, color: '#666', marginLeft: 4 }}>
            简笔图形转矢量工具
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ToolbarButton onClick={handleUndo} disabled={!canUndo} title="撤销 (Ctrl+Z)">
            ↶ 撤销
          </ToolbarButton>
          <ToolbarButton onClick={handleRedo} disabled={!canRedo} title="重做 (Ctrl+Shift+Z)">
            ↷ 重做
          </ToolbarButton>
          <div style={{ width: 1, height: 20, background: '#3d3d5c', margin: '0 4px' }} />
          <ToolbarButton onClick={handleClearAll} disabled={layers.length === 0} title="清空画布" danger>
            🗑 清空
          </ToolbarButton>
          <div style={{ width: 1, height: 20, background: '#3d3d5c', margin: '0 4px' }} />
          <ToolbarButton
            onClick={() => setExportModalVisible(true)}
            disabled={layers.length === 0}
            title="导出 (Ctrl+E)"
            primary
          >
            ⬇ 导出
          </ToolbarButton>
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
        {/* 左侧画布区 */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* SVG编辑器（在下层） */}
          <SVGEditor
            layers={layers}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onClearSelection={handleClearSelection}
            onTransformUpdate={handleTransformUpdate}
            onTransformCommit={handleTransformCommit}
            previewPath={previewPath}
            maintainAspectRatio={maintainAspectRatio}
          />

          {/* Canvas捕捉（在上层透明） */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}>
            <CanvasCapture
              onStrokeComplete={handleStrokeComplete}
              onStrokeProgress={handleStrokeProgress}
              disabled={false}
              strokeColor="#4a9eff"
              strokeWidth={2}
            />
          </div>

          {/* 右下角实时数据 */}
          <div
            style={{
              position: 'absolute',
              right: panelCollapsed ? 60 : 20,
              bottom: 12,
              fontSize: 11,
              color: '#666',
              lineHeight: 1.6,
              textAlign: 'right',
              pointerEvents: 'none',
              userSelect: 'none',
              transition: 'right 0.3s ease-in-out'
            }}
          >
            {currentPointCount > 0 && (
              <div style={{ color: '#4a9eff' }}>
                当前笔迹: {currentPointCount} 点
              </div>
            )}
            <div>路径总数: {layers.length}</div>
            <div>总点数: {totalPoints}</div>
            {selectedIds.length > 0 && (
              <div style={{ color: '#ff8c00' }}>
                已选中: {selectedIds.length} 个
              </div>
            )}
          </div>

          {/* 左下角提示 */}
          <div
            style={{
              position: 'absolute',
              left: 12,
              bottom: 12,
              fontSize: 11,
              color: '#555',
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            拖拽绘制 | Shift 等比缩放 | Ctrl+Z 撤销 | Del 删除
          </div>
        </div>

        {/* 右侧图层面板 */}
        <LayerPanel
          layers={layers}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onDelete={handleDelete}
          onRename={handleRename}
          onReorder={handleReorder}
          onToggleVisibility={handleToggleVisibility}
          onToggleLock={handleToggleLock}
          onDuplicate={handleDuplicate}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onMergeSelected={handleMergeSelected}
          onDeleteSelected={handleDeleteSelected}
          collapsed={panelCollapsed}
          onToggleCollapse={() => setPanelCollapsed(!panelCollapsed)}
        />
      </div>

      {/* 导出弹窗 */}
      <ExportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        onExportSVG={handleExportSVG}
        onExportPNG={handleExportPNG}
        layerCount={layers.length}
      />
    </div>
  );
}

function ToolbarButton({
  children, onClick, disabled, title, danger, primary
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  danger?: boolean;
  primary?: boolean;
}) {
  const baseColor = danger ? '#e05555' : primary ? '#4a9eff' : '#ccc';
  const hoverBg = danger
    ? 'rgba(224, 85, 85, 0.15)'
    : primary
      ? 'rgba(74, 158, 255, 0.15)'
      : 'rgba(255, 255, 255, 0.08)';
  const hoverColor = danger ? '#ff6666' : primary ? '#6ab0ff' : '#fff';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: primary ? 'rgba(74, 158, 255, 0.1)' : 'transparent',
        border: `1px solid ${primary ? 'rgba(74, 158, 255, 0.3)' : 'transparent'}`,
        color: disabled ? '#555' : baseColor,
        padding: '6px 12px',
        borderRadius: 5,
        fontSize: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.1s, color 0.1s, border-color 0.1s',
        whiteSpace: 'nowrap',
        fontWeight: primary ? 500 : 400
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = hoverBg;
          e.currentTarget.style.color = hoverColor;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = primary ? 'rgba(74, 158, 255, 0.1)' : 'transparent';
          e.currentTarget.style.color = baseColor;
        }
      }}
    >
      {children}
    </button>
  );
}

export default App;
