import html2canvas from 'html2canvas';
import { LayoutState, CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';

export class ExportService {
  public static async exportToPng(
    canvasElement: HTMLElement,
    _snapshot: LayoutState
  ): Promise<Blob> {
    const originalSelected = canvasElement.querySelector('[data-selected="true"]');
    if (originalSelected) {
      originalSelected.setAttribute('data-selected', 'false');
    }

    const handles = canvasElement.querySelectorAll('[data-handle="true"]');
    const handleVisibility: string[] = [];
    handles.forEach((h) => {
      handleVisibility.push((h as HTMLElement).style.display);
      (h as HTMLElement).style.display = 'none';
    });

    try {
      const scale = 2;
      const canvas = await html2canvas(canvasElement, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        windowWidth: CANVAS_WIDTH * 2,
        windowHeight: CANVAS_HEIGHT * 2,
      });

      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('生成图片失败'));
            }
          },
          'image/png',
          1.0
        );
      });
    } finally {
      if (originalSelected) {
        originalSelected.setAttribute('data-selected', 'true');
      }
      handles.forEach((h, i) => {
        if (handleVisibility[i] !== undefined) {
          (h as HTMLElement).style.display = handleVisibility[i];
        }
      });
    }
  }

  public static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  public static generateFilename(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `PosterCraft_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
      now.getDate()
    )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.png`;
  }
}
