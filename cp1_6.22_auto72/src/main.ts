import TerrainEditor, { EditMode } from './TerrainEditor';
import TerrainRenderer from './TerrainRenderer';

const GRID_SIZE = 20;
const EDIT_RADIUS = 2;
const EDIT_STRENGTH = 0.5;
const MAX_HISTORY_SIZE = 100;
const PLAYBACK_INTERVAL = 500;

class App {
  private editor: TerrainEditor;
  private renderer: TerrainRenderer;
  private currentMode: EditMode = 'raise';
  private isPlaying = false;
  private playbackTimer: number | null = null;
  private lastEditGrid: { x: number; z: number } | null = null;

  private toolButtons: NodeListOf<HTMLButtonElement>;
  private playBtn: HTMLButtonElement;
  private playIcon: HTMLElement;
  private timelineTrack: HTMLElement;
  private timelineProgress: HTMLElement;
  private timelineMarkers: HTMLElement;
  private timelineThumb: HTMLElement;
  private timelineInfo: HTMLElement;

  private isDraggingThumb = false;

  constructor() {
    const container = document.getElementById('canvas-container');
    if (!container) {
      throw new Error('Canvas container not found');
    }

    this.editor = new TerrainEditor({
      size: GRID_SIZE,
      editRadius: EDIT_RADIUS,
      editStrength: EDIT_STRENGTH,
      maxHistorySize: MAX_HISTORY_SIZE,
    });

    this.renderer = new TerrainRenderer({
      size: GRID_SIZE,
      container,
    });

    this.toolButtons = document.querySelectorAll('.tool-btn');
    this.playBtn = document.getElementById('play-btn') as HTMLButtonElement;
    this.playIcon = document.getElementById('play-icon') as HTMLElement;
    this.timelineTrack = document.getElementById('timeline-track') as HTMLElement;
    this.timelineProgress = document.getElementById('timeline-progress') as HTMLElement;
    this.timelineMarkers = document.getElementById('timeline-markers') as HTMLElement;
    this.timelineThumb = document.getElementById('timeline-thumb') as HTMLElement;
    this.timelineInfo = document.getElementById('timeline-info') as HTMLElement;

    this.setupEventListeners();
    this.updateTimelineUI();
  }

