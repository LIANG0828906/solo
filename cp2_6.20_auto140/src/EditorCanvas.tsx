import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button, Slider } from 'antd';
import { useEditorStore } from './store';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  Element as TElement,
  ResizeHandle,
  TextElement,
  ImageElement,
  ShapeElement,
  FONT_FAMILIES,
  FontFamily,
} from './types';

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function EditorCanvas() {
  const {
    magazine,
    currentPageId,
    selectedElementId,
    selectElement,
    updateElement,
    deleteElement,
    bringElementForward,
    sendElementBackward,
  } = useEditorStore();

  const page = magazine.pages.find((p) => p.id === currentPageId);
  const selectedEl = page?.elements.find((e) => e.id === selectedElementId) ?? null;
  const isCover = magazine.coverPageId === currentPageId;

  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoverHandle, setHoverHandle] = useState<ResizeHandle | null>(null);

  const dragStateRef = useRef<{
    mode: 'move' | 'resize' | 'rotate' | null;
    handle?: ResizeHandle;
    startX: number;
    startY: number;
    origin: { x: number; y: number; w: number; h: number; r: number };
    elementId: string;
    rAF: number | null;
    pending: Partial<TElement> | null;
  }>({
    mode: null,
    startX: 0,
    startY: 0,
    origin: { x: 0, y: 0, w: 0, h: 0, r: 0 },
    elementId: '',
    rAF: null,
    pending: null,
  });

  const flushPending = useCallback(() => {
    const st = dragStateRef.current;
    if (!st.elementId || !st.pending) return;
    updateElement(currentPageId!, st.elementId, st.pending);
    st.pending = null;
  }, [currentPageId, updateElement]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const st = dragStateRef.current;
      if (!st.mode || !st.elementId) return;
      const pageId = currentPageId;
      if (!pageId) return;

      if (st.mode === 'move') {
        const dx = e.clientX - st.startX;
        const dy = e.clientY - st.startY;
        const nx = clamp(st.origin.x + dx, 0, CANVAS_WIDTH - 10);
        const ny = clamp(st.origin.y + dy, 0, CANVAS_HEIGHT - 10);
        st.pending = { ...st.pending, x: nx, y: ny };
      } else if (st.mode === 'resize') {
        const dx = e.clientX - st.startX;
        const dy = e.clientY - st.startY;
        let { x, y, w, h } = st.origin;
        const handle = st.handle!;
        const aspect = w / h;
        const shift = e.shiftKey;
        if (handle.includes('e')) w = st.origin.w + dx;
        if (handle.includes('s')) h = st.origin.h + dy;
        if (handle.includes('w')) {
          w = st.origin.w - dx;
          x = st.origin.x + (st.origin.w - w);
        }
        if (handle.includes('n')) {
          h = st.origin.h - dy;
          y = st.origin.y + (st.origin.h - h);
        }
        if (shift && (handle === 'nw' || handle === 'ne' || handle === 'sw' || handle === 'se')) {
          if (w / aspect < h) h = w / aspect;
          else w = h * aspect;
          if (handle.includes('w')) {
            x = st.origin.x + (st.origin.w - w);
          }
          if (handle.includes('n')) {
            y = st.origin.y + (st.origin.h - h);
          }
        }
        w = clamp(w, 20, CANVAS_WIDTH);
        h = clamp(h, 20, CANVAS_HEIGHT);
        x = clamp(x, 0, CANVAS_WIDTH - w);
        y = clamp(y, 0, CANVAS_HEIGHT - h);
        st.pending = { ...st.pending, x, y, width: w, height: h };
      } else if (st.mode === 'rotate') {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;
        const cx = (st.origin.x + st.origin.w / 2) * (1 / scaleX) + rect.left;
        const cy = (st.origin.y + st.origin.h / 2) * (1 / scaleY) + rect.top;
        let deg = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90;
        if (e.shiftKey) deg = Math.round(deg / 15) * 15;
        deg = Math.round(deg);
        st.pending = { ...st.pending, rotation: deg };
      }

      if (!st.rAF) {
        st.rAF = requestAnimationFrame(() => {
          flushPending();
          st.rAF = null;
        });
      }
    };

    const onUp = () => {
      const st = dragStateRef.current;
      if (st.mode && st.rAF) {
        cancelAnimationFrame(st.rAF);
        flushPending();
        st.rAF = null;
      }
      st.mode = null;
      st.handle = undefined;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const st = dragStateRef.current;
      if (st.rAF) cancelAnimationFrame(st.rAF);
    };
  }, [currentPageId, flushPending]);

  const startDrag = (
    mode: 'move' | 'resize' | 'rotate',
    e: React.MouseEvent,
    el: TElement,
    handle?: ResizeHandle,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!currentPageId) return;
    selectElement(el.id);
    const st = dragStateRef.current;
    st.mode = mode;
    st.handle = handle;
    st.startX = e.clientX;
    st.startY = e.clientY;
    st.elementId = el.id;
    st.origin = { x: el.x, y: el.y, w: el.width, h: el.height, r: el.rotation };
    st.pending = null;
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectElement(null);
    }
  };

  const sortedElements = page ? [...page.elements].sort((a, b) => a.zIndex - b.zIndex) : [];

  return (
    <div className="editor-area" onClick={handleCanvasClick}>
      <div className="canvas-wrapper">
        <div
          ref={canvasRef}
          className={`canvas ${isCover ? 'cover' : ''}`}
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          onClick={handleCanvasClick}
        >
          {isCover && (
            <div className="cover-text">
              <div className="mag-name">{magazine.name || '杂志名称'}</div>
              <div className="mag-author">{magazine.author || ''}</div>
            </div>
          )}
          {sortedElements.map((el) => {
            const isSelected = el.id === selectedElementId;
            return (
              <ElementView
                key={el.id}
                el={el}
                isSelected={isSelected}
                onStartDrag={startDrag}
                onHoverHandle={setHoverHandle}
                hoverHandle={hoverHandle}
              />
            );
          })}
        </div>
      </div>

      {selectedEl && currentPageId && (
        <ElementPropertyPanel
          element={selectedEl}
          onChange={(patch) => updateElement(currentPageId, selectedEl.id, patch)}
          onDelete={() => deleteElement(currentPageId, selectedEl.id)}
          onForward={() => bringElementForward(currentPageId, selectedEl.id)}
          onBackward={() => sendElementBackward(currentPageId, selectedEl.id)}
        />
      )}
    </div>
  );
}

