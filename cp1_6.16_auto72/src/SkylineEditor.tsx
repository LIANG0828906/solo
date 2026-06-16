import React, { useRef, useCallback, useEffect } from 'react';
import {
  Building,
  SunState,
  DragMode,
  DragState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  GRID_SIZE,
  SUN_RADIUS,
  RESIZE_HANDLE_SIZE,
  SUN_MIN_ANGLE,
  SUN_MAX_ANGLE,
  SUN_ARC_RADIUS,
  SUN_ARC_CENTER_X,
  SUN_ARC_CENTER_Y,
} from './types';

interface SkylineEditorProps {
  buildings: Building[];
  setBuildings: React.Dispatch<React.SetStateAction<Building[]>>;
  sun: SunState;
  setSun: React.Dispatch<React.SetStateAction<SunState>>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  hoveredBuildingId: string | null;
  setHoveredBuildingId: React.Dispatch<React.SetStateAction<string | null>>;
  hoveredElement: string | null;
  setHoveredElement: React.Dispatch<React.SetStateAction<string | null>>;
  snapLineX: number | null;
  setSnapLineX: React.Dispatch<React.SetStateAction<number | null>>;
  snapLineY: number | null;
  setSnapLineY: React.Dispatch<React.SetStateAction<number | null>>;
}

