import { useState, useCallback } from 'react';
import { Undo2, Redo2, Palette } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { MaterialPanel } from '@/components/MaterialPanel';
import { CanvasArea } from '@/components/CanvasArea';
import { SVGExporter } from '@/components/SVGExporter';
import { useHistory } from '@/hooks/useHistory';
import type { Material, CanvasElement, Viewport } from '@/types';

export default function App() {
  const { elements, pushHistory, undo, redo, canUndo, canRedo, past } = useHistory([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [flipUndo, setFlipUndo] = useState(false);
  const [flipRedo, setFlipRedo] = useState(false);
  const [viewport, setViewport] = useState<Viewport>({
    offsetX: 100,
    offsetY: 100,
    zoom: 1,
  });

  const handleRandomPick = useCallback(
    (material: Material) => {
      const canvasWidth = window.innerWidth - 420;
      const canvasHeight = window.innerHeight - 100;

      const centerX = (canvasWidth / 2 - viewport.offsetX) / viewport.zoom;
      const centerY = (canvasHeight / 2 - viewport.offsetY) / viewport.zoom;

      const newElement: CanvasElement = {
        id: uuidv4(),
        materialId: material.id,
        x: centerX,
        y: centerY,
        scale: 1,
        rotation: 0,
        color: material.defaultColor,
        isNew: true,
      };

      pushHistory([...elements, newElement], 'add');
    },
    [elements, pushHistory, viewport]
  );

  const handleUpdateElements = useCallback(
    (newElements: CanvasElement[]) => {
      pushHistory(newElements, 'update');
    },
    [pushHistory]
  );

  const handleDeleteElement = useCallback(
    (id: string) => {
      const newElements = elements.filter((el) => el.id !== id);
      pushHistory(newElements, 'delete');
    },
    [elements, pushHistory]
  );

  const handleViewportChange = useCallback((newViewport: Viewport) => {
    setViewport(newViewport);
  }, []);

  const handleUndo = () => {
    if (!canUndo) return;
    setFlipUndo(true);
    setTimeout(() => setFlipUndo(false), 300);
    undo();
  };

  const handleRedo = () => {
    if (!canRedo) return;
    setFlipRedo(true);
    setTimeout(() => setFlipRedo(false), 300);
    redo();
  };

  return (
    <div className="app-container">
      <MaterialPanel onRandomPick={handleRandomPick} />

      <CanvasArea
        elements={elements}
        onUpdateElements={handleUpdateElements}
        onDeleteElement={handleDeleteElement}
        viewport={viewport}
        onViewportChange={handleViewportChange}
      />

      <button
        className="mobile-fab"
        onClick={() => setDrawerOpen(true)}
        aria-label="打开素材面板"
      >
        <Palette size={24} />
      </button>

      <MaterialPanel
        onRandomPick={(material) => {
          handleRandomPick(material);
          setDrawerOpen(false);
        }}
        isDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <div className="bottom-toolbar">
        <button
          className={`tool-btn${flipUndo ? ' flip' : ''}`}
          onClick={handleUndo}
          disabled={!canUndo}
          title="撤销 (Ctrl+Z)"
        >
          <Undo2 size={20} />
          {past.length > 0 && <span className="history-badge">{past.length}</span>}
        </button>

        <button
          className={`tool-btn${flipRedo ? ' flip' : ''}`}
          onClick={handleRedo}
          disabled={!canRedo}
          title="重做 (Ctrl+Shift+Z)"
        >
          <Redo2 size={20} />
        </button>

        <div className="tool-divider" />

        <SVGExporter elements={elements} />
      </div>
    </div>
  );
}
