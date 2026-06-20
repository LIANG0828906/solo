import { Book, Note, MindMapNode, AppData, ImportResult } from './types';

const BOOKS_KEY = 'readmark_books';
const NOTES_KEY = 'readmark_notes';
const MINDMAP_KEY = 'readmark_mindmap';

function readFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export async function getBooks(): Promise<Book[]> {
  return readFromStorage<Book[]>(BOOKS_KEY, []);
}

export async function addBook(book: Book): Promise<Book> {
  const books = await getBooks();
  books.push(book);
  writeToStorage(BOOKS_KEY, books);
  return book;
}

export async function updateBook(updated: Book): Promise<Book> {
  const books = await getBooks();
  const idx = books.findIndex(b => b.id === updated.id);
  if (idx >= 0) books[idx] = updated;
  writeToStorage(BOOKS_KEY, books);
  return updated;
}

export async function deleteBook(id: string): Promise<void> {
  const books = await getBooks();
  writeToStorage(BOOKS_KEY, books.filter(b => b.id !== id));
  const notes = await getNotes();
  writeToStorage(NOTES_KEY, notes.filter(n => n.bookId !== id));
  const nodes = await getMindMapNodes();
  writeToStorage(MINDMAP_KEY, nodes.filter(n => n.bookId !== id));
}

export async function getNotes(): Promise<Note[]> {
  return readFromStorage<Note[]>(NOTES_KEY, []);
}

export async function getNotesByBookId(bookId: string): Promise<Note[]> {
  const notes = await getNotes();
  return notes.filter(n => n.bookId === bookId);
}

export async function addNote(note: Note): Promise<Note> {
  const notes = await getNotes();
  notes.push(note);
  writeToStorage(NOTES_KEY, notes);
  return note;
}

export async function updateNote(updated: Note): Promise<Note> {
  const notes = await getNotes();
  const idx = notes.findIndex(n => n.id === updated.id);
  if (idx >= 0) notes[idx] = updated;
  writeToStorage(NOTES_KEY, notes);
  return updated;
}

export async function deleteNote(id: string): Promise<void> {
  const notes = await getNotes();
  writeToStorage(NOTES_KEY, notes.filter(n => n.id !== id));
}

export async function getMindMapNodes(): Promise<MindMapNode[]> {
  return readFromStorage<MindMapNode[]>(MINDMAP_KEY, []);
}

export async function getMindMapNodesByBookId(bookId: string): Promise<MindMapNode[]> {
  const nodes = await getMindMapNodes();
  return nodes.filter(n => n.bookId === bookId);
}

export async function addMindMapNode(node: MindMapNode): Promise<MindMapNode> {
  const nodes = await getMindMapNodes();
  nodes.push(node);
  writeToStorage(MINDMAP_KEY, nodes);
  return node;
}

export async function updateMindMapNode(updated: MindMapNode): Promise<MindMapNode> {
  const nodes = await getMindMapNodes();
  const idx = nodes.findIndex(n => n.id === updated.id);
  if (idx >= 0) nodes[idx] = updated;
  writeToStorage(MINDMAP_KEY, nodes);
  return updated;
}

export async function deleteMindMapNode(id: string): Promise<void> {
  const nodes = await getMindMapNodes();
  const children = nodes.filter(n => n.parentId === id);
  let toDelete = new Set<string>([id]);
  for (const child of children) {
    toDelete.add(child.id);
  }
  writeToStorage(MINDMAP_KEY, nodes.filter(n => !toDelete.has(n.id)));
}

export async function exportData(): Promise<string> {
  const [books, notes, nodes] = await Promise.all([
    getBooks(),
    getNotes(),
    getMindMapNodes(),
  ]);
  const data: AppData = { books, notes, mindMapNodes: nodes };
  return JSON.stringify(data, null, 2);
}

export async function importData(
  jsonString: string,
  mode: 'overwrite' | 'merge'
): Promise<ImportResult> {
  const incoming = JSON.parse(jsonString) as AppData;
  if (mode === 'overwrite') {
    writeToStorage(BOOKS_KEY, incoming.books);
    writeToStorage(NOTES_KEY, incoming.notes);
    writeToStorage(MINDMAP_KEY, incoming.mindMapNodes);
    return {
      newBooks: incoming.books.length,
      newNotes: incoming.notes.length,
      duplicates: 0,
    };
  }
  const existingBooks = await getBooks();
  const existingNotes = await getNotes();
  const existingNodes = await getMindMapNodes();
  const existingBookIds = new Set(existingBooks.map(b => b.id));
  const existingNoteIds = new Set(existingNotes.map(n => n.id));
  const existingNodeIds = new Set(existingNodes.map(n => n.id));
  const newBooks = incoming.books.filter(b => !existingBookIds.has(b.id));
  const newNotes = incoming.notes.filter(n => !existingNoteIds.has(n.id));
  const newNodes = incoming.mindMapNodes.filter(n => !existingNodeIds.has(n.id));
  const dupBooks = incoming.books.length - newBooks.length;
  const dupNotes = incoming.notes.length - newNotes.length;
  writeToStorage(BOOKS_KEY, [...existingBooks, ...newBooks]);
  writeToStorage(NOTES_KEY, [...existingNotes, ...newNotes]);
  writeToStorage(MINDMAP_KEY, [...existingNodes, ...newNodes]);
  return {
    newBooks: newBooks.length,
    newNotes: newNotes.length,
    duplicates: dupBooks + dupNotes,
  };
}
