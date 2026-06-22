import type { Effect } from './effects';
import { effects } from './effects';

export interface PanelEvents {
  onEffectSelect: (effect: Effect) => void;
  onCodeChange: (code: string) => void;
  onCopy: () => void;
}

export interface SyntaxError {
  line: number;
  column: number;
  length: number;
  message: string;
}

export class PanelManager {
  private effectsList: HTMLElement;
  private codeEditor: HTMLTextAreaElement;
  private copyBtn: HTMLElement;
  private copyToast: HTMLElement;
  private errorIndicator: HTMLElement;
  private events: PanelEvents;
  private activeCardId: string | null = null;
  private debounceTimer: number | null = null;

  constructor(events: PanelEvents) {
    this.events = events;

    const effectsListEl = document.getElementById('effects-list');
    const codeEditorEl = document.getElementById('code-editor');
    const copyBtnEl = document.getElementById('copy-btn');
    const copyToastEl = document.getElementById('copy-toast');
    const errorIndicatorEl = document.getElementById('error-indicator');

    if (!effectsListEl) throw new Error('effects-list element not found');
    if (!codeEditorEl) throw new Error('code-editor element not found');
    if (!(codeEditorEl instanceof HTMLTextAreaElement)) throw new Error('code-editor is not a textarea');
    if (!copyBtnEl) throw new Error('copy-btn element not found');
    if (!copyToastEl) throw new Error('copy-toast element not found');
    if (!errorIndicatorEl) throw new Error('error-indicator element not found');

    this.effectsList = effectsListEl;
    this.codeEditor = codeEditorEl;
    this.copyBtn = copyBtnEl;
    this.copyToast = copyToastEl;
    this.errorIndicator = errorIndicatorEl;

    this.renderEffectCards();
    this.bindEvents();
  }

  private renderEffectCards(): void {
    const fragment = document.createDocumentFragment();

    effects.forEach((effect) => {
      const card = document.createElement('div');
      card.className = 'effect-card';
      card.dataset.effectId = effect.id;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');

      const title = document.createElement('div');
      title.className = 'effect-card-title';
      title.textContent = effect.title;

      const desc = document.createElement('div');
      desc.className = 'effect-card-desc';
      desc.textContent = effect.description;

      card.appendChild(title);
      card.appendChild(desc);
      fragment.appendChild(card);
    });

    this.effectsList.appendChild(fragment);
  }

  private bindEvents(): void {
    this.effectsList.addEventListener('click', (e) => {
      const card = (e.target as HTMLElement).closest('.effect-card') as HTMLElement | null;
      if (card) {
        this.handleCardClick(card);
      }
    });

    this.effectsList.addEventListener('keydown', (e) => {
      const card = (e.target as HTMLElement).closest('.effect-card') as HTMLElement | null;
      if (card && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        this.handleCardClick(card);
      }
    });

    this.codeEditor.addEventListener('input', () => {
      this.scheduleValidation();
    });

    this.codeEditor.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.events.onCodeChange(this.codeEditor.value);
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.codeEditor.selectionStart;
        const end = this.codeEditor.selectionEnd;
        this.codeEditor.value =
          this.codeEditor.value.substring(0, start) +
          '  ' +
          this.codeEditor.value.substring(end);
        this.codeEditor.selectionStart = this.codeEditor.selectionEnd = start + 2;
        this.scheduleValidation();
      }
    });

    this.copyBtn.addEventListener('click', () => {
      this.copyToClipboard(this.codeEditor.value);
    });
  }

  private handleCardClick(card: HTMLElement): void {
    const effectId = card.dataset.effectId;
    if (!effectId || effectId === this.activeCardId) return;

    const effect = effects.find((e) => e.id === effectId);
    if (effect) {
      this.setActiveEffect(effectId);
      this.setCode(effect.codeTemplate);
      this.events.onEffectSelect(effect);
    }
  }

  private scheduleValidation(): void {
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      this.validateCSS();
    }, 300);
  }

  validateCSS(): SyntaxError[] {
    const errors: SyntaxError[] = [];
    const code = this.codeEditor.value;
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const propertyMatch = line.match(/^\s*[a-zA-Z-]+\s*:/);
      if (propertyMatch && !line.includes(';') && !line.includes('{') && !line.includes('}')) {
        const trimmed = line.trimEnd();
        errors.push({
          line: i,
          column: trimmed.length,
          length: 1,
          message: '缺少分号'
        });
      }
    }

    let braceCount = 0;
    for (let i = 0; i < lines.length; i++) {
      for (let j = 0; j < lines[i].length; j++) {
        if (lines[i][j] === '{') braceCount++;
        if (lines[i][j] === '}') braceCount--;
        if (braceCount < 0) {
          errors.push({
            line: i,
            column: j,
            length: 1,
            message: '多余的右花括号'
          });
          braceCount = 0;
        }
      }
    }

    if (braceCount > 0) {
      const lastLine = lines.length - 1;
      errors.push({
        line: lastLine,
        column: lines[lastLine].length,
        length: 1,
        message: '缺少右花括号'
      });
    }

    this.renderErrors(errors, lines);
    return errors;
  }

  private renderErrors(errors: SyntaxError[], lines: string[]): void {
    if (errors.length === 0) {
      this.errorIndicator.innerHTML = '';
      this.codeEditor.classList.remove('has-error');
      return;
    }

    this.codeEditor.classList.add('has-error');

    const sortedErrors = [...errors].sort((a, b) => {
      if (a.line !== b.line) return a.line - b.line;
      return a.column - b.column;
    });

    let html = '';
    let errorIdx = 0;

    for (let i = 0; i < lines.length; i++) {
      let lineHtml = '';
      let col = 0;

      while (errorIdx < sortedErrors.length && sortedErrors[errorIdx].line === i) {
        const err = sortedErrors[errorIdx];
        lineHtml += this.escapeHtml(lines[i].substring(col, err.column));
        lineHtml += `<span class="error-underline" title="${this.escapeHtml(err.message)}">`;
        lineHtml += this.escapeHtml(lines[i].substring(err.column, err.column + err.length)) || '&nbsp;';
        lineHtml += '</span>';
        col = err.column + err.length;
        errorIdx++;
      }

      lineHtml += this.escapeHtml(lines[i].substring(col));
      html += lineHtml + '\n';
    }

    this.errorIndicator.innerHTML = html;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setActiveEffect(effectId: string): void {
    const cards = this.effectsList.querySelectorAll('.effect-card');
    cards.forEach((card) => {
      const el = card as HTMLElement;
      if (el.dataset.effectId === effectId) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
    this.activeCardId = effectId;
  }

  setCode(code: string): void {
    this.codeEditor.value = code;
    this.validateCSS();
  }

  getCode(): string {
    return this.codeEditor.value;
  }

  private async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    this.showCopyToast();
    this.events.onCopy();
  }

  private showCopyToast(): void {
    this.copyToast.classList.add('visible');
    window.setTimeout(() => {
      this.copyToast.classList.remove('visible');
    }, 1000);
  }
}
