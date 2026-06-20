import jsPDF from 'jspdf';
import type { Marker } from '../../stores/useMapStore';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../../stores/useMapStore';

export interface ExportData {
  markers: Marker[];
  mapImageDataUrl?: string;
  title: string;
  exportDate: string;
}

export class ExportManager {
  static async generatePDF(data: ExportData): Promise<Blob> {
    const { markers, mapImageDataUrl, title, exportDate } = data;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`导出日期: ${exportDate}`, margin, 27);

    yPosition = 40;

    if (mapImageDataUrl) {
      try {
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = 80;
        doc.addImage(mapImageDataUrl, 'JPEG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 8;
      } catch (e) {
        console.error('Failed to add map image to PDF:', e);
      }
    }

    doc.setTextColor(26, 26, 46);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('标记地点列表', margin, yPosition);
    yPosition += 8;

    doc.setDrawColor(108, 99, 255);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    if (markers.length === 0) {
      doc.setFontSize(11);
      doc.setTextColor(128, 128, 128);
      doc.text('暂无标记地点', margin, yPosition);
    } else {
      const sortedMarkers = [...markers].sort((a, b) => a.order - b.order);

      for (let i = 0; i < sortedMarkers.length; i++) {
        const marker = sortedMarkers[i];

        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        const color = CATEGORY_COLORS[marker.category];
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        doc.setFillColor(r, g, b);
        doc.circle(margin + 3, yPosition + 2, 3, 'F');

        doc.setTextColor(26, 26, 46);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${i + 1}. ${marker.name}`, margin + 10, yPosition + 4);

        doc.setFontSize(9);
        doc.setTextColor(108, 99, 255);
        doc.setFont('helvetica', 'normal');
        doc.text(CATEGORY_LABELS[marker.category], margin + 10, yPosition + 10);

        if (marker.note) {
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          const splitNote = doc.splitTextToSize(marker.note, pageWidth - margin * 2 - 10);
          doc.text(splitNote, margin + 10, yPosition + 16);
          yPosition += splitNote.length * 5;
        }

        yPosition += 18;

        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.2);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 4;
      }
    }

    if (markers.length >= 2) {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = margin;
      }

      yPosition += 5;
      doc.setTextColor(26, 26, 46);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('路线概览', margin, yPosition);
      yPosition += 6;

      doc.setDrawColor(108, 99, 255);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      const sortedMarkers = [...markers].sort((a, b) => a.order - b.order);
      const routeText = sortedMarkers.map((m, i) => `${i + 1}. ${m.name}`).join(' → ');
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const splitRoute = doc.splitTextToSize(routeText, pageWidth - margin * 2);
      doc.text(splitRoute, margin, yPosition);
    }

    doc.setFillColor(26, 26, 46);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(8);
    doc.text('旅行攻略地图 - 生成您的专属旅行计划', pageWidth / 2, pageHeight - 6, { align: 'center' });

    return doc.output('blob');
  }

  static downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async captureMapScreenshot(mapElement: HTMLElement): Promise<string | null> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const rect = mapElement.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);

      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, rect.width, rect.height);

      const mapTiles = mapElement.querySelectorAll('.leaflet-tile');
      if (mapTiles.length > 0) {
        for (let i = 0; i < Math.min(mapTiles.length, 9); i++) {
          const tile = mapTiles[i] as HTMLImageElement;
          if (tile.complete && tile.src) {
            try {
              const tileRect = tile.getBoundingClientRect();
              const x = tileRect.left - rect.left;
              const y = tileRect.top - rect.top;
              ctx.drawImage(tile, x, y, tileRect.width, tileRect.height);
            } catch (e) {
              // 跳过无法加载的瓦片
            }
          }
        }
      }

      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (e) {
      console.error('Failed to capture map screenshot:', e);
      return null;
    }
  }
}