function ElementView({
  el,
  isSelected,
  onStartDrag,
  onHoverHandle,
  hoverHandle,
}: {
  el: TElement;
  isSelected: boolean;
  onStartDrag: (
    mode: 'move' | 'resize' | 'rotate',
    e: React.MouseEvent,
    el: TElement,
    handle?: ResizeHandle,
  ) => void;
  onHoverHandle: (h: ResizeHandle | null) => void;
  hoverHandle: ResizeHandle | null;
}) {
  const update = useEditorStore((s) => s.updateElement);
  const pageId = useEditorStore((s) => s.currentPageId);
  const onDoubleClickText = (e: React.MouseEvent) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLDivElement;
    target.setAttribute('contenteditable', 'true');
    target.focus();
    const range = document.createRange();
    range.selectNodeContents(target);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    const finish = () => {
      target.setAttribute('contenteditable', 'false');
      target.removeEventListener('blur', finish);
      target.removeEventListener('keydown', keydown);
      if (pageId) update(pageId, el.id, { content: target.innerText } as Partial<TElement>);
    };
    const keydown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        target.blur();
      }
    };
    target.addEventListener('blur', finish);
    target.addEventListener('keydown', keydown);
  };

  return (
    <div
      className={`element ${isSelected ? 'selected' : ''}`}
      style={{
        width: el.width,
        height: el.height,
        transform: `translate3d(${el.x}px, ${el.y}px, 0) rotate(${el.rotation}deg)`,
        zIndex: isSelected ? 9999 : el.zIndex,
        transformOrigin: 'center center',
      }}
      onMouseDown={(e) => onStartDrag('move', e, el)}
    >
      {el.type === 'text' && (
        <div
          className="element-text"
          style={{
            width: '100%',
            height: '100%',
            fontFamily: (el as TextElement).fontFamily,
            fontSize: (el as TextElement).fontSize,
            color: (el as TextElement).color,
            fontWeight: 700,
          }}
          onDoubleClick={onDoubleClickText}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {(el as TextElement).content}
        </div>
      )}
      {el.type === 'shape' && (
        <div
          className="element-shape"
          style={{
            background: (el as ShapeElement).fillColor,
            borderRadius: (el as ShapeElement).borderRadius,
          }}
        />
      )}
      {el.type === 'image' && (
        <img
          className="element-image"
          src={(el as ImageElement).src}
          alt=""
          draggable={false}
          style={{ objectFit: (el as ImageElement).fitMode }}
        />
      )}

      {isSelected && (
        <>
          <div className="rotate-line" />
          <div
            className="rotate-handle"
            onMouseDown={(e) => onStartDrag('rotate', e, el)}
          />
          {(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as ResizeHandle[]).map((h) => (
            <div
              key={h}
              className={`resize-handle ${h}`}
              onMouseEnter={() => onHoverHandle(h)}
              onMouseLeave={() => onHoverHandle(hoverHandle === h ? null : hoverHandle)}
              onMouseDown={(e) => onStartDrag('resize', e, el, h)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function ElementPropertyPanel({
  element,
  onChange,
  onDelete,
  onForward,
  onBackward,
}: {
  element: TElement;
  onChange: (patch: Partial<TElement>) => void;
  onDelete: () => void;
  onForward: () => void;
  onBackward: () => void;
}) {
  return (
    <div className="property-panel" onClick={(e) => e.stopPropagation()}>
      <h4 className="prop-title">元素属性</h4>

      <div className="prop-row">
        <label className="prop-label">位置 X / Y (px)</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number"
            value={Math.round(element.x)}
            onChange={(e) => onChange({ x: Number(e.target.value) })}
          />
          <input
            type="number"
            value={Math.round(element.y)}
            onChange={(e) => onChange({ y: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="prop-row">
        <label className="prop-label">尺寸 宽 / 高 (px)</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number"
            value={Math.round(element.width)}
            onChange={(e) => onChange({ width: Math.max(20, Number(e.target.value)) })}
          />
          <input
            type="number"
            value={Math.round(element.height)}
            onChange={(e) => onChange({ height: Math.max(20, Number(e.target.value)) })}
          />
        </div>
      </div>

      <div className="prop-row">
        <label className="prop-label">旋转角度: {element.rotation}°</label>
        <Slider
          min={-180}
          max={180}
          value={element.rotation}
          onChange={(v) => onChange({ rotation: Number(v) })}
        />
      </div>

      {element.type === 'text' && (
        <>
          <div className="prop-row">
            <label className="prop-label">文字内容</label>
            <textarea
              value={(element as TextElement).content}
              onChange={(e) => onChange({ content: e.target.value } as Partial<TElement>)}
            />
          </div>
          <div className="prop-row">
            <label className="prop-label">字体</label>
            <select
              value={(element as TextElement).fontFamily}
              onChange={(e) =>
                onChange({ fontFamily: e.target.value as FontFamily } as Partial<TElement>)
              }
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="prop-row">
            <label className="prop-label">
              字号: {(element as TextElement).fontSize}px
            </label>
            <Slider
              min={12}
              max={72}
              value={(element as TextElement).fontSize}
              onChange={(v) => onChange({ fontSize: Number(v) } as Partial<TElement>)}
            />
          </div>
          <div className="prop-row">
            <label className="prop-label">文字颜色</label>
            <div className="color-row">
              <input
                type="color"
                value={(element as TextElement).color}
                onChange={(e) => onChange({ color: e.target.value } as Partial<TElement>)}
              />
              <input
                type="text"
                value={(element as TextElement).color}
                onChange={(e) => onChange({ color: e.target.value } as Partial<TElement>)}
              />
            </div>
          </div>
        </>
      )}

      {element.type === 'image' && (
        <>
          <div className="prop-row">
            <label className="prop-label">图片 URL</label>
            <input
              type="text"
              value={(element as ImageElement).src}
              onChange={(e) => onChange({ src: e.target.value } as Partial<TElement>)}
              placeholder="https://..."
            />
          </div>
          <div className="prop-row">
            <label className="prop-label">适配模式</label>
            <select
              value={(element as ImageElement).fitMode}
              onChange={(e) =>
                onChange({ fitMode: e.target.value as 'cover' | 'contain' } as Partial<TElement>)
              }
            >
              <option value="cover">覆盖 (cover)</option>
              <option value="contain">包含 (contain)</option>
            </select>
          </div>
        </>
      )}

      {element.type === 'shape' && (
        <>
          <div className="prop-row">
            <label className="prop-label">填充颜色</label>
            <div className="color-row">
              <input
                type="color"
                value={(element as ShapeElement).fillColor}
                onChange={(e) => onChange({ fillColor: e.target.value } as Partial<TElement>)}
              />
              <input
                type="text"
                value={(element as ShapeElement).fillColor}
                onChange={(e) => onChange({ fillColor: e.target.value } as Partial<TElement>)}
              />
            </div>
          </div>
          <div className="prop-row">
            <label className="prop-label">圆角: {(element as ShapeElement).borderRadius}px</label>
            <Slider
              min={0}
              max={60}
              value={(element as ShapeElement).borderRadius}
              onChange={(v) => onChange({ borderRadius: Number(v) } as Partial<TElement>)}
            />
          </div>
        </>
      )}

      <div className="prop-row">
        <label className="prop-label">层级 z-index: {element.zIndex}</label>
        <div className="zindex-row">
          <Button size="small" onClick={onBackward}>后移</Button>
          <Button size="small" onClick={onForward}>前移</Button>
        </div>
      </div>

      <Button danger className="element-delete-btn" onClick={onDelete}>
        删除元素
      </Button>
    </div>
  );
}
