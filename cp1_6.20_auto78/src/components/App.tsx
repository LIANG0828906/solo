import React, { useCallback, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { v4 as uuidv4 } from 'uuid';
import CanvasEditor from './CanvasEditor';
import TextPanel from './TextPanel';
import UploadPanel from './UploadPanel';
import { THEME } from '../types';
import type { AppStep, DialogBox, MangaPage } from '../types';
import { detectDialogBoxes } from '../utils/textDetector';

export default function App() {
  const [pages, setPages] = useState<MangaPage[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [step, setStep] = useState<AppStep>('detect');
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentPage = pages.find((p) => p.id === currentPageId) || null;

  const handleImageUpload = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const boxes = detectDialogBoxes(img.width, img.height);
        const page: MangaPage = {
          id: uuidv4(),
          imageUrl: url,
          imageWidth: img.width,
          imageHeight: img.height,
          dialogBoxes: boxes,
        };
        setPages((prev) => [...prev, page]);
        setCurrentPageId(page.id);
        setSelectedBoxId(null);
        setStep('edit');
      };
      img.src = url;
    },
    []
  );

  const handleSelectBox = useCallback((id: string | null) => {
    setSelectedBoxId(id);
  }, []);

  const handleUpdateBox = useCallback(
    (id: string, updates: Partial<DialogBox>) => {
      setPages((prev) =>
        prev.map((p) =>
          p.id === currentPageId
            ? {
                ...p,
                dialogBoxes: p.dialogBoxes.map((b) =>
                  b.id === id ? { ...b, ...updates } : b
                ),
              }
            : p
        )
      );
    },
    [currentPageId]
  );

  const handlePageSelect = useCallback((id: string) => {
    setCurrentPageId(id);
    setSelectedBoxId(null);
  }, []);

  const handleExport = useCallback(async () => {
    if (!currentPage) return;
    setStep('export');

    const canvas = document.createElement('canvas');
    canvas.width = currentPage.imageWidth;
    canvas.height = currentPage.imageHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.src = currentPage.imageUrl;
    });

    ctx.drawImage(img, 0, 0, currentPage.imageWidth, currentPage.imageHeight);

    currentPage.dialogBoxes.forEach((box) => {
      const displayText = box.translatedText || box.originalText;
      if (!displayText) return;

      ctx.save();
      ctx.font = `${box.fontSize}px ${box.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (box.strokeWidth > 0) {
        ctx.strokeStyle = box.strokeColor;
        ctx.lineWidth = box.strokeWidth * 2;
        ctx.lineJoin = 'round';
        ctx.strokeText(displayText, box.textX, box.textY);
      }

      ctx.fillStyle = box.fontColor;
      ctx.fillText(displayText, box.textX, box.textY);
      ctx.restore();
    });

    const dataUrl = canvas.toDataURL('image/png');
    setPreviewUrl(dataUrl);
    setShowPreview(true);
  }, [currentPage]);

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = 'manga-translated.png';
    a.click();
    setShowPreview(false);
  }, [previewUrl]);

  const steps: { key: AppStep; label: string }[] = [
    { key: 'detect', label: '检测' },
    { key: 'edit', label: '编辑' },
    { key: 'export', label: '导出' },
  ];

  const stepOrder: AppStep[] = ['detect', 'edit', 'export'];
  const currentIdx = stepOrder.indexOf(step);

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: THEME.bg,
        color: THEME.text,
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <header
        style={{
          padding: '12px 24px',
          background: THEME.card,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px', fontWeight: 700 }}>🎨</span>
          <span style={{ fontSize: '16px', fontWeight: 600 }}>
            漫画对话框文字提取与翻译
          </span>
        </div>
        {currentPage && (
          <button
            onClick={handleExport}
            className="btn-hover"
            style={{
              padding: '8px 20px',
              background: THEME.highlight,
              border: 'none',
              borderRadius: THEME.radius,
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(233,69,96,0.3)',
            }}
          >
            导出 PNG
          </button>
        )}
      </header>

      <div
        className="app-layout"
        style={{
          flex: 1,
          display: 'flex',
          gap: '12px',
          padding: '12px',
          overflow: 'hidden',
        }}
      >
        <UploadPanel
          onImageUpload={handleImageUpload}
          pages={pages.map((p) => ({ id: p.id, imageUrl: p.imageUrl }))}
          currentPageId={currentPageId}
          onPageSelect={handlePageSelect}
        />

        <CanvasEditor
          imageUrl={currentPage?.imageUrl ?? null}
          imageWidth={currentPage?.imageWidth ?? 0}
          imageHeight={currentPage?.imageHeight ?? 0}
          dialogBoxes={currentPage?.dialogBoxes ?? []}
          selectedBoxId={selectedBoxId}
          onSelectBox={handleSelectBox}
          onUpdateBox={handleUpdateBox}
        />

        <TextPanel
          dialogBoxes={currentPage?.dialogBoxes ?? []}
          selectedBoxId={selectedBoxId}
          onUpdateBox={handleUpdateBox}
          onSelectBox={handleSelectBox}
        />
      </div>

      <div
        style={{
          padding: '12px 24px',
          background: THEME.card,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '48px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 -2px 4px rgba(0,0,0,0.2)',
        }}
      >
        {steps.map((s, idx) => {
          const isComplete = idx < currentIdx;
          const isCurrent = s.key === step;
          return (
            <div
              key={s.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                className={isComplete ? 'check-anim' : undefined}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isComplete
                    ? THEME.green
                    : isCurrent
                    ? THEME.orange
                    : 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  transition: 'all 0.3s',
                }}
              >
                {isComplete ? '✓' : idx + 1}
              </div>
              <span
                style={{
                  fontSize: '13px',
                  color: isComplete
                    ? THEME.green
                    : isCurrent
                    ? THEME.text
                    : '#666',
                  fontWeight: isCurrent ? 600 : 400,
                }}
              >
                {s.label}
              </span>
              {idx < steps.length - 1 && (
                <div
                  style={{
                    width: '48px',
                    height: '2px',
                    background:
                      idx < currentIdx ? THEME.green : 'rgba(255,255,255,0.1)',
                    marginLeft: '8px',
                    transition: 'background 0.3s',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {showPreview && previewUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowPreview(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: THEME.card,
              borderRadius: THEME.radius,
              padding: '24px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 600 }}>
                导出预览
              </span>
              <button
                onClick={() => setShowPreview(false)}
                className="btn-hover"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: THEME.radius,
                  color: THEME.text,
                  padding: '4px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                关闭
              </button>
            </div>
            <div
              style={{
                overflow: 'auto',
                maxWidth: '80vw',
                maxHeight: '70vh',
                borderRadius: THEME.radius,
              }}
            >
              <img
                src={previewUrl}
                alt="preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: THEME.radius,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowPreview(false)}
                className="btn-hover"
                style={{
                  padding: '8px 20px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: THEME.radius,
                  color: THEME.text,
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                取消
              </button>
              <button
                onClick={handleDownload}
                className="btn-hover"
                style={{
                  padding: '8px 20px',
                  background: THEME.green,
                  border: 'none',
                  borderRadius: THEME.radius,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(76,175,80,0.3)',
                }}
              >
                下载 PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
