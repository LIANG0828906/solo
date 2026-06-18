import { v4 as uuidv4 } from 'uuid';
import type { EditOp, Comment, Reply, Version, UserInfo, ConflictInfo } from '../types';

interface HistoryEntry {
  op: EditOp;
  inverseOp: EditOp;
}

export class EditorEngine {
  private content: string;
  private comments: Comment[];
  private versions: Version[];
  private cursorPosition: number;
  private selectionStart: number;
  private selectionEnd: number;
  private undoStack: HistoryEntry[];
  private redoStack: HistoryEntry[];
  private listeners: Set<() => void>;
  private userId: string;
  private lastSavedAt: number;
  private versionUndoStacks: Map<string, { undo: HistoryEntry[]; redo: HistoryEntry[] }>;

  constructor(initialContent: string = '', userId: string) {
    this.content = initialContent;
    this.comments = [];
    this.versions = [];
    this.cursorPosition = 0;
    this.selectionStart = 0;
    this.selectionEnd = 0;
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = new Set();
    this.userId = userId;
    this.lastSavedAt = Date.now();
    this.versionUndoStacks = new Map();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  getContent(): string {
    return this.content;
  }

  getComments(): Comment[] {
    return this.comments;
  }

  getVersions(): Version[] {
    return this.versions;
  }

  getCursorPosition(): number {
    return this.cursorPosition;
  }

  getSelection(): { start: number; end: number } {
    return { start: this.selectionStart, end: this.selectionEnd };
  }

  getLastSavedAt(): number {
    return this.lastSavedAt;
  }

  getWordCount(): number {
    const text = this.content.trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
  }

  setCursor(position: number): void {
    this.cursorPosition = Math.max(0, Math.min(position, this.content.length));
    this.selectionStart = this.cursorPosition;
    this.selectionEnd = this.cursorPosition;
    this.notify();
  }

  setSelection(start: number, end: number): void {
    this.selectionStart = Math.max(0, Math.min(start, this.content.length));
    this.selectionEnd = Math.max(0, Math.min(end, this.content.length));
    this.cursorPosition = this.selectionEnd;
    this.notify();
  }

  insertText(position: number, text: string): EditOp {
    const op: EditOp = {
      type: 'insert',
      position,
      text,
      timestamp: Date.now(),
      userId: this.userId,
    };

    const inverseOp: EditOp = {
      type: 'delete',
      position,
      length: text.length,
      timestamp: Date.now(),
      userId: this.userId,
    };

    this.applyOp(op);
    this.undoStack.push({ op, inverseOp });
    this.redoStack = [];
    this.shiftCommentsAfterInsert(position, text.length);

    return op;
  }

  deleteText(position: number, length: number): EditOp {
    const deletedText = this.content.slice(position, position + length);
    const op: EditOp = {
      type: 'delete',
      position,
      length,
      timestamp: Date.now(),
      userId: this.userId,
    };

    const inverseOp: EditOp = {
      type: 'insert',
      position,
      text: deletedText,
      timestamp: Date.now(),
      userId: this.userId,
    };

    this.applyOp(op);
    this.undoStack.push({ op, inverseOp });
    this.redoStack = [];
    this.shiftCommentsAfterDelete(position, length);

    return op;
  }

  private applyOp(op: EditOp): void {
    if (op.type === 'insert' && op.text) {
      this.content = this.content.slice(0, op.position) + op.text + this.content.slice(op.position);
      this.cursorPosition = op.position + op.text.length;
      this.selectionStart = this.cursorPosition;
      this.selectionEnd = this.cursorPosition;
    } else if (op.type === 'delete' && op.length) {
      this.content = this.content.slice(0, op.position) + this.content.slice(op.position + op.length);
      this.cursorPosition = op.position;
      this.selectionStart = this.cursorPosition;
      this.selectionEnd = this.cursorPosition;
    }
    this.notify();
  }

  applyRemoteOp(op: EditOp): boolean {
    if (op.userId === this.userId) return false;

    const hasConflict = this.detectConflict(op);
    if (hasConflict) {
      return false;
    }

    if (op.type === 'insert') {
      this.shiftCommentsAfterInsert(op.position, op.text?.length || 0);
    } else if (op.type === 'delete') {
      this.shiftCommentsAfterDelete(op.position, op.length || 0);
    }

    this.applyOp(op);
    return true;
  }

  private detectConflict(op: EditOp): boolean {
    if (op.type === 'insert') {
      return this.selectionStart === this.selectionEnd && 
             Math.abs(this.cursorPosition - op.position) < 5;
    }
    return false;
  }

  createConflictInfo(op: EditOp, remoteUser: UserInfo): ConflictInfo {
    const localContent = this.content;
    let remoteContent = localContent;
    if (op.type === 'insert' && op.text) {
      remoteContent = localContent.slice(0, op.position) + op.text + localContent.slice(op.position);
    } else if (op.type === 'delete' && op.length) {
      remoteContent = localContent.slice(0, op.position) + localContent.slice(op.position + op.length);
    }

    const localOp: EditOp = {
      type: 'insert',
      position: this.cursorPosition,
      text: '',
      timestamp: Date.now(),
      userId: this.userId,
    };

    return {
      id: uuidv4(),
      localOp,
      remoteOp: op,
      localContent,
      remoteContent,
      userId: remoteUser.id,
      userName: remoteUser.name,
    };
  }

  undo(): boolean {
    const entry = this.undoStack.pop();
    if (!entry) return false;

    this.applyOp(entry.inverseOp);
    this.redoStack.push(entry);
    return true;
  }

  redo(): boolean {
    const entry = this.redoStack.pop();
    if (!entry) return false;

    this.applyOp(entry.op);
    this.undoStack.push(entry);
    return true;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  addComment(start: number, end: number, text: string, author: string, authorColor: string): Comment {
    const comment: Comment = {
      id: uuidv4(),
      start,
      end,
      text,
      author,
      authorColor,
      resolved: false,
      replies: [],
      createdAt: Date.now(),
    };
    this.comments.push(comment);
    this.notify();
    return comment;
  }

  resolveComment(commentId: string, resolved: boolean): boolean {
    const comment = this.comments.find((c) => c.id === commentId);
    if (!comment) return false;
    comment.resolved = resolved;
    this.notify();
    return true;
  }

  replyToComment(commentId: string, text: string, author: string): Reply | null {
    const comment = this.comments.find((c) => c.id === commentId);
    if (!comment) return null;

    const reply: Reply = {
      id: uuidv4(),
      text,
      author,
      createdAt: Date.now(),
    };
    comment.replies.push(reply);
    this.notify();
    return reply;
  }

  private shiftCommentsAfterInsert(position: number, length: number): void {
    this.comments.forEach((comment) => {
      if (comment.start >= position) {
        comment.start += length;
        comment.end += length;
      } else if (comment.end >= position) {
        comment.end += length;
      }
    });
  }

  private shiftCommentsAfterDelete(position: number, length: number): void {
    this.comments.forEach((comment) => {
      if (comment.start >= position + length) {
        comment.start -= length;
        comment.end -= length;
      } else if (comment.end <= position + length && comment.end >= position) {
        comment.end = position;
      } else if (comment.start < position && comment.end > position + length) {
        comment.end -= length;
      }
    });
    this.comments = this.comments.filter((c) => c.start < c.end);
  }

  createVersion(): Version {
    const version: Version = {
      id: uuidv4(),
      content: this.content,
      comments: JSON.parse(JSON.stringify(this.comments)),
      wordCount: this.getWordCount(),
      createdAt: Date.now(),
    };
    this.versions.unshift(version);
    this.lastSavedAt = Date.now();

    this.versionUndoStacks.set(version.id, {
      undo: [],
      redo: [],
    });

    this.notify();
    return version;
  }

  restoreVersion(versionId: string): boolean {
    const version = this.versions.find((v) => v.id === versionId);
    if (!version) return false;

    const currentVersionId = uuidv4();
    this.versionUndoStacks.set(currentVersionId, {
      undo: [...this.undoStack],
      redo: [...this.redoStack],
    });

    this.content = version.content;
    this.comments = JSON.parse(JSON.stringify(version.comments));

    const versionStacks = this.versionUndoStacks.get(versionId);
    if (versionStacks) {
      this.undoStack = versionStacks.undo;
      this.redoStack = versionStacks.redo;
    } else {
      this.undoStack = [];
      this.redoStack = [];
    }

    this.cursorPosition = 0;
    this.selectionStart = 0;
    this.selectionEnd = 0;
    this.lastSavedAt = Date.now();
    this.notify();
    return true;
  }

  getVersionContent(versionId: string): { content: string; comments: Comment[] } | null {
    const version = this.versions.find((v) => v.id === versionId);
    if (!version) return null;
    return {
      content: version.content,
      comments: JSON.parse(JSON.stringify(version.comments)),
    };
  }

  setContent(content: string): void {
    this.content = content;
    this.cursorPosition = 0;
    this.selectionStart = 0;
    this.selectionEnd = 0;
    this.notify();
  }

  setComments(comments: Comment[]): void {
    this.comments = comments;
    this.notify();
  }
}
