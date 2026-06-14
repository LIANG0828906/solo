import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import { Book, Chapter } from '../types';

const getElementText = (doc: Document, tagName: string): string => {
  const element = doc.getElementsByTagName(tagName)[0];
  return element?.textContent?.trim() || '';
};

const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export const parseEpub = async (file: File): Promise<Book> => {
  const zip = await JSZip.loadAsync(file);

  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  if (!containerXml) {
    throw new Error('无效的EPUB文件：缺少container.xml');
  }

  const containerParser = new DOMParser();
  const containerDoc = containerParser.parseFromString(containerXml, 'text/xml');
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

  return {
    id: uuidv4(),
    title,
    type: 'epub',
    chapters,
    totalPages: chapters.length,
  };
};
