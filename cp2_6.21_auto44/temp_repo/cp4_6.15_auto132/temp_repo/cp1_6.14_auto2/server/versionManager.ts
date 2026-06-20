import { diff_match_patch as DiffMatchPatch, Diff } from 'diff-match-patch';
import { v4 as uuidv4 } from 'uuid';

export interface Version {
  id: string;
  versionNumber: number;
  content: string;
  timestamp: number;
  summary: string;
}

export interface DocumentState {
  docId: string;
  currentContent: string;
  versions: Version[];
  lastSavedAt: number;
}

const dmp = new DiffMatchPatch();

class VersionManager {
  private documents: Map<string, DocumentState> = new Map();

  getOrCreateDocument(docId: string): DocumentState {
    if (!this.documents.has(docId)) {
      const initialContent = `<h1>欢迎使用协作编辑器</h1><p>开始输入你的内容...</p>`;
      const initialVersion: Version = {
        id: uuidv4(),
        versionNumber: 1,
        content: initialContent,
        timestamp: Date.now(),
        summary: '初始版本',
      };
      this.documents.set(docId, {
        docId,
        currentContent: initialContent,
        versions: [initialVersion],
        lastSavedAt: Date.now(),
      });
    }
    return this.documents.get(docId)!;
  }

  getCurrentContent(docId: string): string {
    const doc = this.getOrCreateDocument(docId);
    return doc.currentContent;
  }

  applyEdits(docId: string, edits: string): string {
    const doc = this.getOrCreateDocument(docId);
    if (!edits || edits.length === 0) return doc.currentContent;

    try {
      const patches = dmp.patch_fromText(edits);
      const [newContent, results] = dmp.patch_apply(patches, doc.currentContent);
      if (results.some((r) => r === false)) {
        return doc.currentContent;
      }
      doc.currentContent = newContent;
    } catch {
      return doc.currentContent;
    }
    return doc.currentContent;
  }

  setFullContent(docId: string, content: string): string {
    const doc = this.getOrCreateDocument(docId);
    doc.currentContent = content;
    return doc.currentContent;
  }

  createDiff(oldText: string, newText: string): string {
    const patches = dmp.patch_make(oldText, newText);
    return dmp.patch_toText(patches);
  }

  saveVersion(docId: string): Version | null {
    const doc = this.getOrCreateDocument(docId);
    const lastVersion = doc.versions[doc.versions.length - 1];

    if (lastVersion && lastVersion.content === doc.currentContent) {
      return null;
    }

    const diffs: Diff[] = dmp.diff_main(
      lastVersion ? lastVersion.content : '',
      doc.currentContent,
    );
    dmp.diff_cleanupSemantic(diffs);
    const changes = diffs
      .filter((d) => d[0] !== 0)
      .map((d) => (d[0] === 1 ? `+${d[1].slice(0, 30)}` : `-${d[1].slice(0, 30)}`))
      .join(' ');

    const summary =
      changes.length > 0
        ? changes.slice(0, 80)
        : `版本 ${doc.versions.length + 1}`;

    const newVersion: Version = {
      id: uuidv4(),
      versionNumber: doc.versions.length + 1,
      content: doc.currentContent,
      timestamp: Date.now(),
      summary,
    };

    doc.versions.push(newVersion);
    doc.lastSavedAt = Date.now();

    return newVersion;
  }

  getVersions(docId: string): Version[] {
    const doc = this.getOrCreateDocument(docId);
    return [...doc.versions].reverse();
  }

  getVersion(docId: string, versionId: string): Version | null {
    const doc = this.getOrCreateDocument(docId);
    return doc.versions.find((v) => v.id === versionId) || null;
  }

  restoreVersion(docId: string, versionId: string): Version | null {
    const doc = this.getOrCreateDocument(docId);
    const targetVersion = doc.versions.find((v) => v.id === versionId);

    if (!targetVersion) {
      return null;
    }

    doc.currentContent = targetVersion.content;

    const restoredVersion: Version = {
      id: uuidv4(),
      versionNumber: doc.versions.length + 1,
      content: targetVersion.content,
      timestamp: Date.now(),
      summary: `恢复至版本 ${targetVersion.versionNumber}`,
    };

    doc.versions.push(restoredVersion);
    doc.lastSavedAt = Date.now();

    return restoredVersion;
  }
}

export const versionManager = new VersionManager();
