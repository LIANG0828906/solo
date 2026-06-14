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

export function exportPdf(data: ExportMetadata): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const headerHeight = 20;
  const footerHeight = 12;

  const cols = 4;
  const rows = 2;
  const cardsPerPage = cols * rows;
  const totalPanels = data.panels.length;
  const totalPages = Math.max(1, Math.ceil(totalPanels / cardsPerPage));

  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - headerHeight - footerHeight - margin * 2;
  const cardWidth = (usableWidth - (cols - 1) * 4) / cols;
  const cardHeight = (usableHeight - (rows - 1) * 4) / rows;

  let panelIndex = 0;

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage();

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, headerHeight - 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title || '未命名故事', margin + 2, headerHeight - 10);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(196, 181, 253);
    const dateStr = new Date(data.createdAt).toLocaleDateString('zh-CN');
    doc.text(dateStr, pageWidth - margin - 2, headerHeight - 10, { align: 'right' });

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `参与者: ${data.participants.join('、') || '匿名'}`,
      pageWidth / 2,
      headerHeight - 3,
      { align: 'center' }
    );

    for (let i = 0; i < cardsPerPage && panelIndex < totalPanels; i++, panelIndex++) {
      const panel = data.panels[panelIndex];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = margin + col * (cardWidth + 4);
      const y = headerHeight + margin + row * (cardHeight + 4);

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'S');

      doc.setFillColor(30, 41, 59);
      doc.rect(x, y, cardWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`#${String(panel.sceneNumber).padStart(2, '0')}`, x + 2, y + 5.5);

      const shotColors: Record<string, [number, number, number]> = {
        远景: [254, 243, 199],
        全景: [209, 250, 229],
        中景: [219, 234, 254],
        近景: [252, 231, 243],
        特写: [254, 226, 226],
      };
      const c = shotColors[panel.shotType] || [241, 245, 249];
      doc.setFillColor(c[0], c[1], c[2]);
      doc.rect(x + cardWidth - 16, y + 1.5, 14.5, 5, 'F');
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(7);
      doc.text(panel.shotType, x + cardWidth - 8.75, y + 5, { align: 'center' });

      const previewY = y + 9;
      const previewH = cardHeight * 0.45;
      doc.setFillColor(241, 245, 249);
      doc.rect(x + 2, previewY, cardWidth - 4, previewH, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.setLineDashPattern([1, 1], 0);
      doc.rect(x + 2, previewY, cardWidth - 4, previewH, 'S');
      doc.setLineDashPattern([], 0);
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text('画面预览区', x + cardWidth / 2, previewY + previewH / 2 + 1, { align: 'center' });

      const descY = previewY + previewH + 2;
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text('画面:', x + 2, descY + 3);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(panel.description, cardWidth - 10);
      doc.setTextColor(51, 65, 85);
      doc.text(descLines.slice(0, 2).join('\n'), x + 8, descY + 3);

      if (panel.dialogue) {
        const dlY = descY + 10;
        doc.setFillColor(245, 243, 255);
        doc.rect(x + 2, dlY, cardWidth - 4, cardHeight - (dlY - y) - 2, 'F');
        doc.setTextColor(124, 58, 237);
        doc.setFontSize(7);
        const dLines = doc.splitTextToSize('\u{1F4AC} ' + panel.dialogue, cardWidth - 7);
        doc.text(dLines.slice(0, 2).join('\n'), x + 3.5, dlY + 3.5);
      }
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - footerHeight, pageWidth - margin, pageHeight - footerHeight);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text(
      `第 ${page + 1} / ${totalPages} 页`,
      pageWidth / 2,
      pageHeight - 4,
      { align: 'center' }
    );
    doc.text('Generated by Storyboard Studio', margin, pageHeight - 4);
  }

  doc.save(`${data.title || 'storyboard'}_${Date.now()}.pdf`);
}
