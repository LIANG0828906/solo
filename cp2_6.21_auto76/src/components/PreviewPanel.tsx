import React, { useRef, useEffect, useState, useCallback } from 'react';
import type {
  ParsedFont,
  LayoutParams,
  RenderResult,
  DiffResult,
  DiffRegion,
  GlyphDiffStats,
} from '../types';
import { renderText } from '../textRenderer';

interface PreviewPanelProps {
  fonts: ParsedFont[];
  params: LayoutParams;
  compareMode: boolean;
  diffResult: DiffResult | null;
  onRenderResults: (results: RenderResult[]) => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  fonts,
  params,
  compareMode,
  diffResult,
  onRenderResults,
}) => {
  const columnsRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const diffCanvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    stats: GlyphDiffStats;
    fontA: string;
    fontB: string;
  } | null>(null);
  const [renderResults, setRenderResults] = useState<RenderResult[]>([]);
  const rafIdRef = useRef<number>(0);

  useEffect(() => {
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      const results: RenderResult[] = [];
      const containerWidth = columnsRef.current?.clientWidth || 800;
      const columnWidth = fonts.length > 0
        ? Math.floor(containerWidth / fonts.length)
        : containerWidth;

      for (const font of fonts) {
        const result = renderText(font, params, columnWidth);
        results.push(result);
      }

      setRenderResults(results);
      onRenderResults(results);
    });

    return () => cancelAnimationFrame(rafIdRef.current);
  }, [fonts, params]);

  useEffect(() => {
    fonts.forEach((font, i) => {
      const canvas = canvasRefs.current.get(font.id);
      if (canvas && renderResults[i]) {
        const ctx = canvas.getContext('2d')!;
        canvas.width = renderResults[i].width;
        canvas.height = renderResults[i].height;
        ctx.drawImage(renderResults[i].canvas, 0, 0);
      }
    });
  }, [fonts, renderResults]);

  useEffect(() => {
    if (diffResult && compareMode) {
      fonts.forEach((font) => {
        const diffCanvas = diffCanvasRefs.current.get(font.id);
        if (diffCanvas) {
          const ctx = diffCanvas.getContext('2d')!;
          diffCanvas.width = diffResult.diffImageData.width;
          diffCanvas.height = diffResult.diffImageData.height;
          ctx.putImageData(diffResult.diffImageData, 0, 0);
        }
      });
    }
  }, [diffResult, compareMode, fonts]);

  const handleDiffClick = useCallback(
    (e: React.MouseEvent, region: DiffRegion, fontA: ParsedFont, fontB: ParsedFont) => {
      e.stopPropagation();
      const container = (e.currentTarget as HTMLElement).closest('.preview-column');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 10,
        stats: region.stats,
        fontA: fontA.name,
        fontB: fontB.name,
      });
    },
    []
  );

  const handleColumnClick = useCallback(() => {
    setTooltip(null);
  }, []);

  if (fonts.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          height: '100%',
          color: '#666',
          fontSize: '16px',
        }}
      >
        请上传字体文件开始比对
      </div>
    );
  }

  return (
    <div className="preview-columns" ref={columnsRef}>
      {fonts.map((font, i) => (
        <div key={font.id} className="preview-column" onClick={handleColumnClick}>
          <div className="preview-column-label">{font.name}</div>
          <div style={{ position: 'relative' }}>
            <canvas
              ref={(el) => {
                if (el) canvasRefs.current.set(font.id, el);
              }}
            />
            {compareMode && diffResult && (
              <div className="diff-overlay active">
                <canvas
                  ref={(el) => {
                    if (el) diffCanvasRefs.current.set(font.id, el);
                  }}
                />
                {diffResult.diffRegions
                  .filter((r) => r.fontAIndex === i || r.fontBIndex === i)
                  .map((region, ri) => (
                    <div
                      key={ri}
                      className="diff-region-hit"
                      style={{
                        left: region.x,
                        top: region.y,
                        width: region.width,
                        height: region.height,
                      }}
                      onClick={(e) =>
                        handleDiffClick(
                          e,
                          region,
                          fonts[region.fontAIndex],
                          fonts[region.fontBIndex]
                        )
                      }
                    />
                  ))}
              </div>
            )}
            {tooltip && compareMode && (
              <div
                className="tooltip"
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                }}
              >
                <div className="tooltip-title">字形轮廓差异</div>
                <div className="tooltip-row">
                  <span className="label">对比字体</span>
                  <span className="value">
                    {tooltip.fontA} vs {tooltip.fontB}
                  </span>
                </div>
                <div className="tooltip-row">
                  <span className="label">笔画宽度差</span>
                  <span className="value">
                    {tooltip.stats.strokeWidthDiff.toFixed(2)}
                  </span>
                </div>
                <div className="tooltip-row">
                  <span className="label">节点数量差</span>
                  <span className="value">{tooltip.stats.nodeCountDiff}</span>
                </div>
                <div className="tooltip-row">
                  <span className="label">前进宽度差</span>
                  <span className="value">
                    {tooltip.stats.advanceWidthDiff.toFixed(1)}
                  </span>
                </div>
                <div className="tooltip-row">
                  <span className="label">边界框宽度差</span>
                  <span className="value">
                    {tooltip.stats.boundingBoxWidthDiff.toFixed(1)}
                  </span>
                </div>
                <div className="tooltip-row">
                  <span className="label">边界框高度差</span>
                  <span className="value">
                    {tooltip.stats.boundingBoxHeightDiff.toFixed(1)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PreviewPanel;
