import { Request, Response } from 'express';
import { documentsMap, Document } from './uploadHandler.js';
import type { SearchMatchDto, SearchResultDto, DocInfoDto } from '../src/apiTypes.js';

export type InvertedIndexEntry = {
  paragraphIndex: number;
  paragraphStartOffset: number;
  paragraphEndOffset: number;
  positions: number[];
};

export type DocInvertedIndex = Map<string, InvertedIndexEntry[]>;
export type GlobalInvertedIndex = Map<string, Map<string, InvertedIndexEntry[]>>;

const globalInvertedIndex: GlobalInvertedIndex = new Map();
const docWordIndexCache = new Map<string, DocInvertedIndex>();

export function buildDocumentIndex(doc: Document): DocInvertedIndex {
  const docIndex: DocInvertedIndex = new Map();

  doc.paragraphInfos.forEach((paraInfo, pIdx) => {
    const wordPositions = new Map<string, number[]>();
    const lowerPara = paraInfo.text.toLowerCase();

    const tokens = extractTokens(lowerPara);
    tokens.forEach(({ token, position }) => {
      if (!wordPositions.has(token)) {
        wordPositions.set(token, []);
      }
      wordPositions.get(token)!.push(position);
    });

    wordPositions.forEach((positions, word) => {
      if (!docIndex.has(word)) {
        docIndex.set(word, []);
      }
      docIndex.get(word)!.push({
        paragraphIndex: pIdx,
        paragraphStartOffset: paraInfo.startOffset,
        paragraphEndOffset: paraInfo.endOffset,
        positions,
      });
    });
  });

  return docIndex;
}

function extractTokens(text: string): Array<{ token: string; position: number }> {
  const result: Array<{ token: string; position: number }> = [];
  const regex = /[\w\u4e00-\u9fa5]+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    result.push({
      token: match[0],
      position: match.index,
    });
  }

  return result;
}

export function registerDocumentToIndex(doc: Document): void {
  const docIndex = buildDocumentIndex(doc);
  docWordIndexCache.set(doc.id, docIndex);

  docIndex.forEach((entries, word) => {
    if (!globalInvertedIndex.has(word)) {
      globalInvertedIndex.set(word, new Map());
    }
    globalInvertedIndex.get(word)!.set(doc.id, entries);
  });

  console.log(
    `[Index] Registered "${doc.name}": ${docIndex.size} unique words, ${doc.paragraphInfos.length} paragraphs`
  );
}

export function removeDocumentFromIndex(docId: string): void {
  const docIndex = docWordIndexCache.get(docId);
  if (docIndex) {
    docIndex.forEach((_, word) => {
      globalInvertedIndex.get(word)?.delete(docId);
      if (globalInvertedIndex.get(word)?.size === 0) {
        globalInvertedIndex.delete(word);
      }
    });
  }
  docWordIndexCache.delete(docId);
}

export function searchKeywordsInGlobalIndex(keywords: string[]): Map<string, SearchMatchDto[]> {
  const docMatchesMap = new Map<string, SearchMatchDto[]>();

  keywords.forEach((keyword) => {
    const lowerKeyword = keyword.toLowerCase();

    for (const [word, docEntriesMap] of globalInvertedIndex.entries()) {
      if (!word.includes(lowerKeyword)) continue;

      for (const [docId, entries] of docEntriesMap.entries()) {
        const doc = documentsMap.get(docId);
        if (!doc) continue;

        if (!docMatchesMap.has(docId)) {
          docMatchesMap.set(docId, []);
        }
        const matches = docMatchesMap.get(docId)!;

        entries.forEach((entry) => {
          const paragraph = doc.paragraphs[entry.paragraphIndex];
          const lowerPara = paragraph.toLowerCase();

          let searchPos = 0;
          while (true) {
            const idx = lowerPara.indexOf(lowerKeyword, searchPos);
            if (idx === -1) break;

            matches.push({
              documentId: docId,
              documentName: doc.name,
              paragraphIndex: entry.paragraphIndex,
              paragraphStartOffset: entry.paragraphStartOffset,
              paragraphEndOffset: entry.paragraphEndOffset,
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

  return docMatchesMap;
}

function getContext(text: string, start: number, end: number, contextLen: number = 30): string {
  const ctxStart = Math.max(0, start - contextLen);
  const ctxEnd = Math.min(text.length, end + contextLen);
  return text.slice(ctxStart, ctxEnd);
}

function deduplicateMatches(matches: SearchMatchDto[]): SearchMatchDto[] {
  const seen = new Set<string>();
  return matches.filter((m) => {
    const key = `${m.paragraphIndex}-${m.startIndex}-${m.keyword}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function searchHandler(req: Request, res: Response): void {
  try {
    const startTime = Date.now();
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.json({ results: [], keywords: [], totalMatches: 0 });
      return;
    }

    const keywords = q
      .split(/[\s,，]+/)
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);

    if (keywords.length === 0) {
      res.json({ results: [], keywords: [], totalMatches: 0 });
      return;
    }

    const docMatchesMap = searchKeywordsInGlobalIndex(keywords);
    const results: SearchResultDto[] = [];

    docMatchesMap.forEach((matches, docId) => {
      const doc = documentsMap.get(docId);
      if (!doc) return;

      const uniqueMatches = deduplicateMatches(matches);
      if (uniqueMatches.length === 0) return;

      results.push({
        documentId: docId,
        documentName: doc.name,
        pageCount: doc.pageCount,
        matchCount: uniqueMatches.length,
        matches: uniqueMatches,
      });
    });

    results.sort((a, b) => b.matchCount - a.matchCount);

    const elapsed = Date.now() - startTime;
    const totalMatches = results.reduce((s, r) => s + r.matchCount, 0);
    console.log(
      `[Search] Query="${q}", Found ${results.length} docs, ${totalMatches} matches in ${elapsed}ms`
    );

    res.json({
      results,
      keywords,
      totalMatches,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: '搜索失败' });
  }
}

export function getDocumentsHandler(req: Request, res: Response): void {
  try {
    const docs: DocInfoDto[] = Array.from(documentsMap.values()).map((doc) => ({
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
      paragraphInfos: doc.paragraphInfos,
      text: doc.text,
    });
  } catch (error) {
    res.status(500).json({ error: '获取文档失败' });
  }
}
