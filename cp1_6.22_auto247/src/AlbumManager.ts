import { v4 as uuidv4 } from 'uuid';
import type { Page, Illustration, Annotation, LayoutMode, EmotionTag } from './types';

type Subscriber = () => void;

export class AlbumManager {
  private pages: Page[] = [];
  private layoutMode: LayoutMode = 'single';
  private subscribers: Set<Subscriber> = new Set();
  private projectName: string = '我的插画画册';

  constructor() {
    this.initializeWithSampleData();
  }

  private initializeWithSampleData(): void {
    const placeholderColors = [
      '#E8D5C4', '#D4A373', '#C9B99C', '#B8A88A', '#A69076',
      '#9C8B7A', '#8B7355', '#7A6548', '#6B5639', '#5A472C',
      '#E5D4BD', '#D9C4A8', '#CDB493', '#C1A47E', '#B59469',
      '#A98454', '#9D743F', '#91642A', '#855415', '#794400'
    ];

    for (let i = 0; i < 6; i++) {
      const illustration: Illustration = {
        id: uuidv4(),
        imageUrl: this.createPlaceholderImage(800, 600, placeholderColors[i], `插画 ${i + 1}`),
        originalWidth: 800,
        originalHeight: 600
      };

      const page: Page = {
        id: uuidv4(),
        pageNumber: i + 1,
        illustrations: [illustration],
        annotations: []
      };

      this.pages.push(page);
    }
    this.notifySubscribers();
  }

  private createPlaceholderImage(width: number, height: number, color: string, text: string): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + width / 2, height);
      ctx.stroke();
    }

    for (let i = 0; i < height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i + height / 2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 48px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);

    ctx.font = '24px Georgia, serif';
    ctx.fillText(`${width} × ${height}px`, width / 2, height / 2 + 50);

    return canvas.toDataURL('image/png');
  }

  getProjectName(): string {
    return this.projectName;
  }

  setProjectName(name: string): void {
    this.projectName = name;
    this.notifySubscribers();
  }

  getPages(): Page[] {
    return [...this.pages];
  }

  getLayoutMode(): LayoutMode {
    return this.layoutMode;
  }

  setLayoutMode(mode: LayoutMode): void {
    this.layoutMode = mode;
    this.reorganizePagesByLayout();
    this.notifySubscribers();
  }

  private reorganizePagesByLayout(): void {
    const allIllustrations: Illustration[] = [];
    this.pages.forEach(page => {
      allIllustrations.push(...page.illustrations);
    });

    const perPage = this.layoutMode === 'single' ? 1 : this.layoutMode === 'double' ? 2 : 3;
    const newPages: Page[] = [];

    for (let i = 0; i < allIllustrations.length; i += perPage) {
      const pageIllustrations = allIllustrations.slice(i, i + perPage);
      const originalPage = this.pages[Math.floor(i / perPage)];
      newPages.push({
        id: originalPage?.id || uuidv4(),
        pageNumber: Math.floor(i / perPage) + 1,
        illustrations: pageIllustrations,
        annotations: originalPage?.annotations || []
      });
    }

    this.pages = newPages;
  }

  addIllustration(imageUrl?: string, width: number = 800, height: number = 600): boolean {
    if (this.pages.length >= 20) {
      return false;
    }

    const perPage = this.layoutMode === 'single' ? 1 : this.layoutMode === 'double' ? 2 : 3;
    const lastPage = this.pages[this.pages.length - 1];
    const needsNewPage = !lastPage || lastPage.illustrations.length >= perPage;

    const illustration: Illustration = {
      id: uuidv4(),
      imageUrl: imageUrl || this.createPlaceholderImage(width, height, '#D4A373', `插画 ${this.getTotalIllustrations() + 1}`),
      originalWidth: width,
      originalHeight: height
    };

    if (needsNewPage) {
      const newPage: Page = {
        id: uuidv4(),
        pageNumber: this.pages.length + 1,
        illustrations: [illustration],
        annotations: []
      };
      this.pages.push(newPage);
    } else {
      lastPage.illustrations.push(illustration);
    }

    this.notifySubscribers();
    return true;
  }

  private getTotalIllustrations(): number {
    return this.pages.reduce((sum, page) => sum + page.illustrations.length, 0);
  }

  removeIllustration(illustrationId: string): void {
    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      const illuIndex = page.illustrations.findIndex(ill => ill.id === illustrationId);
      if (illuIndex !== -1) {
        page.illustrations.splice(illuIndex, 1);
        if (page.illustrations.length === 0) {
          this.pages.splice(i, 1);
          this.renumberPages();
        }
        this.notifySubscribers();
        return;
      }
    }
  }

  reorderPages(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.pages.length || toIndex < 0 || toIndex >= this.pages.length) {
      return;
    }
    if (fromIndex === toIndex) return;

    const [removed] = this.pages.splice(fromIndex, 1);
    this.pages.splice(toIndex, 0, removed);
    this.renumberPages();
    this.notifySubscribers();
  }

  private renumberPages(): void {
    this.pages.forEach((page, index) => {
      page.pageNumber = index + 1;
    });
  }

  addAnnotation(pageIndex: number, annotation: Omit<Annotation, 'id'>): string | null {
    if (pageIndex < 0 || pageIndex >= this.pages.length) return null;

    const newAnnotation: Annotation = {
      ...annotation,
      id: uuidv4()
    };

    this.pages[pageIndex].annotations.push(newAnnotation);
    this.notifySubscribers();
    return newAnnotation.id;
  }

  updateAnnotation(pageIndex: number, annotationId: string, updates: Partial<Annotation>): boolean {
    if (pageIndex < 0 || pageIndex >= this.pages.length) return false;

    const page = this.pages[pageIndex];
    const annotation = page.annotations.find(a => a.id === annotationId);
    if (!annotation) return false;

    Object.assign(annotation, updates);
    this.notifySubscribers();
    return true;
  }

  deleteAnnotation(pageIndex: number, annotationId: string): boolean {
    if (pageIndex < 0 || pageIndex >= this.pages.length) return false;

    const page = this.pages[pageIndex];
    const index = page.annotations.findIndex(a => a.id === annotationId);
    if (index === -1) return false;

    page.annotations.splice(index, 1);
    this.notifySubscribers();
    return true;
  }

  setEmotionTag(pageIndex: number, annotationId: string, emotionTag: EmotionTag | undefined): boolean {
    return this.updateAnnotation(pageIndex, annotationId, { emotionTag });
  }

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback());
  }

  getPageCount(): number {
    return this.pages.length;
  }

  getMaxIllustrations(): number {
    return 20;
  }

  canAddMore(): boolean {
    return this.getTotalIllustrations() < 20;
  }
}

export const albumManager = new AlbumManager();
