import { InstrumentEngine, type InstrumentType, type NoteEvent } from './instrument';
import { SessionManager, type User } from './session';
import { UIRenderer } from './renderer';

class VirtualEnsembleApp {
  private instrumentEngine: InstrumentEngine;
  private sessionManager: SessionManager;
  private renderer: UIRenderer;
  private currentInstrument: InstrumentType = 'piano';

  constructor() {
    this.instrumentEngine = new InstrumentEngine();
    this.sessionManager = new SessionManager();
    this.renderer = new UIRenderer();
  }

  init(): void {
    this.setupAudio();
    this.setupRenderer();
    this.setupSession();
    this.setupEventListeners();
    console.log('虚拟乐器合奏应用已初始化');
  }

  private setupAudio(): void {
    this.renderer.setAnalyser(this.instrumentEngine.getAnalyser());

    this.instrumentEngine.setOnNoteCallback((event: NoteEvent) => {
      this.sessionManager.sendNote(event);
      this.renderer.setPressedKeys(this.instrumentEngine.getPressedKeys());
    });
  }

  private setupRenderer(): void {
    this.renderer.setInstrument(this.currentInstrument);
    this.renderer.setGuitarFret(0);
    this.renderer.startAnimationLoop();
    this.renderer.updateToolbarSlider();

    this.renderer.setOnNoteTrigger((event: NoteEvent, isPress: boolean) => {
      this.ensureAudioContext();
      if (isPress) {
        this.instrumentEngine.triggerNote(event);
      } else {
        this.instrumentEngine.releaseNote(event);
      }
    });
  }

  private setupSession(): void {
    this.sessionManager.connect();

    this.sessionManager.setOnUsersChange((users: User[]) => {
      this.renderer.renderUserList(users, this.sessionManager.getUserId());
    });

    this.sessionManager.setOnRemoteNote((event) => {
      this.ensureAudioContext();
      const localizedEvent: NoteEvent = {
        instrument: event.instrument,
        note: event.note,
        velocity: event.velocity,
        timestamp: event.timestamp,
        releaseDelay: event.releaseDelay
      };
      this.instrumentEngine.triggerNote(localizedEvent);

      setTimeout(() => {
        this.instrumentEngine.releaseNote(localizedEvent);
      }, event.instrument === 'guitar' ? 800 : (event.instrument === 'drums' ? 200 : 400));

      this.showRemoteRipple(event);
    });

    this.sessionManager.setOnRoomJoined((roomId: string) => {
      this.renderer.updateRoomInfo(roomId);
    });

    this.sessionManager.setOnConnectionStatus((connected: boolean) => {
      console.log('连接状态:', connected ? '已连接' : '已断开');
    });
  }

