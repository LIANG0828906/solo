import React, { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ParsedFont,
  LayoutParams,
  RenderResult,
  DiffResult,
} from './types';
import { DEFAULT_LAYOUT } from './types';
import { parseFont, updateChars, disposeFont, terminateWorker } from './fontParser';
import { compareRenderResults, generateReport, exportScreenshot } from './typeComparator';
import ControlPanel from './components/ControlPanel';
import PreviewPanel from './components/PreviewPanel';

const App: React.FC = () => {
  const [fonts, setFonts] = useState<ParsedFont[]>([]);
  const [params, setParams] = useState<LayoutParams>({ ...DEFAULT_LAYOUT });
  const [compareMode, setCompareMode] = useState(false);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [renderResults, setRenderResults] = useState<RenderResult[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  const rafRef = useRef<number>(0);
  const charsTimerRef = useRef<number>(0);

  const scheduleParamsUpdate = useCallback((newParams: LayoutParams) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setParams(newParams);
    });
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(charsTimerRef.current);
    };
  }, []);

  useEffect(() => {
    clearTimeout(charsTimerRef.current);
    charsTimerRef.current = window.setTimeout(async () => {
      const allChars = [...new Set(params.text.split(''))].filter(c => c !== '\n').join('');
      for (const font of fonts) {
        const missingChars = [...allChars].filter(
          (ch) => !font.glyphs[ch]
        );
        if (missingChars.length > 0) {
          try {
            const { glyphs, kerningValues } = await updateChars(
              font.id,
              missingChars.join('')
            );
            setFonts((prev) =>
              prev.map((f) =>
                f.id === font.id
                  ? {
                      ...f,
                      glyphs: { ...f.glyphs, ...glyphs },
                      kerningValues: { ...f.kerningValues, ...kerningValues },
                    }
                  : f
              )
            );
          } catch { /* ignore */ }
        }
      }
    }, 300);
    return () => clearTimeout(charsTimerRef.current);
  }, [params.text, fonts]);

  useEffect(() => {
    return () => {
      terminateWorker();
    };
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      setLoading(true);
      const newFonts: ParsedFont[] = [];

      for (const file of Array.from(files)) {
        if (!file.name.match(/\.(ttf|otf)$/i)) continue;
        try {
          const buffer = await file.arrayBuffer();
          const allChars = [...new Set(params.text.split(''))].filter(c => c !== '\n').join('');
          const parsed = await parseFont(buffer, allChars);
          newFonts.push(parsed);
        } catch (err) {
          console.error(`Failed to parse font: ${file.name}`, err);
        }
      }

      if (newFonts.length > 0) {
        setFonts((prev) => [...prev, ...newFonts]);
      }
      setLoading(false);
    },
    [params.text]
  );

  const handleRemoveFont = useCallback((id: string) => {
    disposeFont(id);
    setFonts((prev) => prev.filter((f) => f.id !== id));
    setDiffResult(null);
  }, []);

  const handleToggleCompare = useCallback(() => {
    setCompareMode((prev) => !prev);
    setDiffResult(null);
  }, []);

  const handleRenderResults = useCallback(
    (results: RenderResult[]) => {
      setRenderResults(results);
    },
    []
  );

  useEffect(() => {
    if (compareMode && renderResults.length >= 2 && fonts.length >= 2) {
      const diff = compareRenderResults(fonts, renderResults);
      setDiffResult(diff);
    } else {
      setDiffResult(null);
    }
  }, [compareMode, fonts, renderResults]);

  const handleExport = useCallback(() => {
    if (renderResults.length === 0) return;

    const dataUrl = exportScreenshot(
      renderResults,
      diffResult,
      fonts.map((f) => f.name)
    );

    const link = document.createElement('a');
    link.download = 'font-comparison.png';
    link.href = dataUrl;
    link.click();

    const report = generateReport(fonts, renderResults, params);
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const reportUrl = URL.createObjectURL(blob);
    const reportLink = document.createElement('a');
    reportLink.download = 'comparison-report.json';
    reportLink.href = reportUrl;
    reportLink.click();
    URL.revokeObjectURL(reportUrl);
  }, [renderResults, diffResult, fonts, params]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setDragOver(false);
    }
  }, []);

  const renderCardPreview = (font: ParsedFont, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#2b2b3d';
    ctx.fillRect(0, 0, 140, 24);
    const scale = 12 / font.unitsPerEm;
    ctx.fillStyle = '#a78bfa';
    let x = 4;
    const baselineY = 16;
    const sample = 'AaBbCc123';
    for (const ch of sample) {
      const glyph = font.glyphs[ch];
      if (glyph) {
        ctx.beginPath();
        for (const cmd of glyph.commands) {
          switch (cmd.type) {
            case 'M':
              ctx.moveTo(x + (cmd.x || 0) * scale, baselineY - (cmd.y || 0) * scale);
              break;
            case 'L':
              ctx.lineTo(x + (cmd.x || 0) * scale, baselineY - (cmd.y || 0) * scale);
              break;
            case 'C':
              ctx.bezierCurveTo(
                x + (cmd.x1 || 0) * scale, baselineY - (cmd.y1 || 0) * scale,
                x + (cmd.x2 || 0) * scale, baselineY - (cmd.y2 || 0) * scale,
                x + (cmd.x || 0) * scale, baselineY - (cmd.y || 0) * scale
              );
              break;
            case 'Q':
              ctx.quadraticCurveTo(
                x + (cmd.x1 || 0) * scale, baselineY - (cmd.y1 || 0) * scale,
                x + (cmd.x || 0) * scale, baselineY - (cmd.y || 0) * scale
              );
              break;
            case 'Z':
              ctx.closePath();
              break;
          }
        }
        ctx.fill();
        x += glyph.advanceWidth * scale + 1;
      }
      if (x > 136) break;
    }
  };

  return (
    <div
      className="app-container"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <button
        className="mobile-toggle"
        onClick={() => setMobileOpen((o) => !o)}
      >
        ☰ 参数
      </button>

      <ControlPanel
        params={params}
        onParamsChange={scheduleParamsUpdate}
        compareMode={compareMode}
        onToggleCompare={handleToggleCompare}
        onExport={handleExport}
        mobileOpen={mobileOpen}
      />

      <div className="preview-area">
        <div className="font-cards-bar">
          {fonts.map((font) => (
            <div key={font.id} className="font-card">
              <button
                className="remove-btn"
                onClick={() => handleRemoveFont(font.id)}
              >
                ✕
              </button>
              <div className="font-card-name">{font.name}</div>
              <canvas
                width={140}
                height={24}
                className="font-card-preview"
                ref={(el) => {
                  if (el) renderCardPreview(font, el);
                }}
              />
            </div>
          ))}

          <div
            className={`upload-zone${dragOver ? ' dragover' : ''}`}
            onClick={() => fileInputRef.current?.click()}
          >
            {loading ? '加载中...' : '+ 上传字体\n(TTF/OTF)'}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".ttf,.otf"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              handleFiles(e.target.files);
              if (e.target) e.target.value = '';
            }}
          />
        </div>

        <PreviewPanel
          fonts={fonts}
          params={params}
          compareMode={compareMode}
          diffResult={diffResult}
          onRenderResults={handleRenderResults}
        />
      </div>
    </div>
  );
};

export default App;
