import type { TimelineNode, Branch } from '@/shared/types';

interface ExportData {
  version: string;
  exportedAt: number;
  nodes: TimelineNode[];
  branches: Branch[];
}

export function exportToJSON(nodes: TimelineNode[], branches: Branch[]): void {
  const data: ExportData = {
    version: '1.0.0',
    exportedAt: Date.now(),
    nodes,
    branches,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `timeline-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importFromJSON(
  file: File
): Promise<{ nodes: TimelineNode[]; branches: Branch[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = e.target?.result;
        if (typeof raw !== 'string') {
          reject(new Error('无法读取文件内容'));
          return;
        }
        const data: ExportData = JSON.parse(raw);
        if (!data.nodes || !Array.isArray(data.nodes)) {
          reject(new Error('无效的JSON格式：缺少nodes数组'));
          return;
        }
        if (!data.branches || !Array.isArray(data.branches)) {
          reject(new Error('无效的JSON格式：缺少branches数组'));
          return;
        }
        resolve({ nodes: data.nodes, branches: data.branches });
      } catch (err) {
        reject(new Error('JSON解析失败：' + (err as Error).message));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}
