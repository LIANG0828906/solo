import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { useNavigationStore } from '@/store/useNavigationStore';
import { formatTimestamp } from '@/utils/mathUtils';
import { COLORS } from '@/utils/constants';

export function usePDFExport() {
  const logEntries = useNavigationStore((state) => state.logEntries);

  const exportToPDF = async () => {
    if (logEntries.length === 0) {
      return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    const imagesPerPage = 2;

    const imgWidth = contentWidth;
    const imgHeight = (contentWidth * 9) / 16;
    const titleHeight = 10;
    const timestampHeight = 7;
    const spacing = 8;

    const entriesPerPage = imagesPerPage;
    const totalPages = Math.ceil(logEntries.length / entriesPerPage);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(11, 22, 40);
      pdf.text('航海日志', pageWidth / 2, margin, { align: 'center' });

      const startY = margin + 15;

      for (let i = 0; i < entriesPerPage; i++) {
        const entryIndex = page * entriesPerPage + i;
        if (entryIndex >= logEntries.length) break;

        const entry = logEntries[entryIndex];
        const entryY = startY + i * (imgHeight + titleHeight + timestampHeight + spacing * 2);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(10, 42, 58);
        pdf.text(entry.description || '航海记录', margin, entryY);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(formatTimestamp(entry.timestamp), margin, entryY + timestampHeight);

        const imgY = entryY + timestampHeight + spacing;
        await pdf.addImage(
          entry.dataUrl,
          'JPEG',
          margin,
          imgY,
          imgWidth,
          imgHeight
        );
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`第 ${page + 1} / ${totalPages} 页`, pageWidth / 2, pageHeight - margin, { align: 'center' });
    }

    const fileName = `航海日志_${formatTimestamp(Date.now())}.pdf`;
    const pdfBlob = pdf.output('blob');
    saveAs(pdfBlob, fileName);
  };

  return {
    exportToPDF,
    canExport: logEntries.length > 0,
  };
}
