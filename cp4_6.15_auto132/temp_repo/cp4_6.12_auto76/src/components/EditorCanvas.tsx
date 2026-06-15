import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEditorStore } from '../store/editorStore';
import { ComponentPalette } from './ComponentPalette';
import { PropertyPanel } from './PropertyPanel';
import { ComponentRenderer } from './ComponentRenderer';
import type { LayoutComponent, ComponentType } from '../types';
import axios from 'axios';

interface SortableItemProps {
  component: LayoutComponent;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function SortableItem({ component, isSelected, onSelect, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: component.id,
    data: { type: component.type, fromPalette: false },
  });

  const [isRemoving, setIsRemoving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isRemoving ? 0 : 1,
    transformOrigin: 'center center',
    marginBottom: 12,
    position: 'relative',
    border: isSelected ? '2px solid #4a90d9' : '1px solid transparent',
    borderRadius: 8,
    backgroundColor: component.style.backgroundColor,
    transitionProperty: isRemoving
      ? 'opacity, transform'
      : transition
      ? transition
      : undefined,
    transitionDuration: isRemoving ? '0.2s' : undefined,
    animation: isRemoving ? 'none' : undefined,
    scale: isRemoving ? '0.8' : undefined,
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRemoving(true);
    setTimeout(() => {
      onRemove();
    }, 200);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div {...attributes} {...listeners} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
        <ComponentRenderer component={component} isEditor />
      </div>
      {showDelete && !isDragging && (
        <button
          onClick={handleRemove}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 77, 79, 0.9)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 'bold',
            lineHeight: 1,
            transition: 'background-color 0.2s',
            zIndex: 10,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ff4d4f')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 77, 79, 0.9)')}
        >
          ×
        </button>
      )}
    </div>
  );
}

interface DropPlaceholderProps {
  isActive: boolean;
}

function DropPlaceholder({ isActive }: DropPlaceholderProps) {
  return (
    <div
      style={{
        height: 120,
        border: `2px dashed ${isActive ? '#3a7bd5' : '#ccc'}`,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isActive ? '#3a7bd5' : '#999',
        fontSize: 14,
        marginBottom: 12,
        backgroundColor: isActive ? 'rgba(58, 123, 213, 0.05)' : 'transparent',
        transition: 'all 0.2s ease',
      }}
    >
      {isActive ? '释放添加组件' : '拖拽组件到此处'}
    </div>
  );
}

