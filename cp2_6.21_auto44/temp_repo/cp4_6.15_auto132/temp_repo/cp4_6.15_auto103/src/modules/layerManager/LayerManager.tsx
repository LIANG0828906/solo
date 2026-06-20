import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import useSketchStore from '../../store/useSketchStore';
import type { Layer, LayerGroup, LayerType } from '../../types';
import { debounce, calculateVirtualRange } from '../../utils/performance';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  layerId: string | null;
  groupId: string | null;
}

interface DragState {
  isDragging: boolean;
  draggedLayerId: string | null;
  draggedGroupId: string | null;
  overLayerId: string | null;
  overGroupId: string | null;
  overPosition: 'before' | 'after' | null;
}

const StrokeIcon = memo(() => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>
));
StrokeIcon.displayName = 'StrokeIcon';

const ShapeIcon = memo(() => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </svg>
));
ShapeIcon.displayName = 'ShapeIcon';

const TextIcon = memo(() => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="9" y1="20" x2="15" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
));
TextIcon.displayName = 'TextIcon';

const ChevronIcon = memo(({ expanded }: { expanded: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
      transition: 'transform 0.3s ease',
    }}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
));
ChevronIcon.displayName = 'ChevronIcon';

const EyeIcon = memo(({ visible }: { visible: boolean }) => (
  visible ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
));
EyeIcon.displayName = 'EyeIcon';

const LockIcon = memo(({ locked }: { locked: boolean }) => (
  locked ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  )
));
LockIcon.displayName = 'LockIcon';

const getTypeIcon = (type: LayerType) => {
  switch (type) {
    case 'stroke':
      return <StrokeIcon />;
    case 'shape':
      return <ShapeIcon />;
    case 'text':
      return <TextIcon />;
    default:
      return <StrokeIcon />;
  }
};

const getTypeColor = (type: LayerType): string => {
  switch (type) {
    case 'stroke':
      return '#7BC67E';
    case 'shape':
      return '#5DA860';
    case 'text':
      return '#636E72';
    default:
      return '#7BC67E';
  }
};

const getTypeName = (type: LayerType): string => {
  switch (type) {
    case 'stroke':
      return '线条';
    case 'shape':
      return '形状';
    case 'text':
      return '文字';
    default:
      return '图层';
  }
};

interface LayerItemProps {
  layer: Layer;
  groupId: string;
  isSelected: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  dragOverPosition: 'before' | 'after' | null;
  isRenaming: boolean;
  renameValue: string;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onOpacityChange: (id: string, opacity: number) => void;
  onContextMenu: (e: React.MouseEvent, layerId: string, groupId: string) => void;
  onDragStart: (e: React.DragEvent, layerId: string, groupId: string) => void;
  onDragOver: (e: React.DragEvent, layerId: string, groupId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, layerId: string, groupId: string) => void;
  onDragEnd: () => void;
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
}

