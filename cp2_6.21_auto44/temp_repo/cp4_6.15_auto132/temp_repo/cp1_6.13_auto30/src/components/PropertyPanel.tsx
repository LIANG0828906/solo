import React, { memo, useState, useEffect } from 'react';
import { LayoutManager } from '../layout/LayoutManager';
import {
  LayoutState,
  PosterElement,
  ElementType,
  TextElement,
  ImageElement,
  AVAILABLE_FONTS,
} from '../types';
import { LayerList } from './LayerList';

interface PropertyPanelProps {
  layoutManager: LayoutManager;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = memo(({ layoutManager }) => {
  const [state, setState] = useState<LayoutState>(layoutManager.getState());

  useEffect(() => {
    return layoutManager.subscribe((s) => setState(s));
  }, [layoutManager]);

  const selected = state.selectedId
    ? state.elements.find((e) => e.id === state.selectedId)
    : null;

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        background: '#2B3A4D',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.8, opacity: 0.9 }}>
          属性面板
        </div>
        <div style={{ fontSize: 11, marginTop: 4, opacity: 0.5 }}>
          {selected ? '调整选中元素属性' : '选中画布元素查看属性'}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <CollapsibleSection title="元素属性" defaultOpen={!!selected}>
          {selected ? (
            <ElementProperties element={selected} layoutManager={layoutManager} />
          ) : (
            <EmptyHint text="请选中画布上的元素" />
          )}
        </CollapsibleSection>

        <CollapsibleSection title="图层管理" defaultOpen>
          <LayerList layoutManager={layoutManager} />
        </CollapsibleSection>
      </div>
    </div>
  );
});

PropertyPanel.displayName = 'PropertyPanel';

