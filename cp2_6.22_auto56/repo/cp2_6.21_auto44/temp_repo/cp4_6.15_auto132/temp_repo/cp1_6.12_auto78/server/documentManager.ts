import { LyricLine, TextOperation } from '../src/types';

export interface DocumentState {
  lines: LyricLine[];
  version: number;
  history: TextOperation[];
}

export class DocumentManager {
  private documents: Map<string, DocumentState> = new Map();

  getOrCreate(roomId: string): DocumentState {
    if (!this.documents.has(roomId)) {
      this.documents.set(roomId, {
        lines: this.createDefaultLines(),
        version: 0,
        history: [],
      });
    }
    return this.documents.get(roomId)!;
  }

  private createDefaultLines(): LyricLine[] {
    return Array.from({ length: 12 }, (_, i) => ({
      id: `line_default_${i}_${Date.now()}`,
      text: i === 0 ? '在这里输入第一行歌词...' : '',
    }));
  }

  applyOperation(roomId: string, operation: TextOperation): { success: boolean; transformed?: TextOperation } {
    const doc = this.getOrCreate(roomId);

    while (doc.lines.length <= operation.lineIndex) {
      doc.lines.push({
        id: `line_auto_${Date.now()}_${doc.lines.length}`,
        text: '',
      });
    }

    const line = doc.lines[operation.lineIndex];

    switch (operation.type) {
      case 'insert': {
        if (operation.text === undefined) return { success: false };
        const chars = [...line.text];
        const insertIdx = Math.min(operation.charIndex, chars.length);
        chars.splice(insertIdx, 0, operation.text);
        line.text = chars.join('');
        break;
      }
      case 'delete': {
        if (operation.length === undefined) return { success: false };
        const chars = [...line.text];
        const delIdx = Math.min(operation.charIndex, Math.max(0, chars.length - operation.length));
        chars.splice(delIdx, operation.length);
        line.text = chars.join('');
        break;
      }
      case 'replace': {
        if (operation.text === undefined || operation.length === undefined) return { success: false };
        const chars = [...line.text];
        const repIdx = Math.min(operation.charIndex, chars.length);
        const repLen = Math.min(operation.length, Math.max(0, chars.length - repIdx));
        chars.splice(repIdx, repLen, operation.text);
        line.text = chars.join('');
        break;
      }
    }

    doc.version = Math.max(doc.version, operation.version);
    doc.history.push(operation);
    if (doc.history.length > 500) {
      doc.history = doc.history.slice(-500);
    }

    return { success: true };
  }

  getLines(roomId: string): LyricLine[] {
    return JSON.parse(JSON.stringify(this.getOrCreate(roomId).lines));
  }

  getVersion(roomId: string): number {
    return this.getOrCreate(roomId).version;
  }

  clear(roomId: string) {
    this.documents.delete(roomId);
  }
}

export const documentManager = new DocumentManager();
