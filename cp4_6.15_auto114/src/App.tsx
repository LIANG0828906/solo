import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Layers, PanelLeft, Sun, ZoomIn, ZoomOut, Trash2 } from 'lucide-react';
import { useMapStore, type Material, type Point, type Character } from '@/store/mapStore';
import { CanvasRenderer } from '@/modules/editor/CanvasRenderer';
import { PreviewSimulator } from '@/modules/preview/PreviewSimulator';
import EditorPanel from '@/modules/editor/EditorPanel';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const simulatorRef = useRef<PreviewSimulator | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const {
    tiles,
    collisionPolygons,
    lightSource,
    character,
    materials,
    tileAnimations,
    currentDrawingPolygon,
    appMode,
    editMode,
    isDrawingPolygon,
    selectedPolygonId,
    zoom,
    panX,
    panY,
    gridSize,
    showMaterialPanel,
    selectedMaterial,
    setAppMode,
    setEditMode,
    addTile,
    setLightSource,
    setZoom,
    setPan,
    setCharacter,
    setCurrentDrawingPolygon,
    addPolygonVertex,
    finishDrawingPolygon,
    updateCollisionPolygon,
    setSelectedPolygon,
    setShowMaterialPanel,
    resetMap,
    resetCharacter,
  } = useMapStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new CanvasRenderer({
      canvas: canvasRef.current,
      gridSize,
      onTileClick: (gridX, gridY) => {
        if (selectedMaterial && appMode === 'editor' && editMode === 'tile') {
          addTile(selectedMaterial.type, gridX, gridY);
        }
      },
      onTileDrop: (type, gridX, gridY) => {
        if (appMode === 'editor') {
          addTile(type, gridX, gridY);
        }
      },
      onLightDrag: (x, y) => {
        setLightSource({ x, y });
      },
      onCanvasPan: (deltaX, deltaY) => {
        setPan(panX + deltaX, panY + deltaY);
      },
      onCanvasZoom: (newZoom, centerX, centerY) => {
        const oldZoom = zoom;
        const scaleRatio = newZoom / oldZoom;
        
        const worldCenterX = (centerX - window.innerWidth / 2) / oldZoom - panX;
        const worldCenterY = (centerY - window.innerHeight / 2) / oldZoom - panY;
        
        const newPanX = (centerX - window.innerWidth / 2) / newZoom - worldCenterX;
        const newPanY = (centerY - window.innerHeight / 2) / newZoom - worldCenterY;
        
        setZoom(newZoom);
        setPan(newPanX, newPanY);
      },
      onPolygonDraw: (point) => {
        addPolygonVertex(point);
      },
      onPolygonVertexDrag: (polygonId, vertexIndex, x, y) => {
        const polygon = collisionPolygons.find(p => p.id === polygonId);
        if (polygon) {
          const newVertices = [...polygon.vertices];
          newVertices[vertexIndex] = { x, y };
          updateCollisionPolygon(polygonId, newVertices);
        }
      },
      onPolygonClick: (polygonId, vertexIndex) => {
        setSelectedPolygon(polygonId, vertexIndex);
      },
    });

    rendererRef.current = renderer;
    renderer.start();

    return () => {
      renderer.destroy();
    };
  }, []);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.setTiles(tiles);
  }, [tiles]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.setCollisionPolygons(collisionPolygons);
  }, [collisionPolygons]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.setLightSource(lightSource);
  }, [lightSource]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.setCharacter(character);
  }, [character]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.setMaterials(materials);
  }, [materials]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.setTileAnimations(tileAnimations);
  }, [tileAnimations]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.setCurrentDrawingPolygon(currentDrawingPolygon);
  }, [currentDrawingPolygon]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.setAppMode(appMode);
  }, [appMode]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.setEditMode(editMode);
  }, [editMode]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.setIsDrawingPolygon(isDrawingPolygon);
  }, [isDrawingPolygon]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.setSelectedPolygonId(selectedPolygonId);
  }, [selectedPolygonId]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.setZoom(zoom);
  }, [zoom]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.setPan(panX, panY);
  }, [panX, panY]);

  useEffect(() => {
    if (appMode !== 'preview') {
      if (simulatorRef.current) {
        simulatorRef.current.stop();
        simulatorRef.current = null;
      }
      setIsSimulating(false);
      return;
    }

    const simulator = new PreviewSimulator(
      character,
      collisionPolygons,
      tiles,
      gridSize
    );

    simulator.setOnUpdate((newCharacter: Character) => {
      setCharacter(newCharacter);
      
      if (rendererRef.current) {
        const targetPanX = -newCharacter.x + window.innerWidth / 3;
        const currentPanX = panX;
        const smoothedPanX = currentPanX + (targetPanX - currentPanX) * 0.1;
        setPan(smoothedPanX, panY);
      }
    });

    simulatorRef.current = simulator;
    simulator.start();
    setIsSimulating(true);

    return () => {
      simulator.stop();
    };
  }, [appMode, collisionPolygons, tiles, gridSize]);

  const handleDragStart = useCallback((material: Material, e: React.DragEvent) => {
    if (rendererRef.current) {
      rendererRef.current.setHoveredMaterial(material);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.setHoveredMaterial(null);
      rendererRef.current.setDragPosition(null);
    }
  }, []);

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (rendererRef.current && selectedMaterial) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        rendererRef.current.setDragPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  }, [selectedMaterial]);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (rendererRef.current && selectedMaterial && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      
      const worldPos = rendererRef.current.screenToWorld(screenX, screenY);
      const gridPos = rendererRef.current.worldToGrid(worldPos.x, worldPos.y);
      
      addTile(selectedMaterial.type, gridPos.x, gridPos.y);
      rendererRef.current.setHoveredMaterial(null);
      rendererRef.current.setDragPosition(null);
    }
  }, [selectedMaterial, addTile]);

  const handleCanvasDoubleClick = useCallback(() => {
    if (isDrawingPolygon && appMode === 'editor' && editMode === 'collision') {
      finishDrawingPolygon();
    }
  }, [isDrawingPolygon, appMode, editMode, finishDrawingPolygon]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isDrawingPolygon) {
        finishDrawingPolygon();
      }
    }
    if (e.key === ' ' && appMode === 'preview') {
      e.preventDefault();
      if (simulatorRef.current) {
        if (isSimulating) {
          simulatorRef.current.stop();
          setIsSimulating(false);
        } else {
          simulatorRef.current.start();
          setIsSimulating(true);
        }
      }
    }
  }, [isDrawingPolygon, appMode, isSimulating, finishDrawingPolygon]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleResetZoom = () => {
    setZoom(1);
    setPan(0, 0);
  };

  const handleZoomIn = () => {
    setZoom(Math.min(4, zoom + 0.25));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(0.25, zoom - 0.25));
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#2b2b2b] overflow-hidden">
      <div
        className="h-14 flex items-center justify-between px-4 border-b border-gray-700 z-10"
        style={{
          background: 'rgba(43, 43, 43, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMaterialPanel(!showMaterialPanel)}
            className="p-2 text-gray-400 hover:text-[#00ff88] hover:bg-gray-700/50 rounded transition-all duration-200 hover:translate-y-[-2px]"
            title="切换面板"
          >
            <PanelLeft size={20} />
          </button>
          
          <div className="h-6 w-px bg-gray-600" />
          
          <h1 className="text-[#00ff88] text-lg font-bold tracking-wide">
            2D横版卷轴关卡编辑器
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-400 hover:text-[#00ff88] hover:bg-gray-700 rounded transition-all duration-200"
              title="缩小"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-gray-300 text-xs w-14 text-center font-mono">
              {(zoom * 100).toFixed(0)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-400 hover:text-[#00ff88] hover:bg-gray-700 rounded transition-all duration-200"
              title="放大"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 text-gray-400 hover:text-[#00ff88] hover:bg-gray-700 rounded transition-all duration-200"
              title="重置视图"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-600 mx-1" />

          <div className="flex items-center gap-2">
            <Sun size={16} className="text-yellow-400" />
            <label className="text-gray-400 text-xs">光照强度</label>
            <input
              type="range"
              min="0"
              max="100"
              value={lightSource.intensity * 100}
              onChange={(e) => setLightSource({ intensity: Number(e.target.value) / 100 })}
              className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#00ff88]"
            />
            <span className="text-gray-300 text-xs font-mono w-10">
              {(lightSource.intensity * 100).toFixed(0)}%
            </span>
          </div>

          <div className="h-6 w-px bg-gray-600 mx-1" />

          {appMode === 'editor' ? (
            <>
              <button
                onClick={() => setAppMode('preview')}
                className="flex items-center gap-2 px-4 py-2 bg-[#00ff88] text-[#2b2b2b] rounded-lg font-medium hover:bg-[#ffdd00] hover:translate-y-[-2px] active:scale-95 transition-all duration-200"
              >
                <Play size={16} />
                预览模式
              </button>
              <button
                onClick={resetMap}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200 hover:translate-y-[-2px]"
                title="清空地图"
              >
                <Trash2 size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  if (simulatorRef.current) {
                    if (isSimulating) {
                      simulatorRef.current.stop();
                      setIsSimulating(false);
                    } else {
                      simulatorRef.current.start();
                      setIsSimulating(true);
                    }
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:translate-y-[-2px] active:scale-95 ${
                  isSimulating
                    ? 'bg-yellow-500 text-[#2b2b2b] hover:bg-yellow-400'
                    : 'bg-[#00ff88] text-[#2b2b2b] hover:bg-[#ffdd00]'
                }`}
              >
                {isSimulating ? <Pause size={16} /> : <Play size={16} />}
                {isSimulating ? '暂停' : '继续'}
              </button>
              <button
                onClick={() => {
                  resetCharacter();
                  if (simulatorRef.current) {
                    simulatorRef.current.reset();
                    simulatorRef.current.start();
                    setIsSimulating(true);
                  }
                }}
                className="p-2 text-gray-400 hover:text-[#00ff88] hover:bg-gray-700 rounded-lg transition-all duration-200 hover:translate-y-[-2px]"
                title="重新开始"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={() => setAppMode('editor')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-200 rounded-lg font-medium hover:bg-gray-600 hover:translate-y-[-2px] active:scale-95 transition-all duration-200"
              >
                <Layers size={16} />
                编辑模式
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {appMode === 'editor' && (
          <EditorPanel
            zoom={zoom}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        )}

        <div
          className="flex-1 relative overflow-hidden"
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
          onDoubleClick={handleCanvasDoubleClick}
        >
          <canvas
            ref={canvasRef}
            className="block w-full h-full"
            style={{ cursor: editMode === 'tile' ? 'grab' : 'default' }}
          />

          {appMode === 'preview' && (
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-sm">
              <p className="text-gray-300">
                <span className="text-[#00ff88]">空格</span> 暂停/继续
              </p>
              <p className="text-gray-400 text-xs mt-1">
                位置: ({character.x.toFixed(0)}, {character.y.toFixed(0)})
              </p>
            </div>
          )}

          {isDrawingPolygon && appMode === 'editor' && editMode === 'collision' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#a855f7]/90 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-white">
              点击画布添加顶点 · 双击完成绘制 · ESC取消
              <span className="ml-3 text-white/70">
                ({currentDrawingPolygon.length} 个顶点)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
