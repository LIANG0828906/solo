import { useState, useCallback } from 'react';
import Papa from 'papaparse';

export interface ParsedData {
  columns: string[];
  rows: Record<string, any>[];
}

type FileType = 'csv' | 'json';

function detectFileType(fileName: string): FileType {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'csv') return 'csv';
  if (ext === 'json') return 'json';
  throw new Error(`不支持的文件格式: .${ext}。仅支持 .csv 和 .json 文件。`);
}

function validateData(data: ParsedData): void {
  if (!data.columns || data.columns.length === 0) {
    throw new Error('数据验证失败：未检测到任何列。');
  }
  if (!data.rows || data.rows.length === 0) {
    throw new Error('数据验证失败：未检测到任何数据行。');
  }
}

function parseCsvFile(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, any>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          const firstError = results.errors[0];
          reject(new Error(`CSV解析错误: ${firstError.message}`));
          return;
        }

        const rows = results.data.filter(
          (row) => row && Object.keys(row).some((key) => row[key] !== '')
        );

        const columns = results.meta.fields || [];

        try {
          const parsedData: ParsedData = { columns, rows };
          validateData(parsedData);
          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`CSV解析失败: ${error.message}`));
      },
    });
  });
}

function parseJsonFile(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const json = JSON.parse(content);

        let rows: Record<string, any>[] = [];

        if (Array.isArray(json)) {
          if (json.length === 0) {
            throw new Error('JSON文件为空数组。');
          }

          if (typeof json[0] === 'object' && json[0] !== null) {
            rows = json as Record<string, any>[];
          } else {
            rows = json.map((value, index) => ({ value, index }));
          }
        } else if (typeof json === 'object' && json !== null) {
          rows = [json as Record<string, any>];
        } else {
          throw new Error('JSON格式不支持。请提供数组或对象格式的JSON数据。');
        }

        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

        const parsedData: ParsedData = { columns, rows };
        validateData(parsedData);
        resolve(parsedData);
      } catch (error) {
        if (error instanceof Error) {
          reject(new Error(`JSON解析失败: ${error.message}`));
        } else {
          reject(new Error('JSON解析失败：未知错误。'));
        }
      }
    };

    reader.onerror = () => {
      reject(new Error('读取JSON文件失败。'));
    };

    reader.readAsText(file);
  });
}

export function useDataParser() {
  const [parseError, setParseError] = useState<string | null>(null);

  const parseFile = useCallback(
    async (file: File): Promise<ParsedData> => {
      setParseError(null);

      try {
        const fileType = detectFileType(file.name);

        let result: ParsedData;

        if (fileType === 'csv') {
          result = await parseCsvFile(file);
        } else {
          result = await parseJsonFile(file);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知解析错误';
        setParseError(errorMessage);
        throw error;
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setParseError(null);
  }, []);

  return {
    parseFile,
    parseError,
    clearError,
  };
}