export function EditorCanvas() {
  const {
    components,
    addComponent,
    removeComponent,
    moveComponent,
    selectComponent,
    selectedComponentId,
    undo,
    redo,
    historyIndex,
    history,
    viewportMode,
    setViewportMode,
  } = useEditorStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<ComponentType | null>(null);
  const [fromPalette, setFromPalette] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 2000);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await axios.put('/api/store', { components });
      setTimeout(() => {
        setIsSaving(false);
        showToast('保存成功', 'success');
      }, 1000);
    } catch {
      setTimeout(() => {
        setIsSaving(false);
        showToast('保存失败', 'error');
      }, 1000);
    }
  }, [components, showToast]);

  const handlePreview = useCallback(() => {
    window.open('/store-preview', '_blank');
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveType((active.data.current as { type?: ComponentType }).type || null);
    setFromPalette((active.data.current as { fromPalette?: boolean }).fromPalette || false);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    if (fromPalette) return;

    if (activeIdStr !== overIdStr) {
      const oldIndex = components.findIndex((c) => c.id === activeIdStr);
      const newIndex = components.findIndex((c) => c.id === overIdStr);
      if (oldIndex !== -1 && newIndex !== -1) {
        moveComponent(oldIndex, newIndex);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (fromPalette && activeType) {
      let insertIndex = components.length;
      if (over) {
        const overIdStr = over.id as string;
        if (overIdStr === 'canvas-drop-zone') {
          insertIndex = components.length;
        } else {
          const idx = components.findIndex((c) => c.id === overIdStr);
          insertIndex = idx !== -1 ? idx : components.length;
        }
      }
      addComponent(activeType, insertIndex);
    }

    setActiveId(null);
    setActiveType(null);
    setFromPalette(false);
  };

  const activeComponent = activeId && !fromPalette ? components.find((c) => c.id === activeId) : null;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <ComponentPalette />

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f0f2f5',
            overflow: 'hidden',
          }}
          onClick={() => selectComponent(null)}
        >
          <div
            style={{
              padding: '12px 24px',
              backgroundColor: '#fff',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexShrink: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              style={{
                padding: '8px 16px',
                backgroundColor: historyIndex <= 0 ? '#ccc' : '#f5f5f5',
                color: historyIndex <= 0 ? '#999' : '#333',
                border: '1px solid #ddd',
                borderRadius: 8,
                cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer',
                fontSize: 13,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (historyIndex > 0) {
                  e.currentTarget.style.filter = 'brightness(1.1)';
                }
              }}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              ↶ 撤销
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              style={{
                padding: '8px 16px',
                backgroundColor: historyIndex >= history.length - 1 ? '#ccc' : '#f5f5f5',
                color: historyIndex >= history.length - 1 ? '#999' : '#333',
                border: '1px solid #ddd',
                borderRadius: 8,
                cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer',
                fontSize: 13,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (historyIndex < history.length - 1) {
                  e.currentTarget.style.filter = 'brightness(1.1)';
                }
              }}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              ↷ 重做
            </button>

            <div style={{ flex: 1 }} />

            <div
              style={{
                display: 'flex',
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid #ddd',
              }}
            >
              <button
                onClick={() => setViewportMode('mobile')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: viewportMode === 'mobile' ? '#3a7bd5' : '#fff',
                  color: viewportMode === 'mobile' ? '#fff' : '#333',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'all 0.2s ease',
                }}
              >
                📱 手机
              </button>
              <button
                onClick={() => setViewportMode('desktop')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: viewportMode === 'desktop' ? '#3a7bd5' : '#fff',
                  color: viewportMode === 'desktop' ? '#fff' : '#333',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'all 0.2s ease',
                }}
              >
                💻 电脑
              </button>
            </div>

            <button
              onClick={handlePreview}
              style={{
                padding: '8px 20px',
                backgroundColor: '#fff',
                color: '#3a7bd5',
                border: '1px solid #3a7bd5',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.1)';
                e.currentTarget.style.backgroundColor = '#e8f0fe';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
                e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              👁 预览
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '8px 24px',
                backgroundColor: isSaving ? '#7aa8e8' : '#3a7bd5',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSaving) e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              {isSaving && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }}
                />
              )}
              {isSaving ? '保存中' : '💾 保存'}
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: 24,
              display: 'flex',
              justifyContent: viewportMode === 'mobile' ? 'center' : 'flex-start',
              alignItems: 'flex-start',
            }}
          >
            <div
              id="canvas-drop-zone"
              style={{
                width: viewportMode === 'mobile' ? 375 : '100%',
                minWidth: viewportMode === 'mobile' ? 375 : 600,
                maxWidth: viewportMode === 'mobile' ? 375 : 'none',
                backgroundColor: '#f8f9fa',
                borderRadius: 12,
                padding: 16,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                minHeight: '100%',
                border: viewportMode === 'mobile' ? '8px solid #333' : 'none',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  textAlign: 'center',
                  padding: '16px 0 24px',
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#3a7bd5',
                  borderBottom: '1px dashed #ddd',
                  marginBottom: 16,
                }}
              >
                🏪 我的店铺
              </div>

              <SortableContext items={components.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                {components.map((comp) => (
                  <div key={comp.id} style={{ position: 'relative' }}>
                    <SortableItem
                      component={comp}
                      isSelected={selectedComponentId === comp.id}
                      onSelect={() => selectComponent(comp.id)}
                      onRemove={() => removeComponent(comp.id)}
                    />
                    <div
                      style={{
                        borderTop: '1px dashed #ddd',
                        margin: '-4px 0 12px',
                      }}
                    />
                  </div>
                ))}
              </SortableContext>

              {fromPalette && <DropPlaceholder isActive={!!activeId} />}

              {components.length === 0 && !fromPalette && (
                <div
                  style={{
                    padding: 60,
                    textAlign: 'center',
                    color: '#999',
                    fontSize: 14,
                    border: '2px dashed #ddd',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
                  <div>从左侧拖拽组件到此处开始装修店铺</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeComponent ? (
            <div style={{ opacity: 0.8, width: 300 }}>
              <ComponentRenderer component={activeComponent} isEditor />
            </div>
          ) : fromPalette && activeType ? (
            <div
              style={{
                width: 120,
                height: 90,
                borderRadius: 8,
                backgroundColor: '#3a7bd5',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.9,
                fontSize: 13,
              }}
            >
              <span style={{ fontSize: 28 }}>
                {activeType === 'banner' ? '🖼️' : activeType === 'product-grid' ? '🛍️' : '🎫'}
              </span>
              <span style={{ marginTop: 6 }}>
                {activeType === 'banner' ? '横幅' : activeType === 'product-grid' ? '商品网格' : '优惠券'}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <PropertyPanel />

      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            backgroundColor: toast.type === 'success' ? '#52c41a' : '#ff4d4f',
            color: '#fff',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: 14,
            fontWeight: 500,
            zIndex: 9999,
            animation: 'fadeInDown 0.3s ease',
          }}
        >
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
