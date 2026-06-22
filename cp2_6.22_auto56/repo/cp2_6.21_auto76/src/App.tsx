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
  const renderTimerRef = useRef<number>(0);

  const scheduleParamsUpdate = useCallback((newParams: LayoutParams) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setParams(newParams);
    });
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(renderTimerRef.current);
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
    cancelAnimationFrame(renderTimerRef.current);
    renderTimerRef.current = requestAnimationFrame(() => {
      if (compareMode && renderResults.length >= 2 && fonts.length >= 2) {
        const diff = compareRenderResults(fonts, renderResults);
        setDiffResult(diff);
      } else {
        setDiffResult(null);
      }
    });
    return () => cancelAnimationFrame(renderTimerRef.current);
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

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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
        <PreviewPanel
          fonts={fonts}
          params={params}
          compareMode={compareMode}
          diffResult={diffResult}
          onRenderResults={handleRenderResults}
          onRemoveFont={handleRemoveFont}
          onUploadClick={handleUploadClick}
          loading={loading}
          dragOver={dragOver}
        />

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
    </div>
  );
};

export default App;
