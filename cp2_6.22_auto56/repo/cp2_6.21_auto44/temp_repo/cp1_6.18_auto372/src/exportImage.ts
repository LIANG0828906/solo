import html2canvas from 'html2canvas';
import type { EditorState } from './types';

type ExportState = EditorState & { content: string };

export async function exportToPng(canvasElement: HTMLElement, state: ExportState): Promise<void> {
  const startTime = performance.now();

  const fallbackExport = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取画布上下文');

    ctx.fillStyle = state.backgroundColor.startsWith('linear')
      ? '#FFFFFF'
      : state.backgroundColor;
    ctx.fillRect(0, 0, 1080, 1080);

    if (state.backgroundColor.startsWith('linear')) {
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
      gradient.addColorStop(0, '#FF8C4222');
      gradient.addColorStop(1, '#F4D03F44');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1080);
    }

    for (const el of state.decorElements) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = el.color;
      if (el.rotation) {
        ctx.translate(el.position.x, el.position.y);
        ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.translate(-el.position.x, -el.position.y);
      }
      if (el.type === 'rect') {
        ctx.fillRect(
          el.position.x - el.size.width / 2,
          el.position.y - el.size.height / 2,
          el.size.width,
          el.size.height,
        );
      } else if (el.type === 'circle') {
        ctx.beginPath();
        ctx.arc(el.position.x, el.position.y, el.size.width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (el.type === 'line') {
        ctx.fillRect(
          el.position.x - el.size.width / 2,
          el.position.y - el.size.height / 2,
          el.size.width,
          el.size.height,
        );
      }
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = state.opacity;
    ctx.translate(state.position.x, state.position.y);
    ctx.rotate((state.rotation * Math.PI) / 180);
    ctx.font = `${state.fontSize}px ${state.fontFamily}`;
    ctx.fillStyle = state.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxWidth = 900;
    const chars = (state as ExportState).content.split('');
    const lines: string[] = [];
    let currentLine = '';
    for (const ch of chars) {
      const testLine = currentLine + ch;
      const w = ctx.measureText(testLine).width;
      if (w > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = ch;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = state.fontSize * 1.4;
    const totalHeight = lines.length * lineHeight;
    lines.forEach((line, idx) => {
      const y = -totalHeight / 2 + lineHeight / 2 + idx * lineHeight;
      ctx.fillText(line, 0, y);
    });

    ctx.restore();

    triggerDownload(canvas.toDataURL('image/png'));
    console.log(`导出完成(兜底方案), 耗时: ${performance.now() - startTime}ms`);
  };

  try {
    const canvas = await html2canvas(canvasElement, {
      width: 1080,
      height: 1080,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: state.backgroundColor.startsWith('linear') ? '#FFFFFF' : state.backgroundColor,
      logging: false,
    });

    triggerDownload(canvas.toDataURL('image/png'));
    console.log(`导出完成, 耗时: ${performance.now() - startTime}ms`);
  } catch (err) {
    console.warn('html2canvas导出失败，使用兜底方案:', err);
    fallbackExport();
  }
}

function triggerDownload(dataUrl: string): void {
  const link = document.createElement('a');
  link.download = `文字海报-${Date.now()}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
