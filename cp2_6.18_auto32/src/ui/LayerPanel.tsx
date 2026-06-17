import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useStore, ComponentData, COMPONENT_COLORS } from '../store';
import { useNesting } from '../modules/dragNest';

interface LayerNodeProps {
  component: ComponentData;
  depth: number;
  allComponents: ComponentData[];
  searchTerm: string;
  isHighlightedSearch: boolean;
  hasVisibleDescendant: boolean;
}

const LayerNode: React.FC<LayerNodeProps> = ({
  component,
  depth,
  allComponents,
  searchTerm,
  isHighlightedSearch,
  hasVisibleDescendant,
}) => {
  const highlightedComponentId = useStore(s => s.highlightedComponentId);
  const setHighlight = useStore(s => s.setHighlight);
  const setSelected = useStore(s => s.setSelected);
  const selectedComponentId = useStore(s => s.selectedComponentId);
  const removeComponent = useStore(s => s.removeComponent);

  const isHighlighted = highlightedComponentId === component.id;
  const isSelected = selectedComponentId === component.id;
  const borderColor = COMPONENT_COLORS[component.type];

  const hasSearch = searchTerm.trim().length > 0;
  const isDimmed = hasSearch && !isHighlightedSearch && !hasVisibleDescendant;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(component.id);
    setHighlight(component.id);
  };

  const handleMouseEnter = () => setHighlight(component.id);
  const handleMouseLeave = () => {
    if (highlightedComponentId === component.id) setHighlight(null);
  };

  const renderLabel = () => {
    if (!isHighlightedSearch || !searchTerm.trim()) {
      return component.label;
    }
    const lowerLabel = component.label.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();
    const idx = lowerLabel.indexOf(lowerSearch);
    if (idx === -1) return component.label;
    return (
      <>
        {component.label.slice(0, idx)}
        <span style={{ background: '#FFF9C4', color: '#333', padding: '0 2px', borderRadius: 2, fontWeight: 600 }}>
          {component.label.slice(idx, idx + searchTerm.length)}
        </span>
        {component.label.slice(idx + searchTerm.length)}
      </>
    );
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
        display: isDimmed ? 'none' : 'flex',
        alignItems: 'center',
        gap: 8,
        background: isSelected
          ? 'rgba(33,150,243,0.15)'
          : isHighlighted
          ? 'rgba(255,255,255,0.05)'
          : isHighlightedSearch
          ? 'rgba(255,249,196,0.15)'
          : 'transparent',
        borderLeft: isHighlighted ? '2px dashed #FF6B6B' : '2px solid transparent',
        transition: 'background 0.15s ease, opacity 0.2s ease',
        fontSize: 12,
        opacity: isDimmed ? 0.3 : 1,
      }}>
      <div style={{
        width: 10,
        height: 10,
        borderRadius: 2,
        background: borderColor,
        flexShrink: 0,
      }} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {renderLabel()}
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
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const searchMatches = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return { matches: new Set<string>(), visible: new Set<string>() };
    const matches = new Set<string>();
    const visible = new Set<string>();

    const checkComponent = (comp: ComponentData): boolean => {
      const selfMatch = comp.label.toLowerCase().includes(term);
      if (selfMatch) {
        matches.add(comp.id);
        visible.add(comp.id);
        return true;
      }
      if (comp.type === 'container') {
        const children = comp.childrenOrder
          .map(cid => components.find(c => c.id === cid))
          .filter((c): c is ComponentData => !!c);
        const hasChildMatch = children.some(child => checkComponent(child));
        if (hasChildMatch) {
          visible.add(comp.id);
          return true;
        }
      }
      return false;
    };

    components.filter(c => c.parentId === null).forEach(checkComponent);
    return { matches, visible };
  }, [components, searchTerm]);

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

  const hasSearch = searchTerm.trim().length > 0;

  const renderTree = (parentId: string | null, depth: number): React.ReactNode => {
    const children = getChildren(parentId);
    return children.map(comp => {
      const isMatch = searchMatches.matches.has(comp.id);
      const hasVisible = searchMatches.visible.has(comp.id);
      if (hasSearch && !isMatch && !hasVisible) return null;
      return (
        <div key={comp.id}>
          <LayerNode
            component={comp}
            depth={depth}
            allComponents={components}
            searchTerm={searchTerm}
            isHighlightedSearch={isMatch}
            hasVisibleDescendant={hasVisible}
          />
          {comp.type === 'container' && comp.childrenOrder.length > 0 && (
            <Droppable droppableId={`layer-${comp.id}`} type={`CHILDREN-${comp.id}`}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {comp.childrenOrder.map((childId, index) => {
                    const child = components.find(c => c.id === childId);
                    if (!child) return null;
                    const childIsMatch = searchMatches.matches.has(child.id);
                    const childHasVisible = searchMatches.visible.has(child.id);
                    if (hasSearch && !childIsMatch && !childHasVisible) return null;
                    return (
                      <Draggable key={childId} draggableId={`layer-${childId}`} index={index}>
                        {(prov) => (
                          <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                            <LayerNode
                              component={child}
                              depth={depth + 1}
                              allComponents={components}
                              searchTerm={searchTerm}
                              isHighlightedSearch={childIsMatch}
                              hasVisibleDescendant={childHasVisible}
                            />
                            {child.type === 'container' && child.childrenOrder.length > 0 &&
                              renderTree(child.id, depth + 2)
                            }
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
      );
    });
  };

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const droppableId = result.source.droppableId;
    if (droppableId.startsWith('layer-')) {
      const parentId = droppableId.replace('layer-', '');
      reorderChildren(parentId, result.source.index, result.destination.index);
    }
  }, [reorderChildren]);

  const rootChildren = getChildren(null);
  const hasComponents = rootChildren.length > 0;
  const visibleCount = hasSearch
    ? rootChildren.filter(c => searchMatches.matches.has(c.id) || searchMatches.visible.has(c.id)).length
    : rootChildren.length;

  return (
    <div
      className="panel-slide-right"
      style={{
        width: rightPanelCollapsed ? 44 : 260,
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
        {!rightPanelCollapsed && (
          <span style={{ fontSize: 11, color: '#A0A0B0' }}>
            {components.length} items
          </span>
        )}
      </div>

      {!rightPanelCollapsed && (
        <div style={{ padding: '8px 10px', borderBottom: '1px solid #4A4A5E', flexShrink: 0 }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}>
            <span style={{
              position: 'absolute',
              left: 8,
              fontSize: 12,
              color: '#666',
              pointerEvents: 'none',
            }}>
              🔍
            </span>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search layers..."
              style={{
                width: '100%',
                background: '#3A3A50',
                border: '1px solid #4A4A5E',
                borderRadius: 6,
                padding: '6px 10px 6px 26px',
                fontSize: 12,
                color: '#E0E0E0',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#64B5F6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#4A4A5E')}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: 6,
                  background: 'none',
                  border: 'none',
                  color: '#A0A0B0',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: '0 4px',
                }}
              >
                ✕
              </button>
            )}
          </div>
          {hasSearch && (
            <div style={{
              fontSize: 10,
              color: '#A0A0B0',
              marginTop: 4,
            }}>
              {searchMatches.matches.size} match{searchMatches.matches.size !== 1 ? 'es' : ''}
            </div>
          )}
        </div>
      )}

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
                {hasSearch ? (
                  <>{renderTree(null, 0)}</>
                ) : (
                  <>
                    {rootChildren.map((comp, index) => (
                      <Draggable key={comp.id} draggableId={`layer-${comp.id}`} index={index}>
                        {(prov) => (
                          <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                            <LayerNode
                              component={comp}
                              depth={0}
                              allComponents={components}
                              searchTerm=""
                              isHighlightedSearch={false}
                              hasVisibleDescendant={false}
                            />
                            {comp.type === 'container' && comp.childrenOrder.length > 0 &&
                              renderTree(comp.id, 1)
                            }
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </>
                )}
                {provided.placeholder}
                {!hasComponents && (
                  <div style={{ padding: '20px 10px', textAlign: 'center', color: '#666', fontSize: 12 }}>
                    No components yet. Drag from the left panel.
                  </div>
                )}
                {hasSearch && visibleCount === 0 && components.length > 0 && (
                  <div style={{ padding: '20px 10px', textAlign: 'center', color: '#666', fontSize: 12 }}>
                    No matches for "{searchTerm}"
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
