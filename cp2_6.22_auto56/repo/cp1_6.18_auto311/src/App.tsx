import React, { useRef, useEffect, useCallback } from 'react';
import { shallow } from 'zustand/shallow';
import { Toolbar } from './components/Toolbar';
import { LayerPanel } from './components/LayerPanel';
import { RenderLayer } from './canvas/CanvasRenderer';
import { useLayerStore } from './store/layerStore';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './types';

const App: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  const {
    layers,
    selectedLayerId,
    deleteLayer
  } = useLayerStore(state => ({
    layers: state.layers,
    selectedLayerId: state.selectedLayerId,
    deleteLayer: state.deleteLayer
  }), shallow);

  const {
    handleCanvasMouseDown,
    handleLayerMouseDown,
    handleResizeStart
  } = useCanvasInteraction(svgRef);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT') return;
      
      if (selectedLayerId) {
        e.preventDefault();
        deleteLayer(selectedLayerId);
      }
    }
    
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useLayerStore.getState().undo();
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        useLayerStore.getState().redo();
      }
    }
  }, [selectedLayerId, deleteLayer]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="app-container">
      <Toolbar />
      <div className="main-content">
        <LayerPanel />
        <div className="canvas-wrapper">
          <div className="canvas-container">
            <svg
              ref={svgRef}
              className="canvas-svg"
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
              onMouseDown={handleCanvasMouseDown}
            >
              <defs>
                <pattern
                  id="checkerboard"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="20" height="20" fill="#F5F5F5" />
                  <rect x="0" y="0" width="10" height="10" fill="#E0E0E0" />
                  <rect x="10" y="10" width="10" height="10" fill="#E0E0E0" />
                </pattern>
              </defs>
              <rect
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                fill="url(#checkerboard)"
              />
              <g>
                {layers.map((layer) => (
                  <RenderLayer
                    key={layer.id}
                    layer={layer}
                    isSelected={selectedLayerId === layer.id}
                    onMouseDown={handleLayerMouseDown}
                    onResizeStart={handleResizeStart}
                  />
                ))}
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
