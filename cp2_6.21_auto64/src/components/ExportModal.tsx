import { useEffect, useRef, useState } from 'react';
import { X, Download } from 'lucide-react';
import { useEditorStore } from '../store';
import { CANVAS_SIZE } from '../utils/transform';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  sourceRef: React.RefObject<SVGSVGElement | null>;
}

const serializeSvg = (svgEl: SVGSVGElement): string => {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(CANVAS_SIZE));
  clone.setAttribute('height', String(CANVAS_SIZE));
  const serializer = new XMLSerializer();
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(clone);
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const ExportModal = ({ open, onClose, sourceRef }: ExportModalProps) => {
  const layers = useEditorStore((s) => s.layers);
  const config = useEditorStore((s) => s.canvasConfig);
  const previewRef = useRef<SVGSVGElement>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !sourceRef.current || !previewRef.current) return;
    const serialized = sourceRef.current.outerHTML;
    previewRef.current.outerHTML = serialized;
  }, [open, sourceRef, layers, config]);

  if (!open) return null;

  const handleSvgExport = () => {
    if (!sourceRef.current) return;
    setExporting('svg');
    try {
      const svgString = serializeSvg(sourceRef.current);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      triggerDownload(blob, `mandala-${Date.now()}.svg`);
      useEditorStore.getState().showToast('SVG 已导出');
    } finally {
      setExporting(null);
    }
  };

  const handlePngExport = async () => {
    if (!sourceRef.current) return;
    setExporting('png');
    try {
      const svgString = serializeSvg(sourceRef.current);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
        img.src = url;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 2048;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas ctx unavailable');

      ctx.fillStyle = '#fffaf4';
      ctx.fillRect(0, 0, 2048, 2048);
      const scale = 2048 / CANVAS_SIZE;
      ctx.drawImage(img, 0, 0, CANVAS_SIZE * scale, CANVAS_SIZE * scale);

      URL.revokeObjectURL(url);

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png failed'))), 'image/png');
      });
      triggerDownload(pngBlob, `mandala-${Date.now()}.png`);
      useEditorStore.getState().showToast('PNG 已导出 (2048×2048)');
    } catch (e) {
      console.error(e);
      useEditorStore.getState().showToast('导出失败');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">导出图案</div>
          <button className="modal-close" onClick={onClose} aria-label="close">
            <X size={18} />
          </button>
        </div>
        <div className="preview-box">
          <svg ref={previewRef} viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`} />
        </div>
        <div className="export-buttons">
          <button className="export-btn" onClick={handleSvgExport} disabled={!!exporting}>
            <Download size={20} color="#d4884a" />
            <span className="export-btn-label">{exporting === 'svg' ? '导出中…' : 'SVG 矢量'}</span>
            <span className="export-btn-desc">可编辑，无限缩放</span>
          </button>
          <button className="export-btn" onClick={handlePngExport} disabled={!!exporting}>
            <Download size={20} color="#d4884a" />
            <span className="export-btn-label">{exporting === 'png' ? '导出中…' : 'PNG 高清'}</span>
            <span className="export-btn-desc">2048 × 2048 像素</span>
          </button>
        </div>
      </div>
    </div>
  );
};
