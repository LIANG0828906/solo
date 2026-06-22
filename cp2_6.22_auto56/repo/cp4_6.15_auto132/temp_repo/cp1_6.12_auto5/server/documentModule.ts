import { v4 as uuidv4 } from 'uuid';
import * as Diff from 'diff';
import type { DocumentState, VersionSnapshot, OTAction, DocumentMeta } from '../../shared/types';

const documents = new Map<string, DocumentState>();
const AUTO_SAVE_INTERVAL = 10000;
const MAX_VERSIONS = 100;

export function createDocument(title: string, initialContent = ''): DocumentState {
  const doc: DocumentState = {
    id: uuidv4(),
    title,
    content: initialContent,
    version: 0,
    versions: [],
    onlineUsers: [],
  };
  documents.set(doc.id, doc);
  return doc;
}

export function getDocument(id: string): DocumentState | undefined {
  return documents.get(id);
}

export function getAllDocuments(): DocumentMeta[] {
  const result: DocumentMeta[] = [];
  for (const doc of documents.values()) {
    result.push({
      id: doc.id,
      title: doc.title,
      createdAt: doc.versions[0]?.timestamp || Date.now(),
      lastEditedAt: doc.versions[doc.versions.length - 1]?.timestamp || Date.now(),
      lastEditor: doc.versions[doc.versions.length - 1]?.editorName || '未知',
      collaborators: doc.onlineUsers.length,
    });
  }
  return result.sort((a, b) => b.lastEditedAt - a.lastEditedAt);
}

export function updateDocumentTitle(id: string, title: string): boolean {
  const doc = documents.get(id);
  if (!doc) return false;
  doc.title = title;
  return true;
}

export function deleteDocument(id: string): boolean {
  return documents.delete(id);
}

export function applyOTAction(docId: string, action: OTAction): { success: boolean; newContent: string } {
  const doc = documents.get(docId);
  if (!doc) return { success: false, newContent: '' };

  const content = doc.content;
  let newContent = content;

  if (action.type === 'insert' && action.text) {
    const pos = Math.min(action.position, content.length);
    newContent = content.slice(0, pos) + action.text + content.slice(pos);
  } else if (action.type === 'delete' && action.length) {
    const pos = Math.min(action.position, content.length);
    const end = Math.min(pos + action.length, content.length);
    newContent = content.slice(0, pos) + content.slice(end);
  }

  doc.content = newContent;
  doc.version += 1;

  return { success: true, newContent };
}

export function saveSnapshot(docId: string, editorId: string, editorName: string, label?: string): VersionSnapshot | null {
  const doc = documents.get(docId);
  if (!doc) return null;

  const snapshot: VersionSnapshot = {
    id: uuidv4(),
    documentId: docId,
    content: doc.content,
    timestamp: Date.now(),
    editorId,
    editorName,
    label,
  };

  doc.versions.push(snapshot);

  if (doc.versions.length > MAX_VERSIONS) {
    doc.versions.shift();
  }

  return snapshot;
}

export function getVersions(docId: string): VersionSnapshot[] {
  const doc = documents.get(docId);
  if (!doc) return [];
  return [...doc.versions].reverse();
}

export function restoreVersion(docId: string, versionId: string): string | null {
  const doc = documents.get(docId);
  if (!doc) return null;

  const version = doc.versions.find(v => v.id === versionId);
  if (!version) return null;

  doc.content = version.content;
  doc.version += 1;

  return version.content;
}

export function computeDiff(oldContent: string, newContent: string): Diff.Change[] {
  return Diff.diffChars(oldContent, newContent);
}

export function addOnlineUser(docId: string, user: { id: string; name: string; color: string; avatar: string }): boolean {
  const doc = documents.get(docId);
  if (!doc) return false;

  const existing = doc.onlineUsers.find(u => u.id === user.id);
  if (!existing) {
    doc.onlineUsers.push(user);
  }
  return true;
}

export function removeOnlineUser(docId: string, userId: string): boolean {
  const doc = documents.get(docId);
  if (!doc) return false;

  const index = doc.onlineUsers.findIndex(u => u.id === userId);
  if (index !== -1) {
    doc.onlineUsers.splice(index, 1);
  }
  return true;
}

export function getOnlineUsers(docId: string): { id: string; name: string; color: string; avatar: string }[] {
  const doc = documents.get(docId);
  if (!doc) return [];
  return [...doc.onlineUsers];
}

const autoSaveTimers = new Map<string, NodeJS.Timeout>();

export function startAutoSave(docId: string, onSave: (snapshot: VersionSnapshot) => void): void {
  if (autoSaveTimers.has(docId)) return;

  const timer = setInterval(() => {
    const doc = documents.get(docId);
    if (doc && doc.onlineUsers.length > 0) {
      const lastUser = doc.onlineUsers[doc.onlineUsers.length - 1];
      const snapshot = saveSnapshot(docId, lastUser.id, lastUser.name, '自动保存');
      if (snapshot) {
        onSave(snapshot);
      }
    }
  }, AUTO_SAVE_INTERVAL);

  autoSaveTimers.set(docId, timer);
}

export function stopAutoSave(docId: string): void {
  const timer = autoSaveTimers.get(docId);
  if (timer) {
    clearInterval(timer);
    autoSaveTimers.delete(docId);
  }
}

export { AUTO_SAVE_INTERVAL };
