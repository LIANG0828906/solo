import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { CanvasElement as CanvasElementType } from '../types';
import { CanvasManager } from '../modules/canvas/CanvasManager';
import { FilterEngine } from '../modules/filter/FilterEngine';
import { useCanvasStore } from '../store/useCanvasStore';

interface Props {
  element: CanvasElementType;
  selected: boolean;
}

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;

export const CanvasElementView: React.FC<Props> = ({ element, selected }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [scaling, setScaling] = useState(false);
  const [rotating, setRotating] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, elX: 0, elY: 0 });
  const scaleStart = useRef({ x: 0, y: 0, w: 0, h: 0, handle: '' });
  const rotateStart = useRef({ angle: 0, elAngle: 0 });
  const selectedIds = useCanvasStore((s) => s.selectedIds);

  const filterStyle = FilterEngine.getElementStyle(element.filters, element.blendMode);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).classList.contains('handle') ||
          (e.target as HTMLElement).classList.contains('rotate-handle')) {
        return;
      }
      e.stopPropagation();
      const multi = e.shiftKey;
      if (!selectedIds.includes(element.id) || multi) {
        CanvasManager.selectElement(element.id, multi);
      }
      CanvasManager.bringToFront(element.id);
      setDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        elX: element.x,
        elY: element.y,
      };
    },
    [element.id, element.x, element.y, selectedIds]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragging) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        CanvasManager.moveElement(
          element.id,
          dragStart.current.elX + dx,
          dragStart.current.elY + dy
        );
      }
      if (scaling && ref.current) {
        const dx = e.clientX - scaleStart.current.x;
        const dy = e.clientY - scaleStart.current.y;
        const preserve = !e.shiftKey;
        CanvasManager.scaleElement(
          element.id,
          scaleStart.current.handle,
          dx,
          dy,
          preserve
        );
      }
      if (rotating && ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
        const delta = angle - rotateStart.current.angle;
        const snap = !e.altKey;
        CanvasManager.rotateElement(element.id, rotateStart.current.elAngle + delta, snap);
      }
    };

    const onMouseUp = () => {
      setDragging(false);
      setScaling(false);
      setRotating(false);
    };

    if (dragging || scaling || rotating) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, scaling, rotating, element.id]);

  const onScaleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setScaling(true);
    scaleStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: element.width,
      h: element.height,
      handle,
    };
  };

  const onRotateMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setRotating(true);
    rotateStart.current = {
      angle: Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI),
      elAngle: element.rotation,
    };
  };

  const renderContent = () => {
    if (element.type === 'fill') {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: element.fillColor || '#ccc',
            borderRadius: 4,
          }}
        />
      );
    }
    if (element.src) {
      return (
        <img
          src={element.src}
          alt={element.name}
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
        />
      );
    }
    return null;
  };

  const style: React.CSSProperties = {
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    transform: `rotate(${element.rotation}deg) translateZ(0)`,
    zIndex: element.zIndex,
    filter: filterStyle.filter,
    mixBlendMode: filterStyle.mixBlendMode,
    opacity: filterStyle.opacity,
  };

  return (
    <div
      ref={ref}
      className={`canvas-element ${selected ? 'selected' : ''} ${dragging ? 'dragging' : ''}`}
      style={style}
      onMouseDown={onMouseDown}
    >
      <div className="canvas-element-content">{renderContent()}</div>
      {selected && (
        <>
          <div className="control-handles">
            {HANDLES.map((h) => (
              <div
                key={h}
                className={`handle ${h}`}
                onMouseDown={(e) => onScaleMouseDown(e, h)}
              />
            ))}
          </div>
          <div className="rotate-handle-wrapper">
            <div className="rotate-line" />
            <div className="rotate-handle" onMouseDown={onRotateMouseDown} />
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(CanvasElementView);
