import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { ExportResolution, ExportFormat, CanvasSnapshot } from '../../types';
import { CanvasManager } from '../canvas/CanvasManager';
import { useCanvasStore } from '../../store/useCanvasStore';

export class ExportManager {
  static async export(
    canvasElement: HTMLElement,
    resolution: ExportResolution,
    format: ExportFormat
  ): Promise<void> {
    const setProgress = useCanvasStore.getState().setExportProgress;
    setProgress(0);

    const scale = resolution === '2160' ? 2.7 : 1.35;
    const snapshot: CanvasSnapshot = CanvasManager.getSnapshot();

    await new Promise((r) => setTimeout(r, 100));
    setProgress(15);

    const useWhiteBg = format === 'png-white' || format === 'pdf';
    const canvas = await html2canvas(canvasElement, {
      backgroundColor: useWhiteBg ? '#FFFFFF' : null,
      scale,
      useCORS: true,
      logging: false,
      width: 800,
      height: 600,
    });
    setProgress(60);

    await new Promise((r) => setTimeout(r, 100));
    setProgress(80);

    if (format === 'pdf') {
      ExportManager.downloadPDF(canvas, snapshot);
    } else {
      ExportManager.downloadPNG(canvas);
    }

    setProgress(100);
    await new Promise((r) => setTimeout(r, 300));
  }

  private static downloadPNG(canvas: HTMLCanvasElement): void {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `pixel-collage-${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private static downloadPDF(canvas: HTMLCanvasElement, _snapshot: CanvasSnapshot): void {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const y = (pageHeight - imgHeight) / 2;
    pdf.addImage(imgData, 'PNG', 10, y, imgWidth, imgHeight);
    pdf.save(`pixel-collage-${Date.now()}.pdf`);
  }

  static async runWithProgress(
    canvasElement: HTMLElement,
    resolution: ExportResolution,
    format: ExportFormat,
    onProgress: (p: number) => void
  ): Promise<void> {
    const duration = 1500;
    const start = Date.now();
    const actualExport = ExportManager.export(canvasElement, resolution, format);
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(95, (elapsed / duration) * 100);
      onProgress(progress);
      if (elapsed < duration) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
    await actualExport;
    onProgress(100);
  }
}
