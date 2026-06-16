import { useEditorStore, useSelectedId, useComponentList } from '../store/editorStore';
import type { PortfolioComponent, TitleProps, ImageProps, TextCardProps } from '../store/editorStore';

function findComponent(components: PortfolioComponent[], id: string | null): PortfolioComponent | null {
  if (!id) return null;
  return components.find((c) => c.id === id) ?? null;
}

function TitleEditor({ comp }: { comp: PortfolioComponent }) {
  const props = comp.props as TitleProps;
  const update = useEditorStore((s) => s.updateComponentProps);
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
        <span style={{ fontSize: 13, fontWeight: 500, color: '#7F8C8D' }}>
          字号: {props.fontSize}px
        </span>
        <input
          type="range"
          min={16}
          max={48}
          value={props.fontSize}
          onChange={(e) => update(comp.id, { fontSize: Number(e.target.value) })}
          style={{ width: '100%', accentColor: '#3498DB' }}
        />
      </label>
    </div>
  );
}

function ImageEditor({ comp }: { comp: PortfolioComponent }) {
  const props = comp.props as ImageProps;
  const update = useEditorStore((s) => s.updateComponentProps);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#7F8C8D' }}>
          宽度: {props.widthPercent}%
        </span>
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
        <span style={{ fontSize: 13, fontWeight: 500, color: '#7F8C8D' }}>
          圆角: {props.borderRadius}px
        </span>
        <input
          type="range"
          min={0}
          max={24}
          value={props.borderRadius}
          onChange={(e) => update(comp.id, { borderRadius: Number(e.target.value) })}
          style={{ width: '100%', accentColor: '#3498DB' }}
        />
      </label>
    </div>
  );
}

function TextCardEditor({ comp }: { comp: PortfolioComponent }) {
  const props = comp.props as TextCardProps;
  const update = useEditorStore((s) => s.updateComponentProps);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#7F8C8D' }}>文本内容</span>
        <textarea
          value={props.content}
          onChange={(e) => update(comp.id, { content: e.target.value })}
          rows={6}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #BDC3C7',
            fontSize: 14,
            outline: 'none',
            resize: 'vertical',
            lineHeight: 1.6,
            transition: 'border 0.2s ease',
          }}
          onFocus={(e) => (e.currentTarget.style.border = '1px solid #3498DB')}
          onBlur={(e) => (e.currentTarget.style.border = '1px solid #BDC3C7')}
        />
      </label>
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
    </div>
  );
}

export default function PropertyPanel() {
  const selectedId = useSelectedId();
  const components = useComponentList();
  const selectedComp = findComponent(components, selectedId);

  if (!selectedComp) {
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#BDC3C7',
          fontSize: 14,
        }}
      >
        点击组件以编辑属性
      </div>
    );
  }

  const typeLabel = {
    title: '标题组件',
    image: '图片组件',
    textCard: '文本卡片',
  }[selectedComp.type];

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
        {typeLabel} 属性
      </div>

      {selectedComp.type === 'title' && <TitleEditor comp={selectedComp} />}
      {selectedComp.type === 'image' && <ImageEditor comp={selectedComp} />}
      {selectedComp.type === 'textCard' && <TextCardEditor comp={selectedComp} />}
    </div>
  );
}
