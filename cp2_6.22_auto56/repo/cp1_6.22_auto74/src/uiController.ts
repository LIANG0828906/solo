import type { TeamStats, KillMarker } from './types';

type TimeChangeCallback = (time: number) => void;
type TeamFilterCallback = (showRed: boolean, showBlue: boolean) => void;
type HeatmapToggleCallback = (enabled: boolean) => void;
type PlayPauseCallback = (playing: boolean) => void;

export class UIController {
  private container: HTMLElement;
  private timelineSlider: HTMLInputElement | null = null;
  private currentTimeDisplay: HTMLElement | null = null;
  private redKillsDisplay: HTMLElement | null = null;
  private blueKillsDisplay: HTMLElement | null = null;
  private redDeathsDisplay: HTMLElement | null = null;
  private blueDeathsDisplay: HTMLElement | null = null;
  private redTeamToggle: HTMLInputElement | null = null;
  private blueTeamToggle: HTMLInputElement | null = null;
  private heatmapToggle: HTMLInputElement | null = null;
  private playPauseBtn: HTMLButtonElement | null = null;
  private tooltip: HTMLElement | null = null;
  private killMarkersContainer: HTMLElement | null = null;

  private duration: number = 180;
  private isPlaying: boolean = false;
  private isDragging: boolean = false;
  private killMarkers: KillMarker[] = [];

  private timeChangeCallbacks: TimeChangeCallback[] = [];
  private teamFilterCallbacks: TeamFilterCallback[] = [];
  private heatmapToggleCallbacks: HeatmapToggleCallback[] = [];
  private playPauseCallbacks: PlayPauseCallback[] = [];

  constructor() {
    this.container = document.body;
  }

  public init(duration: number, killMarkers: KillMarker[]): void {
    this.duration = duration;
    this.killMarkers = killMarkers;
    this.createUI();
    this.setupEventListeners();
    this.setupResponsiveLayout();
  }

  private createUI(): void {
    this.createStyles();
    this.createControlPanel();
    this.createStatsPanel();
    this.createTimeline();
    this.createTooltip();
  }

