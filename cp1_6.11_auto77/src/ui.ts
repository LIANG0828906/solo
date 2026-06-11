import type { ParseResult, GradientConfig } from './parser';
import type { ParticleConfig } from './particles';
import { ParticleSystem } from './particles';

export interface Preset {
  name: string;
  css: string;
}

export class UIController {
  private editor: HTMLTextAreaElement;
  private highlightLayer: HTMLElement;
  private errorMarkers: HTMLElement;
  private onCodeChange: (css: string) => void;
  private debounceTimer: number | null = null;
  private exportBtn: HTMLButtonElement;
  private exportIcon: HTMLElement;
  private exportText: HTMLElement;
  private lockStatus: HTMLElement;
  private lockIcon: HTMLElement;
  private fpsCounter: HTMLElement;
  private mobileToggle: HTMLElement;
  private sidebar: HTMLElement;

  private countSlider: HTMLInputElement;
  private speedSlider: HTMLInputElement;
  private sizeSlider: HTMLInputElement;
  private alphaSlider: HTMLInputElement;

  private countValue: HTMLElement;
  private speedValue: HTMLElement;
  private sizeValue: HTMLElement;
  private alphaValue: HTMLElement;

  private particleConfig: ParticleConfig;
  private onConfigChange: (config: ParticleConfig) => void;

