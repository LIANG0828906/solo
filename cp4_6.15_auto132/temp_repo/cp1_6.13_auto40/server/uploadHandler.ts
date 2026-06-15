import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';

export interface ParagraphInfo {
  text: string;
  startOffset: number;
  endOffset: number;
}

export interface Document {
  id: string;
  name: string;
  pageCount: number;
  text: string;
  pages: string[];
  paragraphs: string[];
  paragraphInfos: ParagraphInfo[];
  uploadedAt: number;
}

export const documentsMap = new Map<string, Document>();

export type DocumentCreatedCallback = (doc: Document) => void;

let onDocumentCreated: DocumentCreatedCallback | null = null;

export function setDocumentCreatedCallback(callback: DocumentCreatedCallback): void {
  onDocumentCreated = callback;
}

function generateId(): string {
  return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function splitIntoParagraphsWithOffsets(text: string): ParagraphInfo[] {
  const result: ParagraphInfo[] = [];
  const regex = /\n\s*\n/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const segment = text.slice(lastIndex, match.index).trim();
    if (segment.length > 0) {
      result.push({
        text: segment,
        startOffset: lastIndex,
        endOffset: match.index,
      });
    }
    lastIndex = match.index + match[0].length;
  }

  const finalSegment = text.slice(lastIndex).trim();
  if (finalSegment.length > 0) {
    result.push({
      text: finalSegment,
      startOffset: lastIndex,
      endOffset: text.length,
    });
  }

  if (result.length === 0 && text.trim().length > 0) {
    result.push({
      text: text.trim(),
      startOffset: 0,
      endOffset: text.length,
    });
  }

  return result;
}

export async function uploadHandler(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: '未找到上传文件' });
      return;
    }

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;

    const parseStartTime = Date.now();

    const data = await pdfParse(fileBuffer, {
      pagerender: function (pageData: any) {
        return pageData.getTextContent().then(function (textContent: any) {
          let lastY: number | null = null;
          let text = '';
          for (let item of textContent.items) {
            if (lastY !== null && item.transform[5] !== lastY) {
              text += '\n';
            }
            text += item.str;
            lastY = item.transform[5];
          }
          return text;
        });
      },
    });

    const pagesText: string[] = [];
    const totalPages = data.numpages;

    let remainingText = data.text;
    const charsPerPage = Math.ceil(data.text.length / Math.max(1, totalPages));
    for (let i = 0; i < totalPages; i++) {
      const pageText = remainingText.slice(0, charsPerPage);
      pagesText.push(pageText);
      remainingText = remainingText.slice(charsPerPage);
    }

    const docId = generateId();
    const paragraphInfos = splitIntoParagraphsWithOffsets(data.text);
    const paragraphs = paragraphInfos.map((p) => p.text);

    const document: Document = {
      id: docId,
      name: fileName,
      pageCount: totalPages,
      text: data.text,
      pages: pagesText,
      paragraphs,
      paragraphInfos,
      uploadedAt: Date.now(),
    };

    documentsMap.set(docId, document);

    if (onDocumentCreated) {
      try {
        onDocumentCreated(document);
      } catch (err) {
        console.error('Index registration failed:', err);
      }
    }

    const parseElapsed = Date.now() - parseStartTime;
    console.log(
      `[Upload] Parsed "${fileName}": ${totalPages} pages, ${paragraphs.length} paragraphs, ${data.text.length} chars in ${parseElapsed}ms`
    );

    res.json({
      id: docId,
      name: fileName,
      pageCount: totalPages,
      paragraphCount: paragraphs.length,
      preview: pagesText[0]?.slice(0, 100) || '',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: '文件解析失败' });
  }
}
