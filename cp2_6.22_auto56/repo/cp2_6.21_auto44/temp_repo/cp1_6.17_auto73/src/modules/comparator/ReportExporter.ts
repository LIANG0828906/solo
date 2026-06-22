import { jsPDF } from 'jspdf';
import { Annotation, DiffPixel } from '../../store/reviewStore';

interface ExportParams {
  leftCanvasRef: HTMLCanvasElement | null;
  rightCanvasRef: HTMLCanvasElement | null;
  annotations: Annotation[];
  diffPixels: DiffPixel[];
  diffPercentage: number;
}

const A4_WIDTH = 210;
const A4_HEIGHT = 297;
const MARGIN = 20;
const CONTENT_WIDTH = A4_WIDTH - MARGIN * 2;

export async function exportReport(params: ExportParams): Promise<void> {
  const { leftCanvasRef, rightCanvasRef, annotations, diffPixels, diffPercentage } = params;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let yPos = MARGIN;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('UI 草图对比评审报告', MARGIN, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`生成时间：${new Date().toLocaleString()}`, MARGIN, yPos);
  yPos += 6;
  doc.text(`差异像素数：${diffPixels.length.toLocaleString()} (${diffPercentage.toFixed(2)}%)`, MARGIN, yPos);
  yPos += 12;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('草图对比', MARGIN, yPos);
  yPos += 8;

  const thumbWidth = (CONTENT_WIDTH - 10) / 2;
  const thumbHeight = thumbWidth * 0.75;

  if (leftCanvasRef) {
    const leftDataUrl = leftCanvasRef.toDataURL('image/png');
    doc.addImage(leftDataUrl, 'PNG', MARGIN, yPos, thumbWidth, thumbHeight);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('左侧草图', MARGIN, yPos + thumbHeight + 5);
  }

  if (rightCanvasRef) {
    const rightDataUrl = rightCanvasRef.toDataURL('image/png');
    doc.addImage(rightDataUrl, 'PNG', MARGIN + thumbWidth + 10, yPos, thumbWidth, thumbHeight);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('右侧草图', MARGIN + thumbWidth + 10, yPos + thumbHeight + 5);
  }

  yPos += thumbHeight + 15;

  if (yPos > A4_HEIGHT - MARGIN - 40) {
    doc.addPage();
    yPos = MARGIN;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`差异批注详情（共 ${annotations.length} 项）`, MARGIN, yPos);
  yPos += 10;

  const sortedAnnotations = [...annotations].sort((a, b) => a.createdAt - b.createdAt);

  const CROP_W = 120;
  const CROP_H = 80;
  const CROP_DISPLAY_W = 40;
  const CROP_DISPLAY_H = 27;

  for (let i = 0; i < sortedAnnotations.length; i++) {
    const ann = sortedAnnotations[i];

    if (yPos > A4_HEIGHT - MARGIN - 50) {
      doc.addPage();
      yPos = MARGIN;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`#${ann.order}`, MARGIN, yPos);
    yPos += 6;

    if (rightCanvasRef) {
      try {
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = CROP_W;
        cropCanvas.height = CROP_H;
        const cropCtx = cropCanvas.getContext('2d')!;

        const scaleX = rightCanvasRef.width / 100;
        const scaleY = rightCanvasRef.height / 100;

        const sx = Math.max(0, ann.x * scaleX - CROP_W / 2);
        const sy = Math.max(0, ann.y * scaleY - CROP_H / 2);
        const actualW = Math.min(CROP_W, rightCanvasRef.width - sx);
        const actualH = Math.min(CROP_H, rightCanvasRef.height - sy);

        cropCtx.fillStyle = '#FFFFFF';
        cropCtx.fillRect(0, 0, CROP_W, CROP_H);
        cropCtx.drawImage(
          rightCanvasRef,
          sx, sy, actualW, actualH,
          0, 0, actualW, actualH
        );

        const markerX = (ann.x * scaleX) - sx;
        const markerY = (ann.y * scaleY) - sy;

        cropCtx.beginPath();
        cropCtx.arc(markerX, markerY, 6, 0, Math.PI * 2);
        cropCtx.fillStyle = '#FF0000';
        cropCtx.fill();
        cropCtx.strokeStyle = '#FFFFFF';
        cropCtx.lineWidth = 2;
        cropCtx.stroke();
        cropCtx.fillStyle = '#FFFFFF';
        cropCtx.font = 'bold 8px Arial';
        cropCtx.textAlign = 'center';
        cropCtx.textBaseline = 'middle';
        cropCtx.fillText(String(ann.order), markerX, markerY);

        const cropDataUrl = cropCanvas.toDataURL('image/png');
        doc.addImage(cropDataUrl, 'PNG', MARGIN, yPos, CROP_DISPLAY_W, CROP_DISPLAY_H);
      } catch (e) {
        console.warn('Crop failed:', e);
      }
    }

    const textX = MARGIN + CROP_DISPLAY_W + 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const lines = doc.splitTextToSize(ann.text, CONTENT_WIDTH - CROP_DISPLAY_W - 12);
    doc.text(lines, textX, yPos + 4);

    doc.setFontSize(9);
    doc.setTextColor(136, 136, 136);
    doc.text(
      `识别时间：${new Date(ann.createdAt).toLocaleString()}`,
      textX,
      yPos + CROP_DISPLAY_H - 2
    );
    doc.setTextColor(0, 0, 0);

    yPos += CROP_DISPLAY_H + 8;
    doc.setLineWidth(0.2);
    doc.setDrawColor(224, 224, 224);
    doc.line(MARGIN, yPos, MARGIN + CONTENT_WIDTH, yPos);
    yPos += 6;
  }

  const fileName = `ui-diff-report-${Date.now()}.pdf`;
  doc.save(fileName);
}
