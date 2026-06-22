import stringify from 'json-stable-stringify';
import type { SnapshotData } from '@/store/editorStore';

export const serializeSnapshot = (data: SnapshotData): string => {
  return stringify(data, { space: 2 });
};

export const deserializeSnapshot = (json: string): SnapshotData => {
  const parsed = JSON.parse(json);
  if (!parsed.geometryList || !parsed.lightList) {
    throw new Error('Invalid snapshot format');
  }
  return parsed as SnapshotData;
};

export const downloadSnapshot = (data: SnapshotData, filename?: string) => {
  const jsonStr = serializeSnapshot(data);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  link.download = filename || `geometry-snapshot-${ts}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const loadSnapshotFromFile = (file: File): Promise<SnapshotData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = deserializeSnapshot(content);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
