import React, { useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ControlPanel } from '@/modules/ControlPanel';
import { InspirationBoard } from '@/modules/InspirationBoard';
import { ExportToast } from '@/components/ExportToast';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useBoardStore } from '@/stores/useBoardStore';
import { getRandomColor } from '@/utils/colorGenerator';
import { ElementType } from '@/types';

const App: React.FC = () => {
  const { isPanelCollapsed, screenWidth, setScreenWidth, togglePanel } = useLayoutStore();
  const { addElement } = useBoardStore();
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setScreenWidth]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const elementType = e.dataTransfer.getData('elementType') as ElementType;
    if (!elementType || !boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const canvasRect = boardRef.current.querySelector('[data-canvas="true"]')?.getBoundingClientRect();
    if (!canvasRect) return;

    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;

    const size = elementType === 'hexagon' || elementType === 'star' ? 60 : 80;
    const randomColor = getRandomColor();

    addElement({
      type: elementType,
      x: Math.max(0, Math.min(x - size / 2, canvasRect.width - size)),
      y: Math.max(0, Math.min(y - size / 2, canvasRect.height - size)),
      width: size,
      height: size,
      fill: randomColor,
      stroke: '#FFFFFF',
      strokeWidth: 2,
      rotation: 0,
      opacity: 1,
    });
  }, [addElement]);

  return (
    <div className="flex h-screen bg-[#FAFAFA] overflow-hidden">
      <AnimatePresence mode="wait">
        {(!isPanelCollapsed || screenWidth >= 1024) && (
          <ControlPanel 
            key="control-panel"
            isCollapsed={isPanelCollapsed && screenWidth < 1024} 
            onToggle={togglePanel} 
          />
        )}
      </AnimatePresence>

      {isPanelCollapsed && screenWidth < 1024 && (
        <ControlPanel 
          key="control-panel-collapsed"
          isCollapsed={true} 
          onToggle={togglePanel} 
        />
      )}

      <div 
        ref={boardRef}
        className="flex-1 relative"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div data-canvas="true" className="absolute inset-0 pointer-events-none" />
        <InspirationBoard />
      </div>

      <ExportToast />

      {isPanelCollapsed && screenWidth < 1024 && (
        <div
          className="fixed inset-0 bg-black/20 z-20"
          onClick={togglePanel}
        />
      )}
    </div>
  );
};

export default App;
