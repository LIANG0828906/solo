import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';

export interface Document {
  id: string;
  name: string;
  pageCount: number;
  text: string;
  pages: string[];
  paragraphs: string[];
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

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
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
    const paragraphs = splitIntoParagraphs(data.text);

    const document: Document = {
      id: docId,
      name: fileName,
      pageCount: totalPages,
      text: data.text,
      pages: pagesText,
      paragraphs,
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
