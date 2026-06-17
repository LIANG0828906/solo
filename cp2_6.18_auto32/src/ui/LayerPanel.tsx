import React, { useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useStore, ComponentData, COMPONENT_COLORS } from '../store';
import { useNesting } from '../modules/dragNest';

interface LayerNodeProps {
  component: ComponentData;
  depth: number;
  allComponents: ComponentData[];
}

const LayerNode: React.FC<LayerNodeProps> = ({ component, depth, allComponents }) => {
  const highlightedComponentId = useStore(s => s.highlightedComponentId);
  const setHighlight = useStore(s => s.setHighlight);
  const setSelected = useStore(s => s.setSelected);
  const selectedComponentId = useStore(s => s.selectedComponentId);
  const removeComponent = useStore(s => s.removeComponent);

  const isHighlighted = highlightedComponentId === component.id;
  const isSelected = selectedComponentId === component.id;
  const borderColor = COMPONENT_COLORS[component.type];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(component.id);
    setHighlight(component.id);
  };

  const handleMouseEnter = () => setHighlight(component.id);
  const handleMouseLeave = () => {
    if (highlightedComponentId === component.id) setHighlight(null);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        padding: '6px 10px',
        paddingLeft: 10 + depth * 16,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: isSelected
          ? 'rgba(33,150,243,0.15)'
          : isHighlighted
          ? 'rgba(255,255,255,0.05)'
          : 'transparent',
        borderLeft: isHighlighted ? '2px dashed #FF6B6B' : '2px solid transparent',
        transition: 'background 0.15s ease',
        fontSize: 12,
      }}
    >
      <div style={{
        width: 10,
        height: 10,
        borderRadius: 2,
        background: borderColor,
        flexShrink: 0,
      }} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {component.label}
      </span>
      <span style={{ fontSize: 9, color: '#666' }}>
        z:{component.zIndex}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); removeComponent(component.id); }}
        style={{
          background: 'none',
          border: 'none',
          color: '#F44336',
          cursor: 'pointer',
          fontSize: 12,
          padding: '0 2px',
          opacity: 0.5,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
      >
        ✕
      </button>
    </div>
  );
};

export const LayerPanel: React.FC = () => {
  const components = useStore(s => s.components);
  const rightPanelCollapsed = useStore(s => s.rightPanelCollapsed);
  const toggleRightPanel = useStore(s => s.toggleRightPanel);
  const reorderChildren = useStore(s => s.reorderChildren);

  const getChildren = (parentId: string | null): ComponentData[] => {
    if (parentId === null) {
      return components.filter(c => c.parentId === null).sort((a, b) => a.zIndex - b.zIndex);
    }
    const parent = components.find(c => c.id === parentId);
    if (!parent) return [];
    return parent.childrenOrder
      .map(id => components.find(c => c.id === id))
      .filter((c): c is ComponentData => !!c);
  };

  const renderTree = (parentId: string | null, depth: number): React.ReactNode => {
    const children = getChildren(parentId);
    return children.map(comp => (
      <div key={comp.id}>
        <LayerNode component={comp} depth={depth} allComponents={components} />
        {comp.type === 'container' && comp.childrenOrder.length > 0 && (
          <Droppable droppableId={`layer-${comp.id}`} type={`CHILDREN-${comp.id}`}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {comp.childrenOrder.map((childId, index) => {
                  const child = components.find(c => c.id === childId);
                  if (!child) return null;
                  return (
                    <Draggable key={childId} draggableId={`layer-${childId}`} index={index}>
                      {(prov) => (
                        <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                          <LayerNode component={child} depth={depth + 1} allComponents={components} />
                          {child.type === 'container' && child.childrenOrder.length > 0 && renderTree(child.id, depth + 2)}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
      </div>
    ));
  };

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const droppableId = result.source.droppableId;
    if (droppableId.startsWith('layer-')) {
      const parentId = droppableId.replace('layer-', '');
      reorderChildren(parentId, result.source.index, result.destination.index);
    }
  }, [reorderChildren]);

  return (
    <div
      className="panel-slide-right"
      style={{
        width: rightPanelCollapsed ? 44 : 240,
        background: '#2A2A3E',
        borderRadius: 12,
        border: '1px solid #4A4A5E',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease-out',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        onClick={toggleRightPanel}
        style={{
          padding: '12px 12px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #4A4A5E',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
          {rightPanelCollapsed ? '▶' : 'Layers'}
        </span>
        {!rightPanelCollapsed && <span style={{ fontSize: 11 }}>▼</span>}
      </div>

      {!rightPanelCollapsed && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="layer-root" type="CHILDREN-root">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '4px 0',
                  minHeight: 0,
                }}
              >
                {getChildren(null).map((comp, index) => (
                  <Draggable key={comp.id} draggableId={`layer-${comp.id}`} index={index}>
                    {(prov) => (
                      <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                        <LayerNode component={comp} depth={0} allComponents={components} />
                        {comp.type === 'container' && comp.childrenOrder.length > 0 && renderTree(comp.id, 1)}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {components.length === 0 && (
                  <div style={{ padding: '20px 10px', textAlign: 'center', color: '#666', fontSize: 12 }}>
                    No components yet. Drag from the left panel.
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
};
