import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Columns2,
  Layers,
  Link,
  Link2Off,
  Ruler,
  Sun,
  Moon,
  Sunset,
  X,
  Upload,
  File,
  RotateCcw,
  PlayCircle,
} from 'lucide-react';
import { useComparisonStore } from '@/store/useComparisonStore';
import ComparisonController from '@/comparison/ComparisonController';
import AnnotationSystem from '@/comparison/AnnotationSystem';
import ModelLoader from '@/models/ModelLoader';
import ModelManager from '@/models/ModelManager';
import { yearToLabel } from '@/data/mockData';
import type { Annotation } from '@/types';

const FileUploader: React.FC = () => {
  const [draggingA, setDraggingA] = useState(false);
  const [draggingB, setDraggingB] = useState(false);
  const inputARef = useRef<HTMLInputElement>(null);
  const inputBRef = useRef<HTMLInputElement>(null);

  const {
    modelA,
    modelB,
    setModelScene,
    setModelLoadingProgress,
    setShowFileUpload,
  } = useComparisonStore();

  const handleFile = useCallback(
    async (file: File, id: 'A' | 'B') => {
      const edgeColor = id === 'A' ? '#FFAB91' : '#81D4FA';
      try {
        const loaded = await ModelLoader.loadFromFile(
          file,
          edgeColor,
          (p) => setModelLoadingProgress(id, p.percentage)
        );
        const wrapper = ModelManager.registerModel(id, loaded, edgeColor);
        setModelScene(id, wrapper, file.name);
      } catch (e) {
        console.error(`Failed to load model ${id}:`, e);
        alert(`模型加载失败: ${file.name}`);
      }
    },
    [setModelLoadingProgress, setModelScene]
  );

  const loadDemo = useCallback(async () => {
    const edgeColorA = '#FFAB91';
    const edgeColorB = '#81D4FA';

    const [loadedA, loadedB] = await Promise.all([
      ModelLoader.generateDemoModel('complete', edgeColorA, (p) =>
        setModelLoadingProgress('A', p.percentage)
      ),
      ModelLoader.generateDemoModel('damaged', edgeColorB, (p) =>
        setModelLoadingProgress('B', p.percentage)
      ),
    ]);

    const wrapperA = ModelManager.registerModel('A', loadedA, edgeColorA);
    const wrapperB = ModelManager.registerModel('B', loadedB, edgeColorB);

    setModelScene('A', wrapperA, '遗址完整版_公元100年.gltf');
    setModelScene('B', wrapperB, '遗址损毁版_公元500年.gltf');
    ModelManager.centerModelsForSplitView();
  }, [setModelLoadingProgress, setModelScene]);

  useEffect(() => {
    if (modelA.loaded && modelB.loaded) {
      const t = setTimeout(() => setShowFileUpload(false), 500);
      return () => clearTimeout(t);
    }
  }, [modelA.loaded, modelB.loaded, setShowFileUpload]);

  const handleDrop = (e: React.DragEvent, id: 'A' | 'B') => {
    e.preventDefault();
    e.stopPropagation();
    if (id === 'A') setDraggingA(false);
    else setDraggingB(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file, id);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>, id: 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (file) handleFile(file, id);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="card-panel max-w-4xl w-full p-8">
        <h2 className="font-display text-2xl font-bold mb-2 text-white">
          加载考古遗址模型
        </h2>
        <p className="text-sm text-gray-400 mb-8">
          上传两个GLTF格式的遗址模型进行对比，或加载示例模型快速体验
        </p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div
            className={`dropzone ${draggingA ? 'dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDraggingA(true);
            }}
            onDragLeave={() => setDraggingA(false)}
            onDrop={(e) => handleDrop(e, 'A')}
            onClick={() => inputARef.current?.click()}
          >
            <Upload size={36} className="mx-auto mb-3 text-orange-400 opacity-70" />
            <p className="font-medium mb-1">遗址A · 完整版</p>
            <p className="text-xs text-gray-500 mb-3">
              如：公元100年完整建筑
            </p>
            <div className="text-xs text-orange-400 font-mono">
              边缘光 · #FFAB91
            </div>
            <input
              ref={inputARef}
              type="file"
              accept=".gltf,.glb"
              className="hidden"
              onChange={(e) => onFileInput(e, 'A')}
            />
            {modelA.fileName && (
              <div className="mt-4 flex items-center gap-2 text-sm text-green-400 justify-center">
                <File size={14} />
                <span className="truncate max-w-[200px]">{modelA.fileName}</span>
              </div>
            )}
            {modelA.loadingProgress > 0 && !modelA.loaded && (
              <div className="mt-4">
                <div className="loading-progress">
                  <div
                    className="loading-bar"
                    style={{ width: `${modelA.loadingProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  加载中 {modelA.loadingProgress}%
                </p>
              </div>
            )}
          </div>

          <div
            className={`dropzone ${draggingB ? 'dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDraggingB(true);
            }}
            onDragLeave={() => setDraggingB(false)}
            onDrop={(e) => handleDrop(e, 'B')}
            onClick={() => inputBRef.current?.click()}
          >
            <Upload size={36} className="mx-auto mb-3 text-blue-400 opacity-70" />
            <p className="font-medium mb-1">遗址B · 损毁版</p>
            <p className="text-xs text-gray-500 mb-3">
              如：公元500年损毁遗址
            </p>
            <div className="text-xs text-blue-400 font-mono">
              边缘光 · #81D4FA
            </div>
            <input
              ref={inputBRef}
              type="file"
              accept=".gltf,.glb"
              className="hidden"
              onChange={(e) => onFileInput(e, 'B')}
            />
            {modelB.fileName && (
              <div className="mt-4 flex items-center gap-2 text-sm text-green-400 justify-center">
                <File size={14} />
                <span className="truncate max-w-[200px]">{modelB.fileName}</span>
              </div>
            )}
            {modelB.loadingProgress > 0 && !modelB.loaded && (
              <div className="mt-4">
                <div className="loading-progress">
                  <div
                    className="loading-bar"
                    style={{ width: `${modelB.loadingProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  加载中 {modelB.loadingProgress}%
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="btn-primary flex-1 py-3" onClick={loadDemo}>
            <PlayCircle size={18} className="inline mr-2" />
            加载示例模型 · 公元100年 vs 公元500年
          </button>
        </div>
      </div>
    </div>
  );
};

const TopToolbar: React.FC = () => {
  const { mode, viewSync, measurementMode, theme, setShowFileUpload } =
    useComparisonStore();
  const [themeOpen, setThemeOpen] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-[#1A1A1A]/95 backdrop-blur-md border-b border-[#2A2A2A] z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FF4B1F] flex items-center justify-center">
          <span className="font-display font-bold text-white text-sm">AR</span>
        </div>
        <div>
          <h1 className="font-display font-bold text-sm">
            考古遗址三维重建对比查看器
          </h1>
          <p className="text-[10px] text-gray-500 font-mono">
            Archaeological Reconstruction Viewer
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-[#121212] rounded-lg p-1">
          <button
            className={`btn-icon ${mode === 'split' ? 'active' : ''}`}
            onClick={() => ComparisonController.setMode('split')}
            title="分屏模式"
          >
            <Columns2 size={18} />
          </button>
          <button
            className={`btn-icon ${mode === 'overlay' ? 'active' : ''}`}
            onClick={() => ComparisonController.setMode('overlay')}
            title="叠加模式"
          >
            <Layers size={18} />
          </button>
        </div>

        <div className="w-px h-8 bg-[#2A2A2A] mx-2" />

        <button
          className={`btn-icon ${viewSync.enabled ? 'active' : ''}`}
          onClick={() =>
            ComparisonController.setViewSync(!viewSync.enabled)
          }
          title={viewSync.enabled ? '取消视角同步' : '同步视角'}
        >
          {viewSync.enabled ? <Link size={18} /> : <Link2Off size={18} />}
        </button>

        <button
          className={`btn-icon ${measurementMode ? 'active' : ''}`}
          onClick={() => ComparisonController.toggleMeasurementMode()}
          title="测量工具"
        >
          <Ruler size={18} />
        </button>

        <button
          className="btn-icon"
          onClick={() => ComparisonController.resetView('both')}
          title="重置视角"
        >
          <RotateCcw size={18} />
        </button>

        <div className="w-px h-8 bg-[#2A2A2A] mx-2" />

        <div className="relative">
          <button
            className="btn-icon"
            onClick={() => setThemeOpen(!themeOpen)}
            title="切换灯光主题"
          >
            {theme === 'daylight' ? (
              <Sun size={18} />
            ) : theme === 'night' ? (
              <Moon size={18} />
            ) : (
              <Sunset size={18} />
            )}
          </button>
          {themeOpen && (
            <div className="dropdown-menu">
              <div
                className={`dropdown-item ${theme === 'dusk' ? 'active' : ''}`}
                onClick={() => {
                  ComparisonController.setTheme('dusk');
                  setThemeOpen(false);
                }}
              >
                <Sunset size={14} /> 暮色
              </div>
              <div
                className={`dropdown-item ${theme === 'daylight' ? 'active' : ''}`}
                onClick={() => {
                  ComparisonController.setTheme('daylight');
                  setThemeOpen(false);
                }}
              >
                <Sun size={14} /> 日光
              </div>
              <div
                className={`dropdown-item ${theme === 'night' ? 'active' : ''}`}
                onClick={() => {
                  ComparisonController.setTheme('night');
                  setThemeOpen(false);
                }}
              >
                <Moon size={14} /> 夜景
              </div>
            </div>
          )}
        </div>

        <button className="btn-secondary text-sm" onClick={() => setShowFileUpload(true)}>
          更换模型
        </button>
      </div>
    </div>
  );
};

const OverlayControls: React.FC = () => {
  const { mode, overlayOpacity } = useComparisonStore();

  if (mode !== 'overlay') return null;

  return (
    <div className="fixed top-20 right-6 z-30 card-panel px-4 py-3 flex items-center gap-4">
      <span className="text-sm text-gray-400">透明度</span>
      <input
        type="range"
        className="transparency-slider"
        min={0}
        max={1}
        step={0.05}
        value={1 - overlayOpacity}
        onChange={(e) =>
          ComparisonController.setOverlayOpacity(1 - parseFloat(e.target.value))
        }
      />
      <span className="text-sm font-mono w-10 text-right">
        {Math.round((1 - overlayOpacity) * 100)}%
      </span>
    </div>
  );
};

const TimelineSlider: React.FC = () => {
  const { currentYear } = useComparisonStore();
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const minYear = -200;
  const maxYear = 600;
  const range = maxYear - minYear;

  const percentage = ((currentYear - minYear) / range) * 100;

  const updateYearFromX = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const ratio = x / rect.width;
      const year = Math.round(minYear + ratio * range);
      ComparisonController.setYear(year);
    },
    [minYear, range]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent) => updateYearFromX(e.clientX);
    const handleUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, updateYearFromX]);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[70px] bg-[#1A1A1A]/95 backdrop-blur-md border-t border-[#2A2A2A] z-40 px-8 flex items-center gap-6">
      <span className="font-mono text-sm text-gray-400 w-16">{yearToLabel(minYear)}</span>

      <div className="flex-1 relative">
        <div
          ref={trackRef}
          className="timeline-track"
          onMouseDown={(e) => {
            setIsDragging(true);
            updateYearFromX(e.clientX);
          }}
        >
          <div
            className="timeline-thumb"
            style={{ left: `${percentage}%` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDragging(true);
            }}
          />
        </div>

        <div className="absolute -top-8 left-1/2 -translate-x-1/2 font-mono text-sm text-[#FF6B35]">
          {yearToLabel(currentYear)}
        </div>
      </div>

      <span className="font-mono text-sm text-gray-400 w-16 text-right">{yearToLabel(maxYear)}</span>
    </div>
  );
};

