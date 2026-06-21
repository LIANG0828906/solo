import type {
  ParsedFont,
  RenderResult,
  DiffResult,
  DiffRegion,
  GlyphDiffStats,
  ComparisonReport,
  LayoutParams,
} from './types';

export function compareRenderResults(
  fonts: ParsedFont[],
  renderResults: RenderResult[]
): DiffResult {
  if (renderResults.length < 2) {
    const w = renderResults[0]?.width || 0;
    const h = renderResults[0]?.height || 0;
    const emptyData = new ImageData(w || 1, h || 1);
    return { diffImageData: emptyData, diffRegions: [] };
  }

  const maxWidth = Math.max(...renderResults.map((r) => r.width));
  const maxHeight = Math.max(...renderResults.map((r) => r.height));

  const diffRegions: DiffRegion[] = [];
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = maxWidth;
  diffCanvas.height = maxHeight;
  const diffCtx = diffCanvas.getContext('2d')!;
  const diffImageData = diffCtx.createImageData(maxWidth, maxHeight);
  const diffData = diffImageData.data;

  const regionSize = 16;

  for (let aIdx = 0; aIdx < renderResults.length - 1; aIdx++) {
    for (let bIdx = aIdx + 1; bIdx < renderResults.length; bIdx++) {
      const resultA = renderResults[aIdx];
      const resultB = renderResults[bIdx];

      const ctxA = resultA.canvas.getContext('2d')!;
      const ctxB = resultB.canvas.getContext('2d')!;

      const imgA = ctxA.getImageData(0, 0, resultA.width, resultA.height);
      const imgB = ctxB.getImageData(0, 0, resultB.width, resultB.height);

      for (let ry = 0; ry < maxHeight; ry += regionSize) {
        for (let rx = 0; rx < maxWidth; rx += regionSize) {
          let totalDiff = 0;
          let pixelCount = 0;

          const endX = Math.min(rx + regionSize, maxWidth);
          const endY = Math.min(ry + regionSize, maxHeight);

          for (let py = ry; py < endY; py++) {
            for (let px = rx; px < endX; px++) {
              const idx = (py * maxWidth + px) * 4;
              const idxA = (py * resultA.width + px) * 4;
              const idxB = (py * resultB.width + px) * 4;

              const inA = px < resultA.width && py < resultA.height;
              const inB = px < resultB.width && py < resultB.height;

              const rA = inA ? imgA.data[idxA] : 30;
              const gA = inA ? imgA.data[idxA + 1] : 30;
              const bA = inA ? imgA.data[idxA + 2] : 46;
              const rB = inB ? imgB.data[idxB] : 30;
              const gB = inB ? imgB.data[idxB + 1] : 30;
              const bB = inB ? imgB.data[idxB + 2] : 46;

              const diff =
                Math.abs(rA - rB) + Math.abs(gA - gB) + Math.abs(bA - bB);
              totalDiff += diff;
              pixelCount++;
            }
          }

          const avgDiff = pixelCount > 0 ? totalDiff / pixelCount : 0;

          if (avgDiff > 10) {
            for (let py = ry; py < endY; py++) {
              for (let px = rx; px < endX; px++) {
                const idx = (py * maxWidth + px) * 4;
                diffData[idx] = 255;
                diffData[idx + 1] = 0;
                diffData[idx + 2] = 0;
                diffData[idx + 3] = 77;
              }
            }

            const lineIndex = Math.floor(
              ry / (fonts[0] ? 32 * 1.5 : 48)
            );
            const charIndex = Math.floor(rx / 20);

            diffRegions.push({
              x: rx,
              y: ry,
              width: endX - rx,
              height: endY - ry,
              charIndex,
              lineIndex,
              fontAIndex: aIdx,
              fontBIndex: bIdx,
              stats: computeGlyphStats(
                fonts[aIdx],
                fonts[bIdx],
                lineIndex,
                charIndex,
                renderResults[aIdx],
                renderResults[bIdx]
              ),
            });
          }
        }
      }
    }
  }

  return { diffImageData, diffRegions };
}