const SkylineEditor: React.FC<SkylineEditorProps> = ({
  buildings,
  setBuildings,
  sun,
  setSun,
  canvasRef,
  isDragging,
  setIsDragging,
  hoveredBuildingId,
  setHoveredBuildingId,
  hoveredElement,
  setHoveredElement,
  setSnapLineX,
  setSnapLineY,
}) => {
  const dragStateRef = useRef<DragState>({
    mode: 'none',
    buildingId: null,
    startX: 0,
    startY: 0,
    startBuilding: null,
  });

  const lastUpdateRef = useRef<number>(0);

  const snapToGrid = useCallback((value: number): number => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | MouseEvent): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [canvasRef]
  );

  const getHitArea = useCallback(
    (x: number, y: number): { mode: DragMode; buildingId: string | null } => {
      const sunDist = Math.sqrt(Math.pow(x - sun.x, 2) + Math.pow(y - sun.y, 2));
      if (sunDist <= SUN_RADIUS + 10) {
        return { mode: 'sun', buildingId: null };
      }

      for (let i = buildings.length - 1; i >= 0; i--) {
        const b = buildings[i];

        if (
          Math.abs(y - b.y) <= RESIZE_HANDLE_SIZE &&
          x >= b.x - RESIZE_HANDLE_SIZE &&
          x <= b.x + b.width + RESIZE_HANDLE_SIZE
        ) {
          return { mode: 'resize-top', buildingId: b.id };
        }

        if (
          Math.abs(x - b.x) <= RESIZE_HANDLE_SIZE &&
          y >= b.y - RESIZE_HANDLE_SIZE &&
          y <= b.y + b.height + RESIZE_HANDLE_SIZE
        ) {
          return { mode: 'resize-left', buildingId: b.id };
        }

        if (
          Math.abs(x - (b.x + b.width)) <= RESIZE_HANDLE_SIZE &&
          y >= b.y - RESIZE_HANDLE_SIZE &&
          y <= b.y + b.height + RESIZE_HANDLE_SIZE
        ) {
          return { mode: 'resize-right', buildingId: b.id };
        }

        if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
          return { mode: 'move', buildingId: b.id };
        }
      }

      return { mode: 'none', buildingId: null };
    },
    [buildings, sun]
  );

  const updateCursor = useCallback(
    (mode: DragMode) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      switch (mode) {
        case 'resize-top':
          canvas.style.cursor = 'ns-resize';
          break;
        case 'resize-left':
        case 'resize-right':
          canvas.style.cursor = 'ew-resize';
          break;
        case 'move':
          canvas.style.cursor = 'grab';
          break;
        case 'sun':
          canvas.style.cursor = 'grab';
          break;
        default:
          canvas.style.cursor = 'default';
      }
    },
    [canvasRef]
  );

  const constrainBuilding = useCallback(
    (building: Building): Building => {
      const minWidth = 30;
      const minHeight = 20;
      const maxHeight = GROUND_Y - 20;

      let { x, y, width, height } = building;

      width = Math.max(minWidth, Math.min(width, CANVAS_WIDTH - 80));
      height = Math.max(minHeight, Math.min(height, maxHeight));

      x = Math.max(50, Math.min(x, CANVAS_WIDTH - 50 - width));
      y = GROUND_Y - height;

      return { ...building, x, y, width, height };
    },
    []
  );

  const calculateSunPosition = useCallback((angle: number): { x: number; y: number } => {
    const rad = ((90 - angle) * Math.PI) / 180;
    return {
      x: SUN_ARC_CENTER_X + Math.cos(rad) * SUN_ARC_RADIUS,
      y: SUN_ARC_CENTER_Y - Math.sin(rad) * SUN_ARC_RADIUS,
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = getCanvasCoords(e);
      const { mode, buildingId } = getHitArea(x, y);

      if (mode === 'none') return;

      e.preventDefault();

      let startBuilding: Building | null = null;
      if (buildingId) {
        const b = buildings.find((b) => b.id === buildingId);
        if (b) startBuilding = { ...b };
      }

      dragStateRef.current = {
        mode,
        buildingId,
        startX: x,
        startY: y,
        startBuilding,
      };

      setIsDragging(true);

      if (mode === 'move' || mode === 'sun') {
        const canvas = canvasRef.current;
        if (canvas) canvas.style.cursor = 'grabbing';
      }
    },
    [getCanvasCoords, getHitArea, buildings, setIsDragging, canvasRef]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastUpdateRef.current < 16) return;
      lastUpdateRef.current = now;

      const { x, y } = getCanvasCoords(e);

      if (isDragging) {
        const { mode, buildingId, startX, startY, startBuilding } = dragStateRef.current;

        if (mode === 'sun') {
          const dx = x - SUN_ARC_CENTER_X;
          const dy = SUN_ARC_CENTER_Y - y;
          let angle = Math.atan2(dy, dx) * (180 / Math.PI);
          angle = Math.max(SUN_MIN_ANGLE, Math.min(SUN_MAX_ANGLE, 90 - angle));

          const pos = calculateSunPosition(angle);
          setSun({ angle, x: pos.x, y: pos.y });
          return;
        }

        if (!buildingId || !startBuilding) return;

        const dx = x - startX;
        const dy = y - startY;

        setBuildings((prev) =>
          prev.map((b) => {
            if (b.id !== buildingId) return b;

            let updated: Building = { ...b };

            switch (mode) {
              case 'move':
                updated.x = snapToGrid(startBuilding.x + dx);
                updated.y = snapToGrid(startBuilding.y + dy);
                updated.height = startBuilding.height;
                setSnapLineX(updated.x);
                setSnapLineY(updated.y);
                break;

              case 'resize-top':
                const newHeight = startBuilding.height - dy;
                updated.height = Math.max(20, snapToGrid(newHeight));
                updated.y = GROUND_Y - updated.height;
                setSnapLineY(updated.y);
                break;

              case 'resize-left':
                const newWidthLeft = startBuilding.width - dx;
                if (newWidthLeft >= 30) {
                  updated.width = snapToGrid(newWidthLeft);
                  updated.x = snapToGrid(startBuilding.x + dx);
                }
                setSnapLineX(updated.x);
                break;

              case 'resize-right':
                updated.width = Math.max(30, snapToGrid(startBuilding.width + dx));
                setSnapLineX(updated.x + updated.width);
                break;
            }

            return constrainBuilding(updated);
          })
        );
      } else {
        const { mode, buildingId } = getHitArea(x, y);
        updateCursor(mode);
        setHoveredBuildingId(buildingId);
        setHoveredElement(mode === 'sun' ? 'sun' : buildingId);
      }
    },
    [
      isDragging,
      getCanvasCoords,
      getHitArea,
      updateCursor,
      setHoveredBuildingId,
      setHoveredElement,
      setBuildings,
      setSun,
      setSnapLineX,
      setSnapLineY,
      snapToGrid,
      constrainBuilding,
      calculateSunPosition,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    dragStateRef.current = {
      mode: 'none',
      buildingId: null,
      startX: 0,
      startY: 0,
      startBuilding: null,
    };

    setIsDragging(false);
    setSnapLineX(null);
    setSnapLineY(null);

    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = 'default';
  }, [isDragging, setIsDragging, setSnapLineX, setSnapLineY, canvasRef]);

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      setHoveredBuildingId(null);
      setHoveredElement(null);
      const canvas = canvasRef.current;
      if (canvas) canvas.style.cursor = 'default';
    }
  }, [isDragging, setHoveredBuildingId, setHoveredElement, canvasRef]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        borderRadius: '12px',
        border: '2px solid #3a3a3e',
        backgroundColor: '#0a0a0f',
        transition: 'box-shadow 0.2s ease',
        boxShadow: hoveredBuildingId || hoveredElement === 'sun'
          ? '0 0 20px rgba(255, 255, 0, 0.2)'
          : '0 4px 20px rgba(0, 0, 0, 0.5)',
      }}
    />
  );
};

export default SkylineEditor;