  private readonly HIGHLIGHT_RULES: { regex: RegExp; className: string }[] = [
    { regex: /(linear-gradient|radial-gradient|conic-gradient|repeating-linear-gradient|repeating-radial-gradient|repeating-conic-gradient)/g, className: 'function' },
    { regex: /(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\))/g, className: 'color' },
    { regex: /(\d+\.?\d*(?:deg|rad|turn|grad|%|px))/g, className: 'value' },
    { regex: /(to\s+(?:top|bottom|left|right)(?:\s+(?:top|bottom|left|right))?|circle|ellipse|at|from)/g, className: 'property' },
    { regex: /([()])/g, className: 'punctuation' },
  ];

  constructor(
    editor: HTMLTextAreaElement,
    onCodeChange: (css: string) => void
  ) {
    this.editor = editor;
    this.onCodeChange = onCodeChange;

    const highlightLayer = document.getElementById('highlightLayer');
    const errorMarkers = document.getElementById('errorMarkers');
    const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
    const exportIcon = document.getElementById('exportIcon');
    const exportText = document.getElementById('exportText');
    const lockStatus = document.getElementById('lockStatus');
    const lockIcon = document.getElementById('lockIcon');
    const fpsCounter = document.getElementById('fpsCounter');
    const mobileToggle = document.getElementById('mobileToggle');
    const sidebar = document.getElementById('sidebar');

    const countSlider = document.getElementById('countSlider') as HTMLInputElement;
    const speedSlider = document.getElementById('speedSlider') as HTMLInputElement;
    const sizeSlider = document.getElementById('sizeSlider') as HTMLInputElement;
    const alphaSlider = document.getElementById('alphaSlider') as HTMLInputElement;

    const countValue = document.getElementById('countValue');
    const speedValue = document.getElementById('speedValue');
    const sizeValue = document.getElementById('sizeValue');
    const alphaValue = document.getElementById('alphaValue');

    if (!highlightLayer || !errorMarkers || !exportBtn || !exportIcon || !exportText ||
        !lockStatus || !lockIcon || !fpsCounter || !mobileToggle || !sidebar ||
        !countSlider || !speedSlider || !sizeSlider || !alphaSlider ||
        !countValue || !speedValue || !sizeValue || !alphaValue) {
      throw new Error('缺少必要的DOM元素');
    }

    this.highlightLayer = highlightLayer;
    this.errorMarkers = errorMarkers;
    this.exportBtn = exportBtn;
    this.exportIcon = exportIcon;
    this.exportText = exportText;
    this.lockStatus = lockStatus;
    this.lockIcon = lockIcon;
    this.fpsCounter = fpsCounter;
    this.mobileToggle = mobileToggle;
    this.sidebar = sidebar;

    this.countSlider = countSlider;
    this.speedSlider = speedSlider;
    this.sizeSlider = sizeSlider;
    this.alphaSlider = alphaSlider;

    this.countValue = countValue;
    this.speedValue = speedValue;
    this.sizeValue = sizeValue;
    this.alphaValue = alphaValue;

    this.particleConfig = {
      count: parseInt(countSlider.value),
      speed: parseFloat(speedSlider.value),
      size: parseInt(sizeSlider.value),
      alpha: parseFloat(alphaSlider.value)
    };

    this.onConfigChange = () => {};

    this.bindEvents();
  }

  private bindEvents(): void {
    this.editor.addEventListener('input', () => {
      this.updateHighlight(this.editor.value);
      this.debounceCodeChange();
      this.syncScroll();
    });

    this.editor.addEventListener('scroll', () => {
      this.syncScroll();
    });

    this.mobileToggle.addEventListener('click', () => {
      this.sidebar.classList.toggle('open');
      if (this.sidebar.classList.contains('open')) {
        this.mobileToggle.textContent = '✕';
      } else {
        this.mobileToggle.textContent = '☰';
      }
    });

    this.countSlider.addEventListener('input', () => {
      this.particleConfig.count = parseInt(this.countSlider.value);
      this.countValue.textContent = this.countSlider.value;
      this.onConfigChange(this.particleConfig);
    });

    this.speedSlider.addEventListener('input', () => {
      this.particleConfig.speed = parseFloat(this.speedSlider.value);
      this.speedValue.textContent = this.speedSlider.value;
      this.onConfigChange(this.particleConfig);
    });

    this.sizeSlider.addEventListener('input', () => {
      this.particleConfig.size = parseInt(this.sizeSlider.value);
      this.sizeValue.textContent = this.sizeSlider.value;
      this.onConfigChange(this.particleConfig);
    });

    this.alphaSlider.addEventListener('input', () => {
      this.particleConfig.alpha = parseFloat(this.alphaSlider.value);
      this.alphaValue.textContent = this.alphaSlider.value;
      this.onConfigChange(this.particleConfig);
    });

    window.addEventListener('resize', () => {
      this.updateHighlight(this.editor.value);
    });
  }

  private debounceCodeChange(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      this.onCodeChange(this.editor.value);
    }, 80);
  }

  private syncScroll(): void {
    this.highlightLayer.scrollTop = this.editor.scrollTop;
    this.highlightLayer.scrollLeft = this.editor.scrollLeft;
  }

  setupPresets(presets: Preset[]): void {
    const container = document.getElementById('presetContainer');
    if (!container) return;

    container.innerHTML = '';

    presets.forEach(preset => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.innerHTML = `
        <span class="preset-preview" style="background: ${preset.css}"></span>
        <span>${preset.name}</span>
      `;
      btn.addEventListener('click', () => {
        this.setCode(preset.css);
      });
      container.appendChild(btn);
    });
  }

  setupSliders(
    config: ParticleConfig,
    onChange: (config: ParticleConfig) => void
  ): void {
    this.particleConfig = { ...config };
    this.onConfigChange = onChange;

    this.countSlider.value = config.count.toString();
    this.speedSlider.value = config.speed.toString();
    this.sizeSlider.value = config.size.toString();
    this.alphaSlider.value = config.alpha.toString();

    this.countValue.textContent = config.count.toString();
    this.speedValue.textContent = config.speed.toString();
    this.sizeValue.textContent = config.size.toString();
    this.alphaValue.textContent = config.alpha.toString();
  }

  setupExportButton(onExport: () => void): void {
    this.exportBtn.addEventListener('click', () => {
      onExport();
    });
  }

  updateErrorMarkers(parseResult: ParseResult): void {
    this.errorMarkers.innerHTML = '';

    if (parseResult.success || !parseResult.error) {
      return;
    }

    const error = parseResult.error;
    const lineHeight = 22.4;
    const marker = document.createElement('div');
    marker.className = 'error-marker';
    marker.style.top = `${(error.line - 1) * lineHeight}px`;
    marker.title = error.message;
    this.errorMarkers.appendChild(marker);

    const wavyLine = document.createElement('div');
    wavyLine.className = 'error-wavy';
    wavyLine.style.top = `${(error.line - 1) * lineHeight + 18}px`;
    this.errorMarkers.parentElement?.appendChild(wavyLine);
  }

  updateHighlight(css: string): void {
    let highlighted = this.escapeHtml(css);

    for (const rule of this.HIGHLIGHT_RULES) {
      highlighted = highlighted.replace(rule.regex, (match) => {
        return `<span class="${rule.className}">${match}</span>`;
      });
    }

    this.highlightLayer.innerHTML = highlighted;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setCode(css: string): void {
    this.editor.value = css;
    this.updateHighlight(css);
    this.onCodeChange(css);
  }

  toggleLockIcon(locked: boolean): void {
    if (locked) {
      this.lockStatus.classList.add('locked');
      this.lockIcon.textContent = '⏸';
    } else {
      this.lockStatus.classList.remove('locked');
      this.lockIcon.textContent = '▶';
    }
  }

  updateFps(fps: number): void {
    this.fpsCounter.textContent = `${fps} FPS`;
    if (fps >= 50) {
      this.fpsCounter.style.color = '#10B981';
    } else if (fps >= 30) {
      this.fpsCounter.style.color = '#F59E0B';
    } else {
      this.fpsCounter.style.color = '#EF4444';
    }
  }

  showExportLoading(): void {
    this.exportBtn.disabled = true;
    this.exportIcon.innerHTML = '<div class="loading-spinner"></div>';
    this.exportText.textContent = '导出中...';
  }

  hideExportLoading(): void {
    this.exportBtn.disabled = false;
    this.exportIcon.textContent = '⬇';
    this.exportText.textContent = '导出SVG';
  }

  getEditorValue(): string {
    return this.editor.value;
  }
}

