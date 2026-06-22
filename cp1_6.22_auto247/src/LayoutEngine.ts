import type { Page, LayoutMode, LayoutResult, PageLayout, IllustrationLayout } from './types';
import { A4_MM, DPI_300 } from './types';

const MM_TO_INCH = 1 / 25.4;
const SCREEN_DPI = 96;

export class LayoutEngine {
  readonly A4_WIDTH_MM: number = A4_MM.width;
  readonly A4_HEIGHT_MM: number = A4_MM.height;

  get A4_WIDTH_PX(): number {
    return this.mmToPx(this.A4_WIDTH_MM);
  }

  get A4_HEIGHT_PX(): number {
    return this.mmToPx(this.A4_HEIGHT_MM);
  }

  get A4_WIDTH_300DPI(): number {
    return Math.round(this.A4_WIDTH_MM * MM_TO_INCH * DPI_300);
  }

  get A4_HEIGHT_300DPI(): number {
    return Math.round(this.A4_HEIGHT_MM * MM_TO_INCH * DPI_300);
  }

  private mmToPx(mm: number): number {
    return Math.round(mm * MM_TO_INCH * SCREEN_DPI);
  }

  calculateLayout(
    pages: Page[],
    mode: LayoutMode,
    containerWidth?: number
  ): LayoutResult {
    let pageWidth: number;
    let pageHeight: number;

    if (containerWidth) {
      pageWidth = containerWidth;
      pageHeight = Math.round(containerWidth * (this.A4_HEIGHT_MM / this.A4_WIDTH_MM));
    } else {
      pageWidth = this.A4_WIDTH_PX;
      pageHeight = this.A4_HEIGHT_PX;
    }

    const pageLayouts: PageLayout[] = pages.map((page) => {
      return {
        pageNumber: page.pageNumber,
        illustrations: this.calculateIllustrationLayouts(
          page.illustrations,
          mode,
          pageWidth,
          pageHeight
        ),
        width: pageWidth,
        height: pageHeight
      };
    });

    return {
      pages: pageLayouts,
      pageWidth,
      pageHeight
    };
  }

  private calculateIllustrationLayouts(
    illustrations: { id: string; originalWidth: number; originalHeight: number }[],
    mode: LayoutMode,
    pageWidth: number,
    pageHeight: number
  ): IllustrationLayout[] {
    const layouts: IllustrationLayout[] = [];
    const padding = Math.round(pageWidth * 0.05);
    const contentWidth = pageWidth - padding * 2;
    const contentHeight = pageHeight - padding * 2;

    if (illustrations.length === 0) return layouts;

    switch (mode) {
      case 'single':
        layouts.push(this.calculateSingleLayout(illustrations[0], contentWidth, contentHeight, padding));
        break;

      case 'double':
        const doubleWidth = Math.round(contentWidth * 0.45);
        const gap = Math.round(contentWidth * 0.05);
        illustrations.slice(0, 2).forEach((ill, index) => {
          const x = padding + index * (doubleWidth + gap);
          layouts.push({
            id: ill.id,
            x,
            y: padding,
            width: doubleWidth,
            height: Math.round(doubleWidth * (ill.originalHeight / ill.originalWidth))
          });
        });
        this.centerVertically(layouts, contentHeight, padding);
        break;

      case 'triple':
        const tripleWidth = Math.round(contentWidth * 0.3);
        const tripleGap = Math.round(contentWidth * 0.05);
        illustrations.slice(0, 3).forEach((ill, index) => {
          const x = padding + index * (tripleWidth + tripleGap);
          layouts.push({
            id: ill.id,
            x,
            y: padding,
            width: tripleWidth,
            height: Math.round(tripleWidth * (ill.originalHeight / ill.originalWidth))
          });
        });
        this.centerVertically(layouts, contentHeight, padding);
        break;
    }

    return layouts;
  }

  private calculateSingleLayout(
    illustration: { id: string; originalWidth: number; originalHeight: number },
    contentWidth: number,
    contentHeight: number,
    padding: number
  ): IllustrationLayout {
    const maxWidth = Math.round(contentWidth * 0.9);
    const maxHeight = Math.round(contentHeight * 0.9);

    let width = maxWidth;
    let height = Math.round(width * (illustration.originalHeight / illustration.originalWidth));

    if (height > maxHeight) {
      height = maxHeight;
      width = Math.round(height * (illustration.originalWidth / illustration.originalHeight));
    }

    const x = padding + Math.round((contentWidth - width) / 2);
    const y = padding + Math.round((contentHeight - height) / 2);

    return {
      id: illustration.id,
      x,
      y,
      width,
      height
    };
  }

  private centerVertically(layouts: IllustrationLayout[], contentHeight: number, padding: number): void {
    if (layouts.length === 0) return;

    const maxHeight = Math.max(...layouts.map(l => l.height));
    const yOffset = padding + Math.round((contentHeight - maxHeight) / 2);

    layouts.forEach(layout => {
      layout.y = yOffset + Math.round((maxHeight - layout.height) / 2);
    });
  }

  getLayoutModeLabel(mode: LayoutMode): string {
    const labels: Record<LayoutMode, string> = {
      single: '单页满版',
      double: '双页并排',
      triple: '三页拼版'
    };
    return labels[mode];
  }

  getIllustrationsPerPage(mode: LayoutMode): number {
    return mode === 'single' ? 1 : mode === 'double' ? 2 : 3;
  }

  calculateExportLayout(
    pages: Page[],
    mode: LayoutMode
  ): LayoutResult {
    return this.calculateLayout(pages, mode, this.A4_WIDTH_300DPI);
  }
}

export const layoutEngine = new LayoutEngine();
