import React from 'react';
// ========== 类型引用：导入接口时使用别名避免与组件名冲突 ==========
import type { TextConfig as TextConfigType } from './CanvasRenderer';
import { FONT_OPTIONS } from './CanvasRenderer';

// ========== 数据流接口定义 ==========
// 接收 App.tsx 传入的文字配置状态和 onChange 回调
interface TextConfigProps {
  config: TextConfigType;
  onChange: (config: TextConfigType) => void;
}

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <div style={{
    backgroundColor: '#f1f3f5',
    borderRadius: '8px',
    padding: '8px 12px',
    fontWeight: 600,
    fontSize: '14px',
    color: '#495057',
    marginBottom: '12px'
  }}>
    {title}
  </div>
);

const SliderRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, onChange }) => (
  <div style={{ marginBottom: '12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
      <span style={{ fontSize: '13px', color: '#6c757d' }}>{label}</span>
      <span style={{ fontSize: '13px', color: '#495057', fontWeight: 500 }}>{value}px</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: '100%',
        height: '6px',
        borderRadius: '3px',
        appearance: 'none',
        background: '#e9ecef',
        outline: 'none',
        cursor: 'pointer'
      }}
    />
  </div>
);

const ColorPicker: React.FC<{
  label: string;
  color: string;
  onChange: (color: string) => void;
}> = ({ label, color, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '10px' }}>
    <span style={{ fontSize: '13px', color: '#6c757d', minWidth: '60px' }}>{label}</span>
    <div style={{ position: 'relative' }}>
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: color,
          border: '2px solid #dee2e6',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      />
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '28px',
          height: '28px',
          opacity: 0,
          cursor: 'pointer'
        }}
      />
    </div>
    <input
      type="text"
      value={color}
      onChange={(e) => onChange(e.target.value)}
      style={{
        flex: 1,
        padding: '6px 10px',
        fontSize: '12px',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        fontFamily: 'monospace'
      }}
    />
  </div>
);

// ========== 主组件：接收props并通过回调更新状态 ==========
// 输入: config (文字配置状态)
// 输出: onChange回调 → App.tsx更新textConfig状态
export const TextConfig: React.FC<TextConfigProps> = ({ config, onChange }) => {
  const updateText = (key: keyof TextConfigType, value: string | number) => {
    onChange({ ...config, [key]: value });
  };

  const updateShadow = (key: keyof typeof config.shadow, value: number | string) => {
    onChange({ ...config, shadow: { ...config.shadow, [key]: value } });
  };

  const updateStroke = (key: keyof typeof config.stroke, value: number | string) => {
    onChange({ ...config, stroke: { ...config.stroke, [key]: value } });
  };

  return (
    <div>
      <SectionTitle title="文字内容" />
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '6px' }}>
          标题（最多20字）
        </div>
        <input
          type="text"
          value={config.title}
          maxLength={20}
          onChange={(e) => updateText('title', e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '6px' }}>
          副标题（最多40字）
        </div>
        <input
          type="text"
          value={config.subtitle}
          maxLength={40}
          onChange={(e) => updateText('subtitle', e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginTop: '16px' }}>
        <SectionTitle title="字体设置" />
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '6px' }}>字体</div>
          <select
            value={config.fontFamily}
            onChange={(e) => updateText('fontFamily', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>
        <SliderRow
          label="标题字号"
          value={config.titleSize}
          min={16}
          max={72}
          onChange={(v) => updateText('titleSize', v)}
        />
        <SliderRow
          label="副标题字号"
          value={config.subtitleSize}
          min={12}
          max={48}
          onChange={(v) => updateText('subtitleSize', v)}
        />
        <ColorPicker
          label="文字颜色"
          color={config.color}
          onChange={(c) => updateText('color', c)}
        />
      </div>

      <div style={{ marginTop: '16px' }}>
        <SectionTitle title="文字阴影" />
        <SliderRow
          label="水平偏移"
          value={config.shadow.offsetX}
          min={-10}
          max={10}
          onChange={(v) => updateShadow('offsetX', v)}
        />
        <SliderRow
          label="垂直偏移"
          value={config.shadow.offsetY}
          min={-10}
          max={10}
          onChange={(v) => updateShadow('offsetY', v)}
        />
        <SliderRow
          label="模糊半径"
          value={config.shadow.blur}
          min={0}
          max={20}
          onChange={(v) => updateShadow('blur', v)}
        />
        <ColorPicker
          label="阴影颜色"
          color={config.shadow.color}
          onChange={(c) => updateShadow('color', c)}
        />
      </div>

      <div style={{ marginTop: '16px' }}>
        <SectionTitle title="文字描边" />
        <SliderRow
          label="描边粗细"
          value={config.stroke.width}
          min={1}
          max={5}
          onChange={(v) => updateStroke('width', v)}
        />
        <ColorPicker
          label="描边颜色"
          color={config.stroke.color}
          onChange={(c) => updateStroke('color', c)}
        />
      </div>
    </div>
  );
};
