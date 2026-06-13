import { Request, Response } from 'express';
import { documentsMap, Document } from './uploadHandler.js';

export interface SearchMatch {
  documentId: string;
  documentName: string;
  paragraphIndex: number;
  paragraph: string;
  context: string;
  startIndex: number;
  endIndex: number;
  keyword: string;
}

export interface SearchResult {
  documentId: string;
  documentName: string;
  pageCount: number;
  matchCount: number;
  matches: SearchMatch[];
}

function buildInvertedIndex(doc: Document): Map<string, Array<{ paragraphIndex: number; positions: number[] }>> {
  const index = new Map<string, Array<{ paragraphIndex: number; positions: number[] }>>();

  doc.paragraphs.forEach((paragraph, pIdx) => {
    const wordMap = new Map<string, number[]>();
    const lowerPara = paragraph.toLowerCase();

    const words = lowerPara.match(/[\w\u4e00-\u9fa5]+/g) || [];
    let searchPos = 0;
    words.forEach((word) => {
      const pos = lowerPara.indexOf(word, searchPos);
      if (pos !== -1) {
        if (!wordMap.has(word)) {
          wordMap.set(word, []);
        }
        wordMap.get(word)!.push(pos);
        searchPos = pos + word.length;
      }
    });

    wordMap.forEach((positions, word) => {
      if (!index.has(word)) {
        index.set(word, []);
      }
      index.get(word)!.push({ paragraphIndex: pIdx, positions });
    });
  });

  return index;
}

const docIndexCache = new Map<string, Map<string, Array<{ paragraphIndex: number; positions: number[] }>>>();

function getDocIndex(doc: Document): Map<string, Array<{ paragraphIndex: number; positions: number[] }>> {
  if (!docIndexCache.has(doc.id)) {
    docIndexCache.set(doc.id, buildInvertedIndex(doc));
  }
  return docIndexCache.get(doc.id)!;
}

function getContext(text: string, start: number, end: number, contextLen: number = 30): string {
  const ctxStart = Math.max(0, start - contextLen);
  const ctxEnd = Math.min(text.length, end + contextLen);
  return text.slice(ctxStart, ctxEnd);
}

export function searchHandler(req: Request, res: Response): void {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.json({ results: [], keywords: [] });
      return;
    }

    const keywords = q
      .split(/[\s,，]+/)
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);

    if (keywords.length === 0) {
      res.json({ results: [], keywords: [] });
      return;
    }

    const results: SearchResult[] = [];

    documentsMap.forEach((doc) => {
      const index = getDocIndex(doc);
      const allMatches: SearchMatch[] = [];

      keywords.forEach((keyword) => {
        const lowerKeyword = keyword.toLowerCase();

        for (const [word, entries] of index.entries()) {
          if (word.includes(lowerKeyword)) {
            entries.forEach((entry) => {
              const paragraph = doc.paragraphs[entry.paragraphIndex];
              const lowerPara = paragraph.toLowerCase();

              let searchPos = 0;
              while (true) {
                const idx = lowerPara.indexOf(lowerKeyword, searchPos);
                if (idx === -1) break;

                allMatches.push({
                  documentId: doc.id,
                  documentName: doc.name,
                  paragraphIndex: entry.paragraphIndex,
                  paragraph,
                  context: getContext(paragraph, idx, idx + keyword.length),
                  startIndex: idx,
                  endIndex: idx + keyword.length,
                  keyword,
                });

                searchPos = idx + keyword.length;
              }
            });
          }
        }
      });

      if (allMatches.length > 0) {
        const uniqueMatches = allMatches.filter((match, idx, arr) => {
          return (
            idx ===
            arr.findIndex(
              (m) =>
                m.paragraphIndex === match.paragraphIndex &&
                m.startIndex === match.startIndex &&
                m.keyword === match.keyword
            )
          );
        });

        results.push({
          documentId: doc.id,
          documentName: doc.name,
          pageCount: doc.pageCount,
          matchCount: uniqueMatches.length,
          matches: uniqueMatches,
        });
      }
    });

    results.sort((a, b) => b.matchCount - a.matchCount);

    res.json({
      results,
      keywords,
      totalMatches: results.reduce((sum, r) => sum + r.matchCount, 0),
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: '搜索失败' });
  }
}

export function getDocumentsHandler(req: Request, res: Response): void {
  try {
    const docs = Array.from(documentsMap.values()).map((doc) => ({
      id: doc.id,
      name: doc.name,
      pageCount: doc.pageCount,
      paragraphCount: doc.paragraphs.length,
      uploadedAt: doc.uploadedAt,
      preview: doc.pages[0]?.slice(0, 100) || '',
    }));

    res.json({ documents: docs });
  } catch (error) {
    res.status(500).json({ error: '获取文档列表失败' });
  }
}

export function getDocumentHandler(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const doc = documentsMap.get(id);

    if (!doc) {
      res.status(404).json({ error: '文档不存在' });
      return;
    }

    res.json({
      id: doc.id,
      name: doc.name,
      pageCount: doc.pageCount,
      paragraphs: doc.paragraphs,
      text: doc.text,
    });
  } catch (error) {
    res.status(500).json({ error: '获取文档失败' });
  }
}
