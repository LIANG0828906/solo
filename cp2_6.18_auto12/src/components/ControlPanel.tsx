import React, { useCallback, useRef } from 'react';
import { useStore } from '../store';
import { presetTemplates, sampleArticles } from '../data/sampleArticles';
import type { TypographyParams } from '../engine/parser';

const FONT_OPTIONS = [
  'system-ui', 'Inter', 'Roboto', 'Poppins', 'Montserrat',
  'Georgia', 'Times New Roman', 'Playfair Display', 'Lora', 'Merriweather',
  'Helvetica', 'Arial', 'Verdana', 'Courier New', 'Fira Code',
];

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, unit = '', onChange }) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      requestAnimationFrame(() => onChange(newValue));
    },
    [onChange]
  );

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
      }}>
        <span style={{ fontSize: '12px', color: '#C0C0D0' }}>{label}</span>
        <span style={{ fontSize: '12px', color: '#7C6FFF', fontWeight: 500 }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};

interface CollapsiblePanelProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({ title, isOpen, onToggle, children }) => {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div
        onClick={onToggle}
        style={{
          height: isOpen ? 'auto' : '40px',
          backgroundColor: '#25253A',
          borderRadius: '8px',
          padding: isOpen ? '12px 16px' : '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          minHeight: '40px',
        }}
      >
        <span style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#B0B0C0',
        }}>
          {title}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#B0B0C0"
          strokeWidth="2"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <div
        style={{
          maxHeight: isOpen ? '2000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
          backgroundColor: '#1F1F35',
          borderRadius: isOpen ? '0 0 8px 8px' : '0',
          marginTop: isOpen ? '-4px' : '0',
          padding: isOpen ? '16px 16px 4px 16px' : '0 16px',
        }}
      >
        {children}
      </div>
    </div>
  );
};

interface SelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

const Select: React.FC<SelectProps> = ({ label, value, options, onChange }) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <span style={{
        display: 'block',
        fontSize: '12px',
        color: '#C0C0D0',
        marginBottom: '6px',
      }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          backgroundColor: '#2A2A40',
          color: '#E0E0E0',
          border: 'none',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '13px',
          height: '32px',
          cursor: 'pointer',
          outline: 'none',
          fontFamily: 'inherit',
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} style={{ height: '32px' }}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ marginBottom: '16px' }}>
      <span style={{
        display: 'block',
        fontSize: '12px',
        color: '#C0C0D0',
        marginBottom: '6px',
      }}>
        {label}
      </span>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#2A2A40',
          borderRadius: '6px',
          padding: '6px 12px',
          cursor: 'pointer',
          height: '32px',
        }}
      >
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '4px',
          backgroundColor: value,
          border: '1px solid #3A3A50',
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: '13px',
          color: '#E0E0E0',
          textTransform: 'uppercase',
          fontFamily: 'monospace',
        }}>
          {value}
        </span>
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};

