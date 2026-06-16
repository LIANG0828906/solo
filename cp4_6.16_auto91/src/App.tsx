import React, { useEffect, useRef, useState, useCallback } from 'react';
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { CanvasEngine, DrawingOperation } from './stickerCanvas/CanvasEngine';
import { CanvasRenderer, TextEditState } from './stickerCanvas/CanvasRenderer';
import { GalleryManager, StickerData } from './stickerGallery/GalleryManager';
import { GalleryView, COLORS_32, COLOR_NAMES } from './stickerGallery/GalleryView';
import './App.css';

interface AppStore {
  activeTab: 'create' | 'gallery';
  currentTool: 'brush' | 'rect' | 'ellipse' | 'text';
  brushSize: number;
  brushColor: string;
  selectedTextId: string | null;
  selectedTextOp: DrawingOperation | null;
  editingText: TextEditState | null;
  showSaveDialog: boolean;
  newStickerId: string | null;
  setActiveTab: (tab: 'create' | 'gallery') => void;
  setCurrentTool: (tool: 'brush' | 'rect' | 'ellipse' | 'text') => void;
  setBrushSize: (size: number) => void;
  setBrushColor: (color: string) => void;
  setSelectedText: (id: string | null, op?: DrawingOperation | null) => void;
  setEditingText: (state: TextEditState | null) => void;
  setShowSaveDialog: (show: boolean) => void;
  setNewStickerId: (id: string | null) => void;
}

const useAppStore = create<AppStore>((set) => ({
  activeTab: 'create',
  currentTool: 'brush',
  brushSize: 3,
  brushColor: '#000000',
  selectedTextId: null,
  selectedTextOp: null,
  editingText: null,
  showSaveDialog: false,
  newStickerId: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setCurrentTool: (tool) => set({ currentTool: tool, selectedTextId: null, selectedTextOp: null, editingText: null }),
  setBrushSize: (size) => set({ brushSize: size }),
  setBrushColor: (color) => set({ brushColor: color }),
  setSelectedText: (id, op) => set({ selectedTextId: id, selectedTextOp: op ?? null }),
  setEditingText: (state) => set({ editingText: state }),
  setShowSaveDialog: (show) => set({ showSaveDialog: show }),
  setNewStickerId: (id) => set({ newStickerId: id }),
}));

const galleryManager = new GalleryManager();
const canvasEngine = new CanvasEngine();

