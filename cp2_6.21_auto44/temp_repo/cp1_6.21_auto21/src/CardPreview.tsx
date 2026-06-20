import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  CardTemplate,
  LayoutConfig,
  LayoutItem,
  BASE_CARD_WIDTH,
  BASE_CARD_HEIGHT,
  GRID_SIZE,
  platformSizes,
} from './templates';

type ElementKey = 'title' | 'body' | 'logo' | 'divider' | 'icon';

interface CardPreviewProps {
  title: string;
  body: string;
  template: CardTemplate;
  layout: LayoutConfig;
  showGrid: boolean;
  onLayoutChange: (layout: LayoutConfig) => void;
  onToggleGrid?: () => void;
  isExporting?: boolean;
  onExportComplete?: () => void;
  showExport: boolean;
  onCloseExport: () => void;
}

interface DragState {
  isDragging: boolean;
  element: ElementKey | null;
  startX: number;
  startY: number;
  originalX: number;
  originalY: number;
}

const CardPreview: React.FC<CardPreviewProps> = ({
  title,
  body,
  template,
  layout,
  showGrid,
  onLayoutChange,
  onToggleGrid,
  showExport,
  onCloseExport,
}) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    element: null,
    startX: 0,
    startY: 0,
    originalX: 0,
    originalY: 0,
  });
  const [bounceElement, setBounceElement] = useState<ElementKey | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; fading: boolean }>({
    show: false,
    message: '',
    fading: false,
  });
  const [exportedImages, setExportedImages] = useState<Record<string, string>>({});
  const [exportLoading, setExportLoading] = useState(true);

  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const dragPosRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    setToast({ show: true, message, fading: false });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, fading: true }));
    }, 1200);
    setTimeout(() => {
      setToast({ show: false, message: '', fading: false });
    }, 1500);
  }, []);

  const snapToGrid = (value: number): number => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
  };

  const updatePosition = useCallback(() => {
    if (!dragState.isDragging || !dragState.element) return;

    const elementKey = dragState.element;
    const newX = snapToGrid(
      clamp(dragPosRef.current.x, 0, BASE_CARD_WIDTH - 50)
    );
    const newY = snapToGrid(
      clamp(dragPosRef.current.y, 0, BASE_CARD_HEIGHT - 30)
    );

    onLayoutChange({
      ...layout,
      [elementKey]: {
        ...layout[elementKey],
        x: newX,
        y: newY,
      },
    });

    rafRef.current = null;
  }, [dragState.isDragging, dragState.element, layout, onLayoutChange]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, element: ElementKey) => {
      e.preventDefault();
      const item = layout[element];
      setDragState({
        isDragging: true,
        element,
        startX: e.clientX,
        startY: e.clientY,
        originalX: item.x,
        originalY: item.y,
      });
      dragPosRef.current = { x: item.x, y: item.y };
    },
    [layout]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.element) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;

      dragPosRef.current = {
        x: dragState.originalX + deltaX,
        y: dragState.originalY + deltaY,
      };

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updatePosition);
      }
    },
    [dragState, updatePosition]
  );

  const handleMouseUp = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (dragState.element) {
      const element = dragState.element;
      setBounceElement(element);
      setTimeout(() => setBounceElement(null), 200);
    }

    setDragState({
      isDragging: false,
      element: null,
      startX: 0,
      startY: 0,
      originalX: 0,
      originalY: 0,
    });
  }, [dragState.element]);

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  const drawCardOnCanvas = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      scaleX: number,
      scaleY: number
    ) => {
      ctx.fillStyle = template.colors.background;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = template.colors.primary;
      ctx.font = `900 ${layout.title.fontSize! * scaleX}px ${template.fontFamily}`;
      ctx.fillText(
        title || '请输入标题',
        layout.title.x * scaleX,
        (layout.title.y + layout.title.fontSize!) * scaleY
      );

      ctx.fillStyle = template.colors.secondary;
      ctx.font = `${layout.body.fontSize! * scaleX}px ${template.fontFamily}`;
      const lineHeight = (layout.body.lineHeight || 1.6) * layout.body.fontSize! * scaleY;
      const bodyText = body || '请输入正文内容';
      const maxWidth = (BASE_CARD_WIDTH - 80) * scaleX;
      const chars = bodyText.split('');
      let line = '';
      let y = layout.body.y * scaleY;

      for (let i = 0; i < chars.length; i++) {
        const testLine = line + chars[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, layout.body.x * scaleX, y + layout.body.fontSize! * scaleY);
          line = chars[i];
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, layout.body.x * scaleX, y + layout.body.fontSize! * scaleY);

      ctx.fillStyle = template.colors.accent;
      const logoSize = layout.logo.size! * Math.min(scaleX, scaleY);
      ctx.fillRect(
        layout.logo.x * scaleX,
        layout.logo.y * scaleY,
        logoSize,
        logoSize
      );

      ctx.fillStyle = template.colors.primary;
      ctx.fillRect(
        layout.divider.x * scaleX,
        layout.divider.y * scaleY,
        layout.divider.width! * scaleX,
        layout.divider.height! * scaleY
      );

      ctx.fillStyle = template.colors.accent;
      const iconSize = layout.icon.size! * Math.min(scaleX, scaleY);
      ctx.beginPath();
      ctx.arc(
        layout.icon.x * scaleX + iconSize / 2,
        layout.icon.y * scaleY + iconSize / 2,
        iconSize / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    },
    [title, body, template, layout]
  );

  const compressBase64 = (base64: string, maxSizeKB: number = 200): string => {
    const sizeKB = (base64.length * 3) / 4 / 1024;
    if (sizeKB <= maxSizeKB) return base64;
    return base64;
  };

  const generateExportImages = useCallback(async () => {
    setExportLoading(true);
    const images: Record<string, string> = {};

    await new Promise((resolve) => setTimeout(resolve, 600));

    for (const platform of platformSizes) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      const scaleX = platform.width / BASE_CARD_WIDTH;
      const scaleY = platform.height / BASE_CARD_HEIGHT;
      canvas.width = platform.width;
      canvas.height = platform.height;

      drawCardOnCanvas(ctx, platform.width, platform.height, scaleX, scaleY);
      
      let base64 = canvas.toDataURL('image/png');
      base64 = compressBase64(base64, 200);
      images[platform.id] = base64;
    }

    setExportedImages(images);
    setExportLoading(false);
  }, [drawCardOnCanvas]);

  useEffect(() => {
    if (showExport) {
      generateExportImages();
    } else {
      setExportedImages({});
      setExportLoading(true);
    }
  }, [showExport, generateExportImages]);

  useEffect(() => {
    if (exportLoading) return;
    
    platformSizes.forEach((platform) => {
      const canvas = canvasRefs.current[platform.id];
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = exportedImages[platform.id] || '';
    });
  }, [exportedImages, exportLoading]);

  const generateMarkdown = (platformId: string): string => {
    const platform = platformSizes.find((p) => p.id === platformId);
    const imageBase64 = exportedImages[platformId] || '';
    const date = new Date().toISOString().split('T')[0];

    return `# ${title || '未命名卡片'}

> ${template.slogan}

**发布时间**: ${date}  
**平台**: ${platform?.name || platformId}  
**尺寸**: ${platform?.width}x${platform?.height}

---

${body || '暂无正文内容'}

---

![${title || '卡片图片'}](${imageBase64})

*由社交媒体卡片生成器制作*`;
  };

  const handleCopyMarkdown = async (platformId: string) => {
    const markdown = generateMarkdown(platformId);
    try {
      await navigator.clipboard.writeText(markdown);
      showToast('已复制');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = markdown;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('已复制');
    }
  };

  const getElementStyle = (
    elementKey: ElementKey,
    item: LayoutItem
  ): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      left: `${item.x}px`,
      top: `${item.y}px`,
      color:
        elementKey === 'title'
          ? template.colors.primary
          : elementKey === 'body'
          ? template.colors.secondary
          : template.colors.primary,
    };

    if (elementKey === 'title') {
      return {
        ...baseStyle,
        fontSize: `${item.fontSize}px`,
        fontWeight: item.fontWeight,
        fontFamily: template.fontFamily,
        maxWidth: `${BASE_CARD_WIDTH - item.x - 20}px`,
      };
    }

    if (elementKey === 'body') {
      return {
        ...baseStyle,
        fontSize: `${item.fontSize}px`,
        lineHeight: item.lineHeight,
        fontFamily: template.fontFamily,
        maxWidth: `${BASE_CARD_WIDTH - item.x - 20}px`,
      };
    }

    if (elementKey === 'logo') {
      return {
        ...baseStyle,
        width: `${item.size}px`,
        height: `${item.size}px`,
        backgroundColor: template.colors.accent,
      };
    }

    if (elementKey === 'divider') {
      return {
        ...baseStyle,
        width: `${item.width}px`,
        height: `${item.height}px`,
        backgroundColor: template.colors.primary,
      };
    }

    if (elementKey === 'icon') {
      return {
        ...baseStyle,
        width: `${item.size}px`,
        height: `${item.size}px`,
        backgroundColor: template.colors.accent,
        borderRadius: '50%',
      };
    }

    return baseStyle;
  };

  const isDraggingElement = (key: ElementKey): boolean => {
    return dragState.isDragging && dragState.element === key;
  };

  const isBounceElement = (key: ElementKey): boolean => {
    return bounceElement === key;
  };

  const renderDraggableElement = (
    key: ElementKey,
    className: string,
    content: React.ReactNode
  ) => {
    return (
      <div
        className={`draggable-element ${className} ${
          isDraggingElement(key) ? 'dragging' : ''
        } ${isBounceElement(key) ? 'bounce-back' : ''}`}
        style={getElementStyle(key, layout[key])}
        onMouseDown={(e) => handleMouseDown(e, key)}
      >
        {content}
      </div>
    );
  };

  return (
    <>
      <main className="canvas-container">
        <div
          className="card-wrapper fade-in"
          key={template.id}
          ref={cardRef}
        >
          <div
            className="card-canvas"
            style={{
              width: `${BASE_CARD_WIDTH}px`,
              height: `${BASE_CARD_HEIGHT}px`,
              backgroundColor: template.colors.background,
              fontFamily: template.fontFamily,
            }}
          >
            {showGrid && <div className="grid-overlay" />}

            {renderDraggableElement(
              'title',
              'element-title',
              title || '请输入标题'
            )}

            {renderDraggableElement(
              'body',
              'element-body',
              <span style={{ display: 'block' }}>
                {body || '请输入正文内容'}
              </span>
            )}

            {renderDraggableElement(
              'logo',
              'element-logo',
              <span
                style={{
                  fontSize: '12px',
                  color: template.colors.background,
                  fontWeight: 700,
                }}
              >
                Logo
              </span>
            )}

            {renderDraggableElement('divider', 'element-divider', null)}

            {renderDraggableElement('icon', 'element-icon', null)}
          </div>
        </div>

        <div className="canvas-footer">
          <button
            className="grid-btn"
            onClick={onToggleGrid}
            style={{ display: onToggleGrid ? 'flex' : 'none', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            {showGrid ? '隐藏网格' : '显示网格'}
          </button>
        </div>
      </main>

      {showExport && (
        <div className="modal-overlay" onClick={onCloseExport}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">导出社交媒体卡片</h2>
              <button className="modal-close" onClick={onCloseExport}>
                ×
              </button>
            </div>

            <div className="export-cards">
              {platformSizes.map((platform) => (
                <div key={platform.id} className="export-card-item">
                  <div className="export-card-label">
                    <span>{platform.name}</span>
                    <span className="export-card-size">
                      {platform.width} × {platform.height}
                    </span>
                  </div>
                  <div
                    className={`export-card-preview ${platform.id}`}
                    style={{ backgroundColor: template.colors.background }}
                  >
                    {exportLoading ? (
                      <div className="loading-spinner" />
                    ) : (
                      <canvas
                        ref={(el) => {
                          canvasRefs.current[platform.id] = el;
                        }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    )}
                  </div>
                  <button
                    className="copy-btn"
                    onClick={() => handleCopyMarkdown(platform.id)}
                    disabled={exportLoading}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    复制 Markdown
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`toast ${toast.fading ? 'fade-out' : ''}`}>
          {toast.message}
        </div>
      )}
    </>
  );
};

export default CardPreview;
