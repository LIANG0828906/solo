import { toPng } from 'html-to-image';
import type { MindMapNode } from '@/types/mindMap';

export function downloadJSON(
  nodes: Record<string, MindMapNode>,
  rootId: string
): void {
  const data = {
    rootId,
    nodes,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mindmap-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadPNG(element: HTMLElement): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      backgroundColor: '#ffffff',
      pixelRatio: 2,
      cacheBust: true,
      style: {
        transform: 'none',
      },
    });
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `mindmap-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to export PNG:', error);
    throw error;
  }
}