const TOOL_LIST: Array<{ key: 'brush' | 'rect' | 'ellipse' | 'text'; icon: string; label: string }> = [
  { key: 'brush', icon: '🖌️', label: '画笔' },
  { key: 'rect', icon: '⬜', label: '矩形' },
  { key: 'ellipse', icon: '⭕', label: '椭圆' },
  { key: 'text', icon: '🔤', label: '文字' },
];

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const newTextRef = useRef<HTMLInputElement>(null);

  const {
    activeTab, currentTool, brushSize, brushColor,
    selectedTextId, selectedTextOp, editingText,
    showSaveDialog, newStickerId,
    setActiveTab, setCurrentTool, setBrushSize, setBrushColor,
    setSelectedText, setEditingText, setShowSaveDialog, setNewStickerId,
  } = useAppStore();

  const [saveName, setSaveName] = useState('');
  const [newTextPos, setNewTextPos] = useState<{ x: number; y: number } | null>(null);
  const [newTextValue, setNewTextValue] = useState('');
  const [editTextValue, setEditTextValue] = useState('');
  const [editFontSize, setEditFontSize] = useState(24);
  const [editFontColor, setEditFontColor] = useState('#000000');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [hoverColor, setHoverColor] = useState<string | null>(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new CanvasRenderer(canvasRef.current, canvasEngine);
    rendererRef.current = renderer;

    renderer.onTextSelected = (id, op) => {
      useAppStore.getState().setSelectedText(id, op);
    };

    renderer.onTextDoubleClick = (state) => {
      useAppStore.getState().setEditingText(state);
    };

    renderer.onTextPlace = (x, y) => {
      const { selectedTextId } = useAppStore.getState();
      if (selectedTextId) {
        useAppStore.getState().setSelectedText(null, null);
        rendererRef.current?.setSelectedTextId(null);
        return;
      }
      setNewTextPos({ x, y });
      setNewTextValue('');
    };

    const container = canvasContainerRef.current;
    if (container) {
      canvasRef.current.width = container.clientWidth;
      canvasRef.current.height = container.clientHeight;
      renderer.forceRender();
    }

    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container || !canvasRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (canvasRef.current && width > 0 && height > 0) {
          canvasRef.current.width = width;
          canvasRef.current.height = height;
          rendererRef.current?.forceRender();
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (rendererRef.current) rendererRef.current.setTool(currentTool);
  }, [currentTool]);

  useEffect(() => {
    if (rendererRef.current) rendererRef.current.setBrushSize(brushSize);
  }, [brushSize]);

  useEffect(() => {
    if (rendererRef.current) rendererRef.current.setBrushColor(brushColor);
  }, [brushColor]);

  useEffect(() => {
    if (rendererRef.current) rendererRef.current.setSelectedTextId(selectedTextId);
  }, [selectedTextId]);

  useEffect(() => {
    if (editingText) {
      setEditTextValue(editingText.text);
      setEditFontSize(editingText.fontSize);
      setEditFontColor(editingText.color);
      rendererRef.current?.setEditingTextId?.(editingText.operationId);
      setTimeout(() => editTextareaRef.current?.focus(), 30);
    } else {
      rendererRef.current?.setEditingTextId?.(null);
    }
  }, [editingText]);

  useEffect(() => {
    if (newTextPos) {
      setTimeout(() => newTextRef.current?.focus(), 30);
    }
  }, [newTextPos]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (editingText) {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelTextEdit();
        }
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          confirmTextEdit();
        }
        return;
      }
      if (newTextPos) {
        if (e.key === 'Escape') {
          setNewTextPos(null);
          setNewTextValue('');
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        canvasEngine.undo();
        rendererRef.current?.forceRender();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        canvasEngine.redo();
        rendererRef.current?.forceRender();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingText, newTextPos]);

  const confirmTextEdit = useCallback(() => {
    if (!editingText) return;
    canvasEngine.updateOperation(editingText.operationId, {
      text: editTextValue,
      fontSize: editFontSize,
      color: editFontColor,
    });
    setEditingText(null);
    rendererRef.current?.forceRender();
  }, [editingText, editTextValue, editFontSize, editFontColor, setEditingText]);

  const cancelTextEdit = useCallback(() => {
    setEditingText(null);
    rendererRef.current?.forceRender();
  }, [setEditingText]);

  const confirmNewText = useCallback(() => {
    if (!newTextPos || !newTextValue.trim()) {
      setNewTextPos(null);
      setNewTextValue('');
      return;
    }
    canvasEngine.addOperation({
      type: 'text',
      x: newTextPos.x,
      y: newTextPos.y,
      text: newTextValue.trim(),
      fontSize: Math.max(12, Math.min(72, brushSize * 3)),
      color: brushColor,
      fontFamily: 'Arial, sans-serif',
    });
    setNewTextPos(null);
    setNewTextValue('');
    rendererRef.current?.forceRender();
  }, [newTextPos, newTextValue, brushColor, brushSize]);

  const handleStartEditFromIcon = useCallback(() => {
    if (!selectedTextOp || selectedTextOp.type !== 'text') return;
    setEditingText({
      operationId: selectedTextOp.id,
      text: selectedTextOp.text || '',
      fontSize: selectedTextOp.fontSize || 24,
      color: selectedTextOp.color || '#000000',
      x: selectedTextOp.x || 0,
      y: selectedTextOp.y || 0,
    });
  }, [selectedTextOp, setEditingText]);

  const handleSave = useCallback(async () => {
    if (!saveName.trim()) return;
    const dataUrl = rendererRef.current?.exportCleanImage?.() || '';
    if (!dataUrl) return;
    const id = uuidv4();
    const sticker: StickerData = {
      id,
      name: saveName.trim(),
      imageData: dataUrl,
      createdAt: Date.now(),
      likes: 0,
      isFavorited: false,
    };
    await galleryManager.saveSticker(sticker);
    setSaveName('');
    setShowSaveDialog(false);
    setNewStickerId(id);
    setActiveTab('gallery');
  }, [saveName, setShowSaveDialog, setNewStickerId, setActiveTab]);

  const handleClearCanvas = useCallback(() => {
    canvasEngine.clear();
    setSelectedText(null);
    setEditingText(null);
    rendererRef.current?.forceRender();
  }, [setSelectedText, setEditingText]);

  const tabIndicatorStyle = {
    transform: activeTab === 'create' ? 'translateX(0)' : 'translateX(100%)',
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-logo">
          <svg className="logo-icon" viewBox="0 0 40 40" width="32" height="32">
            <rect x="2" y="2" width="36" height="36" rx="8" fill="#E8F4FD" stroke="#4A90D9" strokeWidth="2" />
            <path d="M12 28 L16 14 L20 22 L24 10 L28 18" stroke="#4A90D9" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M26 8 L30 8 L30 12" stroke="#FFD700" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M28 6 L32 6 L32 10" stroke="#FFD700" strokeWidth="1.5" fill="none" strokeLinecap="round" transform="rotate(15 30 8)" />
          </svg>
          <span className="logo-text">StickerCanvas</span>
        </div>
        <div className="navbar-tabs">
          <button
            className={`navbar-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            创作
          </button>
          <button
            className={`navbar-tab ${activeTab === 'gallery' ? 'active' : ''}`}
            onClick={() => setActiveTab('gallery')}
          >
            画廊
          </button>
          <div className="tab-indicator" style={tabIndicatorStyle} />
        </div>
      </nav>

      <div className="main-content">
        <div className={`create-view ${activeTab === 'create' ? 'visible' : 'hidden'}`}>
          <aside className={`toolbar ${isMobile ? 'toolbar-mobile' : ''}`}>
            <div className="toolbar-section">
              <div className="toolbar-label">工具</div>
              <div className="tool-buttons">
                {TOOL_LIST.map((t) => (
                  <button
                    key={t.key}
                    className={`tool-btn ${currentTool === t.key ? 'active' : ''}`}
                    onClick={() => setCurrentTool(t.key)}
                    title={t.label}
                  >
                    <span className="tool-icon">{t.icon}</span>
                    <span className="tool-label-text">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="toolbar-section">
              <div className="toolbar-label">笔刷大小: {brushSize}px</div>
              <input
                type="range"
                className="brush-slider"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
              />
            </div>

            <div className="toolbar-section">
              <div className="toolbar-label">颜色</div>
              <div className="color-palette">
                {COLORS_32.map((c) => (
                  <button
                    key={c}
                    className={`color-swatch ${brushColor === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setBrushColor(c)}
                    onMouseEnter={() => setHoverColor(c)}
                    onMouseLeave={() => setHoverColor(null)}
                    title={COLOR_NAMES[c] || c}
                  />
                ))}
              </div>
              {hoverColor && (
                <div className="color-tooltip">
                  <span
                    className="color-tooltip-swatch"
                    style={{ backgroundColor: hoverColor }}
                  />
                  <span className="color-tooltip-name">{COLOR_NAMES[hoverColor] || hoverColor}</span>
                </div>
              )}
            </div>

            <div className="toolbar-section toolbar-actions">
              <button
                className="action-btn"
                onClick={() => { canvasEngine.undo(); rendererRef.current?.forceRender(); }}
                disabled={!canvasEngine.canUndo()}
              >
                ↩ 撤销
              </button>
              <button
                className="action-btn"
                onClick={() => { canvasEngine.redo(); rendererRef.current?.forceRender(); }}
                disabled={!canvasEngine.canRedo()}
              >
                ↪ 重做
              </button>
              <button className="action-btn" onClick={handleClearCanvas}>
                🗑 清空
              </button>
              <button className="action-btn primary" onClick={() => setShowSaveDialog(true)}>
                💾 保存
              </button>
            </div>
          </aside>

          <div className="canvas-area" ref={canvasContainerRef}>
            <canvas ref={canvasRef} className="main-canvas" />

            {newTextPos && (
              <input
                ref={newTextRef}
                className="new-text-input"
                style={{ left: newTextPos.x, top: newTextPos.y - 20 }}
                value={newTextValue}
                onChange={(e) => setNewTextValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmNewText();
                  if (e.key === 'Escape') { setNewTextPos(null); setNewTextValue(''); }
                }}
                onBlur={confirmNewText}
                placeholder="输入文本..."
              />
            )}

            {selectedTextId && !editingText && (
              <button
                className="canvas-edit-icon"
                onClick={handleStartEditFromIcon}
                title="编辑文字"
              >
                ✏️
              </button>
            )}

            {editingText && (
              <>
                <div className="text-edit-backdrop" onClick={confirmTextEdit} />
                <div
                  className="text-edit-panel"
                  style={{
                    left: Math.min(editingText.x, (canvasRef.current?.width || 800) - 300),
                    top: Math.max(0, editingText.y - editingText.fontSize - 20),
                  }}
                >
                  <textarea
                    ref={editTextareaRef}
                    className="text-edit-textarea"
                    value={editTextValue}
                    onChange={(e) => setEditTextValue(e.target.value)}
                    style={{ fontSize: Math.min(editFontSize, 32), color: editFontColor }}
                    rows={3}
                  />
                  <div className="text-edit-controls">
                    <div className="text-edit-font-size">
                      <label>字号: {editFontSize}px</label>
                      <input
                        type="range"
                        min="12"
                        max="72"
                        value={editFontSize}
                        onChange={(e) => setEditFontSize(Number(e.target.value))}
                      />
                    </div>
                    <div className="text-edit-colors">
                      {COLORS_32.map((c) => (
                        <button
                          key={c}
                          className={`text-edit-color-swatch ${editFontColor === c ? 'active' : ''}`}
                          style={{ backgroundColor: c }}
                          onClick={() => setEditFontColor(c)}
                          title={COLOR_NAMES[c]}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-edit-hint">Enter 确认 · ESC 取消</div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={`gallery-view-container ${activeTab === 'gallery' ? 'visible' : 'hidden'}`}>
          <GalleryView galleryManager={galleryManager} newStickerId={newStickerId} />
        </div>
      </div>

      {showSaveDialog && (
        <div className="save-dialog-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>保存贴纸</h3>
            <input
              type="text"
              className="save-dialog-input"
              placeholder="输入贴纸名称..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              autoFocus
            />
            <div className="save-dialog-actions">
              <button className="action-btn" onClick={() => setShowSaveDialog(false)}>取消</button>
              <button className="action-btn primary" onClick={handleSave} disabled={!saveName.trim()}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
