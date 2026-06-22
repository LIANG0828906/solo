import { openDB, IDBPDatabase } from 'idb';
import type { Note, Annotation, Concept, Edge, VersionHistory } from '@/types';

const DB_NAME = 'notesync-db';
const DB_VERSION = 1;

export interface DBSchema {
  notes: {
    key: string;
    value: Note;
    indexes: { 'by-updatedAt': Date };
  };
  annotations: {
    key: string;
    value: Annotation;
    indexes: { 'by-noteId': string };
  };
  concepts: {
    key: string;
    value: Concept;
    indexes: { 'by-noteId': string };
  };
  edges: {
    key: string;
    value: Edge;
    indexes: { 'by-noteId': string };
  };
  versionHistory: {
    key: string;
    value: VersionHistory;
    indexes: { 'by-noteId-timestamp': [string, Date] };
  };
}

let db: IDBPDatabase<DBSchema> | null = null;

export async function initDB(): Promise<IDBPDatabase<DBSchema>> {
  if (db) return db;

  db = await openDB<DBSchema>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('notes')) {
        const noteStore = database.createObjectStore('notes', { keyPath: 'id' });
        noteStore.createIndex('by-updatedAt', 'updatedAt');
      }

      if (!database.objectStoreNames.contains('annotations')) {
        const annStore = database.createObjectStore('annotations', { keyPath: 'id' });
        annStore.createIndex('by-noteId', 'noteId');
      }

      if (!database.objectStoreNames.contains('concepts')) {
        const conceptStore = database.createObjectStore('concepts', { keyPath: 'id' });
        conceptStore.createIndex('by-noteId', 'noteId');
      }

      if (!database.objectStoreNames.contains('edges')) {
        const edgeStore = database.createObjectStore('edges', { keyPath: 'id' });
        edgeStore.createIndex('by-noteId', 'noteId');
      }

      if (!database.objectStoreNames.contains('versionHistory')) {
        const historyStore = database.createObjectStore('versionHistory', { keyPath: 'id' });
        historyStore.createIndex('by-noteId-timestamp', ['noteId', 'timestamp']);
      }
    },
  });

  return db;
}

export async function saveNote(note: Note): Promise<void> {
  const database = await initDB();
  await database.put('notes', note);
}

export async function getNote(id: string): Promise<Note | undefined> {
  const database = await initDB();
  return await database.get('notes', id);
}

export async function saveAnnotation(annotation: Annotation): Promise<void> {
  const database = await initDB();
  await database.put('annotations', annotation);
}

export async function deleteAnnotation(id: string): Promise<void> {
  const database = await initDB();
  await database.delete('annotations', id);
}

export async function getAnnotations(noteId: string): Promise<Annotation[]> {
  const database = await initDB();
  return await database.getAllFromIndex('annotations', 'by-noteId', noteId);
}

export async function saveConcepts(concepts: Concept[]): Promise<void> {
  const database = await initDB();
  const tx = database.transaction('concepts', 'readwrite');
  for (const concept of concepts) {
    await tx.store.put(concept);
  }
  await tx.done;
}

export async function getConcepts(noteId: string): Promise<Concept[]> {
  const database = await initDB();
  return await database.getAllFromIndex('concepts', 'by-noteId', noteId);
}

export async function saveEdges(edges: Edge[]): Promise<void> {
  const database = await initDB();
  const tx = database.transaction('edges', 'readwrite');
  for (const edge of edges) {
    await tx.store.put(edge);
  }
  await tx.done;
}

export async function getEdges(noteId: string): Promise<Edge[]> {
  const database = await initDB();
  return await database.getAllFromIndex('edges', 'by-noteId', noteId);
}

export async function saveVersion(version: VersionHistory): Promise<void> {
  const database = await initDB();
  await database.put('versionHistory', version);
}

export async function getVersions(noteId: string): Promise<VersionHistory[]> {
  const database = await initDB();
  const all = await database.getAll('versionHistory');
  return all
    .filter(v => v.noteId === noteId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function deleteConceptsByNoteId(noteId: string): Promise<void> {
  const database = await initDB();
  const concepts = await getConcepts(noteId);
  const tx = database.transaction('concepts', 'readwrite');
  for (const concept of concepts) {
    await tx.store.delete(concept.id);
  }
  await tx.done;
}

export async function deleteEdgesByNoteId(noteId: string): Promise<void> {
  const database = await initDB();
  const edges = await getEdges(noteId);
  const tx = database.transaction('edges', 'readwrite');
  for (const edge of edges) {
    await tx.store.delete(edge.id);
  }
  await tx.done;
}