  private setupEventListeners(): void {
    document.querySelectorAll('.tool-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const instrument = target.dataset.instrument as InstrumentType;
        if (instrument && instrument !== this.currentInstrument) {
          this.switchInstrument(instrument);
        }
      });
    });

    const bpmSlider = document.getElementById('bpmSlider') as HTMLInputElement;
    const bpmValue = document.getElementById('bpmValue') as HTMLElement;
    bpmSlider.addEventListener('input', () => {
      const bpm = parseInt(bpmSlider.value);
      bpmValue.textContent = bpm.toString();
      this.instrumentEngine.setBPM(bpm);
      this.sessionManager.sendBPM(bpm);
    });

    const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
    const volumeValue = document.getElementById('volumeValue') as HTMLElement;
    volumeSlider.addEventListener('input', () => {
      const vol = parseInt(volumeSlider.value);
      volumeValue.textContent = vol + '%';
      this.instrumentEngine.setVolume(vol / 100);
    });

    const createBtn = document.getElementById('createRoomBtn') as HTMLButtonElement;
    const joinBtn = document.getElementById('joinRoomBtn') as HTMLButtonElement;
    const roomIdInput = document.getElementById('roomIdInput') as HTMLInputElement;

    createBtn.addEventListener('click', () => {
      const roomId = roomIdInput.value.trim() || undefined;
      const createdId = this.sessionManager.createRoom(roomId);
      roomIdInput.value = createdId;
    });

    joinBtn.addEventListener('click', () => {
      const roomId = roomIdInput.value.trim();
      if (roomId) {
        this.sessionManager.joinRoom(roomId);
      }
    });

    roomIdInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        joinBtn.click();
      }
    });

    const pressedKeyboardKeys = new Set<string>();

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.target instanceof HTMLInputElement) return;

      const key = e.key;

      if (key === 'ArrowUp' || key === 'ArrowDown') {
        if (this.currentInstrument === 'guitar') {
          e.preventDefault();
          this.instrumentEngine.mapKeyboardToNote(key, 'guitar');
          this.renderer.setGuitarFret(this.instrumentEngine.getGuitarFret());
        }
        return;
      }

      if (pressedKeyboardKeys.has(key)) return;
      pressedKeyboardKeys.add(key);

      this.ensureAudioContext();

      const noteEvent = this.instrumentEngine.mapKeyboardToNote(key, this.currentInstrument);
      if (noteEvent) {
        this.instrumentEngine.triggerNote(noteEvent);
        this.showKeyboardRipple(noteEvent);
        this.renderer.setPressedKeys(this.instrumentEngine.getPressedKeys());
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.target instanceof HTMLInputElement) return;

      const key = e.key;
      pressedKeyboardKeys.delete(key);

      const noteEvent = this.instrumentEngine.mapKeyboardToNote(key, this.currentInstrument);
      if (noteEvent) {
        this.instrumentEngine.releaseNote(noteEvent);
        this.renderer.setPressedKeys(this.instrumentEngine.getPressedKeys());
      }
    });

    window.addEventListener('resize', () => {
      setTimeout(() => this.renderer.updateToolbarSlider(), 100);
    });

    this.renderer.updateToolbarSlider();
  }

  private switchInstrument(instrument: InstrumentType): void {
    this.currentInstrument = instrument;
    this.instrumentEngine.getPressedKeys().clear();

    document.querySelectorAll('.tool-btn').forEach((btn) => {
      const el = btn as HTMLElement;
      if (el.dataset.instrument === instrument) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    this.renderer.setInstrument(instrument);
    this.renderer.setGuitarFret(this.instrumentEngine.getGuitarFret());
    this.sessionManager.setInstrument(instrument);
    this.renderer.updateToolbarSlider();
  }

  private ensureAudioContext(): void {
    if (this.instrumentEngine.getAudioContext().state === 'suspended') {
      this.instrumentEngine.resume();
    }
  }

  private showKeyboardRipple(event: NoteEvent): void {
    const canvas = document.getElementById('instrumentCanvas') as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();

    let x = rect.width / 2;
    let y = rect.height / 2;

    if (event.instrument === 'piano') {
      const whiteKeys = InstrumentEngine.getPianoWhiteKeys();
      const blackKeys = InstrumentEngine.getPianoBlackKeys();
      const note = event.note as string;
      const padding = 20;
      const keyH = rect.height - padding * 2;
      const whiteW = Math.min(45, (rect.width - padding * 2) / whiteKeys.length);
      const totalWhiteW = whiteW * whiteKeys.length;
      const startX = (rect.width - totalWhiteW) / 2;

      const whiteIdx = whiteKeys.indexOf(note);
      const blackIdx = blackKeys.indexOf(note);

      if (whiteIdx >= 0) {
        x = startX + whiteIdx * whiteW + whiteW / 2;
        y = rect.height - keyH / 3;
      } else if (blackIdx >= 0) {
        const blackPositions = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12];
        const wi = blackPositions[blackIdx];
        const blackW = whiteW * 0.6;
        x = startX + (wi + 1) * whiteW - blackW / 2;
        y = padding + keyH * 0.3;
      }
    } else if (event.instrument === 'guitar') {
      const [stringIdxStr] = (event.note as string).split('-');
      const stringIdx = parseInt(stringIdxStr);
      const padding = 50;
      const height = rect.height - padding * 2;
      const stringGap = height / 5;
      const width = rect.width - padding * 2;
      const fretGap = width / 12;
      x = padding + this.instrumentEngine.getGuitarFret() * fretGap + fretGap / 2;
      y = padding + stringIdx * stringGap;
    } else if (event.instrument === 'drums') {
      const idx = event.note as number;
      const cols = 2;
      const rows = 2;
      const padding = 40;
      const gap = 20;
      const availW = rect.width - padding * 2 - gap * (cols - 1);
      const availH = rect.height - padding * 2 - gap * (rows - 1);
      const padW = Math.min(availW / cols, 200);
      const padH = Math.min(availH / rows, 200);
      const totalW = padW * cols + gap * (cols - 1);
      const totalH = padH * rows + gap * (rows - 1);
      const startX = (rect.width - totalW) / 2;
      const startY = (rect.height - totalH) / 2;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      x = startX + col * (padW + gap) + padW / 2;
      y = startY + row * (padH + gap) + padH / 2;
    }

    this.renderer.triggerRipple(x, y, this.sessionManager.getUserColor());
  }

  private showRemoteRipple(event: { instrument: InstrumentType; note: string | number; color: string }): void {
    const canvas = document.getElementById('instrumentCanvas') as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();

    let x = rect.width / 2;
    let y = rect.height / 2;

    if (event.instrument === 'piano') {
      const whiteKeys = InstrumentEngine.getPianoWhiteKeys();
      const blackKeys = InstrumentEngine.getPianoBlackKeys();
      const note = event.note as string;
      const padding = 20;
      const keyH = rect.height - padding * 2;
      const whiteW = Math.min(45, (rect.width - padding * 2) / whiteKeys.length);
      const totalWhiteW = whiteW * whiteKeys.length;
      const startX = (rect.width - totalWhiteW) / 2;

      const whiteIdx = whiteKeys.indexOf(note);
      const blackIdx = blackKeys.indexOf(note);

      if (whiteIdx >= 0) {
        x = startX + whiteIdx * whiteW + whiteW / 2;
        y = rect.height - keyH / 3;
      } else if (blackIdx >= 0) {
        const blackPositions = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12];
        const wi = blackPositions[blackIdx];
        const blackW = whiteW * 0.6;
        x = startX + (wi + 1) * whiteW - blackW / 2;
        y = padding + keyH * 0.3;
      }
    } else if (event.instrument === 'guitar') {
      const [stringIdxStr, fretStr] = (event.note as string).split('-');
      const stringIdx = parseInt(stringIdxStr);
      const fret = parseInt(fretStr);
      const padding = 50;
      const height = rect.height - padding * 2;
      const stringGap = height / 5;
      const width = rect.width - padding * 2;
      const fretGap = width / 12;
      x = padding + fret * fretGap + fretGap / 2;
      y = padding + stringIdx * stringGap;
    } else if (event.instrument === 'drums') {
      const idx = event.note as number;
      const cols = 2;
      const rows = 2;
      const padding = 40;
      const gap = 20;
      const availW = rect.width - padding * 2 - gap * (cols - 1);
      const availH = rect.height - padding * 2 - gap * (rows - 1);
      const padW = Math.min(availW / cols, 200);
      const padH = Math.min(availH / rows, 200);
      const totalW = padW * cols + gap * (cols - 1);
      const totalH = padH * rows + gap * (rows - 1);
      const startX = (rect.width - totalW) / 2;
      const startY = (rect.height - totalH) / 2;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      x = startX + col * (padW + gap) + padW / 2;
      y = startY + row * (padH + gap) + padH / 2;
    }

    this.renderer.triggerRipple(x, y, event.color);
  }

  destroy(): void {
    this.renderer.stopAnimationLoop();
    this.sessionManager.leaveRoom();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new VirtualEnsembleApp();
  app.init();

  (window as unknown as { __virtualEnsembleApp: VirtualEnsembleApp }).__virtualEnsembleApp = app;
});
