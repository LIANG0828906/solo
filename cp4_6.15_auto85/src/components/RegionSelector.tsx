import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Region } from '../types';

interface RegionSelectorProps {
  onSelect: (region: Region | null) => void;
  onCancel: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | null;

const RegionSelector: React.FC<RegionSelectorProps> = ({ onSelect, onCancel, containerRef }) => {
  const [region, setRegion] = useState<Region | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startRegionRef = useRef<Region | null>(null);

  const getRelativePos = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
    };
  }, [containerRef]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getRelativePos(e);
    startPosRef.current = pos;
    setIsDragging(true);
    setRegion({ x: pos.x, y: pos.y, width: 0, height: 0 });
  }, [getRelativePos]);

  const handleHandleMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    startPosRef.current = getRelativePos(e);
    startRegionRef.current = region;
  }, [region, getRelativePos]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const pos = getRelativePos(e);

    if (isDragging) {
      const start = startPosRef.current;
      const newRegion: Region = {
        x: Math.min(start.x, pos.x),
        y: Math.min(start.y, pos.y),
        width: Math.abs(pos.x - start.x),
        height: Math.abs(pos.y - start.y),
      };
      setRegion(newRegion);
    } else if (isResizing && resizeHandle && startRegionRef.current) {
      const start = startRegionRef.current;
      const dx = pos.x - startPosRef.current.x;
      const dy = pos.y - startPosRef.current.y;
      let newRegion = { ...start };

      switch (resizeHandle) {
        case 'se':
          newRegion.width = Math.max(10, start.width + dx);
          newRegion.height = Math.max(10, start.height + dy);
          break;
        case 'sw':
          newRegion.x = start.x + dx;
          newRegion.width = Math.max(10, start.width - dx);
          newRegion.height = Math.max(10, start.height + dy);
          break;
        case 'ne':
          newRegion.y = start.y + dy;
          newRegion.width = Math.max(10, start.width + dx);
          newRegion.height = Math.max(10, start.height - dy);
          break;
        case 'nw':
          newRegion.x = start.x + dx;
          newRegion.y = start.y + dy;
          newRegion.width = Math.max(10, start.width - dx);
          newRegion.height = Math.max(10, start.height - dy);
          break;
      }
      setRegion(newRegion);
    }
  }, [isDragging, isResizing, resizeHandle, getRelativePos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' && region && region.width > 20 && region.height > 20) {
        onSelect(region);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [region, onSelect, onCancel]);

  return (
    <div className="region-selector" onMouseDown={handleMouseDown}>
      {region && region.width > 5 && region.height > 5 && (
        <>
          <div
            className="region-box"
            style={{
              left: region.x,
              top: region.y,
              width: region.width,
              height: region.height,
            }}
          />
          <div
            className="region-handle nw"
            style={{ left: region.x - 7, top: region.y - 7 }}
            onMouseDown={(e) => handleHandleMouseDown(e, 'nw')}
          />
          <div
            className="region-handle ne"
            style={{ left: region.x + region.width - 7, top: region.y - 7 }}
            onMouseDown={(e) => handleHandleMouseDown(e, 'ne')}
          />
          <div
            className="region-handle sw"
            style={{ left: region.x - 7, top: region.y + region.height - 7 }}
            onMouseDown={(e) => handleHandleMouseDown(e, 'sw')}
          />
          <div
            className="region-handle se"
            style={{ left: region.x + region.width - 7, top: region.y + region.height - 7 }}
            onMouseDown={(e) => handleHandleMouseDown(e, 'se')}
          />
        </>
      )}
    </div>
  );
};

export default RegionSelector;
