import React, { useState, useCallback } from 'react';
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

export default function FlavorPanel() {
  const selectedChocolates = useStore((s) => s.selectedChocolates);
  const selectedChocolateId = useStore((s) => s.selectedChocolateId);
  const addChocolate = useStore((s) => s.addChocolate);
  const removeChocolate = useStore((s) => s.removeChocolate);
  const swapChocolates = useStore((s) => s.swapChocolates);
  const selectChocolate = useStore((s) => s.selectChocolate);

  const [tooltipId, setTooltipId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

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

  const handleDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData('text/plain', id);
      setDraggedId(id);
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      const dragged = e.dataTransfer.getData('text/plain');
      if (dragged && dragged !== targetId) {
        swapChocolates(dragged, targetId);
      }
      setDraggedId(null);
    },
    [swapChocolates]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  const selectedFlavorIds = new Set(selectedChocolates.map((c) => c.flavorId));

  const slots: (typeof selectedChocolates[number] | null)[] = [];
  for (let i = 0; i < 6; i++) {
    slots.push(selectedChocolates[i] || null);
  }

  const selectedChocolate = selectedChocolates.find((c) => c.id === selectedChocolateId) || null;

  const flavorMap = new Map(FLAVORS.map((f) => [f.id, f]));

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
      <div style={boxGridStyle}>
        {slots.map((chocolate, idx) => {
          if (!chocolate) {
            return (
              <div
                key={`empty-${idx}`}
                style={{
                  width: '120px',
                  height: '100px',
                  border: '2px dashed #BDBDBD',
                  borderRadius: '12px',
                  background: '#FAFAFA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: '#BDBDBD',
                }}
              >
                +
              </div>
            );
          }

          const flavor = flavorMap.get(chocolate.flavorId);
          const isDragged = draggedId === chocolate.id;
          const isSelectedSlot = chocolate.id === selectedChocolateId;

          return (
            <div
              key={chocolate.id}
              draggable
              onDragStart={(e) => handleDragStart(e, chocolate.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, chocolate.id)}
              onDragEnd={handleDragEnd}
              onClick={() => selectChocolate(chocolate.id)}
              style={{
                width: '120px',
                height: '100px',
                border: isSelectedSlot ? '3px solid #D4AF37' : '1px solid #E0E0E0',
                borderRadius: '12px',
                background: '#FAFAFA',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                transform: isSelectedSlot ? 'scale(1.05)' : 'scale(1)',
                opacity: isDragged ? 0.5 : 1,
                position: 'relative',
                userSelect: 'none',
                boxSizing: 'border-box' as const,
              }}
            >
              <div style={{ width: '60px', height: '55px' }}>
                <ChocolatePreview
                  shape={chocolate.shape}
                  color={chocolate.color}
                  texture={chocolate.texture}
                  size={0.8}
                />
              </div>
              <div style={{ fontSize: '11px', color: '#616161', marginTop: '2px' }}>
                {flavor?.icon} {flavor?.name}
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  removeChocolate(chocolate.id);
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
                }}
              >
                ×
              </div>
            </div>
          );
        })}
      </div>

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
