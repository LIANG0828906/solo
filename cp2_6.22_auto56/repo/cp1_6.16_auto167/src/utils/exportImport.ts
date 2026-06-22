import { Zone, Path, CanvasState, LayoutData } from '@/types';

const VERSION = '1.0.0';

export function exportLayout(
  zones: Zone[],
  paths: Path[],
  canvas: CanvasState
): LayoutData {
  return {
    zones: JSON.parse(JSON.stringify(zones)),
    paths: JSON.parse(JSON.stringify(paths)),
    canvas: { ...canvas },
    version: VERSION,
    createdAt: Date.now(),
  };
}

export function downloadLayout(data: LayoutData, filename?: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ts = new Date(data.createdAt).toISOString().slice(0, 10);
  a.download = filename || `museum-layout-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  zones: Zone[];
  paths: Path[];
  canvas: CanvasState;
  version: string;
  createdAt: number;
}

export function importLayout(json: string): ImportResult {
  const parsed = JSON.parse(json) as LayoutData;
  if (!parsed.zones || !parsed.paths || !parsed.canvas) {
    throw new Error('布局数据格式错误：缺少必要字段');
  }
  return {
    zones: parsed.zones,
    paths: parsed.paths,
    canvas: parsed.canvas,
    version: parsed.version || '0.0.0',
    createdAt: parsed.createdAt || Date.now(),
  };
}

export function triggerFileImport(): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('未选择文件'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const result = importLayout(ev.target?.result as string);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    };
    input.click();
  });
}