export function exportSVG(
  particleSystem: ParticleSystem,
  gradient: GradientConfig,
  filename: string = 'gradient-particles.svg'
): void {
  const { width, height } = particleSystem.getSize();
  const particles = particleSystem.getSnapshotParticles();

  let gradientDef = '';
  let gradientId = 'gradient-0';

  if (gradient.type === 'linear') {
    const angle = gradient.angle ?? 180;
    const rad = ((angle - 90) * Math.PI) / 180;
    const centerX = width / 2;
    const centerY = height / 2;
    const length = Math.sqrt(width * width + height * height) / 2;

    const x1 = centerX - Math.cos(rad) * length;
    const y1 = centerY - Math.sin(rad) * length;
    const x2 = centerX + Math.cos(rad) * length;
    const y2 = centerY + Math.sin(rad) * length;

    gradientDef = `
    <linearGradient id="${gradientId}" x1="${x1 / width * 100}%" y1="${y1 / height * 100}%" 
                    x2="${x2 / width * 100}%" y2="${y2 / height * 100}%">
      ${gradient.stops.map(stop => 
        `<stop offset="${stop.position * 100}%" stop-color="${stop.rawColor}"/>`
      ).join('\n      ')}
    </linearGradient>`;
  } else if (gradient.type === 'radial') {
    const cx = (gradient.centerX ?? 0.5) * 100;
    const cy = (gradient.centerY ?? 0.5) * 100;
    const r = Math.max((gradient.radiusX ?? 0.5), (gradient.radiusY ?? 0.5)) * 100;

    gradientDef = `
    <radialGradient id="${gradientId}" cx="${cx}%" cy="${cy}%" r="${r}%">
      ${gradient.stops.map(stop => 
        `<stop offset="${stop.position * 100}%" stop-color="${stop.rawColor}"/>`
      ).join('\n      ')}
    </radialGradient>`;
  } else {
    const angle = gradient.angle ?? 0;
    gradientDef = `
    <conicGradient id="${gradientId}" angle="${angle}" cx="50%" cy="50%">
      ${gradient.stops.map(stop => 
        `<stop offset="${stop.position * 100}%" stop-color="${stop.rawColor}"/>`
      ).join('\n      ')}
    </conicGradient>`;
  }

  const particlesSvg = particles.map(p => 
    `  <circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${p.radius.toFixed(2)}" 
          fill="${p.color}" opacity="${p.alpha.toFixed(3)}"/>`
  ).join('\n');

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>${gradientDef}
  </defs>
  <rect width="100%" height="100%" fill="url(#${gradientId})"/>
${particlesSvg}
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
