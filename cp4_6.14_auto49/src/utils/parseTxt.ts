import { v4 as uuidv4 } from 'uuid';
import { Book, Chapter } from '../types';

const CHARS_PER_PAGE = 800;

export const parseTxt = (content: string, filename: string): Book => {
  const cleanContent = content.replace(/\r\n/g, '\n');
  const paragraphs = cleanContent.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const pages: string[] = [];
  let currentPage = '';

  for (const paragraph of paragraphs) {
    if (currentPage.length + paragraph.length <= CHARS_PER_PAGE) {
      currentPage += (currentPage ? '\n\n' : '') + paragraph.trim();
    } else {
      if (currentPage) {
        pages.push(currentPage);
      }
      if (paragraph.length <= CHARS_PER_PAGE) {
        currentPage = paragraph.trim();
      } else {
        let remaining = paragraph;
        while (remaining.length > CHARS_PER_PAGE) {
          pages.push(remaining.slice(0, CHARS_PER_PAGE));
          remaining = remaining.slice(CHARS_PER_PAGE);
        }
        currentPage = remaining;
      }
    }
  }
  if (currentPage) {
    pages.push(currentPage);
  }

  if (pages.length === 0) {
    pages.push(cleanContent.slice(0, CHARS_PER_PAGE) || '');
  }

  const chapters: Chapter[] = pages.map((pageContent, index) => ({
    title: `第${index + 1}页`,
    content: pageContent,
    pageStart: index + 1,
    pageEnd: index + 1,
  }));

  return {
    id: uuidv4(),
    title: filename.replace(/\.[^/.]+$/, ''),
    type: 'txt',
    chapters,
    totalPages: chapters.length,
  };
};
