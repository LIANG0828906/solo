import { useState, useRef, useCallback, useEffect } from 'react';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toPng } from 'html-to-image';
import type { CanvasElement, CanvasSize, IconType, TextElement, IconElement, PriceTagElement } from './types';
import { generateId } from './constants';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { PropertyPanel } from './components/PropertyPanel';
import { TopBar } from './components/TopBar';

const createTextElement = (x: number, y: number): TextElement => ({
  id: generateId(),
  type: 'text',
  x,
  y,
  width: 180,
  height: 50,
  rotation: 0,
  opacity: 1,
  zIndex: 0,
  content: '双击编辑文字',
  color: '#FFFFFF',
  fontFamily: 'Caveat',
  fontSize: 28,
});

const createIconElement = (x: number, y: number, iconType: IconType): IconElement => ({
  id: generateId(),
  type: 'icon',
  x,
  y,
  width: 60,
  height: 60,
  rotation: 0,
  opacity: 1,
  zIndex: 0,
  iconType,
  color: '#FFFFFF',
});

const createPriceTagElement = (x: number, y: number): PriceTagElement => ({
  id: generateId(),
  type: 'priceTag',
  x,
  y,
  width: 100,
  height: 60,
  rotation: 0,
  opacity: 1,
  zIndex: 0,
  price: 18.00,
  bgColor: '#FF6B6B',
});

const AppContent = () => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>('A3-portrait');
  const [isMobile, setIsMobile] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const maxZIndex = Math.max(0, ...elements.map((el) => el.zIndex));

  const addElement = useCallback((element: CanvasElement) => {
    setElements((prev) => [...prev, { ...element, zIndex: prev.length }]);
    setSelectedId(element.id);
  }, []);

  const addText = useCallback(() => {
    const el = createTextElement(50, 50);
    addElement(el);
  }, [addElement]);

  const addIcon = useCallback((iconType: IconType) => {
    const el = createIconElement(80, 80, iconType);
    addElement(el);
  }, [addElement]);

  const addPriceTag = useCallback(() => {
    const el = createPriceTagElement(100, 100);
    addElement(el);
  }, [addElement]);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } as CanvasElement : el))
    );
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [selectedId]);

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) {
      setElements((prev) =>
        prev.map((el) =>
          el.id === id ? { ...el, zIndex: maxZIndex + 1 } : el
        )
      );
    }
  }, [maxZIndex]);

  const handleStartEditing = useCallback((id: string) => {
    setEditingId(id);
    setSelectedId(id);
  }, []);

  const handleEditChange = useCallback((text: string) => {
    if (editingId) {
      updateElement(editingId, { content: text } as Partial<TextElement>);
    }
  }, [editingId, updateElement]);

  const handleEndEditing = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleExportPNG = useCallback(async () => {
    if (!canvasRef.current) return;

    setSelectedId(null);
    setEditingId(null);

    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const dataUrl = await toPng(canvasRef.current, {
        quality: 1,
        pixelRatio: 4,
        cacheBust: true,
        skipFonts: true,
      });

      const link = document.createElement('a');
      link.download = `blackboard-menu-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('导出PNG失败:', err);
      alert('导出PNG失败，请重试');
    }
  }, []);

  const handleResetLayout = useCallback(() => {
    setElements((prev) => {
      const cols = 2;
      const colWidth = 170;
      const rowHeight = 80;
      const startX = 30;
      const startY = 30;

      return prev.map((el, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        return {
          ...el,
          x: startX + col * colWidth,
          y: startY + row * rowHeight,
          rotation: 0,
        };
      });
    });
  }, []);

  const handleClearCanvas = useCallback(() => {
    if (window.confirm('确定要清空画布吗？')) {
      setElements([]);
      setSelectedId(null);
      setEditingId(null);
    }
  }, []);

  const handleCanvasSizeChange = useCallback((size: CanvasSize) => {
    setCanvasSize(size);
  }, []);

  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['NEW_TEXT', 'NEW_ICON', 'NEW_PRICE_TAG'],
    drop: (item: { elementType: string; iconType?: IconType }, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current?.getBoundingClientRect();

      if (!offset || !canvasRect) return;

      const x = (offset.x - canvasRect.left) * (420 / canvasRect.width);
      const y = (offset.y - canvasRect.top) * (594 / canvasRect.height);

      if (item.elementType === 'text') {
        addElement(createTextElement(x, y));
      } else if (item.elementType === 'icon' && item.iconType) {
        addElement(createIconElement(x, y, item.iconType));
      } else if (item.elementType === 'priceTag') {
        addElement(createPriceTagElement(x, y));
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [addElement]);

  const setCanvasRef = useCallback((node: HTMLDivElement | null) => {
    drop(node);
    (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, [drop]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#1A1D21',
        color: '#E2E8F0',
      }}
    >
      <TopBar
        onExportPNG={handleExportPNG}
        onResetLayout={handleResetLayout}
        onClearCanvas={handleClearCanvas}
        canvasSize={canvasSize}
        onCanvasSizeChange={handleCanvasSizeChange}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {!isMobile && (
          <div style={{ padding: '16px 0 16px 16px' }}>
            <Toolbar
              onAddText={addText}
              onAddIcon={addIcon}
              onAddPriceTag={addPriceTag}
            />
          </div>
        )}

        <Canvas
          elements={elements}
          selectedId={selectedId}
          onSelect={handleSelect}
          onUpdateElement={updateElement}
          editingId={editingId}
          onStartEditing={handleStartEditing}
          onEditChange={handleEditChange}
          onEndEditing={handleEndEditing}
          canvasSize={canvasSize}
          canvasRef={setCanvasRef as unknown as React.RefObject<HTMLDivElement>}
        />

        {!isMobile && (
          <div style={{ padding: '16px 16px 16px 0' }}>
            <PropertyPanel
              element={selectedElement}
              onUpdate={updateElement}
              onDelete={deleteElement}
            />
          </div>
        )}

        {isMobile && (
          <PropertyPanel
            element={selectedElement}
            onUpdate={updateElement}
            onDelete={deleteElement}
            isMobile
          />
        )}
      </div>

      {isMobile && (
        <div
          style={{
            height: '60px',
            backgroundColor: '#1F2937',
            borderTop: '1px solid #374151',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '0 12px',
          }}
        >
          <button
            onClick={addText}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              background: 'none',
              border: 'none',
              color: '#A0AEC0',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '20px', fontFamily: 'Caveat, cursive' }}>Aa</span>
            <span>文字</span>
          </button>
          <button
            onClick={() => addIcon('hotCoffee')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              background: 'none',
              border: 'none',
              color: '#A0AEC0',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '20px' }}>☕</span>
            <span>图案</span>
          </button>
          <button
            onClick={addPriceTag}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              background: 'none',
              border: 'none',
              color: '#A0AEC0',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '20px' }}>🏷️</span>
            <span>价格</span>
          </button>
          <button
            onClick={handleExportPNG}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              background: 'none',
              border: 'none',
              color: '#FFE066',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '20px' }}>📥</span>
            <span>导出</span>
          </button>
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <AppContent />
    </DndProvider>
  );
};

export default App;
