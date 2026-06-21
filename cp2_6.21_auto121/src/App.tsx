import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore, DesignContextProvider, useDesignContext } from './store';
import {
  BudgetPanel,
  PhotoUploader,
  StyleSelector,
  FurnitureLibrary,
  PhotoCanvas,
  SaveModal,
  DesignList,
  LoadingOverlay,
} from './moduleB/uiComponents';
import {
  subscribe as subscribeBudget,
  initialize as initializeBudget,
  destroy as destroyBudget,
} from './moduleC/budgetCalculator';
import {
  addFurniture as engineAddFurniture,
  removeFurniture as engineRemoveFurniture,
  updateFurniture as engineUpdateFurniture,
  setRoomImage as engineSetRoomImage,
  setStyle as engineSetStyle,
} from './moduleA/designEngine';
import {
  getFurnitureList,
  saveDesign,
  getDesigns,
  getDesign,
  type Furniture,
  type DesignListItem,
} from './moduleD/apiService';
import type { PlacedFurniture } from './moduleA/designEngine';

const styles = {
  modern: { name: '现代', filter: 'none', colors: ['#FFFFFF', '#808080', '#000000'] },
  nordic: { name: '北欧', filter: 'sepia(0.1) saturate(1.1)', colors: ['#F5F5DC', '#8B7355', '#6B8E23'] },
  industrial: { name: '工业', filter: 'grayscale(0.2) contrast(1.1)', colors: ['#2C3E50', '#7F8C8D', '#E74C3C'] },
  japanese: { name: '日式', filter: 'sepia(0.2) brightness(1.05)', colors: ['#F5F5F5', '#A9A9A9', '#BC8F8F'] },
  vintage: { name: '复古', filter: 'sepia(0.3) saturate(0.9)', colors: ['#D4A574', '#8B4513', '#654321'] },
};

const styleList = Object.entries(styles).map(([id, s]) => ({ id, ...s }));

