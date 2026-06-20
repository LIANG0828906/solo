import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fontLoader, FontItem } from './fontLoader';
import {
  renderTextToCanvas,
  GradientStop,
  ShadowSettings,
  StrokeSettings,
  GradientDirection,
  TextureType,
  TextureSettings,
  getDefaultGradientStops,
} from './textRenderer';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;

interface ToastState {
  visible: boolean;
  message: string;
}

const App: React.FC = () => {
  const [fonts, setFonts] = useState<FontItem[]>([]);
  const [selectedFont, setSelectedFont] = useState<FontItem | null>(null);
  const [text, setText] = useState('Typography\nStudio');
  const [fontSize, setFontSize] = useState(72);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [skew, setSkew] = useState(0);
  const [gradientStops, setGradientStops] = useState<GradientStop[]>(getDefaultGradientStops());
  const [gradientDirection, setGradientDirection] = useState<GradientDirection>('horizontal');
  const [useGradient, setUseGradient] = useState(false);
  const [fillColor, setFillColor] = useState('#333333');
  const [shadow, setShadow] = useState<ShadowSettings>({
    offsetX: 4,
    offsetY: 4,
    blur: 8,
    color: 'rgba(0, 0, 0, 0.5)',
  });
  const [stroke, setStroke] = useState<StrokeSettings>({
    width: 0,
    color: '#000000',
  });
  const [texture, setTexture] = useState<TextureSettings>({
    type: 'none',
    opacity: 0.5,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '' });
  const [isMobile, setIsMobile] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [activeSlider, setActiveSlider] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderFrameRef = useRef<number>(0);
  const renderOptionsRef = useRef<any>(null);

  useEffect(() => {
    const availableFonts = fontLoader.getFonts();
    setFonts(availableFonts);
    setSelectedFont(availableFonts[0]);
    fontLoader.loadAllFonts();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 960;
      setIsMobile(mobile);
      if (mobile) {
        setPanelCollapsed(true);
      } else {
        setPanelCollapsed(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => {
      setToast({ visible: false, message: '' });
    }, 2000);
  }, []);

  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !selectedFont) return;

    renderOptionsRef.current = {
      text,
      font: selectedFont,
      fontSize,
      textAlign,
      rotation,
      scale,
      skew,
      gradientStops,
      gradientDirection,
      useGradient,
      shadow,
      stroke,
      texture,
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
      fillColor,
    };

    if (renderFrameRef.current) {
      cancelAnimationFrame(renderFrameRef.current);
    }

    renderFrameRef.current = requestAnimationFrame(() => {
      if (!canvasRef.current || !renderOptionsRef.current) return;

      const canvas = renderTextToCanvas(renderOptionsRef.current);
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(canvas, 0, 0);
      }
    });
  }, [text, selectedFont, fontSize, textAlign, rotation, scale, skew, gradientStops, gradientDirection, useGradient, shadow, stroke, texture, fillColor]);

  useEffect(() => {
    renderCanvas();
    return () => {
      if (renderFrameRef.current) {
        cancelAnimationFrame(renderFrameRef.current);
      }
    };
  }, [renderCanvas]);

  const handleFontChange = (fontName: string) => {
    const font = fonts.find((f) => f.name === fontName);
    if (font) {
      fontLoader.loadFont(font).then(() => {
        setSelectedFont(font);
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    const validExtensions = ['.woff', '.woff2', '.ttf'];
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(extension)) {
      showToast('请上传 .woff, .woff2 或 .ttf 格式的字体文件');
      return;
    }

    try {
      const newFont = await fontLoader.addCustomFont(file);
      setFonts(fontLoader.getFonts());
      setSelectedFont(newFont);
      showToast(`字体 "${newFont.name}" 已添加`);
    } catch (error) {
      showToast('字体加载失败');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addGradientStop = () => {
    if (gradientStops.length >= 10) return;
    const newStop: GradientStop = {
      color: '#ffffff',
      position: 0.5,
    };
    setGradientStops([...gradientStops, newStop].sort((a, b) => a.position - b.position));
  };

  const removeGradientStop = (index: number) => {
    if (gradientStops.length <= 2) return;
    setGradientStops(gradientStops.filter((_, i) => i !== index));
  };

  const updateGradientStop = (index: number, updates: Partial<GradientStop>) => {
    setGradientStops(
      gradientStops.map((stop, i) =>
        i === index ? { ...stop, ...updates } : stop
      ).sort((a, b) => a.position - b.position)
    );
  };

  const exportToPng = async () => {
    if (!canvasContainerRef.current) return;

    try {
      const dataUrl = await toPng(canvasContainerRef.current, {
        quality: 1,
        pixelRatio: 3,
      });

      saveAs(dataUrl, 'typography-effect.png');
      showToast('PNG图片已导出');
    } catch (error) {
      showToast('导出失败，请重试');
      console.error('Export error:', error);
    }
  };

  const exportToCss = () => {
    const gradientCss = useGradient
      ? `  background: linear-gradient(${
          gradientDirection === 'horizontal'
            ? 'to right'
            : gradientDirection === 'vertical'
            ? 'to bottom'
            : 'to bottom right'
        }, ${gradientStops.map((s) => `${s.color} ${Math.round(s.position * 100)}%`).join(', ')});\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n  background-clip: text;`
      : `  color: ${fillColor};`;

    const shadowCss =
      shadow.blur > 0 || shadow.offsetX !== 0 || shadow.offsetY !== 0
        ? `  text-shadow: ${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color};`
        : '';

    const strokeCss =
      stroke.width > 0
        ? `  -webkit-text-stroke: ${stroke.width}px ${stroke.color};`
        : '';

    const transformCss = `  transform: rotate(${rotation}deg) scale(${scale}) skewX(${skew}deg);`;

    const cssCode = `.typography-effect {
  font-family: ${selectedFont?.family || 'sans-serif'};
  font-size: ${fontSize}px;
  text-align: ${textAlign};
${gradientCss}
${shadowCss}
${strokeCss}
${transformCss}
  display: inline-block;
}`;

    navigator.clipboard
      .writeText(cssCode)
      .then(() => {
        showToast('CSS代码已复制到剪贴板');
      })
      .catch(() => {
        showToast('复制失败，请手动复制');
      });
  };

  const textureOptions: { type: TextureType; label: string }[] = [
    { type: 'none', label: '无' },
    { type: 'paper', label: '纸纹' },
    { type: 'wood', label: '木纹' },
    { type: 'metal', label: '金属' },
    { type: 'water', label: '水波' },
    { type: 'fire', label: '火焰' },
  ];

  const SliderControl = ({
    label,
    value,
    min,
    max,
    step,
    unit = '',
    onChange,
    name,
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
    onChange: (value: number) => void;
    name: string;
  }) => (
    <div className="control-group">
      <div className="control-label">
        <span>{label}</span>
        <span className={`value-display ${activeSlider === name ? 'active' : ''}`}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onMouseDown={() => setActiveSlider(name)}
        onMouseUp={() => setActiveSlider(null)}
        onTouchStart={() => setActiveSlider(name)}
        onTouchEnd={() => setActiveSlider(null)}
        className="slider"
      />
    </div>
  );

  return (
    <div className="app-container">
      {isMobile && (
        <div className="mobile-header">
          <button
            className="toggle-panel-btn"
            onClick={() => setPanelCollapsed(!panelCollapsed)}
          >
            {panelCollapsed ? '☰ 控制面板' : '✕ 收起'}
          </button>
          <h1 className="app-title-mobile">字体特效生成器</h1>
        </div>
      )}

      <div className={`control-panel ${panelCollapsed ? 'collapsed' : ''}`}>
        {!isMobile && (
          <div className="panel-header">
            <h1 className="app-title">字体特效生成器</h1>
          </div>
        )}

        <div className="panel-content">
          <div className="section">
            <h2 className="section-title">字体</h2>
            <select
              className="font-select"
              value={selectedFont?.name || ''}
              onChange={(e) => handleFontChange(e.target.value)}
            >
              {fonts.map((font) => (
                <option key={font.name} value={font.name}>
                  {font.name}
                  {font.isCustom ? ' (自定义)' : ''}
                </option>
              ))}
            </select>

            <div
              className={`drop-zone ${isDragging ? 'dragging' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <p className="drop-text">拖拽字体文件到此处</p>
              <p className="drop-subtext">或点击上传</p>
              <p className="drop-hint">支持 .woff, .woff2, .ttf</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".woff,.woff2,.ttf"
                className="file-input"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className="section">
            <h2 className="section-title">文字</h2>
            <textarea
              className="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="输入文字..."
            />

            <SliderControl
              label="字号"
              value={fontSize}
              min={12}
              max={200}
              step={1}
              unit="px"
              onChange={setFontSize}
              name="fontSize"
            />

            <div className="control-group">
              <div className="control-label">
                <span>对齐方式</span>
              </div>
              <div className="align-buttons">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    className={`align-btn ${textAlign === align ? 'active' : ''}`}
                    onClick={() => setTextAlign(align)}
                  >
                    {align === 'left' ? '左' : align === 'center' ? '中' : '右'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="section">
            <h2 className="section-title">变换</h2>
            <SliderControl
              label="旋转"
              value={rotation}
              min={0}
              max={360}
              step={1}
              unit="°"
              onChange={setRotation}
              name="rotation"
            />
            <SliderControl
              label="缩放"
              value={scale}
              min={0.5}
              max={3}
              step={0.1}
              unit="x"
              onChange={setScale}
              name="scale"
            />
            <SliderControl
              label="倾斜"
              value={skew}
              min={-45}
              max={45}
              step={1}
              unit="°"
              onChange={setSkew}
              name="skew"
            />
          </div>

          <div className="section">
            <h2 className="section-title">填充</h2>
            <div className="control-group">
              <div className="control-label">
                <span>使用渐变</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={useGradient}
                    onChange={(e) => setUseGradient(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            {!useGradient && (
              <div className="control-group">
                <div className="control-label">
                  <span>颜色</span>
                </div>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={fillColor}
                    onChange={(e) => setFillColor(e.target.value)}
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={fillColor}
                    onChange={(e) => setFillColor(e.target.value)}
                    className="color-text"
                  />
                </div>
              </div>
            )}

            {useGradient && (
              <>
                <div className="control-group">
                  <div className="control-label">
                    <span>方向</span>
                  </div>
                  <div className="direction-buttons">
                    {(['horizontal', 'vertical', 'diagonal'] as const).map((dir) => (
                      <button
                        key={dir}
                        className={`direction-btn ${gradientDirection === dir ? 'active' : ''}`}
                        onClick={() => setGradientDirection(dir)}
                      >
                        {dir === 'horizontal' ? '水平' : dir === 'vertical' ? '垂直' : '对角'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="gradient-stops">
                  {gradientStops.map((stop, index) => (
                    <div key={index} className="gradient-stop-row">
                      <input
                        type="color"
                        value={stop.color}
                        onChange={(e) => updateGradientStop(index, { color: e.target.value })}
                        className="color-input-small"
                      />
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={stop.position}
                        onChange={(e) =>
                          updateGradientStop(index, { position: parseFloat(e.target.value) })
                        }
                        className="slider-small"
                      />
                      <span className="stop-position">{Math.round(stop.position * 100)}%</span>
                      {gradientStops.length > 2 && (
                        <button
                          className="remove-stop-btn"
                          onClick={() => removeGradientStop(index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {gradientStops.length < 10 && (
                    <button className="add-stop-btn" onClick={addGradientStop}>
                      + 添加色标
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="section">
            <h2 className="section-title">阴影</h2>
            <SliderControl
              label="偏移 X"
              value={shadow.offsetX}
              min={-50}
              max={50}
              step={1}
              unit="px"
              onChange={(v) => setShadow({ ...shadow, offsetX: v })}
              name="shadowX"
            />
            <SliderControl
              label="偏移 Y"
              value={shadow.offsetY}
              min={-50}
              max={50}
              step={1}
              unit="px"
              onChange={(v) => setShadow({ ...shadow, offsetY: v })}
              name="shadowY"
            />
            <SliderControl
              label="模糊半径"
              value={shadow.blur}
              min={0}
              max={100}
              step={1}
              unit="px"
              onChange={(v) => setShadow({ ...shadow, blur: v })}
              name="shadowBlur"
            />
            <div className="control-group">
              <div className="control-label">
                <span>颜色</span>
              </div>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value="#000000"
                  onChange={(e) => {
                    const r = parseInt(e.target.value.slice(1, 3), 16);
                    const g = parseInt(e.target.value.slice(3, 5), 16);
                    const b = parseInt(e.target.value.slice(5, 7), 16);
                    setShadow({ ...shadow, color: `rgba(${r}, ${g}, ${b}, 0.5)` });
                  }}
                  className="color-input"
                />
              </div>
            </div>
          </div>

          <div className="section">
            <h2 className="section-title">描边</h2>
            <SliderControl
              label="宽度"
              value={stroke.width}
              min={0}
              max={20}
              step={0.5}
              unit="px"
              onChange={(v) => setStroke({ ...stroke, width: v })}
              name="strokeWidth"
            />
            <div className="control-group">
              <div className="control-label">
                <span>颜色</span>
              </div>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={stroke.color}
                  onChange={(e) => setStroke({ ...stroke, color: e.target.value })}
                  className="color-input"
                />
                <input
                  type="text"
                  value={stroke.color}
                  onChange={(e) => setStroke({ ...stroke, color: e.target.value })}
                  className="color-text"
                />
              </div>
            </div>
          </div>

          <div className="section">
            <h2 className="section-title">纹理</h2>
            <div className="texture-grid">
              {textureOptions.map((opt) => (
                <button
                  key={opt.type}
                  className={`texture-btn ${texture.type === opt.type ? 'active' : ''}`}
                  onClick={() => setTexture({ ...texture, type: opt.type })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {texture.type !== 'none' && (
              <SliderControl
                label="透明度"
                value={texture.opacity}
                min={0}
                max={1}
                step={0.01}
                unit=""
                onChange={(v) => setTexture({ ...texture, opacity: v })}
                name="textureOpacity"
              />
            )}
          </div>

          <div className="section export-section">
            <button className="export-btn primary" onClick={exportToPng}>
              导出 PNG
            </button>
            <button className="export-btn secondary" onClick={exportToCss}>
              导出 CSS 代码
            </button>
          </div>
        </div>
      </div>

      <div className="divider"></div>

      <div className="canvas-area">
        <div className="canvas-container" ref={canvasContainerRef}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="preview-canvas"
          />
        </div>
      </div>

      {toast.visible && (
        <div className={`toast ${toast.visible ? 'show' : ''}`}>
          {toast.message}
        </div>
      )}

      <style>{`
        .app-container {
          display: flex;
          width: 100%;
          height: 100vh;
          background-color: #1e1e1e;
          color: #e0e0e0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 50px;
          background: #1e1e1e;
          border-bottom: 1px solid #3c3c3c;
          z-index: 100;
          align-items: center;
          padding: 0 16px;
          gap: 12px;
        }

        .app-title-mobile {
          font-size: 16px;
          color: #f0a030;
          font-weight: 600;
        }

        .toggle-panel-btn {
          background: #2d2d2d;
          border: 1px solid #3c3c3c;
          color: #e0e0e0;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .toggle-panel-btn:hover {
          background: #3c3c3c;
        }

        .control-panel {
          width: 320px;
          min-width: 320px;
          background: #1e1e1e;
          border-right: none;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: width 0.3s ease, min-width 0.3s ease;
        }

        .control-panel.collapsed {
          width: 0;
          min-width: 0;
        }

        .panel-header {
          padding: 20px;
          border-bottom: 1px solid #3c3c3c;
          background: #1a1a1a;
        }

        .app-title {
          font-size: 18px;
          font-weight: 600;
          color: #f0a030;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .section {
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #2d2d2d;
        }

        .section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #f0a030;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .control-group {
          margin-bottom: 12px;
        }

        .control-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-size: 13px;
          color: #b0b0b0;
        }

        .value-display {
          color: #f0a030;
          font-weight: 500;
          font-size: 12px;
          padding: 2px 6px;
          background: #2d2d2d;
          border-radius: 3px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .value-display.active {
          opacity: 1;
        }

        .slider {
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: #2d2d2d;
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #f0a030;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 8px rgba(240, 160, 48, 0.5);
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #f0a030;
          cursor: pointer;
          border: none;
        }

        .slider-small {
          flex: 1;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: #2d2d2d;
          border-radius: 2px;
          outline: none;
        }

        .slider-small::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #f0a030;
          cursor: pointer;
        }

        .font-select {
          width: 100%;
          padding: 8px 12px;
          background: #2d2d2d;
          border: 1px solid #3c3c3c;
          color: #e0e0e0;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          outline: none;
          margin-bottom: 12px;
        }

        .font-select:hover {
          border-color: #f0a030;
        }

        .font-select:focus {
          border-color: #f0a030;
          box-shadow: 0 0 0 2px rgba(240, 160, 48, 0.2);
        }

        .drop-zone {
          border: 2px dashed #3c3c3c;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #1a1a1a;
        }

        .drop-zone:hover,
        .drop-zone.dragging {
          border-color: #f0a030;
          background: rgba(240, 160, 48, 0.1);
        }

        .drop-text {
          font-size: 13px;
          color: #e0e0e0;
          margin-bottom: 4px;
        }

        .drop-subtext {
          font-size: 12px;
          color: #f0a030;
          margin-bottom: 4px;
        }

        .drop-hint {
          font-size: 11px;
          color: #707070;
        }

        .text-input {
          width: 100%;
          padding: 10px 12px;
          background: #2d2d2d;
          border: 1px solid #3c3c3c;
          color: #e0e0e0;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          outline: none;
          margin-bottom: 12px;
          min-height: 60px;
        }

        .text-input:hover {
          border-color: #505050;
        }

        .text-input:focus {
          border-color: #f0a030;
          box-shadow: 0 0 0 2px rgba(240, 160, 48, 0.2);
        }

        .align-buttons {
          display: flex;
          gap: 4px;
        }

        .align-btn {
          flex: 1;
          padding: 8px;
          background: #2d2d2d;
          border: 1px solid #3c3c3c;
          color: #b0b0b0;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.15s;
        }

        .align-btn:hover {
          background: #3c3c3c;
          color: #e0e0e0;
        }

        .align-btn.active {
          background: #f0a030;
          border-color: #f0a030;
          color: #1e1e1e;
          font-weight: 500;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 36px;
          height: 20px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #2d2d2d;
          transition: 0.3s;
          border-radius: 20px;
          border: 1px solid #3c3c3c;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 2px;
          bottom: 2px;
          background-color: #707070;
          transition: 0.3s;
          border-radius: 50%;
        }

        input:checked + .toggle-slider {
          background-color: rgba(240, 160, 48, 0.3);
          border-color: #f0a030;
        }

        input:checked + .toggle-slider:before {
          transform: translateX(16px);
          background-color: #f0a030;
        }

        .color-input-wrapper {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .color-input {
          width: 40px;
          height: 32px;
          border: 1px solid #3c3c3c;
          border-radius: 4px;
          background: #2d2d2d;
          cursor: pointer;
          padding: 2px;
        }

        .color-input:hover {
          border-color: #f0a030;
        }

        .color-input-small {
          width: 28px;
          height: 28px;
          border: 1px solid #3c3c3c;
          border-radius: 4px;
          cursor: pointer;
          padding: 1px;
          background: #2d2d2d;
        }

        .color-text {
          flex: 1;
          padding: 6px 10px;
          background: #2d2d2d;
          border: 1px solid #3c3c3c;
          color: #e0e0e0;
          border-radius: 4px;
          font-size: 13px;
          font-family: monospace;
          outline: none;
        }

        .color-text:focus {
          border-color: #f0a030;
        }

        .direction-buttons {
          display: flex;
          gap: 4px;
          margin-bottom: 8px;
        }

        .direction-btn {
          flex: 1;
          padding: 6px;
          background: #2d2d2d;
          border: 1px solid #3c3c3c;
          color: #b0b0b0;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.15s;
        }

        .direction-btn:hover {
          background: #3c3c3c;
          color: #e0e0e0;
        }

        .direction-btn.active {
          background: #f0a030;
          border-color: #f0a030;
          color: #1e1e1e;
          font-weight: 500;
        }

        .gradient-stops {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .gradient-stop-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stop-position {
          font-size: 11px;
          color: #888;
          min-width: 36px;
          text-align: right;
        }

        .remove-stop-btn {
          width: 22px;
          height: 22px;
          border: none;
          background: #3c3c3c;
          color: #b0b0b0;
          border-radius: 3px;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-stop-btn:hover {
          background: #c0392b;
          color: white;
        }

        .add-stop-btn {
          width: 100%;
          padding: 6px;
          background: #2d2d2d;
          border: 1px dashed #3c3c3c;
          color: #888;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          margin-top: 4px;
        }

        .add-stop-btn:hover {
          border-color: #f0a030;
          color: #f0a030;
        }

        .texture-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          margin-bottom: 12px;
        }

        .texture-btn {
          padding: 8px 4px;
          background: #2d2d2d;
          border: 1px solid #3c3c3c;
          color: #b0b0b0;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.15s;
        }

        .texture-btn:hover {
          background: #3c3c3c;
          color: #e0e0e0;
        }

        .texture-btn.active {
          background: #f0a030;
          border-color: #f0a030;
          color: #1e1e1e;
          font-weight: 500;
        }

        .export-section {
          padding-top: 8px;
        }

        .export-btn {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 8px;
        }

        .export-btn:last-child {
          margin-bottom: 0;
        }

        .export-btn.primary {
          background: #f0a030;
          color: #1e1e1e;
        }

        .export-btn.primary:hover {
          background: #ffb040;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(240, 160, 48, 0.3);
        }

        .export-btn.primary:active {
          transform: translateY(0);
        }

        .export-btn.secondary {
          background: #2d2d2d;
          color: #e0e0e0;
          border: 1px solid #3c3c3c;
        }

        .export-btn.secondary:hover {
          background: #3c3c3c;
          border-color: #505050;
        }

        .divider {
          width: 1px;
          background: #3c3c3c;
          flex-shrink: 0;
        }

        .canvas-area {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          padding: 40px;
          overflow: auto;
        }

        .canvas-container {
          position: relative;
          background: #ffffff;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }

        .preview-canvas {
          display: block;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .toast {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          background: #2d2d2d;
          color: #e0e0e0;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          opacity: 0;
          transition: all 0.3s ease;
          pointer-events: none;
          z-index: 1000;
          border: 1px solid #3c3c3c;
        }

        .toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        @media (max-width: 960px) {
          .app-container {
            flex-direction: column;
            padding-top: 50px;
          }

          .mobile-header {
            display: flex;
          }

          .control-panel {
            position: fixed;
            top: 50px;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            min-width: unset;
            height: calc(100vh - 50px);
            z-index: 90;
            transform: translateY(0);
            transition: transform 0.3s ease;
          }

          .control-panel.collapsed {
            transform: translateY(-100%);
            width: 100%;
          }

          .divider {
            display: none;
          }

          .canvas-area {
            flex: 1;
            padding: 20px;
          }

          .preview-canvas {
            max-width: 100%;
            height: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
