import { EQ_FREQUENCIES, EQ_MIN_DB, EQ_MAX_DB, EQ_STEP } from './audioProcessor';

export interface EqPreset {
  name: string;
  gains: number[];
}

export const EQ_PRESETS: Record<string, EqPreset> = {
  standard: {
    name: '标准',
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  rock: {
    name: '摇滚',
    gains: [5, 4, 2, -1, -2, 1, 3, 5, 6],
  },
  pop: {
    name: '流行',
    gains: [-1, 1, 3, 5, 4, 1, -1, -1, -2],
  },
  jazz: {
    name: '爵士',
    gains: [3, 2, 1, 2, -1, -1, 0, 1, 3],
  },
  classical: {
    name: '古典',
    gains: [4, 3, 2, -1, -2, -2, 0, 3, 5],
  },
  vocal: {
    name: '人声',
    gains: [-2, -3, -1, 2, 5, 6, 4, 1, -2],
  },
};

export type GainChangeCallback = (index: number, gain: number) => void;
export type PresetChangeCallback = (presetKey: string, gains: number[]) => void;

export class EQController {
  private container: HTMLElement;
  private connectorSvg: SVGElement;
  private bands: {
    el: HTMLElement;
    thumb: HTMLElement;
    track: HTMLElement;
    gainTop: HTMLElement;
    gainBottom: HTMLElement;
    freqLabel: HTMLElement;
    index: number;
    freq: number;
  }[] = [];

  private gains: number[];
  private onGainChange: GainChangeCallback | null = null;
  private onPresetChange: PresetChangeCallback | null = null;

  private activeDragIndex: number | null = null;
  private dragStartY = 0;
  private dragStartGain = 0;
  private trackHeight = 0;

  private activePresetBtn: HTMLElement | null = null;
  private animatedValues: number[] = [];
  private animRafIds: number[] = [];

  constructor(container: HTMLElement, connectorSvg: SVGElement, presetsContainer: HTMLElement) {
    this.container = container;
    this.connectorSvg = connectorSvg;
    this.gains = EQ_FREQUENCIES.map(() => 0);
    this.animatedValues = [...this.gains];

    this.buildUI();
    this.buildPresets(presetsContainer);
    this.updateConnector();
    window.addEventListener('resize', this.handleResize);
  }

  private buildUI(): void {
    // Clear all children except the svg connector
    const children = Array.from(this.container.children);
    for (const ch of children) {
      if (ch !== this.connectorSvg) {
        ch.remove();
      }
    }
    this.bands = [];

    EQ_FREQUENCIES.forEach((freq, index) => {
      const bandEl = document.createElement('div');
      bandEl.className = 'eq-band';
      bandEl.dataset.index = String(index);

      const gainTop = document.createElement('div');
      gainTop.className = 'eq-gain-top';
      gainTop.textContent = this.formatGain(this.gains[index]);
      gainTop.style.color = this.gainColorFor(this.gains[index]);

      const sliderContainer = document.createElement('div');
      sliderContainer.className = 'eq-slider-container';

      const scale = document.createElement('div');
      scale.className = 'eq-slider-scale';
      for (let i = 0; i < 9; i++) {
        const mark = document.createElement('div');
        mark.className = 'eq-scale-mark';
        scale.appendChild(mark);
      }
      sliderContainer.appendChild(scale);

      const track = document.createElement('div');
      track.className = 'eq-slider-track';

      const thumb = document.createElement('div');
      thumb.className = 'eq-slider-thumb';
      thumb.style.background = this.thumbColorFor(this.gains[index]);
      track.appendChild(thumb);

      sliderContainer.appendChild(track);

      const gainBottom = document.createElement('div');
      gainBottom.className = 'eq-gain-bottom';
      gainBottom.textContent = this.formatFreq(freq);

      const freqLabel = document.createElement('div');
      freqLabel.className = 'eq-freq-label';
      freqLabel.textContent = this.formatFreq(freq);

      bandEl.appendChild(gainTop);
      bandEl.appendChild(sliderContainer);
      bandEl.appendChild(gainBottom);
      bandEl.appendChild(freqLabel);

      this.container.appendChild(bandEl);

      this.bands.push({
        el: bandEl,
        thumb,
        track,
        gainTop,
        gainBottom,
        freqLabel,
        index,
        freq,
      });

      this.positionThumb(index, this.gains[index], false);

      // Events
      thumb.addEventListener('mousedown', (e) => this.startDrag(index, e.clientY, e));
      track.addEventListener('mousedown', (e) => {
        const rect = track.getBoundingClientRect();
        const gain = this.yToGain(e.clientY - rect.top, rect.height);
        this.setGain(index, gain, true);
        this.startDrag(index, e.clientY, e);
      });
      thumb.addEventListener('touchstart', (e) => {
        if (!e.touches[0]) return;
        this.startDrag(index, e.touches[0].clientY, e);
      }, { passive: false });
    });

    this.updateConnector();
    requestAnimationFrame(() => this.updateConnector());
  }

  private buildPresets(container: HTMLElement): void {
    const buttons = container.querySelectorAll<HTMLElement>('.preset-btn');
    buttons.forEach((btn) => {
      const key = btn.dataset.preset;
      if (!key) return;
      btn.addEventListener('click', () => {
        this.applyPreset(key);
      });
    });
  }

  private startDrag(index: number, clientY: number, srcEvent: Event): void {
    this.activeDragIndex = index;
    this.dragStartY = clientY;
    this.dragStartGain = this.gains[index];
    this.trackHeight = this.bands[index].track.getBoundingClientRect().height;

    this.bands[index].gainTop.classList.add('active');

    if (srcEvent.cancelable) srcEvent.preventDefault();

    window.addEventListener('mousemove', this.handleDragMove);
    window.addEventListener('mouseup', this.handleDragEnd);
    window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    window.addEventListener('touchend', this.handleDragEnd);
  }

  private handleDragMove = (e: MouseEvent): void => {
    if (this.activeDragIndex === null) return;
    this.updateDrag(this.activeDragIndex, e.clientY);
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (this.activeDragIndex === null || !e.touches[0]) return;
    this.updateDrag(this.activeDragIndex, e.touches[0].clientY);
    if (e.cancelable) e.preventDefault();
  };

  private updateDrag(index: number, clientY: number): void {
    const dy = clientY - this.dragStartY;
    const delta = -(dy / this.trackHeight) * (EQ_MAX_DB - EQ_MIN_DB);
    let g = this.dragStartGain + delta;
    g = Math.round(g / EQ_STEP) * EQ_STEP;
    g = Math.max(EQ_MIN_DB, Math.min(EQ_MAX_DB, g));
    this.setGain(index, g, true);
  }

  private handleDragEnd = (): void => {
    if (this.activeDragIndex !== null) {
      this.bands[this.activeDragIndex].gainTop.classList.remove('active');
      this.activeDragIndex = null;
    }
    window.removeEventListener('mousemove', this.handleDragMove);
    window.removeEventListener('mouseup', this.handleDragEnd);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleDragEnd);
  };

  private handleResize = (): void => {
    this.bands.forEach((b, i) => {
      this.positionThumb(i, this.gains[i], false);
    });
    this.updateConnector();
  };

  private yToGain(localY: number, trackH: number): number {
    const t = 1 - localY / trackH;
    const g = t * (EQ_MAX_DB - EQ_MIN_DB) + EQ_MIN_DB;
    return Math.round(g / EQ_STEP) * EQ_STEP;
  }

  private positionThumb(index: number, gain: number, animate: boolean): void {
    const band = this.bands[index];
    const track = band.track;
    const trackRect = track.getBoundingClientRect();
    const trackH = trackRect.height || 150;
    const thumbSize = 24;

    const t = (gain - EQ_MIN_DB) / (EQ_MAX_DB - EQ_MIN_DB);
    const centerY = trackH - t * trackH;
    const top = Math.max(0, Math.min(trackH - thumbSize, centerY - thumbSize / 2));

    band.thumb.style.top = `${top}px`;
    if (animate) {
      band.thumb.style.transition = 'top 0.05s ease-out';
    } else {
      band.thumb.style.transition = 'none';
    }
  }

  setGain(index: number, gain: number, emit: boolean, animate = true): void {
    gain = Math.max(EQ_MIN_DB, Math.min(EQ_MAX_DB, Math.round(gain / EQ_STEP) * EQ_STEP));
    if (this.gains[index] === gain) return;
    this.gains[index] = gain;

    const band = this.bands[index];
    if (band) {
      this.positionThumb(index, gain, animate);
      band.thumb.style.background = this.thumbColorFor(gain);
      band.gainTop.textContent = this.formatGain(gain);
      band.gainTop.style.color = this.gainColorFor(gain);
    }

    this.updateConnector();
    if (emit && this.onGainChange) {
      this.onGainChange(index, gain);
    }
    this.clearPresetActive();
  }

  setAllGains(gains: number[], emit: boolean, animate = true): void {
    gains.forEach((g, i) => this.setGain(i, g, emit, animate));
  }

  getGains(): number[] {
    return [...this.gains];
  }

  applyPreset(key: string): void {
    const preset = EQ_PRESETS[key];
    if (!preset) return;

    this.setActivePresetButton(key);
    this.animateToGains(preset.gains);

    if (this.onPresetChange) {
      this.onPresetChange(key, [...preset.gains]);
    }
  }

  private setActivePresetButton(key: string): void {
    const btns = document.querySelectorAll<HTMLElement>('.preset-btn');
    btns.forEach((b) => {
      if (b.dataset.preset === key) {
        b.classList.add('active');
        this.activePresetBtn = b;
      } else {
        b.classList.remove('active');
      }
    });
  }

  private clearPresetActive(): void {
    const btns = document.querySelectorAll<HTMLElement>('.preset-btn');
    btns.forEach((b) => b.classList.remove('active'));
    this.activePresetBtn = null;
  }

  private animateToGains(targetGains: number[]): void {
    // Cancel previous animations
    for (const id of this.animRafIds) cancelAnimationFrame(id);
    this.animRafIds = [];

    const duration = 500; // ms
    const fromGains = [...this.gains];

    targetGains.forEach((tg, index) => {
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / duration);
        const eased = this.easeOutCubic(t);
        const g = fromGains[index] + (tg - fromGains[index]) * eased;
        this.setGain(index, g, true, false);
        if (t < 1) {
          const id = requestAnimationFrame(step);
          this.animRafIds[index] = id;
        } else {
          this.setGain(index, tg, true, false);
        }
      };
      this.animRafIds[index] = requestAnimationFrame(step);
    });
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private updateConnector(): void {
    const svg = this.connectorSvg;
    if (!svg) return;

    const containerRect = this.container.getBoundingClientRect();
    const w = containerRect.width;
    const h = containerRect.height;

    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h - 40));
    svg.setAttribute('viewBox', `0 0 ${w} ${h - 40}`);

    const svgNs = 'http://www.w3.org/2000/svg';
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    if (this.bands.length < 2) return;

    const points: { x: number; y: number }[] = [];
    const connectorTopOffset = 20;

    for (let i = 0; i < this.bands.length; i++) {
      const band = this.bands[i];
      const track = band.track;
      const trackRect = track.getBoundingClientRect();
      const thumb = band.thumb;
      const thumbRect = thumb.getBoundingClientRect();

      const centerX = thumbRect.left + thumbRect.width / 2 - containerRect.left;
      const thumbCenterY = thumbRect.top + thumbRect.height / 2 - containerRect.top - connectorTopOffset;

      points.push({ x: centerX, y: thumbCenterY });
    }

    // Draw smooth curve through points
    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      d += ` Q ${prev.x.toFixed(2)} ${prev.y.toFixed(2)} ${cx.toFixed(2)} ${((prev.y + curr.y) / 2).toFixed(2)}`;
      if (i === points.length - 1) {
        d += ` Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
      }
    }

    const path = document.createElementNS(svgNs, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', 'rgba(0, 212, 255, 0.4)');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);
  }

  private formatGain(db: number): string {
    const rounded = Math.round(db * 10) / 10;
    const sign = rounded > 0 ? '+' : '';
    return `${sign}${rounded.toFixed(1)} dB`;
  }

  private formatFreq(hz: number): string {
    if (hz >= 1000) {
      return `${hz / 1000}kHz`;
    }
    return `${hz}Hz`;
  }

  private thumbColorFor(db: number): string {
    if (db > 0) return '#00ff88';
    if (db < 0) return '#ff4444';
    return '#888';
  }

  private gainColorFor(db: number): string {
    if (db > 0) return '#00ff88';
    if (db < 0) return '#ff4444';
    return '#888';
  }

  setOnGainChange(cb: GainChangeCallback | null): void {
    this.onGainChange = cb;
  }

  setOnPresetChange(cb: PresetChangeCallback | null): void {
    this.onPresetChange = cb;
  }

  forceUpdate(): void {
    this.updateConnector();
  }

  dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    for (const id of this.animRafIds) cancelAnimationFrame(id);
  }
}
