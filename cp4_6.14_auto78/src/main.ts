import { AudioModule, type WaveformData } from './audio';
import { NotesManager, type Note } from './notes';
import { GridSystem } from './grid';
import { Renderer } from './renderer';

interface Track {
  index: number;
  enabled: boolean;
  name: string;
}

interface LevelData {
  songMetadata: {
    name: string;
    duration: number;
    sampleRate: number;
  };
  bpm: number;
  tracks: {
    index: number;
    notes: {
      trackIndex: number;
      timestamp: number;
      xOffset: number;
    }[];
  }[];
}

const MAX_TRACKS = 4;
const DEFAULT_BPM = 120;

class App {
  private audio: AudioModule;
  private notes: NotesManager;
  private grid: GridSystem;
  private renderer: Renderer;

  private tracks: Track[] = [];
  private currentTrack: number = 0;
  private waveform: WaveformData | null = null;

  private dom: {
    bpmInput: HTMLInputElement;
    songInfo: HTMLElement;
    songLabel: HTMLElement;
    fileInput: HTMLInputElement;
    editorMain: HTMLElement;
    canvas: HTMLCanvasElement;
    dropOverlay: HTMLElement;
    emptyState: HTMLElement;
    noteCount: HTMLElement;
    durationText: HTMLElement;
    currentTrackText: HTMLElement;
    exportBtn: HTMLButtonElement;
    clearBtn: HTMLButtonElement;
    addTrackBtn: HTMLButtonElement;
    tracksContainer: HTMLElement;
  };

  constructor() {
    console.log('[App] Initializing rhythm level editor...');
    try {
      this.audio = new AudioModule();
      this.notes = new NotesManager();
      this.grid = new GridSystem();
      this.grid.setBPM(DEFAULT_BPM);

      this.dom = this.cacheDOM();
      this.tracks = this.createInitialTracks();
      this.renderTracks();

      this.renderer = new Renderer(this.dom.canvas, {
        onNoteAdd: (ts, xOff) => this.handleNoteAdd(ts, xOff),
        onNoteMove: (id, ti, ts) => this.handleNoteMove(id, ti, ts),
        onNoteRemove: (id) => this.handleNoteRemove(id),
        onCurrentTrackChange: (idx) => this.handleCurrentTrackChange(idx),
      });
      this.renderer.setTracks(this.tracks);

      this.bindEvents();
      this.updateUI();
      this.renderer.startRenderLoop();
      console.log('[App] Initialization complete');
    } catch (err) {
      console.error('[App] Initialization failed:', err);
      throw err;
    }
  }

  private cacheDOM() {
    const $ = (id: string) => {
      const el = document.getElementById(id);
      if (!el) {
        console.warn(`[App] DOM element not found: #${id}`);
      }
      return el as HTMLElement;
    };
    return {
      bpmInput: $('bpmInput') as HTMLInputElement,
      songInfo: $('songInfo') as HTMLElement,
      songLabel: $('songInfo').querySelector('.song-label') as HTMLElement,
      fileInput: $('fileInput') as HTMLInputElement,
      editorMain: $('editorMain') as HTMLElement,
      canvas: $('waveformCanvas') as HTMLCanvasElement,
      dropOverlay: $('dropOverlay') as HTMLElement,
      emptyState: $('emptyState') as HTMLElement,
      noteCount: $('noteCount') as HTMLElement,
      durationText: $('durationText') as HTMLElement,
      currentTrackText: $('currentTrack') as HTMLElement,
      exportBtn: $('exportBtn') as HTMLButtonElement,
      clearBtn: $('clearBtn') as HTMLButtonElement,
      addTrackBtn: $('addTrackBtn') as HTMLButtonElement,
      tracksContainer: $('tracksContainer') as HTMLElement,
    };
  }

  private createInitialTracks(): Track[] {
    return [
      { index: 0, enabled: true, name: 'Track 1' },
      { index: 1, enabled: true, name: 'Track 2' },
    ];
  }

