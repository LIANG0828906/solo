import { v4 as uuidv4 } from 'uuid';
import { Book, Chapter } from '../types';

const CHARS_PER_PAGE = 800;

function segmentByGrapheme(text: string): string[] {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'grapheme' });
    const segments = segmenter.segment(text);
    return Array.from(segments).map((s) => s.segment);
  }
  return Array.from(text);
}

function sliceByGrapheme(text: string, start: number, end: number): string {
  const graphemes = segmentByGrapheme(text);
  return graphemes.slice(start, end).join('');
}

function countGraphemes(text: string): number {
  return segmentByGrapheme(text).length;
}

function splitLongParagraph(paragraph: string, maxChars: number): string[] {
  const result: string[] = [];
  const totalLength = countGraphemes(paragraph);

  if (totalLength <= maxChars) {
    return [paragraph];
  }

  let offset = 0;
  while (offset < totalLength) {
    const chunkEnd = Math.min(offset + maxChars, totalLength);
    result.push(sliceByGrapheme(paragraph, offset, chunkEnd));
    offset = chunkEnd;
  }

  return result;
}

export function parseTxt(content: string, filename: string): Book {
  if (typeof content !== 'string') {
    throw new Error('TXT文件内容无效');
  }

  const cleanContent = content.replace(/\r\n/g, '\n');

  if (!cleanContent.trim()) {
    throw new Error('TXT文件内容为空');
  }

  const paragraphs = cleanContent.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  if (paragraphs.length === 0) {
    paragraphs.push(cleanContent.trim());
  }

  const pages: string[] = [];
  let currentPage = '';
  let currentPageLength = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();
    const paraLength = countGraphemes(paragraph);
    const separatorLength = currentPage ? 2 : 0;
    const totalNeeded = currentPageLength + separatorLength + paraLength;

    if (paraLength > CHARS_PER_PAGE) {
      if (currentPage) {
        pages.push(currentPage);
        currentPage = '';
        currentPageLength = 0;
      }

      const chunks = splitLongParagraph(paragraph, CHARS_PER_PAGE);
      for (let j = 0; j < chunks.length; j++) {
        pages.push(chunks[j]);
      }
    } else if (totalNeeded <= CHARS_PER_PAGE) {
      currentPage += (currentPage ? '\n\n' : '') + paragraph;
      currentPageLength = totalNeeded;
    } else {
      pages.push(currentPage);
      currentPage = paragraph;
      currentPageLength = paraLength;
    }
  }

  if (currentPage) {
    pages.push(currentPage);
  }

  if (pages.length === 0) {
    pages.push(sliceByGrapheme(cleanContent, 0, CHARS_PER_PAGE));
  }

  const chapters: Chapter[] = pages.map((pageContent, index) => {
    if (typeof pageContent !== 'string') {
      throw new Error(`第${index + 1}页内容格式错误`);
    }
    return {
      title: `第${index + 1}页`,
      content: pageContent,
      pageStart: index + 1,
      pageEnd: index + 1,
    };
  });

  const book: Book = {
    id: uuidv4(),
    title: filename.replace(/\.[^/.]+$/, ''),
    type: 'txt',
    chapters,
    totalPages: chapters.length,
  };

  validateBook(book);
  return book;
}

function validateBook(book: Book): void {
  if (!book.id || typeof book.id !== 'string') {
    throw new Error('书籍ID无效');
  }
  if (!book.title || typeof book.title !== 'string') {
    throw new Error('书籍标题无效');
  }
  if (book.type !== 'txt' && book.type !== 'epub') {
    throw new Error('书籍类型无效');
  }
  if (!Array.isArray(book.chapters) || book.chapters.length === 0) {
    throw new Error('书籍章节无效');
  }
  if (typeof book.totalPages !== 'number' || book.totalPages !== book.chapters.length) {
    throw new Error('书籍页数无效');
  }
  book.chapters.forEach((chapter, idx) => {
    if (!chapter.title || typeof chapter.title !== 'string') {
      throw new Error(`第${idx + 1}章标题无效`);
    }
    if (typeof chapter.content !== 'string') {
      throw new Error(`第${idx + 1}章内容无效`);
    }
    if (typeof chapter.pageStart !== 'number' || typeof chapter.pageEnd !== 'number') {
      throw new Error(`第${idx + 1}章页码无效`);
    }
  });
}
