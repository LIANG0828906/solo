import Papa from 'papaparse';
import type { FieldType, CSVField, ParsedCSVData } from '../types';
import { SATURATED_COLORS } from '../types';

const MAX_ROWS = 200;

function inferFieldType(values: string[]): FieldType {
  if (values.length === 0) return 'categorical';
  
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonEmptyValues.length === 0) return 'categorical';
  
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{4}\/\d{2}\/\d{2}$/,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    /^\d{1,2}-\d{1,2}-\d{4}$/,
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    /^\d{4}$/
  ];
  
  const isDate = nonEmptyValues.every(v => 
    datePatterns.some(pattern => pattern.test(String(v))) ||
    !isNaN(Date.parse(String(v)))
  );
  
  if (isDate && nonEmptyValues.length > 2) {
    return 'time';
  }
  
  const isNumeric = nonEmptyValues.every(v => !isNaN(parseFloat(String(v))) && isFinite(Number(v)));
  
  if (isNumeric) {
    return 'numeric';
  }
  
  return 'categorical';
}

function parseValue(value: string, type: FieldType): any {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  switch (type) {
    case 'time':
      const parsedDate = new Date(value);
      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    case 'numeric':
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    default:
      return value;
  }
}

export async function parseCSVFile(file: File): Promise<ParsedCSVData> {
  return new Promise((resolve, reject) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      reject(new Error('请上传CSV格式的文件'));
      return;
    }
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: MAX_ROWS + 1,
      complete: (results) => {
        try {
          const data = results.data as Record<string, any>[];
          const meta = results.meta;
          
          if (data.length === 0) {
            reject(new Error('CSV文件为空或格式不正确'));
            return;
          }
          
          if (data.length > MAX_ROWS) {
            reject(new Error(`CSV文件最多支持${MAX_ROWS}行数据`));
            return;
          }
          
          const headers = meta.fields || [];
          
          if (headers.length === 0) {
            reject(new Error('未检测到列名，请确保CSV文件包含表头'));
            return;
          }
          
          const csvFields: CSVField[] = headers.map((name, index) => {
            const columnValues = data.map(row => row[name]);
            const type = inferFieldType(columnValues);
            return {
              name,
              type,
              color: SATURATED_COLORS[index % SATURATED_COLORS.length]
            };
          });
          
          const typedRows = data.map(row => {
            const typedRow: Record<string, any> = {};
            csvFields.forEach(field => {
              typedRow[field.name] = parseValue(row[field.name], field.type);
            });
            return typedRow;
          });
          
          resolve({
            headers: csvFields,
            rows: typedRows,
            rowCount: typedRows.length
          });
        } catch (error) {
          reject(new Error(`解析CSV文件时出错: ${(error as Error).message}`));
        }
      },
      error: (error) => {
        reject(new Error(`解析CSV文件失败: ${error.message}`));
      }
    });
  });
}

export function generateSampleData(): ParsedCSVData {
  const years = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  
  const rows: Record<string, any>[] = [];
  
  for (let i = 0; i < 120; i++) {
    const yearIndex = Math.floor(i / 12);
    const monthIndex = i % 12;
    const dateStr = `${years[yearIndex]}-${months[monthIndex]}-15`;
    
    const tempBase = 15 + Math.sin(monthIndex / 12 * Math.PI * 2) * 10;
    const tempTrend = yearIndex * 0.3;
    const tempAnomaly = yearIndex >= 5 ? (yearIndex - 5) * 0.8 : 0;
    
    const rainBase = 80 + Math.sin(monthIndex / 12 * Math.PI * 2 + 1) * 40;
    const rainTrend = yearIndex * 0.5;
    const rainAnomaly = (yearIndex === 5 && monthIndex === 2) ? 150 : 0;
    
    const aqiBase = 60 + Math.sin(monthIndex / 12 * Math.PI * 2 - 0.5) * 20;
    const aqiTrend = -yearIndex * 1.5;
    const aqiAnomaly = (yearIndex >= 7) ? -20 : 0;
    
    rows.push({
      date: new Date(dateStr),
      temperature: Math.round((tempBase + tempTrend + tempAnomaly + (Math.random() - 0.5) * 2) * 10) / 10,
      rainfall: Math.round((rainBase + rainTrend + rainAnomaly + (Math.random() - 0.5) * 10) * 10) / 10,
      aqi: Math.round(Math.max(10, aqiBase + aqiTrend + aqiAnomaly + (Math.random() - 0.5) * 8))
    });
  }
  
  return {
    headers: [
      { name: 'date', type: 'time', color: '#666666' },
      { name: 'temperature', type: 'numeric', color: '#FF5733' },
      { name: 'rainfall', type: 'numeric', color: '#3357FF' },
      { name: 'aqi', type: 'numeric', color: '#33FF57' }
    ],
    rows,
    rowCount: rows.length
  };
}
