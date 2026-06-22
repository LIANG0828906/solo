import { diffLines } from 'diff';
import type { DiffResult, DiffChange } from '../types.js';

export type { DiffResult };

export function computeDiff(oldText: string, newText: string): DiffResult {
  const differences = diffLines(oldText, newText);
  
  let added = 0;
  let removed = 0;
  let modified = 0;
  
  const changes: DiffChange[] = [];
  let lineNumber = 1;
  
  for (let i = 0; i < differences.length; i++) {
    const change = differences[i];
    const nextChange = differences[i + 1];
    
    if (change.removed && nextChange?.added) {
      const removedCount = change.count || 0;
      const addedCount = nextChange.count || 0;
      const modifiedCount = Math.min(removedCount, addedCount);
      
      modified += modifiedCount;
      removed += removedCount - modifiedCount;
      added += addedCount - modifiedCount;
      
      const removedLines = change.value.split('\n').filter(l => l !== '');
      const addedLines = nextChange.value.split('\n').filter(l => l !== '');
      
      for (let j = 0; j < removedLines.length; j++) {
        changes.push({
          type: 'removed',
          value: removedLines[j],
          lineNumber: lineNumber++,
        });
      }
      
      lineNumber -= removedLines.length;
      
      for (let j = 0; j < addedLines.length; j++) {
        changes.push({
          type: 'added',
          value: addedLines[j],
          lineNumber: lineNumber++,
        });
      }
      
      i++;
    } else if (change.added) {
      added += change.count || 0;
      const lines = change.value.split('\n').filter(l => l !== '');
      for (const line of lines) {
        changes.push({
          type: 'added',
          value: line,
          lineNumber: lineNumber++,
        });
      }
    } else if (change.removed) {
      removed += change.count || 0;
      const lines = change.value.split('\n').filter(l => l !== '');
      for (const line of lines) {
        changes.push({
          type: 'removed',
          value: line,
          lineNumber: lineNumber,
        });
      }
    } else {
      const lines = change.value.split('\n').filter(l => l !== '');
      for (const line of lines) {
        changes.push({
          type: 'unchanged',
          value: line,
          lineNumber: lineNumber++,
        });
      }
    }
  }

  return {
    added,
    removed,
    modified,
    changes,
  };
}
