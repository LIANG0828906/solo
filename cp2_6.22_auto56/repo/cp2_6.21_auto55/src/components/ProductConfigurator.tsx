import React from 'react';
import { useColorStore } from '../store/colorStore';
import {
  PART_LABELS,
  ProductPart,
  PRESET_COLORS,
  hexToHsl,
  hslToHex,
  PRODUCT_LABELS,
  ProductType
} from '../utils/colorUtils';
import ProductRenderer from './ProductRenderer';

interface HSLSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
  gradientColors?: string[];
}

const HSLSlider: React.FC<HSLSliderProps> = ({
  label,
  value,
  min,
  max,
  unit = '',
  onChange,
  gradientColors
}) => {
  const gradientStyle = gradientColors
    ? {
        background: `linear-gradient(to right, ${gradientColors.join(', ')})`
      }
    : {};

  return (
    <div className="hsl-slider">
      <div className="hsl-slider-header">
        <span className="hsl-slider-label">{label}</span>
        <span className="hsl-slider-value">
          {value}
          {unit}
        </span>
      </div>
      <div className="hsl-slider-track-wrapper">
        <div className="hsl-slider-track" style={gradientStyle}>
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="hsl-slider-input"
          />
        </div>
      </div>
    </div>
  );
};

interface ColorControlCardProps {
  part: ProductPart;
  isSelected: boolean;
  onSelect: () => void;
}

const ColorControlCard: React.FC<ColorControlCardProps> = ({
  part,
  isSelected,
  onSelect
}) => {
  const { activeScheme } = useColorStore();
  const schemeKey = activeScheme === 'A' ? 'schemeA' : 'schemeB';
  const color = useColorStore((state) => state[schemeKey][part]);
  const updateColor = useColorStore((state) => state.updateColor);
  const updateHue = useColorStore((state) => state.updateHue);
  const updateSaturation = useColorStore((state) => state.updateSaturation);
  const updateLightness = useColorStore((state) => state.updateLightness);

  const hsl = hexToHsl(color);

  const hueGradient = [
    '#ff0000',
    '#ffff00',
    '#00ff00',
    '#00ffff',
    '#0000ff',
    '#ff00ff',
    '#ff0000'
  ];

  const saturationGradient = [
    hslToHex(hsl.h, 0, hsl.l),
    hslToHex(hsl.h, 100, hsl.l)
  ];

  const lightnessGradient = [
    hslToHex(hsl.h, hsl.s, 0),
    hslToHex(hsl.h, hsl.s, 50),
    hslToHex(hsl.h, hsl.s, 100)
  ];

  return (
    <div
      className={`color-control-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="color-control-header">
        <div className="color-preview-wrapper">
          <div
            className="color-preview"
            style={{ backgroundColor: color }}
          />
          <span className="color-part-label">{PART_LABELS[part]}</span>
        </div>
        <span className="color-hex">{color.toUpperCase()}</span>
      </div>

      {isSelected && (
        <div className="color-controls-expanded" onClick={(e) => e.stopPropagation()}>
          <div className="color-palette">
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                className={`color-swatch ${color.toLowerCase() === presetColor.toLowerCase() ? 'active' : ''}`}
                style={{ backgroundColor: presetColor }}
                onClick={() => updateColor(part, presetColor)}
                title={presetColor}
              />
            ))}
          </div>

          <div className="hsl-sliders">
            <HSLSlider
              label="色相"
              value={hsl.h}
              min={0}
              max={360}
              unit="°"
              onChange={(val) => updateHue(part, val)}
              gradientColors={hueGradient}
            />
            <HSLSlider
              label="饱和度"
              value={hsl.s}
              min={0}
              max={100}
              unit="%"
              onChange={(val) => updateSaturation(part, val)}
              gradientColors={saturationGradient}
            />
            <HSLSlider
              label="明度"
              value={hsl.l}
              min={0}
              max={100}
              unit="%"
              onChange={(val) => updateLightness(part, val)}
              gradientColors={lightnessGradient}
            />
          </div>

          <div className="color-input-wrapper">
            <label className="color-input-label">HEX</label>
            <input
              type="text"
              className="color-hex-input"
              value={color}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    updateColor(part, val);
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const ProductConfigurator: React.FC = () => {
  const productType = useColorStore((state) => state.productType);
  const activeScheme = useColorStore((state) => state.activeScheme);
  const selectedPart = useColorStore((state) => state.selectedPart);
  const schemeA = useColorStore((state) => state.schemeA);
  const schemeB = useColorStore((state) => state.schemeB);
  const setProductType = useColorStore((state) => state.setProductType);
  const setActiveScheme = useColorStore((state) => state.setActiveScheme);
  const setSelectedPart = useColorStore((state) => state.setSelectedPart);
  const isDrawerOpen = useColorStore((state) => state.isDrawerOpen);
  const setDrawerOpen = useColorStore((state) => state.setDrawerOpen);

  const currentScheme = activeScheme === 'A' ? schemeA : schemeB;
  const parts: ProductPart[] = ['body', 'trim', 'lining', 'stitching'];

  return (
    <div className="product-configurator">
      <div className="configurator-header">
        <h2 className="configurator-title">颜色配置</h2>
        <button
          className="drawer-toggle mobile-only"
          onClick={() => setDrawerOpen(!isDrawerOpen)}
        >
          {isDrawerOpen ? '收起面板' : '展开面板'}
        </button>
      </div>

      <div className={`configurator-content ${isDrawerOpen ? 'open' : ''}`}>
        <div className="product-selector">
          <label className="section-label">选择产品</label>
          <div className="product-tabs">
            {(['shoe', 'headphone', 'backpack'] as ProductType[]).map((type) => (
              <button
                key={type}
                className={`product-tab ${productType === type ? 'active' : ''}`}
                onClick={() => setProductType(type)}
              >
                {PRODUCT_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        <div className="scheme-selector">
          <label className="section-label">当前编辑方案</label>
          <div className="scheme-tabs">
            <button
              className={`scheme-tab scheme-a ${activeScheme === 'A' ? 'active' : ''}`}
              onClick={() => setActiveScheme('A')}
            >
              方案 A
            </button>
            <button
              className={`scheme-tab scheme-b ${activeScheme === 'B' ? 'active' : ''}`}
              onClick={() => setActiveScheme('B')}
            >
              方案 B
            </button>
          </div>
        </div>

        <div className="mini-preview">
          <div className="mini-preview-label">当前方案预览</div>
          <div className="mini-preview-svg">
            <ProductRenderer
              colorConfig={currentScheme}
              productType={productType}
            />
          </div>
        </div>

        <div className="color-controls-section">
          <label className="section-label">部件颜色</label>
          <div className="color-cards-grid">
            {parts.map((part) => (
              <ColorControlCard
                key={part}
                part={part}
                isSelected={selectedPart === part}
                onSelect={() => setSelectedPart(part)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductConfigurator;
