import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useColorStore } from './store/colorStore';
import { extractColors } from './modules/extractor/colorExtractor';
import ColorCard from './modules/editor/ColorCard';
import ExportPanel from './modules/editor/ExportPanel';

const App: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const {
    extractedColors,
    manualColors,
    selectedIndex,
    setExtractedColors,
    toggleLock,
    removeColor,
    reorderColors,
    setSelectedIndex,
    getAllColors,
  } = useColorStore();

  const allColors = useMemo(() => getAllColors(), [extractedColors, manualColors, getAllColors]);

  const processImage = useCallback(async (file: File) => {
    const isValidType =
      file.type === 'image/png' ||
      file.type === 'image/jpeg' ||
      file.type === 'image/jpg' ||
      /\.(png|jpe?g)$/i.test(file.name);

    if (!isValidType) {
      setErrorMsg('仅支持 .png 和 .jpg 格式的图片');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = url;
      });

      const canvas =
        canvasRef.current ??
        (canvasRef.current = document.createElement('canvas'));

      const maxDim = 1200;
      let { width, height } = img;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Canvas 2D 上下文不可用');

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);

      const start = performance.now();
      const colors = extractColors(imageData);
      const duration = performance.now() - start;
      console.debug(`[ColorHunt] 颜色提取耗时: ${duration.toFixed(0)}ms (${width}x${height})`);

      if (colors.length === 0) {
        throw new Error('未能从图片中提取有效颜色');
      }

      setExtractedColors(colors);
      URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '处理图片时发生错误');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  }, [setExtractedColors]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) void processImage(f);
      e.target.value = '';
    },
    [processImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) void processImage(f);
    },
    [processImage]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCardDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) setDragOverId(id);
  };

  const handleCardDrop = (id: string) => {
    if (dragId && dragId !== id) {
      reorderColors(dragId, id);
    }
    setDragId(null);
    setDragOverId(null);
  };

  const handleCardDragEnd = () => {
    setDragId(null);
    setDragOverId(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '48px 24px 80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景装饰 */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -160,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 720,
          height: 720,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, rgba(99, 102, 241, 0.06) 40%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(30px)',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: -200,
          right: -150,
          width: 520,
          height: 520,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(165, 180, 252, 0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
          filter: 'blur(40px)',
        }}
      />

      {/* 标题 */}
      <header style={{ textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 10,
          }}
        >
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#A5B4FC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r="2.5"></circle>
            <circle cx="17.5" cy="10.5" r="2.5"></circle>
            <circle cx="8.5" cy="7.5" r="2.5"></circle>
            <circle cx="6.5" cy="12.5" r="2.5"></circle>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.8-.1 2.6-.4.6-.2 1.1-.6 1.4-1.2 1-1.9 1.4-4.1 1.1-6.4-.2-1.4 1-1.5 1.7-2.5.8-1 1.1-2.3.9-3.6C20.5 4.7 16.4 2 12 2z"></path>
          </svg>
          <h1
            style={{
              fontSize: '1.9rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #E4E4E7 0%, #A5B4FC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: -0.5,
            }}
          >
            ColorHunt
          </h1>
        </div>
        <p style={{ fontSize: '0.92rem', color: '#6B7280', maxWidth: 440, lineHeight: 1.6 }}>
          上传一张参考图片，AI 自动提取主色调与辅助色，生成可直接用于项目的专业调色板
        </p>
      </header>

      {/* 上传区域 */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setIsDragging(false);
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          width: 400,
          height: 280,
          maxWidth: '100%',
          border: `2px ${isDragging ? 'solid' : 'dashed'} ${isDragging ? '#93C5FD' : '#A5B4FC'}`,
          borderRadius: 16,
          background: isDragging
            ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)'
            : '#FAFAFA',
          color: '#6B7280',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          cursor: 'pointer',
          transition: 'all 0.3s ease-out',
          userSelect: 'none',
          position: 'relative',
          zIndex: 1,
          boxShadow: isDragging
            ? '0 12px 32px rgba(59, 130, 246, 0.25)'
            : '0 4px 20px rgba(0, 0, 0, 0.06)',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,image/png,image/jpeg"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: 18,
            background: isDragging
              ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
              : 'linear-gradient(135deg, #C7D2FE, #A5B4FC)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease-out',
            transform: isDragging ? 'translateY(-4px) scale(1.06)' : 'scale(1)',
            boxShadow: isDragging
              ? '0 8px 24px rgba(139, 92, 246, 0.4)'
              : '0 4px 14px rgba(139, 92, 246, 0.2)',
          }}
        >
          {isProcessing ? (
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ animation: 'spin 1s linear infinite' }}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
              <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="none"></rect>
            </svg>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontSize: '1rem',
              fontWeight: 500,
              color: isDragging ? '#3730A3' : '#6B7280',
              marginBottom: 4,
              transition: 'color 0.3s',
            }}
          >
            {isProcessing ? '正在提取核心颜色...' : isDragging ? '松开以上传图片' : '拖拽图片到这里或点击上传'}
          </p>
          <p
            style={{
              fontSize: '0.8rem',
              color: '#9CA3AF',
            }}
          >
            支持 PNG / JPG 格式
          </p>
        </div>
      </div>

      {/* 错误提示 */}
      {errorMsg && (
        <div
          style={{
            marginTop: 16,
            padding: '10px 18px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#FCA5A5',
            borderRadius: 10,
            fontSize: '0.85rem',
            maxWidth: 400,
            textAlign: 'center',
            zIndex: 2,
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* 空状态提示 */}
      {allColors.length === 0 && !isProcessing && (
        <div
          style={{
            marginTop: 56,
            textAlign: 'center',
            color: '#52525B',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              marginBottom: 16,
            }}
          >
            {['#FCA5A5', '#FCD34D', '#86EFAC', '#93C5FD', '#C4B5FD'].map((c, i) => (
              <div
                key={c}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: c,
                  opacity: 0.55,
                  transform: `rotate(${(i - 2) * 4}deg)`,
                  boxShadow: `0 2px 8px ${c}33`,
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: '0.85rem' }}>上传图片后将在此展示自动提取的 5 种核心颜色</p>
        </div>
      )}

      {/* 调色板网格 */}
      {allColors.length > 0 && (
        <>
          <div
            style={{
              marginTop: 56,
              marginBottom: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              zIndex: 1,
              position: 'relative',
            }}
          >
            <div style={{ width: 28, height: 1, background: 'linear-gradient(90deg, transparent, #A5B4FC)' }} />
            <span style={{ fontSize: '0.78rem', color: '#A5B4FC', letterSpacing: 2, textTransform: 'uppercase' }}>
              Color Palette · {allColors.length} 色
            </span>
            <div style={{ width: 28, height: 1, background: 'linear-gradient(90deg, #A5B4FC, transparent)' }} />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, 160px)',
              justifyContent: 'center',
              gap: 20,
              maxWidth: 900,
              width: '100%',
              zIndex: 1,
              position: 'relative',
            }}
          >
            {allColors.map((color, idx) => (
              <ColorCard
                key={color.id}
                color={color}
                index={idx}
                isSelected={selectedIndex === idx}
                onSelect={() => setSelectedIndex(selectedIndex === idx ? null : idx)}
                onToggleLock={toggleLock}
                onRemove={removeColor}
                onDragStart={setDragId}
                onDragOver={handleCardDragOver}
                onDrop={handleCardDrop}
                onDragEnd={handleCardDragEnd}
                isDragging={dragId === color.id}
                isDragOver={dragOverId === color.id && dragId !== color.id}
              />
            ))}
          </div>

          {/* 拖拽提示 */}
          <div style={{ marginTop: 18, fontSize: '0.75rem', color: '#52525B', zIndex: 1 }}>
            💡 点击卡片展开查看色值 · 拖拽卡片可重新排序 · 点击小锁可锁定颜色
          </div>

          {/* 操作按钮组 */}
          <div style={{ marginTop: 48, zIndex: 1, position: 'relative' }}>
            <ExportPanel colors={allColors} />
          </div>
        </>
      )}

      {/* 页脚 */}
      <footer
        style={{
          marginTop: 'auto',
          paddingTop: 64,
          fontSize: '0.72rem',
          color: '#3F3F46',
          zIndex: 1,
        }}
      >
        ColorHunt · Powered by K-Means Clustering
      </footer>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          [data-uploader] {
            width: 90% !important;
            height: auto !important;
            min-height: 220px;
            padding: 32px 20px !important;
          }
        }

        @media (max-width: 768px) {
          :where([style*="grid-template-columns: repeat(auto-fill, 160px)"]) {
            grid-template-columns: repeat(2, minmax(140px, 1fr)) !important;
            gap: 14px !important;
          }
          :where([style*="width: 160px"]) {
            width: 100% !important;
          }
        }
      `}</style>

      <style>{`
        @media (max-width: 768px) {
          [data-uploader] { width: 90% !important; height: auto !important; min-height: 220px; }
          [data-buttons] > div {
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100% !important;
          }
          [data-buttons] button {
            width: 100% !important;
            justify-content: center !important;
          }
          [data-colors] {
            grid-template-columns: repeat(2, minmax(140px, 1fr)) !important;
            gap: 14px !important;
          }
          [data-card] { width: 100% !important; }
          [data-hex] { font-size: 0.8rem !important; }
          [data-title] { font-size: 1.5rem !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
