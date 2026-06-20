import { useRef, useState } from 'react';
import { FaShapes, FaCamera, FaDownload, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useDropzone } from 'react-dropzone';
import { useStore, createId } from '../store/useStore';
import type { Layer, ShapeType } from '../core/canvasEngine';
import { loadImage } from '../core/canvasEngine';
import { extractColors } from '../utils/colorExtractor';

const SHAPES: { type: ShapeType; label: string }[] = [
  { type: 'circle', label: '圆形' },
  { type: 'star', label: '星形' },
  { type: 'triangle', label: '三角形' },
  { type: 'wave', label: '波浪线' },
];

const CANVAS_CENTER_X = 400;
const CANVAS_CENTER_Y = 250;

export default function Toolbar() {
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addLayer = useStore((s) => s.addLayer);
  const setSelectedImage = useStore((s) => s.setSelectedImage);
  const setColorSwatches = useStore((s) => s.setColorSwatches);
  const layers = useStore((s) => s.layers);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.canUndo());
  const canRedo = useStore((s) => s.canRedo());

  const { getRootProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    noClick: true,
    onDrop: async (files) => {
      if (files.length === 0) return;
      await handleImageFile(files[0]);
    },
  });

  async function handleImageFile(file: File) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const src = e.target?.result as string;
      if (!src) return;

      try {
        const img = await loadImage(src);
        const aspect = img.width / img.height;
        let w = 200;
        let h = 200;
        if (aspect >= 1) {
          w = 200;
          h = Math.round(200 / aspect);
        } else {
          h = 200;
          w = Math.round(200 * aspect);
        }

        const layer: Layer = {
          id: createId(),
          type: 'image',
          src,
          x: CANVAS_CENTER_X,
          y: CANVAS_CENTER_Y,
          width: w,
          height: h,
          rotation: 0,
          blendMode: 'source-over',
        };
        addLayer(layer);
        setSelectedImage(src);

        const tmpCanvas = document.createElement('canvas');
        const maxDim = 300;
        let tw = img.width;
        let th = img.height;
        if (tw > th && tw > maxDim) {
          th = Math.round((th * maxDim) / tw);
          tw = maxDim;
        } else if (th > maxDim) {
          tw = Math.round((tw * maxDim) / th);
          th = maxDim;
        }
        tmpCanvas.width = tw;
        tmpCanvas.height = th;
        const tctx = tmpCanvas.getContext('2d');
        if (tctx) {
          tctx.drawImage(img, 0, 0, tw, th);
          const imgData = tctx.getImageData(0, 0, tw, th);
          const colors = extractColors(imgData, 5);
          const swatches = colors.map((hex, i) => ({
            id: createId(),
            hex,
            name: `色${i + 1}`,
          }));
          setColorSwatches(swatches);
        }
      } catch (err) {
        console.error('加载图片失败', err);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleAddShape(type: ShapeType) {
    const layer: Layer = {
      id: createId(),
      type,
      x: CANVAS_CENTER_X + (layers.length % 5) * 20 - 40,
      y: CANVAS_CENTER_Y + (layers.length % 5) * 20 - 40,
      width: type === 'wave' ? 160 : 100,
      height: type === 'wave' ? 60 : 100,
      rotation: 0,
      blendMode: 'source-over',
    };
    addLayer(layer);
    setShapeMenuOpen(false);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
    e.target.value = '';
  }

  function handleExport() {
    const canvas = document.getElementById('moodboard-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `moodboard-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setShapeMenuOpen(false);
    }
  }

  return (
    <div
      className="toolbar"
      {...getRootProps()}
      onKeyDown={handleKeyDown}
    >
      <div className="toolbar-inner">
        <div className="toolbar-btn-wrapper">
          <button
            className="toolbar-btn"
            title="添加图形"
            onClick={() => setShapeMenuOpen((v) => !v)}
          >
            <FaShapes size={18} />
          </button>
          {shapeMenuOpen && (
            <div className="shape-menu" onMouseLeave={() => setShapeMenuOpen(false)}>
              {SHAPES.map((s) => (
                <button
                  key={s.type}
                  className="shape-menu-item"
                  onClick={() => handleAddShape(s.type)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="toolbar-btn"
          title="导入图片"
          onClick={handleImportClick}
        >
          <FaCamera size={18} />
        </button>

        <button
          className="toolbar-btn"
          title="导出PNG"
          onClick={handleExport}
        >
          <FaDownload size={18} />
        </button>

        <div className="toolbar-divider" />

        <button
          className={`toolbar-btn ${!canUndo ? 'disabled' : ''}`}
          title="撤销 (Ctrl+Z)"
          onClick={undo}
          disabled={!canUndo}
        >
          <FaArrowLeft size={18} />
        </button>

        <button
          className={`toolbar-btn ${!canRedo ? 'disabled' : ''}`}
          title="重做 (Ctrl+Shift+Z)"
          onClick={redo}
          disabled={!canRedo}
        >
          <FaArrowRight size={18} />
        </button>
      </div>

      {isDragActive && (
        <div className="dropzone-overlay">
          <span>松开以上传图片</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
    </div>
  );
}
