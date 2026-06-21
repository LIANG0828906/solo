import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';
import type { Panel, Layer, CameraType } from '../types';
import { CameraIconSvg } from './CameraIcons';

const SNAP_GAP = 10;

interface SnapLines {
  horizontal: number | null;
  vertical: number | null;
}

const snapToValue = (value: number, targets: number[], gap = SNAP_GAP): { snapped: number; line: number | null } => {
  for (const target of targets) {
    if (Math.abs(value - target) <= gap) {
      return { snapped: target, line: target };
    }
  }
  return { snapped: value, line: null };
};

const findPanelForLayer = (panels: Panel[], layerId: string): Panel | null => {
  for (const p of panels) {
    if (p.layers.some((l) => l.id === layerId)) return p;
  }
  return null;
};

const fontLabelMap: Record<string, string> = {
  'Noto Sans SC': '思源黑体',
  'Noto Serif SC': '思源宋体',
  'ZCOOL KuaiLe': '站酷快乐体',
};

export const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingPanel, setIsDraggingPanel] = useState<string | null>(null);
  const [isResizingPanel, setIsResizingPanel] = useState<string | null>(null);
  const [isDraggingLayer, setIsDraggingLayer] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [panelStartRect, setPanelStartRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [layerStart, setLayerStart] = useState<{ x: number; y: number } | null>(null);
  const [snapLines, setSnapLines] = useState<SnapLines>({ horizontal: null, vertical: null });
  const [dropTargetPanelId, setDropTargetPanelId] = useState<string | null>(null);

  const panels = useEditorStore((s) => s.panels);
  const selectedPanelIds = useEditorStore((s) => s.selectedPanelIds);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const addPanel = useEditorStore((s) => s.addPanel);
  const updatePanel = useEditorStore((s) => s.updatePanel);
  const deletePanel = useEditorStore((s) => s.deletePanel);
  const selectPanels = useEditorStore((s) => s.selectPanels);
  const batchUpdatePanels = useEditorStore((s) => s.batchUpdatePanels);
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const selectLayer = useEditorStore((s) => s.selectLayer);
  const assignScriptLineToPanel = useEditorStore((s) => s.assignScriptLineToPanel);
  const setSelectedPanelForCamera = useEditorStore((s) => s.setSelectedPanelForCamera);
  const removeLayer = useEditorStore((s) => s.removeLayer);

  const handleCanvasScrollAreaClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-inner')) {
        selectPanels([]);
        selectLayer(null);
        setSelectedPanelForCamera(null);
      }
    },
    [selectPanels, selectLayer, setSelectedPanelForCamera],
  );

  const getSnapTargets = useCallback(
    (excludeId?: string) => {
      const otherPanels = panels.filter((p) => p.id !== excludeId);
      const hTargets: number[] = [];
      const vTargets: number[] = [];
      otherPanels.forEach((p) => {
        hTargets.push(p.y, p.y + p.height, p.y + p.height / 2);
        vTargets.push(p.x, p.x + p.width, p.x + p.width / 2);
      });
      return { hTargets, vTargets };
    },
    [panels],
  );

  const handlePanelMouseDown = useCallback(
    (e: React.MouseEvent, panel: Panel) => {
      e.stopPropagation();
      const ctrlPressed = e.ctrlKey || e.metaKey;
      if (ctrlPressed) {
        const alreadySelected = selectedPanelIds.includes(panel.id);
        selectPanels(
          alreadySelected
            ? selectedPanelIds.filter((id) => id !== panel.id)
            : [...selectedPanelIds, panel.id],
        );
      } else if (!selectedPanelIds.includes(panel.id)) {
        selectPanels([panel.id]);
      }
      setSelectedPanelForCamera(panel.id);
      selectLayer(null);

      setIsDraggingPanel(panel.id);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanelStartRect({ x: panel.x, y: panel.y, w: panel.width, h: panel.height });
    },
    [selectedPanelIds, selectPanels, setSelectedPanelForCamera, selectLayer],
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, panel: Panel) => {
      e.stopPropagation();
      if (!selectedPanelIds.includes(panel.id)) {
        selectPanels([panel.id]);
        setSelectedPanelForCamera(panel.id);
      }
      setIsResizingPanel(panel.id);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanelStartRect({ x: panel.x, y: panel.y, w: panel.width, h: panel.height });
    },
    [selectedPanelIds, selectPanels, setSelectedPanelForCamera],
  );

  useEffect(() => {
    if (!isDraggingPanel && !isResizingPanel && !isDraggingLayer) return;

    const handleMove = (e: MouseEvent) => {
      if (!dragStart) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      if (isDraggingPanel && panelStartRect) {
        const { hTargets, vTargets } = getSnapTargets(isDraggingPanel);
        const newX = panelStartRect.x + dx;
        const newY = panelStartRect.y + dy;
        const { snapped: snapX, line: vLine } = snapToValue(newX, vTargets);
        const { snapped: snapY, line: hLine } = snapToValue(newY, hTargets);
        const hTargets2 = [...hTargets, ...hTargets.map((t) => t - panelStartRect.h)];
        const vTargets2 = [...vTargets, ...vTargets.map((t) => t - panelStartRect.w)];
        const hTargets3 = [...hTargets2, ...hTargets.map((t) => t - panelStartRect.h / 2)];
        const vTargets3 = [...vTargets2, ...vTargets.map((t) => t - panelStartRect.w / 2)];
        const { snapped: finalX, line: finalV } = snapToValue(newX, vTargets3);
        const { snapped: finalY, line: finalH } = snapToValue(newY, hTargets3);
        const snapVX = finalV ?? vLine;
        const snapHY = finalH ?? hLine;

        setSnapLines({
          vertical: snapVX != null ? snapVX : null,
          horizontal: snapHY != null ? snapHY : null,
        });

        if (selectedPanelIds.length > 1 && selectedPanelIds.includes(isDraggingPanel)) {
          const startX = panelStartRect.x;
          const startY = panelStartRect.y;
          const panelsToMove = panels.filter((p) => selectedPanelIds.includes(p.id));
          const updates = new Map<string, { x: number; y: number }>();
          panelsToMove.forEach((p) => {
            updates.set(p.id, {
              x: p.x + (finalX - startX),
              y: p.y + (finalY - startY),
            });
          });
          panelsToMove.forEach((p) => {
            const up = updates.get(p.id);
            if (up) updatePanel(p.id, up);
          });
        } else {
          updatePanel(isDraggingPanel, { x: finalX, y: finalY });
        }
        return;
      }

      if (isResizingPanel && panelStartRect) {
        const stepX = Math.round(dx / 10) * 10;
        const stepY = Math.round(dy / 10) * 10;
        const newWidth = Math.max(100, Math.min(800, panelStartRect.w + stepX));
        const newHeight = Math.max(100, Math.min(800, panelStartRect.h + stepY));
        if (selectedPanelIds.length > 1) {
          const origW = panelStartRect.w;
          const origH = panelStartRect.h;
          const ratioW = newWidth / origW;
          const ratioH = newHeight / origH;
          const panelsToResize = panels.filter((p) => selectedPanelIds.includes(p.id));
          panelsToResize.forEach((p) => {
            updatePanel(p.id, {
              width: Math.max(100, Math.min(800, Math.round(p.width * ratioW))),
              height: Math.max(100, Math.min(800, Math.round(p.height * ratioH))),
            });
          });
        } else {
          updatePanel(isResizingPanel, { width: newWidth, height: newHeight });
        }
        return;
      }

      if (isDraggingLayer && layerStart) {
        const parent = findPanelForLayer(panels, isDraggingLayer);
        if (!parent) return;
        const newLayerX = layerStart.x + dx;
        const newLayerY = layerStart.y + dy;
        updateLayer(parent.id, isDraggingLayer, { x: newLayerX, y: newLayerY });
      }
    };

    const handleUp = () => {
      setIsDraggingPanel(null);
      setIsResizingPanel(null);
      setIsDraggingLayer(null);
      setDragStart(null);
      setPanelStartRect(null);
      setLayerStart(null);
      setSnapLines({ horizontal: null, vertical: null });
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [
    isDraggingPanel,
    isResizingPanel,
    isDraggingLayer,
    dragStart,
    panelStartRect,
    layerStart,
    panels,
    selectedPanelIds,
    updatePanel,
    getSnapTargets,
    updateLayer,
  ]);

  const handleLayerMouseDown = useCallback(
    (e: React.MouseEvent, panelId: string, layer: Layer) => {
      e.stopPropagation();
      if (!selectedPanelIds.includes(panelId)) {
        selectPanels([panelId]);
      }
      setSelectedPanelForCamera(panelId);
      selectLayer(layer.id);
      setIsDraggingLayer(layer.id);
      setDragStart({ x: e.clientX, y: e.clientY });
      setLayerStart({ x: layer.x, y: layer.y });
    },
    [selectedPanelIds, selectPanels, setSelectedPanelForCamera, selectLayer],
  );

  const handleDropOnPanel = useCallback(
    (e: React.DragEvent, panelId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDropTargetPanelId(null);
      const lineId = e.dataTransfer.getData('application/x-script-line-id');
      if (lineId) {
        assignScriptLineToPanel(lineId, panelId);
      }
    },
    [assignScriptLineToPanel],
  );

  const handleDragOverPanel = useCallback(
    (e: React.DragEvent, panelId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDropTargetPanelId(panelId);
    },
    [],
  );

  const handleDragLeavePanel = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDropTargetPanelId(null);
    },
    [],
  );

  const scrollOffsetRef = useRef({ x: 0, y: 0 });
  const handleAddPanelBtn = useCallback(() => {
    const c = containerRef.current;
    if (c) {
      scrollOffsetRef.current = { x: c.scrollLeft, y: c.scrollTop };
    }
    addPanel({
      x: 80 + scrollOffsetRef.current.x,
      y: 80 + scrollOffsetRef.current.y,
    });
  }, [addPanel]);

  const selectedPanels = panels.filter((p) => selectedPanelIds.includes(p.id));
  const showBatchPanel = selectedPanels.length >= 1;

  const firstSelected = selectedPanels[0];
  const batchWidth = firstSelected?.width ?? 320;
  const batchHeight = firstSelected?.height ?? 240;
  const batchRadius = firstSelected?.borderRadius ?? 4;
  const batchBg = firstSelected?.backgroundColor ?? '#ffffff';

  const handleBatchWidthChange = (v: number) => {
    const steppped = Math.round(v / 10) * 10;
    batchUpdatePanels(selectedPanelIds, { width: Math.max(100, Math.min(800, steppped)) });
  };
  const handleBatchHeightChange = (v: number) => {
    const steppped = Math.round(v / 10) * 10;
    batchUpdatePanels(selectedPanelIds, { height: Math.max(100, Math.min(800, steppped)) });
  };
  const handleBatchRadiusChange = (v: number) => {
    batchUpdatePanels(selectedPanelIds, { borderRadius: Math.max(0, Math.min(20, v)) });
  };
  const handleBatchBgChange = (v: string) => {
    batchUpdatePanels(selectedPanelIds, { backgroundColor: v });
  };

  const selectedLayerParent = selectedLayerId ? findPanelForLayer(panels, selectedLayerId) : null;
  const selectedLayer = selectedLayerParent
    ? selectedLayerParent.layers.find((l) => l.id === selectedLayerId) ?? null
    : null;

  const handleLayerStyleChange = (patch: Partial<Layer> | any) => {
    if (!selectedLayerParent || !selectedLayer) return;
    updateLayer(selectedLayerParent.id, selectedLayer.id, patch);
  };

  return (
    <div
      className="canvas-container"
      ref={containerRef}
      onClick={handleCanvasScrollAreaClick}
    >
      <div className="canvas-inner" onClick={handleCanvasScrollAreaClick}>
        {snapLines.horizontal != null && (
          <div className="snap-line snap-line-h" style={{ top: snapLines.horizontal }} />
        )}
        {snapLines.vertical != null && (
          <div className="snap-line snap-line-v" style={{ left: snapLines.vertical }} />
        )}

        {panels.map((panel) => (
          <div
            key={panel.id}
            className={`panel-item ${selectedPanelIds.includes(panel.id) ? 'selected' : ''} ${
              dropTargetPanelId === panel.id ? 'drop-target-active' : ''
            }`}
            style={{
              left: panel.x,
              top: panel.y,
              width: panel.width,
              height: panel.height,
              borderRadius: panel.borderRadius,
              backgroundColor:
                panel.backgroundColor === 'transparent' ? 'transparent' : panel.backgroundColor,
              transition:
                isDraggingPanel === panel.id || isResizingPanel === panel.id
                  ? 'none'
                  : 'box-shadow var(--transition)',
            }}
            onMouseDown={(e) => handlePanelMouseDown(e, panel)}
            onDrop={(e) => handleDropOnPanel(e, panel.id)}
            onDragOver={(e) => handleDragOverPanel(e, panel.id)}
            onDragLeave={handleDragLeavePanel}
          >
            <button
              className="panel-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('确认删除此分镜格子？')) deletePanel(panel.id);
              }}
              title="删除格子"
            >
              <X size={14} />
            </button>

            {panel.cameraType && (
              <div className="panel-camera-icon" title={cameraLabel(panel.cameraType)}>
                <CameraIconSvg type={panel.cameraType} size={24} />
              </div>
            )}

            <div
              className="panel-content"
              style={{ borderRadius: panel.borderRadius }}
            >
              {panel.layers.map((layer) => {
                const styleObj = layer.style;
                const fontCSS =
                  styleObj?.fontFamily === 'Noto Sans SC'
                    ? 'var(--font-sans)'
                    : styleObj?.fontFamily === 'Noto Serif SC'
                      ? 'var(--font-serif)'
                      : 'var(--font-kuaile)';
                return (
                  <div
                    key={layer.id}
                    className={`panel-layer ${layer.type}-layer ${
                      selectedLayerId === layer.id ? 'selected' : ''
                    }`}
                    style={{
                      left: layer.x,
                      top: layer.y,
                      transform: `rotate(${layer.rotation}deg) scale(${layer.scale})`,
                      transformOrigin: 'top left',
                      ...(layer.type === 'text' && styleObj
                        ? {
                            fontFamily: fontCSS,
                            fontSize: `${styleObj.fontSize}px`,
                            color: styleObj.color,
                            textAlign: styleObj.textAlign,
                            maxWidth: panel.width - layer.x - 20,
                            lineHeight: 1.4,
                          }
                        : {}),
                    }}
                    onMouseDown={(e) => handleLayerMouseDown(e, panel.id, layer)}
                  >
                    {layer.type === 'text' ? layer.content : null}
                    {layer.type === 'image' ? (
                      <img
                        src={layer.content}
                        alt=""
                        draggable={false}
                        style={{
                          maxWidth: panel.width * 0.8,
                          maxHeight: panel.height * 0.8,
                          objectFit: 'contain',
                          pointerEvents: 'none',
                        }}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div
              className="panel-resize-handle"
              onMouseDown={(e) => handleResizeMouseDown(e, panel)}
              title="拖拽调整尺寸"
            />

            {panel.cameraNote && <div className="panel-camera-note">{panel.cameraNote}</div>}
          </div>
        ))}
      </div>

      {selectedLayer && selectedLayer.style && selectedLayer.type === 'text' && (
        <div className="layer-inspector">
          <div className="layer-inspector-title">文字图层样式</div>

          <div className="inspector-field">
            <label className="inspector-label">字体</label>
            <select
              className="inspector-select"
              value={selectedLayer.style.fontFamily}
              onChange={(e) =>
                handleLayerStyleChange({
                  style: {
                    ...selectedLayer.style!,
                    fontFamily: e.target.value as TextStyle['fontFamily'],
                  },
                })
              }
            >
              {Object.entries(fontLabelMap).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="inspector-field">
            <label className="inspector-label">字号 ({selectedLayer.style.fontSize}pt)</label>
            <div className="inspector-slider-row">
              <input
                type="range"
                className="inspector-slider"
                min={12}
                max={48}
                step={1}
                value={selectedLayer.style.fontSize}
                onChange={(e) =>
                  handleLayerStyleChange({
                    style: { ...selectedLayer.style!, fontSize: Number(e.target.value) },
                  })
                }
              />
              <span className="inspector-slider-value">{selectedLayer.style.fontSize}</span>
            </div>
          </div>

          <div className="inspector-field">
            <label className="inspector-label">颜色</label>
            <div className="inspector-color-row">
              <input
                type="color"
                value={selectedLayer.style.color}
                onChange={(e) =>
                  handleLayerStyleChange({
                    style: { ...selectedLayer.style!, color: e.target.value },
                  })
                }
              />
              <span style={{ fontSize: 12, color: '#666' }}>{selectedLayer.style.color}</span>
            </div>
          </div>

          <div className="inspector-field">
            <label className="inspector-label">对齐方式</label>
            <div className="inspector-align-btns">
              {(['left', 'center', 'right'] as const).map((a) => (
                <button
                  key={a}
                  className={`inspector-align-btn ${
                    selectedLayer.style!.textAlign === a ? 'active' : ''
                  }`}
                  onClick={() =>
                    handleLayerStyleChange({
                      style: { ...selectedLayer.style!, textAlign: a },
                    })
                  }
                  title={a}
                >
                  {a === 'left' ? '⯇' : a === 'center' ? '⇔' : '⯈'}
                </button>
              ))}
            </div>
          </div>

          <div className="inspector-field">
            <label className="inspector-label">旋转 ({Math.round(selectedLayer.rotation)}°)</label>
            <div className="inspector-slider-row">
              <input
                type="range"
                className="inspector-slider"
                min={-180}
                max={180}
                step={1}
                value={selectedLayer.rotation}
                onChange={(e) =>
                  handleLayerStyleChange({ rotation: Number(e.target.value) })
                }
              />
              <span className="inspector-slider-value">{Math.round(selectedLayer.rotation)}°</span>
            </div>
          </div>

          <div className="inspector-field">
            <label className="inspector-label">缩放 ({(selectedLayer.scale * 100).toFixed(0)}%)</label>
            <div className="inspector-slider-row">
              <input
                type="range"
                className="inspector-slider"
                min={0.2}
                max={3}
                step={0.05}
                value={selectedLayer.scale}
                onChange={(e) =>
                  handleLayerStyleChange({ scale: Number(e.target.value) })
                }
              />
              <span className="inspector-slider-value">{(selectedLayer.scale * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="inspector-field">
            <button
              className="btn-secondary"
              style={{ width: '100%', color: '#c62828', borderColor: '#ef9a9a' }}
              onClick={() => {
                if (!selectedLayerParent) return;
                if (confirm('确认删除该图层？')) {
                  removeLayer(selectedLayerParent.id, selectedLayer.id);
                }
              }}
            >
              删除图层
            </button>
          </div>
        </div>
      )}

      {showBatchPanel && (
        <div className="batch-panel" onClick={(e) => e.stopPropagation()}>
          <div className="batch-field">
            <label className="batch-field-label">宽度</label>
            <input
              type="range"
              min={100}
              max={800}
              step={10}
              value={batchWidth}
              onChange={(e) => handleBatchWidthChange(Number(e.target.value))}
            />
            <span className="batch-field-value">{batchWidth}px</span>
          </div>
          <div className="batch-field">
            <label className="batch-field-label">高度</label>
            <input
              type="range"
              min={100}
              max={800}
              step={10}
              value={batchHeight}
              onChange={(e) => handleBatchHeightChange(Number(e.target.value))}
            />
            <span className="batch-field-value">{batchHeight}px</span>
          </div>
          <div className="batch-field">
            <label className="batch-field-label">圆角</label>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={batchRadius}
              onChange={(e) => handleBatchRadiusChange(Number(e.target.value))}
            />
            <span className="batch-field-value">{batchRadius}px</span>
          </div>
          <div className="color-picker-field">
            <label className="batch-field-label">背景</label>
            <input
              type="color"
              value={batchBg === 'transparent' ? '#ffffff' : batchBg}
              onChange={(e) => handleBatchBgChange(e.target.value)}
              title="选择颜色"
            />
            <button
              className="btn-secondary"
              style={{ padding: '4px 8px', fontSize: 11 }}
              onClick={() => handleBatchBgChange('transparent')}
              title="设为透明"
            >
              透明
            </button>
          </div>
          {selectedPanelIds.length > 1 && (
            <span style={{ fontSize: 11, color: '#666', marginLeft: 8 }}>
              已选择 {selectedPanelIds.length} 个格子
            </span>
          )}
        </div>
      )}

      <button className="canvas-add-btn" onClick={handleAddPanelBtn} title="新增分镜格子">
        <Plus size={24} />
      </button>
    </div>
  );
};

function cameraLabel(type: CameraType): string {
  const map: Record<string, string> = {
    fixed: '固定镜头',
    push: '推镜头',
    pull: '拉镜头',
    pan: '摇镜头',
    move: '移镜头',
    follow: '跟镜头',
    lowAngle: '仰拍',
    highAngle: '俯拍',
  };
  return type ? map[type] ?? type : '';
}

import type { TextStyle } from '../types';
