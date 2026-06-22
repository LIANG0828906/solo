import { useState, useRef, useEffect, useCallback } from 'react';
import { FloorPlan, PlacedItem, MaterialItem } from '../shared/types';
import { MATERIALS, CATEGORY_NAMES } from '../shared/data';
import FloorPlanCanvas from './FloorPlanCanvas';
import MaterialPanel from './MaterialPanel';
import PropertyPanel from './PropertyPanel';
import SaveDialog from './SaveDialog';

interface LayoutProps {
  floorPlan: FloorPlan;
  placedItems: PlacedItem[];
  setPlacedItems: (items: PlacedItem[]) => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  activeMaterial: MaterialItem | null;
  setActiveMaterial: (m: MaterialItem | null) => void;
  is3DMode: boolean;
  setIs3DMode: (v: boolean) => void;
  onBack: () => void;
  onSaveInspiration: (name: string, desc: string, thumb: string) => void;
  selectedMaterial: MaterialItem | null;
  ThreePreview?: any;
}

export default function Layout(props: LayoutProps) {
  const {
    floorPlan, placedItems, setPlacedItems, selectedItemId, setSelectedItemId,
    activeMaterial, setActiveMaterial, is3DMode, setIs3DMode,
    onBack, onSaveInspiration, selectedMaterial, ThreePreview
  } = props;

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = (x: number, y: number) => {
    if (activeMaterial) {
      const newItem: PlacedItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        materialId: activeMaterial.id,
        x,
        y,
        rotation: 0,
        scale: 1,
        color: activeMaterial.colors[0]
      };
      setPlacedItems([...placedItems, newItem]);
      setSelectedItemId(newItem.id);
      setActiveMaterial(null);
    } else {
      setSelectedItemId(null);
    }
  };

  const handleUpdateItem = useCallback((id: string, updates: Partial<PlacedItem>) => {
    setPlacedItems(placedItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, [placedItems, setPlacedItems]);

  const handleDeleteItem = useCallback((id: string) => {
    setPlacedItems(placedItems.filter(item => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  }, [placedItems, selectedItemId, setPlacedItems, setSelectedItemId]);

  const handleRotate = useCallback((id: string) => {
    const item = placedItems.find(i => i.id === id);
    if (item) {
      handleUpdateItem(id, { rotation: (item.rotation + 45) % 360 });
    }
  }, [placedItems, handleUpdateItem]);

  const handleCaptureThumbnail = (): string => {
    if (!canvasRef.current) return '';
    const svg = canvasRef.current.querySelector('svg');
    if (!svg) return '';
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    return url;
  };

  const captureThumbnailPromise = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!canvasRef.current) { resolve(''); return; }
      const svg = canvasRef.current.querySelector('svg');
      if (!svg) { resolve(''); return; }
      
      const svgData = new XMLSerializer().serializeToString(svg as Node);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FAF3EB';
          ctx.fillRect(0, 0, 400, 300);
          ctx.drawImage(img, 0, 0, 400, 300);
          const dataUrl = canvas.toDataURL('image/png');
          URL.revokeObjectURL(url);
          resolve(dataUrl);
        } else {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      img.src = url;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItemId && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
          e.preventDefault();
          handleDeleteItem(selectedItemId);
        }
      }
      if (e.key === 'Escape') {
        setActiveMaterial(null);
        setSelectedItemId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, handleDeleteItem, setActiveMaterial, setSelectedItemId]);

  const handleSaveClick = async () => {
    const thumb = await captureThumbnailPromise();
    setShowSaveDialog(true);
    (window as any).__pendingThumb = thumb;
  };

  const handleSaveConfirm = (name: string, description: string) => {
    const thumb = (window as any).__pendingThumb || '';
    onSaveInspiration(name, description, thumb);
    setShowSaveDialog(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{
        background: 'linear-gradient(135deg, #5D4037 0%, #8B5E3C 100%)',
        color: '#fff',
        padding: '0 24px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 14
          }}>
            ← 返回灵感板
          </button>
          <span style={{ fontSize: 18, fontWeight: 600 }}>
            🏠 {floorPlan.name}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setIs3DMode(!is3DMode)} style={{
            background: is3DMode ? '#E8A87C' : 'rgba(255,255,255,0.15)',
            color: '#fff',
            padding: '8px 20px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500
          }}>
            {is3DMode ? '📐 2D 视图' : '🎲 3D 预览'}
          </button>
          <button onClick={handleSaveClick} style={{
            background: '#E8A87C',
            color: '#fff',
            padding: '8px 20px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500
          }}>
            💾 保存到灵感板
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <MaterialPanel
          materials={MATERIALS}
          activeMaterial={activeMaterial}
          setActiveMaterial={setActiveMaterial}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        <div 
          ref={canvasRef}
          style={{ 
            flex: 1, 
            position: 'relative', 
            overflow: 'auto',
            background: 'linear-gradient(180deg, #FDF8F3 0%, #F5E6D3 100%)',
            cursor: activeMaterial ? 'crosshair' : 'default'
          }}
        >
          {!is3DMode ? (
            <FloorPlanCanvas
              floorPlan={floorPlan}
              placedItems={placedItems}
              selectedItemId={selectedItemId}
              setSelectedItemId={setSelectedItemId}
              activeMaterial={activeMaterial}
              onCanvasClick={handleCanvasClick}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onRotate={handleRotate}
            />
          ) : ThreePreview ? (
            <ThreePreview
              floorPlan={floorPlan}
              placedItems={placedItems}
              materials={MATERIALS}
            />
          ) : null}
        </div>

        <PropertyPanel
          selectedItem={placedItems.find(i => i.id === selectedItemId) || null}
          selectedMaterial={selectedMaterial}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onRotate={handleRotate}
        />
      </div>

      {showSaveDialog && (
        <SaveDialog
          defaultName={floorPlan.name}
          onConfirm={handleSaveConfirm}
          onCancel={() => setShowSaveDialog(false)}
        />
      )}
    </div>
  );
}
