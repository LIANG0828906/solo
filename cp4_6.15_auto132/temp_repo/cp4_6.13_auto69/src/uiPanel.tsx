import { useRef, useState, useCallback, useEffect } from 'react';
import { useAppStore } from './store';
import { resizeImage, rgbToHex } from './imageProcessor';
import type { ImageData, RGB } from './types';

declare global {
  interface Window {
    resetCamera?: () => void;
  }
}

export default function UIPanel() {
  const {
    images,
    threshold,
    setThreshold,
    setImages,
    setClusters,
    setIsProcessing,
    selectedCluster,
    setSelectedCluster,
    resetAll,
  } = useAppStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./clusterWorker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current.onmessage = (e) => {
      setClusters(e.data.clusters);
      setIsProcessing(false);
    };
    return () => {
      workerRef.current?.terminate();
    };
  }, [setClusters, setIsProcessing]);

  const processImages = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      if (images.length + fileArray.length > 15) {
        alert('最多上传 15 张图片');
        return;
      }

      setIsProcessing(true);

      try {
        const ColorThiefModule = await import('colorthief/dist/color-thief.mjs');
        const ColorThief = (ColorThiefModule as any).default || ColorThiefModule;
        const colorThief = new ColorThief();
        const newImages: ImageData[] = [];

        for (const file of fileArray) {
          if (!file.type.startsWith('image/')) continue;

          const resizedUrl = await resizeImage(file, 2000);

          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = resizedUrl;
          });

          const palette = colorThief.getPalette(img, 5) as [number, number, number][] | null;
          const dominantColors: RGB[] = (palette || []).map(([r, g, b]) => ({ r, g, b }));
          const averageColor = dominantColors[0] || { r: 128, g: 128, b: 128 };

          newImages.push({
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            url: resizedUrl,
            dominantColors,
            averageColor,
          });
        }

        const allImages = [...images, ...newImages];
        setImages(allImages);

        if (workerRef.current && allImages.length > 0) {
          workerRef.current.postMessage({ images: allImages, threshold });
        } else {
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('处理图片失败:', error);
        setIsProcessing(false);
      }
    },
    [images, threshold, setImages, setIsProcessing]
  );

  const handleThresholdChange = useCallback(
    (value: number) => {
      setThreshold(value);
      if (images.length > 0 && workerRef.current) {
        setIsProcessing(true);
        workerRef.current.postMessage({ images, threshold: value });
      }
    },
    [images, setThreshold, setIsProcessing]
  );

  const handleReset = useCallback(() => {
    resetAll();
    if (window.resetCamera) {
      window.resetCamera();
    }
  }, [resetAll]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processImages(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processImages(e.target.files);
    }
  };

  const panelContent = (
    <div className="panel-content">
      <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 300, letterSpacing: '1px' }}>
        色彩聚类控制台
      </h2>

      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p style={{ fontSize: '13px', marginTop: '10px' }}>拖拽图片到此处</p>
        <p style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>或点击选择 (5-15张, JPG/PNG)</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
      </div>

      <div className="control-group">
        <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px' }}>
          聚类度阈值: <span style={{ color: '#667eea', fontWeight: 500 }}>{threshold}</span>
        </label>
        <input
          type="range"
          min="10"
          max="50"
          value={threshold}
          onChange={(e) => handleThresholdChange(Number(e.target.value))}
          className="slider"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', opacity: 0.5, marginTop: '4px' }}>
          <span>精细 (10)</span>
          <span>粗糙 (50)</span>
        </div>
      </div>

      <div className="control-group">
        <button className="reset-btn" onClick={handleReset}>
          重置视图 &amp; 参数
        </button>
      </div>

      <div className="stats">
        <div style={{ fontSize: '12px', opacity: 0.7 }}>
          当前图片: <span style={{ color: '#667eea' }}>{images.length}</span> / 15
        </div>
      </div>

      <style>{`
        .panel-content {
          padding: 24px;
        }
        .upload-zone {
          border: 2px dashed rgba(255,255,255,0.3);
          border-radius: 8px;
          padding: 30px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease-in-out;
          margin-bottom: 24px;
        }
        .upload-zone:hover {
          border-color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.03);
        }
        .upload-zone.dragging {
          border-color: #fff;
          border-style: solid;
          animation: pulse 0.3s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
          50% { box-shadow: 0 0 20px 5px rgba(255,255,255,0.2); }
        }
        .upload-icon {
          color: #667eea;
          display: flex;
          justify-content: center;
        }
        .control-group {
          margin-bottom: 24px;
        }
        .slider {
          width: 100%;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          cursor: pointer;
          transition: transform 0.2s;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        .reset-btn {
          width: 100%;
          padding: 12px 20px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 13px;
          font-weight: 300;
          cursor: pointer;
          transition: all 0.3s ease-in-out;
          letter-spacing: 0.5px;
        }
        .reset-btn:hover {
          filter: brightness(1.2);
        }
        .reset-btn:active {
          transform: scale(0.95);
        }
        .stats {
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
      `}</style>
    </div>
  );

  return (
    <>
      <div className={`ui-panel ${isMobile ? (isMobileMenuOpen ? 'mobile-open' : 'mobile-closed') : ''}`}>
        {isMobile ? (
          <>
            <button
              className="mobile-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            {isMobileMenuOpen && panelContent}
          </>
        ) : (
          panelContent
        )}
      </div>

      {selectedCluster && (
        <div className="detail-panel">
          <div className="detail-header">
            <div className="detail-color-dot" style={{ background: selectedCluster.colorHex }} />
            <h3>群组详情</h3>
            <button className="close-btn" onClick={() => setSelectedCluster(null)}>
              ×
            </button>
          </div>
          <div className="detail-body">
            <div className="detail-info">
              <p>图片数量: <span style={{ color: '#667eea' }}>{selectedCluster.images.length}</span></p>
              <p>主色调: <span style={{ color: selectedCluster.colorHex, fontWeight: 500 }}>{selectedCluster.colorHex.toUpperCase()}</span></p>
            </div>
            <div className="detail-images">
              {selectedCluster.images.map((img) => (
                <div key={img.id} className="detail-image-item">
                  <img src={img.url} alt={img.name} />
                  <div className="detail-image-info">
                    <p className="image-name">{img.name}</p>
                    <div className="image-colors">
                      {img.dominantColors.map((color, idx) => (
                        <span
                          key={idx}
                          className="color-swatch"
                          style={{ background: rgbToHex(color) }}
                          title={rgbToHex(color)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ui-panel {
          position: fixed;
          top: 0;
          left: 0;
          width: 280px;
          height: 100vh;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-right: 1px solid rgba(200, 180, 255, 0.2);
          color: white;
          z-index: 10;
          overflow-y: auto;
          transition: all 0.3s ease-in-out;
        }
        .ui-panel.mobile-closed {
          width: 60px;
          background: rgba(255, 255, 255, 0.05);
        }
        .ui-panel.mobile-open {
          width: 280px;
        }
        .mobile-toggle {
          width: 100%;
          padding: 20px;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          justify-content: center;
        }
        .detail-panel {
          position: fixed;
          bottom: 0;
          left: 280px;
          right: 0;
          max-height: 50vh;
          background: rgba(13, 13, 43, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid rgba(200, 180, 255, 0.2);
          color: white;
          z-index: 20;
          animation: slideUp 0.4s ease-in-out;
          overflow-y: auto;
        }
        @media (max-width: 768px) {
          .detail-panel {
            left: 60px;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .detail-header {
          display: flex;
          align-items: center;
          padding: 20px 30px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          position: sticky;
          top: 0;
          background: rgba(13, 13, 43, 0.98);
        }
        .detail-color-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          margin-right: 12px;
          box-shadow: 0 0 10px rgba(255,255,255,0.3);
        }
        .detail-header h3 {
          flex: 1;
          font-size: 16px;
          font-weight: 300;
        }
        .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .close-btn:hover {
          opacity: 1;
        }
        .detail-body {
          padding: 20px 30px;
        }
        .detail-info {
          display: flex;
          gap: 30px;
          margin-bottom: 20px;
          font-size: 13px;
        }
        .detail-images {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }
        .detail-image-item {
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
          transition: transform 0.3s ease-in-out;
        }
        .detail-image-item:hover {
          transform: translateY(-2px);
        }
        .detail-image-item img {
          width: 100%;
          height: 120px;
          object-fit: cover;
        }
        .detail-image-info {
          padding: 10px 12px;
        }
        .image-name {
          font-size: 11px;
          opacity: 0.8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 8px;
        }
        .image-colors {
          display: flex;
          gap: 4px;
        }
        .color-swatch {
          width: 18px;
          height: 18px;
          border-radius: 3px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .color-swatch:hover {
          transform: scale(1.2);
        }
      `}</style>
    </>
  );
}
