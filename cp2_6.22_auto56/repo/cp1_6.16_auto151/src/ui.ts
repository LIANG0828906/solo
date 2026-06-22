import { LevelData, LevelStats, ElementType, MAX_DRAFTS } from './types';

export class UI {
  private draftListEl: HTMLElement;
  private draftNameInput: HTMLInputElement;
  private saveDraftBtn: HTMLElement;
  private clearBtn: HTMLElement;
  private playBtn: HTMLElement;
  private elementButtons: NodeListOf<HTMLElement>;
  private modalOverlay: HTMLElement;
  private finalTimeEl: HTMLElement;
  private modalCloseBtn: HTMLElement;
  private resetBtn: HTMLElement;
  private drafts: LevelData[] = [];
  private currentDraftId: string | null = null;
  private onSaveDraftCallback?: (name: string) => void;
  private onLoadDraftCallback?: (data: LevelData) => void;
  private onDeleteDraftCallback?: (id: string) => void;
  private onClearCallback?: () => void;
  private onPlayToggleCallback?: (playing: boolean) => void;
  private onElementSelectCallback?: (type: ElementType) => void;

  constructor() {
    this.draftListEl = document.getElementById('draft-list')!;
    this.draftNameInput = document.getElementById('draft-name-input') as HTMLInputElement;
    this.saveDraftBtn = document.getElementById('save-draft-btn')!;
    this.clearBtn = document.getElementById('clear-btn')!;
    this.playBtn = document.getElementById('play-btn')!;
    this.elementButtons = document.querySelectorAll('.element-btn');
    this.modalOverlay = document.getElementById('modal-overlay')!;
    this.finalTimeEl = document.getElementById('final-time')!;
    this.modalCloseBtn = document.getElementById('modal-close-btn')!;
    this.resetBtn = document.getElementById('reset-btn')!;

    this.loadDraftsFromStorage();
    this.bindEvents();
    this.renderDraftList();
  }