function computeGlyphStats(
  fontA: ParsedFont,
  fontB: ParsedFont,
  lineIndex: number,
  charIndex: number,
  resultA: RenderResult,
  resultB: RenderResult
): GlyphDiffStats {
  let charA = '';
  let charB = '';

  if (resultA.lineMetrics[lineIndex]?.charPositions[charIndex]) {
    charA = resultA.lineMetrics[lineIndex].charPositions[charIndex].char;
  }
  if (resultB.lineMetrics[lineIndex]?.charPositions[charIndex]) {
    charB = resultB.lineMetrics[lineIndex].charPositions[charIndex].char;
  }

  const char = charA || charB;
  const gA = fontA.glyphs[char];
  const gB = fontB.glyphs[char];

  if (!gA || !gB) {
    return {
      strokeWidthDiff: 0,
      nodeCountDiff: 0,
      advanceWidthDiff: 0,
      boundingBoxWidthDiff: 0,
      boundingBoxHeightDiff: 0,
    };
  }

  const strokeA = estimateStrokeWidth(gA);
  const strokeB = estimateStrokeWidth(gB);

  return {
    strokeWidthDiff: Math.abs(strokeA - strokeB),
    nodeCountDiff: Math.abs(gA.nodeCount - gB.nodeCount),
    advanceWidthDiff: Math.abs(gA.advanceWidth - gB.advanceWidth),
    boundingBoxWidthDiff: Math.abs(
      (gA.xMax - gA.xMin) - (gB.xMax - gB.xMin)
    ),
    boundingBoxHeightDiff: Math.abs(
      (gA.yMax - gA.yMin) - (gB.yMax - gB.yMin)
    ),
  };
}

function estimateStrokeWidth(glyph: {
  commands: Array<{ type: string }>;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  nodeCount: number;
}): number {
  const bboxW = glyph.xMax - glyph.xMin;
  const bboxH = glyph.yMax - glyph.yMin;
  if (bboxW === 0 || bboxH === 0) return 0;
  const perimeter = Math.sqrt(bboxW * bboxW + bboxH * bboxH);
  return perimeter / Math.max(glyph.nodeCount, 1);
}

export function generateReport(
  fonts: ParsedFont[],
  renderResults: RenderResult[],
  params: LayoutParams
): ComparisonReport {
  const lineDiffStats = renderResults[0]?.lineMetrics.map((line, li) => {
    const fontStats = renderResults.map((r, fi) => ({
      fontName: fonts[fi]?.name || `Font ${fi + 1}`,
      lineWidth: r.lineMetrics[li]?.width || 0,
      lineHeight: r.lineMetrics[li]?.height || 0,
    }));

    let maxLineWidthDiff = 0;
    let maxLineHeightDiff = 0;
    for (let i = 0; i < fontStats.length; i++) {
      for (let j = i + 1; j < fontStats.length; j++) {
        maxLineWidthDiff = Math.max(
          maxLineWidthDiff,
          Math.abs(fontStats[i].lineWidth - fontStats[j].lineWidth)
        );
        maxLineHeightDiff = Math.max(
          maxLineHeightDiff,
          Math.abs(fontStats[i].lineHeight - fontStats[j].lineHeight)
        );
      }
    }

    return {
      lineIndex: li,
      text: line.text,
      fontStats,
      maxLineWidthDiff,
      maxLineHeightDiff,
    };
  }) || [];

  return {
    exportTime: new Date().toISOString(),
    fonts: fonts.map((f) => ({
      name: f.name,
      familyName: f.familyName,
      styleName: f.styleName,
      uploadTime: f.uploadTime,
    })),
    layoutParams: { ...params },
    lineDiffStats,
  };
}

export function exportScreenshot(
  renderResults: RenderResult[],
  diffResult: DiffResult | null,
  fontNames: string[]
): string {
  const totalWidth = renderResults.reduce((s, r) => s + r.width, 0);
  const maxHeight = Math.max(...renderResults.map((r) => r.height));
  const labelHeight = 32;

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = maxHeight + labelHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e1e2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let x = 0;
  for (let i = 0; i < renderResults.length; i++) {
    const r = renderResults[i];
    ctx.fillStyle = '#2b2b3d';
    ctx.fillRect(x, 0, r.width, labelHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(fontNames[i] || `Font ${i + 1}`, x + 8, labelHeight / 2);

    ctx.drawImage(r.canvas, x, labelHeight);

    if (diffResult) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = diffResult.diffImageData.width;
      tempCanvas.height = diffResult.diffImageData.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.putImageData(diffResult.diffImageData, 0, 0);
      ctx.drawImage(tempCanvas, x, labelHeight);
    }

    if (i < renderResults.length - 1) {
      ctx.fillStyle = '#4a4a5a';
      ctx.fillRect(x + r.width - 1, 0, 1, canvas.height);
    }

    x += r.width;
  }

  return canvas.toDataURL('image/png');
}
