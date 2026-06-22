import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { Page, LayoutResult, PageLayout, Annotation } from './types';
import { A4_MM } from './types';

const MM_TO_PT = 2.83465;
const A4_WIDTH_PT = A4_MM.width * MM_TO_PT;
const A4_HEIGHT_PT = A4_MM.height * MM_TO_PT;

export class ExportEngine {
  async exportToPDF(
    pages: Page[],
    layout: LayoutResult,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    const totalPages = pages.length;

    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      const pageLayout = layout.pages[i];

      if (!page || !pageLayout) continue;

      const pdfPage = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);

      pdfPage.drawRectangle({
        x: 0,
        y: 0,
        width: A4_WIDTH_PT,
        height: A4_HEIGHT_PT,
        color: rgb(247 / 255, 243 / 255, 232 / 255)
      });

      const imageCache = new Map<string, Uint8Array>();
      for (const illu of page.illustrations) {
        const imgData = await this.loadImage(illu.imageUrl);
        imageCache.set(illu.id, imgData);
      }

      for (const illuLayout of pageLayout.illustrations) {
        const illu = page.illustrations.find(i => i.id === illuLayout.id);
        if (!illu) continue;

        const imgData = imageCache.get(illu.id);
        if (!imgData) continue;

        try {
          let pdfImage;
          if (illu.imageUrl.startsWith('data:image/png')) {
            pdfImage = await pdfDoc.embedPng(imgData);
          } else {
            pdfImage = await pdfDoc.embedJpg(imgData);
          }

          const { x, y, width, height } = this.convertToPdfCoords(illuLayout, pageLayout);

          pdfPage.drawImage(pdfImage, {
            x,
            y,
            width,
            height
          });
        } catch (e) {
          console.warn('Failed to embed image:', e);
        }
      }

      for (const annotation of page.annotations) {
        await this.drawAnnotation(pdfPage, annotation, pageLayout, helveticaFont, timesRomanFont);
      }

      const pageNumberText = `${i + 1} / ${totalPages}`;
      const pageNumberSize = 12;
      const pageNumberWidth = timesRomanFont.widthOfTextAtSize(pageNumberText, pageNumberSize);

      pdfPage.drawText(pageNumberText, {
        x: (A4_WIDTH_PT - pageNumberWidth) / 2,
        y: 20,
        size: pageNumberSize,
        font: timesRomanFont,
        color: rgb(107 / 255, 91 / 255, 67 / 255)
      });

      if (onProgress) {
        onProgress(((i + 1) / totalPages) * 100);
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const pdfBytes = await pdfDoc.save();
    const buffer = new ArrayBuffer(pdfBytes.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < pdfBytes.length; i++) {
      view[i] = pdfBytes[i];
    }
    return new Blob([view], { type: 'application/pdf' });
  }

