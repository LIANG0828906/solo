import JSZip from 'jszip';
import type { ColumnConfig } from '../panel/useControls';

export interface ExportData {
  text: string;
  columns: [ColumnConfig, ColumnConfig, ColumnConfig];
  exportedAt: string;
}

function columnNodeToCanvas(
  node: HTMLElement,
  config: ColumnConfig
): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const padding = 60;
    const width = Math.max(600, node.scrollWidth + padding * 2);
    const height = Math.max(400, node.scrollHeight + padding * 2);

    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 2;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = config.color;
    ctx.font = `${config.fontSize}px ${config.fontFamily}`;
    ctx.textBaseline = 'top';

    const rawText = node.textContent || '';
    const lines = rawText.split('\n');
    const lineHeightPx = config.fontSize * config.lineHeight;
    const letterSpacingEm = config.letterSpacing;

    let y = padding;
    const maxContentWidth = width - padding * 2;

    for (const paragraph of lines) {
      if (paragraph.trim() === '') {
        y += lineHeightPx;
        continue;
      }

      const words = paragraph.split(' ');
      let currentLine = '';

      const drawLine = (line: string) => {
        let x = padding;
        const chars = line.split('');
        for (let i = 0; i < chars.length; i++) {
          const ch = chars[i];
          ctx.fillText(ch, x, y);
          const charWidth = ctx.measureText(ch).width;
          x += charWidth + config.fontSize * letterSpacingEm;
        }
      };

      const measureLine = (line: string): number => {
        let w = 0;
        const chars = line.split('');
        for (let i = 0; i < chars.length; i++) {
          w += ctx.measureText(chars[i]).width;
          if (i < chars.length - 1) w += config.fontSize * letterSpacingEm;
        }
        return w;
      };

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
        if (measureLine(testLine) > maxContentWidth && currentLine) {
          drawLine(currentLine);
          y += lineHeightPx;
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        drawLine(currentLine);
        y += lineHeightPx;
      }
    }

    resolve(canvas);
  });
}

export async function captureColumn(
  columnEl: HTMLElement,
  config: ColumnConfig
): Promise<Blob> {
  const canvas = await columnNodeToCanvas(columnEl, config);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      },
      'image/png'
    );
  });
}

export async function exportComparison(
  columnEls: [HTMLElement, HTMLElement, HTMLElement],
  columns: [ColumnConfig, ColumnConfig, ColumnConfig],
  text: string
): Promise<void> {
  const zip = new JSZip();

  const blobs = await Promise.all(
    columnEls.map((el, i) => captureColumn(el, columns[i]))
  );

  const fontNames = ['Roboto', 'Playfair Display', 'Fira Code', 'Lora', 'Inter'];
  blobs.forEach((blob, i) => {
    const match = columns[i].fontFamily.match(/'([^']+)'/);
    const fontLabel = match ? match[1].replace(/\s+/g, '-') : `column-${i + 1}`;
    zip.file(`column-${i + 1}-${fontLabel}.png`, blob);
  });

  const exportData: ExportData = {
    text,
    columns,
    exportedAt: new Date().toISOString(),
  };
  zip.file('typography-params.json', JSON.stringify(exportData, null, 2));

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `typography-comparison-${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