const AnnotationCard: React.FC = () => {
  const { activeAnnotation, annotationCardPosition, setActiveAnnotation } =
    useComparisonStore();

  if (!activeAnnotation || !annotationCardPosition) return null;

  const anno = activeAnnotation as Annotation;

  return (
    <div
      className="annotation-card"
      style={{
        left: annotationCardPosition.x,
        top: annotationCardPosition.y,
      }}
    >
      <button
        className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
        onClick={() => setActiveAnnotation(null)}
      >
        <X size={16} />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-1 h-5 rounded-full"
          style={{
            background: anno.modelId === 'A' ? '#FFAB91' : '#81D4FA',
            boxShadow: `0 0 8px ${anno.modelId === 'A' ? 'rgba(255,171,145,0.5)' : 'rgba(129,212,250,0.5)'}`,
          }}
        />
        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
          遗址{anno.modelId}
        </span>
      </div>

      <h3 className="font-display text-lg font-bold text-white mb-2">
        {anno.componentName}
      </h3>

      <div className="inline-block px-3 py-1 rounded-full bg-[#FF6B35]/15 border border-[#FF6B35]/30 text-xs font-mono text-[#FF8C5A] mb-3">
        {anno.eraRange}
      </div>

      <p className="text-sm text-gray-300 leading-relaxed">
        {anno.description}
      </p>
    </div>
  );
};

