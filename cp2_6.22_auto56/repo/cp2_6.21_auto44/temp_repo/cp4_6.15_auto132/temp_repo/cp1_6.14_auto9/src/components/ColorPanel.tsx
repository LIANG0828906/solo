import { useState, useMemo, useCallback, useEffect } from 'react';
import { Check, Copy, Palette, Sliders, Eye, Code2 } from 'lucide-react';

interface ColorPanelProps {
  colors: string[];
  onColorsChange: (colors: string[]) => void;
  onSave: () => void;
}

type ExportFormat = 'css' | 'scss' | 'tailwind';

interface Pixel {
  r: number;
  g: number;
  b: number;
}

const hexToRgb = (hex: string): Pixel => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
};

const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToRgb = (h: number, s: number, l: number): Pixel => {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

const adjustColorHSL = (hex: string, hueDelta: number, satDelta: number): string => {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const newH = (hsl.h + hueDelta + 360) % 360;
  const newS = Math.max(0, Math.min(100, hsl.s + satDelta));
  const newRgb = hslToRgb(newH, newS, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
};

const getLuminance = (hex: string): number => {
  const rgb = hexToRgb(hex);
  return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
};

const getTextColor = (bgHex: string): string => {
  return getLuminance(bgHex) > 150 ? '#000000' : '#ffffff';
};

export default function ColorPanel({ colors, onColorsChange, onSave }: ColorPanelProps) {
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0);
  const [hueAdjustments, setHueAdjustments] = useState<number[]>([]);
  const [satAdjustments, setSatAdjustments] = useState<number[]>([]);
  const [copiedFormat, setCopiedFormat] = useState<ExportFormat | null>(null);
  const [copiedColorIndex, setCopiedColorIndex] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'adjust' | 'export'>('adjust');
  const [gradientIndex, setGradientIndex] = useState(0);

  useEffect(() => {
    setHueAdjustments(new Array(colors.length).fill(0));
    setSatAdjustments(new Array(colors.length).fill(0));
    setSelectedColorIndex(0);
  }, [colors]);

  useEffect(() => {
    if (colors.length < 2) return;
    const interval = setInterval(() => {
      setGradientIndex((prev) => (prev + 1) % Math.max(1, colors.length - 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [colors.length]);

  const adjustedColors = useMemo(() => {
    return colors.map((color, index) => {
      const h = hueAdjustments[index] || 0;
      const s = satAdjustments[index] || 0;
      if (h === 0 && s === 0) return color;
      return adjustColorHSL(color, h, s);
    });
  }, [colors, hueAdjustments, satAdjustments]);

  const handleHueChange = useCallback(
    (index: number, value: number) => {
      const newAdjustments = [...hueAdjustments];
      newAdjustments[index] = value;
      setHueAdjustments(newAdjustments);

      const newColors = [...adjustedColors];
      newColors[index] = adjustColorHSL(colors[index], value, satAdjustments[index] || 0);
      onColorsChange(newColors);
    },
    [hueAdjustments, satAdjustments, adjustedColors, colors, onColorsChange]
  );

  const handleSatChange = useCallback(
    (index: number, value: number) => {
      const newAdjustments = [...satAdjustments];
      newAdjustments[index] = value;
      setSatAdjustments(newAdjustments);

      const newColors = [...adjustedColors];
      newColors[index] = adjustColorHSL(colors[index], hueAdjustments[index] || 0, value);
      onColorsChange(newColors);
    },
    [satAdjustments, hueAdjustments, adjustedColors, colors, onColorsChange]
  );

  const handleColorInputChange = useCallback(
    (index: number, value: string) => {
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        const newColors = [...adjustedColors];
        newColors[index] = value;
        onColorsChange(newColors);
      }
    },
    [adjustedColors, onColorsChange]
  );

  const copyToClipboard = useCallback(async (text: string, format?: ExportFormat, colorIndex?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (format) {
        setCopiedFormat(format);
        setTimeout(() => setCopiedFormat(null), 2000);
      }
      if (typeof colorIndex === 'number') {
        setCopiedColorIndex(colorIndex);
        setTimeout(() => setCopiedColorIndex(null), 2000);
      }
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, []);

  const handleInputClick = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  }, []);

  const generateCSSVariables = useMemo(() => {
    if (adjustedColors.length === 0) return '';
    const lines = adjustedColors.map((color, i) => `  --color-${i + 1}: ${color};`);
    return `:root {\n${lines.join('\n')}\n}`;
  }, [adjustedColors]);

  const generateSCSSVariables = useMemo(() => {
    if (adjustedColors.length === 0) return '';
    return adjustedColors.map((color, i) => `$color-${i + 1}: ${color};`).join('\n');
  }, [adjustedColors]);

  const generateTailwindConfig = useMemo(() => {
    if (adjustedColors.length === 0) return '';
    const colorObj = adjustedColors.reduce((acc, color, i) => {
      acc[`color${i + 1}`] = color;
      return acc;
    }, {} as Record<string, string>);
    return `/** @type {import('tailwindcss').Config} */\nexport default {\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(colorObj, null, 8).replace(/"/g, "'")}\n    }\n  }\n}`;
  }, [adjustedColors]);

  const getExportCode = (format: ExportFormat): string => {
    switch (format) {
      case 'css':
        return generateCSSVariables;
      case 'scss':
        return generateSCSSVariables;
      case 'tailwind':
        return generateTailwindConfig;
    }
  };

  const gradientColors = useMemo(() => {
    if (adjustedColors.length < 2) return ['#ffffff', '#000000'];
    const idx = gradientIndex;
    return [adjustedColors[idx], adjustedColors[(idx + 1) % adjustedColors.length]];
  }, [adjustedColors, gradientIndex]);

  if (colors.length === 0) {
    return (
      <div className="w-full p-12 text-center rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200">
        <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">上传图片后，提取的色彩将在此处显示</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {adjustedColors.map((color, index) => (
          <div
            key={index}
            onClick={() => setSelectedColorIndex(index)}
            className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
              selectedColorIndex === index
                ? 'ring-2 ring-offset-2 ring-gray-800 scale-105'
                : 'hover:scale-105'
            }`}
            style={{
              backgroundColor: color,
              boxShadow:
                selectedColorIndex === index
                  ? `0 8px 32px ${color}66, 0 4px 16px rgba(0,0,0,0.1)`
                  : '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <div
              className="aspect-square flex items-end p-3 relative"
              style={{ minHeight: '120px' }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle at center, ${color}44 0%, transparent 70%)`,
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
              <div className="relative z-10 w-full">
                <input
                  type="text"
                  value={color}
                  onClick={(e) => {
                    handleInputClick(e);
                    copyToClipboard(color, undefined, index);
                  }}
                  onChange={(e) => handleColorInputChange(index, e.target.value)}
                  className="w-full bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1.5 text-xs font-mono text-center border-none outline-none cursor-pointer transition-all hover:bg-white"
                  style={{ color: getTextColor(color) === '#ffffff' ? '#333' : '#333' }}
                  readOnly={false}
                />
                {copiedColorIndex === index && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('adjust')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'adjust'
                ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sliders className="w-4 h-4" />
            色彩微调
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Code2 className="w-4 h-4" />
            导出代码
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
              showPreview
                ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            预览示例
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'adjust' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-xl shadow-md"
                  style={{ backgroundColor: adjustedColors[selectedColorIndex] }}
                />
                <div>
                  <p className="text-sm text-gray-500">当前选中色彩</p>
                  <p className="text-lg font-mono font-semibold text-gray-900">
                    {adjustedColors[selectedColorIndex].toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">色相 (Hue)</label>
                    <span className="text-sm text-gray-500 font-mono">
                      {hueAdjustments[selectedColorIndex] || 0}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={hueAdjustments[selectedColorIndex] || 0}
                    onChange={(e) => handleHueChange(selectedColorIndex, parseInt(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background:
                        'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                    }}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">饱和度 (Saturation)</label>
                    <span className="text-sm text-gray-500 font-mono">
                      {satAdjustments[selectedColorIndex] || 0}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={satAdjustments[selectedColorIndex] || 0}
                    onChange={(e) => handleSatChange(selectedColorIndex, parseInt(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-200"
                  />
                </div>
              </div>

              <button
                onClick={onSave}
                className="w-full mt-6 bg-gray-900 text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <Palette className="w-4 h-4" />
                保存配色方案
              </button>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              {(['css', 'scss', 'tailwind'] as ExportFormat[]).map((format) => (
                <div key={format} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 uppercase">{format}</span>
                    <button
                      onClick={() => copyToClipboard(getExportCode(format), format)}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
                    >
                      {copiedFormat === format ? (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-green-500">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>复制</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-gray-50 rounded-xl p-4 text-sm font-mono text-gray-700 overflow-x-auto max-h-40 overflow-y-auto">
                    <code>{getExportCode(format)}</code>
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPreview && (
        <div
          className="rounded-2xl overflow-hidden shadow-lg transition-all duration-1000"
          style={{
            background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
          }}
        >
          <div className="p-8 md:p-12 min-h-[400px] flex items-center justify-center">
            <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl"
                  style={{ backgroundColor: adjustedColors[0] || '#333' }}
                />
                <div>
                  <h3 className="font-semibold text-gray-900">配色方案预览</h3>
                  <p className="text-sm text-gray-500">{adjustedColors.length} 种色彩</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                这是使用当前配色方案生成的卡片示例。渐变色背景会自动在色彩之间平滑切换。
              </p>

              <div className="flex gap-2 flex-wrap">
                {adjustedColors.map((color, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-lg shadow-md transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  className="flex-1 py-2.5 px-4 rounded-xl text-white font-medium transition-opacity hover:opacity-90"
                  style={{ backgroundColor: adjustedColors[0] || '#333' }}
                >
                  主要按钮
                </button>
                <button
                  className="flex-1 py-2.5 px-4 rounded-xl font-medium transition-colors border-2"
                  style={{
                    borderColor: adjustedColors[1] || '#666',
                    color: adjustedColors[1] || '#666',
                  }}
                >
                  次要按钮
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid #e5e7eb;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transition: transform 0.15s ease;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        input[type='range']::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid #e5e7eb;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
