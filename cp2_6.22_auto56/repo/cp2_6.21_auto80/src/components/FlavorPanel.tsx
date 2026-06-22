import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore, FLAVORS } from '../store/useStore';
import ChocolatePreview from './ChocolatePreview';

const SHAPE_LABELS: Record<string, string> = {
  circle: '圆形',
  square: '方形',
  heart: '心形',
  shell: '贝壳形',
};

const TEXTURE_LABELS: Record<string, string> = {
  matte: '哑光',
  glossy: '亮面',
  'crushed-nuts': '碎坚果',
  'gold-foil': '金箔',
};

interface SortableChocolateItemProps {
  chocolate: any;
  flavor: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

function SortableChocolateItem({
  chocolate,
  flavor,
  isSelected,
  onSelect,
  onRemove,
}: SortableChocolateItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chocolate.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    transformOrigin: 'center center',
    scale: isDragging ? 1.05 : undefined,
    boxShadow: isDragging ? '0 8px 24px rgba(212,175,55,0.4)' : undefined,
    width: '120px',
    height: '100px',
    border: isSelected ? '3px solid #D4AF37' : '1px solid #E0E0E0',
    borderRadius: '12px',
    background: '#FAFAFA',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
    transitionProperty: 'all',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '200ms',
    position: 'relative',
    userSelect: 'none',
    boxSizing: 'border-box' as const,
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(chocolate.id)}
    >
      <div style={{ width: '60px', height: '55px', pointerEvents: 'none' }}>
        <ChocolatePreview
          shape={chocolate.shape}
          color={chocolate.color}
          texture={chocolate.texture}
          size={0.8}
        />
      </div>
      <div style={{ fontSize: '11px', color: '#616161', marginTop: '2px', pointerEvents: 'none' }}>
        {flavor?.icon} {flavor?.name}
      </div>
      <div
        onClick={(e) => {
          e.stopPropagation();
          onRemove(chocolate.id);
        }}
        style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: '#EF5350',
          color: '#FFF',
          fontSize: '12px',
          lineHeight: '18px',
          textAlign: 'center',
          cursor: 'pointer',
          fontWeight: 700,
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          pointerEvents: 'auto',
        }}
      >
        ×
      </div>
    </div>
  );
}

interface DroppableSlotProps {
  id: string;
  index: number;
}

function DroppableSlot({ id, index }: DroppableSlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        width: '120px',
        height: '100px',
        border: isOver ? '2px dashed #D4AF37' : '2px dashed #BDBDBD',
        borderRadius: '12px',
        background: isOver ? '#FFF8E7' : '#FAFAFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        color: isOver ? '#D4AF37' : '#BDBDBD',
        transition: 'all 0.2s',
      }}
    >
      +
    </div>
  );
}

