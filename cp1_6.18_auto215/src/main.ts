import { Capture } from './capture';
import { StrokeManager } from './stroke';
import { Recognizer } from './recognizer';
import { Renderer } from './renderer';
import { Editor } from './editor';
import type { Point, Stroke, CharacterSegment, Candidate } from './types';

interface AppSegment extends CharacterSegment {
  textPosition?: number;
  committed?: boolean;
}

class App {
  private canvas: HTMLCanvasElement;
  private canvasWrapper: HTMLElement;
  private textarea: HTMLTextAreaElement;
  private statsEl: HTMLElement;
  private btnClear: HTMLButtonElement;
  private btnUndo: HTMLButtonElement;
  private btnRedo: HTMLButtonElement;

  private capture!: Capture;
  private strokeMgr!: StrokeManager;
  private recognizer!: Recognizer;
  private renderer!: Renderer;
  private editor!: Editor;

  private segments: AppSegment[] = [];
  private pendingSegmentId: string | null = null;
  private pendingCandidates: Candidate[] = [];
  private selectedCandidate = -1;
  private insertingPosition = -1;
  private erasing = false;

  constructor() {
    this.canvas = document.getElementById('writing-canvas') as HTMLCanvasElement;
    this.canvasWrapper = document.getElementById('canvas-wrapper') as HTMLElement;
    this.textarea = document.getElementById('text-editor') as HTMLTextAreaElement;
    this.statsEl = document.getElementById('editor-stats') as HTMLElement;
    this.btnClear = document.getElementById('btn-clear') as HTMLButtonElement;
    this.btnUndo = document.getElementById('btn-undo') as HTMLButtonElement;
    this.btnRedo = document.getElementById('btn-redo') as HTMLButtonElement;

    this.init();
  }

  private init(): void {
    this.editor = new Editor(this.textarea, this.statsEl, {
      onSelectionChange: (pos) => {
        this.insertingPosition = pos;
      },
      onTextChange: () => {},
      onStateChange: () => {
        this.updateToolbarState();
      },
    });

    this.strokeMgr = new StrokeManager({
      onStrokeAdded: (_stroke) => {},
      onStrokeUpdated: (_stroke) => {},
      onSegmentReady: (seg) => this.handleSegmentReady(seg),
      onClear: () => {
        this.segments = [];
        this.pendingSegmentId = null;
        this.pendingCandidates = [];
        this.selectedCandidate = -1;
      },
    });

    this.recognizer = new Recognizer({
      onRecognitionResult: (segId, candidates, bestChar) =>
        this.handleRecognitionResult(segId, candidates, bestChar),
    });

    this.capture = new Capture(this.canvas, {
      onStrokeStart: (p) => {
        this.strokeMgr.startStroke(p);
        this.renderer.addPendingPoint(p);
      },
      onPoint: (p) => {
        this.strokeMgr.addPoint(p);
        this.renderer.addPendingPoint(p);
      },
      onStrokeEnd: (p) => {
        this.strokeMgr.endStroke(p);
        this.editor.focusEditor();
      },
      onSwipeLeft: () => {
        this.handleClearWithAnimation();
      },
    });

    this.renderer = new Renderer(this.canvas, {
      getCurrentStroke: () => this.strokeMgr.getCurrentStroke(),
      getCurrentSegmentStrokes: () => this.strokeMgr.getCurrentSegmentStrokes(),
      getSegments: () => this.segments as CharacterSegment[],
      getPendingCandidates: () => this.pendingCandidates,
      getSelectedCandidate: () => this.selectedCandidate,
      isErasing: () => this.erasing,
    }, this.canvasWrapper);

    this.bindUI();
    this.updateToolbarState();
    this.renderer.start();

    const onResize = () => this.renderer.resize();
    window.addEventListener('resize', onResize);
  }

