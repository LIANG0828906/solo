import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MaterialPanel from './modules/material/MaterialPanel';
import Timeline from './modules/timeline/Timeline';
import TransitionOverlay from './modules/timeline/TransitionOverlay';
import PreviewPlayer from './modules/preview/PreviewPlayer';
import PropertyEditor from './modules/properties/PropertyEditor';
import { useVideoMetadata } from './hooks/useVideoMetadata';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import type { Material, Clip, Transition, TransitionType } from './types';
import { ArrowRight, Move, Maximize2 } from 'lucide-react';
import './App.css';

const transitionConfig: Record<TransitionType, { label: string; icon: React.ReactNode; color: string }> = {
  fade: {
    label: '淡入淡出',
    icon: <Move size={14} />,
    color: 'rgba(74, 144, 217, 0.4)',
  },
  slide: {
    label: '滑动',
    icon: <ArrowRight size={14} />,
    color: 'rgba(107, 179, 240, 0.4)',
  },
  zoom: {
    label: '缩放',
    icon: <Maximize2 size={14} />,
    color: 'rgba(143, 211, 244, 0.4)',
  },
};

const App: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [filter, setFilter] = useState({ keyword: '', sortBy: 'name' as const });
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [isTransitionDragging, setIsTransitionDragging] = useState(false);

  const { processFiles, cleanupMaterial } = useVideoMetadata();
  const { startMaterialDrag, startTransitionDrag, endDrag } = useDragAndDrop();

  const handleUpload = useCallback(async (files: FileList) => {
    const newMaterials = await processFiles(files);
    setMaterials(prev => [...prev, ...newMaterials]);
  }, [processFiles]);

  const handleDragStart = useCallback((material: Material, e: React.DragEvent) => {
    startMaterialDrag(material, e);
  }, [startMaterialDrag]);

  const handleTransitionDragStart = useCallback((type: TransitionType, e: React.DragEvent) => {
    startTransitionDrag(type, e);
    setIsTransitionDragging(true);
  }, [startTransitionDrag]);

  const handleDragEnd = useCallback(() => {
    endDrag();
    setIsTransitionDragging(false);
  }, [endDrag]);

  const handleClipAdd = useCallback((materialId: string, startTime: number) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;

    const newClip: Clip = {
      id: uuidv4(),
      materialId,
      startTime,
      endTime: startTime + material.duration,
      inPoint: 0,
      outPoint: material.duration,
      volume: 100,
      playbackRate: 1,
    };

    setClips(prev => [...prev, newClip]);
    setSelectedClipId(newClip.id);
    handleDragEnd();
  }, [materials, handleDragEnd]);

  const handleClipUpdate = useCallback((clipId: string, updates: Partial<Clip>) => {
    setClips(prev => prev.map(clip => 
      clip.id === clipId ? { ...clip, ...updates } : clip
    ));
  }, []);

  const handleClipDelete = useCallback((clipId: string) => {
    setClips(prev => prev.filter(clip => clip.id !== clipId));
    setTransitions(prev => prev.filter(t => t.fromClipId !== clipId && t.toClipId !== clipId));
    if (selectedClipId === clipId) {
      setSelectedClipId(null);
    }
  }, [selectedClipId]);

  const handleClipSelect = useCallback((clipId: string | null) => {
    setSelectedClipId(clipId);
  }, []);

  const handleTransitionAdd = useCallback((fromClipId: string, toClipId: string, type: TransitionType) => {
    const existingTransition = transitions.find(
      t => (t.fromClipId === fromClipId && t.toClipId === toClipId) ||
           (t.fromClipId === toClipId && t.toClipId === fromClipId)
    );

    if (existingTransition) {
      setTransitions(prev => prev.map(t => 
        t.id === existingTransition.id ? { ...t, type } : t
      ));
    } else {
      const newTransition: Transition = {
        id: uuidv4(),
        type,
        duration: 1,
        fromClipId,
        toClipId,
      };
      setTransitions(prev => [...prev, newTransition]);
    }
    handleDragEnd();
  }, [transitions, handleDragEnd]);

  const handleTimeChange = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const selectedClip = useMemo(() => {
    return clips.find(c => c.id === selectedClipId) || null;
  }, [clips, selectedClipId]);

  const selectedMaterial = useMemo(() => {
    if (!selectedClip) return null;
    return materials.find(m => m.id === selectedClip.materialId) || null;
  }, [selectedClip, materials]);

  useEffect(() => {
    return () => {
      materials.forEach(m => cleanupMaterial(m));
    };
  }, [materials, cleanupMaterial]);

  const timeToPixel = useCallback((time: number) => time * zoom * 50, [zoom]);

  return (
    <div className="app-container" onDragEnd={handleDragEnd}>
      <MaterialPanel
        materials={materials}
        filter={filter}
        onUpload={handleUpload}
        onFilterChange={setFilter}
        onDragStart={handleDragStart}
        collapsed={leftPanelCollapsed}
        onToggleCollapse={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
      />

      <div className="main-content">
        <div className="preview-section">
          <PreviewPlayer
            clips={clips}
            transitions={transitions}
            materials={materials}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeChange={handleTimeChange}
          />
        </div>

        <div className="timeline-section">
          <Timeline
            clips={clips}
            transitions={transitions}
            materials={materials}
            currentTime={currentTime}
            zoom={zoom}
            selectedClipId={selectedClipId}
            onClipAdd={handleClipAdd}
            onClipUpdate={handleClipUpdate}
            onClipSelect={handleClipSelect}
            onZoomChange={handleZoomChange}
            onTimeChange={handleTimeChange}
            onTransitionAdd={handleTransitionAdd}
            onClipDelete={handleClipDelete}
          />
        </div>

        <div className="transition-palette">
          <div className="palette-title">转场效果</div>
          <div className="palette-items">
            {(Object.keys(transitionConfig) as TransitionType[]).map((type) => {
              const config = transitionConfig[type];
              return (
                <div
                  key={type}
                  className="transition-item"
                  draggable
                  onDragStart={(e) => handleTransitionDragStart(type, e)}
                  title={`拖拽应用${config.label}转场`}
                >
                  <div
                    className="transition-preview"
                    style={{ background: config.color }}
                  >
                    {config.icon}
                  </div>
                  <span>{config.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <PropertyEditor
        clip={selectedClip}
        material={selectedMaterial}
        onClipUpdate={handleClipUpdate}
        collapsed={rightPanelCollapsed}
        onToggleCollapse={() => setRightPanelCollapsed(!rightPanelCollapsed)}
      />

      {isTransitionDragging && (
        <div className="drag-hint">
          拖拽到两个剪辑之间以应用转场效果
        </div>
      )}
    </div>
  );
};

export default App;
