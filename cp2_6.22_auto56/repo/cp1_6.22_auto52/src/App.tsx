import React, { useState, useRef, useCallback, useEffect } from 'react';
import ColorPalette from './ColorPalette';
import CanvasArea, { CanvasAreaHandle } from './CanvasArea';
import { generateColorSchemes, generateGradientString, ColorScheme } from './ColorSchemeEngine';
import { exportCanvasToPNG } from './exportUtils';

const App: React.FC = () => {
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [usedColors, setUsedColors] = useState<string[]>([]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null);
  const [colorSchemes, setColorSchemes] = useState<ColorScheme[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const canvasRef = useRef<CanvasAreaHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageLoad = useCallback((width: number, height: number) => {
    setImageInfo({ width, height });
    setUsedColors([]);
    setColorSchemes([]);
  }, []);

  const handleColorUsed = useCallback((color: string) => {
    setUsedColors((prev) => {
      const normColor = color.toLowerCase();
      if (prev.includes(normColor)) return prev;
      return [...prev, normColor];
    });
  }, []);

  const handleHistoryChange = useCallback((undo: boolean, redo: boolean) => {
    setCanUndo(undo);
    setCanRedo(redo);
  }, []);

  useEffect(() => {
    if (usedColors.length > 0 && canvasRef.current) {
      const currentUsedColors = canvasRef.current.getUsedColors();
      if (currentUsedColors.length > 0) {
        const schemes = generateColorSchemes(currentUsedColors);
        setColorSchemes(schemes);
      }
    } else {
      setColorSchemes([]);
    }
  }, [usedColors]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageSrc(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUndo = useCallback(() => {
    canvasRef.current?.undo();
  }, []);

  const handleRedo = useCallback(() => {
    canvasRef.current?.redo();
  }, []);

  const handleExport = useCallback(async () => {
    if (isExporting) return;

    const canvas = canvasRef.current?.exportCanvas();
    if (!canvas) return;

    setIsExporting(true);

    await exportCanvasToPNG(canvas, {
      onStart: () => {},
      onComplete: () => {
        setIsExporting(false);
      }
    });
  }, [isExporting]);

  const handleSchemeClick = useCallback((scheme: ColorScheme) => {
    if (!canvasRef.current) return;

    canvasRef.current.applyColorScheme(scheme.colorMap);

    const newUsedColors = scheme.colors.map((c) => c.toLowerCase());
    setUsedColors(newUsedColors);

    const schemes = generateColorSchemes(newUsedColors);
    setColorSchemes(schemes);
  }, []);

  const complementarySchemes = colorSchemes.filter((s) => s.type === 'complementary');
  const analogousSchemes = colorSchemes.filter((s) => s.type === 'analogous');

  return (
    <div className="app">
      <ColorPalette
        selectedColor={selectedColor}
        usedColors={usedColors}
        onColorSelect={setSelectedColor}
      />

      <div className="canvas-container">
        <div className="toolbar">
          <div className="toolbar-left">
            <button className="tool-btn" onClick={handleUploadClick}>
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              上传
            </button>
          </div>

          <div className="toolbar-center">
            <button className="tool-btn" onClick={handleUndo} disabled={!canUndo}>
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 10h10a5 5 0 015 5v3M3 10l4-4M3 10l4 4" />
              </svg>
              撤销
            </button>
            <button className="tool-btn" onClick={handleRedo} disabled={!canRedo}>
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10H11a5 5 0 00-5 5v3M21 10l-4-4M21 10l-4 4" />
              </svg>
              重做
            </button>
          </div>

          <div className="toolbar-right">
            <button className="tool-btn primary" onClick={handleExport} disabled={isExporting || !imageSrc}>
              {isExporting ? (
                <>
                  <span className="spinner" />
                  导出中
                </>
              ) : (
                <>
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  导出 PNG
                </>
              )}
            </button>
          </div>
        </div>

        <div onClick={!imageSrc ? handleUploadClick : undefined} style={{ flex: 1, display: 'flex' }}>
          <CanvasArea
            ref={canvasRef}
            selectedColor={selectedColor}
            imageSrc={imageSrc}
            onImageLoad={handleImageLoad}
            onColorUsed={handleColorUsed}
            onHistoryChange={handleHistoryChange}
          />
        </div>
      </div>

      <aside className="color-schemes-panel">
        <div className="schemes-header">
          <div className="schemes-title">配色灵感</div>
          <div className="schemes-subtitle">智能推荐和谐配色方案</div>
        </div>

        <div className="schemes-list">
          {colorSchemes.length === 0 ? (
            <div className="empty-schemes">
              <svg className="empty-schemes-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div className="empty-schemes-text">
                上传线稿并开始上色后
                <br />
                这里会显示智能配色推荐
              </div>
            </div>
          ) : (
            <>
              {complementarySchemes.length > 0 && (
                <>
                  <div className="scheme-category-label">互补色方案</div>
                  {complementarySchemes.map((scheme) => (
                    <div
                      key={scheme.id}
                      className="scheme-card"
                      onClick={() => handleSchemeClick(scheme)}
                    >
                      <div
                        className="scheme-gradient"
                        style={{
                          background: generateGradientString(scheme.colors)
                        }}
                      />
                      <div className="scheme-info">
                        <span className="scheme-name">{scheme.name}</span>
                        <span className="scheme-type-badge">互补</span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {analogousSchemes.length > 0 && (
                <>
                  <div className="scheme-category-label" style={{ marginTop: '8px' }}>
                    类似色方案
                  </div>
                  {analogousSchemes.map((scheme) => (
                    <div
                      key={scheme.id}
                      className="scheme-card"
                      onClick={() => handleSchemeClick(scheme)}
                    >
                      <div
                        className="scheme-gradient"
                        style={{
                          background: generateGradientString(scheme.colors)
                        }}
                      />
                      <div className="scheme-info">
                        <span className="scheme-name">{scheme.name}</span>
                        <span className="scheme-type-badge analogous">类似</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </aside>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default App;
