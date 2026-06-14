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
  }

  private cacheDOM() {
    const $ = (id: string) => document.getElementById(id)!;
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
      await this.audio.loadFromFile(file);
      this.waveform = this.audio.getWaveform(4096);
      this.renderer.setWaveform(this.waveform);
      this.refreshGrid();

      this.dom.songInfo.classList.add('loaded');
      this.dom.songLabel.textContent = this.stripExtension(file.name);
      this.dom.songLabel.title = file.name;

      this.dom.emptyState.classList.add('hidden');
      this.updateUI();
    } catch (err) {
      console.error('Failed to load audio:', err);
      alert('音频文件加载失败，请尝试其他格式（推荐 MP3 / WAV / OGG）');
    }
  }

  private refreshGrid(): void {
    const duration = this.audio.getDuration();
    if (duration <= 0) return;
    const canvas = this.dom.canvas;
    const rect = canvas.getBoundingClientRect();
    const pps = rect.width / duration;
    this.renderer.setGridPositions(this.grid.getGridPositions(duration, 10, pps));
  }

  private handleNoteAdd(rawTimestamp: number, xOffset: number): void {
    const snapped = this.grid.getSnapPosition(rawTimestamp);
    const note = this.notes.addNote(this.currentTrack, snapped, xOffset);
    if (note) {
      this.renderer.setNotes(this.notes.getAllNotes());
      this.renderer.triggerRipple(note.id);
      this.updateUI();
      this.renderTracks();
    }
  }

  private handleNoteMove(id: string, trackIndex: number, rawTimestamp: number): void {
    const snapped = this.grid.getSnapPosition(rawTimestamp);
    const track = this.tracks.find((t) => t.index === trackIndex);
    if (!track || !track.enabled) return;
    this.notes.moveNote(id, trackIndex, snapped);
    this.renderer.setNotes(this.notes.getAllNotes());
    this.renderTracks();
  }

  private handleNoteRemove(id: string): void {
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
    if (this.tracks.length >= MAX_TRACKS) return;
    const nextIdx = this.tracks.length === 0 ? 0 : Math.max(...this.tracks.map((t) => t.index)) + 1;
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
    if (!track.enabled && this.tracks.filter((t) => t.enabled).length === 0) {
      track.enabled = true;
      return;
    }
    if (this.currentTrack === idx && !track.enabled) {
      const firstEnabled = this.tracks.find((t) => t.enabled);
      if (firstEnabled) {
        this.currentTrack =