import { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Image, FileText, Settings } from 'lucide-react';
import type { Card, ExportFormat, ExportLayout } from '@/types';
import useBoardStore from '@/store/boardStore';
import { Modal } from '@/components/Modal';
import { loadImage } from '@/utils/imageUtils';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_LAYOUT: ExportLayout = {
  columns: 3,
  rowGap: 16,
  columnGap: 12,
  cardWidth: 300,
};

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const { cards, selectedCardIds } = useBoardStore();
  const [format, setFormat] = useState<ExportFormat>('png');
  const [layout, setLayout] = useState<ExportLayout>(DEFAULT_LAYOUT);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef<number>(0);

  const selectedCards = cards.filter(c => selectedCardIds.includes(c.id));

  const calculateDimensions = useCallback((cardsToRender: Card[], layoutConfig: ExportLayout) => {
    const { columns, rowGap, columnGap, cardWidth } = layoutConfig;
    const rows = Math.ceil(cardsToRender.length / columns);
    
    const cardHeight169 = (cardWidth * 9) / 16;
    const cardHeight11 = cardWidth;
    
    let totalHeight = 0;
    for (let row = 0; row < rows; row++) {
      let rowMaxHeight = 0;
      for (let col = 0; col < columns; col++) {
        const idx = row * columns + col;
        if (idx >= cardsToRender.length) break;
        const card = cardsToRender[idx];
        const cardHeight = card.aspectRatio === '1:1' ? cardHeight11 : cardHeight169;
        rowMaxHeight = Math.max(rowMaxHeight, cardHeight);
      }
      totalHeight += rowMaxHeight + (row > 0 ? rowGap : 0);
    }
    
    const totalWidth = columns * cardWidth + (columns - 1) * columnGap;
    
    return { totalWidth, totalHeight, cardHeight169, cardHeight11 };
  }, []);

  const renderToCanvas = useCallback(async (
    canvas: HTMLCanvasElement,
    cardsToRender: Card[],
    layoutConfig: ExportLayout,
    onProgress?: (current: number, total: number) => void
  ) => {
    const ctx = canvas.getContext('2d')!;
    const { columns, rowGap, columnGap, cardWidth } = layoutConfig;
    const { totalWidth, totalHeight, cardHeight169, cardHeight11 } = calculateDimensions(cardsToRender, layoutConfig);
    
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    
    ctx.fillStyle = '#F5F0EB';
    ctx.fillRect(0, 0, totalWidth, totalHeight);
    
    let currentY = 0;
    const rows = Math.ceil(cardsToRender.length / columns);
    
    for (let row = 0; row < rows; row++) {
      let rowMaxHeight = 0;
      const rowCards: { card: Card; height: number }[] = [];
      
      for (let col = 0; col < columns; col++) {
        const idx = row * columns + col;
        if (idx >= cardsToRender.length) break;
        
        const card = cardsToRender[idx];
        const cardHeight = card.aspectRatio === '1:1' ? cardHeight11 : cardHeight169;
        rowMaxHeight = Math.max(rowMaxHeight, cardHeight);
        rowCards.push({ card, height: cardHeight });
      }
      
      for (let col = 0; col < rowCards.length; col++) {
        const { card, height } = rowCards[col];
        const x = col * (cardWidth + columnGap);
        const y = currentY;
        
        const img = await loadImage(card.imageUrl);
        
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, cardWidth, height, 8);
        ctx.clip();
        ctx.drawImage(img, x, y, cardWidth, height);
        ctx.restore();
        
        ctx.strokeStyle = 'rgba(26, 39, 68, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, cardWidth, height, 8);
        ctx.stroke();
        
        if (card.tags.length > 0) {
          let tagX = x + 8;
          const tagY = y + height - 28;
          
          for (let i = 0; i < card.tags.length && i < 3; i++) {
            const tagName = card.tags[i];
            const hash = tagName.split('').reduce((acc, char) => {
              return char.charCodeAt(0) + ((acc << 5) - acc);
            }, 0);
            const hue = Math.abs(hash % 360);
            const bgColor = `hsla(${hue}, 65%, 85%, 0.9)`;
            const textColor = `hsl(${hue}, 60%, 35%)`;
            
            ctx.font = '11px system-ui, sans-serif';
            const tagWidth = ctx.measureText(tagName).width + 16;
            
            ctx.fillStyle = bgColor;
            ctx.beginPath();
            ctx.roundRect(tagX, tagY, tagWidth, 20, 4);
            ctx.fill();
            
            ctx.fillStyle = textColor;
            ctx.textBaseline = 'middle';
            ctx.fillText(tagName, tagX + 8, tagY + 10);
            
            tagX += tagWidth + 4;
          }
        }
        
        if (onProgress) {
          onProgress(row * columns + col + 1, cardsToRender.length);
        }
      }
      
      currentY += rowMaxHeight + rowGap;
    }
  }, [calculateDimensions]);

  const updatePreview = useCallback(async () => {
    if (!previewCanvasRef.current || selectedCards.length === 0) return;
    
    setPreviewLoaded(false);
    
    try {
      const previewLayout = {
        ...layout,
        cardWidth: 150,
      };
      
      await renderToCanvas(previewCanvasRef.current, selectedCards.slice(0, 6), previewLayout);
      setPreviewLoaded(true);
    } catch (error) {
      console.error('Preview rendering failed:', error);
    }
  }, [selectedCards, layout, renderToCanvas]);

  useEffect(() => {
    if (isOpen) {
      updatePreview();
    }
  }, [isOpen, updatePreview]);

  const handleExport = async () => {
    if (selectedCards.length === 0) return;
    
    setIsExporting(true);
    setExportProgress(0);
    startTimeRef.current = Date.now();
    
    const exportCanvas = document.createElement('canvas');
    
    try {
      await renderToCanvas(exportCanvas, selectedCards, layout, (current, total) => {
        const progress = Math.round((current / total) * 100);
        setExportProgress(progress);
        
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.round((elapsed / progress) * (100 - progress) / 1000);
        setEstimatedTime(remaining);
      });
      
      const dataUrl = exportCanvas.toDataURL(`image/${format === 'png' ? 'png' : 'jpeg'}`, 0.95);
      
      if (format === 'pdf') {
        const { totalWidth, totalHeight } = calculateDimensions(selectedCards, layout);
        const pdfWidth = totalWidth * 0.75;
        const pdfHeight = totalHeight * 0.75;
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>灵感看板导出</title>
              <style>
                @page { size: ${pdfWidth}pt ${pdfHeight}pt; margin: 0; }
                body { margin: 0; display: flex; justify-content: center; align-items: center; }
                img { width: 100%; height: auto; }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" />
              <script>window.onload = function() { window.print(); window.close(); }<\/script>
            </body>
            </html>
          `);
          printWindow.document.close();
        }
      } else {
        const link = document.createElement('a');
        link.download = `灵感看板_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.png`;
        link.href = dataUrl;
        link.click();
      }
      
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      setLayout(DEFAULT_LAYOUT);
      setExportProgress(0);
      setEstimatedTime(0);
      onClose();
    }
  };

  const { totalWidth, totalHeight } = calculateDimensions(selectedCards, layout);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="导出素材" maxWidth="700px">
      <div className="export-dialog">
        <div className="export-format-tabs">
          <button
            className={`format-tab ${format === 'png' ? 'active' : ''}`}
            onClick={() => setFormat('png')}
            disabled={isExporting}
          >
            <Image size={18} />
            PNG 图片
          </button>
          <button
            className={`format-tab ${format === 'pdf' ? 'active' : ''}`}
            onClick={() => setFormat('pdf')}
            disabled={isExporting}
          >
            <FileText size={18} />
            PDF 文档
          </button>
        </div>
        
        <div className="export-content">
          <div className="export-preview-section">
            <div className="preview-label">
              <Settings size={14} />
              预览
            </div>
            <div className="preview-container">
              {selectedCards.length === 0 ? (
                <div className="preview-empty">请先选择要导出的素材</div>
              ) : (
                <>
                  <canvas
                    ref={previewCanvasRef}
                    className={`preview-canvas ${previewLoaded ? 'loaded' : ''}`}
                  />
                  {!previewLoaded && (
                    <div className="preview-loading">
                      <div className="loading-spinner small" />
                      生成预览中...
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="preview-info">
              <span>已选择 {selectedCards.length} 张素材</span>
              <span>输出尺寸: {totalWidth} × {totalHeight}px</span>
            </div>
          </div>
          
          <div className="export-settings-section">
            <div className="settings-label">
              <Settings size={14} />
              布局设置
            </div>
            
            <div className="setting-group">
              <label className="setting-label">
                每行列数: {layout.columns}
              </label>
              <input
                type="range"
                className="setting-slider"
                min="2"
                max="5"
                value={layout.columns}
                onChange={(e) => setLayout({ ...layout, columns: Number(e.target.value) })}
                disabled={isExporting}
              />
              <div className="slider-marks">
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>
            
            <div className="setting-group">
              <label className="setting-label">
                卡片宽度: {layout.cardWidth}px
              </label>
              <input
                type="range"
                className="setting-slider"
                min="200"
                max="500"
                step="50"
                value={layout.cardWidth}
                onChange={(e) => setLayout({ ...layout, cardWidth: Number(e.target.value) })}
                disabled={isExporting}
              />
              <div className="slider-marks">
                <span>200</span>
                <span>350</span>
                <span>500</span>
              </div>
            </div>
            
            <div className="setting-group">
              <label className="setting-label">
                行间距: {layout.rowGap}px
              </label>
              <input
                type="range"
                className="setting-slider"
                min="8"
                max="32"
                value={layout.rowGap}
                onChange={(e) => setLayout({ ...layout, rowGap: Number(e.target.value) })}
                disabled={isExporting}
              />
            </div>
            
            <div className="setting-group">
              <label className="setting-label">
                列间距: {layout.columnGap}px
              </label>
              <input
                type="range"
                className="setting-slider"
                min="8"
                max="24"
                value={layout.columnGap}
                onChange={(e) => setLayout({ ...layout, columnGap: Number(e.target.value) })}
                disabled={isExporting}
              />
            </div>
          </div>
        </div>
        
        {isExporting && (
          <div className="export-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <div className="progress-info">
              <span className="progress-percent">{exportProgress}%</span>
              <span className="progress-time">
                剩余约 {estimatedTime} 秒
              </span>
            </div>
          </div>
        )}
        
        <div className="export-actions">
          <button
            className="btn-secondary"
            onClick={handleClose}
            disabled={isExporting}
          >
            取消
          </button>
          <button
            className="btn-primary"
            onClick={handleExport}
            disabled={isExporting || selectedCards.length === 0}
          >
            {isExporting ? (
              '导出中...'
            ) : (
              <>
                <Download size={18} />
                导出 {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
