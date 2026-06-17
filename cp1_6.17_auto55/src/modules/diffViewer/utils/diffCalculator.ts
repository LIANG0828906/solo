import { diff_match_patch, Diff } from 'diff-match-patch';
import type { DiffLine, CharDiff } from '@/utils/types';

const dmp = new diff_match_patch();

function computeCharDiff(oldText: string, newText: string): { old: CharDiff[]; new: CharDiff[] } {
  const diffs: Diff[] = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  const oldChars: CharDiff[] = [];
  const newChars: CharDiff[] = [];

  for (const diff of diffs) {
    const [op, text] = diff;
    if (op === 0) {
      oldChars.push({ text, isDiff: false });
      newChars.push({ text, isDiff: false });
    } else if (op === -1) {
      oldChars.push({ text, isDiff: true });
    } else if (op === 1) {
      newChars.push({ text, isDiff: true });
    }
  }

  return { old: oldChars, new: newChars };
}

export function computeLineDiff(oldContent: string, newContent: string): DiffLine[] {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  const oldText = oldLines.map((l, i) => `${i + 1}\x00${l}`).join('\n');
  const newText = newLines.map((l, i) => `${i + 1}\x00${l}`).join('\n');

  const diffs: Diff[] = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  const result: DiffLine[] = [];
  let oldLineNum = 1;
  let newLineNum = 1;

  for (const diff of diffs) {
    const [op, text] = diff;
    const lines = text.split('\n').filter(l => l.length > 0);

    for (const line of lines) {
      const nullIdx = line.indexOf('\x00');
      const content = nullIdx >= 0 ? line.substring(nullIdx + 1) : line;

      if (op === 0) {
        result.push({
          type: 'unchanged',
          oldLineNumber: oldLineNum,
          newLineNumber: newLineNum,
          oldContent: content,
          newContent: content,
        });
        oldLineNum++;
        newLineNum++;
      } else if (op === -1) {
        result.push({
          type: 'deleted',
          oldLineNumber: oldLineNum,
          newLineNumber: null,
          oldContent: content,
          newContent: '',
        });
        oldLineNum++;
      } else if (op === 1) {
        result.push({
          type: 'added',
          oldLineNumber: null,
          newLineNumber: newLineNum,
          oldContent: '',
          newContent: content,
        });
        newLineNum++;
      }
    }
  }

  const finalResult: DiffLine[] = [];
  let i = 0;
  while (i < result.length) {
    if (result[i].type === 'deleted' && i + 1 < result.length && result[i + 1].type === 'added') {
      const charDiff = computeCharDiff(result[i].oldContent, result[i + 1].newContent);
      finalResult.push({
        type: 'modified',
        oldLineNumber: result[i].oldLineNumber,
        newLineNumber: result[i + 1].newLineNumber,
        oldContent: result[i].oldContent,
        newContent: result[i + 1].newContent,
        charDiff,
      });
      i += 2;
    } else if (result[i].type === 'added' && i + 1 < result.length && result[i + 1].type === 'deleted') {
      const charDiff = computeCharDiff(result[i + 1].oldContent, result[i].newContent);
      finalResult.push({
        type: 'modified',
        oldLineNumber: result[i + 1].oldLineNumber,
        newLineNumber: result[i].newLineNumber,
        oldContent: result[i + 1].oldContent,
        newContent: result[i].newContent,
        charDiff,
      });
      i += 2;
    } else if (result[i].type === 'deleted' || result[i].type === 'added') {
      const line = result[i];
      if (line.type === 'deleted') {
        finalResult.push({
          ...line,
          charDiff: { old: [{ text: line.oldContent, isDiff: true }], new: [] },
        });
      } else {
        finalResult.push({
          ...line,
          charDiff: { old: [], new: [{ text: line.newContent, isDiff: true }] },
        });
      }
      i++;
    } else {
      finalResult.push(result[i]);
      i++;
    }
  }

  return finalResult;
}

export function countDiffs(diffLines: DiffLine[]): { additions: number; deletions: number } {
  let additions = 0;
  let deletions = 0;
  for (const line of diffLines) {
    if (line.type === 'added') additions++;
    else if (line.type === 'deleted') deletions++;
    else if (line.type === 'modified') {
      additions++;
      deletions++;
    }
  }
  return { additions, deletions };
}