const LayerItem = memo(function LayerItem(props: LayerItemProps) {
  const {
    layer,
    groupId,
    isSelected,
    isDragging,
    isDragOver,
    dragOverPosition,
    isRenaming,
    renameValue,
    onSelect,
    onToggleVisibility,
    onToggleLock,
    onOpacityChange,
    onContextMenu,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    onRenameChange,
    onRenameSubmit,
    onRenameCancel,
  } = props;

  const [showOpacity, setShowOpacity] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const typeColor = getTypeColor(layer.type);

  return (
    <div
      draggable={!layer.locked && !isRenaming}
      onDragStart={(e) => onDragStart(e, layer.id, groupId)}
      onDragOver={(e) => onDragOver(e, layer.id, groupId)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, layer.id, groupId)}
      onDragEnd={onDragEnd}
      onClick={() => onSelect(layer.id)}
      onContextMenu={(e) => onContextMenu(e, layer.id, groupId)}
      style={{
        position: 'relative',
        margin: '4px 8px',
        padding: '8px 12px',
        paddingLeft: isSelected ? '9px' : '12px',
        borderRadius: '10px',
        background: isSelected
          ? 'rgba(123, 198, 126, 0.12)'
          : 'var(--color-white)',
        boxShadow: isSelected
          ? '0 2px 8px rgba(123, 198, 126, 0.25)'
          : '0 1px 4px rgba(0, 0, 0, 0.06)',
        borderLeft: isSelected ? '3px solid var(--color-primary)' : 'none',
        cursor: isDragging ? 'grabbing' : layer.locked ? 'not-allowed' : 'pointer',
        opacity: isDragging ? 0.4 : 1,
        transition: 'all 0.2s ease',
        transform: isDragging ? 'scale(0.98)' : 'scale(1)',
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = isSelected
            ? '0 4px 12px rgba(123, 198, 126, 0.3)'
            : '0 3px 8px rgba(0, 0, 0, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = isDragging ? 'scale(0.98)' : 'scale(1)';
        e.currentTarget.style.boxShadow = isSelected
          ? '0 2px 8px rgba(123, 198, 126, 0.25)'
          : '0 1px 4px rgba(0, 0, 0, 0.06)';
      }}
    >
      {isDragOver && dragOverPosition === 'before' && (
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            left: '8px',
            right: '8px',
            height: '3px',
            background: 'var(--color-primary)',
            borderRadius: '2px',
            opacity: 0.8,
          }}
        />
      )}

      {isDragOver && dragOverPosition === 'after' && (
        <div
          style={{
            position: 'absolute',
            bottom: '-2px',
            left: '8px',
            right: '8px',
            height: '3px',
            background: 'var(--color-primary)',
            borderRadius: '2px',
            opacity: 0.8,
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ color: typeColor, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {getTypeIcon(layer.type)}
        </div>

        <button
          className="btn-ripple"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(layer.id);
          }}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            opacity: layer.visible ? 1 : 0.4,
            color: layer.visible ? 'var(--color-text)' : 'var(--color-text-light)',
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(123, 198, 126, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <EyeIcon visible={layer.visible} />
        </button>

        <button
          className="btn-ripple"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock(layer.id);
          }}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            color: layer.locked ? 'var(--color-primary-dark)' : 'var(--color-text-light)',
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(123, 198, 126, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LockIcon locked={layer.locked} />
        </button>

        {isRenaming ? (
          <input
            ref={renameInputRef}
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onBlur={onRenameCancel}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRenameSubmit();
              if (e.key === 'Escape') onRenameCancel();
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              padding: '4px 8px',
              border: '1px solid var(--color-primary)',
              borderRadius: '6px',
              fontSize: '13px',
              fontFamily: 'var(--font-handwriting)',
              background: 'white',
              outline: 'none',
              minWidth: 0,
            }}
          />
        ) : (
          <span
            className="handwriting"
            style={{
              flex: 1,
              fontSize: '13px',
              color: layer.visible ? 'var(--color-text)' : 'var(--color-text-light)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {layer.name}
          </span>
        )}

        <button
          className="btn-ripple"
          onClick={(e) => {
            e.stopPropagation();
            setShowOpacity(!showOpacity);
          }}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            color: 'var(--color-text-light)',
            fontSize: '11px',
            fontWeight: 500,
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(123, 198, 126, 0.1)';
            e.currentTarget.style.color = 'var(--color-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-light)';
          }}
        >
          {Math.round(layer.opacity * 100)}
        </button>
      </div>

      {showOpacity && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px 4px',
            borderTop: '1px dashed var(--color-warm-gray-dark)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-light)' }}>不透明度</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={layer.opacity}
              onChange={(e) => onOpacityChange(layer.id, parseFloat(e.target.value))}
              style={{
                flex: 1,
                accentColor: 'var(--color-primary)',
                cursor: 'pointer',
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--color-text)', minWidth: '32px', textAlign: 'right' }}>
              {Math.round(layer.opacity * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

interface LayerGroupProps {
  group: LayerGroup;
  selectedLayerId: string | null;
  dragState: DragState;
  renamingLayerId: string | null;
  renameValue: string;
  onToggleGroup: (groupId: string) => void;
  onSelectLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
  onContextMenu: (e: React.MouseEvent, layerId: string, groupId: string) => void;
  onDragStart: (e: React.DragEvent, layerId: string, groupId: string) => void;
  onLayerDragOver: (e: React.DragEvent, layerId: string, groupId: string) => void;
  onLayerDragLeave: () => void;
  onLayerDrop: (e: React.DragEvent, layerId: string, groupId: string) => void;
  onGroupDragOver: (e: React.DragEvent, groupId: string) => void;
  onGroupDragLeave: () => void;
  onGroupDrop: (e: React.DragEvent, groupId: string) => void;
  onDragEnd: () => void;
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
}

const LayerGroupComponent = memo(function LayerGroupComponent(props: LayerGroupProps) {
  const {
    group,
    selectedLayerId,
    dragState,
    renamingLayerId,
    renameValue,
    onToggleGroup,
    onSelectLayer,
    onToggleVisibility,
    onToggleLock,
    onOpacityChange,
    onContextMenu,
    onDragStart,
    onLayerDragOver,
    onLayerDragLeave,
    onLayerDrop,
    onGroupDragOver,
    onGroupDragLeave,
    onGroupDrop,
    onDragEnd,
    onRenameChange,
    onRenameSubmit,
    onRenameCancel,
  } = props;

  const layersRef = useRef<HTMLDivElement>(null);
  const typeColor = getTypeColor(group.type);

  const isGroupDragOver =
    dragState.isDragging &&
    dragState.overGroupId === group.id &&
    !dragState.overLayerId;

  return (
    <div
      style={{
        margin: '6px 4px',
        borderRadius: '12px',
        background: 'rgba(245, 240, 235, 0.6)',
        border: isGroupDragOver ? '2px dashed var(--color-primary)' : '1px solid var(--color-warm-gray-dark)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
      onDragOver={(e) => onGroupDragOver(e, group.id)}
      onDragLeave={onGroupDragLeave}
      onDrop={(e) => onGroupDrop(e, group.id)}
    >
      <div
        onClick={() => onToggleGroup(group.id)}
        className="btn-ripple"
        style={{
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          background: 'transparent',
          transition: 'background 0.2s ease',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(123, 198, 126, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <div style={{ color: typeColor, display: 'flex', alignItems: 'center' }}>
          <ChevronIcon expanded={group.expanded} />
        </div>

        <div style={{ color: typeColor, display: 'flex', alignItems: 'center' }}>
          {getTypeIcon(group.type)}
        </div>

        <span
          className="handwriting"
          style={{
            flex: 1,
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-text)',
          }}
        >
          {group.name}
        </span>

        <span
          style={{
            fontSize: '11px',
            color: 'var(--color-text-light)',
            background: 'var(--color-white)',
            padding: '2px 8px',
            borderRadius: '10px',
            border: '1px solid var(--color-warm-gray-dark)',
          }}
        >
          {group.layers.length}
        </span>
      </div>

      <div
        ref={layersRef}
        style={{
          maxHeight: group.expanded ? `${group.layers.length * 80 + 16}px` : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: group.expanded ? '4px 0px 8px 0px' : '0px',
        }}
      >
        {group.layers.length === 0 ? (
          <div
            style={{
              padding: '12px 16px',
              textAlign: 'center',
              fontSize: '12px',
              color: 'var(--color-text-light)',
              fontStyle: 'italic',
            }}
          >
            暂无{getTypeName(group.type)}图层
          </div>
        ) : (
          group.layers.map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              groupId={group.id}
              isSelected={selectedLayerId === layer.id}
              isDragging={dragState.draggedLayerId === layer.id}
              isDragOver={dragState.overLayerId === layer.id}
              dragOverPosition={
                dragState.overLayerId === layer.id ? dragState.overPosition : null
              }
              isRenaming={renamingLayerId === layer.id}
              renameValue={renameValue}
              onSelect={onSelectLayer}
              onToggleVisibility={onToggleVisibility}
              onToggleLock={onToggleLock}
              onOpacityChange={onOpacityChange}
              onContextMenu={onContextMenu}
              onDragStart={onDragStart}
              onDragOver={onLayerDragOver}
              onDragLeave={onLayerDragLeave}
              onDrop={onLayerDrop}
              onDragEnd={onDragEnd}
              onRenameChange={onRenameChange}
              onRenameSubmit={onRenameSubmit}
              onRenameCancel={onRenameCancel}
            />
          ))
        )}
      </div>
    </div>
  );
});

const LayerManager: React.FC = () => {
  const layerGroups = useSketchStore((state) => state.layerGroups);
  const selectedLayerId = useSketchStore((state) => state.selectedLayerId);
  const selectLayer = useSketchStore((state) => state.selectLayer);
  const toggleLayerVisibility = useSketchStore((state) => state.toggleLayerVisibility);
  const toggleLayerLock = useSketchStore((state) => state.toggleLayerLock);
  const toggleGroupExpanded = useSketchStore((state) => state.toggleGroupExpanded);
  const updateLayer = useSketchStore((state) => state.updateLayer);
  const deleteLayer = useSketchStore((state) => state.deleteLayer);
  const mergeLayers = useSketchStore((state) => state.mergeLayers);
  const reorderLayer = useSketchStore((state) => state.reorderLayer);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    layerId: null,
    groupId: null,
  });

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedLayerId: null,
    draggedGroupId: null,
    overLayerId: null,
    overGroupId: null,
    overPosition: null,
  });

  const [renamingLayerId, setRenamingLayerId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelectLayer = useCallback(
    (layerId: string) => {
      selectLayer(layerId);
    },
    [selectLayer]
  );

  const handleToggleVisibility = useCallback(
    (layerId: string) => {
      toggleLayerVisibility(layerId);
    },
    [toggleLayerVisibility]
  );

  const handleToggleLock = useCallback(
    (layerId: string) => {
      toggleLayerLock(layerId);
    },
    [toggleLayerLock]
  );

  const handleOpacityChange = useCallback(
    debounce((layerId: string, opacity: number) => {
      updateLayer(layerId, { opacity });
    }, 50),
    [updateLayer]
  );

  const handleToggleGroup = useCallback(
    (groupId: string) => {
      toggleGroupExpanded(groupId);
    },
    [toggleGroupExpanded]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, layerId: string, groupId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        layerId,
        groupId,
      });
    },
    []
  );

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleDeleteLayer = useCallback(() => {
    if (contextMenu.layerId) {
      deleteLayer(contextMenu.layerId);
    }
    handleCloseContextMenu();
  }, [contextMenu.layerId, deleteLayer, handleCloseContextMenu]);

  const handleMergeLayers = useCallback(() => {
    if (selectedLayerId && contextMenu.layerId) {
      const layersToMerge =
        selectedLayerId === contextMenu.layerId
          ? [selectedLayerId]
          : [selectedLayerId, contextMenu.layerId];
      const uniqueIds = Array.from(new Set(layersToMerge));
      if (uniqueIds.length >= 2) {
        const newId = `merged-${Date.now()}`;
        mergeLayers(uniqueIds, newId, `合并图层_${uniqueIds.length}`);
      }
    }
    handleCloseContextMenu();
  }, [selectedLayerId, contextMenu.layerId, mergeLayers, handleCloseContextMenu]);

  const handleStartRename = useCallback(() => {
    if (contextMenu.layerId) {
      const allLayers = layerGroups.flatMap((g) => g.layers);
      const layer = allLayers.find((l) => l.id === contextMenu.layerId);
      if (layer) {
        setRenamingLayerId(layer.id);
        setRenameValue(layer.name);
      }
    }
    handleCloseContextMenu();
  }, [contextMenu.layerId, layerGroups, handleCloseContextMenu]);

  const handleRenameSubmit = useCallback(() => {
    if (renamingLayerId && renameValue.trim()) {
      updateLayer(renamingLayerId, { name: renameValue.trim() });
    }
    setRenamingLayerId(null);
    setRenameValue('');
  }, [renamingLayerId, renameValue, updateLayer]);

  const handleRenameCancel = useCallback(() => {
    setRenamingLayerId(null);
    setRenameValue('');
  }, []);

  const handleDragStart = useCallback(
    (e: React.DragEvent, layerId: string, groupId: string) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', layerId);
      setDragState({
        isDragging: true,
        draggedLayerId: layerId,
        draggedGroupId: groupId,
        overLayerId: null,
        overGroupId: null,
        overPosition: null,
      });
    },
    []
  );

  const handleLayerDragOver = useCallback(
    (e: React.DragEvent, layerId: string, groupId: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!dragState.isDragging || dragState.draggedLayerId === layerId) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position = e.clientY < midY ? 'before' : 'after';

      setDragState((prev) => ({
        ...prev,
        overLayerId: layerId,
        overGroupId: groupId,
        overPosition: position,
      }));
    },
    [dragState.isDragging, dragState.draggedLayerId]
  );

  const handleLayerDragLeave = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      overLayerId: null,
      overPosition: null,
    }));
  }, []);

  const handleGroupDragOver = useCallback(
    (e: React.DragEvent, groupId: string) => {
      e.preventDefault();
      if (!dragState.isDragging) return;

      setDragState((prev) => ({
        ...prev,
        overGroupId: groupId,
      }));
    },
    [dragState.isDragging]
  );

  const handleGroupDragLeave = useCallback(() => {
    setDragState((prev) => {
      if (prev.overLayerId) return prev;
      return { ...prev, overGroupId: null };
    });
  }, []);

  const handleLayerDrop = useCallback(
    (e: React.DragEvent, targetLayerId: string, targetGroupId: string) => {
      e.preventDefault();
      e.stopPropagation();

      if (!dragState.draggedLayerId || dragState.draggedLayerId === targetLayerId) {
        setDragState({
          isDragging: false,
          draggedLayerId: null,
          draggedGroupId: null,
          overLayerId: null,
          overGroupId: null,
          overPosition: null,
        });
        return;
      }

      const targetGroup = layerGroups.find((g) => g.id === targetGroupId);
      if (!targetGroup) return;

      const targetIndex = targetGroup.layers.findIndex((l) => l.id === targetLayerId);
      const adjustedIndex =
        dragState.overPosition === 'after'
          ? targetIndex + 1
          : targetIndex;

      reorderLayer(dragState.draggedLayerId, adjustedIndex, targetGroupId);

      setDragState({
        isDragging: false,
        draggedLayerId: null,
        draggedGroupId: null,
        overLayerId: null,
        overGroupId: null,
        overPosition: null,
      });
    },
    [dragState, layerGroups, reorderLayer]
  );

  const handleGroupDrop = useCallback(
    (e: React.DragEvent, targetGroupId: string) => {
      e.preventDefault();

      if (!dragState.draggedLayerId) {
        setDragState({
          isDragging: false,
          draggedLayerId: null,
          draggedGroupId: null,
          overLayerId: null,
          overGroupId: null,
          overPosition: null,
        });
        return;
      }

      if (dragState.overLayerId) return;

      const targetGroup = layerGroups.find((g) => g.id === targetGroupId);
      if (!targetGroup) return;

      reorderLayer(dragState.draggedLayerId, targetGroup.layers.length, targetGroupId);

      setDragState({
        isDragging: false,
        draggedLayerId: null,
        draggedGroupId: null,
        overLayerId: null,
        overGroupId: null,
        overPosition: null,
      });
    },
    [dragState, layerGroups, reorderLayer]
  );

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedLayerId: null,
      draggedGroupId: null,
      overLayerId: null,
      overGroupId: null,
      overPosition: null,
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu.visible) {
        handleCloseContextMenu();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseContextMenu();
        handleRenameCancel();
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu.visible, handleCloseContextMenu, handleRenameCancel]);

  const totalLayers = layerGroups.reduce((acc, g) => acc + g.layers.length, 0);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        minWidth: '220px',
        position: 'relative',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          selectLayer(null);
        }
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--color-warm-gray-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-white)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
            }}
          >
            📚
          </div>
          <h3
            className="handwriting"
            style={{
              fontSize: '16px',
              color: 'var(--color-text)',
              fontWeight: 600,
            }}
          >
            草图层级
          </h3>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--color-text-light)',
              background: 'var(--color-warm-gray)',
              padding: '2px 8px',
              borderRadius: '10px',
              border: '1px solid var(--color-warm-gray-dark)',
            }}
          >
            {totalLayers}
          </span>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '8px 4px',
        }}
      >
        {layerGroups.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                marginBottom: '12px',
                opacity: 0.3,
              }}
            >
              🗂️
            </div>
            <p
              className="handwriting"
              style={{
                fontSize: '15px',
                color: 'var(--color-text-light)',
                marginBottom: '4px',
              }}
            >
              暂无图层
            </p>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--color-text-light)',
              }}
            >
              上传图片并矢量化后自动创建图层
            </p>
          </div>
        ) : (
          layerGroups.map((group) => (
            <LayerGroupComponent
              key={group.id}
              group={group}
              selectedLayerId={selectedLayerId}
              dragState={dragState}
              renamingLayerId={renamingLayerId}
              renameValue={renameValue}
              onToggleGroup={handleToggleGroup}
              onSelectLayer={handleSelectLayer}
              onToggleVisibility={handleToggleVisibility}
              onToggleLock={handleToggleLock}
              onOpacityChange={handleOpacityChange}
              onContextMenu={handleContextMenu}
              onDragStart={handleDragStart}
              onLayerDragOver={handleLayerDragOver}
              onLayerDragLeave={handleLayerDragLeave}
              onLayerDrop={handleLayerDrop}
              onGroupDragOver={handleGroupDragOver}
              onGroupDragLeave={handleGroupDragLeave}
              onGroupDrop={handleGroupDrop}
              onDragEnd={handleDragEnd}
              onRenameChange={setRenameValue}
              onRenameSubmit={handleRenameSubmit}
              onRenameCancel={handleRenameCancel}
            />
          ))
        )}
      </div>

      {contextMenu.visible && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 10000,
            background: 'var(--color-white)',
            borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)',
            padding: '6px',
            minWidth: '160px',
            border: '1px solid var(--color-warm-gray-dark)',
            animation: 'fadeIn 0.15s ease',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="btn-ripple"
            onClick={handleStartRename}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '13px',
              color: 'var(--color-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(123, 198, 126, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span>✏️</span>
            <span>重命名</span>
          </button>

          <button
            className="btn-ripple"
            onClick={handleMergeLayers}
            disabled={!selectedLayerId || selectedLayerId === contextMenu.layerId}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: 'transparent',
              borderRadius: '6px',
              cursor:
                !selectedLayerId || selectedLayerId === contextMenu.layerId
                  ? 'not-allowed'
                  : 'pointer',
              textAlign: 'left',
              fontSize: '13px',
              color:
                !selectedLayerId || selectedLayerId === contextMenu.layerId
                  ? 'var(--color-text-light)'
                  : 'var(--color-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity:
                !selectedLayerId || selectedLayerId === contextMenu.layerId ? 0.5 : 1,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (selectedLayerId && selectedLayerId !== contextMenu.layerId) {
                e.currentTarget.style.background = 'rgba(123, 198, 126, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span>🔗</span>
            <span>合并选中图层</span>
          </button>

          <div
            style={{
              height: '1px',
              background: 'var(--color-warm-gray-dark)',
              margin: '4px 2px',
            }}
          />

          <button
            className="btn-ripple"
            onClick={handleDeleteLayer}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '13px',
              color: '#E74C3C',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(231, 76, 60, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span>🗑️</span>
            <span>删除图层</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(LayerManager);
