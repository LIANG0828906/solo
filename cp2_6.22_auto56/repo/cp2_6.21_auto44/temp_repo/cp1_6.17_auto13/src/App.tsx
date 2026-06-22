import React, { useRef, useState } from 'react';
import CanvasPreview from './CanvasPreview';
import FilterControls from './FilterControls';
import LayerPanel from './LayerPanel';
import { useStore } from './store';
import { PLATFORM_SIZES } from './types';

const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvas = useStore((state) => state.canvas);
  const layers = useStore((state) => state.layers);
  const setCanvasDimensions = useStore((state) => state.setCanvasDimensions);
  const addImageLayer = useStore((state) => state.addImageLayer);
  const isDownloading = useStore((state) => state.isDownloading);
  const setDownloading = useStore((state) => state.setDownloading);
  const isUploading = useStore((state) => state.isUploading);
  const uploadProgress = useStore((state) => state.uploadProgress);
  const setUploading = useStore((state) => state.setUploading);
  const setUploadProgress = useStore((state) => state.setUploadProgress);

  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.name.endsWith('.zip')) {
        console.warn('ZIP upload requires server processing, skipping demo');
        continue;
      }

      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const progress = ((i + evt.loaded / evt.total) / files.length) * 100;
            setUploadProgress(Math.min(progress, 95));
          }
        };
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          const img = new Image();
          img.onload = () => {
            addImageLayer(dataUrl, img.width, img.height, file.name.replace(/\.[^/.]+$/, ''));
            resolve();
          };
          img.onerror = () => resolve();
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
      });
    }

    setUploadProgress(100);
    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
    }, 300);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async () => {
    if (layers.length === 0) {
      alert('请先添加至少一个图层');
      return;
    }

    setDownloading(true);

    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      for (const layer of layers) {
        ctx.save();

        const centerX = layer.x + layer.width / 2;
        const centerY = layer.y + layer.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
        ctx.globalAlpha = layer.opacity;

        const filterParts: string[] = [];
        const f = layer.filter;
        if (f.brightness !== 100) filterParts.push(`brightness(${f.brightness}%)`);
        if (f.contrast !== 100) filterParts.push(`contrast(${f.contrast}%)`);
        if (f.hueRotate !== 0) filterParts.push(`hue-rotate(${f.hueRotate}deg)`);
        if (f.saturate !== 100) filterParts.push(`saturate(${f.saturate}%)`);
        if (f.blur > 0) filterParts.push(`blur(${f.blur}px)`);
        if (f.sepia > 0) filterParts.push(`sepia(${f.sepia}%)`);
        if (f.grayscale > 0) filterParts.push(`grayscale(${f.grayscale}%)`);
        if (filterParts.length > 0) ctx.filter = filterParts.join(' ');

        if (layer.type === 'image' && layer.src) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = layer.src!;
          });
          ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height);
        } else if (layer.type === 'text' && layer.textConfig) {
          const tc = layer.textConfig;
          ctx.font = `${tc.fontWeight} ${tc.fontSize}px ${tc.fontFamily}`;
          ctx.fillStyle = tc.color;
          ctx.textAlign = tc.textAlign;
          ctx.textBaseline = 'top';
          ctx.globalAlpha = tc.opacity * layer.opacity;

          let textX = layer.x;
          if (tc.textAlign === 'center') textX = layer.x + layer.width / 2;
          else if (tc.textAlign === 'right') textX = layer.x + layer.width;

          const lines = tc.content.split('\n');
          const lineHeight = tc.fontSize * 1.2;
          lines.forEach((line, i) => {
            ctx.fillText(line, textX, layer.y + i * lineHeight);
          });
        }

        ctx.restore();
      }

      const dataUrl = exportCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `主图_${canvas.platform}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      setShowDownloadSuccess(true);
      setTimeout(() => setShowDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Download failed:', err);
      alert('下载失败，请重试');
    } finally {
      setDownloading(false);
    }
  };

  const platforms = Object.entries(PLATFORM_SIZES) as [keyof typeof PLATFORM_SIZES, typeof PLATFORM_SIZES[string]][];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#fff',
      }}
    >
      <div
        style={{
          height: 56,
          backgroundColor: '#fff',
          borderBottom: '1px solid #E0E0E0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 20,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 16,
            }}
          >
            图
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>
            商品主图生成器
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#616161' }}>画布尺寸：</span>
          <select
            value={canvas.platform}
            onChange={(e) => setCanvasDimensions(e.target.value as 'taobao' | 'jd' | 'pdd')}
            style={{
              padding: '6px 12px',
              fontSize: 13,
              borderRadius: 4,
              border: '1px solid #E0E0E0',
              backgroundColor: '#fff',
              cursor: 'pointer',
              minWidth: 180,
            }}
          >
            {platforms.map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          style={{
            height: 36,
            padding: '0 20px',
            backgroundColor: '#1976D2',
            color: '#fff',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.3s ease',
            opacity: isDownloading ? 0.7 : 1,
            cursor: isDownloading ? 'wait' : 'pointer',
          }}
        >
          {isDownloading ? (
            <>
              <div
                style={{
                  width: 16,
                  height: 16,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              生成中...
            </>
          ) : (
            <>
              <span style={{ fontSize: 14 }}>⬇</span>
              下载合成图片
            </>
          )}
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            style={{
              width: 120,
              height: 36,
              backgroundColor: '#1976D2',
              color: '#fff',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.3s ease',
              opacity: isUploading ? 0.7 : 1,
            }}
          >
            {isUploading ? (
              <div
                style={{
                  width: 18,
                  height: 18,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            ) : (
              <>
                <span style={{ fontSize: 14 }}>+</span>
                上传图片
              </>
            )}
          </button>
          {isUploading && (
            <div
              style={{
                position: 'absolute',
                bottom: -4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 100,
                height: 3,
                backgroundColor: 'rgba(255,255,255,0.3)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  backgroundColor: '#fff',
                  transition: 'width 0.1s ease',
                }}
              />
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,.zip"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <FilterControls />
        <CanvasPreview />
        <LayerPanel />
      </div>

      {showDownloadSuccess && (
        <div
          style={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: '#fff',
            borderRadius: 8,
            fontSize: 14,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            zIndex: 1000,
            animation: 'slideDown 0.3s ease',
          }}
        >
          ✓ 图片下载成功！
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
};

export default App;
