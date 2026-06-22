import { parse } from 'csv-parse/sync';

export interface ParsedCSV {
  data: number[][];
  rows: number;
  cols: number;
  min: number;
  max: number;
  avg: number;
}

export function parseCSV(content: string): ParsedCSV {
  const records = parse(content, {
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  }) as string[][];

  const numRows = Math.min(records.length, 800);
  let numCols = 0;
  for (let i = 0; i < numRows; i++) {
    numCols = Math.max(numCols, records[i].length);
  }
  numCols = Math.min(numCols, 800);

  const data: number[][] = [];
  let sum = 0;
  let count = 0;
  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < numRows; i++) {
    data[i] = [];
    for (let j = 0; j < numCols; j++) {
      const raw = records[i]?.[j];
      const value = raw !== undefined && raw !== null && raw !== '' ? parseFloat(raw) : NaN;
      data[i][j] = value;
      if (!isNaN(value)) {
        sum += value;
        count++;
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    }
  }

  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      if (isNaN(data[i][j])) {
        data[i][j] = interpolate(data, i, j, numRows, numCols);
        sum += data[i][j];
        count++;
        min = Math.min(min, data[i][j]);
        max = Math.max(max, data[i][j]);
      }
    }
  }

  const avg = count > 0 ? sum / count : 0;

  if (min === Infinity || max === -Infinity) {
    min = 0;
    max = 0;
  }

  return { data, rows: numRows, cols: numCols, min, max, avg };
}

function interpolate(data: number[][], row: number, col: number, rows: number, cols: number): number {
  let sum = 0;
  let count = 0;

  for (let di = -1; di <= 1; di++) {
    for (let dj = -1; dj <= 1; dj++) {
      if (di === 0 && dj === 0) continue;
      const ni = row + di;
      const nj = col + dj;
      if (ni >= 0 && ni < rows && nj >= 0 && nj < cols) {
        const val = data[ni][nj];
        if (!isNaN(val)) {
          sum += val;
          count++;
        }
      }
    }
  }

  if (count > 0) return sum / count;

  for (let r = 2; r < Math.max(rows, cols); r++) {
    for (let di = -r; di <= r; di++) {
      for (let dj = -r; dj <= r; dj++) {
        const ni = row + di;
        const nj = col + dj;
        if (ni >= 0 && ni < rows && nj >= 0 && nj < cols) {
          const val = data[ni][nj];
          if (!isNaN(val)) {
            return val;
          }
        }
      }
    }
  }

  return 0;
}
