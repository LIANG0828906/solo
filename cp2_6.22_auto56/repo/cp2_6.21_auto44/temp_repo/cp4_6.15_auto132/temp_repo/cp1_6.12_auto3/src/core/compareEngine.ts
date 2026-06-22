import { OCRFrameResult, PDFPageText, CompareResult, DiffItem } from '@/types';

function jaccardSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.toLowerCase().replace(/\s+/g, '').split(''));
  const set2 = new Set(str2.toLowerCase().replace(/\s+/g, '').split(''));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  if (union.size === 0) return 1;
  return intersection.size / union.size;
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }
  return dp[m][n];
}

function editSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

function combinedSimilarity(str1: string, str2: string): number {
  const jaccard = jaccardSimilarity(str1, str2);
  const editSim = editSimilarity(str1, str2);
  return (jaccard * 0.4 + editSim * 0.6);
}

function extractTextSegments(fullText: string): string[] {
  const segments = fullText
    .split(/[\n。；.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 2);
  return segments;
}

export function compareContent(
  ocrResults: OCRFrameResult[],
  pdfPages: PDFPageText[],
  similarityThreshold: number = 0.6
): CompareResult {
  const diffItems: DiffItem[] = [];
  const matchedPairs: CompareResult['matchedPairs'] = [];
  const usedPDFPages = new Set<number>();

  for (const ocrFrame of ocrResults) {
    let bestMatch: { pdfPage: PDFPageText; similarity: number } | null = null;
    
    for (const pdfPage of pdfPages) {
      if (usedPDFPages.has(pdfPage.pageNumber)) continue;
      
      const similarity = combinedSimilarity(
        ocrFrame.fullText.toLowerCase().replace(/\s+/g, ''),
        pdfPage.fullText.toLowerCase().replace(/\s+/g, '')
      );
      
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { pdfPage, similarity };
      }
    }
    
    if (bestMatch && bestMatch.similarity >= similarityThreshold) {
      usedPDFPages.add(bestMatch.pdfPage.pageNumber);
      matchedPairs.push({
        ocrFrame,
        pdfPage: bestMatch.pdfPage,
        similarity: bestMatch.similarity,
      });
      
      const ocrSegments = extractTextSegments(ocrFrame.fullText);
      const pdfSegments = extractTextSegments(bestMatch.pdfPage.fullText);
      
      const matchedOCRSegments = new Set<number>();
      const matchedPDFSegments = new Set<number>();
      
      for (let i = 0; i < ocrSegments.length; i++) {
        let bestSegMatch: { idx: number; sim: number } | null = null;
        
        for (let j = 0; j < pdfSegments.length; j++) {
          if (matchedPDFSegments.has(j)) continue;
          const segSim = combinedSimilarity(ocrSegments[i], pdfSegments[j]);
          if (!bestSegMatch || segSim > bestSegMatch.sim) {
            bestSegMatch = { idx: j, sim: segSim };
          }
        }
        
        if (bestSegMatch && bestSegMatch.sim >= similarityThreshold) {
          matchedOCRSegments.add(i);
          matchedPDFSegments.add(bestSegMatch.idx);
        }
      }
      
      for (let i = 0; i < ocrSegments.length; i++) {
        if (!matchedOCRSegments.has(i)) {
          diffItems.push({
            type: 'extra',
            ocrText: ocrSegments[i],
            ocrTimestamp: ocrFrame.timestamp,
            pdfPageNumber: bestMatch.pdfPage.pageNumber,
            similarity: 0,
          });
        }
      }
      
      for (let j = 0; j < pdfSegments.length; j++) {
        if (!matchedPDFSegments.has(j)) {
          diffItems.push({
            type: 'missing',
            pdfText: pdfSegments[j],
            ocrTimestamp: ocrFrame.timestamp,
            pdfPageNumber: bestMatch.pdfPage.pageNumber,
            similarity: 0,
          });
        }
      }
    } else {
      diffItems.push({
        type: 'mismatch',
        ocrText: ocrFrame.fullText.slice(0, 100),
        ocrTimestamp: ocrFrame.timestamp,
        similarity: bestMatch?.similarity || 0,
      });
    }
  }

  for (const pdfPage of pdfPages) {
    if (!usedPDFPages.has(pdfPage.pageNumber)) {
      diffItems.push({
        type: 'mismatch',
        pdfText: pdfPage.fullText.slice(0, 100),
        pdfPageNumber: pdfPage.pageNumber,
        similarity: 0,
      });
    }
  }

  return {
    totalOCRFrames: ocrResults.length,
    totalPDFPages: pdfPages.length,
    diffCount: diffItems.length,
    diffItems,
    matchedPairs,
  };
}
