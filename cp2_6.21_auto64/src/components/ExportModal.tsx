import { useCallback, useMemo, useState } from 'react';
import { X, Download, Paintbrush, Layers } from 'lucide-react';
import { useEditorStore } from '../store';
import {
  CANVAS_CENTER,
  CANVAS_SIZE,
  getShapePath,
  getSymmetryTransforms
} from '../utils/transform';
import type { Layer, ShapeType, CanvasConfig } from '../store';

type BgMode = 'white' | 'transparent' | 'custom';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  sourceRef: React.RefObject<SVGSVGElement | null>;
}

const renderShapeElement = (
  shape: ShapeType,
  fill: string,
  stroke: string,
  strokeWidth: number
): string => {
  switch (shape) {
    case 'circle':
      return `<circle cx="0" cy="0" r="22" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
    case 'ellipse':
      return `<ellipse cx="0" cy="0" rx="26" ry="14" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
    case 'ring':
      return `<circle cx="0" cy="0" r="24" fill="none" stroke="${stroke || fill}" stroke-width="${strokeWidth + 2}"/>`;
    default: {
      const d = getShapePath(shape);
      return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"/>`;
    }
  }
};

const buildFlattenedSvg = (
  layers: Layer[],
  config: CanvasConfig,
  bgFill: string | null
): string => {
  const cx = CANVAS_CENTER;
  const cy = CANVAS_CENTER;
  const parts: string[] = [];

  if (bgFill) {
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${cx}" fill="${bgFill}"/>`);
  }

  for (const layer of layers) {
    const transforms = getSymmetryTransforms(layer, config, cx, cy);
    for (const t of transforms) {
      const shapeSvg = renderShapeElement(
        layer.shape,
        layer.fillColor,
        layer.strokeColor,
        layer.strokeWidth
      );
      parts.push(`<g transform="${t.transform}">${shapeSvg}</g>`);
    }
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">`,
    parts.join('\n'),
    '</svg>'
  ].join('\n');
};

const buildClonedSvg = (
  sourceSvg: SVGSVGElement,
  bgFill: string | null
): string => {
  const clone = sourceSvg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(CANVAS_SIZE));
  clone.setAttribute('height', String(CANVAS_SIZE));

  const bgCircle = clone.querySelector('circle[fill="url(#bg-grad)"]');
  if (bgCircle) {
    if (bgFill) {
      bgCircle.setAttribute('fill', bgFill);
      bgCircle.removeAttribute('opacity');
    } else {
      bgCircle.setAttribute('fill', 'none');
    }
  }

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

const genFilename = (ext: string): string => `mandala-${Date.now()}.${ext}`;

