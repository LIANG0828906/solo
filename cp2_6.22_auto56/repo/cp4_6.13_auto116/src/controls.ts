type PlayPauseCallback = () => void;
type VolumeCallback = (volume: number) => void;
type ProgressCallback = (time: number) => void;
type ThemeCallback = (theme: string) => void;
type FileCallback = (file: File) => void;

class UIManager {
  private container: HTMLElement | null = null;
  private playBtn: HTMLButtonElement | null = null;
  private progressBar: HTMLDivElement | null = null;
  private progressFill: HTMLDivElement | null = null;
  private progressTooltip: HTMLDivElement | null = null;
  private volumeSlider: HTMLInputElement | null = null;
  private volumeIcon: HTMLElement | null = null;
  private themeSelect: HTMLSelectElement | null = null;
  private timeLabel: HTMLElement | null = null;
  private durationLabel: HTMLElement | null = null;
  private uploadOverlay: HTMLElement | null = null;
  private fileInput: HTMLInputElement | null = null;
  private songTitle: HTMLElement | null = null;
  private uploadBtn: HTMLButtonElement | null = null;

  private isPlaying = false;
  private isDraggingProgress = false;
  private currentTime = 0;
  private duration = 0;

  private playPauseCallbacks: PlayPauseCallback[] = [];
  private volumeCallbacks: VolumeCallback[] = [];
  private progressCallbacks: ProgressCallback[] = [];
  private themeCallbacks: ThemeCallback[] = [];
  private fileCallbacks: FileCallback[] = [];

  init(container: HTMLElement, themeNames: string[]): void {
    this.container = container;
    this.createUploadOverlay();
    this.createControlBar();
    this.setupDragDrop();
    this.populateThemes(themeNames);
  }