  private async loadImage(imageUrl: string): Promise<Uint8Array> {
    if (imageUrl.startsWith('data:')) {
      const base64 = imageUrl.split(',')[1];
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }

    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  private convertToPdfCoords(
    element: { x: number; y: number; width: number; height: number },
    pageLayout: PageLayout
  ): { x: number; y: number; width: number; height: number } {
    const scaleX = A4_WIDTH_PT / pageLayout.width;
    const scaleY = A4_HEIGHT_PT / pageLayout.height;

    return {
      x: element.x * scaleX,
      y: A4_HEIGHT_PT - (element.y + element.height) * scaleY,
      width: element.width * scaleX,
      height: element.height * scaleY
    };
  }

  private async drawAnnotation(
    pdfPage: any,
    annotation: Annotation,
    pageLayout: PageLayout,
    helveticaFont: any,
    timesRomanFont: any
  ): Promise<void> {
    const scaleX = A4_WIDTH_PT / pageLayout.width;
    const scaleY = A4_HEIGHT_PT / pageLayout.height;

    const x = annotation.x * scaleX;
    const y = A4_HEIGHT_PT - annotation.y * scaleY;

    const bubbleWidth = 120;
    const bubbleHeight = 60;
    const cornerRadius = 12;
    const fontSize = 10;

    const adjustedX = Math.max(10, Math.min(A4_WIDTH_PT - bubbleWidth - 10, x - bubbleWidth / 2));
    let adjustedY = y - bubbleHeight - 15;
    if (adjustedY < 10) {
      adjustedY = y + 15;
    }

    pdfPage.drawRectangle({
      x: adjustedX,
      y: adjustedY,
      width: bubbleWidth,
      height: bubbleHeight,
      cornerRadius,
      color: rgb(1, 1, 1),
      borderColor: rgb(212 / 255, 163 / 255, 115 / 255),
      borderWidth: 1,
      dashArray: [3, 3]
    });

    const triangleSize = 10;
    const triangleX = x;
    const isBelow = adjustedY > y;

    if (isBelow) {
      pdfPage.drawPolygon({
        points: [
          { x: triangleX - triangleSize / 2, y: adjustedY },
          { x: triangleX + triangleSize / 2, y: adjustedY },
          { x: triangleX, y: adjustedY - triangleSize }
        ],
        color: rgb(1, 1, 1),
        borderColor: rgb(212 / 255, 163 / 255, 115 / 255),
        borderWidth: 1
      });
    } else {
      pdfPage.drawPolygon({
        points: [
          { x: triangleX - triangleSize / 2, y: adjustedY + bubbleHeight },
          { x: triangleX + triangleSize / 2, y: adjustedY + bubbleHeight },
          { x: triangleX, y: adjustedY + bubbleHeight + triangleSize }
        ],
        color: rgb(1, 1, 1),
        borderColor: rgb(212 / 255, 163 / 255, 115 / 255),
        borderWidth: 1
      });
    }

    const wrappedText = this.wrapText(annotation.text, helveticaFont, fontSize, bubbleWidth - 16);
    wrappedText.slice(0, 4).forEach((line, idx) => {
      pdfPage.drawText(line, {
        x: adjustedX + 8,
        y: adjustedY + bubbleHeight - 12 - idx * (fontSize + 2),
        size: fontSize,
        font: helveticaFont,
        color: rgb(45 / 255, 43 / 255, 38 / 255)
      });
    });

    if (annotation.emotionTag) {
      const tagWidth = 50;
      const tagHeight = 18;
      const tagX = adjustedX + bubbleWidth + 5;
      const tagY = adjustedY + bubbleHeight - tagHeight;

      const colorRgb = this.hexToRgb(annotation.emotionTag.color);

      pdfPage.drawRectangle({
        x: tagX,
        y: tagY,
        width: tagWidth,
        height: tagHeight,
        cornerRadius: 9,
        color: rgb(colorRgb.r / 255, colorRgb.g / 255, colorRgb.b / 255)
      });

      const tagFontSize = 9;
      const tagTextWidth = timesRomanFont.widthOfTextAtSize(annotation.emotionTag.label, tagFontSize);

      pdfPage.drawText(annotation.emotionTag.label, {
        x: tagX + (tagWidth - tagTextWidth) / 2,
        y: tagY + (tagHeight - tagFontSize) / 2,
        size: tagFontSize,
        font: timesRomanFont,
        color: rgb(45 / 255, 43 / 255, 38 / 255)
      });
    }
  }

  private wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
          lines.push(word.substring(0, 15) + '...');
        } else {
          currentLine = word;
        }
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 };
  }

  async renderPageToCanvas(
    page: Page,
    pageLayout: PageLayout,
    canvas: HTMLCanvasElement
  ): Promise<void> {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    canvas.width = pageLayout.width;
    canvas.height = pageLayout.height;

    ctx.fillStyle = '#F7F3E8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const illuLayout of pageLayout.illustrations) {
      const illu = page.illustrations.find(i => i.id === illuLayout.id);
      if (!illu) continue;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = illu.imageUrl;
      });

      ctx.drawImage(img, illuLayout.x, illuLayout.y, illuLayout.width, illuLayout.height);
    }

    for (const annotation of page.annotations) {
      this.renderAnnotationToCanvas(ctx, annotation);
    }
  }

  private renderAnnotationToCanvas(ctx: CanvasRenderingContext2D, annotation: Annotation): void {
    const bubbleWidth = 180;
    const bubbleHeight = 80;
    const cornerRadius = 16;

    const adjustedX = Math.max(10, annotation.x - bubbleWidth / 2);
    let adjustedY = annotation.y - bubbleHeight - 15;
    if (adjustedY < 10) adjustedY = annotation.y + 15;

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#D4A373';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);

    this.roundRect(ctx, adjustedX, adjustedY, bubbleWidth, bubbleHeight, cornerRadius);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#D4A373';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const isBelow = adjustedY > annotation.y;
    if (isBelow) {
      ctx.moveTo(annotation.x - 8, adjustedY);
      ctx.lineTo(annotation.x + 8, adjustedY);
      ctx.lineTo(annotation.x, adjustedY - 12);
    } else {
      ctx.moveTo(annotation.x - 8, adjustedY + bubbleHeight);
      ctx.lineTo(annotation.x + 8, adjustedY + bubbleHeight);
      ctx.lineTo(annotation.x, adjustedY + bubbleHeight + 12);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2D2B26';
    ctx.font = '14px Georgia, serif';
    ctx.textBaseline = 'top';

    const maxWidth = bubbleWidth - 16;
    const words = annotation.text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    lines.slice(0, 4).forEach((line, idx) => {
      ctx.fillText(line, adjustedX + 8, adjustedY + 8 + idx * 18);
    });

    if (annotation.emotionTag) {
      const tagWidth = 60;
      const tagHeight = 24;
      const tagX = adjustedX + bubbleWidth + 8;
      const tagY = adjustedY + bubbleHeight - tagHeight;

      ctx.fillStyle = annotation.emotionTag.color;
      this.roundRect(ctx, tagX, tagY, tagWidth, tagHeight, 12);
      ctx.fill();

      ctx.fillStyle = '#2D2B26';
      ctx.font = '12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(annotation.emotionTag.label, tagX + tagWidth / 2, tagY + tagHeight / 2);
      ctx.textAlign = 'start';
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const exportEngine = new ExportEngine();
