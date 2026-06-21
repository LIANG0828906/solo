import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import { Trash2 } from 'lucide-react';
import { useEditorStore } from '../store';
import { ShapeIcon } from './ShapeIcon';

interface LayerPanelProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const LayerPanel = ({ collapsed, onToggle }: LayerPanelProps) => {
  const layers = useEditorStore((s) => s.layers);
  const selectedId = useEditorStore((s) => s.selectedLayerId);
  const selectLayer = useEditorStore((s) => s.selectLayer);
  const removeLayer = useEditorStore((s) => s.removeLayer);
  const reorderLayers = useEditorStore((s) => s.reorderLayers);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderLayers(result.source.index, result.destination.index);
  };

  return (
    <div className={`panel layer-panel ${collapsed ? 'collapsed' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="panel-title" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
          图层 ({layers.length})
        </div>
        {onToggle && (
          <button className="mobile-drawer-toggle" onClick={onToggle} aria-label="toggle">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="panel-content" style={{ marginTop: 16 }}>
        {layers.length === 0 ? (
          <div className="empty-layers">暂无图层，点击左侧形状添加</div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="layers">
              {(provided) => (
                <div className="layers-list" ref={provided.innerRef} {...provided.droppableProps}>
                  {[...layers].reverse().map((layer, displayIdx) => {
                    const realIdx = layers.length - 1 - displayIdx;
                    const isSelected = selectedId === layer.id;
                    return (
                      <Draggable key={layer.id} draggableId={layer.id} index={realIdx}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`layer-item ${isSelected ? 'selected' : ''} ${snapshot.isDragging ? 'dragging' : ''}`}
                            onClick={() => selectLayer(layer.id)}
                          >
                            <div className="layer-thumb">
                              <ShapeIcon
                                shape={layer.shape}
                                fill={layer.fillColor}
                                stroke={layer.strokeColor}
                                strokeWidth={layer.strokeWidth / 2}
                                size={28}
                              />
                            </div>
                            <div className="layer-info">
                              <div className="layer-name">{layer.shape}</div>
                              <div className="layer-summary">
                                <span className="layer-color-dot" style={{ background: layer.fillColor }} />
                                <span className="layer-tag">×{layer.scale.toFixed(1)}</span>
                                <span className="layer-tag">{layer.radialDistance}px</span>
                                <span className="layer-tag">{layer.rotation}°</span>
                              </div>
                            </div>
                            <button
                              className="layer-remove"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeLayer(layer.id);
                              }}
                              aria-label="delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
};
