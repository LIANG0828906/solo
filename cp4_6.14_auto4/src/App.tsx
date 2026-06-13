import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import type { Artwork, Booth, PlacedArtwork, DragState, ViewMode } from './types';
import { createBoothGrid, addArtwork, removeArtwork, checkOverlap, getPlacementSuggestions, getBoothAtPosition } from './layoutEngine';
import ArtworkPalette from './ArtworkPalette';
import Renderer from './Renderer';
import ArtworkEditor from './ArtworkEditor';

const BOOTH_WIDTH = 140;
const BOOTH_HEIGHT = 140;
const BOOTH_GAP = 20;
const GRID_ROWS = 3;
const GRID_COLS = 3;

const SAMPLE_ARTWORKS: Artwork[] = [
  { id: 'art-1', title: '星空幻想', width: 100, height: 80, rotation: 0, thumbnail: '', color: '#6366f1' },
  { id: 'art-2', title: '城市之光', width: 80, height: 100, rotation: 0, thumbnail: '', color: '#ec4899' },
  { id: 'art-3', title: '深海探秘', width: 90, height: 90, rotation: 0, thumbnail: '', color: '#14b8a6' },
  { id: 'art-4', title: '山川河流', width: 110, height: 70, rotation: 0, thumbnail: '', color: '#f59e0b' },
  { id: 'art-5', title: '数字梦境', width: 70, height: 110, rotation: 0, thumbnail: '', color: '#8b5cf6' },
  { id: 'art-6', title: '未来都市', width: 100, height: 100, rotation: 0, thumbnail: '', color: '#ef4444' },
  { id: 'art-7', title: '宇宙漫游', width: 85, height: 85, rotation: 0, thumbnail: '', color: '#22c55e' },
  { id: 'art-8', title: '量子纠缠', width: 95, height: 75, rotation: 0, thumbnail: '', color: '#06b6d4' },
  { id: 'art-9', title: '时光碎片', width: 75, height: 95, rotation: 0, thumbnail: '', color: '#f97316' },
];

