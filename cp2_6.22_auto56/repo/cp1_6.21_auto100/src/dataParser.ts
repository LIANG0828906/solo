import csvParser from 'csv-parser';
import { Readable } from 'stream';

export interface DataPoint {
  timestamp: number;
  value: number;
  normalizedValue: number;
  originalValue: number;
}

interface ParseRequest {
  rawText?: string;
  csvContent?: string;
}

interface ParseResponse {
  success: boolean;
  data?: DataPoint[];
  error?: string;
}

export function parseTextInput(text: string): number[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const values = cleaned
    .split(/[,; \t\n]+/)
    .map(v => parseFloat(v.trim()))
    .filter(v => !isNaN(v) && isFinite(v));
  return values;
}

export async function parseCsvContent(csvContent: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const values: number[] = [];
    const stream = Readable.from(csvContent);
    
    stream
      .pipe(csvParser({ headers: false }))
      .on('data', (row: Record<string, string>) => {
        const fields = Object.values(row);
        for (const field of fields) {
          const num = parseFloat(field);
          if (!isNaN(num) && isFinite(num)) {
            values.push(num);
          }
        }
      })
      .on('end', () => resolve(values))
      .on('error', reject);
  });
}

export function normalizeValues(values: number[]): number[] {
  if (values.length === 0) return [];
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  if (range === 0) {
    return values.map(() => 5);
  }
  
  return values.map(v => {
    const normalized = ((v - min) / range) * 10;
    return Math.max(0.1, Math.min(10, normalized));
  });
}

export function createDataPoints(values: number[], startTime: number = Date.now()): DataPoint[] {
  const normalized = normalizeValues(values);
  const interval = 1000;
  
  return values.map((value, index) => ({
    timestamp: startTime + index * interval,
    value: normalized[index],
    normalizedValue: normalized[index],
    originalValue: value
  }));
}

export async function parseData(request: ParseRequest): Promise<ParseResponse> {
  try {
    let values: number[] = [];
    
    if (request.csvContent) {
      values = await parseCsvContent(request.csvContent);
    } else if (request.rawText) {
      values = parseTextInput(request.rawText);
    }
    
    if (values.length === 0) {
      return {
        success: false,
        error: '未找到有效的数值数据'
      };
    }
    
    if (values.length < 2) {
      return {
        success: false,
        error: '至少需要2个数值才能生成瀑布图'
      };
    }
    
    const dataPoints = createDataPoints(values);
    
    return {
      success: true,
      data: dataPoints
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '解析数据时发生未知错误'
    };
  }
}

export default {
  parseData,
  parseTextInput,
  parseCsvContent,
  normalizeValues,
  createDataPoints
};