const ControlPanel: React.FC = () => {
  const {
    params,
    ui,
    updateParam,
    applyPreset,
    setUI,
  } = useStore();

  const toggleFontPanel = () => setUI('fontPanelOpen', !ui.fontPanelOpen);
  const toggleSpacingPanel = () => setUI('spacingPanelOpen', !ui.spacingPanelOpen);
  const toggleAlignPanel = () => setUI('alignPanelOpen', !ui.alignPanelOpen);

  const handleArticleChange = (index: number) => setUI('selectedArticle', index);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: '16px',
      overflowY: 'auto',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #1A1A2E 0%, #25253A 100%)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px',
        padding: '4px 4px 8px 4px',
        borderBottom: '1px solid #3A3A50',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #7C6FFF 0%, #5A4ACF 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M4 7V4h16v3"></path>
            <path d="M9 20h6"></path>
            <path d="M12 4v16"></path>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>StyleOrchestra</div>
          <div style={{ fontSize: '11px', color: '#8080A0' }}>排版沙盒工具</div>
        </div>
      </div>

      <CollapsiblePanel
        title="字体设置"
        isOpen={ui.fontPanelOpen}
        onToggle={toggleFontPanel}
      >
        <Select
          label="标题字体"
          value={params.headingFont}
          options={FONT_OPTIONS}
          onChange={(v) => updateParam('headingFont' as keyof TypographyParams, v)}
        />
        <Select
          label="正文字体"
          value={params.bodyFont}
          options={FONT_OPTIONS}
          onChange={(v) => updateParam('bodyFont' as keyof TypographyParams, v)}
        />
        <Slider
          label="H1 字号"
          value={params.h1Size}
          min={20}
          max={72}
          step={1}
          unit="px"
          onChange={(v) => updateParam('h1Size', v)}
        />
        <Slider
          label="H2 字号"
          value={params.h2Size}
          min={16}
          max={56}
          step={1}
          unit="px"
          onChange={(v) => updateParam('h2Size', v)}
        />
        <Slider
          label="H3 字号"
          value={params.h3Size}
          min={14}
          max={40}
          step={1}
          unit="px"
          onChange={(v) => updateParam('h3Size', v)}
        />
        <Slider
          label="正文字号"
          value={params.bodySize}
          min={12}
          max={24}
          step={1}
          unit="px"
          onChange={(v) => updateParam('bodySize', v)}
        />
      </CollapsiblePanel>

      <CollapsiblePanel
        title="间距设置"
        isOpen={ui.spacingPanelOpen}
        onToggle={toggleSpacingPanel}
      >
        <Slider
          label="H1 行距"
          value={params.h1LineHeight}
          min={1}
          max={2}
          step={0.05}
          onChange={(v) => updateParam('h1LineHeight', v)}
        />
        <Slider
          label="H2 行距"
          value={params.h2LineHeight}
          min={1}
          max={2}
          step={0.05}
          onChange={(v) => updateParam('h2LineHeight', v)}
        />
        <Slider
          label="H3 行距"
          value={params.h3LineHeight}
          min={1}
          max={2}
          step={0.05}
          onChange={(v) => updateParam('h3LineHeight', v)}
        />
        <Slider
          label="正文行距"
          value={params.bodyLineHeight}
          min={1.2}
          max={2.4}
          step={0.05}
          onChange={(v) => updateParam('bodyLineHeight', v)}
        />
        <Slider
          label="H1 字间距"
          value={params.h1LetterSpacing}
          min={-2}
          max={4}
          step={0.1}
          unit="px"
          onChange={(v) => updateParam('h1LetterSpacing', v)}
        />
        <Slider
          label="H2 字间距"
          value={params.h2LetterSpacing}
          min={-2}
          max={4}
          step={0.1}
          unit="px"
          onChange={(v) => updateParam('h2LetterSpacing', v)}
        />
        <Slider
          label="H3 字间距"
          value={params.h3LetterSpacing}
          min={-2}
          max={4}
          step={0.1}
          unit="px"
          onChange={(v) => updateParam('h3LetterSpacing', v)}
        />
        <Slider
          label="正文字间距"
          value={params.bodyLetterSpacing}
          min={-1}
          max={3}
          step={0.1}
          unit="px"
          onChange={(v) => updateParam('bodyLetterSpacing', v)}
        />
        <Slider
          label="段落间距"
          value={params.paragraphSpacing}
          min={8}
          max={48}
          step={1}
          unit="px"
          onChange={(v) => updateParam('paragraphSpacing', v)}
        />
        <Slider
          label="标题间距"
          value={params.headingSpacing}
          min={12}
          max={60}
          step={1}
          unit="px"
          onChange={(v) => updateParam('headingSpacing', v)}
        />
      </CollapsiblePanel>

      <CollapsiblePanel
        title="对齐装饰"
        isOpen={ui.alignPanelOpen}
        onToggle={toggleAlignPanel}
      >
        <div style={{ marginBottom: '16px' }}>
          <span style={{
            display: 'block',
            fontSize: '12px',
            color: '#C0C0D0',
            marginBottom: '8px',
          }}>
            文本对齐
          </span>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
          }}>
            {(['left', 'center', 'right', 'justify'] as const).map((align) => (
              <button
                key={align}
                onClick={() => updateParam('textAlign', align)}
                style={{
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: params.textAlign === align ? '#7C6FFF' : '#2A2A40',
                  color: params.textAlign === align ? '#FFFFFF' : '#C0C0D0',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                {align === 'left' ? '左' : align === 'center' ? '中' : align === 'right' ? '右' : '两'}
              </button>
            ))}
          </div>
        </div>

        <ColorPicker
          label="标题颜色"
          value={params.headingColor}
          onChange={(v) => updateParam('headingColor', v)}
        />
        <ColorPicker
          label="正文颜色"
          value={params.textColor}
          onChange={(v) => updateParam('textColor', v)}
        />
        <ColorPicker
          label="链接颜色"
          value={params.linkColor}
          onChange={(v) => updateParam('linkColor', v)}
        />

        <div style={{ marginBottom: '16px' }}>
          <span style={{
            display: 'block',
            fontSize: '12px',
            color: '#C0C0D0',
            marginBottom: '8px',
          }}>
            引用样式
          </span>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
          }}>
            {(['modern', 'classic', 'minimal'] as const).map((style) => (
              <button
                key={style}
                onClick={() => updateParam('quoteStyle', style)}
                style={{
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: params.quoteStyle === style ? '#7C6FFF' : '#2A2A40',
                  color: params.quoteStyle === style ? '#FFFFFF' : '#C0C0D0',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                {style === 'modern' ? '现代' : style === 'classic' ? '经典' : '极简'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <span style={{
            display: 'block',
            fontSize: '12px',
            color: '#C0C0D0',
            marginBottom: '8px',
          }}>
            示例文章
          </span>
          <select
            value={ui.selectedArticle}
            onChange={(e) => handleArticleChange(parseInt(e.target.value))}
            style={{
              width: '100%',
              backgroundColor: '#2A2A40',
              color: '#E0E0E0',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '13px',
              height: '32px',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          >
            {sampleArticles.map((article, index) => (
              <option key={article.id} value={index}>
                {article.title}
              </option>
            ))}
          </select>
        </div>
      </CollapsiblePanel>

      <div style={{
        marginTop: 'auto',
        paddingTop: '16px',
        borderTop: '1px solid #3A3A50',
      }}>
        <div style={{
          fontSize: '12px',
          color: '#8080A0',
          marginBottom: '10px',
        }}>
          预设模板
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '6px',
        }}>
          {presetTemplates.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              title={preset.name}
              style={{
                width: '100%',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: ui.activePreset === preset.id ? '#7C6FFF' : '#30304A',
                color: ui.activePreset === preset.id ? '#FFFFFF' : '#C0C0D0',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (ui.activePreset !== preset.id) {
                  e.currentTarget.style.backgroundColor = '#40406A';
                }
              }}
              onMouseLeave={(e) => {
                if (ui.activePreset !== preset.id) {
                  e.currentTarget.style.backgroundColor = '#30304A';
                }
              }}
            >
              {preset.shortName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
