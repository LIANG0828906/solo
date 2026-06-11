import { Annotation, SearchResult } from './types';

const STORAGE_KEY = 'ancient_study_annotations';

export class AnnotationManager {
  private annotations: Map<string, Annotation> = new Map();
  private annotationList: Annotation[] = [];
  private bookIndex: Map<string, Annotation[]> = new Map();
  private onChangeCallback?: () => void;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: Annotation[] = JSON.parse(stored);
        data.forEach(ann => {
          this.annotations.set(ann.id, ann);
          this.annotationList.push(ann);
          
          const bookAnns = this.bookIndex.get(ann.bookId) || [];
          bookAnns.push(ann);
          this.bookIndex.set(ann.bookId, bookAnns);
        });
        this.sortAnnotations();
      }
    } catch (e) {
      console.error('Failed to load annotations:', e);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.annotationList));
    } catch (e) {
      console.error('Failed to save annotations:', e);
    }
  }

  private sortAnnotations(): void {
    this.annotationList.sort((a, b) => b.createdAt - a.createdAt);
  }

  private generateId(): string {
    return `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setOnChangeCallback(callback: () => void): void {
    this.onChangeCallback = callback;
  }

  private notifyChange(): void {
    if (this.onChangeCallback) {
      setTimeout(() => this.onChangeCallback?.(), 0);
    }
  }

  addAnnotation(bookId: string, charIndex: number, content: string): Annotation | null {
    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent.length > 200) {
      return null;
    }

    const annotation: Annotation = {
      id: this.generateId(),
      bookId,
      charIndex,
      content: trimmedContent,
      createdAt: Date.now(),
    };

    this.annotations.set(annotation.id, annotation);
    this.annotationList.push(annotation);
    
    const bookAnns = this.bookIndex.get(bookId) || [];
    bookAnns.push(annotation);
    this.bookIndex.set(bookId, bookAnns);
    
    this.sortAnnotations();
    this.saveToStorage();
    this.notifyChange();

    return annotation;
  }

  getAnnotationById(id: string): Annotation | undefined {
    return this.annotations.get(id);
  }

  getAnnotationsByBookId(bookId: string): Annotation[] {
    return this.bookIndex.get(bookId) || [];
  }

  getAllAnnotations(): Annotation[] {
    return this.annotationList;
  }

  deleteAnnotation(id: string): boolean {
    const annotation = this.annotations.get(id);
    if (!annotation) {
      return false;
    }

    this.annotations.delete(id);
    
    const index = this.annotationList.findIndex(a => a.id === id);
    if (index !== -1) {
      this.annotationList.splice(index, 1);
    }

    const bookAnns = this.bookIndex.get(annotation.bookId);
    if (bookAnns) {
      const bookIndex = bookAnns.findIndex(a => a.id === id);
      if (bookIndex !== -1) {
        bookAnns.splice(bookIndex, 1);
      }
    }

    this.saveToStorage();
    this.notifyChange();
    return true;
  }

  searchAnnotations(query: string): Set<string> {
    const result = new Set<string>();
    
    if (!query.trim()) {
      return result;
    }

    const lowerQuery = query.toLowerCase();
    
    this.annotationList.forEach(ann => {
      if (ann.content.toLowerCase().includes(lowerQuery)) {
        result.add(ann.id);
      }
    });

    return result;
  }

  search(query: string): SearchResult {
    const result: SearchResult = {
      bookIds: new Set<string>(),
      annotationIds: new Set<string>(),
    };

    if (!query.trim()) {
      return result;
    }

    const lowerQuery = query.toLowerCase();
    
    this.annotationList.forEach(ann => {
      if (ann.content.toLowerCase().includes(lowerQuery)) {
        result.annotationIds.add(ann.id);
        result.bookIds.add(ann.bookId);
      }
    });

    return result;
  }

  hasAnnotation(bookId: string, charIndex: number): boolean {
    const bookAnns = this.bookIndex.get(bookId);
    if (!bookAnns) return false;
    return bookAnns.some(a => a.charIndex === charIndex);
  }

  getAnnotationAt(bookId: string, charIndex: number): Annotation | undefined {
    const bookAnns = this.bookIndex.get(bookId);
    if (!bookAnns) return undefined;
    return bookAnns.find(a => a.charIndex === charIndex);
  }

  getAnnotationsCount(): number {
    return this.annotationList.length;
  }

  clearAll(): void {
    this.annotations.clear();
    this.annotationList.length = 0;
    this.bookIndex.clear();
    this.saveToStorage();
    this.notifyChange();
  }

  getBookIdsWithAnnotations(): Set<string> {
    return new Set(this.bookIndex.keys());
  }
}