const ElementProperties: React.FC<{
  element: PosterElement;
  layoutManager: LayoutManager;
}> = ({ element, layoutManager }) => {
  const isText = element.type === ElementType.TEXT;
  const isImage = element.type === ElementType.IMAGE;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Badge color={isText ? '#3498DB' : '#27AE60'}>
          {isText ? '文本元素' : '图片元素'}
        </Badge>
        <button
          onClick={() => layoutManager.deleteElement(element.id)}
          style={{
            marginLeft: 'auto',
            padding: '4px 10px',
            fontSize: 11,
            background: 'rgba(231,76,60,0.2)',
            border: '1px solid rgba(231,76,60,0.4)',
            color: '#FF8A80',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          删除
        </button>
      </div>

      <PropertyRow label="X 坐标">
        <NumberInput
          value={Math.round(element.x)}
          onChange={(v) => layoutManager.moveElement(element.id, v, element.y)}
        />
      </PropertyRow>
      <PropertyRow label="Y 坐标">
        <NumberInput
          value={Math.round(element.y)}
          onChange={(v) => layoutManager.moveElement(element.id, element.x, v)}
        />
      </PropertyRow>
      <PropertyRow label="宽度">
        <NumberInput
          value={Math.round(element.width)}
          min={20}
          onChange={(v) => layoutManager.resizeElement(element.id, v, element.height)}
        />
      </PropertyRow>
      <PropertyRow label="高度">
        <NumberInput
          value={Math.round(element.height)}
          min={20}
          onChange={(v) => layoutManager.resizeElement(element.id, element.width, v)}
        />
      </PropertyRow>
      <PropertyRow label="旋转角度">
        <SliderInput
          value={element.rotation}
          min={-180}
          max={180}
          step={1}
          suffix="°"
          onChange={(v) => layoutManager.rotateElement(element.id, v)}
        />
      </PropertyRow>

      {isText && <TextProperties element={element as TextElement} layoutManager={layoutManager} />}
      {isImage && <ImageProperties element={element as ImageElement} layoutManager={layoutManager} />}
    </div>
  );
};

const TextProperties: React.FC<{
  element: TextElement;
  layoutManager: LayoutManager;
}> = ({ element, layoutManager }) => {
  const [localContent, setLocalContent] = useState(element.content);
  useEffect(() => setLocalContent(element.content), [element.content]);

  return (
    <>
      <Divider />
      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, letterSpacing: 0.5 }}>
        文本样式
      </div>

      <PropertyRow label="字体">
        <select
          value={element.fontFamily}
          onChange={(e) =>
            layoutManager.updateElement(element.id, { fontFamily: e.target.value } as Partial<
              TextElement
            >)
          }
          style={darkSelectStyle}
        >
          {AVAILABLE_FONTS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </PropertyRow>

      <PropertyRow label="字号">
        <SliderInput
          value={element.fontSize}
          min={8}
          max={200}
          step={1}
          suffix="px"
          onChange={(v) =>
            layoutManager.updateElement(element.id, { fontSize: v } as Partial<TextElement>)
          }
        />
      </PropertyRow>

      <PropertyRow label="文字颜色">
        <ColorInput
          value={element.color}
          onChange={(c) =>
            layoutManager.updateElement(element.id, { color: c } as Partial<TextElement>)
          }
        />
      </PropertyRow>

      <PropertyRow label="行高">
        <SliderInput
          value={element.lineHeight}
          min={0.8}
          max={3}
          step={0.1}
          onChange={(v) =>
            layoutManager.updateElement(element.id, { lineHeight: v } as Partial<TextElement>)
          }
        />
      </PropertyRow>

      <PropertyRow label="对齐方式">
        <div style={{ display: 'flex', gap: 2, flex: 1 }}>
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              onClick={() =>
                layoutManager.updateElement(element.id, { textAlign: a } as Partial<TextElement>)
              }
              style={{
                flex: 1,
                padding: '6px 0',
                background: element.textAlign === a ? '#4A6B8C' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
                transition: 'all 0.2s',
              }}
            >
              {a === 'left' ? '左' : a === 'center' ? '中' : '右'}
            </button>
          ))}
        </div>
      </PropertyRow>

      <PropertyRow label="文字内容" vertical>
        <textarea
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={() =>
            layoutManager.updateElement(element.id, { content: localContent } as Partial<
              TextElement
            >)
          }
          style={{
            width: '100%',
            minHeight: 60,
            padding: 8,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff',
            fontSize: 12,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </PropertyRow>
    </>
  );
};

const ImageProperties: React.FC<{
  element: ImageElement;
  layoutManager: LayoutManager;
}> = ({ element, layoutManager }) => {
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 400;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          const r = Math.min(maxDim / w, maxDim / h);
          w = w * r;
          h = h * r;
        }
        layoutManager.updateElement(element.id, {
          src: dataUrl,
          width: w,
          height: h,
        } as Partial<ImageElement>);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <>
      <Divider />
      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, letterSpacing: 0.5 }}>
        图片设置
      </div>

      <button
        onClick={() => fileRef.current?.click()}
        style={{
          padding: '10px 12px',
          background: 'rgba(74,107,140,0.5)',
          border: '1px solid rgba(74,107,140,0.8)',
          color: '#fff',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 500,
          transition: 'all 0.2s',
        }}
      >
        {element.src ? '🖼  更换图片' : '📤  上传图片'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleUpload}
      />

      <PropertyRow label="填充方式">
        <div style={{ display: 'flex', gap: 2, flex: 1 }}>
          {(['contain', 'cover'] as const).map((f) => (
            <button
              key={f}
              onClick={() =>
                layoutManager.updateElement(element.id, { objectFit: f } as Partial<ImageElement>)
              }
              style={{
                flex: 1,
                padding: '6px 0',
                background: element.objectFit === f ? '#4A6B8C' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
                transition: 'all 0.2s',
              }}
            >
              {f === 'contain' ? '等比包含' : '填充覆盖'}
            </button>
          ))}
        </div>
      </PropertyRow>

      {element.src && (
        <div
          style={{
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          <img
            src={element.src}
            alt="预览"
            style={{ width: '100%', display: 'block', maxHeight: 120, objectFit: 'contain' }}
          />
        </div>
      )}
    </>
  );
};