export default function FlavorPanel() {
  const selectedChocolates = useStore((s) => s.selectedChocolates);
  const selectedChocolateId = useStore((s) => s.selectedChocolateId);
  const addChocolate = useStore((s) => s.addChocolate);
  const removeChocolate = useStore((s) => s.removeChocolate);
  const swapChocolates = useStore((s) => s.swapChocolates);
  const selectChocolate = useStore((s) => s.selectChocolate);
  const reorderChocolates = useStore((s) => s.reorderChocolates);

  const [tooltipId, setTooltipId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleFlavorClick = useCallback(
    (flavorId: string) => {
      const alreadyAdded = selectedChocolates.some((c) => c.flavorId === flavorId);
      if (alreadyAdded) {
        setTooltipId(flavorId);
        setTimeout(() => setTooltipId(null), 1500);
        return;
      }
      if (selectedChocolates.length < 6) {
        addChocolate(flavorId);
      }
    },
    [selectedChocolates, addChocolate]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const activeIdStr = active.id as string;
      const overIdStr = over.id as string;

      if (overIdStr.startsWith('empty-')) {
        const targetIndex = parseInt(overIdStr.replace('empty-', ''), 10);
        const activeIndex = selectedChocolates.findIndex((c) => c.id === activeIdStr);
        if (activeIndex === -1) return;

        const newChocolates = [...selectedChocolates];
        const [removed] = newChocolates.splice(activeIndex, 1);
        const insertIndex = Math.min(targetIndex, newChocolates.length);
        newChocolates.splice(insertIndex, 0, removed);
        reorderChocolates(newChocolates);
      } else if (activeIdStr !== overIdStr) {
        const activeIndex = selectedChocolates.findIndex((c) => c.id === activeIdStr);
        const overIndex = selectedChocolates.findIndex((c) => c.id === overIdStr);
        if (activeIndex !== -1 && overIndex !== -1) {
          const newChocolates = arrayMove(selectedChocolates, activeIndex, overIndex);
          reorderChocolates(newChocolates);
        }
      }
    },
    [selectedChocolates, reorderChocolates]
  );

  const selectedFlavorIds = new Set(selectedChocolates.map((c) => c.flavorId));

  const slots: (any | null)[] = [];
  for (let i = 0; i < 6; i++) {
    slots.push(selectedChocolates[i] || null);
  }

  const selectedChocolate = selectedChocolates.find((c) => c.id === selectedChocolateId) || null;
  const activeChocolate = selectedChocolates.find((c) => c.id === activeId) || null;

  const flavorMap = new Map(FLAVORS.map((f) => [f.id, f]));
  const activeFlavor = activeChocolate ? flavorMap.get(activeChocolate.flavorId) : null;

  const panelStyle: React.CSSProperties = {
    width: isMobile ? '100%' : '360px',
    background: '#FAFAFA',
    backgroundImage:
      'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.01) 10px, rgba(0,0,0,0.01) 20px)',
    padding: '20px',
    overflowY: 'auto',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box' as const,
    height: '100vh',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 700,
    color: '#3E2723',
    marginBottom: '12px',
    letterSpacing: '0.5px',
  };

  const flavorGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
    gap: '8px',
    marginBottom: '8px',
  };

  const boxGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '8px',
  };

  const chocolateIds = selectedChocolates.map((c) => c.id);

  return (
    <div style={panelStyle}>
      <div style={sectionTitleStyle}>选择口味</div>
      <div style={flavorGridStyle}>
        {FLAVORS.map((flavor) => {
          const isSelected = selectedFlavorIds.has(flavor.id);
          const showTooltip = tooltipId === flavor.id;
          return (
            <div
              key={flavor.id}
              onClick={() => handleFlavorClick(flavor.id)}
              style={{
                background: isSelected ? '#FFF8E7' : '#FFFFFF',
                border: isSelected ? '2px solid #D4AF37' : '1px solid #E0E0E0',
                borderRadius: '12px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                userSelect: 'none',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>{flavor.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#3E2723' }}>
                {flavor.name}
              </div>
              <div style={{ fontSize: '12px', color: '#9E9E9E', marginTop: '2px' }}>
                {flavor.description}
              </div>
              {showTooltip && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-28px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#3E2723',
                    color: '#FFF',
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    animation: 'fadeIn 0.15s',
                  }}
                >
                  已添加
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div
        style={{
          fontSize: '13px',
          color: '#757575',
          textAlign: 'right',
          marginBottom: '24px',
        }}
      >
        已选 {selectedChocolates.length}/6 颗
      </div>

      <div style={sectionTitleStyle}>礼盒预览</div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={chocolateIds} strategy={rectSortingStrategy}>
          <div style={boxGridStyle}>
            {slots.map((chocolate, idx) => {
              if (!chocolate) {
                return <DroppableSlot key={`empty-${idx}`} id={`empty-${idx}`} index={idx} />;
              }

              const flavor = flavorMap.get(chocolate.flavorId);
              const isSelectedSlot = chocolate.id === selectedChocolateId;

              return (
                <SortableChocolateItem
                  key={chocolate.id}
                  chocolate={chocolate}
                  flavor={flavor}
                  isSelected={isSelectedSlot}
                  onSelect={selectChocolate}
                  onRemove={removeChocolate}
                />
              );
            })}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeChocolate && activeFlavor && (
            <div
              style={{
                width: '120px',
                height: '100px',
                border: '3px solid #D4AF37',
                borderRadius: '12px',
                background: '#FAFAFA',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 32px rgba(212,175,55,0.5)',
                transform: 'scale(1.1)',
                pointerEvents: 'none',
              }}
            >
              <div style={{ width: '60px', height: '55px' }}>
                <ChocolatePreview
                  shape={activeChocolate.shape}
                  color={activeChocolate.color}
                  texture={activeChocolate.texture}
                  size={0.8}
                />
              </div>
              <div style={{ fontSize: '11px', color: '#616161', marginTop: '2px' }}>
                {activeFlavor.icon} {activeFlavor.name}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedChocolate && (
        <div style={{ marginTop: '24px' }}>
          <div style={sectionTitleStyle}>放大预览</div>
          <div
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '16px',
              background: '#FFFFFF',
              border: '1px solid #E0E0E0',
              margin: '0 auto',
              overflow: 'hidden',
            }}
          >
            <ChocolatePreview
              shape={selectedChocolate.shape}
              color={selectedChocolate.color}
              texture={selectedChocolate.texture}
              size={1.2}
            />
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#3E2723' }}>
              {flavorMap.get(selectedChocolate.flavorId)?.icon}{' '}
              {flavorMap.get(selectedChocolate.flavorId)?.name}
            </div>
            <div style={{ fontSize: '13px', color: '#757575', marginTop: '4px' }}>
              {SHAPE_LABELS[selectedChocolate.shape] || selectedChocolate.shape} ·{' '}
              {TEXTURE_LABELS[selectedChocolate.texture] || selectedChocolate.texture}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
