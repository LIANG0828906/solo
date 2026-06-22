import type { CSVParseResult, DataPoint } from './types';

export function parseCSV(text: string): CSVParseResult {
  try {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      return { columns: [], data: [], error: 'CSV文件至少需要包含表头和一行数据' };
    }

    const headerLine = lines[0];
    const columns = parseCSVLine(headerLine);

    if (columns.length < 2) {
      return { columns: [], data: [], error: 'CSV文件至少需要包含时间列和一个数据列' };
    }

    const dataColumns = columns.slice(1);
    if (dataColumns.length > 10) {
      return { columns: [], data: [], error: `数据列数不能超过10列，当前有${dataColumns.length}列` };
    }

    const data: DataPoint[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      if (values.length !== columns.length) {
        return { columns: [], data: [], error: `第${i + 1}行列数不匹配` };
      }

      const timestamp = parseTimestamp(values[0]);
      if (isNaN(timestamp)) {
        return { columns: [], data: [], error: `第${i + 1}行时间格式无法解析: ${values[0]}` };
      }

      const numericValues: number[] = [];
      for (let j = 1; j < values.length; j++) {
        const num = parseFloat(values[j]);
        if (isNaN(num)) {
          return { columns: [], data: [], error: `第${i + 1}行第${j + 1}列不是有效数字: ${values[j]}` };
        }
        numericValues.push(num);
      }

      data.push({ timestamp, values: numericValues });
    }

    data.sort((a, b) => a.timestamp - b.timestamp);

    return { columns, data };
  } catch (e) {
    return { columns: [], data: [], error: '解析CSV时发生错误' };
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseTimestamp(value: string): number {
  const trimmed = value.trim();
  
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    if (num > 1e12) return num;
    if (num > 1e9) return num * 1000;
  }

  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date.getTime();
  }

  return NaN;
}

export function generateSampleData(): CSVParseResult {
  const columns = ['时间', '温度', '湿度', '压力'];
  const data: DataPoint[] = [];
  const now = Date.now();

  for (let i = 0; i < 100; i++) {
    const timestamp = now - (100 - i) * 60000;
    const temp = 20 + Math.sin(i / 10) * 5 + Math.random() * 2;
    const humidity = 60 + Math.cos(i / 8) * 10 + Math.random() * 3;
    const pressure = 1013 + Math.sin(i / 15) * 5 + Math.random() * 2;
    data.push({ timestamp, values: [temp, humidity, pressure] });
  }

  return { columns, data };
}
