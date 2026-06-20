import React, { useState, useRef, useEffect } from 'react';
import { CirclePicker, ColorResult } from 'react-color';
import type {
  MountStyle,
  MountParams,
  SetStyleCallback,
  SetParamsCallback,
  ToggleCompareStyleCallback,
  SetCompareModeCallback,
} from './types';
import { defaultMountParams, fabricTextureCount, styleLabels } from './types';

interface StyleSelectorProps {
  currentStyle: MountStyle;
  params: MountParams;
  isCompareMode: boolean;
  compareModes: MountStyle[];
  onSetStyle: SetStyleCallback;
  onSetParams: SetParamsCallback;
  onToggleCompareStyle: ToggleCompareStyleCallback;
  onSetCompareMode: SetCompareModeCallback;
}

const styleIcons: Record<MountStyle, string> = {
  scroll: '📜',
  frame: '🖼️',
  fan: '🪭',
};

const ribMaterials: Array<{
  value: 'bamboo' | 'wood' | 'copper';
  label: string;
  iconClass: string;
}> = [
  { value: 'bamboo', label: '竹制扇骨', iconClass: 'ribbon-bamboo' },
  { value: 'wood', label: '木制扇骨', iconClass: 'ribbon-wood' },
  { value: 'copper', label: '铜质扇骨', iconClass: 'ribbon-copper' },
];

