import { v4 as uuidv4 } from 'uuid';
import type { Book, Chapter } from './types';

const CHAPTER_PATTERNS = [
  /^第[一二三四五六七八九十百千万零〇\d]+[章节回卷部][\s、：:].*$/m,
  /^Chapter\s+\d+[\s、：:].*$/im,
  /^第\s*\d+\s*[章节回卷部][\s、：:].*$/m,
  /^[一二三四五六七八九十百千万零〇]+[章节回卷部][\s、：:].*$/m,
];

const detectFormat = (fileName: string): 'epub' | 'txt' => {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'epub') return 'epub';
  if (ext === 'txt') return 'txt';
  throw new Error(`不支持的文件格式: .${ext}`);
};

const parseEpub = async (file: File): Promise<Book> => {
  const { default: EpubReader } = await import('js-epub-reader');
  
  const arrayBuffer = await file.arrayBuffer();
  const reader = new EpubReader();
  const book = await reader.open(arrayBuffer);
  
  const metadata = await book.loaded.metadata;
  const manifest = await book.loaded.manifest;
  const spine = await book.loaded.spine;
  
  const chapters: Chapter[] = [];
  
  for (let i = 0; i < spine.length; i++) {
    const item = spine[i];
    const href = manifest[item.idref]?.href;
    if (!href) continue;
    
    const content = await book.getChapterRaw(item.idref);
    const title = item.indexTitle || `第${i + 1}章`;
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    const images: string[] = [];
    const imgElements = doc.querySelectorAll('img');
    imgElements.forEach((img) => {
      const src = img.getAttribute('src');
      if (src) {
        images.push(src);
      }
    });
    
    const textContent = doc.body?.textContent || '';
    
    chapters.push({
      id: uuidv4(),
      title: title.trim(),
      content: textContent.trim(),
      images: images.length > 0 ? images : undefined,
      index: i,
    });
  }
  
  return {
    id: uuidv4(),
    title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
    cover: metadata.cover,
    chapters,
    totalChapters: chapters.length,
    uploadedAt: new Date(),
  };
};

const parseTxt = async (file: File): Promise<Book> => {
  const text = await file.text();
  const lines = text.split(/\r?\n/);
  
  const chapterStartIndices: number[] = [];
  const chapterTitles: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    for (const pattern of CHAPTER_PATTERNS) {
      if (pattern.test(line)) {
        chapterStartIndices.push(i);
        chapterTitles.push(line);
        break;
      }
    }
  }
  
  const chapters: Chapter[] = [];
  
  if (chapterStartIndices.length === 0) {
    chapters.push({
      id: uuidv4(),
      title: '正文',
      content: text.trim(),
      index: 0,
    });
  } else {
    for (let i = 0; i < chapterStartIndices.length; i++) {
      const startLine = chapterStartIndices[i];
      const endLine = i < chapterStartIndices.length - 1 ? chapterStartIndices[i + 1] : lines.length;
      
      const contentLines = lines.slice(startLine + 1, endLine);
      const content = contentLines.join('\n').trim();
      
      chapters.push({
        id: uuidv4(),
        title: chapterTitles[i],
        content,
        index: i,
      });
    }
    
    if (chapterStartIndices[0] > 0) {
      const prefaceLines = lines.slice(0, chapterStartIndices[0]);
      const prefaceContent = prefaceLines.join('\n').trim();
      if (prefaceContent) {
        chapters.unshift({
          id: uuidv4(),
          title: '前言',
          content: prefaceContent,
          index: 0,
        });
        
        chapters.forEach((chapter, idx) => {
          chapter.index = idx;
        });
      }
    }
  }
  
  return {
    id: uuidv4(),
    title: file.name.replace(/\.[^/.]+$/, ''),
    chapters,
    totalChapters: chapters.length,
    uploadedAt: new Date(),
  };
};

export const parseFile = async (file: File): Promise<Book> => {
  const format = detectFormat(file.name);
  
  if (format === 'epub') {
    return parseEpub(file);
  } else {
    return parseTxt(file);
  }
};
