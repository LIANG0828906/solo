import { useState, useEffect, useRef } from 'react';
import {
  useEditorStore,
  useSelectedId,
  useComponentList,
  useBgColor,
  useThemeColor,
  getBrightnessPercent,
  getContrastRatio,
} from '../store/editorStore';
import type {
  PortfolioComponent,
  TitleProps,
  ImageProps,
  TextCardProps,
} from '../store/editorStore';

function findComponent(
  components: PortfolioComponent[],
  id: string | null
): PortfolioComponent | null {
  if (!id) return null;
  return components.find((c) => c.id === id) ?? null;
}

function BrightnessWarning({ brightness }: { brightness: number }) {
  if (brightness <= 90) return null;
  return (
    <div
      style={{
        padding: '8px 12px',
        backgroundColor: '#FFF3CD',
        border: '1px solid #FFECB3',
        borderRadius: 6,
        fontSize: 12,
        color: '#856404',
        marginTop: 8,
      }}
    >
      ⚠️ 背景色亮度过高（{brightness.toFixed(0)}%），可能影响文字可读性
    </div>
  );
}

function ContrastWarning({
  bgColor,
  components,
}: {
  bgColor: string;
  components: PortfolioComponent[];
}) {
  const lowContrastComponents = components.filter((c) => {
    if (c.type === 'textCard') {
      const cardBg = (c.props as TextCardProps).bgColor;
      const ratio = getContrastRatio('#2C3E50', cardBg);
      return ratio < 4.5;
    }
    if (c.type === 'title') {
      const color = (c.props as TitleProps).color;
      if (color === 'inherit' || color.startsWith('#')) {
        const textColor = color === 'inherit' ? '#2C3E50' : color;
        const ratio = getContrastRatio(textColor, bgColor);
        return ratio < 4.5;
      }
    }
    return false;
  });

  if (lowContrastComponents.length === 0) return null;

  return (
    <div
      style={{
        padding: '8px 12px',
        backgroundColor: '#F8D7DA',
        border: '1px solid #F5C6CB',
        borderRadius: 6,
        fontSize: 12,
        color: '#721C24',
        marginTop: 8,
      }}
    >
      ⚠️ 检测到 {lowContrastComponents.length} 个组件对比度不足，建议调整
    </div>
  );
}

function CanvasBgEditor() {
  const bgColor = useBgColor();
  const components = useComponentList();
  const setBgColor = useEditorStore((s) => s.setBgColor);
  const [brightness, setBrightness] = useState(getBrightnessPercent(bgColor));

  useEffect(() => {
    setBrightness(getBrightnessPercent(bgColor));
  }, [bgColor]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    const newBrightness = getBrightnessPercent(newColor);
    if (newBrightness > 95) {
      if (!window.confirm('该颜色亮度过高，可能影响可读性，确定要使用吗？')) {
        return;
      }
    }
    if (newColor.toLowerCase() === '#ffffff' || newColor.toLowerCase() === '#fff') {
      if (!window.confirm('纯白色背景可能使组件边界不明显，确定要使用吗？')) {
        return;
      }
    }
    setBgColor(newColor);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#2C3E50',
          }}
        >
          画布背景色
        </span>
        <input
          type="color"
          value={bgColor}
          onChange={handleColorChange}
          style={{
            width: '100%',
            height: 40,
            border: '1px solid #BDC3C7',
            borderRadius: 6,
            cursor: 'pointer',
            padding: 2,
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#7F8C8D',
            marginTop: 4,
          }}
        >
          <span>当前值: {bgColor.toUpperCase()}</span>
          <span>亮度: {brightness.toFixed(0)}%</span>
        </div>
      </label>
      <BrightnessWarning brightness={brightness} />
      <ContrastWarning bgColor={bgColor} components={components} />
    </div>
  );
}

