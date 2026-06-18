import type { HistoryState, Candidate, CharacterSegment } from './types';

export interface EditorEvents {
  onSelectionChange: (position: number) => void;
  onTextChange: (text: string) => void;
  onStateChange: (state: HistoryState) => void;
}

export class Editor {
  private textarea: HTMLTextAreaElement;
  private statsEl: HTMLElement;
  private events: EditorEvents;
  private undoStack: HistoryState[] = [];
  private redoStack: HistoryState[] = [];
  private readonly MAX_HISTORY = 25;
  private cursorEl: HTMLDivElement | null = null;
  private cursorVisible = true;
  private cursorTimer: number | null = null;
  private suppressHistory = false;
  private lastText = '';

  constructor(
    textarea: HTMLTextAreaElement,
    statsEl: HTMLElement,
    events: EditorEvents,
  ) {
    this.textarea = textarea;
    this.statsEl = statsEl;
    this.events = events;
    this.lastText = textarea.value;
    this.bindEvents();
    this.createCursorOverlay();
    this.startCursorBlink();
    this.updateStats();
  }

  private createCursorOverlay(): void {
    this.cursorEl = document.createElement('div');
    this.cursorEl.style.cssText = `
      position: absolute;
      width: 2px;
      height: 22px;
      background: #D6E4F0;
      border-left: 1px solid #4A90D9;
      pointer-events: none;
      z-index: 10;
      transition: opacity 0.1s ease;
      opacity: 1;
    `;
    this.textarea.parentElement!.style.position = 'relative';
    this.textarea.parentElement!.appendChild(this.cursorEl);
    this.positionCursor();
  }

  private startCursorBlink(): void {
    this.cursorTimer = window.setInterval(() => {
      this.cursorVisible = !this.cursorVisible;
      if (this.cursorEl) {
        this.cursorEl.style.opacity = this.cursorVisible ? '1' : '0';
      }
    }, 600);
  }

