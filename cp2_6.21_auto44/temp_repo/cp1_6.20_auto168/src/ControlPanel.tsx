import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/store';
import type { AnchorPoint, GradientType, BlendMode } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Layers,
  Palette,
  Type,
  Edit3,
  Check,
  X,
  GripVertical,
} from 'lucide-react';

const GRADIENT_TYPES: { value: GradientType; label: string }[] = [
  { value: 'linear', label: '线性' },
  { value: 'radial', label: '径向' },
  { value: 'conic', label: '锥形' },
];

const BLEND_MODE_OPTIONS: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: '正常' },
  { value: 'multiply', label: '正片叠底' },
  { value: 'screen', label: '滤色' },
  { value: 'overlay', label: '叠加' },
  { value: 'soft-light', label: '柔光' },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-xs uppercase tracking-wider text-app-text-dim mb-2">
      {children}
    </h3>
  );
}

export default function ControlPanel() {
  const layers = useAppStore((s) => s.layers);
  const activeLayerId = useAppStore((s) => s.activeLayerId);
  const panelCollapsed = useAppStore((s) => s.panelCollapsed);
  const addLayer = useAppStore((s) => s.addLayer);
  const removeLayer = useAppStore((s) => s.removeLayer);
  const updateLayer = useAppStore((s) => s.updateLayer);
  const reorderLayers = useAppStore((s) => s.reorderLayers);
  const setActiveLayer = useAppStore((s) => s.setActiveLayer);
  const addAnchor = useAppStore((s) => s.addAnchor);
  const updateAnchor = useAppStore((s) => s.updateAnchor);
  const removeAnchor = useAppStore((s) => s.removeAnchor);
  const setGradientType = useAppStore((s) => s.setGradientType);
  const togglePanel = useAppStore((s) => s.togglePanel);

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const activeLayer = layers.find((l) => l.id === activeLayerId);
  const sortedLayers = [...layers].sort((a, b) => a.order - b.order);

  const handleGradientTypeChange = useCallback(
    (type: GradientType) => {
      if (activeLayerId) setGradientType(activeLayerId, type);
    },
    [activeLayerId, setGradientType],
  );

  const handleAddAnchor = useCallback(() => {
    if (activeLayerId) addAnchor(activeLayerId, 50, 50);
  }, [activeLayerId, addAnchor]);

  const handleAnchorColorChange = useCallback(
    (anchorId: string, color: string) => {
      if (activeLayerId) updateAnchor(activeLayerId, anchorId, { color });
    },
    [activeLayerId, updateAnchor],
  );

  const handleAnchorTypeToggle = useCallback(
    (anchorId: string, currentType: AnchorPoint['type']) => {
      if (activeLayerId) {
        updateAnchor(activeLayerId, anchorId, {
          type: currentType === 'start' ? 'end' : 'start',
        });
      }
    },
    [activeLayerId, updateAnchor],
  );

  const handleRemoveAnchor = useCallback(
    (anchorId: string) => {
      if (activeLayerId) removeAnchor(activeLayerId, anchorId);
    },
    [activeLayerId, removeAnchor],
  );

  const handleStartRename = useCallback((layerId: string, currentName: string) => {
    setEditingLayerId(layerId);
    setEditingName(currentName);
  }, []);

  const handleConfirmRename = useCallback(() => {
    if (editingLayerId && editingName.trim()) {
      updateLayer(editingLayerId, { name: editingName.trim() });
    }
    setEditingLayerId(null);
    setEditingName('');
  }, [editingLayerId, editingName, updateLayer]);

  const handleCancelRename = useCallback(() => {
    setEditingLayerId(null);
    setEditingName('');
  }, []);

  const handleLayerReorder = useCallback(
    (layerId: string, direction: 'up' | 'down') => {
      const idx = sortedLayers.findIndex((l) => l.id === layerId);
      if (idx === -1) return;
      if (direction === 'up' && idx > 0) {
        reorderLayers(idx, idx - 1);
      } else if (direction === 'down' && idx < sortedLayers.length - 1) {
        reorderLayers(idx, idx + 1);
      }
    },
    [sortedLayers, reorderLayers],
  );

  const handleBlendModeChange = useCallback(
    (layerId: string, blendMode: BlendMode) => {
      updateLayer(layerId, { blendMode });
    },
    [updateLayer],
  );

  const handleToggleVisibility = useCallback(
    (layerId: string, visible: boolean) => {
      updateLayer(layerId, { visible });
    },
    [updateLayer],
  );

  if (panelCollapsed) {
    return (
      <div className="panel-transition flex flex-col items-center w-[50px] bg-app-panel h-full py-4 gap-4">
        <button
          onClick={togglePanel}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-app-text hover:bg-app-primary btn-hover"
          title="展开面板"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={togglePanel}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-app-text hover:bg-app-primary btn-hover"
          title="渐变类型"
        >
          <Type size={18} />
        </button>
        <button
          onClick={togglePanel}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-app-text hover:bg-app-primary btn-hover"
          title="锚点列表"
        >
          <Palette size={18} />
        </button>
        <button
          onClick={togglePanel}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-app-text hover:bg-app-primary btn-hover"
          title="图层管理"
        >
          <Layers size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="panel-transition flex flex-col w-[280px] bg-app-panel h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-app-border shrink-0">
        <span className="font-display text-xs uppercase tracking-wider text-app-text-dim">
          控制面板
        </span>
        <button
          onClick={togglePanel}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-app-text hover:bg-app-primary btn-hover"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
        {/* Gradient Type Selector */}
        <section>
          <SectionTitle>渐变类型</SectionTitle>
          <div className="flex gap-1">
            {GRADIENT_TYPES.map((gt) => (
              <button
                key={gt.value}
                onClick={() => handleGradientTypeChange(gt.value)}
                className={`btn-hover flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs transition-colors ${
                  activeLayer?.gradientType === gt.value
                    ? 'bg-app-accent text-white'
                    : 'bg-app-primary text-app-text hover:bg-app-accent/30'
                }`}
              >
                <Type size={12} />
                {gt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Anchor Points List */}
        <section>
          <SectionTitle>锚点列表</SectionTitle>
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
            {activeLayer?.anchors.map((anchor) => (
              <div
                key={anchor.id}
                className="flex items-center gap-1.5 p-1.5 rounded bg-app-surface"
              >
                <div
                  className="w-5 h-5 rounded shrink-0 border border-app-border"
                  style={{ backgroundColor: anchor.color }}
                />
                <label className="relative shrink-0 cursor-pointer">
                  <input
                    type="color"
                    value={anchor.color}
                    onChange={(e) => handleAnchorColorChange(anchor.id, e.target.value)}
                    className="absolute inset-0 opacity-0 w-7 h-7 cursor-pointer"
                  />
                  <div
                    className="w-7 h-7 rounded border border-app-border"
                    style={{ backgroundColor: anchor.color }}
                  />
                </label>
                <span className="text-[10px] text-app-text-dim tabular-nums truncate">
                  x:{anchor.x.toFixed(1)} y:{anchor.y.toFixed(1)}
                </span>
                <button
                  onClick={() => handleAnchorTypeToggle(anchor.id, anchor.type)}
                  className="text-[10px] px-1 py-0.5 rounded bg-app-primary text-app-text hover:bg-app-accent/30 transition-colors shrink-0"
                >
                  {anchor.type === 'start' ? '起' : '止'}
                </button>
                <button
                  onClick={() => handleRemoveAnchor(anchor.id)}
                  className="shrink-0 text-app-text-dim hover:text-app-accent transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleAddAnchor}
            className="btn-hover mt-1.5 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-app-primary text-app-text text-xs hover:bg-app-accent/30 transition-colors"
          >
            <Plus size={12} />
            添加锚点
          </button>
        </section>

        {/* Layer Management */}
        <section>
          <SectionTitle>图层管理</SectionTitle>
          <div className="space-y-1">
            {sortedLayers.map((layer, index) => {
              const isActive = layer.id === activeLayerId;
              const isEditing = layer.id === editingLayerId;

              return (
                <div key={layer.id}>
                  <div
                    onClick={() => setActiveLayer(layer.id)}
                    className={`flex items-center gap-1.5 p-1.5 rounded cursor-pointer transition-colors ${
                      isActive
                        ? 'border-l-2 border-app-accent bg-app-primary/30'
                        : 'hover:bg-app-primary/20'
                    }`}
                  >
                    <GripVertical size={14} className="text-app-text-dim shrink-0" />

                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleConfirmRename();
                            if (e.key === 'Escape') handleCancelRename();
                          }}
                          onBlur={handleConfirmRename}
                          autoFocus
                          className="flex-1 min-w-0 bg-app-surface border border-app-border rounded px-1 py-0.5 text-xs text-app-text focus:border-app-accent focus:outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmRename();
                          }}
                          className="shrink-0 text-app-accent hover:text-app-accent/80"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelRename();
                          }}
                          className="shrink-0 text-app-text-dim hover:text-app-text"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <span
                        onDoubleClick={() => handleStartRename(layer.id, layer.name)}
                        className="flex-1 text-xs text-app-text truncate select-none"
                      >
                        {layer.name}
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisibility(layer.id, !layer.visible);
                      }}
                      className="shrink-0 text-app-text-dim hover:text-app-text transition-colors"
                    >
                      {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>

                    <div className="flex flex-col shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLayerReorder(layer.id, 'up');
                        }}
                        disabled={index === 0}
                        className="text-app-text-dim hover:text-app-text disabled:opacity-30 transition-colors leading-none"
                      >
                        <ArrowUp size={11} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLayerReorder(layer.id, 'down');
                        }}
                        disabled={index === sortedLayers.length - 1}
                        className="text-app-text-dim hover:text-app-text disabled:opacity-30 transition-colors leading-none"
                      >
                        <ArrowDown size={11} />
                      </button>
                    </div>

                    {layers.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLayer(layer.id);
                        }}
                        className="shrink-0 text-app-text-dim hover:text-app-accent transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {isActive && (
                    <div className="ml-6 mt-1 mb-1">
                      <select
                        value={layer.blendMode}
                        onChange={(e) =>
                          handleBlendModeChange(layer.id, e.target.value as BlendMode)
                        }
                        className="w-full bg-app-surface border border-app-border rounded px-2 py-1 text-xs text-app-text focus:border-app-accent focus:outline-none"
                      >
                        {BLEND_MODE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={addLayer}
            className="btn-hover mt-1.5 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-app-primary text-app-text text-xs hover:bg-app-accent/30 transition-colors"
          >
            <Plus size={12} />
            添加图层
          </button>
        </section>
      </div>
    </div>
  );
}
