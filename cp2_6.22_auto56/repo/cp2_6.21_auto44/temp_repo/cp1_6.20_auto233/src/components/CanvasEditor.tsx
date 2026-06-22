import { useState, useRef, useEffect, useCallback } from 'react';
import { saveCanvas } from '../api';
import './CanvasEditor.css';

const CANVAS_W = 480;
const CANVAS_H = 480;
const MAX_FRAMES = 12;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const HUES = Array.from({ length: 12 }, (_, i) => i * 30);
const BORDER_COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#9b59b6', '#e67e22'];
const BG_COLOR = '#faf8f0';

type Tool = 'pencil' | 'eraser' | 'rect';

interface TextSticker {
  id: number;
  text: string;
  x: number;
  y: number;
  borderColor: string;
}

interface FrameData {
  dataURL: string;
  stickers: TextSticker[];
}

function hslColor(hue: number): string {
  return `hsl(${hue}, 70%, 50%)`;
}

function createEmptyFrame(): FrameData {
  const offscreen = document.createElement('canvas');
  offscreen.width = CANVAS_W;
  offscreen.height = CANVAS_H;
  const ctx = offscreen.getContext('2d')!;
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  return { dataURL: offscreen.toDataURL(), stickers: [] };
}

function buildInitialFrames(): FrameData[] {
  return [createEmptyFrame()];
}