  private positionCursor(): void {
    if (!this.cursorEl) return;
    const pos = this.textarea.selectionStart ?? this.textarea.value.length;
    const ta = this.textarea;
    const cs = getComputedStyle(ta);
    const mirror = document.createElement('div');
    mirror.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
      font-family: ${cs.fontFamily};
      font-size: ${cs.fontSize};
      line-height: ${cs.lineHeight};
      padding: ${cs.padding};
      width: ${ta.clientWidth}px;
      box-sizing: border-box;
      border: ${cs.border};
    `;
    const before = ta.value.slice(0, pos);
    const textNode = document.createTextNode(before);
    mirror.appendChild(textNode);
    const marker = document.createElement('span');
    marker.textContent = '|';
    mirror.appendChild(marker);
    document.body.appendChild(mirror);
    const markerRect = marker.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();
    const taRect = ta.getBoundingClientRect();
    document.body.removeChild(mirror);

    const scrollTop = ta.scrollTop;
    const scrollLeft = ta.scrollLeft;
    const left = markerRect.left - mirrorRect.left - scrollLeft;
    const top = markerRect.top - mirrorRect.top - scrollTop + 2;

    this.cursorEl.style.left = `${left + 16}px`;
    this.cursorEl.style.top = `${top + 16}px`;
    this.cursorEl.style.height = `24px`;
    this.cursorEl.style.opacity = '1';
    this.cursorVisible = true;
  }

  private bindEvents(): void {
    this.textarea.addEventListener('input', this.handleInput);
    this.textarea.addEventListener('select', this.handleSelect);
    this.textarea.addEventListener('click', this.handleSelect);
    this.textarea.addEventListener('keyup', this.handleSelect);
    this.textarea.addEventListener('focus', () => {
      if (this.cursorEl) this.cursorEl.style.display = 'block';
      this.positionCursor();
    });
    this.textarea.addEventListener('blur', () => {
      if (this.cursorEl) this.cursorEl.style.display = 'none';
    });
    this.textarea.addEventListener('scroll', () => this.positionCursor());
    window.addEventListener('resize', () => this.positionCursor());
  }

  private handleInput = (): void => {
    const newText = this.textarea.value;
    if (!this.suppressHistory && newText !== this.lastText) {
      this.pushHistory();
    }
    this.lastText = newText;
    this.updateStats();
    this.positionCursor();
    this.events.onTextChange(newText);
    this.events.onSelectionChange(this.getCursorPosition());
    this.events.onStateChange(this.snapshot());
  };

  private handleSelect = (): void => {
    this.events.onSelectionChange(this.getCursorPosition());
    this.positionCursor();
  };

  private snapshot(): HistoryState {
    return {
      text: this.textarea.value,
      cursor: this.textarea.selectionStart ?? this.textarea.value.length,
      segments: [],
    };
  }

  private pushHistory(): void {
    const state = this.snapshot();
    this.undoStack.push(state);
    if (this.undoStack.length > this.MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  public insertCharacterAtCursor(char: string): void {
    if (!char) return;
    this.pushHistory();
    const start = this.textarea.selectionStart ?? this.textarea.value.length;
    const end = this.textarea.selectionEnd ?? start;
    const value = this.textarea.value;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const newVal = before + char + after;
    const newPos = start + char.length;
    this.suppressHistory = true;
    this.textarea.value = newVal;
    this.textarea.setSelectionRange(newPos, newPos);
    this.suppressHistory = false;
    this.lastText = newVal;
    this.updateStats();
    this.positionCursor();
    this.events.onTextChange(newVal);
    this.events.onSelectionChange(newPos);
    this.events.onStateChange(this.snapshot());
  }

  public replaceCharacterAt(position: number, oldChar: string, newChar: string): void {
    const value = this.textarea.value;
    const atPos = value.slice(position, position + oldChar.length);
    if (atPos !== oldChar) return;
    this.pushHistory();
    const before = value.slice(0, position);
    const after = value.slice(position + oldChar.length);
    const newVal = before + newChar + after;
    const newPos = position + newChar.length;
    this.suppressHistory = true;
    this.textarea.value = newVal;
    this.textarea.setSelectionRange(newPos, newPos);
    this.suppressHistory = false;
    this.lastText = newVal;
    this.updateStats();
    this.positionCursor();
    this.events.onTextChange(newVal);
    this.events.onSelectionChange(newPos);
    this.events.onStateChange(this.snapshot());
  }

  public deleteAt(position: number, count = 1): void {
    const value = this.textarea.value;
    if (position < 0 || position > value.length - count) return;
    this.pushHistory();
    const before = value.slice(0, position);
    const after = value.slice(position + count);
    const newVal = before + after;
    this.suppressHistory = true;
    this.textarea.value = newVal;
    this.textarea.setSelectionRange(position, position);
    this.suppressHistory = false;
    this.lastText = newVal;
    this.updateStats();
    this.positionCursor();
    this.events.onTextChange(newVal);
    this.events.onSelectionChange(position);
    this.events.onStateChange(this.snapshot());
  }

  public undo(): boolean {
    if (this.undoStack.length === 0) return false;
    const prev = this.undoStack.pop()!;
    const current = this.snapshot();
    this.redoStack.push(current);
    if (this.redoStack.length > this.MAX_HISTORY) this.redoStack.shift();
    this.restoreState(prev);
    return true;
  }

  public redo(): boolean {
    if (this.redoStack.length === 0) return false;
    const next = this.redoStack.pop()!;
    const current = this.snapshot();
    this.undoStack.push(current);
    if (this.undoStack.length > this.MAX_HISTORY) this.undoStack.shift();
    this.restoreState(next);
    return true;
  }

  private restoreState(state: HistoryState): void {
    this.suppressHistory = true;
    this.textarea.value = state.text;
    const pos = Math.min(state.cursor, state.text.length);
    this.textarea.setSelectionRange(pos, pos);
    this.suppressHistory = false;
    this.lastText = state.text;
    this.updateStats();
    this.positionCursor();
    this.events.onTextChange(state.text);
    this.events.onSelectionChange(pos);
    this.events.onStateChange(state);
  }

  public clear(): void {
    if (this.textarea.value.length === 0) return;
    this.pushHistory();
    this.suppressHistory = true;
    this.textarea.value = '';
    this.textarea.setSelectionRange(0, 0);
    this.suppressHistory = false;
    this.lastText = '';
    this.updateStats();
    this.positionCursor();
    this.events.onTextChange('');
    this.events.onSelectionChange(0);
    this.events.onStateChange(this.snapshot());
  }

  public getCursorPosition(): number {
    return this.textarea.selectionStart ?? this.textarea.value.length;
  }

  public setCursorPosition(pos: number): void {
    const p = Math.max(0, Math.min(this.textarea.value.length, pos));
    this.textarea.setSelectionRange(p, p);
    this.events.onSelectionChange(p);
    this.positionCursor();
  }

  public getText(): string {
    return this.textarea.value;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  private updateStats(): void {
    const text = this.textarea.value;
    const charCount = text.length;
    this.statsEl.textContent = `${charCount} 字符`;
  }

  public getHistorySize(): { undo: number; redo: number } {
    return { undo: this.undoStack.length, redo: this.redoStack.length };
  }

  public saveSegmentsSnapshot(segments: CharacterSegment[]): void {
    if (this.undoStack.length > 0) {
      const top = this.undoStack[this.undoStack.length - 1];
      top.segments = JSON.parse(JSON.stringify(segments));
    }
  }

  public focusEditor(): void {
    this.textarea.focus();
  }

  public destroy(): void {
    this.textarea.removeEventListener('input', this.handleInput);
    this.textarea.removeEventListener('select', this.handleSelect);
    this.textarea.removeEventListener('click', this.handleSelect);
    this.textarea.removeEventListener('keyup', this.handleSelect);
    if (this.cursorTimer !== null) clearInterval(this.cursorTimer);
    if (this.cursorEl) this.cursorEl.remove();
  }
}
