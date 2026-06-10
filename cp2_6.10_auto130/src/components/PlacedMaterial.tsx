import React, { useCallback, useRef, useEffect, useState, memo } from 'react';
import { PlacedMaterial as PlacedMaterialType, Material, ResizeHandle } from '../types';
import { useAppStore } from '../store';
import { useDrag } from '../hooks/useDrag';
import { snapToGrid } from '../utils/colorUtils';

interface PlacedMaterialProps {
  placed: PlacedMaterialType;
  material: Material;
  gridSize: number;
  snapDistance: number;
  gridEnabled: boolean;
  paperSize: { width: number; height: number };
}

const RESIZE_HANDLES: ResizeHandle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

const HANDLE_POSITIONS: Record<ResizeHandle, { top: string; left: string; transform: string }> = {
  n: { top: '-4px', left: '50%', transform: 'translateX(-50%)' },
  s: { top: 'calc(100% - 4px)', left: '50%', transform: 'translateX(-50%)' },
  e: { top: '50%', left: 'calc(100% - 4px)', transform: 'translateY(-50%)' },
  w: { top: '50%', left: '-4px', transform: 'translateY(-50%)' },
  ne: { top: '-4px', left: 'calc(100% - 4px)', transform: 'translate(0, 0)' },
  nw: { top: '-4px', left: '-4px', transform: 'translate(0, 0)' },
  se: { top: 'calc(100% - 4px)', left: 'calc(100% - 4px)', transform: 'translate(0, 0)' },
  sw: { top: 'calc(100% - 4px)', left: '-4px', transform: 'translate(0, 0)' },
};

const MATERIAL_SIZE = 60;

export const PlacedMaterial: React.FC<PlacedMaterialProps> = memo(function PlacedMaterial({
  placed,
  material,
  gridSize,
  snapDistance,
  gridEnabled,
  paperSize,
}) {
  const { selectedId, selectMaterial, updateMaterial } = useAppStore();
  const isSelected = selectedId === placed.id;
  const materialRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(false);
  const rotateStartAngleRef = useRef(0);
  const rotateStartMouseAngleRef = useRef(0);

  const handleDragMove = useCallback(
    (position: { x: number; y: number }) => {
      let { x, y } = position;
      if (gridEnabled) {
        const snapped = snapToGrid(x, y, gridSize, snapDistance);
        x = snapped.x;
        y = snapped.y;
      }
      updateMaterial(placed.id, { x, y });
    },
    [placed.id, updateMaterial, gridEnabled, gridSize, snapDistance]
  );

  const { handlers: dragHandlers, isDragging } = useDrag({
    initialPosition: { x: placed.x, y: placed.y },
    onDragMove: handleDragMove,
    constraints: {
      minX: -MATERIAL_SIZE / 2,
      maxX: paperSize.width - MATERIAL_SIZE / 2,
      minY: -MATERIAL_SIZE / 2,
      maxY: paperSize.height - MATERIAL_SIZE / 2,
    },
  });

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      selectMaterial(placed.id);
    },
    [placed.id, selectMaterial]
  );

  const handleResizeStart = useCallback(
    (handle: ResizeHandle, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startY = e.clientY;
      const startScale = placed.scale;
      const startWidth = MATERIAL_SIZE * startScale;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        let scaleFactor = 1;
        switch (handle) {
          case 'n':
          case 's':
            scaleFactor = 1 + dy / startWidth;
            break;
          case 'e':
          case 'w':
            scaleFactor = 1 + dx / startWidth;
            break;
          case 'ne':
          case 'sw':
            scaleFactor = 1 + (dx + dy) / (startWidth * 1.414);
            break;
          case 'nw':
          case 'se':
            scaleFactor = 1 + (-dx + dy) / (startWidth * 1.414);
            break;
        }

        const newScale = Math.max(0.5, Math.min(3, startScale * scaleFactor));
        updateMaterial(placed.id, { scale: newScale });
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [placed.id, placed.scale, updateMaterial]
  );

  useEffect(() => {
    if (!isRotating) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!materialRef.current) return;
      const rect = materialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      const angleDiff = mouseAngle - rotateStartMouseAngleRef.current;
      let newAngle = rotateStartAngleRef.current + angleDiff;

      if (newAngle < 0) newAngle += 360;
      if (newAngle >= 360) newAngle -= 360;

      newAngle = Math.round(newAngle);
      updateMaterial(placed.id, { angle: newAngle });
    };

    const handleMouseUp = () => {
      setIsRotating(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isRotating, placed.id, updateMaterial]);

  const handleRotateStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsRotating(true);

      if (materialRef.current) {
        const rect = materialRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        rotateStartMouseAngleRef.current =
          Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      }
      rotateStartAngleRef.current = placed.angle;
    },
    [placed.angle]
  );

  const handleRotateClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isRotating) {
        const newAngle = (placed.angle + 15) % 360;
        updateMaterial(placed.id, { angle: newAngle });
      }
    },
    [placed.id, placed.angle, updateMaterial, isRotating]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isSelected) {
          useAppStore.getState().removeMaterial(placed.id);
        }
      }
    },
    [isSelected, placed.id]
  );

  useEffect(() => {
    if (isSelected) {
      window.addEventListener('keydown', handleKeyDown as unknown as EventListener);
      return () => {
        window.removeEventListener('keydown', handleKeyDown as unknown as EventListener);
      };
    }
  }, [isSelected, handleKeyDown]);

  const actualSize = MATERIAL_SIZE * placed.scale;

  return (
    <div
      ref={materialRef}
      className={`absolute cursor-move select-none ${isDragging ? 'z-50' : 'z-10'} ${
        isSelected ? 'outline-none' : ''
      }`}
      style={{
        left: placed.x,
        top: placed.y,
        width: actualSize,
        height: actualSize,
        transform: `translate(-50%, -50%) rotate(${placed.angle}deg)`,
        willChange: isDragging ? 'transform' : 'auto',
        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
      }}
      onClick={handleClick}
      {...dragHandlers}
      tabIndex={0}
    >
      <svg
        viewBox={material.viewBox}
        width="100%"
        height="100%"
        style={{
          filter: `drop-shadow(1px 1px 2px rgba(0,0,0,0.2))`,
        }}
      >
        <path
          d={material.svgPath}
          fill={placed.currentColor}
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="0.5"
        />
      </svg>

      {isSelected && (
        <>
          <div
            className="absolute inset-0 border-2 border-dashed"
            style={{ borderColor: '#3e2723', pointerEvents: 'none' }}
          />

          {RESIZE_HANDLES.map((handle) => (
            <div
              key={handle}
              className="absolute w-2 h-2 bg-white border-2 rounded-full cursor-pointer z-20"
              style={{
                ...HANDLE_POSITIONS[handle],
                borderColor: '#3e2723',
              }}
              onMouseDown={(e) => handleResizeStart(handle, e)}
            />
          ))}

          <div
            className="absolute cursor-pointer z-20 flex items-center justify-center"
            style={{
              top: '-24px',
              right: '-24px',
              width: '24px',
              height: '24px',
            }}
            onClick={handleRotateClick}
            onMouseDown={handleRotateStart}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3e2723" strokeWidth="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
});
