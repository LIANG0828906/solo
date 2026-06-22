import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Table, Guest } from '../types';

export async function exportAsPNG(elementId: string, filename: string = '座位方案.png'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('未找到导出元素');

  const canvas = await html2canvas(element, {
    backgroundColor: '#F9FAFB',
    scale: 2,
    useCORS: true
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function exportAsPDF(tables: Table[], guests: Guest[], filename: string = '座位方案.pdf'): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const guestMap = new Map(guests.map(g => [g.id, g]));

  tables.forEach((table, idx) => {
    if (idx > 0) pdf.addPage();

    pdf.setFillColor(219, 39, 119);
    pdf.rect(0, 0, pageWidth, 30, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`第 ${table.number} 桌`, pageWidth / 2, 20, { align: 'center' });

    const cx = pageWidth / 2;
    const cy = pageHeight / 2;
    const r = 60;

    pdf.setDrawColor(139, 92, 246);
    pdf.setLineWidth(1);
    pdf.setFillColor(253, 242, 248);
    pdf.circle(cx, cy, r, 'FD');

    pdf.setTextColor(219, 39, 119);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(table.number), cx, cy + 8, { align: 'center' });

    table.seats.forEach((guestId, seatIdx) => {
      const angle = (seatIdx / table.seats.length) * Math.PI * 2 - Math.PI / 2;
      const sx = cx + Math.cos(angle) * r;
      const sy = cy + Math.sin(angle) * r;

      pdf.setDrawColor(139, 92, 246);
      pdf.setFillColor(255, 255, 255);
      pdf.setLineWidth(0.5);
      pdf.circle(sx, sy - 3, 8, 'FD');

      if (guestId) {
        const guest = guestMap.get(guestId);
        if (guest) {
          pdf.setFillColor(219, 39, 119);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.text(guest.name, sx, sy + 1, { align: 'center' });
        }
      }
    });

    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`生成时间: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  });

  pdf.save(filename);
}
