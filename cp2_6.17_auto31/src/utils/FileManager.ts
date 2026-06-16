export interface SnapshotPiece {
  id: string;
  correctX: number;
  correctY: number;
  curX: number;
  curY: number;
  locked: boolean;
  zIndex: number;
  pieceWidth: number;
  pieceHeight: number;
  imgDataBase64: string;
}

export interface PuzzleSnapshot {
  version: string;
  gridSize: number;
  canvasSize: number;
  pieces: SnapshotPiece[];
  savedAt: string;
}

function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    '_' +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

export function saveSnapshot(snapshot: PuzzleSnapshot): void {
  const jsonStr = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `puzzle_${formatDate(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function loadSnapshot(file: File): Promise<PuzzleSnapshot> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const snapshot = JSON.parse(content) as PuzzleSnapshot;
        if (!snapshot || !Array.isArray(snapshot.pieces)) {
          reject(new Error('无效的快照文件格式'));
          return;
        }
        resolve(snapshot);
      } catch (err) {
        reject(new Error('解析快照文件失败'));
      }
    };
    reader.onerror = () => reject(new Error('读取快照文件失败'));
    reader.readAsText(file);
  });
}
