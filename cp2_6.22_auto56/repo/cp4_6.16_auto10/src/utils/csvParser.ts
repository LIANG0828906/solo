import type { DataPoint } from '../types';

export function parseCSV(csvText: string): DataPoint[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim());

  let xIndex = 0;
  let yIndex = 1;
  let categoryIndex: number | undefined;

  const numberColumns: number[] = [];
  headers.forEach((header, index) => {
    const sample = lines[1]?.split(',')[index]?.trim();
    if (sample && !isNaN(Number(sample))) {
      numberColumns.push(index);
    }
  });

  if (numberColumns.length >= 2) {
    xIndex = numberColumns[0];
    yIndex = numberColumns[1];
  } else if (numberColumns.length === 1) {
    yIndex = numberColumns[0];
    xIndex = headers.findIndex((_, i) => i !== yIndex);
    if (xIndex === -1) xIndex = 0;
  }

  const categoryHeader = headers.findIndex(h => 
    h.toLowerCase().includes('category') || 
    h.toLowerCase().includes('group') ||
    h.toLowerCase().includes('类别') ||
    h.toLowerCase().includes('分组')
  );
  if (categoryHeader !== -1 && categoryHeader !== xIndex && categoryHeader !== yIndex) {
    categoryIndex = categoryHeader;
  }

  const dataPoints: DataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < 2) continue;

    const xRaw = values[xIndex];
    const yRaw = values[yIndex];

    if (!xRaw || !yRaw) continue;

    const y = Number(yRaw);
    if (isNaN(y)) continue;

    const x = !isNaN(Number(xRaw)) ? Number(xRaw) : xRaw;

    const dataPoint: DataPoint = { x, y };

    if (categoryIndex !== undefined && values[categoryIndex]) {
      dataPoint.category = values[categoryIndex];
    }

    dataPoints.push(dataPoint);
  }

  return dataPoints;
}

export function handleFileUpload(file: File): Promise<DataPoint[]> {
  return new Promise((resolve, reject) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      reject(new Error('请上传CSV文件'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);
        if (data.length === 0) {
          reject(new Error('CSV文件中没有有效数据'));
        } else {
          resolve(data);
        }
      } catch (error) {
        reject(new Error('解析CSV文件失败'));
      }
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsText(file);
  });
}