  private bindUI(): void {
    this.btnClear.addEventListener('click', () => this.handleClearWithAnimation());
    this.btnUndo.addEventListener('click', () => this.handleUndo());
    this.btnRedo.addEventListener('click', () => this.handleRedo());

    const allCandidateBtns = document.querySelectorAll('.candidate-btn');
    allCandidateBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).dataset.idx || '-1', 10);
        if (idx >= 0 && idx < this.pendingCandidates.length) {
          this.confirmCandidate(idx);
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            e.preventDefault();
            this.handleRedo();
          } else {
            e.preventDefault();
            this.handleUndo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          this.handleRedo();
        }
      }
    });

    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        const pos = this.editor.getCursorPosition();
        if (pos > 0) {
          this.handleBackspaceAt(pos);
        }
      }
    });
  }

  private handleSegmentReady(segment: CharacterSegment): void {
    const appSeg: AppSegment = {
      ...segment,
      committed: false,
    };
    this.segments.push(appSeg);
    this.pendingSegmentId = appSeg.id;
    this.pendingCandidates = [];
    this.selectedCandidate = -1;

    setTimeout(() => {
      this.recognizer.recognize(appSeg);
    }, 20);
  }

  private handleRecognitionResult(
    segId: string,
    candidates: Candidate[],
    bestChar: string,
  ): void {
    const seg = this.segments.find(s => s.id === segId);
    if (!seg) return;

    seg.candidates = candidates;
    seg.confidence = candidates.length > 0
      ? candidates[0].confidence
      : (bestChar ? 0.35 : 0);

    this.pendingCandidates = candidates;
    this.selectedCandidate = candidates.length > 0 ? 0 : -1;

    if (seg.committed && seg.textPosition !== undefined) {
      if (bestChar) {
        const oldChar = seg.char || '';
        const c = candidates[0]?.char || bestChar;
        seg.char = c;
        seg.selectedCandidate = 0;
        if (oldChar && oldChar !== c) {
          this.editor.replaceCharacterAt(seg.textPosition, oldChar, c);
        }
      }
      return;
    }

    if (bestChar && !seg.committed) {
      const c = candidates[0]?.char || bestChar;
      seg.char = c;
      seg.selectedCandidate = candidates.length > 0 ? 0 : undefined;
      seg.committed = true;

      const insertPos = this.insertingPosition >= 0
        ? this.insertingPosition
        : this.editor.getCursorPosition();

      seg.textPosition = insertPos;
      this.editor.insertCharacterAtCursor(c);
      this.editor.saveSegmentsSnapshot(this.segments);
    }
  }

  private confirmCandidate(idx: number): void {
    if (idx < 0 || idx >= this.pendingCandidates.length) return;
    if (!this.pendingSegmentId) return;

    const cand = this.pendingCandidates[idx];
    const seg = this.segments.find(s => s.id === this.pendingSegmentId);
    if (!seg) return;

    this.selectedCandidate = idx;

    if (!seg.committed) {
      seg.char = cand.char;
      seg.selectedCandidate = idx;
      seg.committed = true;
      const insertPos = this.insertingPosition >= 0
        ? this.insertingPosition
        : this.editor.getCursorPosition();
      seg.textPosition = insertPos;
      this.editor.insertCharacterAtCursor(cand.char);
      this.editor.saveSegmentsSnapshot(this.segments);
    } else if (seg.textPosition !== undefined) {
      const oldChar = seg.char || '';
      if (oldChar !== cand.char) {
        this.editor.replaceCharacterAt(seg.textPosition, oldChar, cand.char);
        seg.char = cand.char;
        seg.selectedCandidate = idx;
      }
    }
  }

  private handleBackspaceAt(pos: number): void {
    const removePos = pos - 1;
    const segIdx = this.segments.findIndex(s => s.textPosition === removePos);
    if (segIdx >= 0) {
      const removed = this.segments.splice(segIdx, 1)[0];
      if (removed.id === this.pendingSegmentId) {
        this.pendingSegmentId = null;
        this.pendingCandidates = [];
        this.selectedCandidate = -1;
      }
      for (let i = segIdx; i < this.segments.length; i++) {
        if (this.segments[i].textPosition !== undefined) {
          this.segments[i].textPosition!--;
        }
      }
    }
    this.insertingPosition = removePos;
  }

  private handleClearWithAnimation(): void {
    if (this.erasing) return;
    this.erasing = true;
    this.renderer.triggerEraseAnimation(() => {
      this.strokeMgr.flushPending();
      this.editor.clear();
      this.strokeMgr.clearAll();
      this.erasing = false;
    });
  }

  private handleUndo(): void {
    this.strokeMgr.flushPending();
    if (this.editor.undo()) {
      this.syncSegmentsFromEditor();
    }
    this.updateToolbarState();
  }

  private handleRedo(): void {
    this.strokeMgr.flushPending();
    if (this.editor.redo()) {
      this.syncSegmentsFromEditor();
    }
    this.updateToolbarState();
  }

  private syncSegmentsFromEditor(): void {
    const currentText = this.editor.getText();
    const cursorPos = this.editor.getCursorPosition();
    const retained: AppSegment[] = [];
    for (const seg of this.segments) {
      if (seg.textPosition === undefined || !seg.char) continue;
      if (seg.textPosition < currentText.length &&
          currentText[seg.textPosition] === seg.char) {
        retained.push(seg);
      }
    }
    let pos = 0;
    const textChars = currentText.split('');
    const finalSegs: AppSegment[] = [];
    for (let i = 0; i < textChars.length; i++) {
      const existing = retained.find(s => s.textPosition === i && s.char === textChars[i]);
      if (existing) {
        const segCopy: AppSegment = { ...existing, textPosition: pos };
        finalSegs.push(segCopy);
        pos++;
      }
    }
    this.segments = finalSegs;
    this.insertingPosition = cursorPos;
    this.updateToolbarState();
  }

  private updateToolbarState(): void {
    this.btnUndo.disabled = !this.editor.canUndo();
    this.btnRedo.disabled = !this.editor.canRedo();
  }
}

new App();