  private createStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Inter:wght@400;500;600&display=swap');

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Inter', sans-serif;
        overflow: hidden;
        background: #0a0a14;
      }

      #canvas-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
      }

      canvas {
        display: block;
        width: 100%;
        height: 100%;
      }

      .control-panel {
        position: fixed;
        left: 24px;
        top: 50%;
        transform: translateY(-50%);
        width: 280px;
        background: rgba(20, 20, 30, 0.8);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 16px;
        padding: 24px;
        z-index: 100;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .panel-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 18px;
        font-weight: 700;
        color: #fff;
        margin-bottom: 20px;
        letter-spacing: 2px;
        text-transform: uppercase;
      }

      .panel-section {
        margin-bottom: 20px;
      }

      .panel-section:last-child {
        margin-bottom: 0;
      }

      .section-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .toggle-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .toggle-item:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      .toggle-item:last-child {
        margin-bottom: 0;
      }

      .toggle-label {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: #fff;
      }

      .team-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }

      .team-dot.red {
        background: #FF3333;
        box-shadow: 0 0 10px rgba(255, 51, 51, 0.5);
      }

      .team-dot.blue {
        background: #3377FF;
        box-shadow: 0 0 10px rgba(51, 119, 255, 0.5);
      }

      .heatmap-icon {
        width: 10px;
        height: 10px;
        background: radial-gradient(circle, #FF2222 0%, transparent 70%);
        border-radius: 50%;
      }

      .toggle-switch {
        position: relative;
        width: 44px;
        height: 24px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        transition: all 0.3s ease;
      }

      .toggle-switch.active {
        background: linear-gradient(90deg, #FFD700, #FFA500);
      }

      .toggle-switch::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        background: #fff;
        border-radius: 50%;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .toggle-switch.active::after {
        left: 22px;
      }

      .toggle-input {
        display: none;
      }

      .stats-panel {
        position: fixed;
        right: 24px;
        top: 24px;
        background: rgba(20, 20, 30, 0.8);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 16px;
        padding: 20px 24px;
        z-index: 100;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        min-width: 200px;
      }

      .stats-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 14px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 16px;
        letter-spacing: 2px;
        text-transform: uppercase;
      }

      .stats-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding: 8px 12px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.03);
      }

      .stats-row:last-child {
        margin-bottom: 0;
      }

      .stats-team {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 500;
      }

      .stats-values {
        display: flex;
        gap: 16px;
        font-family: 'Orbitron', monospace;
      }

      .stat-item {
        text-align: center;
      }

      .stat-label {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .stat-value {
        font-size: 18px;
        font-weight: 700;
        color: #fff;
        letter-spacing: 2px;
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }

      .stat-value.bounce {
        animation: bounce 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }

      @keyframes bounce {
        0% { transform: scale(1); }
        50% { transform: scale(1.3); }
        100% { transform: scale(1); }
      }

      .stat-value.red {
        color: #FF3333;
        text-shadow: 0 0 10px rgba(255, 51, 51, 0.5);
      }

      .stat-value.blue {
        color: #3377FF;
        text-shadow: 0 0 10px rgba(51, 119, 255, 0.5);
      }

      .timeline-container {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 80px;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 10%;
      }

      .timeline-content {
        width: 100%;
        max-width: 1200px;
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .play-pause-btn {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: linear-gradient(135deg, #FFD700, #FFA500);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
        flex-shrink: 0;
      }

      .play-pause-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
      }

      .play-pause-btn:active {
        transform: scale(0.95);
      }

      .play-icon, .pause-icon {
        width: 16px;
        height: 16px;
      }

      .play-icon {
        border-left: 14px solid #1a1a2e;
        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
        margin-left: 4px;
      }

      .pause-icon {
        display: flex;
        gap: 4px;
      }

      .pause-icon::before, .pause-icon::after {
        content: '';
        width: 4px;
        height: 16px;
        background: #1a1a2e;
        border-radius: 2px;
      }

      .slider-wrapper {
        flex: 1;
        position: relative;
        height: 40px;
        display: flex;
        align-items: center;
      }

      .timeline-slider {
        width: 100%;
        height: 6px;
        -webkit-appearance: none;
        appearance: none;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        outline: none;
        cursor: pointer;
        position: relative;
        z-index: 2;
      }

      .timeline-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, #FFD700 0%, #FFA500 100%);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
        transition: all 0.2s ease;
        border: 3px solid #1a1a2e;
      }

      .timeline-slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 25px rgba(255, 215, 0, 0.8);
      }

      .timeline-slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, #FFD700 0%, #FFA500 100%);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
        border: 3px solid #1a1a2e;
      }

      .kill-markers {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 6px;
        transform: translateY(-50%);
        pointer-events: none;
        z-index: 1;
      }

      .kill-marker {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 10px;
        height: 10px;
        border-radius: 50%;
        cursor: pointer;
        pointer-events: auto;
        transition: transform 0.2s ease;
        z-index: 3;
      }

      .kill-marker:hover {
        transform: translate(-50%, -50%) scale(1.5);
        z-index: 10;
      }

      .kill-marker.red {
        background: #FF3333;
        box-shadow: 0 0 8px rgba(255, 51, 51, 0.6);
      }

      .kill-marker.blue {
        background: #3377FF;
        box-shadow: 0 0 8px rgba(51, 119, 255, 0.6);
      }

      .time-display {
        font-family: 'Orbitron', monospace;
        font-size: 16px;
        font-weight: 700;
        color: #fff;
        letter-spacing: 2px;
        flex-shrink: 0;
        min-width: 110px;
        text-align: right;
      }

      .time-display .current {
        color: #FFD700;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
      }

      .time-display .separator {
        color: rgba(255, 255, 255, 0.3);
        margin: 0 4px;
      }

      .time-display .total {
        color: rgba(255, 255, 255, 0.5);
      }

      .tooltip {
        position: fixed;
        background: rgba(10, 10, 20, 0.95);
        border: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: 8px;
        padding: 12px 16px;
        font-size: 13px;
        color: #fff;
        pointer-events: none;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.2s ease;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      .tooltip.visible {
        opacity: 1;
      }

      .tooltip-killer {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
      }

      .tooltip-victim {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .tooltip-label {
        color: rgba(255, 255, 255, 0.5);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .tooltip-value {
        font-weight: 600;
      }

      .tooltip-value.red {
        color: #FF3333;
      }

      .tooltip-value.blue {
        color: #3377FF;
      }

      .tooltip-time {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        font-family: 'Orbitron', monospace;
        font-size: 12px;
        color: #FFD700;
      }

      @media (max-width: 680px) {
        .control-panel {
          width: 140px;
          padding: 12px;
          left: 12px;
          transform: translateY(calc(-50% - 40px));
        }

        .panel-title {
          font-size: 10px;
          margin-bottom: 10px;
        }

        .section-label {
          font-size: 8px;
          margin-bottom: 6px;
        }

        .toggle-item {
          padding: 6px 8px;
          margin-bottom: 4px;
        }

        .toggle-label {
          font-size: 10px;
          gap: 5px;
        }

        .toggle-switch {
          width: 30px;
          height: 16px;
        }

        .toggle-switch::after {
          width: 12px;
          height: 12px;
          top: 2px;
          left: 2px;
        }

        .toggle-switch.active::after {
          left: 16px;
        }

        .stats-panel {
          padding: 10px 12px;
          right: 12px;
          top: 12px;
          min-width: 120px;
        }

        .stats-title {
          font-size: 8px;
          margin-bottom: 8px;
        }

        .stats-row {
          padding: 4px 6px;
          margin-bottom: 6px;
        }

        .stats-team {
          font-size: 10px;
          gap: 4px;
        }

        .stats-values {
          gap: 8px;
        }

        .stat-label {
          font-size: 8px;
        }

        .stat-value {
          font-size: 12px;
        }

        .timeline-container {
          height: 80px;
          flex-direction: column;
          padding: 8px 12px;
          gap: 8px;
        }

        .timeline-content {
          flex-direction: column;
          gap: 8px;
        }

        .play-pause-btn {
          width: 32px;
          height: 32px;
        }

        .time-display {
          font-size: 12px;
          min-width: auto;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private createControlPanel(): void {
    const panel = document.createElement('div');
    panel.className = 'control-panel';
    panel.innerHTML = `
      <div class="panel-title">Match Controls</div>
      
      <div class="panel-section">
        <div class="section-label">Team Display</div>
        <label class="toggle-item">
          <span class="toggle-label">
            <span class="team-dot red"></span>
            Red Team
          </span>
          <span class="toggle-switch active" data-team="red"></span>
          <input type="checkbox" class="toggle-input" id="red-team-toggle" checked>
        </label>
        <label class="toggle-item">
          <span class="toggle-label">
            <span class="team-dot blue"></span>
            Blue Team
          </span>
          <span class="toggle-switch active" data-team="blue"></span>
          <input type="checkbox" class="toggle-input" id="blue-team-toggle" checked>
        </label>
      </div>
      
      <div class="panel-section">
        <div class="section-label">Visualization</div>
        <label class="toggle-item">
          <span class="toggle-label">
            <span class="heatmap-icon"></span>
            Heatmap Overlay
          </span>
          <span class="toggle-switch" data-heatmap="true"></span>
          <input type="checkbox" class="toggle-input" id="heatmap-toggle">
        </label>
      </div>
    `;
    this.container.appendChild(panel);

    this.redTeamToggle = panel.querySelector('#red-team-toggle');
    this.blueTeamToggle = panel.querySelector('#blue-team-toggle');
    this.heatmapToggle = panel.querySelector('#heatmap-toggle');
  }

  private createStatsPanel(): void {
    const panel = document.createElement('div');
    panel.className = 'stats-panel';
    panel.innerHTML = `
      <div class="stats-title">Match Stats</div>
      <div class="stats-row">
        <span class="stats-team">
          <span class="team-dot red"></span>
          Red Team
        </span>
        <span class="stats-values">
          <span class="stat-item">
            <div class="stat-label">K</div>
            <div class="stat-value red" id="red-kills">0</div>
          </span>
          <span class="stat-item">
            <div class="stat-label">D</div>
            <div class="stat-value red" id="red-deaths">0</div>
          </span>
        </span>
      </div>
      <div class="stats-row">
        <span class="stats-team">
          <span class="team-dot blue"></span>
          Blue Team
        </span>
        <span class="stats-values">
          <span class="stat-item">
            <div class="stat-label">K</div>
            <div class="stat-value blue" id="blue-kills">0</div>
          </span>
          <span class="stat-item">
            <div class="stat-label">D</div>
            <div class="stat-value blue" id="blue-deaths">0</div>
          </span>
        </span>
      </div>
    `;
    this.container.appendChild(panel);

    this.redKillsDisplay = panel.querySelector('#red-kills');
    this.blueKillsDisplay = panel.querySelector('#blue-kills');
    this.redDeathsDisplay = panel.querySelector('#red-deaths');
    this.blueDeathsDisplay = panel.querySelector('#blue-deaths');
  }

  private createTimeline(): void {
    const container = document.createElement('div');
    container.className = 'timeline-container';
    container.innerHTML = `
      <div class="timeline-content">
        <button class="play-pause-btn" id="play-pause-btn">
          <div class="play-icon" id="play-icon"></div>
        </button>
        <div class="slider-wrapper">
          <div class="kill-markers" id="kill-markers"></div>
          <input type="range" class="timeline-slider" id="timeline-slider" 
                 min="0" max="${this.duration}" step="0.1" value="0">
        </div>
        <div class="time-display">
          <span class="current" id="current-time">00:00</span>
          <span class="separator">/</span>
          <span class="total" id="total-time">${this.formatTime(this.duration)}</span>
        </div>
      </div>
    `;
    this.container.appendChild(container);

    this.timelineSlider = container.querySelector('#timeline-slider');
    this.currentTimeDisplay = container.querySelector('#current-time');
    this.totalTimeDisplay = container.querySelector('#total-time');
    this.playPauseBtn = container.querySelector('#play-pause-btn');
    this.killMarkersContainer = container.querySelector('#kill-markers');

    this.renderKillMarkers();
  }

  private createTooltip(): void {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip';
    this.container.appendChild(this.tooltip);
  }

  private renderKillMarkers(): void {
    if (!this.killMarkersContainer) return;

    this.killMarkersContainer.innerHTML = '';

    this.killMarkers.forEach((marker) => {
      const dot = document.createElement('div');
      dot.className = `kill-marker ${marker.killerTeam}`;
      dot.style.left = `${(marker.timestamp / this.duration) * 100}%`;
      dot.dataset.killer = marker.killerId;
      dot.dataset.victim = marker.victimId;
      dot.dataset.time = marker.timestamp.toString();
      dot.dataset.team = marker.killerTeam;

      dot.addEventListener('mouseenter', (e) => this.showTooltip(e, marker));
      dot.addEventListener('mousemove', (e) => this.moveTooltip(e));
      dot.addEventListener('mouseleave', () => this.hideTooltip());

      this.killMarkersContainer?.appendChild(dot);
    });
  }

  private showTooltip(e: MouseEvent, marker: KillMarker): void {
    if (!this.tooltip) return;

    this.tooltip.innerHTML = `
      <div class="tooltip-killer">
        <span class="tooltip-label">KILLER:</span>
        <span class="tooltip-value ${marker.killerTeam}">${marker.killerId.toUpperCase()}</span>
      </div>
      <div class="tooltip-victim">
        <span class="tooltip-label">VICTIM:</span>
        <span class="tooltip-value ${marker.killerTeam === 'red' ? 'blue' : 'red'}">${marker.victimId.toUpperCase()}</span>
      </div>
      <div class="tooltip-time">${this.formatTime(marker.timestamp)}</div>
    `;

    this.tooltip.classList.add('visible');
    this.moveTooltip(e);
  }

  private moveTooltip(e: MouseEvent): void {
    if (!this.tooltip) return;

    const x = e.clientX + 15;
    const y = e.clientY + 15;

    const rect = this.tooltip.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - 20;
    const maxY = window.innerHeight - rect.height - 20;

    this.tooltip.style.left = `${Math.min(x, maxX)}px`;
    this.tooltip.style.top = `${Math.min(y, maxY)}px`;
  }

  private hideTooltip(): void {
    this.tooltip?.classList.remove('visible');
  }

  private setupEventListeners(): void {
    this.timelineSlider?.addEventListener('input', (e) => {
      const time = parseFloat((e.target as HTMLInputElement).value);
      this.isDragging = true;
      this.updateTimeDisplay(time);
      this.timeChangeCallbacks.forEach((cb) => cb(time));
    });

    this.timelineSlider?.addEventListener('change', (e) => {
      const time = parseFloat((e.target as HTMLInputElement).value);
      this.isDragging = false;
      this.timeChangeCallbacks.forEach((cb) => cb(time));
      if (this.isPlaying) {
        this.pause();
      }
    });

    this.playPauseBtn?.addEventListener('click', () => {
      this.togglePlayPause();
    });

    this.redTeamToggle?.addEventListener('change', () => {
      const showRed = this.redTeamToggle?.checked ?? true;
      const showBlue = this.blueTeamToggle?.checked ?? true;
      this.updateToggleVisual('red', showRed);
      this.teamFilterCallbacks.forEach((cb) => cb(showRed, showBlue));
    });

    this.blueTeamToggle?.addEventListener('change', () => {
      const showRed = this.redTeamToggle?.checked ?? true;
      const showBlue = this.blueTeamToggle?.checked ?? true;
      this.updateToggleVisual('blue', showBlue);
      this.teamFilterCallbacks.forEach((cb) => cb(showRed, showBlue));
    });

    this.heatmapToggle?.addEventListener('change', () => {
      const enabled = this.heatmapToggle?.checked ?? false;
      this.updateHeatmapVisual(enabled);
      this.heatmapToggleCallbacks.forEach((cb) => cb(enabled));
    });

    const toggles = document.querySelectorAll('.toggle-item');
    toggles.forEach((toggle) => {
      toggle.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).classList.contains('toggle-switch')) {
          e.preventDefault();
          const input = toggle.querySelector('.toggle-input') as HTMLInputElement;
          if (input) {
            input.checked = !input.checked;
            input.dispatchEvent(new Event('change'));
          }
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlayPause();
      }
    });
  }

  private updateToggleVisual(team: 'red' | 'blue', active: boolean): void {
    const toggle = document.querySelector(`.toggle-switch[data-team="${team}"]`);
    if (toggle) {
      toggle.classList.toggle('active', active);
    }
  }

  private updateHeatmapVisual(enabled: boolean): void {
    const toggle = document.querySelector('.toggle-switch[data-heatmap="true"]');
    if (toggle) {
      toggle.classList.toggle('active', enabled);
    }
  }

  private setupResponsiveLayout(): void {
    const handleResize = () => {
      // Responsive styles are handled via CSS media queries
    };
    window.addEventListener('resize', handleResize);
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private togglePlayPause(): void {
    this.isPlaying = !this.isPlaying;
    this.updatePlayPauseIcon();
    this.playPauseCallbacks.forEach((cb) => cb(this.isPlaying));
  }

  private updatePlayPauseIcon(): void {
    const btn = this.playPauseBtn;
    if (!btn) return;

    const icon = btn.querySelector('#play-icon');
    if (icon) {
      if (this.isPlaying) {
        icon.className = 'pause-icon';
      } else {
        icon.className = 'play-icon';
      }
    }
  }

  public play(): void {
    this.isPlaying = true;
    this.updatePlayPauseIcon();
  }

  public pause(): void {
    this.isPlaying = false;
    this.updatePlayPauseIcon();
  }

  public updateTimeDisplay(time: number): void {
    if (this.currentTimeDisplay && !this.isDragging) {
      this.currentTimeDisplay.textContent = this.formatTime(time);
    }
    if (this.timelineSlider && !this.isDragging) {
      this.timelineSlider.value = time.toString();
    }
  }

  public updateStats(stats: { red: TeamStats; blue: TeamStats }): void {
    this.animateValue(this.redKillsDisplay, stats.red.kills);
    this.animateValue(this.blueKillsDisplay, stats.blue.kills);
    this.animateValue(this.redDeathsDisplay, stats.red.deaths);
    this.animateValue(this.blueDeathsDisplay, stats.blue.deaths);
  }

  private animateValue(element: HTMLElement | null, newValue: number): void {
    if (!element) return;

    const currentValue = parseInt(element.textContent || '0', 10);
    if (currentValue !== newValue) {
      element.textContent = newValue.toString();
      element.classList.remove('bounce');
      void element.offsetWidth;
      element.classList.add('bounce');
    }
  }

  public onTimeChange(callback: TimeChangeCallback): () => void {
    this.timeChangeCallbacks.push(callback);
    return () => {
      this.timeChangeCallbacks = this.timeChangeCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onTeamFilterChange(callback: TeamFilterCallback): () => void {
    this.teamFilterCallbacks.push(callback);
    return () => {
      this.teamFilterCallbacks = this.teamFilterCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onHeatmapToggle(callback: HeatmapToggleCallback): () => void {
    this.heatmapToggleCallbacks.push(callback);
    return () => {
      this.heatmapToggleCallbacks = this.heatmapToggleCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onPlayPause(callback: PlayPauseCallback): () => void {
    this.playPauseCallbacks.push(callback);
    return () => {
      this.playPauseCallbacks = this.playPauseCallbacks.filter((cb) => cb !== callback);
    };
  }

  public dispose(): void {
    // Cleanup will be handled by browser on page unload
  }
}
