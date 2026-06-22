import { storage } from '../utils/storage';
import { generateHash } from '../utils/hash';
class BookManager {
    constructor() {
        this.booksCache = [];
        this.cacheTimestamp = 0;
        this.CACHE_TTL = 60000;
    }
    async importFiles(files) {
        const importedBooks = [];
        for (const file of files) {
            if (!file.name.match(/\.(epub|pdf)$/i)) {
                console.warn(`不支持的文件格式: ${file.name}`);
                continue;
            }
            try {
                const book = await this.parseFile(file);
                const existingBook = await this.findDuplicate(book);
                if (existingBook) {
                    console.log(`书籍已存在: ${book.title}`);
                    continue;
                }
                await storage.saveBook(book);
                importedBooks.push(book);
            }
            catch (error) {
                console.error(`导入失败 ${file.name}:`, error);
            }
        }
        this.invalidateCache();
        return importedBooks;
    }
    async parseFile(file) {
        const arrayBuffer = await file.arrayBuffer();
        const fileType = file.name.toLowerCase().endsWith('.epub') ? 'epub' : 'pdf';
        const hash = await generateHash(arrayBuffer.slice(0, 1000000));
        let title = file.name.replace(/\.(epub|pdf)$/i, '');
        let author = '未知作者';
        let cover = this.generateDefaultCover(title);
        let chapters = [];
        let totalPages = 0;
        try {
            if (fileType === 'epub') {
                const metadata = await this.parseEpubMetadata(arrayBuffer);
                title = metadata.title || title;
                author = metadata.author || author;
                cover = metadata.cover || cover;
                chapters = metadata.chapters || [];
                totalPages = chapters.length || 1;
            }
            else {
                const metadata = await this.parsePdfMetadata(arrayBuffer);
                title = metadata.title || title;
                author = metadata.author || author;
                cover = metadata.cover || cover;
                totalPages = metadata.totalPages || 1;
                chapters = metadata.chapters || this.generatePdfChapters(totalPages);
            }
        }
        catch (error) {
            console.warn('元数据解析失败，使用默认值:', error);
        }
        const now = new Date();
        return {
            id: hash,
            title,
            author,
            cover,
            fileType,
            fileData: arrayBuffer,
            chapters,
            totalPages,
            status: 'unread',
            progress: 0,
            currentChapter: chapters[0]?.id || '',
            scrollPosition: 0,
            createdAt: now,
            lastReadAt: now
        };
    }
    async parseEpubMetadata(arrayBuffer) {
        try {
            const ePub = await import('epubjs');
            const book = ePub.default(arrayBuffer);
            await book.ready;
            const bookAny = book;
            const metadata = bookAny.metadata;
            const title = metadata?.title;
            const author = metadata?.creator;
            let cover = '';
            try {
                const coverUrl = await book.coverUrl();
                if (coverUrl) {
                    cover = await this.urlToBase64(coverUrl);
                }
            }
            catch (e) {
                console.warn('封面解析失败');
            }
            const chapters = (bookAny.navigation?.toc || []).map((item, index) => ({
                id: `chapter-${index}`,
                title: item.label,
                href: item.href
            }));
            return { title, author, cover, chapters };
        }
        catch (error) {
            console.warn('EPUB解析失败:', error);
            return {};
        }
    }
    async parsePdfMetadata(arrayBuffer) {
        try {
            const pdfjs = await import('pdfjs-dist');
            pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
            const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            const metadata = await pdf.getMetadata();
            const info = metadata.info;
            const totalPages = pdf.numPages;
            let cover = '';
            try {
                const firstPage = await pdf.getPage(1);
                const viewport = firstPage.getViewport({ scale: 0.5 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const context = canvas.getContext('2d');
                await firstPage.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;
                cover = canvas.toDataURL('image/jpeg', 0.8);
            }
            catch (e) {
                console.warn('PDF封面生成失败');
            }
            const outline = await pdf.getOutline().catch(() => []);
            const chapters = outline.map((item, index) => ({
                id: `chapter-${index}`,
                title: item.title
            }));
            return {
                title: info?.Title,
                author: info?.Author,
                cover,
                totalPages,
                chapters
            };
        }
        catch (error) {
            console.warn('PDF解析失败:', error);
            return {};
        }
    }
    generatePdfChapters(totalPages) {
        const chaptersPerSection = 50;
        const chapters = [];
        for (let i = 0; i < totalPages; i += chaptersPerSection) {
            chapters.push({
                id: `chapter-${Math.floor(i / chaptersPerSection)}`,
                title: `第 ${i + 1} - ${Math.min(i + chaptersPerSection, totalPages)} 页`,
                pageStart: i,
                pageEnd: Math.min(i + chaptersPerSection - 1, totalPages - 1)
            });
        }
        return chapters.length > 0 ? chapters : [{ id: 'chapter-0', title: '全文', pageStart: 0, pageEnd: totalPages - 1 }];
    }
    generateDefaultCover(title) {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 300, 400);
        gradient.addColorStop(0, '#8B5E3C');
        gradient.addColorStop(1, '#6B4423');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 300, 400);
        ctx.strokeStyle = '#F5F0E8';
        ctx.lineWidth = 4;
        ctx.strokeRect(20, 20, 260, 360);
        ctx.strokeRect(30, 30, 240, 340);
        ctx.fillStyle = '#F5F0E8';
        ctx.font = 'bold 24px "Playfair Display", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const words = title.split('');
        let line = '';
        let y = 150;
        const maxWidth = 220;
        const lineHeight = 35;
        for (const word of words) {
            const testLine = line + word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line !== '') {
                ctx.fillText(line, 150, y);
                line = word;
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }
        ctx.fillText(line, 150, y);
        ctx.font = '16px "Noto Sans SC", sans-serif';
        ctx.fillStyle = 'rgba(245, 240, 232, 0.7)';
        ctx.fillText('书香阁', 150, 350);
        return canvas.toDataURL('image/png');
    }
    async urlToBase64(url) {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    async findDuplicate(book) {
        const books = await this.getAllBooks();
        return books.find(b => b.id === book.id) || null;
    }
    async getAllBooks() {
        const now = Date.now();
        if (this.booksCache.length > 0 && now - this.cacheTimestamp < this.CACHE_TTL) {
            return this.booksCache;
        }
        this.booksCache = await storage.getAllBooks();
        this.cacheTimestamp = now;
        return this.booksCache;
    }
    async getBook(id) {
        return storage.getBook(id);
    }
    async searchBooks(query) {
        const books = await this.getAllBooks();
        const lowerQuery = query.toLowerCase();
        return books.filter(book => book.title.toLowerCase().includes(lowerQuery) ||
            book.author.toLowerCase().includes(lowerQuery));
    }
    async filterBooks(options) {
        let books = await this.getAllBooks();
        if (options.search) {
            const lowerQuery = options.search.toLowerCase();
            books = books.filter(book => book.title.toLowerCase().includes(lowerQuery) ||
                book.author.toLowerCase().includes(lowerQuery));
        }
        if (options.author && options.author !== 'all') {
            books = books.filter(book => book.author === options.author);
        }
        if (options.status && options.status !== 'all') {
            books = books.filter(book => book.status === options.status);
        }
        if (options.progress && options.progress !== 'all') {
            if (options.progress === '0') {
                books = books.filter(book => book.progress === 0);
            }
            else if (options.progress === '1-50') {
                books = books.filter(book => book.progress > 0 && book.progress <= 50);
            }
            else if (options.progress === '51-99') {
                books = books.filter(book => book.progress > 50 && book.progress < 100);
            }
            else if (options.progress === '100') {
                books = books.filter(book => book.progress === 100);
            }
        }
        return books;
    }
    async getAuthors() {
        const books = await this.getAllBooks();
        const authors = new Set(books.map(book => book.author));
        return Array.from(authors).sort();
    }
    async updateBookProgress(bookId, progress, currentChapter, scrollPosition) {
        const book = await storage.getBook(bookId);
        if (!book)
            return;
        book.progress = Math.min(100, Math.max(0, progress));
        book.currentChapter = currentChapter;
        book.scrollPosition = scrollPosition;
        book.lastReadAt = new Date();
        if (book.progress === 100) {
            book.status = 'finished';
        }
        else if (book.progress > 0) {
            book.status = 'reading';
        }
        await storage.saveBook(book);
        await storage.saveProgress({
            bookId,
            currentChapter,
            scrollPosition,
            progress: book.progress,
            updatedAt: new Date()
        });
        this.invalidateCache();
    }
    async deleteBook(id) {
        await storage.deleteBook(id);
        this.invalidateCache();
    }
    invalidateCache() {
        this.booksCache = [];
        this.cacheTimestamp = 0;
    }
}
export const bookManager = new BookManager();
