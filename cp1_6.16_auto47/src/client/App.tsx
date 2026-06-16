import { useState, useEffect, lazy, Suspense } from 'react';
import { FloorPlan, InspirationEntry, PlacedItem, RoomType, MaterialItem } from '../shared/types';
import { MATERIALS, ROOM_LAYOUTS } from '../shared/data';
import Layout from './Layout';
import InspirationBoard from './InspirationBoard';

const ThreePreview = lazy(() => import('./ThreePreview'));

export type ViewMode = 'board' | 'editor';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [is3DMode, setIs3DMode] = useState(false);
  const [currentFloorPlan, setCurrentFloorPlan] = useState<FloorPlan | null>(null);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<MaterialItem | null>(null);
  const [inspirations, setInspirations] = useState<InspirationEntry[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('home-decor-inspirations');
    if (saved) {
      try {
        setInspirations(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('home-decor-inspirations', JSON.stringify(inspirations));
  }, [inspirations]);

  const handleCreateRoom = (roomType: RoomType, name: string) => {
    const layout = ROOM_LAYOUTS[roomType];
    const plan: FloorPlan = {
      id: `plan-${Date.now()}`,
      name: name || `${layout.name}方案`,
      roomType,
      layout: JSON.parse(JSON.stringify(layout)),
      placedItems: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setCurrentFloorPlan(plan);
    setPlacedItems([]);
    setSelectedItemId(null);
    setViewMode('editor');
  };

  const handleEditInspiration = (entry: InspirationEntry) => {
    const fullEntry = inspirations.find(e => e.id === entry.id);
    if (fullEntry) {
      setCurrentFloorPlan(fullEntry.floorPlan);
      setPlacedItems(fullEntry.floorPlan.placedItems);
      setSelectedItemId(null);
      setViewMode('editor');
    }
  };

  const handleDeleteInspiration = (id: string) => {
    setInspirations(prev => prev.filter(e => e.id !== id));
  };

  const handleSaveInspiration = async (name: string, description: string, thumbnail: string) => {
    if (!currentFloorPlan) return;
    
    const plan = { ...currentFloorPlan, placedItems };
    const entry: InspirationEntry = {
      id: `insp-${Date.now()}`,
      name,
      description,
      thumbnail,
      floorPlan: plan,
      materials: [...new Set(placedItems.map(i => i.materialId))],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    setInspirations(prev => [...prev, entry]);
    setViewMode('board');
  };

  const handleBackToBoard = () => {
    setViewMode('board');
    setCurrentFloorPlan(null);
    setPlacedItems([]);
    setSelectedItemId(null);
    setIs3DMode(false);
  };

  const selectedItem = placedItems.find(i => i.id === selectedItemId) || null;
  const selectedMaterial = selectedItem 
    ? MATERIALS.find(m => m.id === selectedItem.materialId) || null 
    : null;

  return (
    <div style={{ minHeight: '100vh' }}>
      {viewMode === 'board' ? (
        <InspirationBoard
          inspirations={inspirations}
          onCreateRoom={handleCreateRoom}
          onEdit={handleEditInspiration}
          onDelete={handleDeleteInspiration}
        />
      ) : currentFloorPlan ? (
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>}>
          <Layout
            floorPlan={currentFloorPlan}
            placedItems={placedItems}
            setPlacedItems={setPlacedItems}
            selectedItemId={selectedItemId}
            setSelectedItemId={setSelectedItemId}
            activeMaterial={activeMaterial}
            setActiveMaterial={setActiveMaterial}
            is3DMode={is3DMode}
            setIs3DMode={setIs3DMode}
            onBack={handleBackToBoard}
            onSaveInspiration={handleSaveInspiration}
            selectedMaterial={selectedMaterial}
            ThreePreview={!is3DMode ? undefined : ThreePreview}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
