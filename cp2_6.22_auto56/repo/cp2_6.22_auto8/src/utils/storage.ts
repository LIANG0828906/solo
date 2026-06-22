import localforage from 'localforage';
import type { Book, Annotation, ReadingProgress } from '../types';

class StorageManager {
  private booksStore: LocalForage;
  private annotationsStore: LocalForage;
  private progressStore: LocalForage;

  constructor() {
    this.booksStore = localforage.createInstance({
      name: 'ebookLibrary',
      storeName: 'books',
      version: 1.0,
      description: '存储书籍数据'
    });

    this.annotationsStore = localforage.createInstance({
      name: 'ebookLibrary',
      storeName: 'annotations',
      version: 1.0,
      description: '存储笔记和标注'
    });

    this.progressStore = localforage.createInstance({
      name: 'ebookLibrary',
      storeName: 'progress',
      version: 1.0,
      description: '存储阅读进度'
    });
  }

  async saveBook(book: Book): Promise<void> {
    await this.booksStore.setItem(book.id, book);
  }

  async getBook(id: string): Promise<Book | null> {
    const book = await this.booksStore.getItem<Book>(id);
    return book || null;
  }

  async getAllBooks(): Promise<Book[]> {
    const books: Book[] = [];
    await this.booksStore.iterate<Book, void>((value) => {
      books.push(value);
    });
    return books.sort((a, b) => 
      new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
    );
  }

  async deleteBook(id: string): Promise<void> {
    await this.booksStore.removeItem(id);
    const annotations = await this.getAnnotationsByBook(id);
    for (const ann of annotations) {
      await this.deleteAnnotation(ann.id);
    }
    await this.progressStore.removeItem(id);
  }

  async saveAnnotation(annotation: Annotation): Promise<void> {
    await this.annotationsStore.setItem(annotation.id, annotation);
  }

  async getAnnotation(id: string): Promise<Annotation | null> {
    const annotation = await this.annotationsStore.getItem<Annotation>(id);
    return annotation || null;
  }

  async getAnnotationsByBook(bookId: string): Promise<Annotation[]> {
    const annotations: Annotation[] = [];
    await this.annotationsStore.iterate<Annotation, void>((value) => {
      if (value.bookId === bookId) {
        annotations.push(value);
      }
    });
    return annotations.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async deleteAnnotation(id: string): Promise<void> {
    await this.annotationsStore.removeItem(id);
  }

  async saveProgress(progress: ReadingProgress): Promise<void> {
    await this.progressStore.setItem(progress.bookId, progress);
  }

  async getProgress(bookId: string): Promise<ReadingProgress | null> {
    const progress = await this.progressStore.getItem<ReadingProgress>(bookId);
    return progress || null;
  }

  async clearAll(): Promise<void> {
    await this.booksStore.clear();
    await this.annotationsStore.clear();
    await this.progressStore.clear();
  }
}

export const storage = new StorageManager();