function TitleEditor({ comp }: { comp: PortfolioComponent }) {
  const props = comp.props as TitleProps;
  const themeColor = useThemeColor();
  const update = useEditorStore((s) => s.updateComponentProps);
  const bringToFront = useEditorStore((s) => s.bringToFront);
  const sendToBack = useEditorStore((s) => s.sendToBack);

  const textColor = props.color === 'inherit' ? themeColor : props.color;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#7F8C8D' }}>标题文本</span>
        <input
          type="text"
          value={props.text}
          onChange={(e) => update(comp.id, { text: e.target.value })}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #BDC3C7',
            fontSize: 14,
            outline: 'none',
            transition: 'border 0.2s ease',
          }}
          onFocus={(e) => (e.currentTarget.style.border = '1px solid #3498DB')}
          onBlur={(e) => (e.currentTarget.style.border = '1px solid #BDC3C7')}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#7F8C8D' }}>字号: {props.fontSize}px</span>
        <input
          type="range"
          min={16}
          max={48}
          value={props.fontSize}
          onChange={(e) => update(comp.id, { fontSize: Number(e.target.value) })}
          style={{ width: '100%', accentColor: '#3498DB' }}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#7F8C8D' }}>文字颜色</span>
        <input
          type="color"
          value={textColor}
          onChange={(e) => update(comp.id, { color: e.target.value })}
          style={{
            width: '100%',
            height: 36,
            border: '1px solid #BDC3C7',
            borderRadius: 6,
            cursor: 'pointer',
            padding: 2,
          }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            onClick={() => update(comp.id, { color: 'inherit' })}
            style={{
              flex: 1,
              padding: '4px 8px',
              borderRadius: 4,
              border: `1px solid ${themeColor}`,
              backgroundColor: textColor === themeColor ? themeColor : 'transparent',
              color: textColor === themeColor ? '#fff' : themeColor,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            跟随主题
          </button>
          <button
            onClick={() => update(comp.id, { color: '#2C3E50' })}
            style={{
              flex: 1,
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid #2C3E50',
              backgroundColor: textColor === '#2C3E50' ? '#2C3E50' : 'transparent',
              color: textColor === '#2C3E50' ? '#fff' : '#2C3E50',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            默认深色
          </button>
        </div>
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#7F8C8D' }}>对齐方式</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => update(comp.id, { align })}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 6,
                border: `1px solid ${props.align === align ? '#3498DB' : '#BDC3C7'}`,
                backgroundColor: props.align === align ? '#3498DB' : '#fff',
                color: props.align === align ? '#fff' : '#2C3E50',
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {align === 'left' ? '左对齐' : align === 'center' ? '居中' : '右对齐'}
            </button>
          ))}
        </div>
      </label>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={() => bringToFront(comp.id)}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: 6,
            border: '1px solid #BDC3C7',
            backgroundColor: '#fff',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ↑ 置顶
        </button>
        <button
          onClick={() => sendToBack(comp.id)}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: 6,
            border: '1px solid #BDC3C7',
            backgroundColor: '#fff',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ↓ 置底
        </button>
      </div>
    </div>
  );
}

function ImageEditor({ comp }: { comp: PortfolioComponent }) {
  const props = comp.props as ImageProps;
  const update = useEditorStore((s) => s.updateComponentProps);
  const bringToFront = useEditorStore((s) => s.bringToFront);
  const sendToBack = useEditorStore((s) => s.sendToBack);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          update(comp.id, { src: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#7F8C8D' }}>图片上传</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{
            padding: '8px',
            fontSize: 13,
          }}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#7F8C8D' }}>图片URL</span>
        <input
          type="text"
          value={props.src.startsWith('data:') ? '' : props.src}
          onChange={(e) => update(comp.id, { src: e.target.value })}
          placeholder="输入图片URL..."
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #BDC3C7',
            fontSize: 14,
            outline: 'none',
          }}
        />
      </label>

      <div
        style={{
          padding: 8,
          backgroundColor: '#ECF0F1',
          borderRadius: 6,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <img
          src={props.src}
          alt="preview"
          style={{
            maxWidth: '100%',
            maxHeight: 120,
            borderRadius: props.borderRadius,
          }}
        />
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#7F8C8D' }}>宽度: {props.widthPercent}%</span>
        <input
          type="range"
          min={30}
          max={100}
          value={props.widthPercent}
          onChange={(e) => update(comp.id, { widthPercent: Number(e.target.value) })}
          style={{ width: '100%', accentColor: '#3498DB' }}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#7F8C8D' }}>圆角: {props.borderRadius}px</span>
        <input
          type="range"
          min={0}
          max={24}
          value={props.borderRadius}
          onChange={(e) => update(comp.id, { borderRadius: Number(e.target.value) })}
          style={{ width: '100%', accentColor: '#3498DB' }}
        />
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => bringToFront(comp.id)}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: 6,
            border: '1px solid #BDC3C7',
            backgroundColor: '#fff',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ↑ 置顶
        </button>
        <button
          onClick={() => sendToBack(comp.id)}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: 6,
            border: '1px solid #BDC3C7',
            backgroundColor: '#fff',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ↓ 置底
        </button>
      </div>
    </div>
  );
}

function RichTextToolbar({
  onFormat,
}: {
  onFormat: (command: string, value?: string) => void;
}) {
  const buttons = [
    { cmd: 'bold', label: 'B', style: { fontWeight: 'bold' } },
    { cmd: 'italic', label: 'I', style: { fontStyle: 'italic' } },
    { cmd: 'underline', label: 'U', style: { textDecoration: 'underline' } },
    { cmd: 'strikeThrough', label: 'S', style: { textDecoration: 'line-through' } },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        padding: '6px',
        backgroundColor: '#ECF0F1',
        borderRadius: '6px 6px 0 0',
        border: '1px solid #BDC3C7',
        borderBottom: 'none',
      }}
    >
      {buttons.map((btn) => (
        <button
          key={btn.cmd}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onFormat(btn.cmd);
          }}
          style={{
            width: 30,
            height: 30,
            borderRadius: 4,
            border: '1px solid #BDC3C7',
            backgroundColor: '#fff',
            cursor: 'pointer',
            ...btn.style,
            fontSize: 13,
          }}
          title={btn.cmd}
        >
          {btn.label}
        </button>
      ))}
      <div style={{ width: 1, backgroundColor: '#BDC3C7', margin: '4px 4px' }} />
      {['h3', 'p', 'ul'].map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onFormat('formatBlock', tag);
          }}
          style={{
            padding: '0 10px',
            height: 30,
            borderRadius: 4,
            border: '1px solid #BDC3C7',
            backgroundColor: '#fff',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          {tag === 'h3' ? '标题' : tag === 'p' ? '段落' : '列表'}
        </button>
      ))}
    </div>
  );
}

