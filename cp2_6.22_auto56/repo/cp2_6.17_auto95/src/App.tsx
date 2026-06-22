import { useEffect, useState, useCallback, useMemo } from 'react';
import { usePaletteStore } from './store/paletteStore';
import { ColorPicker } from './components/ColorPicker';
import { PaletteCard } from './components/PaletteCard';
import { PreviewPanel } from './components/PreviewPanel';
import { ExportModal } from './components/ExportModal';
import { ColorBlockEditor } from './components/ColorBlockEditor';
import { Menu, Plus, Download, History } from 'lucide-react';
import type { VersionSnapshot } from './types';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

function useSelectedPalette() {
  return usePaletteStore(
    useCallback((state) => {
      return state.palettes.find((p) => p.id === state.selectedPaletteId) || null;
    }, [])
  );
}

function App() {
  const {
    palettes,
    selectedPaletteId,
    versions,
    isSidebarOpen,
    isExportModalOpen,
    init,
    createPalette,
    selectPalette,
    renamePalette,
    deletePalette,
    addColor,
    updateColor,
    updateColorLabel,
    removeColor,
    reorderColors,
    restoreVersion,
    setSidebarOpen,
    setExportModalOpen,
  } = usePaletteStore();

  const selectedPalette = useSelectedPalette();

  const isMobile = useMediaQuery('(max-width: 768px)');
  const [newColor, setNewColor] = useState('#4A90D9');
  const [draggedColorIndex, setDraggedColorIndex] = useState<number | null>(null);
  const [draggedPaletteId, setDraggedPaletteId] = useState<string | null>(null);
  const [restoredVersionId, setRestoredVersionId] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile, setSidebarOpen]);

  const currentVersions = useMemo(() => {
    return selectedPaletteId ? versions[selectedPaletteId] || [] : [];
  }, [selectedPaletteId, versions]);

  const handleCreatePalette = useCallback(async () => {
    const name = prompt('输入新色板名称:', '未命名色板');
    if (name?.trim()) {
      await createPalette(name.trim());
    }
  }, [createPalette]);

  const handleColorChange = useCallback(
    (hex: string) => {
      setNewColor(hex);
    },
    []
  );

  const handleAddColor = useCallback(async () => {
    if (selectedPaletteId) {
      await addColor(selectedPaletteId, newColor);
    }
  }, [selectedPaletteId, newColor, addColor]);

  const handleUpdateColor = useCallback(
    async (colorId: string, hex: string) => {
      if (selectedPaletteId) {
        await updateColor(selectedPaletteId, colorId, hex);
      }
    },
    [selectedPaletteId, updateColor]
  );

  const handleUpdateLabel = useCallback(
    async (colorId: string, label: string) => {
      if (selectedPaletteId) {
        await updateColorLabel(selectedPaletteId, colorId, label);
      }
    },
    [selectedPaletteId, updateColorLabel]
  );

  const handleRemoveColor = useCallback(
    async (colorId: string) => {
      if (selectedPaletteId && confirm('确定要删除这个颜色吗？')) {
        await removeColor(selectedPaletteId, colorId);
      }
    },
    [selectedPaletteId, removeColor]
  );

  const handleColorDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      setDraggedColorIndex(index);
      e.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  const handleColorDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleColorDrop = useCallback(
    async (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      if (draggedColorIndex !== null && draggedColorIndex !== toIndex && selectedPaletteId) {
        await reorderColors(selectedPaletteId, draggedColorIndex, toIndex);
      }
      setDraggedColorIndex(null);
    },
    [draggedColorIndex, selectedPaletteId, reorderColors]
  );

  const handlePaletteDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      setDraggedPaletteId(id);
      e.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  const handlePaletteDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handlePaletteDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (draggedPaletteId && draggedPaletteId !== targetId) {
        const draggedIndex = palettes.findIndex((p) => p.id === draggedPaletteId);
        const targetIndex = palettes.findIndex((p) => p.id === targetId);
        if (draggedIndex >= 0 && targetIndex >= 0) {
          const newPalettes = [...palettes];
          const [removed] = newPalettes.splice(draggedIndex, 1);
          newPalettes.splice(targetIndex, 0, removed);
          usePaletteStore.setState({ palettes: newPalettes });
        }
      }
      setDraggedPaletteId(null);
    },
    [draggedPaletteId, palettes]
  );

  const handleRestoreVersion = useCallback(
    async (versionId: string) => {
      if (selectedPaletteId && confirm('确定要恢复到此版本吗？当前颜色将被替换。')) {
        await restoreVersion(selectedPaletteId, versionId);
        setRestoredVersionId(versionId);
        setTimeout(() => setRestoredVersionId(null), 300);
      }
    },
    [selectedPaletteId, restoreVersion]
  );

  const formatVersionTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const selectedColorsLength = selectedPalette?.colors.length || 0;

  return (
    <div className="app-container">
      <button
        className="hamburger-btn"
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle menu"
      >
        <Menu size={24} color="#333333" />
      </button>

      {isMobile && (
        <div
          className={`sidebar-backdrop ${isSidebarOpen ? 'visible' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">PaletteSync</h1>
          <button className="new-palette-btn" onClick={handleCreatePalette}>
            <Plus size={18} />
            新建色板
          </button>
        </div>
        <div className="sidebar-content">
          <div className="palette-grid">
            {palettes.map((palette) => (
              <PaletteCard
                key={palette.id}
                palette={palette}
                isSelected={palette.id === selectedPaletteId}
                onSelect={selectPalette}
                onRename={renamePalette}
                onDelete={deletePalette}
                onDragStart={handlePaletteDragStart}
                onDragOver={handlePaletteDragOver}
                onDrop={handlePaletteDrop}
              />
            ))}
          </div>
        </div>
      </aside>

      {selectedPaletteId && (
        <aside className="version-sidebar">
          <div className="version-sidebar-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} />
              <h3 className="version-sidebar-title">版本历史</h3>
            </div>
          </div>
          <div className="version-list">
            {currentVersions.length > 0 ? (
              currentVersions.map((version: VersionSnapshot) => (
                <div
                  key={version.id}
                  className={`version-item ${restoredVersionId === version.id ? 'fade-in' : ''}`}
                  onClick={() => handleRestoreVersion(version.id)}
                  title={`恢复到 ${version.colors.length} 种颜色`}
                >
                  <span className="version-dot" />
                  <span>{formatVersionTime(version.timestamp)}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '11px' }}>
                    {version.colors.length} 色
                  </span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '13px', color: '#999', textAlign: 'center', padding: '20px 0' }}>
                暂无历史版本
                <br />
                <span style={{ fontSize: '11px' }}>添加或删除颜色时自动保存</span>
              </div>
            )}
          </div>
        </aside>
      )}

      <main className="main-editor">
        {selectedPalette ? (
          <>
            <div className="editor-header">
              <h2 className="editor-title">{selectedPalette.name}</h2>
              <p className="editor-subtitle">
                {selectedColorsLength} 种颜色 · 更新于{' '}
                {new Date(selectedPalette.updatedAt).toLocaleString('zh-CN')}
              </p>
            </div>

            <div className="editor-content">
              <div className="color-picker-section">
                <h3 className="section-title">添加颜色</h3>
                <ColorPicker onColorChange={handleColorChange} initialColor={newColor} />
                <button
                  className="add-color-btn"
                  onClick={handleAddColor}
                  style={{ marginTop: '16px' }}
                >
                  <Plus size={18} />
                  添加到色板
                </button>
              </div>

              {selectedColorsLength > 0 && (
                <div className="colors-section">
                  <h3 className="section-title">颜色块（可拖拽排序）</h3>
                  <div className="colors-grid">
                    {selectedPalette.colors.map((color, index) => (
                      <ColorBlockEditor
                        key={color.id}
                        color={color}
                        index={index}
                        onUpdateColor={handleUpdateColor}
                        onUpdateLabel={handleUpdateLabel}
                        onRemove={handleRemoveColor}
                        onDragStart={handleColorDragStart}
                        onDragOver={handleColorDragOver}
                        onDrop={handleColorDrop}
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedColorsLength > 0 && (
                <div className="export-section">
                  <button
                    className="export-btn"
                    onClick={() => setExportModalOpen(true)}
                  >
                    <Download size={18} />
                    导出代码
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="editor-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="empty-state">
              <Plus size={48} className="empty-icon" />
              <p>创建或选择一个色板开始</p>
              <span className="empty-hint">点击左侧 "新建色板" 按钮</span>
            </div>
          </div>
        )}
      </main>

      <PreviewPanel palette={selectedPalette} />

      {isExportModalOpen && (
        <ExportModal
          palette={selectedPalette}
          onClose={() => setExportModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
