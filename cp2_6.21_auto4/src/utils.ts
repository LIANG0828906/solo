import type { Magazine } from './types';
import { CANVAS_ASPECT } from './types';

export function exportMagazineToJson(magazine: Magazine): void {
  const json = JSON.stringify(magazine, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${magazine.name || 'magazine'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importMagazineFromJson(): Promise<Magazine> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('未选择文件'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string) as Magazine;
          resolve(data);
        } catch {
          reject(new Error('JSON 解析失败'));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    };
    input.click();
  });
}

export function generateCoverThumbnail(magazine: Magazine): void {
  const width = 400;
  const height = Math.round(width * CANVAS_ASPECT);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const coverPage = magazine.pages.find((p) => p.id === magazine.coverPageId);
  if (coverPage) {
    const scaleX = width / 595;
    const scaleY = height / 842;
    const sorted = [...coverPage.elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const el of sorted) {
      ctx.save();
      const cx = (el.x + el.width / 2) * scaleX;
      const cy = (el.y + el.height / 2) * scaleY;
      ctx.translate(cx, cy);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);

      if (el.type === 'rect' && el.fillColor) {
        ctx.fillStyle = el.fillColor;
        ctx.fillRect(el.x * scaleX, el.y * scaleY, el.width * scaleX, el.height * scaleY);
      } else if (el.type === 'text' && el.content) {
        ctx.fillStyle = el.color || '#000000';
        ctx.font = `bold ${Math.max((el.fontSize || 16) * scaleX, 10)}px ${el.fontFamily || 'Noto Serif SC'}`;
        ctx.textBaseline = 'top';
        const lines = el.content.split('\n');
        const lineHeight = Math.max((el.fontSize || 16) * scaleX, 10) * 1.3;
        lines.forEach((line, i) => {
          ctx.fillText(line, el.x * scaleX, el.y * scaleY + i * lineHeight);
        });
      } else if (el.type === 'image' && el.src) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = el.src;
          ctx.drawImage(img, el.x * scaleX, el.y * scaleY, el.width * scaleX, el.height * scaleY);
        } catch { /* skip failed images */ }
      }
      ctx.restore();
    }
  }

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, width, height * 0.25);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Noto Serif SC, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(magazine.name, width / 2, height * 0.1);
  ctx.font = '16px Noto Serif SC, serif';
  ctx.fillText(magazine.author, width / 2, height * 0.18);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${magazine.name || 'magazine'}_cover.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
