import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useLayerStore } from '../store/layerStore';
import { LayerItem } from './LayerItem';
import { MAX_LAYERS } from '../types';

export const LayerPanel: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    layers,
    selectedLayerId,
    selectLayer,
    deleteLayer,
    reorderLayers
  } = useLayerStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = layers.findIndex(l => l.id === active.id);
      const newIndex = layers.findIndex(l => l.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderLayers(oldIndex, newIndex);
      }
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const panelWidth = isMobile ? (isSidebarOpen ? '280px' : '40px') : (isCollapsed ? '40px' : '280px');

  return (
    <>
      <div
        className={`layer-panel ${isCollapsed ? 'collapsed' : ''} ${isMobile && isSidebarOpen ? 'mobile-open' : ''}`}
        style={{ width: panelWidth }}
      >
        {!isCollapsed && !isMobile ? (
          <>
            <div className="panel-header">
              <h3>图层</h3>
              <span className="layer-count">{layers.length}/{MAX_LAYERS}</span>
            </div>
            <button className="collapse-btn" onClick={toggleSidebar} title="折叠面板">
              <span className="material-icons">chevron_left</span>
            </button>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={layers.map(l => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="layer-list">
                  {layers.length === 0 ? (
                    <div className="empty-layers">
                      <span className="material-icons">layers</span>
                      <p>暂无图层</p>
                      <p className="hint">在画布上拖拽绘制形状</p>
                    </div>
                  ) : (
                    layers.map((layer, index) => (
                      <LayerItem
                        key={layer.id}
                        layer={layer}
                        isSelected={selectedLayerId === layer.id}
                        onSelect={() => selectLayer(layer.id)}
                        onDelete={() => deleteLayer(layer.id)}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </>
        ) : isMobile ? (
          <>
            {!isSidebarOpen ? (
              <button className="mobile-toggle-btn" onClick={toggleSidebar} title="展开面板">
                <span className="material-icons">layers</span>
              </button>
            ) : (
              <>
                <div className="panel-header">
                  <h3>图层</h3>
                  <button className="collapse-btn" onClick={toggleSidebar}>
                    <span className="material-icons">close</span>
                  </button>
                </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={layers.map(l => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="layer-list">
                      {layers.length === 0 ? (
                        <div className="empty-layers">
                          <span className="material-icons">layers</span>
                          <p>暂无图层</p>
                        </div>
                      ) : (
                        layers.map((layer) => (
                          <LayerItem
                            key={layer.id}
                            layer={layer}
                            isSelected={selectedLayerId === layer.id}
                            onSelect={() => {
                              selectLayer(layer.id);
                              toggleSidebar();
                            }}
                            onDelete={() => deleteLayer(layer.id)}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )}
          </>
        ) : (
          <button className="collapse-btn" onClick={toggleSidebar} title="展开面板">
            <span className="material-icons">chevron_right</span>
          </button>
        )}
      </div>
      {isMobile && isSidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}
    </>
  );
};
