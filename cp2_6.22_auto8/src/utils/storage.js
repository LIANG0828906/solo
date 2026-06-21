import localforage from 'localforage';
class StorageManager {
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
    async saveBook(book) {
        await this.booksStore.setItem(book.id, book);
    }
    async getBook(id) {
        const book = await this.booksStore.getItem(id);
        return book || null;
    }
    async getAllBooks() {
        const books = [];
        await this.booksStore.iterate((value) => {
            books.push(value);
        });
        return books.sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime());
    }
    async deleteBook(id) {
        await this.booksStore.removeItem(id);
        const annotations = await this.getAnnotationsByBook(id);
        for (const ann of annotations) {
            await this.deleteAnnotation(ann.id);
        }
        await this.progressStore.removeItem(id);
    }
    async saveAnnotation(annotation) {
        await this.annotationsStore.setItem(annotation.id, annotation);
    }
    async getAnnotation(id) {
        const annotation = await this.annotationsStore.getItem(id);
        return annotation || null;
    }
    async getAnnotationsByBook(bookId) {
        const annotations = [];
        await this.annotationsStore.iterate((value) => {
            if (value.bookId === bookId) {
                annotations.push(value);
            }
        });
        return annotations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async deleteAnnotation(id) {
        await this.annotationsStore.removeItem(id);
    }
    async saveProgress(progress) {
        await this.progressStore.setItem(progress.bookId, progress);
    }
    async getProgress(bookId) {
        const progress = await this.progressStore.getItem(bookId);
        return progress || null;
    }
    async clearAll() {
        await this.booksStore.clear();
        await this.annotationsStore.clear();
        await this.progressStore.clear();
    }
}
export const storage = new StorageManager();
