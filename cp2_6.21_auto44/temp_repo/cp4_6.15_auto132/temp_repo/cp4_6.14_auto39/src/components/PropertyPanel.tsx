import React, { useState, useRef } from 'react';
import type { CanvasComponent, Connection, ComponentStyle } from '../types';
import { Square, Circle, Type, Image as ImageIcon, Trash2, Link2, ChevronDown, X } from 'lucide-react';

interface Props {
  component: CanvasComponent | null;
  connection: Connection | null;
  components: CanvasComponent[];
  connections: Connection[];
  onUpdateComponent: (id: string, patch: Partial<CanvasComponent>) => void;
  onUpdateConnection: (id: string, patch: Partial<Connection>) => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

const COMPONENT_LABELS: Record<string, string> = {
  rectangle: '矩形',
  circle: '圆形',
  text: '文本',
  image: '图片'
};

const COMPONENT_ICONS: Record<string, React.ReactNode> = {
  rectangle: <Square size={14} />,
  circle: <Circle size={14} />,
  text: <Type size={14} />,
  image: <ImageIcon size={14} />
};

const PRESET_COLORS = [
  '#ffffff', '#f8f9fa', '#f3f4f6', '#e5e7eb', '#9ca3af', '#4b5563', '#1f2937',
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#7c3aed'
];

const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; style?: React.CSSProperties }> = ({
  title, children, defaultOpen = true, style
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid #f3f4f6', ...style }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: 0.8, textTransform: 'uppercase' }}>
          {title}
        </div>
        <ChevronDown
          size={14}
          color="#9ca3af"
          style={{ transition: 'transform 0.2s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
      </div>
      {open && <div style={{ padding: '0 16px 14px' }}>{children}</div>}
    </div>
  );
};

interface FieldProps {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  hint?: string;
}
const Field: React.FC<FieldProps> = ({ label, children, hint }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{label}</label>
      {hint && <span style={{ fontSize: 10, color: '#9ca3af' }}>{hint}</span>}
    </div>
    {children}
  </div>
);

interface NumberInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
}
const NumberInput: React.FC<NumberInputProps> = ({ value, onChange, min, max, step = 1, unit, placeholder }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String(value));

  React.useEffect(() => {
    if (!editing) setText(String(value));
  }, [value, editing]);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        transition: 'all 0.2s',
        overflow: 'hidden'
      }}
      onMouseEnter={e => { if (!editing) e.currentTarget.style.background = '#f3f4f6'; }}
      onMouseLeave={e => { if (!editing) e.currentTarget.style.background = '#f9fafb'; }}
    >
      <input
        type="number"
        value={editing ? text : String(value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        onFocus={() => { setEditing(true); setText(String(value)); }}
        onChange={e => setText(e.target.value)}
        onBlur={() => {
          setEditing(false);
          let v = parseFloat(text);
          if (isNaN(v)) v = value;
          if (min != null) v = Math.max(min, v);
          if (max != null) v = Math.min(max, v);
          onChange(v);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') { setEditing(false); setText(String(value)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); onChange(Math.round((value + step) * 100) / 100); }
          if (e.key === 'ArrowDown') { e.preventDefault(); onChange(Math.round((value - step) * 100) / 100); }
        }}
        style={{
          width: '100%',
          padding: '6px 8px',
          paddingRight: unit ? 26 : 8,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: 13,
          color: '#1f2937',
          fontWeight: 500,
          MozAppearance: 'textfield'
        }}
      />
      {unit && <span style={{ position: 'absolute', right: 8, fontSize: 11, color: '#9ca3af', pointerEvents: 'none' }}>{unit}</span>}
    </div>
  );
};

