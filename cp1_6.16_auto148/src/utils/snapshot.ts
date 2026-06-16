import { TimelineSnapshot } from '../modules/timeline/TimelineEngine';

const SNAPSHOT_FILE_PREFIX = 'timeline-snapshot';
const SNAPSHOT_FILE_EXT = '.json';
const SUPPORTED_VERSIONS = ['1.0.0'];

export function serializeSnapshot(snapshot: TimelineSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function deserializeSnapshot(json: string): TimelineSnapshot {
  const parsed = JSON.parse(json);
  if (!validateSnapshot(parsed)) {
    throw new Error('快照格式无效或版本不兼容');
  }
  return parsed as TimelineSnapshot;
}

export function validateSnapshot(data: unknown): data is TimelineSnapshot {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  if (typeof obj.version !== 'string' || !SUPPORTED_VERSIONS.includes(obj.version)) {
    return false;
  }
  if (typeof obj.exportedAt !== 'number') return false;
  if (!Array.isArray(obj.timelines)) return false;

  for (const t of obj.timelines as unknown[]) {
    if (!t || typeof t !== 'object') return false;
    const timeline = t as Record<string, unknown>;
    if (typeof timeline.id !== 'string') return false;
    if (typeof timeline.title !== 'string') return false;
    if (typeof timeline.color !== 'string') return false;
    if (typeof timeline.yPosition !== 'number') return false;
    if (typeof timeline.createdAt !== 'number') return false;
    if (!Array.isArray(timeline.nodes)) return false;

    for (const n of timeline.nodes as unknown[]) {
      if (!n || typeof n !== 'object') return false;
      const node = n as Record<string, unknown>;
      if (typeof node.id !== 'string') return false;
      if (typeof node.timelineId !== 'string') return false;
      if (typeof node.title !== 'string') return false;
      if (typeof node.description !== 'string') return false;
      if (typeof node.date !== 'number') return false;
      if (!Array.isArray(node.tags)) return false;
      if (typeof node.shape !== 'string') return false;
      if (typeof node.positionX !== 'number') return false;
    }
  }

  if (obj.viewport && typeof obj.viewport === 'object') {
    const vp = obj.viewport as Record<string, unknown>;
    if (typeof vp.offsetX !== 'number') return false;
    if (typeof vp.offsetY !== 'number') return false;
    if (typeof vp.zoom !== 'number') return false;
  }

  return true;
}

export function exportSnapshotToFile(snapshot: TimelineSnapshot): void {
  const json = serializeSnapshot(snapshot);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date(snapshot.exportedAt);
  const dateStr = timestamp.toISOString().slice(0, 10);
  const timeStr = timestamp.toTimeString().slice(0, 8).replace(/:/g, '-');
  const filename = `${SNAPSHOT_FILE_PREFIX}-${dateStr}-${timeStr}${SNAPSHOT_FILE_EXT}`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importSnapshotFromFile(file: File): Promise<TimelineSnapshot> {
  return new Promise((resolve, reject) => {
    if (!file.name.toLowerCase().endsWith(SNAPSHOT_FILE_EXT)) {
      reject(new Error('请选择 .json 格式的快照文件'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    reader.onload = () => {
      try {
        const content = reader.result as string;
        const snapshot = deserializeSnapshot(content);
        resolve(snapshot);
      } catch (e) {
        reject(new Error(`快照解析失败: ${(e as Error).message}`));
      }
    };
    reader.readAsText(file, 'utf-8');
  });
}

export function openFilePicker(): Promise<File> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.multiple = false;
    input.style.display = 'none';

    const cleanup = () => {
      input.removeEventListener('change', handleChange);
      document.body.removeChild(input);
    };

    const handleChange = () => {
      const file = input.files?.[0];
      if (file) {
        resolve(file);
      } else {
        reject(new Error('未选择文件'));
      }
      cleanup();
    };

    input.addEventListener('change', handleChange);
    document.body.appendChild(input);
    input.click();

    setTimeout(() => {
      if (!input.files?.length) {
        cleanup();
      }
    }, 60000);
  });
}

export function formatExportDate(exportedAt: number): string {
  const d = new Date(exportedAt);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${min}`;
}