function TextCardEditor({ comp }: { comp: PortfolioComponent }) {
  const props = comp.props as TextCardProps;
  const update = useEditorStore((s) => s.updateComponentProps);
  const bringToFront = useEditorStore((s) => s.bringToFront);
  const sendToBack = useEditorStore((s) => s.sendToBack);
  const editorRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'visual' | 'html'>('visual');

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      update(comp.id, { content: editorRef.current.innerHTML });
    }
  };

  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    update(comp.id, { content: e.target.value });
  };

  const handleVisualInput = () => {
    if (editorRef.current) {
      update(comp.id, { content: editorRef.current.innerHTML });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 4, borderRadius: 6, overflow: 'hidden' }}>
        <button
          onClick={() => setMode('visual')}
          style={{
            flex: 1,
            padding: '8px',
            border: '1px solid #BDC3C7',
            backgroundColor: mode === 'visual' ? '#3498DB' : '#fff',
            color: mode === 'visual' ? '#fff' : '#2C3E50',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          可视化编辑
        </button>
        <button
          onClick={() => setMode('html')}
          style={{
            flex: 1,
            padding: '8px',
            border: '1px solid #BDC3C7',
            backgroundColor: mode === 'html' ? '#3498DB' : '#fff',
            color: mode === 'html' ? '#fff' : '#2C3E50',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          HTML源码
        </button>
      </div>

      {mode === 'visual' ? (
        <>
          <RichTextToolbar onFormat={handleFormat} />
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleVisualInput}
            dangerouslySetInnerHTML={{ __html: props.content }}
            style={{
              padding: '12px',
              minHeight: 150,
              borderRadius: '0 0 6px 6px',
              border: '1px solid #BDC3C7',
              fontSize: props.fontSize,
              lineHeight: 1.7,
              outline: 'none',
              backgroundColor: props.bgColor,
            }}
          />
        </>
      ) : (
        <textarea
          value={props.content}
          onChange={handleHtmlChange}
          rows={8}
          style={{
            padding: '12px',
            borderRadius: 6,
            border: '1px solid #BDC3C7',
            fontSize: 13,
            fontFamily: 'Consolas, Monaco, monospace',
            lineHeight: 1.5,
            outline: 'none',
            resize: 'vertical',
          }}
        />
      )}

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#7F8C8D' }}>背景色</span>
        <input
          type="color"
          value={props.bgColor}
          onChange={(e) => update(comp.id, { bgColor: e.target.value })}
          style={{
            width: '100%',
            height: 36,
            border: '1px solid #BDC3C7',
            borderRadius: 6,
            cursor: 'pointer',
            padding: 2,
          }}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#7F8C8D' }}>字号: {props.fontSize}px</span>
        <input
          type="range"
          min={12}
          max={24}
          value={props.fontSize}
          onChange={(e) => update(comp.id, { fontSize: Number(e.target.value) })}
          style={{ width: '100%', accentColor: '#3498DB' }}
        />
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => bringToFront(comp.id)}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: 6,
            border: '1px solid #BDC3C7',
            backgroundColor: '#fff',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ↑ 置顶
        </button>
        <button
          onClick={() => sendToBack(comp.id)}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: 6,
            border: '1px solid #BDC3C7',
            backgroundColor: '#fff',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ↓ 置底
        </button>
      </div>
    </div>
  );
}

export default function PropertyPanel() {
  const selectedId = useSelectedId();
  const components = useComponentList();
  const selectedComp = findComponent(components, selectedId);

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 56,
        bottom: 0,
        width: 280,
        backgroundColor: '#FFFFFF',
        borderLeft: '1px solid #BDC3C7',
        padding: '24px 20px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: '#2C3E50',
          marginBottom: 20,
          paddingBottom: 12,
          borderBottom: '1px solid #ECF0F1',
        }}
      >
        属性面板
      </div>

      <CanvasBgEditor />

      {selectedComp && (
        <>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#2C3E50',
              marginBottom: 16,
              paddingTop: 8,
              borderTop: '1px solid #ECF0F1',
            }}
          >
            {
              {
                title: '标题组件',
                image: '图片组件',
                textCard: '文本卡片',
              }[selectedComp.type]
            }{' '}
            属性
          </div>

          {selectedComp.type === 'title' && <TitleEditor comp={selectedComp} />}
          {selectedComp.type === 'image' && <ImageEditor comp={selectedComp} />}
          {selectedComp.type === 'textCard' && <TextCardEditor comp={selectedComp} />}
        </>
      )}

      {!selectedComp && (
        <div
          style={{
            color: '#BDC3C7',
            fontSize: 14,
            textAlign: 'center',
            padding: '40px 0',
          }}
        >
          点击组件以编辑属性
        </div>
      )}
    </div>
  );
}