interface TextInputProps {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}
const TextInput: React.FC<TextInputProps> = ({ value, onChange, multiline, placeholder }) => {
  const baseStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    fontSize: 13,
    color: '#1f2937',
    outline: 'none',
    resize: 'none',
    transition: 'all 0.2s'
  };
  const focusProps = {
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      (e.currentTarget as HTMLElement).style.background = '#ffffff';
      (e.currentTarget as HTMLElement).style.borderColor = '#3b82f6';
      (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      (e.currentTarget as HTMLElement).style.background = '#f9fafb';
      (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
    }
  };
  return multiline ? (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={3}
      placeholder={placeholder}
      style={baseStyle}
      {...focusProps}
    />
  ) : (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={baseStyle}
      {...focusProps}
    />
  );
};

interface ColorInputProps {
  value?: string;
  onChange: (v: string) => void;
  allowClear?: boolean;
}
const ColorInput: React.FC<ColorInputProps> = ({ value, onChange, allowClear }) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [showPicker]);

  const display = value || 'transparent';
  return (
    <div style={{ position: 'relative' }} ref={pickerRef}>
      <div style={{ display: 'flex', gap: 6 }}>
        <div
          onClick={() => setShowPicker(!showPicker)}
          style={{
            width: 34,
            height: 32,
            borderRadius: 6,
            background: display,
            border: `1.5px solid ${value ? '#e5e7eb' : '#cbd5e1'}`,
            cursor: 'pointer',
            position: 'relative',
            backgroundImage: display === 'transparent' ?
              'linear-gradient(45deg,#f3f4f6 25%,transparent 25%),linear-gradient(-45deg,#f3f4f6 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f3f4f6 75%),linear-gradient(-45deg,transparent 75%,#f3f4f6 75%)' : undefined,
            backgroundSize: display === 'transparent' ? '8px 8px' : undefined,
            backgroundPosition: display === 'transparent' ? '0 0,0 4px,4px -4px,-4px 0' : undefined,
            flexShrink: 0
          }}
        />
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="HEX 或 空"
          style={{
            flex: 1,
            padding: '6px 10px',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            fontSize: 12,
            fontFamily: 'SF Mono, Menlo, monospace',
            outline: 'none',
            color: '#1f2937',
            textTransform: 'lowercase'
          }}
          onFocus={e => e.target.style.background = '#ffffff'}
          onBlur={e => e.target.style.background = '#f9fafb'}
        />
        {allowClear && (
          <button
            onClick={() => onChange('')}
            title="清除"
            style={{
              width: 30,
              height: 32,
              borderRadius: 6,
              background: '#f3f4f6',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {showPicker && (
        <div
          className="animate-fade-in-scale"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 999,
            padding: 10,
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            width: 216
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {PRESET_COLORS.map(c => (
              <div
                key={c}
                onClick={() => { onChange(c); setShowPicker(false); }}
                title={c}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 6,
                  background: c,
                  border: value?.toLowerCase() === c.toLowerCase() ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'transform 0.15s'
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PropertyPanel: React.FC<Props> = ({
  component,
  connection,
  components,
  connections,
  onUpdateComponent,
  onUpdateConnection,
  onDelete,
  onClearSelection
}) => {
  if (!component && !connection) {
    return (
      <div className="scrollbar-thin" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', color: '#9ca3af' }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          background: 'linear-gradient(135deg,#eff6ff,#f5f3ff)',
          border: '1px dashed #c7d2fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16
        }}>
          <Square size={28} color="#8b5cf6" strokeWidth={1.5} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>未选中元素</div>
        <div style={{ fontSize: 12, lineHeight: 1.7, maxWidth: 220 }}>
          在画布上点击组件或连线以选中，<br />然后在此处编辑其属性。
        </div>
        <div style={{ marginTop: 20, padding: 12, borderRadius: 10, background: '#f9fafb', border: '1px solid #f3f4f6', fontSize: 11, color: '#6b7280', width: '100%', textAlign: 'left', lineHeight: 1.8 }}>
          <div><b>快捷键</b></div>
          <div>• <code>点击</code> 选中元素</div>
          <div>• <code>Delete</code> 删除元素</div>
          <div>• <code>Ctrl+Z</code> 撤销</div>
          <div>• <code>Ctrl+Shift+Z</code> 重做</div>
          <div>• <code>Esc</code> 取消选中</div>
        </div>
      </div>
    );
  }

  if (connection) {
    const fromComp = components.find(c => c.id === connection.fromComponentId);
    const toComp = components.find(c => c.id === connection.toComponentId);
    return (
      <div className="scrollbar-thin" style={{ height: '100%', overflow: 'auto', paddingBottom: 16 }}>
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#fff7ed'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: '#fed7aa', color: '#c2410c',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Link2 size={15} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#9a3412' }}>交互连线</div>
              <div style={{ fontSize: 10, color: '#b45309', marginTop: 1 }}>跳转动作用于演示</div>
            </div>
          </div>
          <button
            onClick={onDelete}
            title="删除连线"
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: '#fef2f2', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fef2f2')}
          >
            <Trash2 size={15} />
          </button>
        </div>

        <Section title="跳转配置">
          <Field label="标签文字" hint="双击连线可编辑">
            <TextInput
              value={connection.label}
              onChange={v => onUpdateConnection(connection.id, { label: v })}
              placeholder="例如：点击登录"
            />
          </Field>

          <Field label="起始组件">
            <ComponentBadge comp={fromComp} />
          </Field>

          <Field label="目标组件">
            <ComponentBadge comp={toComp} />
          </Field>
        </Section>

        <Section title="快速操作" defaultOpen={true}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <QuickButton
              label="编辑目标组件"
              disabled={!toComp}
              onClick={() => {
                if (toComp) {
                  window.dispatchEvent(new CustomEvent('__select_component__', { detail: { id: toComp.id } }));
                }
              }}
            />
            <QuickButton
              label="取消选择"
              onClick={onClearSelection}
              variant="secondary"
            />
          </div>
        </Section>
      </div>
    );
  }

  const comp = component!;
  const updateStyle = (patch: Partial<ComponentStyle>) => {
    onUpdateComponent(comp.id, { style: { ...comp.style, ...patch } });
  };

  const maxZ = components.length > 0 ? Math.max(...components.map(c => c.zIndex)) : 0;

  return (
    <div className="scrollbar-thin" style={{ height: '100%', overflow: 'auto', paddingBottom: 16 }}>
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: comp.type === 'rectangle' ? '#dbeafe' :
              comp.type === 'circle' ? '#ede9fe' :
              comp.type === 'text' ? '#d1fae5' : '#fef3c7',
            color: comp.type === 'rectangle' ? '#1d4ed8' :
              comp.type === 'circle' ? '#6d28d9' :
              comp.type === 'text' ? '#047857' : '#b45309',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {COMPONENT_ICONS[comp.type]}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 6 }}>
              {COMPONENT_LABELS[comp.type]}
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: '#f3f4f6', color: '#6b7280', fontWeight: 600 }}>
                #{String(comp.zIndex).padStart(2, '0')}
              </span>
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
              ID: {comp.id.slice(0, 8)}
            </div>
          </div>
        </div>
        <button
          onClick={onDelete}
          title="删除组件"
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#fef2f2', color: '#ef4444',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fef2f2')}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <Section title="名称与标识">
        <Field label="组件名称">
          <TextInput
            value={comp.name || ''}
            onChange={v => onUpdateComponent(comp.id, { name: v })}
            placeholder="便于识别的名称"
          />
        </Field>
      </Section>

      <Section title="位置与尺寸">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="X">
            <NumberInput value={Math.round(comp.x)} onChange={v => onUpdateComponent(comp.id, { x: v })} />
          </Field>
          <Field label="Y">
            <NumberInput value={Math.round(comp.y)} onChange={v => onUpdateComponent(comp.id, { y: v })} />
          </Field>
          <Field label="宽">
            <NumberInput value={Math.round(comp.width)} onChange={v => onUpdateComponent(comp.id, { width: Math.max(10, v) })} min={10} />
          </Field>
          <Field label="高">
            <NumberInput value={Math.round(comp.height)} onChange={v => onUpdateComponent(comp.id, { height: Math.max(10, v) })} min={10} />
          </Field>
          <Field label="旋转" hint="15°吸附">
            <NumberInput
              value={comp.rotation}
              onChange={v => onUpdateComponent(comp.id, { rotation: (Math.round(v / 15) * 15 + 360) % 360 })}
              step={15}
              unit="°"
            />
          </Field>
          <Field label="图层" hint="z-index">
            <NumberInput
              value={comp.zIndex}
              onChange={v => onUpdateComponent(comp.id, { zIndex: Math.max(0, Math.min(maxZ + 1, v)) })}
              min={0}
              max={maxZ + 1}
            />
          </Field>
        </div>
      </Section>

      {(comp.type === 'rectangle' || comp.type === 'circle' || comp.type === 'image') && (
        <Section title="外观样式">
          <Field label="背景颜色">
            <ColorInput
              value={comp.style.backgroundColor}
              onChange={v => updateStyle({ backgroundColor: v })}
              allowClear={comp.type !== 'image'}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="边框颜色">
              <ColorInput
                value={comp.style.borderColor}
                onChange={v => updateStyle({ borderColor: v })}
                allowClear
              />
            </Field>
            <Field label="边框粗细">
              <NumberInput
                value={comp.style.borderWidth ?? 1}
                onChange={v => updateStyle({ borderWidth: Math.max(0, v) })}
                min={0}
                max={20}
                unit="px"
              />
            </Field>
          </div>
          {comp.type !== 'circle' && (
            <Field label="圆角">
              <NumberInput
                value={comp.style.borderRadius ?? 0}
                onChange={v => updateStyle({ borderRadius: Math.max(0, v) })}
                min={0}
                max={200}
                unit="px"
              />
            </Field>
          )}
          <Field label="透明度">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((comp.style.opacity ?? 1) * 100)}
                onChange={e => updateStyle({ opacity: parseInt(e.target.value) / 100 })}
                style={{ flex: 1, accentColor: '#3b82f6' }}
              />
              <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, minWidth: 32, textAlign: 'right' }}>
                {Math.round((comp.style.opacity ?? 1) * 100)}%
              </span>
            </div>
          </Field>
        </Section>
      )}

      {(comp.type === 'text' || comp.type !== 'image') && (
        <Section title="文字设置">
          {(comp.type === 'text' || comp.type !== 'image') && (
            <Field label={comp.type === 'text' ? '文本内容' : '内部文字'}>
              <TextInput
                value={comp.content}
                onChange={v => onUpdateComponent(comp.id, { content: v })}
                multiline
                placeholder={comp.type === 'text' ? '输入文字内容...' : '可选，显示于组件中央'}
              />
            </Field>
          )}
          {(comp.type === 'text' || comp.content) && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="文字颜色">
                  <ColorInput
                    value={comp.style.color || '#1f2937'}
                    onChange={v => updateStyle({ color: v })}
                  />
                </Field>
                <Field label="字号">
                  <NumberInput
                    value={comp.style.fontSize ?? 14}
                    onChange={v => updateStyle({ fontSize: Math.max(8, Math.min(120, v)) })}
                    min={8}
                    max={120}
                    unit="px"
                  />
                </Field>
              </div>
              <Field label="字重">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                  {[
                    { v: 300, l: '轻' },
                    { v: 400, l: '常' },
                    { v: 600, l: '粗' },
                    { v: 700, l: '黑' }
                  ].map(w => (
                    <button
                      key={w.v}
                      onClick={() => updateStyle({ fontWeight: w.v })}
                      style={{
                        padding: '6px 0',
                        borderRadius: 6,
                        background: (comp.style.fontWeight ?? 400) === w.v ? '#3b82f6' : '#f3f4f6',
                        color: (comp.style.fontWeight ?? 400) === w.v ? '#fff' : '#374151',
                        fontSize: 12,
                        fontWeight: w.v,
                        transition: 'all 0.15s'
                      }}
                    >
                      {w.l}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}
        </Section>
      )}

      {comp.type === 'image' && (
        <Section title="图片设置">
          <Field label="图片地址">
            <TextInput
              value={comp.style.src || ''}
              onChange={v => updateStyle({ src: v })}
              placeholder="https://... 或 data:image/..."
            />
          </Field>
          <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: '#fefce8', border: '1px solid #fde68a', fontSize: 11, color: '#854d0e', lineHeight: 1.6 }}>
            💡 支持 URL 地址或 data URL (base64)。粘贴链接即可显示图片。
          </div>
        </Section>
      )}

      <Section title="图层操作" defaultOpen={false}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button
            onClick={() => onUpdateComponent(comp.id, { zIndex: maxZ + 1 })}
            style={layerBtnStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#dbeafe')}
            onMouseLeave={e => (e.currentTarget.style.background = '#eff6ff')}
          >置于顶层</button>
          <button
            onClick={() => onUpdateComponent(comp.id, { zIndex: 0 })}
            style={layerBtnStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#dbeafe')}
            onMouseLeave={e => (e.currentTarget.style.background = '#eff6ff')}
          >置于底层</button>
          <button
            onClick={() => onUpdateComponent(comp.id, { zIndex: Math.min(maxZ + 1, comp.zIndex + 1) })}
            style={layerBtnStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#dbeafe')}
            onMouseLeave={e => (e.currentTarget.style.background = '#eff6ff')}
          >上移一层</button>
          <button
            onClick={() => onUpdateComponent(comp.id, { zIndex: Math.max(0, comp.zIndex - 1) })}
            style={layerBtnStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#dbeafe')}
            onMouseLeave={e => (e.currentTarget.style.background = '#eff6ff')}
          >下移一层</button>
        </div>
      </Section>
    </div>
  );
};

const layerBtnStyle: React.CSSProperties = {
  padding: '7px 0',
  borderRadius: 7,
  background: '#eff6ff',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 600,
  transition: 'all 0.15s'
};

const ComponentBadge: React.FC<{ comp?: CanvasComponent }> = ({ comp }) => {
  if (!comp) return (
    <div style={{ padding: '7px 10px', borderRadius: 6, background: '#fef2f2', color: '#b91c1c', fontSize: 12, fontWeight: 500 }}>
      组件已被删除
    </div>
  );
  return (
    <div style={{
      padding: '7px 10px',
      borderRadius: 8,
      background: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 12,
      color: '#374151'
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: 5,
        background: comp.type === 'rectangle' ? '#dbeafe' :
          comp.type === 'circle' ? '#ede9fe' :
          comp.type === 'text' ? '#d1fae5' : '#fef3c7',
        color: comp.type === 'rectangle' ? '#1d4ed8' :
          comp.type === 'circle' ? '#6d28d9' :
          comp.type === 'text' ? '#047857' : '#b45309',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {COMPONENT_ICONS[comp.type]}
      </span>
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {comp.name || `${COMPONENT_LABELS[comp.type]} ${comp.id.slice(0, 4)}`}
      </div>
      <span style={{ fontSize: 10, color: '#9ca3af' }}>#{String(comp.zIndex).padStart(2, '0')}</span>
    </div>
  );
};

interface QuickButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}
const QuickButton: React.FC<QuickButtonProps> = ({ label, onClick, variant = 'primary', disabled }) => {
  const colors = {
    primary: { bg: '#eff6ff', bgHover: '#dbeafe', text: '#1d4ed8' },
    secondary: { bg: '#f3f4f6', bgHover: '#e5e7eb', text: '#374151' },
    danger: { bg: '#fef2f2', bgHover: '#fee2e2', text: '#b91c1c' }
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '8px 14px',
        borderRadius: 8,
        background: disabled ? '#f3f4f6' : colors.bg,
        color: disabled ? '#9ca3af' : colors.text,
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s'
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = colors.bgHover; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = colors.bg; }}
    >
      {label}
    </button>
  );
};

export default PropertyPanel;
