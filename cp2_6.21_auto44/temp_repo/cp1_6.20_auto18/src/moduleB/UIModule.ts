import { EarthquakeRecord } from '../data';

export class UIModule {
  private container: HTMLElement;
  private animToggleCallback: ((playing: boolean) => void) | null = null;
  private speedChangeCallback: ((speed: number) => void) | null = null;
  private timeChangeCallback: ((time: number) => void) | null = null;

  private btnAnimation: HTMLButtonElement;
  private speedSlider: HTMLInputElement;
  private speedVal: HTMLElement;
  private timeSlider: HTMLInputElement;
  private timeVal: HTMLElement;
  private statTotal: HTMLElement;
  private latestQuake: HTMLElement;
  private quakeCard: HTMLElement;
  private tipContainer: HTMLElement;

  private barCounts: HTMLElement[] = [];
  private barFills: HTMLElement[] = [];

  constructor(container: HTMLElement) {
    this.container = container;

    this.btnAnimation = document.getElementById('btn-animation') as HTMLButtonElement;
    this.speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
    this.speedVal = document.getElementById('speed-val') as HTMLElement;
    this.timeSlider = document.getElementById('time-slider') as HTMLInputElement;
    this.timeVal = document.getElementById('time-val') as HTMLElement;
    this.statTotal = document.getElementById('stat-total') as HTMLElement;
    this.latestQuake = document.getElementById('latest-quake') as HTMLElement;
    this.quakeCard = document.getElementById('quake-card') as HTMLElement;
    this.tipContainer = document.getElementById('tip-container') as HTMLElement;

    for (let i = 0; i < 4; i++) {
      this.barCounts.push(document.getElementById(`bar-c${i}`) as HTMLElement);
      this.barFills.push(document.getElementById(`bar-f${i}`) as HTMLElement);
    }

    this.bindEvents();
  }

  private bindEvents(): void {
    this.btnAnimation.addEventListener('click', () => {
      const isPlaying = this.btnAnimation.classList.toggle('active');
      this.btnAnimation.textContent = isPlaying ? '停止动画' : '开启动画';
      if (this.animToggleCallback) {
        this.animToggleCallback(isPlaying);
      }
    });

    this.speedSlider.addEventListener('input', () => {
      const val = parseFloat(this.speedSlider.value);
      this.speedVal.textContent = `${val.toFixed(1)}x`;
      if (this.speedChangeCallback) {
        this.speedChangeCallback(val);
      }
    });

    this.timeSlider.addEventListener('input', () => {
      const val = parseInt(this.timeSlider.value);
      this.timeVal.textContent = `${(val / 100).toFixed(2)}`;
      if (this.timeChangeCallback) {
        this.timeChangeCallback(val);
      }
    });

    const closeBtn = document.getElementById('card-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideQuakeCard();
        this.container.dispatchEvent(new CustomEvent('quakeDeselect'));
      });
    }
  }

  onAnimationToggle(callback: (playing: boolean) => void): void {
    this.animToggleCallback = callback;
  }

  onSpeedChange(callback: (speed: number) => void): void {
    this.speedChangeCallback = callback;
  }

  onTimeChange(callback: (time: number) => void): void {
    this.timeChangeCallback = callback;
  }

  showQuakeCard(record: EarthquakeRecord): void {
    document.getElementById('card-title')!.textContent = `地震 #${record.id}`;
    document.getElementById('card-mag')!.textContent = `${record.magnitude} 级`;
    document.getElementById('card-depth')!.textContent = `${record.depth} km`;
    document.getElementById('card-time')!.textContent = record.time;
    document.getElementById('card-loc')!.textContent = record.location;

    this.quakeCard.classList.add('visible');
  }

  hideQuakeCard(): void {
    this.quakeCard.classList.remove('visible');
  }

  updateStats(
    visibleCount: number,
    latest: EarthquakeRecord | null,
    stats: { range: string; count: number }[]
  ): void {
    this.statTotal.textContent = `${visibleCount}`;

    if (latest) {
      this.latestQuake.innerHTML = `
        <div><span class="lq-label">震级：</span><span class="lq-value">${latest.magnitude} 级</span></div>
        <div><span class="lq-label">深度：</span><span class="lq-value">${latest.depth} km</span></div>
        <div><span class="lq-label">时间：</span><span class="lq-value">${latest.time}</span></div>
        <div><span class="lq-label">位置：</span><span class="lq-value">${latest.location}</span></div>
      `;
    } else {
      this.latestQuake.innerHTML = '<span class="lq-label">暂无数据</span>';
    }

    const maxCount = Math.max(...stats.map((s) => s.count), 1);
    for (let i = 0; i < stats.length && i < this.barCounts.length; i++) {
      this.barCounts[i].textContent = `${stats[i].count}`;
      const pct = (stats[i].count / maxCount) * 100;
      this.barFills[i].style.height = `${Math.max(pct, 3)}%`;
    }
  }

  updateTimeDisplay(time: number): void {
    this.timeSlider.value = `${Math.round(time)}`;
    this.timeVal.textContent = `${(time / 100).toFixed(2)}`;
  }

  showTip(message: string): void {
    const tip = document.createElement('div');
    tip.className = 'tip-text';
    tip.textContent = message;
    this.tipContainer.innerHTML = '';
    this.tipContainer.appendChild(tip);

    setTimeout(() => {
      if (this.tipContainer.contains(tip)) {
        this.tipContainer.removeChild(tip);
      }
    }, 2200);
  }

  dispose(): void {
    this.btnAnimation.removeEventListener('click', () => {});
    this.speedSlider.removeEventListener('input', () => {});
    this.timeSlider.removeEventListener('input', () => {});
  }
}
