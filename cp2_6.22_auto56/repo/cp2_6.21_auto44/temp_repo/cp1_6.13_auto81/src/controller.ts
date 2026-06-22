import { CONFIG, PALETTES } from './config';

export type Mode = 'manual' | 'audio';
export type PaletteKey = keyof typeof PALETTES;

export interface ControllerCallbacks {
  onBeat: (angle: number) => void;
  onModeChange: (mode: Mode) => void;
  onPaletteChange: (palette: PaletteKey) => void;
  onThresholdChange: (threshold: number) => void;
}

export class Controller {
  private callbacks: ControllerCallbacks;
  private currentMode: Mode = 'manual';
  private currentPalette: PaletteKey = 'spring';
  private threshold: number = 80;
  private panelElement: HTMLElement | null = null;
  private metronomeElement: HTMLElement | null = null;
  private metronomeCenter: HTMLElement | null = null;
  private countElement: HTMLElement | null = null;
  private thresholdContainer: HTMLElement | null = null;
  private thresholdValueElement: HTMLElement | null = null;
  private hideTimeout: number | null = null;
  private isPanelVisible: boolean = false;
  private isAnimating: boolean = false;
  
  constructor(callbacks: ControllerCallbacks) {
    this.callbacks = callbacks;
    this.init();
  }
  
  private init(): void {
    this.panelElement = document.getElementById('control-panel');
    this.metronomeElement = document.getElementById('metronome');
    this.metronomeCenter = document.getElementById('metronome-center');
    this.countElement = document.getElementById('count');
    this.thresholdContainer = document.getElementById('threshold-container');
    this.thresholdValueElement = document.getElementById('threshold-value');
    
    this.createMetronomeTicks();
    this.bindEvents();
    this.updateMetronomeCenterColor();
  }
  
  private createMetronomeTicks(): void {
    if (!this.metronomeElement) return;
    
    for (let i = 0; i < CONFIG.METRONOME_TICKS; i++) {
      const tick = document.createElement('div');
      tick.className = 'tick';
      const angle = (i / CONFIG.METRONOME_TICKS) * 360;
      tick.style.transform = `rotate(${angle}deg) translateY(-${CONFIG.METRONOME_RADIUS - 12}px)`;
      tick.style.left = `calc(50% - 2px)`;
      tick.style.top = `calc(50% - ${CONFIG.METRONOME_RADIUS}px)`;
      this.metronomeElement.appendChild(tick);
    }
  }
  
  private bindEvents(): void {
    this.bindModeButtons();
    this.bindPaletteSelect();
    this.bindThresholdSlider();
    this.bindMetronome();
    this.bindPanelAutoHide();
  }
  
  private bindModeButtons(): void {
    const buttons = document.querySelectorAll('.mode-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const mode = target.dataset.mode as Mode;
        
        buttons.forEach(b => b.classList.remove('active'));
        target.classList.add('active');
        
        this.currentMode = mode;
        this.callbacks.onModeChange(mode);
        
        if (this.thresholdContainer) {
          if (mode === 'audio') {
            this.thresholdContainer.classList.add('visible');
          } else {
            this.thresholdContainer.classList.remove('visible');
          }
        }
      });
    });
  }
  
  private bindPaletteSelect(): void {
    const select = document.getElementById('palette-select') as HTMLSelectElement;
    if (select) {
      select.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        this.currentPalette = target.value as PaletteKey;
        this.callbacks.onPaletteChange(this.currentPalette);
        this.updateMetronomeCenterColor();
      });
    }
  }
  
  private bindThresholdSlider(): void {
    const slider = document.getElementById('threshold-slider') as HTMLInputElement;
    if (slider) {
      slider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        this.threshold = parseInt(target.value, 10);
        if (this.thresholdValueElement) {
          this.thresholdValueElement.textContent = this.threshold.toString();
        }
        this.callbacks.onThresholdChange(this.threshold);
      });
    }
  }
  
  private bindMetronome(): void {
    if (!this.metronomeElement) return;
    
    this.metronomeElement.addEventListener('click', (e) => {
      const rect = this.metronomeElement!.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const x = e.clientX - centerX;
      const y = e.clientY - centerY;
      
      let angle = Math.atan2(y, x);
      angle = angle < 0 ? angle + Math.PI * 2 : angle;
      
      this.triggerPulse();
      this.callbacks.onBeat(angle);
    });
  }
  
  private bindPanelAutoHide(): void {
    document.addEventListener('mousemove', (e) => {
      const triggerZone = window.innerWidth * CONFIG.PANEL_TRIGGER_AREA;
      const triggerZoneY = window.innerHeight * (1 - CONFIG.PANEL_TRIGGER_AREA);
      
      const isInTriggerZone = 
        e.clientX < triggerZone && 
        e.clientY > triggerZoneY;
      
      if (isInTriggerZone) {
        this.showPanel();
      } else if (this.isPanelVisible) {
        this.scheduleHide();
      }
    });
    
    this.panelElement?.addEventListener('mouseenter', () => {
      this.cancelScheduledHide();
    });
    
    this.panelElement?.addEventListener('mouseleave', () => {
      this.scheduleHide();
    });
  }
  
  private showPanel(): void {
    if (this.isAnimating) return;
    
    this.cancelScheduledHide();
    
    if (!this.isPanelVisible && this.panelElement) {
      this.isAnimating = true;
      this.panelElement.classList.remove('hiding');
      this.panelElement.classList.add('visible');
      
      setTimeout(() => {
        this.isAnimating = false;
      }, 300);
      
      this.isPanelVisible = true;
    }
  }
  
  private scheduleHide(): void {
    this.cancelScheduledHide();
    
    this.hideTimeout = window.setTimeout(() => {
      this.hidePanel();
    }, CONFIG.PANEL_HIDE_DELAY);
  }
  
  private cancelScheduledHide(): void {
    if (this.hideTimeout !== null) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
  
  private hidePanel(): void {
    if (this.isAnimating || !this.isPanelVisible) return;
    
    if (this.panelElement) {
      this.isAnimating = true;
      this.panelElement.classList.remove('visible');
      this.panelElement.classList.add('hiding');
      
      setTimeout(() => {
        this.panelElement?.classList.remove('hiding');
        this.isAnimating = false;
      }, 300);
      
      this.isPanelVisible = false;
    }
  }
  
  private triggerPulse(): void {
    if (this.metronomeCenter) {
      this.metronomeCenter.classList.add('pulse');
      setTimeout(() => {
        this.metronomeCenter?.classList.remove('pulse');
      }, 150);
    }
  }
  
  private updateMetronomeCenterColor(): void {
    if (this.metronomeCenter) {
      const colors = PALETTES[this.currentPalette];
      const color = colors[0];
      this.metronomeCenter.style.background = `radial-gradient(circle, ${color} 0%, rgba(255, 255, 255, 0.5) 70%, transparent 100%)`;
    }
  }
  
  angleToPosition(angle: number, radius: number = CONFIG.EXPLOSION_RADIUS): { x: number; z: number } {
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    return { x, z };
  }
  
  updateBeatCount(count: number): void {
    if (this.countElement) {
      this.countElement.textContent = count.toString();
    }
  }
  
  getCurrentPalette(): PaletteKey {
    return this.currentPalette;
  }
  
  getCurrentMode(): Mode {
    return this.currentMode;
  }
  
  getThreshold(): number {
    return this.threshold;
  }
  
  dispose(): void {
    this.cancelScheduledHide();
  }
}