const HotspotMarkers: React.FC<{
  positions: Map<string, { x: number; y: number; visible: boolean }>;
  onMarkerClick: (id: string) => void;
}> = ({ positions, onMarkerClick }) => {
  const { annotations } = useComparisonStore();

  return (
    <>
      {annotations
        .filter((a) => a.viewed)
        .map((anno) => {
          const pos = positions.get(anno.id);
          if (!pos || !pos.visible) return null;
          return (
            <div
              key={anno.id}
              className="hotspot-marker"
              style={{ left: pos.x, top: pos.y }}
              onClick={() => onMarkerClick(anno.id)}
              title={anno.componentName}
            />
          );
        })}
    </>
  );
};

const MeasurementLabels: React.FC = () => {
  const { measurements, activeMeasurement, removeMeasurement } =
    useComparisonStore();

  const allLines = [...measurements];
  if (activeMeasurement && activeMeasurement.end) {
    allLines.push(activeMeasurement);
  }

  return (
    <>
      {allLines.map((line) => {
        if (!line.end) return null;
        const midX = (line.start.screenPosition.x + line.end.screenPosition.x) / 2;
        const midY = (line.start.screenPosition.y + line.end.screenPosition.y) / 2;
        return (
          <div
            key={line.id}
            className="measurement-line-label cursor-pointer hover:bg-black/80"
            style={{
              left: midX,
              top: midY - 8,
              pointerEvents: line.complete ? 'auto' : 'none',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (line.complete) removeMeasurement(line.id);
            }}
            title={line.complete ? '点击清除测量' : ''}
          >
            {line.distance.toFixed(2)} m
          </div>
        );
      })}
    </>
  );
};