  private bindEvents(): void {
    this.saveDraftBtn.addEventListener('click', () => {
      const name = this.draftNameInput.value.trim() || '未命名关卡';
      if (this.onSaveDraftCallback) {
        this.onSaveDraftCallback(name);
      }
    });

    this.clearBtn.addEventListener('click', () => {
      if (confirm('确定要清空当前关卡吗？')) {
        this.onClearCallback?.();
      }
    });

    this.resetBtn.addEventListener('click', () => {
      if (confirm('确定要清空当前关卡吗？')) {
        this.onClearCallback?.();
      }
    });

    this.playBtn.addEventListener('click', () => {
      const isPlaying = this.playBtn.classList.toggle('playing');
      this.playBtn.textContent = isPlaying ? '▶' : '■';
      this.onPlayToggleCallback?.(!isPlaying);
    });

    this.elementButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.elementButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.element as ElementType;
        this.onElementSelectCallback?.(type);
      });
    });

    this.modalCloseBtn.addEventListener('click', () => {
      this.hideCompletionModal();
      this.setPlayingState(false);
      this.onPlayToggleCallback?.(false);
    });
  }

  private loadDraftsFromStorage(): void {
    try {
      const stored = localStorage.getItem('platform-level-drafts');
      if (stored) {
        this.drafts = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load drafts:', e);
      this.drafts = [];
    }
  }

  private saveDraftsToStorage(): void {
    try {
      localStorage.setItem('platform-level-drafts', JSON.stringify(this.drafts));
    } catch (e) {
      console.error('Failed to save drafts:', e);
    }
  }

  private renderDraftList(): void {
    this.draftListEl.innerHTML = '';

    if (this.drafts.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.style.cssText = 'color: #666; font-size: 12px; text-align: center; padding: 16px 0;';
      emptyEl.textContent = '暂无草稿';
      this.draftListEl.appendChild(emptyEl);
      return;
    }

    this.drafts.forEach((draft) => {
      const item = document.createElement('div');
      item.className = 'draft-item' + (draft.id === this.currentDraftId ? ' active' : '');
      item.innerHTML = `
        <span class="draft-name" title="${draft.name}">${draft.name}</span>
        <button class="draft-delete" title="删除">×</button>
      `;

      item.querySelector('.draft-name')!.addEventListener('click', () => {
        this.loadDraft(draft.id);
      });

      item.querySelector('.draft-delete')!.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteDraft(draft.id);
      });

      this.draftListEl.appendChild(item);
    });
  }

  addDraft(draft: LevelData): void {
    const existingIndex = this.drafts.findIndex((d) => d.id === draft.id);
    
    if (existingIndex >= 0) {
      this.drafts[existingIndex] = { ...draft, updatedAt: Date.now() };
    } else {
      if (this.drafts.length >= MAX_DRAFTS) {
        alert('最多只能保存5个草稿，请先删除一些。');
        return;
      }
      this.drafts.push(draft);
    }
    
    this.currentDraftId = draft.id;
    this.saveDraftsToStorage();
    this.renderDraftList();
  }

  private loadDraft(id: string): void {
    const draft = this.drafts.find((d) => d.id === id);
    if (draft) {
      this.currentDraftId = id;
      this.renderDraftList();
      this.onLoadDraftCallback?.(draft);
    }
  }

  private deleteDraft(id: string): void {
    if (confirm('确定要删除这个草稿吗？')) {
      this.drafts = this.drafts.filter((d) => d.id !== id);
      if (this.currentDraftId === id) {
        this.currentDraftId = null;
      }
      this.saveDraftsToStorage();
      this.renderDraftList();
      this.onDeleteDraftCallback?.(id);
    }
  }

  getDrafts(): LevelData[] {
    return [...this.drafts];
  }

  getCurrentDraftId(): string | null {
    return this.currentDraftId;
  }

  setCurrentDraftId(id: string | null): void {
    this.currentDraftId = id;
    this.renderDraftList();
  }

  updateStats(stats: LevelStats): void {
    const sizeEl = document.getElementById('stat-size');
    const bricksEl = document.getElementById('stat-bricks');
    const spikesEl = document.getElementById('stat-spikes');
    const platformsEl = document.getElementById('stat-platforms');
    const goalsEl = document.getElementById('stat-goals');
    const timeEl = document.getElementById('stat-time');

    if (sizeEl) sizeEl.textContent = `${stats.width} × ${stats.height}`;
    if (bricksEl) bricksEl.textContent = String(stats.brickCount);
    if (spikesEl) spikesEl.textContent = String(stats.spikeCount);
    if (platformsEl) platformsEl.textContent = String(stats.platformCount);
    if (goalsEl) goalsEl.textContent = String(stats.goalCount);
    if (timeEl) timeEl.textContent = `${stats.estimatedTime.toFixed(1)}s`;

    const topSize = document.getElementById('top-size');
    const topBricks = document.getElementById('top-bricks');
    const topSpikes = document.getElementById('top-spikes');
    const topPlatforms = document.getElementById('top-platforms');
    const topTime = document.getElementById('top-time');

    if (topSize) topSize.textContent = `${stats.width}×${stats.height}`;
    if (topBricks) topBricks.textContent = String(stats.brickCount);
    if (topSpikes) topSpikes.textContent = String(stats.spikeCount);
    if (topPlatforms) topPlatforms.textContent = String(stats.platformCount);
    if (topTime) topTime.textContent = `${stats.estimatedTime.toFixed(1)}s`;
  }

  showCompletionModal(time: number): void {
    this.finalTimeEl.textContent = `${time.toFixed(2)}s`;
    this.modalOverlay.classList.add('visible');
  }

  hideCompletionModal(): void {
    this.modalOverlay.classList.remove('visible');
  }

  setPlayingState(playing: boolean): void {
    if (playing) {
      this.playBtn.classList.add('playing');
      this.playBtn.textContent = '■';
    } else {
      this.playBtn.classList.remove('playing');
      this.playBtn.textContent = '▶';
    }
  }

  setDraftName(name: string): void {
    this.draftNameInput.value = name;
  }

  onSaveDraft(callback: (name: string) => void): void {
    this.onSaveDraftCallback = callback;
  }

  onLoadDraft(callback: (data: LevelData) => void): void {
    this.onLoadDraftCallback = callback;
  }

  onDeleteDraft(callback: (id: string) => void): void {
    this.onDeleteDraftCallback = callback;
  }

  onClear(callback: () => void): void {
    this.onClearCallback = callback;
  }

  onPlayToggle(callback: (playing: boolean) => void): void {
    this.onPlayToggleCallback = callback;
  }

  onElementSelect(callback: (type: ElementType) => void): void {
    this.onElementSelectCallback = callback;
  }
}