const AppInner: React.FC = () => {
  const {
    loadingStates,
    isFullscreen,
    designState,
    budgetState,
    furnitureMap,
    history,
    historyIndex,
    is3DMode,
    setCurrentDesignId,
    setLoading,
    toggleFullscreen,
    pushHistory,
    undo,
    redo,
    setIs3DMode,
    setFurnitureList,
    setBudgetState,
  } = useAppStore();

  const { addFurniture, removeFurniture, updateFurniture, setRoomImage, setStyle } = useDesignContext();

  const [savedDesigns, setLocalSavedDesigns] = useState<DesignListItem[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeBudget((state) => {
      setBudgetState(state);
    });
    initializeBudget();
    return () => {
      unsubscribe();
      destroyBudget();
    };
  }, []);

  useEffect(() => {
    getFurnitureList().then((list) => {
      setFurnitureList(list);
    });
  }, []);

  useEffect(() => {
    getDesigns().then(setLocalSavedDesigns);
  }, []);

  useEffect(() => {
    pushHistory(designState);
  }, [designState.placedFurniture.length, designState.roomImage, designState.style]);

  const handleImageUpload = useCallback((imageData: string) => {
    setLoading('upload', true);
    setRoomImage(imageData);
    setTimeout(() => {
      setLoading('upload', false);
    }, 300);
  }, [setRoomImage, setLoading]);

  const handleStyleChange = useCallback((styleId: string) => {
    setStyle(styleId);
  }, [setStyle]);

  const handleDrop = useCallback((furniture: Furniture, x: number, y: number) => {
    const categoryMap: Record<string, PlacedFurniture['category']> = {
      '沙发': 'sofa',
      '桌子': 'table',
      '椅子': 'chair',
      '灯具': 'lamp',
      '地毯': 'carpet',
      '装饰画': 'painting',
    };
    addFurniture({
      furnitureId: furniture.id,
      name: furniture.name,
      category: categoryMap[furniture.category] || 'sofa',
      x,
      y,
      scale: 1,
      rotation: 0,
    });
  }, [addFurniture]);

  const handleFurnitureUpdate = useCallback((id: string, updates: Partial<PlacedFurniture>) => {
    updateFurniture(id, updates);
  }, [updateFurniture]);

  const handleSave = useCallback(async (name: string) => {
    setLoading('save', true);
    try {
      const canvasRect = document.querySelector('[data-canvas]')?.getBoundingClientRect();
      const result = await saveDesign({
        name,
        canvasWidth: canvasRect?.width || 1280,
        canvasHeight: canvasRect?.height || 720,
        items: designState.placedFurniture.map((f) => ({
          furnitureId: f.furnitureId,
          x: f.x,
          y: f.y,
          rotation: f.rotation,
          scale: f.scale,
        })),
        styleId: designState.style,
      });
      setCurrentDesignId(result.id);
      setShowSaveModal(false);
      getDesigns().then(setLocalSavedDesigns);
    } catch (error) {
      alert(error instanceof Error ? error.message : '保存失败');
    } finally {
      setLoading('save', false);
    }
  }, [designState, setCurrentDesignId, setLoading]);

  const handleLoadDesign = useCallback(async (id: string) => {
    setLoading('load', true);
    try {
      const design = await getDesign(id);
      setRoomImage(null);
      setStyle(design.styleId || 'modern');

      designState.placedFurniture.forEach((f) => removeFurniture(f.id));

      const categoryMap: Record<string, PlacedFurniture['category']> = {
        '沙发': 'sofa',
        '桌子': 'table',
        '椅子': 'chair',
        '灯具': 'lamp',
        '地毯': 'carpet',
        '装饰画': 'painting',
      };

      await new Promise((resolve) => setTimeout(resolve, 50));

      design.items.forEach((item) => {
        addFurniture({
          furnitureId: item.furnitureId,
          name: item.furniture.name,
          category: categoryMap[item.furniture.category] || 'sofa',
          x: item.x,
          y: item.y,
          scale: item.scale,
          rotation: item.rotation,
        });
      });

      setCurrentDesignId(id);
    } catch (error) {
      alert(error instanceof Error ? error.message : '加载失败');
    } finally {
      setLoading('load', false);
    }
  }, [designState.placedFurniture, addFurniture, removeFurniture, setRoomImage, setStyle, setCurrentDesignId, setLoading]);

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);

  const handleToggle3D = useCallback(() => {
    setIs3DMode(!is3DMode);
  }, [is3DMode, setIs3DMode]);

  const isUploading = loadingStates['upload'] || false;
  const isSaving = loadingStates['save'] || false;
  const isLoading = loadingStates['load'] || false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <div className="app-container">
        <div className={`left-panel${isFullscreen ? ' fullscreen-hidden' : ''}`}>
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'white',
            }}
          >
            <h1 className="header-title" style={{ fontSize: '20px', fontWeight: 600 }}>设计工坊</h1>
            <button
              onClick={toggleFullscreen}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {isFullscreen ? '◀' : '▶'}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <PhotoUploader onUpload={handleImageUpload} isLoading={isUploading} />

            <StyleSelector
              styles={styleList.map((s) => ({
                id: s.id,
                name: s.name,
                description: '',
                thumbnail: '',
                colorScheme: s.colors,
              }))}
              currentStyle={designState.style}
              onSelect={handleStyleChange}
            />

            <FurnitureLibrary
              furnitureList={Array.from(furnitureMap.values())}
            />

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={handleToggle3D}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  background: is3DMode
                    ? 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)'
                    : 'white',
                  color: is3DMode ? 'white' : '#2d3436',
                  cursor: 'pointer',
                  fontSize: '13px',
                  border: '1px solid #dfe6e9',
                }}
              >
                🔲 {is3DMode ? '2D' : '3D'}预览
              </button>
              <button
                onClick={handleUndo}
                disabled={historyIndex === 0}
                style={{
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: '1px solid #dfe6e9',
                  backgroundColor: 'white',
                  cursor: historyIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: historyIndex === 0 ? 0.5 : 1,
                }}
              >
                ↶
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                style={{
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: '1px solid #dfe6e9',
                  backgroundColor: 'white',
                  cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: historyIndex >= history.length - 1 ? 0.5 : 1,
                }}
              >
                ↷
              </button>
            </div>

            <DesignList
              designs={savedDesigns}
              onLoad={handleLoadDesign}
              onDelete={() => {}}
            />
          </div>
        </div>

        <div className="right-panel">
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ fontSize: '14px', color: '#636e72' }}>
              {designState.placedFurniture.length} 件家具
            </div>
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={designState.placedFurniture.length === 0}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background:
                  designState.placedFurniture.length === 0
                    ? '#dfe6e9'
                    : 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                color: designState.placedFurniture.length === 0 ? '#636e72' : 'white',
                cursor: designState.placedFurniture.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
              }}
            >
              💾 保存
            </button>
          </div>

          <div className="photo-canvas-container" data-canvas>
            <LoadingOverlay isVisible={isLoading} message="加载方案中..." />

            <PhotoCanvas
              imageUrl={designState.roomImage}
              style={designState.style}
              placedFurniture={designState.placedFurniture}
              snapLines={[]}
              onDrop={(furnitureId: string, x: number, y: number) => {
                const furniture = furnitureMap.get(furnitureId);
                if (furniture) {
                  handleDrop(furniture, x, y);
                }
              }}
              onFurnitureUpdate={handleFurnitureUpdate}
            />
          </div>

          <div style={{ padding: '16px', backgroundColor: 'white' }}>
            <BudgetPanel budgetState={budgetState} />
          </div>
        </div>
      </div>

      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
};

const App: React.FC = () => {
  const { designState, budgetState, furnitureMap } = useAppStore();

  const contextValue = React.useMemo(() => ({
    designState,
    budgetState,
    furnitureMap,
    addFurniture: engineAddFurniture,
    removeFurniture: engineRemoveFurniture,
    updateFurniture: engineUpdateFurniture,
    setRoomImage: engineSetRoomImage,
    setStyle: engineSetStyle,
  }), [designState, budgetState, furnitureMap]);

  return (
    <DesignContextProvider value={contextValue}>
      <AppInner />
    </DesignContextProvider>
  );
};

export default App;
