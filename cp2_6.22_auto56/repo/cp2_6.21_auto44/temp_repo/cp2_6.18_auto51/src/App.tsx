import React, { useState, useRef, useCallback, useEffect } from 'react';
import ControlPanel, { MosaicConfig } from './ControlPanel';
import PreviewCanvas, { PreviewCanvasHandle } from './PreviewCanvas';
import { pixelate, matchEmoji, MosaicCell, PixelBlock } from './imageProcessor';

const App: React.FC = () => {
  const [config, setConfig] = useState<MosaicConfig>({
    cellSize: 16,
    emojiStyle: 'classic',
    colorThreshold: 0.25,
  });

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [cells, setCells] = useState<MosaicCell[]>([]);
  const [blocks, setBlocks] = useState<PixelBlock[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<PreviewCanvasHandle>(null);
  const debounceRef = useRef<number | null>(null);
  const imageSizeRef = useRef<{ width: number; height: number } | null>(null);

  const doProcess = useCallback(
    (img: HTMLImageElement, cfg: MosaicConfig) => {
      setProcessing(true);
      window.setTimeout(() => {
        const startTime = performance.now();
        const px = pixelate(img, cfg.cellSize);
        setBlocks(px);
        const matched = matchEmoji(px, cfg.emojiStyle, cfg.colorThreshold);
        setCells(matched);
        imageSizeRef.current = { width: img.naturalWidth, height: img.naturalHeight };
        setProcessing(false);
        console.log(`Processed in ${(performance.now() - startTime).toFixed(0)}ms, ${matched.length} cells`);
      }, 30);
    },
    [],
  );

  const scheduleProcess = useCallback(
    (img: HTMLImageElement, cfg: MosaicConfig) => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      debounceRef.current = window.setTimeout(() => {
        doProcess(img, cfg);
      }, 300);
    },
    [doProcess],
  );

  useEffect(() => {
    if (image) {
      if (blocks.length > 0 && blocks[0]) {
        const origCols = Math.max(...blocks.map((b) => b.col)) + 1;
        const expectedCols = Math.ceil(image.naturalWidth / config.cellSize);
        if (origCols === expectedCols) {
          scheduleProcess(image, config);
        } else {
          scheduleProcess(image, config);
        }
      } else {
        scheduleProcess(image, config);
      }
    }
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, image]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    const baseName = file.name.replace(/\.[^.]+$/, '');
    setImageName(baseName);

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPreviewUrl(url);
      const img = new Image();
      img.onload = () => {
        setImage(img);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const onUploadClick = () => fileInputRef.current?.click();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;
    const blobPromise = previewRef.current.exportHD();
    if (!blobPromise) return;
    const blob = await blobPromise;

    const styleMap: Record<string, string> = {
      classic: 'classic',
      animal: 'animal',
      food: 'food',
    };
    const name = imageName || 'image';
    const fileName = `${name}_${config.cellSize}px_${styleMap[config.emojiStyle]}.png`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: '#EDF2F7',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 680,
          minWidth: 680,
          height: '100%',
          padding: 32,
          paddingRight: 0,
          boxSizing: 'border-box',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
          <div
            style={{
              width: 400,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              onClick={onUploadClick}
              onDrop={onDrop}
              onDragOver={onDragOver}
              style={{
                width: 400,
                height: 300,
                border: '2px dashed #ACC8E5',
                borderRadius: 16,
                background: processing ? 'rgba(247,250,252,0.5)' : '#F7FAFC',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                transition: 'background 0.3s ease, border-color 0.3s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#667EEA';
                (e.currentTarget as HTMLDivElement).style.background = '#EFF6FF';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#ACC8E5';
                (e.currentTarget as HTMLDivElement).style.background = processing
                  ? 'rgba(247,250,252,0.5)'
                  : '#F7FAFC';
              }}
            >
              {previewUrl && !processing ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: 8,
                  }}
                />
              ) : null}

              {!previewUrl && !processing ? (
                <div style={{ textAlign: 'center', color: '#94A3B8' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>
                    点击或拖拽上传图片
                  </div>
                  <div style={{ fontSize: 12 }}>支持 JPG、PNG、WEBP 等格式</div>
                </div>
              ) : null}

              {processing ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(247,250,252,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(2px)',
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      border: '3px solid transparent',
                      borderTopColor: '#FF0000',
                      borderRightColor: '#FF7F00',
                      borderBottomColor: '#00FF00',
                      borderLeftColor: '#0000FF',
                      animation: 'emoji-spin 2s linear infinite',
                    }}
                  />
                </div>
              ) : null}
            </div>

            {previewUrl ? (
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                }}
              >
                <img
                  src={previewUrl}
                  alt="thumbnail"
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                  }}
                />
                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 600, color: '#334155' }}>
                    {imageName || '未命名'}
                  </div>
                  {image ? (
                    <div>
                      {image.naturalWidth} × {image.naturalHeight} px
                    </div>
                  ) : null}
                  <div
                    style={{ color: '#667EEA', cursor: 'pointer', marginTop: 2 }}
                    onClick={onUploadClick}
                  >
                    重新上传
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <ControlPanel config={config} onChange={setConfig} />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 20px',
            background: '#FFFFFF',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 32 }}>✨</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 2 }}>
              EmojiMosaic
            </div>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              用 Emoji 把你的照片变成艺术马赛克。调节左侧参数实时预览，满意后点击右下角下载高清作品。
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: '#94A3B8',
            }}
          >
            {cells.length > 0 ? (
              <>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    background: '#EFF6FF',
                    color: '#667EEA',
                    fontWeight: 600,
                  }}
                >
                  {cells.length} 个 Emoji
                </span>
              </>
            ) : (
              <span>等待上传...</span>
            )}
          </div>
        </div>
      </div>

      <PreviewCanvas
        ref={previewRef}
        cells={cells}
        imageSize={imageSizeRef.current}
        config={config}
      />

      <button
        onClick={handleDownload}
        disabled={cells.length === 0}
        style={{
          position: 'fixed',
          left: 32,
          bottom: 32,
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: 'none',
          background:
            cells.length === 0
              ? '#CBD5E1'
              : 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
          boxShadow:
            cells.length === 0
              ? '0 4px 12px rgba(0,0,0,0.1)'
              : '0 4px 16px rgba(102,126,234,0.4)',
          cursor: cells.length === 0 ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          zIndex: 100,
          fontSize: 24,
        }}
        onMouseEnter={(e) => {
          if (cells.length > 0) {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              '0 6px 24px rgba(102,126,234,0.6)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            cells.length === 0
              ? '0 4px 12px rgba(0,0,0,0.1)'
              : '0 4px 16px rgba(102,126,234,0.4)';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
        onMouseDown={(e) => {
          if (cells.length > 0) {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)';
            window.setTimeout(() => {
              if (e.currentTarget) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
              }
            }, 100);
          }
        }}
        title="下载高清图片"
      >
        ⬇️
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <style>
        {`
          @keyframes emoji-spin {
            0% { transform: rotate(0deg); border-top-color: #FF0000; border-right-color: #FF7F00; border-bottom-color: #FFFF00; border-left-color: #00FF00; }
            25% { transform: rotate(90deg); border-top-color: #FF7F00; border-right-color: #FFFF00; border-bottom-color: #00FF00; border-left-color: #0000FF; }
            50% { transform: rotate(180deg); border-top-color: #FFFF00; border-right-color: #00FF00; border-bottom-color: #0000FF; border-left-color: #8B00FF; }
            75% { transform: rotate(270deg); border-top-color: #00FF00; border-right-color: #0000FF; border-bottom-color: #8B00FF; border-left-color: #FF0000; }
            100% { transform: rotate(360deg); border-top-color: #FF0000; border-right-color: #FF7F00; border-bottom-color: #FFFF00; border-left-color: #00FF00; }
          }
        `}
      </style>
    </div>
  );
};

export default App;