  private createUploadOverlay(): void {
    this.uploadOverlay = document.createElement('div');
    this.uploadOverlay.className = 'upload-overlay';
    this.uploadOverlay.innerHTML = `
      <div class="upload-content">
        <div class="upload-icon">🎵</div>
        <h2 class="upload-title">拖拽 MP3 文件到这里</h2>
        <p class="upload-subtitle">或点击下方按钮选择文件</p>
        <button class="upload-btn">选择音乐文件</button>
        <p class="upload-hint">支持 MP3 格式 · Web Audio API 实时分析</p>
      </div>
    `;
    this.container!.appendChild(this.uploadOverlay);

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'audio/mp3,audio/mpeg,.mp3';
    this.fileInput.style.display = 'none';
    this.container!.appendChild(this.fileInput);

    this.uploadBtn = this.uploadOverlay.querySelector('.upload-btn');
    this.uploadBtn?.addEventListener('click', () => {
      this.fileInput?.click();
    });

    this.fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        this.handleFile(target.files[0]);
      }
    });

    const style = document.createElement('style');
    style.textContent = this.getStyles();
    document.head.appendChild(style);
  }

  private createControlBar(): void {
    const controlBar = document.createElement('div');
    controlBar.className = 'control-bar';
    controlBar.innerHTML = `
      <div class="control-left">
        <button class="upload-btn-small" title="上传音乐">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </button>
        <div class="song-info">
          <span class="song-title">未选择音乐</span>
        </div>
      </div>
      
      <div class="control-center">
        <button class="play-btn" title="播放/暂停">
          <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          <svg class="pause-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="display:none">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        </button>
      </div>
      
      <div class="control-progress">
        <span class="time-label current-time">0:00</span>
        <div class="progress-bar">
          <div class="progress-fill"></div>
          <div class="progress-tooltip">0:00</div>
        </div>
        <span class="time-label duration">0:00</span>
      </div>
      
      <div class="control-right">
        <div class="volume-control">
          <span class="volume-icon">🔊</span>
          <input type="range" class="volume-slider" min="0" max="100" value="80">
        </div>
        <select class="theme-select">
        </select>
      </div>
    `;
    this.container!.appendChild(controlBar);

    this.playBtn = controlBar.querySelector('.play-btn');
    this.progressBar = controlBar.querySelector('.progress-bar');
    this.progressFill = controlBar.querySelector('.progress-fill');
    this.progressTooltip = controlBar.querySelector('.progress-tooltip');
    this.volumeSlider = controlBar.querySelector('.volume-slider');
    this.volumeIcon = controlBar.querySelector('.volume-icon');
    this.themeSelect = controlBar.querySelector('.theme-select');
    this.timeLabel = controlBar.querySelector('.current-time');
    this.durationLabel = controlBar.querySelector('.duration');
    this.songTitle = controlBar.querySelector('.song-title');

    const uploadSmallBtn = controlBar.querySelector('.upload-btn-small');
    uploadSmallBtn?.addEventListener('click', () => {
      this.fileInput?.click();
    });

    this.playBtn.addEventListener('click', () => {
      this.playPauseCallbacks.forEach(cb => cb());
    });

    this.volumeSlider.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      const volume = parseInt(value) / 100;
      this.volumeCallbacks.forEach(cb => cb(volume));
      this.updateVolumeIcon(volume);
    });

    this.themeSelect.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      this.themeCallbacks.forEach(cb => cb(value));
    });

    this.setupProgressBar();
  }

  private setupProgressBar(): void {
    if (!this.progressBar) return;

    const updateProgress = (clientX: number) => {
      if (!this.progressBar || !this.progressFill || this.duration <= 0) return;
      const rect = this.progressBar.getBoundingClientRect();
      let percent = (clientX - rect.left) / rect.width;
      percent = Math.max(0, Math.min(1, percent));
      const time = percent * this.duration;
      this.progressFill.style.width = `${percent * 100}%`;
      if (this.progressTooltip) {
        this.progressTooltip.style.left = `${percent * 100}%`;
        this.progressTooltip.textContent = this.formatTime(time);
      }
      return time;
    };

    this.progressBar.addEventListener('mousedown', (e) => {
      this.isDraggingProgress = true;
      const time = updateProgress(e.clientX);
      if (time !== undefined) {
        this.progressCallbacks.forEach(cb => cb(time));
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDraggingProgress) {
        const time = updateProgress(e.clientX);
        if (time !== undefined) {
          this.progressCallbacks.forEach(cb => cb(time));
        }
      }
    });

    document.addEventListener('mouseup', () => {
      this.isDraggingProgress = false;
    });

    this.progressBar.addEventListener('mouseenter', () => {
      if (this.progressTooltip) {
        this.progressTooltip.style.opacity = '1';
      }
    });

    this.progressBar.addEventListener('mouseleave', () => {
      if (this.progressTooltip && !this.isDraggingProgress) {
        this.progressTooltip.style.opacity = '0';
      }
    });

    this.progressBar.addEventListener('mousemove', (e) => {
      if (!this.progressBar || !this.progressTooltip) return;
      const rect = this.progressBar.getBoundingClientRect();
      let percent = (e.clientX - rect.left) / rect.width;
      percent = Math.max(0, Math.min(1, percent));
      const time = percent * this.duration;
      this.progressTooltip.style.left = `${percent * 100}%`;
      this.progressTooltip.textContent = this.formatTime(time);
    });
  }

  private setupDragDrop(): void {
    const overlay = this.uploadOverlay;
    if (!overlay) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      document.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        overlay.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      document.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
      overlay.classList.remove('drag-active');
      const files = e.dataTransfer?.files;
      if (files && files[0]) {
        const file = files[0];
        if (file.type.startsWith('audio/') || file.name.endsWith('.mp3')) {
          this.handleFile(file);
        }
      }
    });
  }

  private handleFile(file: File): void {
    this.fileCallbacks.forEach(cb => cb(file));
    if (this.songTitle) {
      this.songTitle.textContent = file.name.replace(/\.[^/.]+$/, '');
    }
    if (this.uploadOverlay) {
      this.uploadOverlay.style.opacity = '0';
      this.uploadOverlay.style.pointerEvents = 'none';
    }
  }

  private populateThemes(themes: string[]): void {
    if (!this.themeSelect) return;
    const themeLabels: Record<string, string> = {
      neon: '霓虹',
      aurora: '极光',
      lava: '熔岩'
    };
    themes.forEach(theme => {
      const option = document.createElement('option');
      option.value = theme;
      option.textContent = themeLabels[theme] || theme;
      this.themeSelect!.appendChild(option);
    });
  }

  setPlaying(playing: boolean): void {
    this.isPlaying = playing;
    if (this.playBtn) {
      const playIcon = this.playBtn.querySelector('.play-icon');
      const pauseIcon = this.playBtn.querySelector('.pause-icon');
      if (playIcon && pauseIcon) {
        (playIcon as HTMLElement).style.display = playing ? 'none' : 'block';
        (pauseIcon as HTMLElement).style.display = playing ? 'block' : 'none';
      }
    }
  }

  updateProgress(time: number, duration: number): void {
    if (this.isDraggingProgress) return;
    this.currentTime = time;
    this.duration = duration;
    if (this.progressFill && duration > 0) {
      const percent = (time / duration) * 100;
      this.progressFill.style.width = `${percent}%`;
    }
    if (this.timeLabel) {
      this.timeLabel.textContent = this.formatTime(time);
    }
    if (this.durationLabel) {
      this.durationLabel.textContent = this.formatTime(duration);
    }
  }

  setVolume(volume: number): void {
    if (this.volumeSlider) {
      this.volumeSlider.value = String(Math.round(volume * 100));
    }
    this.updateVolumeIcon(volume);
  }

  private updateVolumeIcon(volume: number): void {
    if (!this.volumeIcon) return;
    if (volume === 0) {
      this.volumeIcon.textContent = '🔇';
    } else if (volume < 0.5) {
      this.volumeIcon.textContent = '🔉';
    } else {
      this.volumeIcon.textContent = '🔊';
    }
  }

  setTheme(theme: string): void {
    if (this.themeSelect) {
      this.themeSelect.value = theme;
    }
  }

  onPlayPause(callback: PlayPauseCallback): void {
    this.playPauseCallbacks.push(callback);
  }

  onVolumeChange(callback: VolumeCallback): void {
    this.volumeCallbacks.push(callback);
  }

  onProgressChange(callback: ProgressCallback): void {
    this.progressCallbacks.push(callback);
  }

  onThemeChange(callback: ThemeCallback): void {
    this.themeCallbacks.push(callback);
  }

  onFileLoad(callback: FileCallback): void {
    this.fileCallbacks.push(callback);
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private getStyles(): string {
    return `
      .upload-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: radial-gradient(ellipse at center, rgba(20, 20, 40, 0.85) 0%, rgba(10, 10, 20, 0.95) 100%);
        backdrop-filter: blur(10px);
        z-index: 100;
        transition: opacity 0.5s ease;
      }
      
      .upload-overlay.drag-active .upload-content {
        border-color: #00ffff;
        box-shadow: 0 0 40px rgba(0, 255, 255, 0.3);
        transform: scale(1.02);
      }
      
      .upload-content {
        text-align: center;
        padding: 60px 80px;
        border: 2px dashed rgba(255, 255, 255, 0.2);
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.03);
        transition: all 0.3s ease;
      }
      
      .upload-icon {
        font-size: 64px;
        margin-bottom: 20px;
        animation: float 3s ease-in-out infinite;
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      
      .upload-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 8px;
        background: linear-gradient(135deg, #00ffff, #ff00ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .upload-subtitle {
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 30px;
        font-size: 14px;
      }
      
      .upload-btn {
        padding: 14px 36px;
        font-size: 16px;
        font-family: 'Orbitron', sans-serif;
        font-weight: 600;
        color: #fff;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 50px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      }
      
      .upload-btn:hover {
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
      }
      
      .upload-btn:active {
        transform: translateY(0) scale(0.95);
      }
      
      .upload-hint {
        margin-top: 24px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.4);
      }
      
      .control-bar {
        position: absolute;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        width: calc(100% - 48px);
        max-width: 900px;
        padding: 16px 24px;
        background: rgba(20, 20, 35, 0.6);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        display: grid;
        grid-template-columns: 1fr auto 1.5fr 1fr;
        gap: 20px;
        align-items: center;
        z-index: 50;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      }
      
      .control-left {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }
      
      .upload-btn-small {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 10px;
        color: #fff;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      
      .upload-btn-small:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
      }
      
      .upload-btn-small:active {
        transform: scale(0.9);
      }
      
      .song-info {
        min-width: 0;
        overflow: hidden;
      }
      
      .song-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
        color: rgba(255, 255, 255, 0.9);
      }
      
      .control-center {
        display: flex;
        justify-content: center;
      }
      
      .play-btn {
        width: 52px;
        height: 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 50%;
        color: #fff;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
      }
      
      .play-btn:hover {
        transform: scale(1.12);
        box-shadow: 0 8px 30px rgba(102, 126, 234, 0.6);
      }
      
      .play-btn:active {
        transform: scale(0.9);
      }
      
      .play-btn svg {
        margin-left: 2px;
      }
      
      .control-progress {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .time-label {
        font-family: 'Orbitron', sans-serif;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        min-width: 40px;
        text-align: center;
        font-variant-numeric: tabular-nums;
      }
      
      .progress-bar {
        flex: 1;
        height: 6px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 3px;
        position: relative;
        cursor: pointer;
        transition: height 0.2s ease;
      }
      
      .progress-bar:hover {
        height: 8px;
      }
      
      .progress-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #667eea, #00ffff);
        border-radius: 3px;
        position: relative;
        transition: width 0.1s linear;
      }
      
      .progress-fill::after {
        content: '';
        position: absolute;
        right: -6px;
        top: 50%;
        transform: translateY(-50%);
        width: 12px;
        height: 12px;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      
      .progress-bar:hover .progress-fill::after {
        opacity: 1;
      }
      
      .progress-tooltip {
        position: absolute;
        bottom: 24px;
        transform: translateX(-50%);
        padding: 4px 8px;
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        font-size: 12px;
        font-family: 'Orbitron', sans-serif;
        border-radius: 4px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        font-variant-numeric: tabular-nums;
      }
      
      .control-right {
        display: flex;
        align-items: center;
        gap: 16px;
        justify-content: flex-end;
      }
      
      .volume-control {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .volume-icon {
        font-size: 16px;
        cursor: pointer;
      }
      
      .volume-slider {
        width: 80px;
        height: 4px;
        -webkit-appearance: none;
        appearance: none;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        outline: none;
        cursor: pointer;
      }
      
      .volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        background: #fff;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        transition: transform 0.2s ease;
      }
      
      .volume-slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
      }
      
      .volume-slider::-moz-range-thumb {
        width: 14px;
        height: 14px;
        background: #fff;
        border-radius: 50%;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      }
      
      .theme-select {
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        color: #fff;
        font-size: 12px;
        font-family: 'Noto Sans SC', sans-serif;
        cursor: pointer;
        outline: none;
        transition: all 0.2s ease;
      }
      
      .theme-select:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.25);
      }
      
      .theme-select option {
        background: #1a1a2e;
        color: #fff;
      }
      
      @media (max-width: 768px) {
        .control-bar {
          bottom: 0;
          left: 0;
          right: 0;
          transform: none;
          width: 100%;
          max-width: none;
          border-radius: 16px 16px 0 0;
          padding: 12px 16px;
          grid-template-columns: auto 1fr auto;
          grid-template-rows: auto auto;
          gap: 10px;
        }
        
        .control-left {
          grid-column: 1 / -1;
          order: 1;
        }
        
        .control-center {
          order: 2;
        }
        
        .control-progress {
          grid-column: 1 / -1;
          order: 3;
        }
        
        .control-right {
          order: 4;
        }
        
        .upload-content {
          padding: 40px 30px;
        }
        
        .upload-title {
          font-size: 18px;
        }
        
        .volume-slider {
          width: 60px;
        }
        
        .theme-select {
          font-size: 11px;
          padding: 6px 8px;
        }
      }
    `;
  }
}

export const uiManager = new UIManager();
