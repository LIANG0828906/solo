import { FrequencyData } from '@/audio/analyzer';
import { musicLoader } from '@/audio/musicLoader';

export interface GameStateData {
  score: number;
  distance: number;
  combo: number;
  isPlaying: boolean;
  isGameOver: boolean;
  actionFlash: number;
  flashColor: string;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: number;
}

type GameStateCallback = (state: Partial<GameStateData>) => void;

export class UIOverlay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  private gameState: GameStateData = {
    score: 0,
    distance: 0,
    combo: 0,
    isPlaying: false,
    isGameOver: false,
    actionFlash: 0,
    flashColor: '#00d4ff',
  };

  private scoreDisplayValue = 0;
  private scoreScale = 1;
  private scoreScaleTarget = 1;

  private leaderboard: LeaderboardEntry[] = [];
  private leaderboardEnterTime = 0;
  private playerName = 'Player';

  private isDraggingVolume = false;
  private isHoveringButton: string | null = null;
  private isPressingButton: string | null = null;
  private buttonPressTime = 0;

  private gameStateCallbacks: GameStateCallback[] = [];

  private readonly STORAGE_KEY = 'rhythm_runner_leaderboard';

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas ${canvasId} not found`);
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    this.loadLeaderboard();
    this.setupInput();

    window.addEventListener('resize', this.onResize);
  }

  private setupInput(): void {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleMouseMove(x, y);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleMouseDown(x, y);
    });

    this.canvas.addEventListener('mouseup', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleMouseUp(x, y);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isDraggingVolume = false;
      this.isHoveringButton = null;
      this.isPressingButton = null;
    });
  }

  private handleMouseMove(x: number, y: number): void {
    this.isHoveringButton = null;

    if (this.isDraggingVolume) {
      const volSliderX = 50;
      const volSliderY = 160;
      const volSliderWidth = 180;
      const relX = Math.max(0, Math.min(volSliderWidth, x - volSliderX));
      const volume = relX / volSliderWidth;
      musicLoader.setVolume(volume);
      return;
    }

    const playBtn = this.getPlayButtonRect();
    if (this.pointInRect(x, y, playBtn)) {
      this.isHoveringButton = 'play';
    }

    const againBtn = this.getAgainButtonRect();
    if (this.gameState.isGameOver && this.pointInRect(x, y, againBtn)) {
      this.isHoveringButton = 'again';
    }

    const volSlider = this.getVolumeSliderRect();
    if (this.pointInRect(x, y, volSlider)) {
      this.isHoveringButton = 'volume';
    }

    const musicSelect = this.getMusicSelectRect();
    if (this.pointInRect(x, y, musicSelect)) {
      this.isHoveringButton = 'music';
    }
  }

  private handleMouseDown(x: number, y: number): void {
    const playBtn = this.getPlayButtonRect();
    if (this.pointInRect(x, y, playBtn)) {
      this.isPressingButton = 'play';
      this.buttonPressTime = performance.now();
      return;
    }

    const againBtn = this.getAgainButtonRect();
    if (this.gameState.isGameOver && this.pointInRect(x, y, againBtn)) {
      this.isPressingButton = 'again';
      this.buttonPressTime = performance.now();
      return;
    }

    const volSlider = this.getVolumeSliderRect();
    if (this.pointInRect(x, y, volSlider)) {
      this.isDraggingVolume = true;
      const volSliderX = 50;
      const volSliderWidth = 180;
      const relX = Math.max(0, Math.min(volSliderWidth, x - volSliderX));
      const volume = relX / volSliderWidth;
      musicLoader.setVolume(volume);
    }
  }

  private handleMouseUp(x: number, y: number): void {
    this.isDraggingVolume = false;

    if (this.isPressingButton === 'play') {
      const playBtn = this.getPlayButtonRect();
      if (this.pointInRect(x, y, playBtn)) {
        this.togglePlayPause();
      }
    }

    if (this.isPressingButton === 'again') {
      const againBtn = this.getAgainButtonRect();
      if (this.gameState.isGameOver && this.pointInRect(x, y, againBtn)) {
        this.notifyGameState({ isGameOver: false });
        this.restartGame();
      }
    }

    if (this.isPressingButton === 'music') {
      const musicSelect = this.getMusicSelectRect();
      if (this.pointInRect(x, y, musicSelect)) {
        this.cycleMusic();
      }
    }

    this.isPressingButton = null;
  }

  private getPlayButtonRect(): { x: number; y: number; w: number; h: number } {
    return { x: 50, y: 60, w: 100, h: 40 };
  }

  private getAgainButtonRect(): { x: number; y: number; w: number; h: number } {
    const centerX = this.width / 2;
    const centerY = this.height / 2 + 260;
    return { x: centerX - 80, y: centerY, w: 160, h: 50 };
  }

  private getVolumeSliderRect(): { x: number; y: number; w: number; h: number } {
    return { x: 50, y: 150, w: 180, h: 40 };
  }

  private getMusicSelectRect(): { x: number; y: number; w: number; h: number } {
    return { x: 50, y: 210, w: 180, h: 40 };
  }

  private pointInRect(x: number, y: number, rect: { x: number; y: number; w: number; h: number }): boolean {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }

  private togglePlayPause(): void {
    if (musicLoader.isPlaying()) {
      musicLoader.pause();
      this.notifyGameState({ isPlaying: false });
    } else {
      musicLoader.play();
      this.notifyGameState({ isPlaying: true });
    }
  }

  private cycleMusic(): void {
    const tracks = musicLoader.getTracks();
    const currentTrack = musicLoader.getCurrentTrack();
    let nextIndex = 0;

    if (currentTrack) {
      const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
      nextIndex = (currentIndex + 1) % tracks.length;
    }

    const nextTrack = tracks[nextIndex];
    musicLoader.load(nextTrack.id).then(() => {
      if (this.gameState.isPlaying) {
        musicLoader.play();
      }
    });
  }

  onGameStateChange(callback: GameStateCallback): () => void {
    this.gameStateCallbacks.push(callback);
    return () => {
      this.gameStateCallbacks = this.gameStateCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyGameState(state: Partial<GameStateData>): void {
    this.gameStateCallbacks.forEach((cb) => cb(state));
  }

  private restartGame(): void {
    this.notifyGameState({ isGameOver: false });
  }

  updateGameState(state: Partial<GameStateData>): void {
    if (state.score !== undefined && state.score !== this.gameState.score) {
      this.lastScore = this.gameState.score;
      this.scoreScaleTarget = 1.3;
    }
    Object.assign(this.gameState, state);

    if (state.isGameOver) {
      this.leaderboardEnterTime = performance.now();
      this.saveScore(this.gameState.score);
    }
  }

  updateFrequencyData(data: FrequencyData): void {
    this.frequencyData = data;
  }

  triggerActionFlash(color: string): void {
    this.gameState.actionFlash = 1;
    this.gameState.flashColor = color;
  }

  private loadLeaderboard(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.leaderboard = JSON.parse(stored);
      }
    } catch (e) {
      this.leaderboard = [];
    }
  }

  private saveScore(score: number): void {
    const entry: LeaderboardEntry = {
      name: this.playerName,
      score,
      date: Date.now(),
    };

    this.leaderboard.push(entry);
    this.leaderboard.sort((a, b) => b.score - a.score);
    this.leaderboard = this.leaderboard.slice(0, 10);

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.leaderboard));
    } catch (e) {
      console.warn('Failed to save leaderboard:', e);
    }
  }

  getLeaderboard(): LeaderboardEntry[] {
    return this.leaderboard;
  }

  render(deltaTime: number): void {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.scoreDisplayValue += (this.gameState.score - this.scoreDisplayValue) * 0.15;
    this.scoreScale += (this.scoreScaleTarget - this.scoreScale) * 0.15;
    this.scoreScaleTarget += (1 - this.scoreScaleTarget) * 0.05;

    if (this.gameState.actionFlash > 0) {
      this.gameState.actionFlash -= deltaTime * 10;
    }

    if (!this.gameState.isGameOver) {
      this.drawControlPanel();
      this.drawScorePanel();
      this.drawActionFlash();
    } else {
      this.drawGameOverScreen();
    }
  }

  private drawControlPanel(): void {
    const panelX = 20;
    const panelY = 30;
    const panelW = 250;
    const panelH = 280;

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(20, 20, 50, 0.4)';
    this.ctx.shadowColor = 'rgba(0, 212, 255, 0.3)';
    this.ctx.shadowBlur = 20;
    this.roundRect(panelX, panelY, panelW, panelH, 16);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = 'rgba(0, 212, 255, 0.08)';
    this.roundRect(panelX, panelY, panelW, panelH, 16);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.roundRect(panelX, panelY, panelW, panelH, 16);
    this.ctx.stroke();
    this.ctx.restore();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('控制面板', 50, 50);

    this.drawPlayButton();
    this.drawVolumeSlider();
    this.drawMusicSelect();
  }

  private drawPlayButton(): void {
    const btn = this.getPlayButtonRect();
    const isHovering = this.isHoveringButton === 'play';
    const isPressing = this.isPressingButton === 'play';

    let scale = 1;
    if (isPressing) {
      const pressDuration = (performance.now() - this.buttonPressTime) / 150;
      scale = 0.9 + Math.min(0.1, pressDuration) * 1;
    }

    const centerX = btn.x + btn.w / 2;
    const centerY = btn.y + btn.h / 2;
    const actualW = btn.w * scale;
    const actualH = btn.h * scale;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.scale(scale, scale);
    this.ctx.translate(-centerX, -centerY);

    const gradient = this.ctx.createLinearGradient(btn.x, btn.y, btn.x + btn.w, btn.y + btn.h);
    if (isHovering || isPressing) {
      gradient.addColorStop(0, '#00d4ff');
      gradient.addColorStop(1, '#7b2ff7');
    } else {
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0.7)');
      gradient.addColorStop(1, 'rgba(123, 47, 247, 0.7)');
    }

    this.ctx.fillStyle = gradient;
    this.ctx.shadowColor = isHovering ? 'rgba(0, 212, 255, 0.5)' : 'rgba(0, 212, 255, 0.2)';
    this.ctx.shadowBlur = isHovering ? 15 : 8;
    this.roundRect(btn.x, btn.y, btn.w, btn.h, 10);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    this.ctx.restore();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    const text = musicLoader.isPlaying() ? '⏸ 暂停' : '▶ 播放';
    this.ctx.fillText(text, centerX, centerY);
    this.ctx.textBaseline = 'alphabetic';
  }

  private drawVolumeSlider(): void {
    const sliderX = 50;
    const sliderY = 170;
    const sliderW = 180;
    const sliderH = 6;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.font = '13px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('音量', 50, 155);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.roundRect(sliderX, sliderY, sliderW, sliderH, 3);
    this.ctx.fill();

    const volume = musicLoader.getVolume();
    const fillW = sliderW * volume;
    const gradient = this.ctx.createLinearGradient(sliderX, sliderY, sliderX + sliderW, sliderY);
    gradient.addColorStop(0, '#00d4ff');
    gradient.addColorStop(1, '#7b2ff7');
    this.ctx.fillStyle = gradient;
    this.roundRect(sliderX, sliderY, fillW, sliderH, 3);
    this.ctx.fill();

    const handleX = sliderX + fillW;
    this.ctx.beginPath();
    this.ctx.arc(handleX, sliderY + sliderH / 2, 8, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = 'rgba(0, 212, 255, 0.8)';
    this.ctx.shadowBlur = 10;
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.font = '12px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(Math.round(volume * 100).toString(), sliderX + sliderW, 155);
    this.ctx.textAlign = 'left';
  }

  private drawMusicSelect(): void {
    const selectX = 50;
    const selectY = 220;
    const selectW = 180;
    const selectH = 40;
    const isHovering = this.isHoveringButton === 'music';

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.font = '13px "Segoe UI", sans-serif';
    this.ctx.fillText('音乐选择', 50, 210);

    this.ctx.fillStyle = isHovering ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)';
    this.ctx.strokeStyle = isHovering ? 'rgba(0, 212, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 1;
    this.roundRect(selectX, selectY, selectW, selectH, 8);
    this.ctx.fill();
    this.ctx.stroke();

    const currentTrack = musicLoader.getCurrentTrack();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '13px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(currentTrack ? currentTrack.name : '选择音乐', selectX + selectW / 2, selectY + selectH / 2 + 5);
    this.ctx.textAlign = 'left';

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('▼', selectX + selectW - 12, selectY + selectH / 2 + 5);
    this.ctx.textAlign = 'left';
  }

  private drawScorePanel(): void {
    const panelX = this.width - 270;
    const panelY = 30;
    const panelW = 250;
    const panelH = 180;

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(20, 20, 50, 0.4)';
    this.ctx.shadowColor = 'rgba(123, 47, 247, 0.3)';
    this.ctx.shadowBlur = 20;
    this.roundRect(panelX, panelY, panelW, panelH, 16);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.strokeStyle = 'rgba(123, 47, 247, 0.3)';
    this.ctx.lineWidth = 1;
    this.roundRect(panelX, panelY, panelW, panelH, 16);
    this.ctx.stroke();
    this.ctx.restore();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.font = '13px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('得分', panelX + 25, panelY + 45);

    const centerScoreX = panelX + panelW / 2;
    this.ctx.save();
    this.ctx.translate(centerScoreX, panelY + 85);
    this.ctx.scale(this.scoreScale, this.scoreScale);
    this.ctx.translate(-centerScoreX, -(panelY + 85));

    if (this.gameState.combo > 10) {
      this.drawFireEffect(centerScoreX, panelY + 85);
    }

    const scoreGradient = this.ctx.createLinearGradient(panelX, panelY + 50, panelX + panelW, panelY + 120);
    scoreGradient.addColorStop(0, '#00d4ff');
    scoreGradient.addColorStop(1, '#7b2ff7');
    this.ctx.fillStyle = scoreGradient;
    this.ctx.font = 'bold 36px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = 'rgba(0, 212, 255, 0.6)';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText(Math.floor(this.scoreDisplayValue).toString(), centerScoreX, panelY + 90);
    this.ctx.shadowBlur = 0;
    this.ctx.restore();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.font = '13px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('距离', panelX + 25, panelY + 125);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 20px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(this.gameState.distance.toFixed(1) + ' m', panelX + 25, panelY + 150);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.font = '13px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('连击', panelX + panelW - 25, panelY + 125);

    const comboColor = this.gameState.combo > 10 ? '#ff6b6b' : '#ffffff';
    this.ctx.fillStyle = comboColor;
    this.ctx.font = 'bold 20px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('x' + this.gameState.combo, panelX + panelW - 25, panelY + 150);

    this.ctx.textAlign = 'left';
  }

  private drawFireEffect(centerX: number, centerY: number): void {
    const time = performance.now() / 100;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + time * 0.05;
      const radius = 50 + Math.sin(time + i) * 8;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius * 0.5;

      const fireGradient = this.ctx.createRadialGradient(x, y, 0, x, y, 15);
      fireGradient.addColorStop(0, 'rgba(255, 200, 50, 0.9)');
      fireGradient.addColorStop(0.5, 'rgba(255, 100, 50, 0.5)');
      fireGradient.addColorStop(1, 'rgba(255, 50, 50, 0)');

      this.ctx.fillStyle = fireGradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 15, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawActionFlash(): void {
    if (this.gameState.actionFlash <= 0) return;

    const alpha = this.gameState.actionFlash;
    const color = this.gameState.flashColor;

    const gradient = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, Math.min(this.width, this.height) * 0.3,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.7,
    );
    gradient.addColorStop(0, `${color}00`);
    gradient.addColorStop(0.7, `${color}${this.alphaToHex(alpha * 0.3)}`);
    gradient.addColorStop(1, `${color}${this.alphaToHex(alpha * 0.6)}`);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private alphaToHex(alpha: number): string {
    const a = Math.max(0, Math.min(1, alpha));
    const hex = Math.round(a * 255).toString(16).padStart(2, '0');
    return hex;
  }

  private drawGameOverScreen(): void {
    const timeSinceGameOver = (performance.now() - this.leaderboardEnterTime) / 1000;

    this.ctx.save();
    this.ctx.font = 'bold 200px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = `rgba(0, 212, 255, 0.08)`;
    this.ctx.filter = 'blur(50px)';
    this.ctx.fillText(Math.floor(this.gameState.score).toString(), this.width / 2, this.height / 2 + 60);
    this.ctx.filter = 'none';
    this.ctx.restore();

    this.ctx.fillStyle = 'rgba(10, 10, 26, 0.85)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 48px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('游戏结束', this.width / 2, this.height / 2 - 200);

    const scoreGradient = this.ctx.createLinearGradient(
      this.width / 2 - 200, this.height / 2 - 150,
      this.width / 2 + 200, this.height / 2 - 150,
    );
    scoreGradient.addColorStop(0, '#00d4ff');
    scoreGradient.addColorStop(1, '#7b2ff7');
    this.ctx.fillStyle = scoreGradient;
    this.ctx.font = 'bold 72px "Segoe UI", sans-serif';
    this.ctx.shadowColor = 'rgba(0, 212, 255, 0.6)';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText(Math.floor(this.gameState.score).toString(), this.width / 2, this.height / 2 - 100);
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.font = '18px "Segoe UI", sans-serif';
    this.ctx.fillText('最终得分', this.width / 2, this.height / 2 - 60);

    this.drawLeaderboard(timeSinceGameOver);
    this.drawAgainButton();
  }

  private drawLeaderboard(timeSinceGameOver: number): void {
    const centerX = this.width / 2;
    const startY = this.height / 2 - 20;
    const itemHeight = 36;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.font = 'bold 20px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🏆 排行榜', centerX, startY);

    for (let i = 0; i < Math.min(10, this.leaderboard.length); i++) {
      const entry = this.leaderboard[i];
      const itemEnterDelay = i * 0.1;
      const itemProgress = Math.max(0, Math.min(1, (timeSinceGameOver - itemEnterDelay) / 0.4));

      if (itemProgress <= 0) continue;

      const easeOut = 1 - Math.pow(1 - itemProgress, 3);
      const slideOffset = (1 - easeOut) * 100;
      const itemY = startY + 30 + i * itemHeight;
      const itemX = centerX - 200 + slideOffset;
      const alpha = easeOut;

      const isEven = i % 2 === 0;
      this.ctx.fillStyle = isEven
        ? `rgba(0, 212, 255, ${0.08 * alpha})`
        : `rgba(123, 47, 247, ${0.08 * alpha})`;
      this.roundRect(centerX - 200, itemY - 25, 400, 30, 6);
      this.ctx.fill();

      const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
      const rankColor = i < 3 ? rankColors[i] : `rgba(255, 255, 255, ${0.6 * alpha})`;
      this.ctx.fillStyle = rankColor;
      this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.globalAlpha = alpha;
      this.ctx.fillText(`#${i + 1}`, centerX - 185, itemY);

      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.font = '15px "Segoe UI", sans-serif';
      this.ctx.fillText(entry.name, centerX - 140, itemY);

      this.ctx.textAlign = 'right';
      const scoreGradient = this.ctx.createLinearGradient(centerX, itemY, centerX + 180, itemY);
      scoreGradient.addColorStop(0, `rgba(0, 212, 255, ${alpha})`);
      scoreGradient.addColorStop(1, `rgba(123, 47, 247, ${alpha})`);
      this.ctx.fillStyle = scoreGradient;
      this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
      this.ctx.fillText(entry.score.toString(), centerX + 180, itemY);

      this.ctx.globalAlpha = 1;
    }
    this.ctx.textAlign = 'left';
  }

  private drawAgainButton(): void {
    const btn = this.getAgainButtonRect();
    const isHovering = this.isHoveringButton === 'again';
    const isPressing = this.isPressingButton === 'again';

    let scale = 1;
    if (isPressing) {
      const pressDuration = (performance.now() - this.buttonPressTime) / 150;
      const t = Math.min(1, pressDuration);
      scale = t < 0.3 ? 0.9 + (t / 0.3) * 0.1 : 1;
    } else if (isHovering) {
      scale = 1.05;
    }

    const centerX = btn.x + btn.w / 2;
    const centerY = btn.y + btn.h / 2;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.scale(scale, scale);
    this.ctx.translate(-centerX, -centerY);

    const gradient = this.ctx.createLinearGradient(btn.x, btn.y, btn.x + btn.w, btn.y + btn.h);
    if (isHovering || isPressing) {
      gradient.addColorStop(0, '#00d4ff');
      gradient.addColorStop(1, '#7b2ff7');
    } else {
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(123, 47, 247, 0.8)');
    }

    this.ctx.fillStyle = gradient;
    this.ctx.shadowColor = isHovering ? 'rgba(0, 212, 255, 0.6)' : 'rgba(0, 212, 255, 0.3)';
    this.ctx.shadowBlur = isHovering ? 20 : 10;
    this.roundRect(btn.x, btn.y, btn.w, btn.h, 12);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    this.ctx.restore();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 18px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🔄 再来一次', centerX, centerY);
    this.ctx.textBaseline = 'alphabetic';
    this.ctx.textAlign = 'left';
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }

  private onResize = (): void => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  };

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.gameStateCallbacks = [];
  }
}
