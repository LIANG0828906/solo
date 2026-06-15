import { useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { X, Check, ChevronDown } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import type { TextElement, ImageElement, CanvasElement, ColorTheme } from '@/types';

const FONT_FAMILIES = [
  'Playfair Display',
  'Space Grotesk',
  'Georgia',
  'Arial',
  'SimHei',
];

const FONT_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

const COLOR_KEYS: Array<'primary' | 'secondary' | 'background' | 'custom'> = [
  'primary',
  'secondary',
  'background',
  'custom',
];

export default function PropertyPanel() {
  const {
    selectedId,
    elements,
    getCurrentTheme,
    updateElement,
    updateSelectedTextContent,
    setActivePanel,
  } = useEditorStore();

  const theme = getCurrentTheme();
  const selected = elements.find((e) => e.id === selectedId) as
    | TextElement
    | ImageElement
    | undefined;

  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [fontFamilyOpen, setFontFamilyOpen] = useState(false);

  const handleUpdate = (patch: Partial<CanvasElement>) => {
    if (!selectedId) return;
    updateElement(selectedId, patch);
  };

  const renderSlider = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (v: number) => void,
    unit: string = ''
  ) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-800 font-semibold tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer
          bg-white/40 backdrop-blur-sm
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-gradient-to-br
          [&::-webkit-slider-thumb]:from-indigo-400
          [&::-webkit-slider-thumb]:to-purple-500
          [&::-webkit-slider-thumb]:shadow-lg
          [&::-webkit-slider-thumb]:shadow-indigo-300/50
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-110"
      />
    </div>
  );

  const renderNumberInput = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    suffix?: string,
    min?: number,
    max?: number
  ) => (
    <div className="space-y-1.5">
      <label className="text-xs text-slate-600 font-medium">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-9 px-3 pr-8 text-sm rounded-lg
            bg-white/50 backdrop-blur-sm
            border border-white/60
            focus:border-indigo-400/80 focus:ring-2 focus:ring-indigo-300/40
            outline-none transition-all tabular-nums"
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );

  const renderTripleToggle = <T extends string>(
    label: string,
    value: T,
    options: T[],
    labels: string[],
    onChange: (v: T) => void
  ) => (
    <div className="space-y-1.5">
      <label className="text-xs text-slate-600 font-medium">{label}</label>
      <div
        className="flex p-0.5 rounded-lg
          bg-white/40 backdrop-blur-sm
          border border-white/60"
      >
        {options.map((opt, idx) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`flex-1 h-8 text-xs font-medium rounded-md transition-all duration-200 ${
              value === opt
                ? 'bg-gradient-to-br from-indigo-400 to-purple-500 text-white shadow-md shadow-indigo-200/50'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            {labels[idx]}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="fixed right-0 top-0 h-full w-80 z-50
        bg-white/60 backdrop-blur-xl
        border-l border-white/70
        shadow-2xl shadow-slate-300/40
        flex flex-col animate-[slideInRight_0.3s_ease-out]"
      style={{ animation: 'slideInRight 0.3s ease-out' }}
    >
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <div
        className="flex items-center justify-between px-5 py-4
          border-b border-white/70
          bg-gradient-to-r from-white/70 to-indigo-50/50 backdrop-blur-md"
      >
        <h2 className="text-base font-bold text-slate-800 tracking-wide">
          属性面板
        </h2>
        <button
          onClick={() => setActivePanel(null)}
          className="w-8 h-8 flex items-center justify-center rounded-lg
            text-slate-500 hover:text-slate-800
            hover:bg-white/80 transition-all duration-200"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-thin">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full py-24 space-y-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center
                bg-gradient-to-br from-indigo-100/80 to-purple-100/80
                border border-white/70"
            >
              <svg
                className="w-9 h-9 text-indigo-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </div>
            <div className="text-center space-y-1.5">
              <p className="text-sm font-semibold text-slate-700">
                请选择一个元素
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                点击画布上的文字或图片
                <br />
                即可在此编辑属性
              </p>
            </div>
          </div>
        ) : selected.type === 'text' ? (
          <TextPropertyEditor
            element={selected}
            theme={theme}
            handleUpdate={handleUpdate}
            updateSelectedTextContent={updateSelectedTextContent}
            colorPickerOpen={colorPickerOpen}
            setColorPickerOpen={setColorPickerOpen}
            fontFamilyOpen={fontFamilyOpen}
            setFontFamilyOpen={setFontFamilyOpen}
            renderSlider={renderSlider}
            renderNumberInput={renderNumberInput}
            renderTripleToggle={renderTripleToggle}
          />
        ) : (
          <ImagePropertyEditor
            element={selected}
            handleUpdate={handleUpdate}
            renderSlider={renderSlider}
            renderNumberInput={renderNumberInput}
            renderTripleToggle={renderTripleToggle}
          />
        )}
      </div>
    </div>
  );
}

interface TextEditorProps {
  element: TextElement;
  theme: ColorTheme;
  handleUpdate: (patch: Partial<CanvasElement>) => void;
  updateSelectedTextContent: (content: string) => void;
  colorPickerOpen: boolean;
  setColorPickerOpen: (v: boolean) => void;
  fontFamilyOpen: boolean;
  setFontFamilyOpen: (v: boolean) => void;
  renderSlider: (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (v: number) => void,
    unit?: string
  ) => JSX.Element;
  renderNumberInput: (
    label: string,
    value: number,
    onChange: (v: number) => void,
    suffix?: string,
    min?: number,
    max?: number
  ) => JSX.Element;
  renderTripleToggle: <T extends string>(
    label: string,
    value: T,
    options: T[],
    labels: string[],
    onChange: (v: T) => void
  ) => JSX.Element;
}

function TextPropertyEditor({
  element,
  theme,
  handleUpdate,
  updateSelectedTextContent,
  colorPickerOpen,
  setColorPickerOpen,
  fontFamilyOpen,
  setFontFamilyOpen,
  renderSlider,
  renderNumberInput,
  renderTripleToggle,
}: TextEditorProps) {
  const resolveColor = (key: typeof element.colorKey, custom?: string) => {
    if (key === 'custom') return custom || '#000000';
    return theme.colors[key];
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs text-slate-600 font-medium">文字内容</label>
        <textarea
          value={element.content}
          onChange={(e) => updateSelectedTextContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2.5 text-sm rounded-xl
            bg-white/50 backdrop-blur-sm
            border border-white/60
            focus:border-indigo-400/80 focus:ring-2 focus:ring-indigo-300/40
            outline-none transition-all resize-none
            font-medium"
          style={{
            fontFamily: element.fontFamily,
            color: resolveColor(element.colorKey, element.customColor),
          }}
        />
      </div>

      {renderNumberInput('字号', element.fontSize, (v) => handleUpdate({ fontSize: v }), 'px', 1)}

      <div className="space-y-1.5 relative">
        <label className="text-xs text-slate-600 font-medium">字体</label>
        <button
          onClick={() => setFontFamilyOpen(!fontFamilyOpen)}
          className="w-full h-9 px-3 flex items-center justify-between rounded-lg
            bg-white/50 backdrop-blur-sm
            border border-white/60
            hover:border-indigo-400/60
            transition-all duration-200"
        >
          <span
            className="text-sm font-medium text-slate-800"
            style={{ fontFamily: element.fontFamily }}
          >
            {element.fontFamily}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
              fontFamilyOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        {fontFamilyOpen && (
          <div
            className="absolute top-full left-0 right-0 mt-1.5 z-20
              bg-white/95 backdrop-blur-xl
              border border-white/80 rounded-xl shadow-xl
              overflow-hidden animate-[fadeIn_0.15s_ease-out]"
          >
            {FONT_FAMILIES.map((ff) => (
              <button
                key={ff}
                onClick={() => {
                  handleUpdate({ fontFamily: ff });
                  setFontFamilyOpen(false);
                }}
                className={`w-full px-4 h-10 flex items-center justify-between
                  transition-colors duration-150 text-sm
                  ${
                    element.fontFamily === ff
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <span style={{ fontFamily: ff }} className="font-medium">
                  {ff}
                </span>
                {element.fontFamily === ff && (
                  <Check className="w-4 h-4 text-indigo-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5 relative">
        <label className="text-xs text-slate-600 font-medium">字重</label>
        <select
          value={element.fontWeight}
          onChange={(e) => handleUpdate({ fontWeight: Number(e.target.value) })}
          className="w-full h-9 px-3 text-sm rounded-lg
            bg-white/50 backdrop-blur-sm
            border border-white/60
            focus:border-indigo-400/80 focus:ring-2 focus:ring-indigo-300/40
            outline-none transition-all appearance-none cursor-pointer
            pr-8 font-medium text-slate-800"
        >
          {FONT_WEIGHTS.map((w) => (
            <option key={w} value={w} style={{ fontWeight: w }}>
              {w}
              {w === 400 ? ' (常规)' : w === 700 ? ' (粗体)' : ''}
            </option>
          ))}
        </select>
      </div>

      {renderSlider('行高', element.lineHeight, 0.8, 3, 0.05, (v) =>
        handleUpdate({ lineHeight: v })
      )}

      {renderSlider('字间距', element.letterSpacing, -5, 20, 0.5, (v) =>
        handleUpdate({ letterSpacing: v })
      , 'px')}

      {renderTripleToggle<'left' | 'center' | 'right'>(
        '对齐方式',
        element.textAlign,
        ['left', 'center', 'right'],
        ['左', '中', '右'],
        (v) => handleUpdate({ textAlign: v })
      )}

      <div className="space-y-1.5">
        <label className="text-xs text-slate-600 font-medium">颜色</label>
        <div className="grid grid-cols-4 gap-1.5 p-1.5 rounded-xl bg-white/40 backdrop-blur-sm border border-white/60">
          {COLOR_KEYS.map((key) => {
            const isActive = element.colorKey === key;
            const colorValue =
              key === 'custom'
                ? element.customColor || '#888888'
                : theme.colors[key];
            const labelMap = {
              primary: '主色',
              secondary: '辅色',
              background: '背景',
              custom: '自定义',
            };
            return (
              <button
                key={key}
                onClick={() => {
                  if (key === 'custom') {
                    setColorPickerOpen(!colorPickerOpen);
                  } else {
                    handleUpdate({ colorKey: key });
                    setColorPickerOpen(false);
                  }
                }}
                className={`relative flex flex-col items-center gap-1 py-2 rounded-lg
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-gradient-to-br from-indigo-50 to-purple-50 ring-2 ring-indigo-300/70 shadow-sm'
                      : 'hover:bg-white/60'
                  }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    isActive ? 'scale-110 border-white shadow-md' : 'border-white/60'
                  }`}
                  style={{ backgroundColor: colorValue }}
                />
                <span className="text-[10px] font-medium text-slate-600">
                  {labelMap[key]}
                </span>
                {isActive && (
                  <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm">
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {colorPickerOpen && element.colorKey === 'custom' && (
          <div
            className="relative mt-3 p-3 rounded-xl
              bg-white/80 backdrop-blur-xl
              border border-white/80 shadow-xl
              animate-[fadeIn_0.2s_ease-out]"
          >
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-4px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            <HexColorPicker
              color={element.customColor || '#667eea'}
              onChange={(c) =>
                handleUpdate({ customColor: c, colorKey: 'custom' })
              }
              style={{ width: '100%' }}
            />
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-mono">
                HEX
              </span>
              <input
                type="text"
                value={element.customColor || '#667eea'}
                onChange={(e) =>
                  handleUpdate({ customColor: e.target.value, colorKey: 'custom' })
                }
                className="flex-1 h-7 px-2 text-xs rounded-md
                  bg-white/70 border border-white/80
                  focus:border-indigo-400 outline-none font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {renderSlider('透明度', element.opacity, 0, 1, 0.01, (v) =>
        handleUpdate({ opacity: v })
      )}

      {renderSlider('旋转', element.rotation, -45, 45, 1, (v) =>
        handleUpdate({ rotation: v })
      , '°')}

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />

      <div className="space-y-3">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          位置与尺寸
        </p>
        <div className="grid grid-cols-2 gap-3">
          {renderNumberInput('X 坐标', element.x, (v) => handleUpdate({ x: v }), 'px')}
          {renderNumberInput('Y 坐标', element.y, (v) => handleUpdate({ y: v }), 'px')}
          {renderNumberInput('宽度', element.width, (v) => handleUpdate({ width: v }), 'px', 1)}
          {renderNumberInput('高度', element.height, (v) => handleUpdate({ height: v }), 'px', 1)}
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          * 坐标与尺寸单位为画布实际像素
        </p>
      </div>
    </div>
  );
}

interface ImageEditorProps {
  element: ImageElement;
  handleUpdate: (patch: Partial<CanvasElement>) => void;
  renderSlider: (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (v: number) => void,
    unit?: string
  ) => JSX.Element;
  renderNumberInput: (
    label: string,
    value: number,
    onChange: (v: number) => void,
    suffix?: string,
    min?: number,
    max?: number
  ) => JSX.Element;
  renderTripleToggle: <T extends string>(
    label: string,
    value: T,
    options: T[],
    labels: string[],
    onChange: (v: T) => void
  ) => JSX.Element;
}

function ImagePropertyEditor({
  element,
  handleUpdate,
  renderSlider,
  renderNumberInput,
  renderTripleToggle,
}: ImageEditorProps) {
  return (
    <div className="space-y-5">
      <div className="p-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/60">
        <img
          src={element.src}
          alt="preview"
          className="w-full h-32 rounded-lg object-cover shadow-inner"
          style={{ objectFit: element.objectFit }}
        />
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          尺寸
        </p>
        <div className="grid grid-cols-2 gap-3">
          {renderNumberInput('宽度', element.width, (v) => handleUpdate({ width: v }), 'px', 1)}
          {renderNumberInput('高度', element.height, (v) => handleUpdate({ height: v }), 'px', 1)}
        </div>
      </div>

      {renderTripleToggle<'cover' | 'contain' | 'fill'>(
        '填充方式',
        element.objectFit,
        ['cover', 'contain', 'fill'],
        ['覆盖', '包含', '填充'],
        (v) => handleUpdate({ objectFit: v })
      )}

      {renderSlider('圆角', element.borderRadius, 0, 50, 1, (v) =>
        handleUpdate({ borderRadius: v })
      , 'px')}

      {renderSlider('透明度', element.opacity, 0, 1, 0.01, (v) =>
        handleUpdate({ opacity: v })
      )}

      {renderSlider('旋转', element.rotation, -45, 45, 1, (v) =>
        handleUpdate({ rotation: v })
      , '°')}

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />

      <div className="space-y-3">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          位置
        </p>
        <div className="grid grid-cols-2 gap-3">
          {renderNumberInput('X 坐标', element.x, (v) => handleUpdate({ x: v }), 'px')}
          {renderNumberInput('Y 坐标', element.y, (v) => handleUpdate({ y: v }), 'px')}
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          * 坐标与尺寸单位为画布实际像素
        </p>
      </div>
    </div>
  );
}
