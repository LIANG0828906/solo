import { parse } from 'csv-parse/browser/esm/sync';
import type { CellData } from './types';
import mockDataUrl from './assets/mockData.csv?raw';

export function parseCSV(csvContent: string): {
  columns: string[];
  data: CellData[];
} {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    cast: (value, context) => {
      if (context.column === 'id') return parseInt(value, 10);
      if (['diameter', 'fluorescence', 'viability'].includes(context.column as string)) {
        return parseFloat(value);
      }
      return value;
    }
  });

  const columns = Object.keys(records[0] || {});
  return { columns, data: records as CellData[] };
}

export function loadMockData(): Promise<{
  columns: string[];
  data: CellData[];
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = parseCSV(mockDataUrl);
      resolve(result);
    }, 800);
  });
}