export default function CanvasEditor({ onPublished }: { onPublished: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number>(0);
  const dragRef = useRef<{ stickerId: number; offsetX: number; offsetY: number } | null>(null);
  const previewIntervalRef = useRef<number>(0);
  const stickerIdRef = useRef(0);

  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState(hslColor(0));
  const [brushSize, setBrushSize] = useState(3);
  const [frames, setFrames] = useState<FrameData[]>(buildInitialFrames);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [stickers, setStickers] = useState<TextSticker[]>([]);
  const [frameDuration, setFrameDuration] = useState(0.2);
  const [showPreview, setShowPreview] = useState(false);
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textBorderColor, setTextBorderColor] = useState(BORDER_COLORS[0]);
  const [publishTitle, setPublishTitle] = useState('');
  const [publishAuthor, setPublishAuthor] = useState('');
  const [publishPrice, setPublishPrice] = useState(0);
  const [previewFrame, setPreviewFrame] = useState(0);
  const [draggingStickerId, setDraggingStickerId] = useState<number | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const saveCurrentFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setFrames(prev => {
      const next = [...prev];
      next[currentFrame] = { dataURL: canvas.toDataURL(), stickers: [...stickers] };
      return next;
    });
  }, [currentFrame, stickers]);

  const loadFrame = useCallback((frame: FrameData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.drawImage(img, 0, 0);
    };
    img.src = frame.dataURL;
    setStickers(frame.stickers);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }, []);

  useEffect(() => {
    if (frames[currentFrame]) {
      loadFrame(frames[currentFrame]);
    }
  }, [currentFrame]); // eslint-disable-line react-hooks/exhaustive-deps

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const drawSegment = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);

    const jitterX = () => (Math.random() - 0.5) * 2;
    const jitterY = () => (Math.random() - 0.5) * 2;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const steps = Math.max(1, Math.floor(Math.sqrt(dx * dx + dy * dy) / 2));

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const px = from.x + dx * t + jitterX();
      const py = from.y + dy * t + jitterY();
      ctx.lineTo(px, py);
    }

    ctx.strokeStyle = tool === 'eraser' ? BG_COLOR : color;
    ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'rect') return;
    isDrawingRef.current = true;
    lastPointRef.current = getCanvasPos(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    const pos = getCanvasPos(e);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      drawSegment(lastPointRef.current!, pos);
      lastPointRef.current = pos;
    });
  };

  const handleMouseUp = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      saveCurrentFrame();
    }
  };

  const handleMouseLeave = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      saveCurrentFrame();
    }
  };

  const rectStartRef = useRef<{ x: number; y: number } | null>(null);
  const rectSnapshotRef = useRef<ImageData | null>(null);

  const handleRectMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'rect') return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    rectStartRef.current = getCanvasPos(e);
    rectSnapshotRef.current = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
  };

  const handleRectMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'rect' || !rectStartRef.current || !rectSnapshotRef.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getCanvasPos(e);
    ctx.putImageData(rectSnapshotRef.current, 0, 0);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(
      rectStartRef.current.x,
      rectStartRef.current.y,
      pos.x - rectStartRef.current.x,
      pos.y - rectStartRef.current.y
    );
    ctx.setLineDash([]);
  };

  const handleRectMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'rect' || !rectStartRef.current || !rectSnapshotRef.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getCanvasPos(e);
    ctx.putImageData(rectSnapshotRef.current, 0, 0);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.strokeRect(
      rectStartRef.current.x,
      rectStartRef.current.y,
      pos.x - rectStartRef.current.x,
      pos.y - rectStartRef.current.y
    );
    rectStartRef.current = null;
    rectSnapshotRef.current = null;
    saveCurrentFrame();
  };

  const onCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'rect') handleRectMouseDown(e);
    else handleMouseDown(e);
  };

  const onCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'rect') handleRectMouseMove(e);
    else handleMouseMove(e);
  };

  const onCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'rect') handleRectMouseUp(e);
    else handleMouseUp();
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > MAX_FILE_SIZE) {
        alert('File size exceeds 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext('2d')!;
          const scale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height, 1);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (CANVAS_W - w) / 2;
          const y = (CANVAS_H - h) / 2;
          ctx.drawImage(img, x, y, w, h);
          saveCurrentFrame();
        };
        img.src = ev.target!.result as string;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleAddText = () => {
    setTextInput('');
    setTextBorderColor(BORDER_COLORS[0]);
    setShowTextDialog(true);
  };

  const confirmText = () => {
    if (!textInput.trim()) return;
    const sticker: TextSticker = {
      id: stickerIdRef.current++,
      text: textInput.trim().slice(0, 20),
      x: CANVAS_W / 2 - 40,
      y: CANVAS_H / 2 - 15,
      borderColor: textBorderColor,
    };
    setStickers(prev => [...prev, sticker]);
    setShowTextDialog(false);
  };

  const handleStickerMouseDown = (e: React.MouseEvent, stickerId: number) => {
    e.stopPropagation();
    e.preventDefault();
    const sticker = stickers.find(s => s.id === stickerId);
    if (!sticker) return;
    const container = (e.target as HTMLElement).closest('.canvas-editor__canvas-container') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - sticker.x;
    const offsetY = e.clientY - rect.top - sticker.y;
    dragRef.current = { stickerId, offsetX, offsetY };
    setDraggingStickerId(stickerId);
  };

  const handleStickerMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const container = (e.target as HTMLElement).closest('.canvas-editor__canvas-container') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const x = (e.clientX - rect.left - dragRef.current.offsetX) * scaleX;
    const y = (e.clientY - rect.top - dragRef.current.offsetY) * scaleY;
    setStickers(prev =>
      prev.map(s => (s.id === dragRef.current!.stickerId ? { ...s, x, y } : s))
    );
  };

  const handleStickerMouseUp = () => {
    if (dragRef.current) {
      dragRef.current = null;
      setDraggingStickerId(null);
      saveCurrentFrame();
    }
  };

  const addFrame = () => {
    if (frames.length >= MAX_FRAMES) return;
    saveCurrentFrame();
    const newFrame = createEmptyFrame();
    setFrames(prev => [...prev, newFrame]);
    setCurrentFrame(frames.length);
  };

  const switchFrame = (index: number) => {
    if (index === currentFrame) return;
    saveCurrentFrame();
    setCurrentFrame(index);
  };

  const deleteFrame = (index: number) => {
    if (frames.length <= 1) return;
    setFrames(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next;
    });
    if (currentFrame >= frames.length - 1) {
      setCurrentFrame(Math.max(0, frames.length - 2));
    } else if (currentFrame > index) {
      setCurrentFrame(prev => prev - 1);
    }
  };

  const startPreview = () => {
    saveCurrentFrame();
    setPreviewFrame(0);
    setShowPreview(true);
  };

  useEffect(() => {
    if (!showPreview || frames.length === 0) return;
    const durationMs = frameDuration * 1000;
    let idx = 0;
    previewIntervalRef.current = window.setInterval(() => {
      idx = (idx + 1) % frames.length;
      setPreviewFrame(idx);
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.drawImage(img, 0, 0);
      };
      img.src = frames[idx].dataURL;
    }, durationMs);
    return () => {
      if (previewIntervalRef.current) clearInterval(previewIntervalRef.current);
    };
  }, [showPreview, frameDuration, frames]);

  const handlePublish = async () => {
    if (!publishTitle.trim() || !publishAuthor.trim()) return;
    saveCurrentFrame();
    try {
      await saveCanvas({
        title: publishTitle.trim(),
        author: publishAuthor.trim(),
        price: publishPrice,
        frames: frames.map(f => ({ imageData: f.dataURL })),
        frameDuration,
      });
      setShowPublishDialog(false);
      setPublishTitle('');
      setPublishAuthor('');
      setPublishPrice(0);
      onPublished();
    } catch {
      alert('Publish failed');
    }
  };

  const renderThumb = (frame: FrameData, index: number) => {
    const thumbCanvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      const canvas = thumbCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = frame.dataURL;
    }, [frame.dataURL]);

    return (
      <div
        key={index}
        className={`canvas-editor__frame-thumb ${index === currentFrame ? 'active' : ''}`}
        onClick={() => switchFrame(index)}
      >
        <canvas ref={thumbCanvasRef} width={60} height={60} />
        {frames.length > 1 && (
          <button
            className="canvas-editor__frame-thumb-delete"
            onClick={(e) => { e.stopPropagation(); deleteFrame(index); }}
          >
            <i className="fas fa-times" />
          </button>
        )}
      </div>
    );
  };

  const ThumbsRenderer = () => (
    <>
      {frames.map((frame, i) => (
        <FrameThumb key={i} frame={frame} index={i} />
      ))}
    </>
  );

  const FrameThumb = ({ frame, index }: { frame: FrameData; index: number }) => {
    const thumbRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = thumbRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = frame.dataURL;
    }, [frame.dataURL]);

    return (
      <div
        className={`canvas-editor__frame-thumb ${index === currentFrame ? 'active' : ''}`}
        onClick={() => switchFrame(index)}
      >
        <canvas ref={thumbRef} width={60} height={60} />
        {frames.length > 1 && (
          <button
            className="canvas-editor__frame-thumb-delete"
            onClick={(e) => { e.stopPropagation(); deleteFrame(index); }}
          >
            <i className="fas fa-times" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="canvas-editor">
      <div className="canvas-editor__toolbar">
        <button
          className={`canvas-editor__tool-btn ${tool === 'pencil' ? 'active' : ''}`}
          onClick={() => setTool('pencil')}
          title="Pencil"
        >
          <i className="fas fa-pencil" />
        </button>
        <button
          className={`canvas-editor__tool-btn ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => setTool('eraser')}
          title="Eraser"
        >
          <i className="fas fa-eraser" />
        </button>
        <button
          className={`canvas-editor__tool-btn ${tool === 'rect' ? 'active' : ''}`}
          onClick={() => setTool('rect')}
          title="Rectangle"
        >
          <i className="fas fa-vector-square" />
        </button>
        <div className="canvas-editor__toolbar-divider" />
        <button className="canvas-editor__tool-btn" onClick={handleUpload} title="Upload Image">
          <i className="fas fa-upload" />
        </button>
        <button className="canvas-editor__tool-btn" onClick={handleAddText} title="Add Text">
          <i className="fas fa-font" />
        </button>
      </div>

      <div className="canvas-editor__main">
        <div className="canvas-editor__top-bar">
          <div className="canvas-editor__color-palette">
            {HUES.map(hue => (
              <div
                key={hue}
                className={`canvas-editor__color-swatch ${color === hslColor(hue) ? 'active' : ''}`}
                style={{ background: hslColor(hue) }}
                onClick={() => setColor(hslColor(hue))}
              />
            ))}
          </div>
          <div className="canvas-editor__brush-size">
            <span>{brushSize}px</span>
            <input
              type="range"
              min={1}
              max={20}
              value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
            />
          </div>
          <button className="canvas-editor__action-btn" onClick={startPreview}>
            <i className="fas fa-play" /> Preview
          </button>
          <button
            className="canvas-editor__action-btn canvas-editor__action-btn--accent"
            onClick={() => { saveCurrentFrame(); setShowPublishDialog(true); }}
          >
            <i className="fas fa-paper-plane" /> Publish
          </button>
          <div className="canvas-editor__duration-control">
            <span>{frameDuration.toFixed(2)}s</span>
            <input
              type="range"
              min={0.1}
              max={0.5}
              step={0.05}
              value={frameDuration}
              onChange={e => setFrameDuration(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="canvas-editor__canvas-area">
          <div
            className="canvas-editor__canvas-container"
            onMouseMove={handleStickerMouseMove}
            onMouseUp={handleStickerMouseUp}
            onMouseLeave={handleStickerMouseUp}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onMouseDown={onCanvasMouseDown}
              onMouseMove={onCanvasMouseMove}
              onMouseUp={onCanvasMouseUp}
              onMouseLeave={handleMouseLeave}
            />
            {stickers.map(sticker => (
              <div
                key={sticker.id}
                className={`canvas-editor__text-sticker ${draggingStickerId === sticker.id ? 'canvas-editor__text-sticker--dragging' : ''}`}
                style={{
                  left: sticker.x,
                  top: sticker.y,
                  borderColor: sticker.borderColor,
                }}
                onMouseDown={e => handleStickerMouseDown(e, sticker.id)}
              >
                {sticker.text}
              </div>
            ))}
          </div>
        </div>

        <div className="canvas-editor__filmstrip">
          <FrameThumb frame={frames[0]} index={0} />
          {frames.slice(1).map((frame, i) => (
            <FrameThumb key={i + 1} frame={frame} index={i + 1} />
          ))}
          {frames.length < MAX_FRAMES && (
            <button className="canvas-editor__add-frame-btn" onClick={addFrame}>
              <i className="fas fa-plus" />
            </button>
          )}
        </div>
      </div>

      <div className={`canvas-editor__modal-overlay ${showPreview ? '' : 'canvas-editor__modal-overlay--hidden'}`}>
        <div className="canvas-editor__modal-content">
          <button className="canvas-editor__modal-close" onClick={() => setShowPreview(false)}>
            <i className="fas fa-times" />
          </button>
          <canvas
            ref={previewCanvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="canvas-editor__preview-canvas"
          />
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: '#888' }}>
            Frame {(previewFrame + 1)} / {frames.length}
          </div>
        </div>
      </div>

      <div className={`canvas-editor__modal-overlay ${showTextDialog ? '' : 'canvas-editor__modal-overlay--hidden'}`}>
        <div className="canvas-editor__modal-content" style={{ width: 300 }}>
          <button className="canvas-editor__modal-close" onClick={() => setShowTextDialog(false)}>
            <i className="fas fa-times" />
          </button>
          <h3 style={{ marginBottom: 12, fontSize: 16 }}>Add Text Sticker</h3>
          <div className="canvas-editor__dialog-field">
            <label>Text (max 20 chars)</label>
            <input
              maxLength={20}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmText(); }}
            />
          </div>
          <div className="canvas-editor__dialog-field">
            <label>Border Color</label>
            <div className="canvas-editor__border-color-row">
              {BORDER_COLORS.map(c => (
                <div
                  key={c}
                  className={`canvas-editor__border-color-option ${textBorderColor === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setTextBorderColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="canvas-editor__dialog-actions">
            <button className="canvas-editor__action-btn" onClick={() => setShowTextDialog(false)}>Cancel</button>
            <button className="canvas-editor__action-btn canvas-editor__action-btn--accent" onClick={confirmText}>Add</button>
          </div>
        </div>
      </div>

      <div className={`canvas-editor__modal-overlay ${showPublishDialog ? '' : 'canvas-editor__modal-overlay--hidden'}`}>
        <div className="canvas-editor__modal-content" style={{ width: 340 }}>
          <button className="canvas-editor__modal-close" onClick={() => setShowPublishDialog(false)}>
            <i className="fas fa-times" />
          </button>
          <h3 style={{ marginBottom: 12, fontSize: 16 }}>Publish Sticker</h3>
          <div className="canvas-editor__dialog-field">
            <label>Title</label>
            <input value={publishTitle} onChange={e => setPublishTitle(e.target.value)} />
          </div>
          <div className="canvas-editor__dialog-field">
            <label>Author</label>
            <input value={publishAuthor} onChange={e => setPublishAuthor(e.target.value)} />
          </div>
          <div className="canvas-editor__dialog-field">
            <label>Price (0-100)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={publishPrice}
              onChange={e => setPublishPrice(Math.min(100, Math.max(0, Math.round(Number(e.target.value)))))}
            />
          </div>
          <div className="canvas-editor__dialog-actions">
            <button className="canvas-editor__action-btn" onClick={() => setShowPublishDialog(false)}>Cancel</button>
            <button className="canvas-editor__action-btn canvas-editor__action-btn--accent" onClick={handlePublish}>Publish</button>
          </div>
        </div>
      </div>
    </div>
  );
}