const CollapsibleSection: React.FC<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          opacity: 0.85,
          letterSpacing: 0.5,
        }}
      >
        <span>{title}</span>
        <span
          style={{
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(90deg)' : 'rotate(0)',
            fontSize: 10,
            opacity: 0.7,
          }}
        >
          ▶
        </span>
      </button>
      <div
        style={{
          maxHeight: open ? 3000 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.25s ease',
        }}
      >
        <div style={{ padding: '0 18px 16px' }}>{children}</div>
      </div>
    </div>
  );
};

const PropertyRow: React.FC<{
  label: string;
  vertical?: boolean;
  children: React.ReactNode;
}> = ({ label, vertical, children }) => (
  <div style={{ display: vertical ? 'flex' : 'flex', flexDirection: vertical ? 'column' : 'row', alignItems: vertical ? 'stretch' : 'center', gap: vertical ? 6 : 10 }}>
    <label
      style={{
        fontSize: 11,
        opacity: 0.65,
        width: vertical ? 'auto' : 64,
        flexShrink: 0,
      }}
    >
      {label}
    </label>
    <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
  </div>
);

const NumberInput: React.FC<{
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}> = ({ value, min, max, onChange }) => (
  <input
    type="number"
    value={value}
    min={min}
    max={max}
    onChange={(e) => {
      const v = Number(e.target.value);
      if (!Number.isNaN(v)) onChange(v);
    }}
    style={{
      width: '100%',
      height: 28,
      padding: '0 8px',
      borderRadius: 4,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: '#fff',
      fontSize: 12,
      outline: 'none',
      boxSizing: 'border-box',
    }}
  />
);

const SliderInput: React.FC<{
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}> = ({ value, min, max, step = 1, suffix = '', onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ flex: 1, accentColor: '#4A6B8C', height: 24 }}
    />
    <div
      style={{
        minWidth: 48,
        textAlign: 'right',
        fontSize: 11,
        opacity: 0.8,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {typeof value === 'number' && !Number.isInteger(step)
        ? value.toFixed(1)
        : Math.round(value)}
      {suffix}
    </div>
  </div>
);

const ColorInput: React.FC<{ value: string; onChange: (c: string) => void }> = ({
  value,
  onChange,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div
      style={{
        position: 'relative',
        width: 32,
        height: 28,
        borderRadius: 4,
        background: value,
        border: '1px solid rgba(255,255,255,0.2)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: 'absolute',
          inset: -4,
          width: 'calc(100% + 8px)',
          height: 'calc(100% + 8px)',
          cursor: 'pointer',
          border: 'none',
          padding: 0,
          background: 'transparent',
          opacity: 0,
        }}
      />
    </div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        flex: 1,
        height: 28,
        padding: '0 8px',
        borderRadius: 4,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: '#fff',
        fontSize: 12,
        outline: 'none',
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        boxSizing: 'border-box',
      }}
    />
  </div>
);

const Badge: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 9px',
      fontSize: 11,
      fontWeight: 500,
      borderRadius: 10,
      background: `${color}33`,
      color: color,
      border: `1px solid ${color}55`,
    }}
  >
    {children}
  </div>
);

const EmptyHint: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      padding: 20,
      textAlign: 'center',
      fontSize: 11,
      opacity: 0.5,
      border: '1px dashed rgba(255,255,255,0.12)',
      borderRadius: 6,
    }}
  >
    {text}
  </div>
);

const Divider: React.FC = () => (
  <div
    style={{
      height: 1,
      background: 'rgba(255,255,255,0.08)',
      margin: '2px 0',
    }}
  />
);

const darkSelectStyle: React.CSSProperties = {
  width: '100%',
  height: 28,
  padding: '0 6px',
  borderRadius: 4,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff',
  fontSize: 12,
  outline: 'none',
  boxSizing: 'border-box',
};