const PreviewSvg = ({
  layers,
  config,
  bgMode,
  customBgColor,
  flatten
}: {
  layers: Layer[];
  config: CanvasConfig;
  bgMode: BgMode;
  customBgColor: string;
  flatten: boolean;
}) => {
  const svgString = useMemo(() => {
    const bgFill =
      bgMode === 'white' ? '#ffffff' : bgMode === 'custom' ? customBgColor : null;
    if (flatten) {
      return buildFlattenedSvg(layers, config, bgFill);
    }
    return null;
  }, [layers, config, bgMode, customBgColor, flatten]);

  if (flatten && svgString) {
    const bgFill =
      bgMode === 'white' ? '#ffffff' : bgMode === 'custom' ? customBgColor : null;
    const bgStyle = bgFill ? { background: bgFill } : {
      backgroundImage:
        'linear-gradient(45deg, #e0d6c8 25%, transparent 25%), linear-gradient(-45deg, #e0d6c8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0d6c8 75%), linear-gradient(-45deg, transparent 75%, #e0d6c8 75%)',
      backgroundSize: '16px 16px',
      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0'
    };
    return (
      <div
        className="preview-box"
        style={bgStyle}
        dangerouslySetInnerHTML={{ __html: svgString.replace(/<\?xml[^?]*\?>\n?/, '') }}
      />
    );
  }

  const bgFill =
    bgMode === 'white' ? '#ffffff' : bgMode === 'custom' ? customBgColor : null;
  const bgStyle = bgFill ? { background: bgFill } : {
    backgroundImage:
      'linear-gradient(45deg, #e0d6c8 25%, transparent 25%), linear-gradient(-45deg, #e0d6c8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0d6c8 75%), linear-gradient(-45deg, transparent 75%, #e0d6c8 75%)',
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0'
  };

  return (
    <div className="preview-box" style={bgStyle}>
      <svg viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`} style={{ width: '90%', height: '90%' }}>
        <defs>
          <radialGradient id="preview-bg-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffaf4" />
            <stop offset="100%" stopColor="#fff1dc" />
          </radialGradient>
        </defs>
        <circle
          cx={CANVAS_CENTER}
          cy={CANVAS_CENTER}
          r={CANVAS_SIZE / 2}
          fill={bgFill ?? 'url(#preview-bg-grad)'}
        />
        {layers.map((layer) => {
          const transforms = getSymmetryTransforms(layer, config);
          return (
            <g key={layer.id}>
              {transforms.map((t) => (
                <g key={t.key} transform={t.transform}>
                  {renderShapeJsx(layer.shape, layer.fillColor, layer.strokeColor, layer.strokeWidth)}
                </g>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const renderShapeJsx = (shape: ShapeType, fill: string, stroke: string, strokeWidth: number) => {
  switch (shape) {
    case 'circle':
      return <circle cx={0} cy={0} r={22} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
    case 'ellipse':
      return <ellipse cx={0} cy={0} rx={26} ry={14} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
    case 'ring':
      return <circle cx={0} cy={0} r={24} fill="none" stroke={stroke || fill} strokeWidth={strokeWidth + 2} />;
    default: {
      const d = getShapePath(shape);
      return <path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />;
    }
  }
};

export const ExportModal = ({ open, onClose, sourceRef }: ExportModalProps) => {
  const layers = useEditorStore((s) => s.layers);
  const config = useEditorStore((s) => s.canvasConfig);
  const [bgMode, setBgMode] = useState<BgMode>('white');
  const [customBgColor, setCustomBgColor] = useState('#f9c69b');
  const [flatten, setFlatten] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const getSvgString = useCallback((): string => {
    const bgFill =
      bgMode === 'white' ? '#ffffff' : bgMode === 'custom' ? customBgColor : null;

    if (flatten) {
      return buildFlattenedSvg(layers, config, bgFill);
    }

    if (sourceRef.current) {
      return buildClonedSvg(sourceRef.current, bgFill);
    }

    return buildFlattenedSvg(layers, config, bgFill);
  }, [bgMode, customBgColor, flatten, layers, config, sourceRef]);

  const handleSvgExport = () => {
    setExporting('svg');
    try {
      const svgString = getSvgString();
      const filename = genFilename('svg');
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      triggerDownload(blob, filename);
      const label = flatten ? '展平' : '结构';
      useEditorStore.getState().showToast(`SVG (${label}) 已保存为 ${filename}`);
    } catch (e) {
      console.error(e);
      useEditorStore.getState().showToast('SVG 导出失败');
    } finally {
      setExporting(null);
    }
  };

  const handlePngExport = async () => {
    setExporting('png');
    try {
      const svgString = getSvgString();
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

      const bgFill =
        bgMode === 'white' ? '#ffffff' : bgMode === 'custom' ? customBgColor : null;

      if (bgFill) {
        ctx.fillStyle = bgFill;
        ctx.fillRect(0, 0, 2048, 2048);
      }

      const scale = 2048 / CANVAS_SIZE;
      ctx.drawImage(img, 0, 0, CANVAS_SIZE * scale, CANVAS_SIZE * scale);
      URL.revokeObjectURL(url);

      const filename = genFilename('png');
      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('png failed'))),
          'image/png'
        );
      });
      triggerDownload(pngBlob, filename);

      const bgLabel = bgMode === 'transparent' ? '透明背景' : bgMode === 'custom' ? customBgColor : '白色背景';
      useEditorStore.getState().showToast(`PNG (2048×2048, ${bgLabel}) 已保存为 ${filename}`);
    } catch (e) {
      console.error(e);
      useEditorStore.getState().showToast('PNG 导出失败');
    } finally {
      setExporting(null);
    }
  };

  if (!open) return null;

  const bgOptions: { key: BgMode; label: string }[] = [
    { key: 'white', label: '白色' },
    { key: 'transparent', label: '透明' },
    { key: 'custom', label: '自定义' }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal export-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">导出图案</div>
          <button className="modal-close" onClick={onClose} aria-label="close">
            <X size={18} />
          </button>
        </div>

        <PreviewSvg
          layers={layers}
          config={config}
          bgMode={bgMode}
          customBgColor={customBgColor}
          flatten={flatten}
        />

        <div className="export-options">
          <div className="export-option-row">
            <div className="export-option-label">
              <Paintbrush size={14} />
              PNG 背景
            </div>
            <div className="export-option-control">
              <div className="segmented segmented-sm">
                {bgOptions.map((opt) => (
                  <button
                    key={opt.key}
                    className={`segmented-btn segmented-btn-sm ${bgMode === opt.key ? 'active' : ''}`}
                    onClick={() => setBgMode(opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {bgMode === 'custom' && (
                <div className="color-input-wrapper" style={{ marginLeft: 8 }}>
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="export-option-row">
            <div className="export-option-label">
              <Layers size={14} />
              SVG 展平
            </div>
            <div className="export-option-control">
              <button
                className={`toggle-switch ${flatten ? 'active' : ''}`}
                onClick={() => setFlatten(!flatten)}
                role="switch"
                aria-checked={flatten}
              >
                <span className="toggle-knob" />
              </button>
              <span className="toggle-hint">{flatten ? '独立路径' : '保留引用'}</span>
            </div>
          </div>
        </div>

        <div className="export-buttons">
          <button className="export-btn" onClick={handleSvgExport} disabled={!!exporting}>
            <Download size={20} color="#d4884a" />
            <span className="export-btn-label">
              {exporting === 'svg' ? '导出中…' : 'SVG 矢量'}
            </span>
            <span className="export-btn-desc">
              {flatten ? '展平路径，便于编辑' : '可编辑，无限缩放'}
            </span>
          </button>
          <button className="export-btn" onClick={handlePngExport} disabled={!!exporting}>
            <Download size={20} color="#d4884a" />
            <span className="export-btn-label">
              {exporting === 'png' ? '导出中…' : 'PNG 高清'}
            </span>
            <span className="export-btn-desc">
              2048×2048 · {bgMode === 'transparent' ? '透明' : bgMode === 'custom' ? '自定义背景' : '白色背景'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