export default function App() {
  const [booths] = useState<Booth[]>(() =>
    createBoothGrid(GRID_ROWS, GRID_COLS, BOOTH_WIDTH, BOOTH_HEIGHT, BOOTH_GAP)
  );
  const [placedArtworks, setPlacedArtworks] = useState<PlacedArtwork[]>([]);
  const [selectedBoothId, setSelectedBoothId] = useState<string | null>(null);
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);
  const [editingArtwork, setEditingArtwork] = useState<PlacedArtwork | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    artwork: null,
    mouseX: 0,
    mouseY: 0,
    targetBoothId: null,
  });
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [isAutoLayoutAnimating, setIsAutoLayoutAnimating] = useState(false);

  const rendererRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const conflictTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const placedArtworkIds = useMemo(() => {
    return new Set(placedArtworks.map(a => a.id));
  }, [placedArtworks]);

  const showConflictMessage = useCallback((message: string) => {
    if (conflictTimeoutRef.current) {
      clearTimeout(conflictTimeoutRef.current);
    }
    setConflictMessage(message);
    conflictTimeoutRef.current = setTimeout(() => {
      setConflictMessage(null);
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (conflictTimeoutRef.current) {
        clearTimeout(conflictTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleDragStart = useCallback((artwork: Artwork, e: React.MouseEvent) => {
    e.preventDefault();
    if (!rendererRef.current) return;

    const rect = rendererRef.current.getBoundingClientRect();
    setDragState({
      isDragging: true,
      artwork,
      mouseX: e.clientX - rect.left,
      mouseY: e.clientY - rect.top,
      targetBoothId: null,
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging || !rendererRef.current) return;

    const rect = rendererRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const booth = getBoothAtPosition(mouseX, mouseY, booths, scale, offset);
    const isOccupied = booth && placedArtworks.some(a => a.boothId === booth.id);
    const targetBoothId = booth && !isOccupied ? booth.id : null;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      setDragState(prev => ({
        ...prev,
        mouseX,
        mouseY,
        targetBoothId,
      }));
    });
  }, [dragState.isDragging, booths, scale, offset, placedArtworks]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.artwork || !rendererRef.current) {
      setDragState(prev => ({ ...prev, isDragging: false, artwork: null }));
      return;
    }

    const rect = rendererRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const booth = getBoothAtPosition(mouseX, mouseY, booths, scale, offset);

    if (booth) {
      const isOccupied = placedArtworks.some(a => a.boothId === booth.id);
      
      if (isOccupied) {
        showConflictMessage(`展位 ${booth.row + 1}-${booth.col + 1} 已被占用！`);
      } else {
        const position = addArtwork(dragState.artwork, booth, placedArtworks);
        
        if (position) {
          const newPlacedArtwork: PlacedArtwork = {
            ...dragState.artwork,
            boothId: booth.id,
            x: position.x,
            y: position.y,
          };
          
          setPlacedArtworks(prev => [...prev, newPlacedArtwork]);
          setSelectedArtworkId(newPlacedArtwork.id);
          setSelectedBoothId(null);
        } else {
          showConflictMessage('放置冲突！请选择其他展位');
        }
      }
    }

    setDragState({
      isDragging: false,
      artwork: null,
      mouseX: 0,
      mouseY: 0,
      targetBoothId: null,
    });
  }, [dragState, booths, scale, offset, placedArtworks, showConflictMessage]);

  const handleBoothClick = useCallback((booth: Booth) => {
    setSelectedBoothId(booth.id);
    setSelectedArtworkId(null);
  }, []);

  const handleArtworkClick = useCallback((artwork: PlacedArtwork) => {
    setSelectedArtworkId(artwork.id);
    setSelectedBoothId(null);
    setEditingArtwork(artwork);
  }, []);

  const handleCanvasClick = useCallback(() => {
    setSelectedBoothId(null);
    setSelectedArtworkId(null);
  }, []);

  const handleAutoLayout = useCallback(() => {
    const unplacedArtworks = SAMPLE_ARTWORKS.filter(a => !placedArtworkIds.has(a.id));
    
    if (unplacedArtworks.length === 0) {
      showConflictMessage('所有展品已放置！');
      return;
    }

    const occupiedBoothIds = new Set(placedArtworks.map(a => a.boothId));
    const availableBooths = booths.filter(b => !occupiedBoothIds.has(b.id));

    if (availableBooths.length === 0) {
      showConflictMessage('没有可用展位了！');
      return;
    }

    const suggestions = getPlacementSuggestions(unplacedArtworks, availableBooths);
    
    if (suggestions.length === 0) {
      showConflictMessage('无法生成布局建议！');
      return;
    }

    setIsAutoLayoutAnimating(true);
    
    setTimeout(() => {
      setPlacedArtworks(prev => [...prev, ...suggestions]);
      setIsAutoLayoutAnimating(false);
    }, 300);
  }, [placedArtworks, placedArtworkIds, booths, showConflictMessage]);

  const handleViewModeToggle = useCallback(() => {
    setViewMode(prev => prev === '2d' ? '3d' : '2d');
  }, []);

  const handleSaveArtwork = useCallback((updates: Partial<PlacedArtwork>) => {
    if (!editingArtwork) return;

    setPlacedArtworks(prev => prev.map(a => {
      if (a.id !== editingArtwork.id) return a;

      const updated = { ...a, ...updates };
      
      if (updates.width !== undefined || updates.height !== undefined || updates.rotation !== undefined) {
        const booth = booths.find(b => b.id === a.boothId);
        if (booth) {
          const otherPlaced = prev.filter(p => p.id !== a.id);
          const rotated = updates.rotation !== undefined 
            ? (updates.rotation === 45 
                ? { width: Math.sqrt((updates.width || a.width) ** 2 + (updates.height || a.height) ** 2), 
                    height: Math.sqrt((updates.width || a.width) ** 2 + (updates.height || a.height) ** 2) }
                : updates.rotation === 90 
                  ? { width: updates.height || a.height, height: updates.width || a.width }
                  : { width: updates.width || a.width, height: updates.height || a.height })
            : { width: updates.width || a.width, height: updates.height || a.height };
          
          const newX = booth.x + (booth.width - rotated.width) / 2;
          const newY = booth.y + (booth.height - rotated.height) / 2;
          
          const hasOverlap = checkOverlap(
            { x: newX, y: newY, width: rotated.width, height: rotated.height },
            otherPlaced,
            a.id
          );
          
          if (!hasOverlap) {
            updated.x = newX;
            updated.y = newY;
          }
        }
      }
      
      return updated;
    }));
  }, [editingArtwork, booths]);

  const handleDeleteArtwork = useCallback(() => {
    if (!editingArtwork) return;
    
    setPlacedArtworks(prev => removeArtwork(editingArtwork.id, prev));
    setEditingArtwork(null);
    setSelectedArtworkId(null);
  }, [editingArtwork]);

  const handleCloseEditor = useCallback(() => {
    setEditingArtwork(null);
  }, []);

  const handleResetLayout = useCallback(() => {
    setPlacedArtworks([]);
    setSelectedBoothId(null);
    setSelectedArtworkId(null);
    setEditingArtwork(null);
  }, []);

  return (
    <div className="h-screen w-screen bg-gallery-bg overflow-hidden flex flex-col">
      <header className="h-16 border-b border-gallery-accent/20 bg-gallery-bg/90 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gallery-accent to-blue-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">虚拟展厅布局编辑器</h1>
            <p className="text-gray-500 text-xs">策展人工具 · 展品布局规划</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleViewModeToggle}
            className="flex items-center gap-2 px-4 py-2 bg-gallery-bg/80 border border-gallery-accent/30 text-gallery-accent
                     rounded-lg hover:bg-gallery-accent/10 hover:border-gallery-accent/60 hover:scale-105
                     transition-all duration-200 ease-gallery text-sm font-medium"
          >
            {viewMode === '2d' ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                切换 3D 视图
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                切换 2D 视图
              </>
            )}
          </button>

          <button
            onClick={handleAutoLayout}
            disabled={isAutoLayoutAnimating}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-gallery
              ${isAutoLayoutAnimating
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gallery-accent hover:bg-gallery-accent-hover text-white shadow-gallery hover:shadow-gallery-hover hover:scale-105'
              }`}
          >
            <svg className={`w-4 h-4 ${isAutoLayoutAnimating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isAutoLayoutAnimating ? '布局中...' : '自动布局'}
          </button>

          <button
            onClick={handleResetLayout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400
                     rounded-lg hover:bg-red-500/20 hover:border-red-500/60 hover:scale-105
                     transition-all duration-200 ease-gallery text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            重置
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 p-4">
        <ArtworkPalette
          artworks={SAMPLE_ARTWORKS}
          placedArtworkIds={placedArtworkIds}
          onDragStart={handleDragStart}
        />

        <div ref={rendererRef} className="flex-1 relative">
          <Renderer
            booths={booths}
            placedArtworks={placedArtworks}
            selectedBoothId={selectedBoothId}
            selectedArtworkId={selectedArtworkId}
            viewMode={viewMode}
            scale={scale}
            offset={offset}
            dragState={dragState}
            onBoothClick={handleBoothClick}
            onArtworkClick={handleArtworkClick}
            onScaleChange={setScale}
            onOffsetChange={setOffset}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onCanvasClick={handleCanvasClick}
          />

          {conflictMessage && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-lg
                          flex items-center gap-2 animate-bounce z-20 backdrop-blur-sm border border-red-400/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {conflictMessage}
            </div>
          )}

          {isAutoLayoutAnimating && (
            <div className="absolute inset-0 bg-gallery-accent/5 backdrop-blur-sm flex items-center justify-center z-10
                          rounded-lg border-2 border-dashed border-gallery-accent/50">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-gallery-accent/30 border-t-gallery-accent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gallery-accent font-medium">正在智能布局...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="h-10 border-t border-gallery-accent/20 bg-gallery-bg/90 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6 text-xs text-gray-500">
          <span>展位: {placedArtworks.length} / {booths.length}</span>
          <span>展品: {SAMPLE_ARTWORKS.length - placedArtworks.length} 待放置</span>
          <span>当前视图: {viewMode === '2d' ? '2D 俯瞰' : '3D 等距'}</span>
        </div>
        <div className="text-xs text-gray-600">
          提示: 拖拽展品到展位 · 点击展品编辑 · Alt + 拖拽平移视图
        </div>
      </footer>

      {editingArtwork && (
        <ArtworkEditor
          artwork={editingArtwork}
          onSave={handleSaveArtwork}
          onDelete={handleDeleteArtwork}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
}
