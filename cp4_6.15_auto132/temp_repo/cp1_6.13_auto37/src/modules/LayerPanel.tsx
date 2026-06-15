import { useState, useRef, useEffect } from 'react';
import type { Layer } from './DataModel';
import { LayerThumbnail } from './LayerThumbnail';

interface LayerPanelProps {
  layers: Layer[];
  selectedIds: string[];
  onSelect: (id: string, additive: boolean) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onReorder: (id: string, newIndex: number) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onMergeSelected: () => void;
  onDeleteSelected: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function LayerPanel({
  layers,
  selectedIds,
  onSelect,
  onDelete,
  onRename,
  onReorder,
  onToggleVisibility,
  onToggleLock,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onMergeSelected,
  onDeleteSelected,
  collapsed = false,
  onToggleCollapse
}: LayerPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayedLayers = [...layers].reverse();

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startRename = (layer: Layer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(layer.id);
    setEditName(layer.name);
  };

  const commitRename = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!dragId) return;
    const sourceDisplayIndex = displayedLayers.findIndex(l => l.id === dragId);
    if (sourceDisplayIndex === -1 || sourceDisplayIndex === targetIndex) {
      setDragId(null);
      setDragOverIndex(null);
      return;
    }
    const sourceLayer = displayedLayers[sourceDisplayIndex];
    const targetLayer = displayedLayers[targetIndex];
    if (!sourceLayer || !targetLayer) {
      setDragId(null);
      setDragOverIndex(null);
      return;
    }
    const newZIndex = targetLayer.zIndex;
    onReorder(sourceLayer.id, newZIndex);
    setDragId(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDragOverIndex(null);
  };

