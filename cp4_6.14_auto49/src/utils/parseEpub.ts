import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import { Book, Chapter } from '../types';

function getElementText(doc: Document, tagName: string): string {
  const element = doc.getElementsByTagName(tagName)[0];
  return element?.textContent?.trim() || '';
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
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

export async function parseEpub(file: File): Promise<Book> {
  if (!file || !(file instanceof File)) {
    throw new Error('无效的文件对象');
  }

  const validTypes = [
    'application/epub+zip',
    'application/zip',
    'application/x-zip-compressed',
  ];
  if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.epub')) {
    throw new Error('文件格式不正确，请上传EPUB文件');
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error('无法解析EPUB文件，文件可能已损坏');
  }

  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  if (!containerXml) {
    throw new Error('无效的EPUB文件：缺少container.xml');
  }

  const containerParser = new DOMParser();
  const containerDoc = containerParser.parseFromString(containerXml, 'text/xml');

  const parseError = containerDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('无效的EPUB文件：container.xml格式错误');
  }

  const rootFileElement = containerDoc.getElementsByTagName('rootfile')[0];
  const opfPath = rootFileElement?.getAttribute('full-path');

  if (!opfPath) {
    throw new Error('无效的EPUB文件：缺少OPF文件路径');
  }

  const opfBase = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
  const opfContent = await zip.file(opfPath)?.async('string');

  if (!opfContent) {
    throw new Error('无效的EPUB文件：无法读取OPF文件');
  }

  const opfParser = new DOMParser();
  const opfDoc = opfParser.parseFromString(opfContent, 'text/xml');

  const opfParseError = opfDoc.querySelector('parsererror');
  if (opfParseError) {
    throw new Error('无效的EPUB文件：OPF文件格式错误');
  }

  const title = getElementText(opfDoc, 'dc:title') || file.name.replace(/\.[^/.]+$/, '');

  const manifestItems = opfDoc.getElementsByTagName('item');
  const idToHref: Record<string, string> = {};
  for (let i = 0; i < manifestItems.length; i++) {
    const item = manifestItems[i];
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    if (id && href) {
      idToHref[id] = href;
    }
  }

  const spineItems = opfDoc.getElementsByTagName('itemref');
  const chapterHrefs: string[] = [];
  for (let i = 0; i < spineItems.length; i++) {
    const idref = spineItems[i].getAttribute('idref');
    if (idref && idToHref[idref]) {
      chapterHrefs.push(opfBase + idToHref[idref]);
    }
  }

  if (chapterHrefs.length === 0) {
    throw new Error('无效的EPUB文件：没有找到章节内容');
  }

  const chapters: Chapter[] = [];
  let pageCounter = 1;

  for (let i = 0; i < chapterHrefs.length; i++) {
    const chapterPath = chapterHrefs[i];
    const chapterFile = zip.file(chapterPath);
    if (!chapterFile) continue;

    try {
      const chapterHtml = await chapterFile.async('string');
      const chapterParser = new DOMParser();
      const chapterDoc = chapterParser.parseFromString(chapterHtml, 'text/html');

      const chapterParseError = chapterDoc.querySelector('parsererror');
      if (chapterParseError) continue;

      let chapterTitle = getElementText(chapterDoc, 'title');
      const h1 = chapterDoc.querySelector('h1, h2');
      if (h1?.textContent?.trim()) {
        chapterTitle = h1.textContent.trim();
      }
      if (!chapterTitle) {
        chapterTitle = `第${i + 1}章`;
      }

      const bodyContent = chapterDoc.body?.innerHTML || '';
      const plainText = stripHtml(bodyContent).trim();

      if (plainText.length > 0) {
        chapters.push({
          title: chapterTitle,
          content: plainText,
          pageStart: pageCounter,
          pageEnd: pageCounter,
        });
        pageCounter++;
      }
    } catch {
      continue;
    }
  }

  if (chapters.length === 0) {
    chapters.push({
      title: '第1章',
      content: '（暂无内容）',
      pageStart: 1,
      pageEnd: 1,
    });
  }

  const book: Book = {
    id: uuidv4(),
    title,
    type: 'epub',
    chapters,
    totalPages: chapters.length,
  };

  validateBook(book);
  return book;
}
