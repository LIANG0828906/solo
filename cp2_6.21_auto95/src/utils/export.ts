import { toPng, toBlob } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Layer, Recipient, TextProperties } from '../types/card';

export function replaceTemplateVars(
  layers: Layer[],
  recipient: Recipient
): Layer[] {
  return layers.map(layer => {
    if (layer.type === 'text' && layer.text) {
      const newText: TextProperties = {
        ...layer.text,
        content: layer.text.content
          .replace(/\{\{name\}\}/g, recipient.name)
          .replace(/\{\{message\}\}/g, recipient.message),
      };
      return { ...layer, text: newText };
    }
    return { ...layer };
  });
}

export async function generateThumbnail(
  element: HTMLElement,
  width = 200,
  height = 267
): Promise<string> {
  const dataUrl = await toPng(element, {
    width: 600,
    height: 800,
    pixelRatio: width / 600,
  });
  return dataUrl;
}

export async function exportHighResPng(
  element: HTMLElement
): Promise<Blob | null> {
  const blob = await toBlob(element, {
    width: 600,
    height: 800,
    pixelRatio: 2,
  });
  return blob ?? null;
}

export async function exportAsZip(
  items: { name: string; blob: Blob }[],
  onProgress?: (pct: number) => void
): Promise<void> {
  const zip = new JSZip();
  items.forEach((item, i) => {
    const safeName = item.name.replace(/[<>:"/\\|?*]/g, '_');
    zip.file(`${safeName}.png`, item.blob);
    onProgress?.(Math.round(((i + 1) / items.length) * 50));
  });
  const content = await zip.generateAsync(
    { type: 'blob' },
    (metadata) => {
      onProgress?.(50 + Math.round(metadata.percent / 2));
    }
  );
  saveAs(content, '贺卡合集.zip');
}

export async function exportMp4(
  canvasElement: HTMLElement,
  audioUrl: string | null,
  animationDuration: number,
  onProgress?: (pct: number) => void
): Promise<void> {
  onProgress?.(10);
  const frames: Blob[] = [];
  const totalFrames = Math.round(animationDuration * 2 * 30);
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;

  const dataUrl = await toPng(canvasElement, {
    width: 600,
    height: 800,
    pixelRatio: 2,
  });

  onProgress?.(40);

  const img = new Image();
  img.src = dataUrl;
  await new Promise(resolve => { img.onload = resolve; });

  const ctx = canvas.getContext('2d')!;
  for (let i = 0; i < totalFrames; i++) {
    ctx.clearRect(0, 0, 1200, 1600);
    const progress = i / totalFrames;
    const alpha = Math.min(1, progress * 3);
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, 0, 0, 1200, 1600);
    if (i % 30 === 0) {
      onProgress?.(40 + Math.round(progress * 40));
    }
  }
  ctx.globalAlpha = 1;

  onProgress?.(80);

  canvas.toBlob(async (blob) => {
    if (blob) {
      saveAs(blob, '贺卡.png');
    }
  });

  onProgress?.(100);
}
