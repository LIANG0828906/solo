import { memo, useState, useEffect, useCallback } from 'react';
import { useColorStore } from '@/store/useColorStore';
import {
  GradientConfig,
  ShadowConfig,
  generateGradientCSS,
  generateShadowCSS,
  hslToHex,
  hexToHsl,
} from '@/utils/colorUtils';

type TabType = 'gradient' | 'shadow';

const GRADIENT_DIRECTIONS: Array<{
  value: GradientConfig['direction'];
  label: string;
  type: 'linear' | 'radial';
}> = [
  { value: 'to right', label: '从左到右', type: 'linear' },
  { value: 'to bottom', label: '从上到下', type: 'linear' },
  { value: 'to bottom right', label: '对角线', type: 'linear' },
  { value: 'radial', label: '径向', type: 'radial' },
];

const useCopyState = () => {
  const [copied, setCopied] = useState(false);
  const triggerCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 800);
    });
  }, []);
  return { copied, triggerCopy };
};

const EffectsPanel = memo(() => {
  const mainHex = useColorStore((s) => s.hex);
  const mainHsl = useColorStore((s) => s.hsl);
  const [activeTab, setActiveTab] = useState<TabType>('gradient');

  const [gradient, setGradient] = useState<GradientConfig>({
    type: 'linear',
    direction: 'to right',
    color1: mainHex,
    color2: hslToHex((mainHsl.h + 180) % 360, mainHsl.s, mainHsl.l),
  });

  const [shadow, setShadow] = useState<ShadowConfig>({
    offsetX: 5,
    offsetY: 5,
    blurRadius: 15,
    opacity: 0.3,
  });

  useEffect(() => {
    const hsl = hexToHsl(gradient.color1);
    const complement = hsl
      ? hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l)
      : gradient.color2;
    setGradient((g) => ({ ...g, color1: mainHex, color2: complement }));
  }, [mainHex]);

  const gradientCSS = generateGradientCSS(gradient);
  const shadowCSS = generateShadowCSS(shadow, mainHex);

  const { copied: gradientCopied, triggerCopy: copyGradient } = useCopyState();
  const { copied: shadowCopied, triggerCopy: copyShadow } = useCopyState();

  const gradientBgStyle =
    gradient.type === 'radial'
      ? { background: `radial-gradient(circle, ${gradient.color1}, ${gradient.color2})` }
      : { background: `linear-gradient(${gradient.direction}, ${gradient.color1}, ${gradient.color2})` };

  const selectDirection = (d: typeof GRADIENT_DIRECTIONS[number]) => {
    setGradient({
      ...gradient,
      type: d.type,
      direction: d.value,
    });
  };

  return (
    <div className="effects-panel">
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'gradient' ? 'active' : ''}`}
          onClick={() => setActiveTab('gradient')}
        >
          渐变生成器
        </button>
        <button
          className={`tab-btn ${activeTab === 'shadow' ? 'active' : ''}`}
          onClick={() => setActiveTab('shadow')}
        >
          阴影生成器
        </button>
      </div>

      {activeTab === 'gradient' && (
        <div className="tab-content">
          <div className="gradient-preview" style={gradientBgStyle} />

          <div className="effect-row">
            <label className="effect-label">渐变方向</label>
            <div className="direction-grid">
              {GRADIENT_DIRECTIONS.map((d) => (
                <button
                  key={d.value}
                  className={`direction-btn ${
                    gradient.direction === d.value ? 'active' : ''
                  }`}
                  onClick={() => selectDirection(d)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="effect-row two-col">
            <div className="color-picker-wrap">
              <label className="effect-label">颜色 1</label>
              <div className="color-picker-row">
                <input
                  type="color"
                  className="color-picker"
                  value={gradient.color1}
                  onChange={(e) =>
                    setGradient({ ...gradient, color1: e.target.value.toUpperCase() })
                  }
                />
                <span className="color-picker-hex">{gradient.color1}</span>
              </div>
            </div>
            <div className="color-picker-wrap">
              <label className="effect-label">颜色 2</label>
              <div className="color-picker-row">
                <input
                  type="color"
                  className="color-picker"
                  value={gradient.color2}
                  onChange={(e) =>
                    setGradient({ ...gradient, color2: e.target.value.toUpperCase() })
                  }
                />
                <span className="color-picker-hex">{gradient.color2}</span>
              </div>
            </div>
          </div>

          <div className="code-output">
            <code>{gradientCSS}</code>
            <button
              className={`copy-btn ${gradientCopied ? 'copied' : ''}`}
              onClick={() => copyGradient(gradientCSS)}
            >
              {gradientCopied ? '已复制' : '复制'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'shadow' && (
        <div className="tab-content">
          <div className="shadow-preview-wrapper">
            <div
              className="shadow-preview"
              style={{
                boxShadow: `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blurRadius}px rgba(0, 0, 0, ${shadow.opacity})`,
              }}
            />
          </div>

          <div className="effect-row">
            <label className="effect-label">偏移 X: {shadow.offsetX}px</label>
            <input
              type="range"
              className="effect-slider"
              min={-20}
              max={20}
              step={1}
              value={shadow.offsetX}
              onChange={(e) =>
                setShadow({ ...shadow, offsetX: Number(e.target.value) })
              }
            />
          </div>

          <div className="effect-row">
            <label className="effect-label">偏移 Y: {shadow.offsetY}px</label>
            <input
              type="range"
              className="effect-slider"
              min={-20}
              max={20}
              step={1}
              value={shadow.offsetY}
              onChange={(e) =>
                setShadow({ ...shadow, offsetY: Number(e.target.value) })
              }
            />
          </div>

          <div className="effect-row">
            <label className="effect-label">模糊半径: {shadow.blurRadius}px</label>
            <input
              type="range"
              className="effect-slider"
              min={0}
              max={40}
              step={1}
              value={shadow.blurRadius}
              onChange={(e) =>
                setShadow({ ...shadow, blurRadius: Number(e.target.value) })
              }
            />
          </div>

          <div className="effect-row">
            <label className="effect-label">透明度: {shadow.opacity.toFixed(1)}</label>
            <input
              type="range"
              className="effect-slider"
              min={0}
              max={1}
              step={0.1}
              value={shadow.opacity}
              onChange={(e) =>
                setShadow({ ...shadow, opacity: Number(e.target.value) })
              }
            />
          </div>

          <div className="code-output">
            <code>{shadowCSS}</code>
            <button
              className={`copy-btn ${shadowCopied ? 'copied' : ''}`}
              onClick={() => copyShadow(shadowCSS)}
            >
              {shadowCopied ? '已复制' : '复制'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

EffectsPanel.displayName = 'EffectsPanel';
export default EffectsPanel;
