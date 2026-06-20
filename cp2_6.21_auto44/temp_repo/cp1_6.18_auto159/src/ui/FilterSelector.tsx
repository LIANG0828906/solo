import React, { useEffect, useRef } from 'react';
import { useImageStore } from '@/stores/imageStore';
import { applyFilter, FILTER_LIST, type FilterType } from '@/engine/filterEngine';
import { RenderEngine } from '@/engine/renderEngine';

const FILTER_EMOJI: Record<FilterType, string> = {
  none: '🖼️',
  oil: '🎨',
  watercolor: '💧',
  sketch: '✏️',
  pixelate: '🎮',
  neon: '💜',
  mosaic: '🔲',
};

const MAX_PROCESS_WIDTH = 1000;

const FilterSelector: React.FC = () => {
  const { images, selectedImageId, applyFilter: saveFilterResult } = useImageStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RenderEngine | null>(null);
  const selectedImage = images.find((img) => img.id === selectedImageId) ?? null;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new RenderEngine(canvasRef.current);
    }
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !selectedImage) return;

    const display = async () => {
      const img = await engine.loadImage(selectedImage.processedDataUrl ?? selectedImage.dataUrl);
      engine.drawImage(img);
      if (containerRef.current) {
        containerRef.current.style.opacity = '1';
        containerRef.current.style.transform = 'scale(1)';
      }
    };
    display();
  }, [selectedImage?.id]);

  const handleFilterClick = async (filterType: FilterType) => {
    const engine = engineRef.current;
    if (!engine || !selectedImage) return;

    const img = await engine.loadImage(selectedImage.dataUrl);
    let processWidth = img.width;
    let processHeight = img.height;
    if (img.width > MAX_PROCESS_WIDTH) {
      const ratio = MAX_PROCESS_WIDTH / img.width;
      processWidth = MAX_PROCESS_WIDTH;
      processHeight = Math.round(img.height * ratio);
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = processWidth;
    tempCanvas.height = processHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    tempCtx.drawImage(img, 0, 0, processWidth, processHeight);
    const sourceData = tempCtx.getImageData(0, 0, processWidth, processHeight);

    const startTime = performance.now();
    const processed = applyFilter(sourceData, filterType);
    console.log(`Filter [${filterType}] processed in ${(performance.now() - startTime).toFixed(0)}ms`);

    if (containerRef.current) {
      containerRef.current.style.opacity = '0';
      containerRef.current.style.transform = 'scale(0.95)';
    }

    await engine.drawWithTransition(processed, {
      transition: true,
      transitionDuration: 500,
      scaleStart: 0.95,
      scaleEnd: 1.0,
    });

    const outCanvas = document.createElement('canvas');
    outCanvas.width = processWidth;
    outCanvas.height = processHeight;
    const outCtx = outCanvas.getContext('2d');
    if (outCtx) {
      outCtx.putImageData(processed, 0, 0);
    }
    const processedDataUrl = outCanvas.toDataURL('image/png');

    saveFilterResult(selectedImage.id, filterType, processedDataUrl);

    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.style.opacity = '1';
        containerRef.current.style.transform = 'scale(1)';
      }
    }, 50);
  };

  return (
    <div className="filter-selector">
      <div>
        <div className="section-title">预览效果</div>
        <div className="preview-area">
          {selectedImage ? (
            <>
              <div className="preview-canvas-wrap" ref={containerRef}
                style={{
                  transition: 'opacity 500ms ease, transform 500ms ease',
                }}
              >
                <canvas ref={canvasRef} className="preview-canvas" />
              </div>
              <div className="preview-hint">
                💡 拖拽图片到右侧相册分类 · 选择下方滤镜实时处理
              </div>
            </>
          ) : (
            <div className="preview-empty">
              请上传或选择一张图片开始编辑
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div className="section-title">选择滤镜</div>
        <div className="filter-grid">
          {FILTER_LIST.map((f) => {
            const isSelected = selectedImage?.currentFilter === f.type;
            return (
              <div
                key={f.type}
                className={`filter-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleFilterClick(f.type)}
              >
                <div className="filter-emoji">{FILTER_EMOJI[f.type]}</div>
                <div className="filter-name">{f.name}</div>
                <div className="filter-desc">{f.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FilterSelector;