  private bindEvents(): void {
    this.dom.fileInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) this.loadAudioFile(file);
    });

    this.dom.editorMain.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dom.dropOverlay.classList.add('active');
    });
    this.dom.editorMain.addEventListener('dragleave', (e) => {
      if (!this.dom.editorMain.contains(e.relatedTarget as Node)) {
        this.dom.dropOverlay.classList.remove('active');
      }
    });
    this.dom.editorMain.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dom.dropOverlay.classList.remove('active');
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith('audio/')) {
        this.loadAudioFile(file);
      }
    });

    this.dom.bpmInput.addEventListener('input', () => {
      const val = parseInt(this.dom.bpmInput.value, 10);
      if (!isNaN(val)) {
        this.grid.setBPM(val);
        this.refreshGrid();
      }
    });

    this.dom.exportBtn.addEventListener('click', () => this.exportLevel());
    this.dom.clearBtn.addEventListener('click', () => {
      if (this.notes.getNoteCount() === 0) return;
      if (confirm('确定要清除所有音符吗？此操作不可撤销。')) {
        this.notes.clearAll();
        this.renderer.setNotes(this.notes.getAllNotes());
        this.updateUI();
        this.renderTracks();
      }
    });

    this.dom.addTrackBtn.addEventListener('click', () => this.addTrack());
  }

  private async loadAudioFile(file: File): Promise<void> {
    try {
      console.log(`[App] Loading audio file: ${file.name} (${file.size} bytes)`);
      await this.audio.loadFromFile(file);
      this.waveform = this.audio.getWaveform(4096);
      this.renderer.setWaveform(this.waveform);
      this.refreshGrid();

      this.dom.songInfo.classList.add('loaded');
      this.dom.songLabel.textContent = this.stripExtension(file.name);
      this.dom.songLabel.title = file.name;

      this.dom.emptyState.classList.add('hidden');
      this.updateUI();
      console.log(`[App] Audio loaded successfully, duration: ${this.audio.getDuration().toFixed(2)}s`);
    } catch (err) {
      console.error('[App] Failed to load audio:', err);
      alert('音频文件加载失败，请尝试其他格式（推荐 MP3 / WAV / OGG）');
    }
  }

  private refreshGrid(): void {
    const duration = this.audio.getDuration();
    if (duration <= 0) return;
    const canvas = this.dom.canvas;
    const rect = canvas.getBoundingClientRect();
    const pps = rect.width / duration;
    const positions = this.grid.getGridPositions(duration, 10, pps);
    console.log(`[App] Grid refreshed: ${positions.length} lines, BPM=${this.grid.getBPM()}`);
    this.renderer.setGridPositions(positions);
  }

  private handleNoteAdd(rawTimestamp: number, xOffset: number): void {
    const snapped = this.grid.getSnapPosition(rawTimestamp);
    console.log(`[App] Adding note: raw=${rawTimestamp.toFixed(3)}s, snapped=${snapped.toFixed(3)}s, track=${this.currentTrack}`);
    const note = this.notes.addNote(this.currentTrack, snapped, xOffset);
    if (note) {
      this.renderer.setNotes(this.notes.getAllNotes());
      this.renderer.triggerRipple(note.id);
      this.updateUI();
      this.renderTracks();
    } else {
      console.warn(`[App] Cannot add note: max limit (${NotesManager.MAX_NOTES}) reached`);
      alert(`最多只能添加 ${NotesManager.MAX_NOTES} 个音符`);
    }
  }

  private handleNoteMove(id: string, trackIndex: number, rawTimestamp: number): void {
    const snapped = this.grid.getSnapPosition(rawTimestamp);
    const track = this.tracks.find((t) => t.index === trackIndex);
    if (!track || !track.enabled) return;
    console.log(`[App] Moving note ${id}: track=${trackIndex}, time=${snapped.toFixed(3)}s`);
    this.notes.moveNote(id, trackIndex, snapped);
    this.renderer.setNotes(this.notes.getAllNotes());
    this.renderTracks();
  }

  private handleNoteRemove(id: string): void {
    console.log(`[App] Removing note: ${id}`);
    this.notes.removeNote(id);
    this.renderer.setNotes(this.notes.getAllNotes());
    this.updateUI();
    this.renderTracks();
  }

  private handleCurrentTrackChange(idx: number): void {
    this.currentTrack = idx;
    this.renderer.setCurrentTrack(idx);
    this.updateUI();
    this.renderTracks();
  }

  private addTrack(): void {
    if (this.tracks.length >= MAX_TRACKS) {
      console.warn('[App] Cannot add track: max limit reached');
      return;
    }
    const nextIdx = this.tracks.length === 0 ? 0 : Math.max(...this.tracks.map((t) => t.index)) + 1;
    console.log(`[App] Adding track: index=${nextIdx}`);
    this.tracks.push({
      index: nextIdx,
      enabled: true,
      name: `Track ${nextIdx + 1}`,
    });
    this.currentTrack = nextIdx;
    this.renderer.setTracks(this.tracks);
    this.renderer.setCurrentTrack(nextIdx);
    this.renderTracks();
    this.updateUI();
  }

  private removeTrack(idx: number): void {
    if (this.tracks.length <= 1) return;
    if (!confirm(`确定要删除 Track ${idx + 1} 吗？该轨道上的所有音符也将被删除。`)) return;

    console.log(`[App] Removing track: index=${idx}`);
    const notesToRemove = this.notes.getNotesByTrack(idx).map((n) => n.id);
    notesToRemove.forEach((id) => this.notes.removeNote(id));

    this.tracks = this.tracks.filter((t) => t.index !== idx);
    if (this.currentTrack === idx || !this.tracks.find((t) => t.index === this.currentTrack)) {
      this.currentTrack = this.tracks[0]?.index ?? 0;
    }
    this.renderer.setTracks(this.tracks);
    this.renderer.setNotes(this.notes.getAllNotes());
    this.renderTracks();
    this.updateUI();
  }

  private toggleTrack(idx: number): void {
    const track = this.tracks.find((t) => t.index === idx);
    if (!track) return;
    track.enabled = !track.enabled;
    console.log(`[App] Toggling track ${idx}: enabled=${track.enabled}`);
    if (!track.enabled && this.tracks.filter((t) => t.enabled).length === 0) {
      track.enabled = true;
      console.warn('[App] Prevented disabling last track');
      return;
    }
    if (this.currentTrack === idx && !track.enabled) {
      const firstEnabled = this.tracks.find((t) => t.enabled);
      if (firstEnabled) {
        this.currentTrack = firstEnabled.index;
        this.renderer.setCurrentTrack(firstEnabled.index);
      }
    }
    this.renderer.setTracks(this.tracks);
    this.renderTracks();
    this.updateUI();
  }

  private renderTracks(): void {
    const container = this.dom.tracksContainer;
    if (!container) {
      console.error('[App] Tracks container not found');
      return;
    }
    container.innerHTML = '';

    for (const track of this.tracks) {
      const el = document.createElement('div');
      el.className = `track-item ${track.enabled ? 'enabled' : ''} ${track.index === this.currentTrack ? 'active' : ''}`;
      el.dataset.trackIndex = String(track.index);

      const noteCount = this.notes.getNotesByTrack(track.index).length;

      el.innerHTML = `
        <div class="track-status" data-action="toggle" title="${track.enabled ? '点击禁用' : '点击启用'}">
          <div class="track-dot" style="background: ${track.enabled ? '#ef4444' : '#64748b'}; ${track.enabled ? 'box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25), 0 0 12px rgba(239, 68, 68, 0.4);' : ''}"></div>
        </div>
        <div class="track-content">
          <div class="track-title">
            <span class="track-index-badge">${track.index + 1}</span>
            <span class="track-name">${track.name}</span>
          </div>
          <div class="track-meta">
            <span><span class="note-count">${noteCount}</span> notes</span>
            <span>${track.enabled ? 'ACTIVE' : 'DISABLED'}</span>
          </div>
        </div>
        <div class="track-actions">
          <button class="track-remove-btn" data-action="remove" title="删除轨道">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
            </svg>
          </button>
        </div>
      `;

      el.querySelector('[data-action="toggle"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleTrack(track.index);
      });

      el.querySelector('[data-action="remove"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeTrack(track.index);
      });

      el.addEventListener('click', () => {
        if (track.enabled) {
          this.handleCurrentTrackChange(track.index);
        }
      });

      container.appendChild(el);
    }

    this.dom.addTrackBtn.disabled = this.tracks.length >= MAX_TRACKS;
  }

  private exportLevel(): void {
    if (!this.audio.isLoaded()) {
      alert('请先导入一首音乐');
      return;
    }
    if (this.notes.getNoteCount() === 0) {
      alert('还没有添加任何音符');
      return;
    }

    const duration = this.audio.getDuration();
    const levelData: LevelData = {
      songMetadata: {
        name: this.stripExtension(this.audio.getFileName()),
        duration: duration,
        sampleRate: this.audio.getSampleRate(),
      },
      bpm: this.grid.getBPM(),
      tracks: this.notes.toJSON(duration),
    };

    const jsonStr = JSON.stringify(levelData, null, 2);
    console.log(`[App] Exporting level: ${this.notes.getNoteCount()} notes, ${levelData.tracks.length} tracks`);
    console.log('[App] Level data:', levelData);

    try {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = this.stripExtension(this.audio.getFileName()).replace(/[^a-zA-Z0-9_\- ]/g, '_');
      a.download = `${safeName || 'level'}_level.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      console.log('[App] Export complete');
    } catch (err) {
      console.error('[App] Export failed:', err);
      alert('导出失败，请查看控制台获取详细信息');
    }
  }

  private updateUI(): void {
    this.dom.noteCount.textContent = String(this.notes.getNoteCount());
    this.dom.durationText.textContent = this.audio.isLoaded()
      ? this.formatTime(this.audio.getDuration())
      : '--:--';
    this.dom.currentTrackText.textContent = `Track ${this.currentTrack + 1}`;
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private stripExtension(name: string): string {
    return name.replace(/\.[^/.]+$/, '');
  }
}

console.log('[Boot] Starting application...');
document.addEventListener('DOMContentLoaded', () => {
  try {
    new App();
    console.log('[Boot] Application started successfully');
  } catch (err) {
    console.error('[Boot] Failed to start application:', err);
  }
});

if (document.readyState === 'interactive' || document.readyState === 'complete') {
  setTimeout(() => {
    try {
      new App();
    } catch (err) {
      console.error('[Boot] Failed to start application:', err);
    }
  }, 0);
}