  const hasSelection = selectedIds.length > 0;
  const canMerge = selectedIds.length >= 2;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#2d2d44',
        borderLeft: '1px solid #3d3d5c',
        overflow: 'hidden',
        transition: 'width 0.3s ease-in-out',
        width: collapsed ? 48 : '100%',
        minWidth: collapsed ? 48 : 0,
        flexShrink: 0
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: collapsed ? '10px 8px' : '12px 14px',
          borderBottom: '1px solid #3d3d5c',
          background: '#252538'
        }}
      >
        {!collapsed && (
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0', letterSpacing: 0.3 }}>
            图形层
            <span style={{ marginLeft: 8, color: '#888', fontWeight: 400, fontSize: 12 }}>
              ({layers.length})
            </span>
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#aaa',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: 4,
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.1s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title={collapsed ? '展开图层面板' : '收起图层面板'}
        >
          {collapsed ? '◀' : '▶'}
        </button>
      </div>

      {!collapsed && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '8px 12px',
            borderBottom: '1px solid #3d3d5c',
            flexWrap: 'wrap'
          }}
        >
          <ActionButton
            disabled={!canMerge}
            onClick={onMergeSelected}
            title="合并选中图层"
          >
            合并
          </ActionButton>
          <ActionButton
            disabled={!hasSelection}
            onClick={onDeleteSelected}
            title="删除选中图层"
          >
            删除
          </ActionButton>
        </div>
      )}

      {!collapsed && (
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: 6
          }}
        >
          {displayedLayers.length === 0 && (
            <div
              style={{
                padding: 20,
                textAlign: 'center',
                color: '#666',
                fontSize: 12
              }}
            >
              暂无图形层<br />
              在左侧画布绘制以创建
            </div>
          )}

          {displayedLayers.map((layer, displayIndex) => {
            const isSelected = selectedIds.includes(layer.id);
            const isDragging = dragId === layer.id;
            const isDragOver = dragOverIndex === displayIndex && dragId !== layer.id;

            return (
              <div
                key={layer.id}
                draggable={!layer.locked && editingId !== layer.id}
                onDragStart={(e) => handleDragStart(e, layer.id)}
                onDragOver={(e) => handleDragOver(e, displayIndex)}
                onDrop={(e) => handleDrop(e, displayIndex)}
                onDragEnd={handleDragEnd}
                onClick={(e) => {
                  if (editingId === layer.id) return;
                  const additive = e.shiftKey || e.ctrlKey || e.metaKey;
                  onSelect(layer.id, additive);
                }}
                onDoubleClick={(e) => startRename(layer, e)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 8px',
                  marginBottom: 4,
                  borderRadius: 5,
                  cursor: layer.locked ? 'not-allowed' : 'pointer',
                  background: isSelected ? 'rgba(255,140,0,0.18)' : 'transparent',
                  border: isSelected ? '1px solid rgba(255,140,0,0.5)' : '1px solid transparent',
                  opacity: isDragging ? 0.4 : layer.visible ? 1 : 0.45,
                  position: 'relative',
                  transition: 'background 0.1s, border-color 0.1s',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                {isDragOver && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -2,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: '#4a9eff',
                      borderRadius: 1
                    }}
                  />
                )}

                <LayerThumbnail layer={layer} size={22} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingId === layer.id ? (
                    <input
                      ref={inputRef}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '100%',
                        background: '#1e1e2e',
                        border: '1px solid #4a9eff',
                        color: '#e0e0e0',
                        padding: '3px 6px',
                        borderRadius: 3,
                        fontSize: 12,
                        outline: 'none'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        fontSize: 12,
                        color: layer.locked ? '#777' : '#e0e0e0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {layer.name}
                      {layer.locked && (
                        <span style={{ marginLeft: 4, fontSize: 10, color: '#888' }}>🔒</span>
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                    #{layer.zIndex + 1}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); onMoveUp(layer.id); }}
                    title="上移一层"
                    disabled={layer.zIndex >= layers.length - 1}
                  >
                    ↑
                  </IconButton>
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); onMoveDown(layer.id); }}
                    title="下移一层"
                    disabled={layer.zIndex <= 0}
                  >
                    ↓
                  </IconButton>
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                    title={layer.visible ? '隐藏' : '显示'}
                  >
                    {layer.visible ? '👁' : '◌'}
                  </IconButton>
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); onToggleLock(layer.id); }}
                    title={layer.locked ? '解锁' : '锁定'}
                  >
                    {layer.locked ? '🔒' : '🔓'}
                  </IconButton>
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); onDuplicate(layer.id); }}
                    title="复制"
                  >
                    ⎘
                  </IconButton>
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); onDelete(layer.id); }}
                    title="删除"
                    danger
                  >
                    ✕
                  </IconButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {collapsed && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px 4px',
            gap: 6,
            overflowY: 'auto'
          }}
        >
          {displayedLayers.map(layer => (
            <div
              key={layer.id}
              onClick={() => onSelect(layer.id, false)}
              title={layer.name}
              style={{
                padding: 3,
                borderRadius: 4,
                cursor: layer.locked ? 'not-allowed' : 'pointer',
                background: selectedIds.includes(layer.id) ? 'rgba(255,140,0,0.25)' : 'transparent',
                border: selectedIds.includes(layer.id) ? '1px solid rgba(255,140,0,0.5)' : '1px solid transparent'
              }}
            >
              <LayerThumbnail layer={layer} size={24} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  children, onClick, disabled, title
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: disabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
        border: '1px solid #3d3d5c',
        color: disabled ? '#555' : '#ccc',
        padding: '5px 10px',
        borderRadius: 4,
        fontSize: 11,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.1s'
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
      }}
    >
      {children}
    </button>
  );
}

function IconButton({
  children, onClick, title, disabled, danger
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: 'transparent',
        border: 'none',
        color: disabled ? '#444' : danger ? '#e05555' : '#999',
        padding: '2px 4px',
        borderRadius: 3,
        fontSize: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 18,
        transition: 'background 0.1s, color 0.1s'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = danger ? '#ff6666' : '#fff';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = danger ? '#e05555' : '#999';
        }
      }}
    >
      {children}
    </button>
  );
}