const StyleSelector: React.FC<StyleSelectorProps> = ({
  currentStyle,
  params,
  isCompareMode,
  compareModes,
  onSetStyle,
  onSetParams,
  onToggleCompareStyle,
  onSetCompareMode,
}) => {
  const [accordionOpen, setAccordionOpen] = useState(true);
  const [axisPickerOpen, setAxisPickerOpen] = useState(false);
  const [framePickerOpen, setFramePickerOpen] = useState(false);
  const [matPickerOpen, setMatPickerOpen] = useState(false);
  const [fanBgPickerOpen, setFanBgPickerOpen] = useState(false);
  const [ribDropdownOpen, setRibDropdownOpen] = useState(false);

  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setAxisPickerOpen(false);
        setFramePickerOpen(false);
        setMatPickerOpen(false);
        setFanBgPickerOpen(false);
        setRibDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleScrollColor = (c: ColorResult) => {
    onSetParams('scroll', 'axisColor', c.hex);
  };

  const handleFrameColor = (c: ColorResult) => {
    onSetParams('frame', 'frameColor', c.hex);
  };

  const handleMatColor = (c: ColorResult) => {
    onSetParams('frame', 'matColor', c.hex);
  };

  const handleFanBgColor = (c: ColorResult) => {
    onSetParams('fan', 'fanBgColor', c.hex);
  };

  const mountStyles: MountStyle[] = ['scroll', 'frame', 'fan'];

  return (
    <div className="style-selector">
      <div
        className="accordion-header open"
        onClick={() => setAccordionOpen((o) => !o)}
      >
        <div className="panel-title" style={{ marginBottom: 0 }}>
          🎨 装裱样式与参数
        </div>
        <span className="accordion-arrow">▼</span>
      </div>

      <div className={`accordion-content ${accordionOpen ? 'open' : ''}`}>
        <div className="style-buttons" style={{ marginTop: 14 }}>
          {mountStyles.map((style) => (
            <button
              key={style}
              type="button"
              className={`style-btn ${currentStyle === style ? 'selected' : ''}`}
              onClick={() => onSetStyle(style)}
            >
              <div className="style-btn-icon">{styleIcons[style]}</div>
              <div className="style-btn-label">{styleLabels[style]}</div>
              <div className="style-btn-underline" />
            </button>
          ))}
        </div>

        <div className="params-card">
          {currentStyle === 'scroll' && (
            <>
              <div className="param-row">
                <div className="param-label">轴头颜色</div>
                <div className="color-picker-wrap" ref={pickerRef}>
                  <div
                    className="color-swatch"
                    style={{ background: params.scroll.axisColor }}
                    onClick={() =>
                      setAxisPickerOpen((o) => !o)
                    }
                  />
                  {axisPickerOpen && (
                    <>
                      <div
                        className="color-picker-cover"
                        onClick={() => setAxisPickerOpen(false)}
                      />
                      <div className="color-picker-popover">
                        <CirclePicker
                          color={params.scroll.axisColor}
                          onChange={handleScrollColor}
                          colors={[
                            '#4a3520',
                            '#8b4513',
                            '#000000',
                            '#c0392b',
                            '#2c3e50',
                            '#6b4423',
                            '#d4a574',
                            '#5d4037',
                            '#795548',
                            '#3e2723',
                            '#a0522d',
                            '#8b0000',
                          ]}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="param-row">
                <div className="param-label">绫布纹理</div>
                <div className="fabric-grid">
                  {Array.from({ length: fabricTextureCount }).map((_, i) => (
                    <div
                      key={i}
                      className={`fabric-card fabric-${i} ${
                        params.scroll.fabricTexture === i ? 'selected' : ''
                      }`}
                      onClick={() =>
                        onSetParams('scroll', 'fabricTexture', i)
                      }
                      title={`纹理 ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {currentStyle === 'frame' && (
            <>
              <div className="param-row">
                <div className="param-label">框条颜色</div>
                <div className="color-picker-wrap" ref={pickerRef}>
                  <div
                    className="color-swatch"
                    style={{ background: params.frame.frameColor }}
                    onClick={() => setFramePickerOpen((o) => !o)}
                  />
                  {framePickerOpen && (
                    <>
                      <div
                        className="color-picker-cover"
                        onClick={() => setFramePickerOpen(false)}
                      />
                      <div className="color-picker-popover">
                        <CirclePicker
                          color={params.frame.frameColor}
                          onChange={handleFrameColor}
                          colors={[
                            '#8b6914',
                            '#4a3520',
                            '#000000',
                            '#c0a060',
                            '#696969',
                            '#dcdcdc',
                            '#b8860b',
                            '#8b4513',
                            '#2c3e50',
                            '#f5f5f5',
                            '#cd853f',
                            '#800000',
                          ]}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="param-row">
                <div className="param-label">
                  框条宽度
                  <span className="slider-value">{params.frame.frameWidth}px</span>
                </div>
                <div className="slider-track">
                  <input
                    type="range"
                    className="custom-slider"
                    min={3}
                    max={20}
                    value={params.frame.frameWidth}
                    onChange={(e) =>
                      onSetParams(
                        'frame',
                        'frameWidth',
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
              </div>
              <div className="param-row">
                <div className="param-label">卡纸颜色</div>
                <div className="color-picker-wrap" ref={pickerRef}>
                  <div
                    className="color-swatch"
                    style={{ background: params.frame.matColor }}
                    onClick={() => setMatPickerOpen((o) => !o)}
                  />
                  {matPickerOpen && (
                    <>
                      <div
                        className="color-picker-cover"
                        onClick={() => setMatPickerOpen(false)}
                      />
                      <div className="color-picker-popover">
                        <CirclePicker
                          color={params.frame.matColor}
                          onChange={handleMatColor}
                          colors={[
                            '#ffffff',
                            '#fff8e7',
                            '#f0e68c',
                            '#fffacd',
                            '#f5deb3',
                            '#ffe4c4',
                            '#e6e6fa',
                            '#f0f8ff',
                            '#e0ffff',
                            '#f5f5dc',
                            '#faf0e6',
                            '#faebd7',
                          ]}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {currentStyle === 'fan' && (
            <>
              <div className="param-row">
                <div className="param-label">扇骨材质</div>
                <div className="dropdown-wrap" ref={pickerRef}>
                  <button
                    type="button"
                    className="dropdown-toggle"
                    onClick={() => setRibDropdownOpen((o) => !o)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        className={`ribbon-icon ribbon-${params.fan.ribMaterial}`}
                      />
                      {ribMaterials.find(
                        (m) => m.value === params.fan.ribMaterial
                      )?.label}
                    </span>
                    <span>{ribDropdownOpen ? '▲' : '▼'}</span>
                  </button>
                  {ribDropdownOpen && (
                    <div className="dropdown-menu">
                      {ribMaterials.map((m) => (
                        <div
                          key={m.value}
                          className={`dropdown-item ${
                            params.fan.ribMaterial === m.value ? 'selected' : ''
                          }`}
                          onClick={() => {
                            onSetParams('fan', 'ribMaterial', m.value);
                            setRibDropdownOpen(false);
                          }}
                        >
                          <span className={`ribbon-icon ${m.iconClass}`} />
                          {m.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="param-row">
                <div className="param-label">扇面底色</div>
                <div className="color-picker-wrap" ref={pickerRef}>
                  <div
                    className="color-swatch"
                    style={{ background: params.fan.fanBgColor }}
                    onClick={() => setFanBgPickerOpen((o) => !o)}
                  />
                  {fanBgPickerOpen && (
                    <>
                      <div
                        className="color-picker-cover"
                        onClick={() => setFanBgPickerOpen(false)}
                      />
                      <div className="color-picker-popover">
                        <CirclePicker
                          color={params.fan.fanBgColor}
                          onChange={handleFanBgColor}
                          colors={[
                            '#fff8e7',
                            '#fff5dc',
                            '#fef5ea',
                            '#fdf6e3',
                            '#fff2d7',
                            '#fae8cd',
                            '#ffe4b5',
                            '#fffaf0',
                            '#fffff0',
                            '#fffacd',
                            '#faebd7',
                            '#f5f5dc',
                          ]}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="compare-bar" style={{ marginTop: 18 }}>
          <button
            type="button"
            className={`compare-toggle ${isCompareMode ? 'enabled' : ''}`}
            onClick={() => onSetCompareMode(!isCompareMode)}
            disabled={compareModes.length < 2}
            title={compareModes.length < 2 ? '请至少选择2种样式' : ''}
          >
            {isCompareMode ? '✔' : '⚖'} 并排对比
          </button>
          <div className="compare-chips">
            {mountStyles.map((style) => (
              <button
                key={style}
                type="button"
                className={`compare-chip ${
                  compareModes.includes(style) ? 'selected' : ''
                }`}
                onClick={() => onToggleCompareStyle(style)}
              >
                {styleIcons[style]} {styleLabels[style]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleSelector;