  private setupEventListeners(): void {
    this.toolButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode as EditMode;
        if (mode) {
          this.setMode(mode);
        }
      });
    });

    this.renderer.onTerrainClick((gridX, gridZ) => {
      this.handleTerrainEdit(gridX, gridZ);
    });

    this.renderer.onTerrainDrag((gridX, gridZ) => {
      if (this.lastEditGrid && this.lastEditGrid.x === gridX && this.lastEditGrid.z === gridZ) {
        return;
      }
      this.lastEditGrid = { x: gridX, z: gridZ };
      this.handleTerrainEdit(gridX, gridZ);
    });

    this.playBtn.addEventListener('click', () => {
      this.togglePlayback();
    });

    this.timelineTrack.addEventListener('mousedown', (e) => {
      if (e.target === this.timelineThumb) {
        this.isDraggingThumb = true;
      } else {
        this.handleTimelineClick(e);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDraggingThumb) {
        this.handleThumbDrag(e);
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDraggingThumb = false;
    });

    this.editor.onHistoryChange(() => {
      this.updateTimelineUI();
    });

    window.addEventListener('beforeunload', () => {
      this.dispose();
    });
  }

  private setMode(mode: EditMode): void {
    if (this.currentMode === mode) return;

    this.currentMode = mode;

    this.toolButtons.forEach((btn) => {
      if (btn.dataset.mode === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  private async handleTerrainEdit(gridX: number, gridZ: number): Promise<void> {
    if (this.isPlaying) {
      this.stopPlayback();
    }

    try {
      const result = await this.editor.edit(this.currentMode, gridX, gridZ);
      this.renderer.updateHeights(result.heights, true);
    } catch (error) {
      console.error('编辑失败:', error);
    }
  }

  private togglePlayback(): void {
    if (this.isPlaying) {
      this.stopPlayback();
    } else {
      this.startPlayback();
    }
  }

  private startPlayback(): void {
    if (this.editor.getHistoryLength() === 0) return;

    this.isPlaying = true;
    this.updatePlayButton();

    let currentIndex = this.editor.getCurrentHistoryIndex();

    const playNext = () => {
      if (!this.isPlaying) return;

      if (currentIndex < this.editor.getHistoryLength() - 1) {
        currentIndex++;
        const heights = this.editor.jumpToHistory(currentIndex);
        this.renderer.updateHeights(heights, true);

        const operation = this.editor.getOperation(currentIndex);
        if (operation) {
          this.renderer.animateOperation(operation);
        }

        this.playbackTimer = window.setTimeout(playNext, PLAYBACK_INTERVAL);
      } else {
        this.stopPlayback();
      }
    };

    if (currentIndex >= this.editor.getHistoryLength() - 1) {
      currentIndex = -1;
      const heights = this.editor.jumpToHistory(currentIndex);
      this.renderer.updateHeights(heights, false);
      this.playbackTimer = window.setTimeout(playNext, PLAYBACK_INTERVAL);
    } else {
      playNext();
    }
  }

  private stopPlayback(): void {
    this.isPlaying = false;
    if (this.playbackTimer !== null) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    this.updatePlayButton();
  }

  private updatePlayButton(): void {
    if (this.isPlaying) {
      this.playIcon.innerHTML = '<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>';
      this.playBtn.title = '暂停';
    } else {
      this.playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
      this.playBtn.title = '播放';
    }
  }

  private handleTimelineClick(e: MouseEvent): void {
    const rect = this.timelineTrack.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;

    const totalOps = this.editor.getHistoryLength();
    if (totalOps === 0) return;

    let targetIndex = Math.round(percentage * totalOps) - 1;
    targetIndex = Math.max(-1, Math.min(totalOps - 1, targetIndex));

    this.jumpToHistory(targetIndex);
  }

  private handleThumbDrag(e: MouseEvent): void {
    const rect = this.timelineTrack.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));

    this.timelineThumb.style.left = `${percentage * 100}%`;
    this.timelineProgress.style.width = `${percentage * 100}%`;

    const totalOps = this.editor.getHistoryLength();
    if (totalOps > 0) {
      let targetIndex = Math.round(percentage * totalOps) - 1;
      targetIndex = Math.max(-1, Math.min(totalOps - 1, targetIndex));
      this.timelineInfo.textContent = `${targetIndex + 1} / ${totalOps}`;
    }
  }

  private jumpToHistory(index: number): void {
    if (this.isPlaying) {
      this.stopPlayback();
    }

    const heights = this.editor.jumpToHistory(index);
    this.renderer.updateHeights(heights, false);

    const operation = this.editor.getOperation(index);
    if (operation) {
      this.renderer.animateOperation(operation);
    }
  }

  private updateTimelineUI(): void {
    const currentIndex = this.editor.getCurrentHistoryIndex();
    const totalOps = this.editor.getHistoryLength();

    this.timelineInfo.textContent = `${Math.max(0, currentIndex + 1)} / ${totalOps}`;

    const percentage = totalOps > 0 ? (currentIndex + 1) / totalOps : 0;
    this.timelineThumb.style.left = `${percentage * 100}%`;
    this.timelineProgress.style.width = `${percentage * 100}%`;

    this.timelineMarkers.innerHTML = '';
    for (let i = 0; i < totalOps; i++) {
      const marker = document.createElement('div');
      marker.className = 'timeline-marker';
      if (i === currentIndex) {
        marker.classList.add('active');
      }
      const markerPercentage = (i + 1) / totalOps;
      marker.style.left = `${markerPercentage * 100}%`;
      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        this.jumpToHistory(i);
      });
      this.timelineMarkers.appendChild(marker);
    }
  }

  private dispose(): void {
    this.stopPlayback();
    this.editor.dispose();
    this.renderer.dispose();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
