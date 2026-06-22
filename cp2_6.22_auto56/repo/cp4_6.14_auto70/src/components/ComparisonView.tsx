import { useRef, useState, useCallback, useEffect } from 'react';
import { FontConfig, MeasureData, calcVisualScore, renderTextToCanvas, FONT_OPTIONS } from '../utils/fontMeasure';
import PreviewPanel from './PreviewPanel';
import ReportModal from './ReportModal';
import './ComparisonView.css';

interface ComparisonViewProps {
  configA: FontConfig;
  configB: FontConfig;
  text: string;
  onConfigChange?: (config: FontConfig, panel: 'A' | 'B') => void;
  onTextChange?: (text: string) => void;
  activePanel: 'A' | 'B';
  onActivePanelChange?: (panel: 'A' | 'B') => void;
}

export default function ComparisonView({
  configA,
  configB,
  text,
  onConfigChange,
  onTextChange,
  activePanel,
  onActivePanelChange,
}: ComparisonViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [syncText, setSyncText] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [measureA, setMeasureA] = useState<MeasureData | null>(null);
  const [measureB, setMeasureB] = useState<MeasureData | null>(null);
  const [screenshotA, setScreenshotA] = useState<string>('');
  const [screenshotB, setScreenshotB] = useState<string>('');
  const rafRef = useRef<number | null>(null);

  const handleSplitMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = Math.max(0.1, Math.min(0.9, x / rect.width));
        setSplitRatio(ratio);
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handlePanelATextChange = useCallback(
    (newText: string) => {
      if (onTextChange && syncText) {
        onTextChange(newText);
      } else if (onTextChange) {
        onTextChange(newText);
      }
    },
    [onTextChange, syncText]
  );

  const handlePanelBTextChange = useCallback(
    (newText: string) => {
      if (onTextChange && syncText) {
        onTextChange(newText);
      } else if (onTextChange) {
        onTextChange(newText);
      }
    },
    [onTextChange, syncText]
  );

  const generateReport = useCallback(() => {
    setTimeout(() => {
      const screenshotAData = renderTextToCanvas(text, configA, 500);
      const screenshotBData = renderTextToCanvas(text, configB, 500);
      setScreenshotA(screenshotAData);
      setScreenshotB(screenshotBData);
      setReportOpen(true);
    }, 0);
  }, [text, configA, configB]);

  const score = calcVisualScore(
    measureA?.charBounds || null,
    measureB?.charBounds || null,
    configA.fontSize,
    configB.fontSize
  );

  const getFontLabel = (config: FontConfig) => {
    return FONT_OPTIONS.find((f) => f.value === config.fontFamily)?.label || config.fontFamily;
  };

  return (
    <div className="comparison-view" ref={containerRef}>
      <div className="sync-toggle-container">
        <button
          className={`sync-toggle ${syncText ? 'active' : ''}`}
          onClick={() => setSyncText(!syncText)}
          title={syncText ? '关闭同步' : '开启同步'}
        >
          ⇄
        </button>
      </div>

      <div
        className="preview-container preview-a"
        style={{ width: `calc(${splitRatio * 100}% - 2px)` }}
        onClick={() => onActivePanelChange?.('A')}
      >
        <PreviewPanel
          config={configA}
          text={text}
          onTextChange={handlePanelATextChange}
          onMeasure={setMeasureA}
          label="A"
        />
      </div>

      <div
        className={`split-divider ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleSplitMouseDown}
      />

      <div
        className="preview-container preview-b"
        style={{ width: `calc(${(1 - splitRatio) * 100}% - 2px)` }}
        onClick={() => onActivePanelChange?.('B')}
      >
        <PreviewPanel
          config={configB}
          text={text}
          onTextChange={handlePanelBTextChange}
          onMeasure={setMeasureB}
          label="B"
        />
      </div>

      {reportOpen && (
        <ReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          configA={configA}
          configB={configB}
          measureA={measureA}
          measureB={measureB}
          score={score}
          screenshotA={screenshotA}
          screenshotB={screenshotB}
          getFontLabel={getFontLabel}
        />
      )}

      <button className="generate-report-btn" onClick={generateReport}>
        生成报告
      </button>
    </div>
  );
}