const ViewLegend: React.FC = () => {
  const { mode } = useComparisonStore();

  return (
    <>
      <div
        className="legend-tag a"
        style={{
          top: mode === 'overlay' ? 80 : 80,
          left: mode === 'overlay' ? 24 : 24,
        }}
      >
        遗址A · 完整版
      </div>
      {mode === 'split' && (
        <div
          className="legend-tag b"
          style={{ top: 80, right: 24 }}
        >
          遗址B · 损毁版
        </div>
      )}
      {mode === 'overlay' && (
        <div
          className="legend-tag b"
          style={{ top: 120, left: 24 }}
        >
          遗址B · 损毁版
        </div>
      )}
    </>
  );
};

const MeasurementModeHint: React.FC = () => {
  const { measurementMode, measurements } = useComparisonStore();

  if (!measurementMode) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 card-panel px-5 py-2 flex items-center gap-3">
      <Ruler size={16} className="text-[#FF6B35]" />
      <span className="text-sm">
        测量模式 · 点击两点测距（{measurements.length}/3 组）
      </span>
      <span className="text-xs text-gray-500">按 ESC 或再次点击图标退出</span>
    </div>
  );
};

export const UILayer: React.FC<{
  hotspotPositions: Map<string, { x: number; y: number; visible: boolean }>;
  onHotspotClick: (id: string) => void;
}> = ({ hotspotPositions, onHotspotClick }) => {
  const showFileUpload = useComparisonStore((s) => s.showFileUpload);
  const mode = useComparisonStore((s) => s.mode);

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="pointer-events-auto">
        {showFileUpload && <FileUploader />}
      </div>

      <div className="pointer-events-auto">
        <TopToolbar />
      </div>

      <div className="pointer-events-none">
        <ViewLegend />
      </div>

      <div className="pointer-events-auto">
        <OverlayControls />
      </div>

      <div className="pointer-events-none">
        <MeasurementModeHint />
      </div>

      <div className="pointer-events-none">
        <HotspotMarkers
          positions={hotspotPositions}
          onMarkerClick={onHotspotClick}
        />
      </div>

      <div className="pointer-events-none">
        <MeasurementLabels />
      </div>

      <div className="pointer-events-auto">
        <AnnotationCard />
      </div>

      <div className="pointer-events-auto">
        <TimelineSlider />
      </div>

      {mode === 'split' && (
        <div
          className="divider-split pointer-events-auto"
          style={{
            position: 'absolute',
            left: `${useComparisonStore.getState().splitRatio * 100}%`,
            top: 56,
            bottom: 70,
            transform: 'translateX(-50%)',
          }}
        />
      )}
    </div>
  );
};

export default UILayer;
