import { StoryboardPanel, ExportMetadata } from '../../types';
import jsPDF from 'jspdf';

export function buildExportData(
  title: string,
  participants: string[],
  panels: StoryboardPanel[]
): ExportMetadata {
  return {
    title,
    createdAt: new Date().toISOString(),
    participants,
    panels,
  };
}

export function exportJson(data: ExportMetadata): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.title || 'storyboard'}_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const SHOT_COLORS: Record<string, [number, number, number]> = {
  远景: [254, 243, 199],
  全景: [209, 250, 229],
  中景: [219, 234, 254],
  近景: [252, 231, 243],
  特写: [254, 226, 226],
};

function truncateText(doc: jsPDF, text: string, maxWidth: number, maxLines: number): string {
  const lines = doc.splitTextToSize(text, maxWidth);
  if (lines.length <= maxLines) return lines.join('\n');
  const truncated = lines.slice(0, maxLines);
  const lastLine = truncated[truncated.length - 1];
  if (lastLine.length > 3) {
    truncated[truncated.length - 1] = lastLine.slice(0, -2) + '…';
  }
  return truncated.join('\n');
}

function drawCard(
  doc: jsPDF,
  panel: StoryboardPanel,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 2, 2, 'S');

  const headerH = 7;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(x, y, width, headerH, 2, 2, 'F');
  doc.rect(x, y + headerH - 2, width, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${String(panel.sceneNumber).padStart(2, '0')}`, x + 2.5, y + 4.8);

  const shotColor = SHOT_COLORS[panel.shotType] || [241, 245, 249];
  const shotLabelW = 16;
  const shotLabelX = x + width - shotLabelW - 2;
  doc.setFillColor(shotColor[0], shotColor[1], shotColor[2]);
  doc.roundedRect(shotLabelX, y + 1.2, shotLabelW, 4.5, 1, 1, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(6.5);
  doc.text(panel.shotType, shotLabelX + shotLabelW / 2, y + 4, { align: 'center' });

  const previewY = y + headerH + 1.5;
  const previewH = height * 0.32;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(x + 2, previewY, width - 4, previewH, 1.5, 1.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([0.5, 0.5], 0);
  doc.roundedRect(x + 2, previewY, width - 4, previewH, 1.5, 1.5, 'S');
  doc.setLineDashPattern([], 0);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('画面预览区', x + width / 2, previewY + previewH / 2 + 1.5, { align: 'center' });

  const descY = previewY + previewH + 2;
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('画面描述', x + 2.5, descY + 2);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const descText = truncateText(doc, panel.description, width - 5, 2);
  doc.text(descText, x + 2.5, descY + 5);

  if (panel.dialogue) {
    const dlY = descY + 11;
    const dlH = height - (dlY - y) - 2;
    doc.setFillColor(245, 243, 255);
    doc.roundedRect(x + 2, dlY, width - 4, dlH, 1.5, 1.5, 'F');
    doc.setTextColor(124, 58, 237);
    doc.setFontSize(6.5);
    const dlText = truncateText(doc, '💬 ' + panel.dialogue, width - 7, 2);
    doc.text(dlText, x + 3.5, dlY + 4);
  }
}

function drawHeader(doc: jsPDF, pageWidth: number, data: ExportMetadata): void {
  const headerHeight = 22;

  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  doc.setFillColor(139, 92, 246);
  doc.rect(0, headerHeight - 2, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title || '未命名故事', 10, 10);

  const dateStr = new Date(data.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(196, 181, 253);
  doc.text(dateStr, pageWidth - 10, 10, { align: 'right' });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text(
    `参与者: ${data.participants.join('、') || '匿名'}`,
    pageWidth / 2,
    17,
    { align: 'center' }
  );
}

function drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number, currentPage: number, totalPages: number): void {
  const footerY = pageHeight - 10;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(10, footerY - 3, pageWidth - 10, footerY - 3);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  doc.text('Storyboard Studio · 分镜脚本', 10, footerY);
  doc.text(`第 ${currentPage} / ${totalPages} 页`, pageWidth / 2, footerY, { align: 'center' });

  const now = new Date().toLocaleDateString('zh-CN');
  doc.text(`导出时间: ${now}`, pageWidth - 10, footerY, { align: 'right' });
}

export function exportPdf(data: ExportMetadata): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const headerHeight = 22;
  const footerHeight = 12;
  const margin = 10;
  const contentTop = headerHeight + margin;
  const contentBottom = pageHeight - footerHeight - margin;
  const contentHeight = contentBottom - contentTop;
  const contentWidth = pageWidth - margin * 2;

  const cols = 4;
  const rows = 3;
  const cardsPerPage = cols * rows;
  const totalPanels = data.panels.length;
  const totalPages = Math.max(1, Math.ceil(totalPanels / cardsPerPage));

  const gapX = 4;
  const gapY = 5;
  const cardWidth = (contentWidth - (cols - 1) * gapX) / cols;
  const cardHeight = (contentHeight - (rows - 1) * gapY) / rows;

  let panelIndex = 0;

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage();

    drawHeader(doc, pageWidth, data);

    for (let i = 0; i < cardsPerPage && panelIndex < totalPanels; i++, panelIndex++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = margin + col * (cardWidth + gapX);
      const y = contentTop + row * (cardHeight + gapY);

      drawCard(doc, data.panels[panelIndex], x, y, cardWidth, cardHeight);
    }

    drawFooter(doc, pageWidth, pageHeight, page + 1, totalPages);
  }

  doc.save(`${data.title || 'storyboard'}_分镜脚本_${Date.now()}.pdf`);
}
