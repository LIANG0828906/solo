import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DataService } from '@/services/DataService';
import { ResumeData } from '@/types/resume';

export const PDFService = {
  async exportToPDF(
    resumeData: ResumeData,
    canvasElement: HTMLElement,
    onProgress: (progress: number) => void
  ): Promise<void> {
    onProgress(10);

    const backendAvailable = await DataService.checkBackendHealth();

    if (backendAvailable) {
      try {
        onProgress(30);
        const blob = await DataService.exportResume(resumeData);
        onProgress(90);
        downloadBlob(blob, 'resume.pdf');
        onProgress(100);
        return;
      } catch (error) {
        console.warn('后端导出失败，使用前端降级方案', error);
      }
    }

    await exportWithFrontend(canvasElement, onProgress);
  },
};

async function exportWithFrontend(
  canvasElement: HTMLElement,
  onProgress: (progress: number) => void
): Promise<void> {
  onProgress(20);

  const canvas = await html2canvas(canvasElement, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
  });

  onProgress(60);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
  const imgX = (pdfWidth - imgWidth * ratio) / 2;
  const imgY = 0;

  pdf.addImage(
    imgData,
    'PNG',
    imgX,
    imgY,
    imgWidth * ratio,
    imgHeight * ratio
  );

  onProgress(90);
  pdf.save('resume.pdf');
  onProgress(100);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
