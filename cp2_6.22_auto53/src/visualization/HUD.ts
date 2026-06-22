import * as THREE from 'three';
import { OrbitParams, OrbitPosition } from '../data-service/orbitCalculator';

export interface HUDData {
  distance: number;
  velocity: number;
  axialDeviation: number;
  rollAngle: number;
}

export type FrameColor = 'red' | 'yellow' | 'green';

const glassStyle = {
  background: 'rgba(12, 20, 42, 0.55)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(120, 180, 255, 0.28)',
  borderRadius: '14px',
  boxShadow: '0 6px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.08)'
};

const darkBgStyle = {
  background: 'rgba(8, 12, 28, 0.8)',
  border: '1px solid rgba(80, 140, 220, 0.25)',
  borderRadius: '6px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.5)'
};

export class HUD {
  private container: HTMLElement;
  private hudContainer: HTMLDivElement;
  private distanceEl: HTMLElement;
  private distanceGauge: HTMLCanvasElement;
  private distanceCtx: CanvasRenderingContext2D;
  private velocityEl: HTMLElement;
  private velocityBar: HTMLDivElement;
  private velocityFill: HTMLDivElement;
  private axialEl: HTMLElement;
  private axialGauge: HTMLCanvasElement;
  private axialCtx: CanvasRenderingContext2D;
  private rollEl: HTMLElement;
  private rollGauge: HTMLCanvasElement;
  private rollCtx: CanvasRenderingContext2D;
  private dockingFrame: HTMLDivElement;
  private frameTopLeft: HTMLDivElement;
  private frameTopRight: HTMLDivElement;
  private frameBottomLeft: HTMLDivElement;
  private frameBottomRight: HTMLDivElement;
  private frameScaleLabelTL: HTMLDivElement;
  private frameScaleLabelBR: HTMLDivElement;
  private frameScaleBgTL: HTMLDivElement;
  private frameScaleBgBR: HTMLDivElement;
  private frameTickMarks: HTMLDivElement[] = [];
  private guideLine: HTMLDivElement;
  private guideArrow: HTMLDivElement;
  private orbitPanel: HTMLDivElement;
  private orbitCanvas: HTMLCanvasElement;
  private orbitCtx: CanvasRenderingContext2D;
  private paramRows: { [key: string]: HTMLElement };
  private warningOverlay: HTMLDivElement;
  private trajectoryOverlay: HTMLCanvasElement;
  private trajectoryCtx: CanvasRenderingContext2D;
  private successBanner: HTMLDivElement;
  private helpBar: HTMLDivElement;
  private currentFrameColor: FrameColor = 'red';
  private warningActive = false;
  private audioCtx: AudioContext | null = null;
  private orbitParams: OrbitParams | null = null;
  private orbitPos: OrbitPosition | null = null;
  private frameVisible = false;
  private resizeObserver: ResizeObserver | null = null;
  private warningTimeout: number | null = null;

  private styleObjToString(obj: Record<string, string>): string {
    return Object.entries(obj)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value};`;
      })
      .join(' ');
  }

  private setStyle(el: HTMLElement, styles: Record<string, string>): void {
    for (const key in styles) {
      (el.style as any)[key] = styles[key];
    }
  }

  private setupCanvasResize(canvas: HTMLCanvasElement, container: HTMLElement): void {
    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      (canvas as any).cssWidth = rect.width;
      (canvas as any).cssHeight = rect.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };
    updateCanvasSize();
    const observer = new ResizeObserver(updateCanvasSize);
    observer.observe(container);
    if (!this.resizeObserver) {
      this.resizeObserver = observer;
    }
  }

  constructor(rootContainer: HTMLElement) {
    this.container = rootContainer;
    this.hudContainer = document.createElement('div');
    this.setStyle(this.hudContainer, {
      position: 'fixed',
      top: '0', left: '0',
      width: '100%', height: '100%',
      pointerEvents: 'none',
      zIndex: '10',
      color: '#fff',
      fontFamily: `'Consolas', 'Courier New', monospace`
    });

    const topBar = document.createElement('div');
    this.setStyle(topBar, {
      position: 'absolute',
      top: '16px', left: '50%',
      transform: 'translateX(-50%)',
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '14px',
      width: 'min(960px, 94vw)',
      pointerEvents: 'none'
    });

    this.distanceEl = document.createElement('div');
    this.distanceGauge = document.createElement('canvas');
    this.distanceCtx = this.distanceGauge.getContext('2d')!;

    this.velocityEl = document.createElement('div');
    this.velocityBar = document.createElement('div');
    this.velocityFill = document.createElement('div');

    this.axialEl = document.createElement('div');
    this.axialGauge = document.createElement('canvas');
    this.axialCtx = this.axialGauge.getContext('2d')!;

    this.rollEl = document.createElement('div');
    this.rollGauge = document.createElement('canvas');
    this.rollCtx = this.rollGauge.getContext('2d')!;

    const distanceCard = this.createGaugeCard(
      '距离 DISTANCE', 'm', '#7cd8ff',
      this.distanceEl, this.distanceGauge
    );
    const velocityCard = this.createBarCard(
      '相对速度 VELOCITY', 'm/s', '#ffd166',
      this.velocityEl, this.velocityBar, this.velocityFill
    );
    const axialCard = this.createAngleGaugeCard(
      '轴向偏差 DEVIATION', '°', '#a9ff8a',
      this.axialEl, this.axialGauge, -5, 5
    );
    const rollCard = this.createAngleGaugeCard(
      '翻滚角 ROLL', '°', '#ff9cf2',
      this.rollEl, this.rollGauge, -180, 180
    );

    topBar.appendChild(distanceCard);
    topBar.appendChild(velocityCard);
    topBar.appendChild(axialCard);
    topBar.appendChild(rollCard);
    this.hudContainer.appendChild(topBar);

    this.dockingFrame = document.createElement('div');
    this.setStyle(this.dockingFrame, {
      position: 'absolute',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '240px', height: '240px',
      opacity: '0',
      transition: 'opacity 0.4s'
    });

    const mkCorner = (pos: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight') => {
      const el = document.createElement('div');
      const s: any = {
        position: 'absolute', width: '44px', height: '44px',
        border: '5px solid #ff4757', transition: 'border-color 0.25s, box-shadow 0.25s',
        borderRadius: '4px'
      };
      if (pos === 'topLeft') { s.top = '0'; s.left = '0'; s.borderRight = 'none'; s.borderBottom = 'none'; }
      if (pos === 'topRight') { s.top = '0'; s.right = '0'; s.borderLeft = 'none'; s.borderBottom = 'none'; }
      if (pos === 'bottomLeft') { s.bottom = '0'; s.left = '0'; s.borderRight = 'none'; s.borderTop = 'none'; }
      if (pos === 'bottomRight') { s.bottom = '0'; s.right = '0'; s.borderLeft = 'none'; s.borderTop = 'none'; }
      this.setStyle(el, s);
      return el;
    };

    this.frameTopLeft = mkCorner('topLeft');
    this.frameTopRight = mkCorner('topRight');
    this.frameBottomLeft = mkCorner('bottomLeft');
    this.frameBottomRight = mkCorner('bottomRight');
    this.dockingFrame.appendChild(this.frameTopLeft);
    this.dockingFrame.appendChild(this.frameTopRight);
    this.dockingFrame.appendChild(this.frameBottomLeft);
    this.dockingFrame.appendChild(this.frameBottomRight);

    this.frameScaleBgTL = document.createElement('div');
    this.setStyle(this.frameScaleBgTL, Object.assign({}, {
      position: 'absolute',
      top: '-28px', left: '-12px',
      padding: '4px 10px',
      pointerEvents: 'none'
    }, darkBgStyle));
    this.frameScaleLabelTL = document.createElement('div');
    this.setStyle(this.frameScaleLabelTL, {
      fontSize: '12px',
      color: '#fff',
      fontFamily: 'monospace',
      fontWeight: '700',
      letterSpacing: '0.5px',
      textShadow: '0 0 6px rgba(120,200,255,0.6)',
      lineHeight: '1'
    });
    this.frameScaleLabelTL.textContent = '↖ 0.0m';
    this.frameScaleBgTL.appendChild(this.frameScaleLabelTL);
    this.dockingFrame.appendChild(this.frameScaleBgTL);

    this.frameScaleBgBR = document.createElement('div');
    this.setStyle(this.frameScaleBgBR, Object.assign({}, {
      position: 'absolute',
      bottom: '-28px', right: '-12px',
      padding: '4px 10px',
      pointerEvents: 'none'
    }, darkBgStyle));
    this.frameScaleLabelBR = document.createElement('div');
    this.setStyle(this.frameScaleLabelBR, {
      fontSize: '12px',
      color: '#fff',
      fontFamily: 'monospace',
      fontWeight: '700',
      letterSpacing: '0.5px',
      textShadow: '0 0 6px rgba(120,200,255,0.6)',
      lineHeight: '1'
    });
    this.frameScaleLabelBR.textContent = '↘ 0.0m';
    this.frameScaleBgBR.appendChild(this.frameScaleLabelBR);
    this.dockingFrame.appendChild(this.frameScaleBgBR);

    const tickPositions: Array<{ side: string; offset: number; label: string }> = [
      { side: 'left', offset: 25, label: '│' },
      { side: 'left', offset: 50, label: '│' },
      { side: 'left', offset: 75, label: '│' },
      { side: 'right', offset: 25, label: '│' },
      { side: 'right', offset: 50, label: '│' },
      { side: 'right', offset: 75, label: '│' },
      { side: 'top', offset: 25, label: '─' },
      { side: 'top', offset: 50, label: '─' },
      { side: 'top', offset: 75, label: '─' },
      { side: 'bottom', offset: 25, label: '─' },
      { side: 'bottom', offset: 50, label: '─' },
      { side: 'bottom', offset: 75, label: '─' }
    ];
    tickPositions.forEach(({ side, offset, label }) => {
      const tick = document.createElement('div');
      const s: any = {
        position: 'absolute',
        color: 'rgba(255,255,255,0.75)',
        fontSize: '14px',
        fontWeight: 'bold',
        textShadow: '0 0 4px rgba(0,0,0,0.9)',
        pointerEvents: 'none'
      };
      if (side === 'left') { s.left = '-4px'; s.top = offset + '%'; s.transform = 'translateY(-50%)'; }
      if (side === 'right') { s.right = '-4px'; s.top = offset + '%'; s.transform = 'translateY(-50%)'; }
      if (side === 'top') { s.top = '-2px'; s.left = offset + '%'; s.transform = 'translateX(-50%)'; }
      if (side === 'bottom') { s.bottom = '-2px'; s.left = offset + '%'; s.transform = 'translateX(-50%)'; }
      this.setStyle(tick, s);
      tick.textContent = label;
      this.frameTickMarks.push(tick);
      this.dockingFrame.appendChild(tick);
    });

    this.guideLine = document.createElement('div');
    this.setStyle(this.guideLine, {
      position: 'absolute',
      top: '50%', left: '50%',
      width: '3px', height: '0',
      background: 'linear-gradient(to bottom, rgba(0,255,157,0.95), rgba(0,255,157,0.15))',
      transformOrigin: 'top center',
      transition: 'height 0.2s, opacity 0.3s',
      opacity: '0',
      boxShadow: '0 0 10px rgba(0,255,157,0.9)'
    });
    this.guideArrow = document.createElement('div');
    this.setStyle(this.guideArrow, {
      position: 'absolute',
      width: '0', height: '0',
      borderLeft: '8px solid transparent',
      borderRight: '8px solid transparent',
      borderTop: '14px solid #00ff9d',
      filter: 'drop-shadow(0 0 6px #00ff9d)'
    });
    this.guideLine.appendChild(this.guideArrow);
    this.dockingFrame.appendChild(this.guideLine);
    this.hudContainer.appendChild(this.dockingFrame);

    this.warningOverlay = document.createElement('div');
    this.setStyle(this.warningOverlay, {
      position: 'absolute',
      inset: '0',
      border: '7px solid #ff4757',
      boxShadow: 'inset 0 0 100px #ff475788, 0 0 80px #ff475755',
      opacity: '0',
      pointerEvents: 'none',
      animation: 'none',
      borderRadius: '2px'
    });
    this.hudContainer.appendChild(this.warningOverlay);

    this.orbitPanel = document.createElement('div');
    this.setStyle(this.orbitPanel, Object.assign({}, {
      position: 'absolute',
      right: '18px', bottom: '78px',
      width: '340px',
      padding: '18px',
      pointerEvents: 'none'
    }, glassStyle));
    const orbitTitle = document.createElement('div');
    orbitTitle.textContent = '◈ 轨道参数 ORBITAL DATA';
    this.setStyle(orbitTitle, {
      fontSize: '13px',
      letterSpacing: '2px',
      color: '#8fd0ff',
      marginBottom: '14px',
      textShadow: '0 0 8px #4ac4ffaa',
      fontWeight: '600'
    });
    this.orbitPanel.appendChild(orbitTitle);

    const paramTable = document.createElement('div');
    this.setStyle(paramTable, {
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr',
      gap: '7px 12px',
      fontSize: '11.5px',
      marginBottom: '16px',
      fontFamily: 'monospace'
    });
    const paramList: Array<[string, string, string]> = [
      ['轨道高度', 'altitude', 'km'],
      ['轨道速度', 'velocity', 'km/s'],
      ['轨道倾角', 'inclination', '°'],
      ['升交点赤经', 'raan', '°'],
      ['偏心率', 'eccentricity', ''],
      ['轨道周期', 'period', 'min']
    ];
    this.paramRows = {};
    paramList.forEach(([label, key, unit]) => {
      const l = document.createElement('div');
      l.textContent = label;
      l.style.color = 'rgba(200,220,255,0.75)';
      const v = document.createElement('div');
      v.textContent = `-- ${unit}`;
      v.style.color = '#d0e8ff';
      v.style.textAlign = 'right';
      v.style.textShadow = '0 0 5px #8fd0ff88';
      v.style.fontWeight = '600';
      this.paramRows[key] = v;
      paramTable.appendChild(l);
      paramTable.appendChild(v);
    });
    this.orbitPanel.appendChild(paramTable);

    const canvasWrap = document.createElement('div');
    this.setStyle(canvasWrap, {
      position: 'relative',
      width: '100%',
      aspectRatio: '1',
      background: 'radial-gradient(circle at center, rgba(25,45,90,0.7), rgba(8,12,28,0.95))',
      borderRadius: '10px',
      border: '1px solid rgba(120,180,255,0.25)',
      overflow: 'hidden',
      boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)'
    });
    this.orbitCanvas = document.createElement('canvas');
    this.setStyle(this.orbitCanvas, {
      display: 'block',
      width: '100%',
      height: '100%'
    });
    this.orbitCtx = this.orbitCanvas.getContext('2d')!;
    canvasWrap.appendChild(this.orbitCanvas);
    this.setupCanvasResize(this.orbitCanvas, canvasWrap);
    const orbitLegend = document.createElement('div');
    this.setStyle(orbitLegend, {
      position: 'absolute',
      top: '10px', left: '10px',
      fontSize: '11px',
      fontFamily: 'monospace',
      color: 'rgba(220,235,255,0.9)',
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      fontWeight: '600'
    });
    orbitLegend.innerHTML = `
      <div><span style="color:#00ff9d; text-shadow:0 0 6px #00ff9d">●</span> 空间站</div>
      <div><span style="color:#4ac4ff; text-shadow:0 0 6px #4ac4ff">●</span> 飞船</div>
      <div style="opacity:0.6; font-weight:400">俯视图 TOP VIEW</div>
    `;
    canvasWrap.appendChild(orbitLegend);
    this.orbitPanel.appendChild(canvasWrap);
    this.hudContainer.appendChild(this.orbitPanel);

    this.trajectoryOverlay = document.createElement('canvas');
    this.setStyle(this.trajectoryOverlay, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.6s'
    });
    this.trajectoryOverlay.width = window.innerWidth;
    this.trajectoryOverlay.height = window.innerHeight;
    this.trajectoryCtx = this.trajectoryOverlay.getContext('2d')!;
    this.hudContainer.appendChild(this.trajectoryOverlay);

    this.successBanner = document.createElement('div');
    this.setStyle(this.successBanner, {
      position: 'absolute',
      top: '38%', left: '50%',
      transform: 'translate(-50%, -50%) scale(0.5)',
      fontSize: '52px',
      fontWeight: '800',
      color: '#ffd700',
      letterSpacing: '9px',
      textShadow: '0 0 24px #ffd700, 0 0 80px #ffa500, 0 0 4px #fff',
      opacity: '0',
      transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
      fontFamily: `'Segoe UI', sans-serif`,
      textAlign: 'center',
      pointerEvents: 'none'
    });
    this.successBanner.innerHTML = `
      <div>✦ 对接成功 ✦</div>
      <div style="font-size:19px;letter-spacing:5px;margin-top:12px;color:#fff;opacity:0.85;font-weight:400">DOCKING COMPLETE</div>
    `;
    this.hudContainer.appendChild(this.successBanner);

    this.helpBar = document.createElement('div');
    this.setStyle(this.helpBar, Object.assign({}, {
      position: 'absolute',
      bottom: '14px', left: '50%',
      transform: 'translateX(-50%)',
      padding: '11px 24px',
      fontSize: '12px',
      fontFamily: 'monospace',
      letterSpacing: '0.5px',
      color: 'rgba(220,235,255,0.92)',
      display: 'flex',
      gap: '22px',
      pointerEvents: 'none',
      whiteSpace: 'nowrap'
    }, glassStyle));
    this.helpBar.innerHTML = `
      <span>📷 <b style="color:#7cd8ff; text-shadow:0 0 4px #7cd8ff88">WASD</b> 平移视角 · 拖拽旋转</span>
      <span>🚀 <b style="color:#ffd166; text-shadow:0 0 4px #ffd16688">IJKL</b> 飞船平移</span>
      <span>↕ <b style="color:#a9ff8a; text-shadow:0 0 4px #a9ff8a88">U/O</b> 俯仰</span>
      <span>↔ <b style="color:#ff9cf2; text-shadow:0 0 4px #ff9cf288">Y/H</b> 偏航</span>
    `;
    this.hudContainer.appendChild(this.helpBar);

    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes warnFlashFast {
        0%, 100% { opacity: 0; }
        25% { opacity: 0.85; }
        50% { opacity: 0.1; }
        75% { opacity: 0.8; }
      }
    `;
    document.head.appendChild(styleEl);

    this.container.appendChild(this.hudContainer);

    window.addEventListener('resize', () => {
      this.trajectoryOverlay.width = window.innerWidth;
      this.trajectoryOverlay.height = window.innerHeight;
    });

    this.drawDistanceGauge(0);
    this.drawAngleGauge(this.axialCtx, 0, -5, 5, '#a9ff8a');
    this.drawAngleGauge(this.rollCtx, 0, -180, 180, '#ff9cf2');
  }

  private createGaugeCard(
    label: string, unit: string, color: string,
    valueEl: HTMLElement, gaugeCanvas: HTMLCanvasElement
  ): HTMLDivElement {
    const card = document.createElement('div');
    this.setStyle(card, Object.assign({}, glassStyle, {
      padding: '12px 16px 14px',
      textAlign: 'center'
    }));
    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    this.setStyle(labelEl, {
      fontSize: '11px',
      letterSpacing: '2px',
      textTransform: 'uppercase',
      color: 'rgba(180,220,255,0.85)',
      marginBottom: '6px',
      textShadow: '0 0 6px rgba(120,180,255,0.4)'
    });

    const valWrap = document.createElement('div');
    this.setStyle(valWrap, {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'center',
      gap: '5px',
      marginBottom: '4px'
    });
    valueEl.textContent = '0.00';
    this.setStyle(valueEl, {
      fontSize: '26px',
      fontWeight: '700',
      color,
      textShadow: `0 0 14px ${color}aa, 0 0 4px #fff`,
      letterSpacing: '1px',
      transition: 'all 0.15s',
      lineHeight: '1.1'
    });
    const unitEl = document.createElement('div');
    unitEl.textContent = unit;
    this.setStyle(unitEl, {
      fontSize: '11px',
      color: 'rgba(200,220,255,0.75)'
    });
    valWrap.appendChild(valueEl);
    valWrap.appendChild(unitEl);

    const canvasWrap = document.createElement('div');
    this.setStyle(canvasWrap, {
      width: '100%',
      height: '50px',
      margin: '0 auto'
    });
    this.setStyle(gaugeCanvas, {
      display: 'block',
      width: '100%',
      height: '100%'
    });
    canvasWrap.appendChild(gaugeCanvas);
    this.setupCanvasResize(gaugeCanvas, canvasWrap);

    card.appendChild(labelEl);
    card.appendChild(valWrap);
    card.appendChild(canvasWrap);
    return card;
  }

  private createBarCard(
    label: string, unit: string, color: string,
    valueEl: HTMLElement, barContainer: HTMLDivElement, fill: HTMLDivElement
  ): HTMLDivElement {
    const card = document.createElement('div');
    this.setStyle(card, Object.assign({}, glassStyle, {
      padding: '12px 16px 14px',
      textAlign: 'center'
    }));
    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    this.setStyle(labelEl, {
      fontSize: '11px',
      letterSpacing: '2px',
      textTransform: 'uppercase',
      color: 'rgba(180,220,255,0.85)',
      marginBottom: '6px',
      textShadow: '0 0 6px rgba(120,180,255,0.4)'
    });

    const valWrap = document.createElement('div');
    this.setStyle(valWrap, {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'center',
      gap: '5px',
      marginBottom: '10px'
    });
    valueEl.textContent = '0.000';
    this.setStyle(valueEl, {
      fontSize: '26px',
      fontWeight: '700',
      color,
      textShadow: `0 0 14px ${color}aa, 0 0 4px #fff`,
      letterSpacing: '1px',
      transition: 'all 0.15s',
      lineHeight: '1.1'
    });
    const unitEl = document.createElement('div');
    unitEl.textContent = unit;
    this.setStyle(unitEl, {
      fontSize: '11px',
      color: 'rgba(200,220,255,0.75)'
    });
    valWrap.appendChild(valueEl);
    valWrap.appendChild(unitEl);

    this.setStyle(barContainer, {
      position: 'relative',
      width: '100%',
      height: '16px',
      background: 'rgba(10,18,38,0.8)',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid rgba(120,180,255,0.25)',
      boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)'
    });
    this.setStyle(fill, {
      position: 'absolute',
      left: '0', top: '0',
      height: '100%',
      width: '0%',
      borderRadius: '8px',
      background: `linear-gradient(90deg, ${color}66, ${color}ee, #fff)`,
      boxShadow: `0 0 12px ${color}aa`,
      transition: 'width 0.25s ease-out'
    });
    barContainer.appendChild(fill);

    const scaleMarks = document.createElement('div');
    this.setStyle(scaleMarks, {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '4px',
      fontSize: '9px',
      color: 'rgba(180,210,255,0.5)',
      fontFamily: 'monospace'
    });
    scaleMarks.innerHTML = '<span>0</span><span>0.5</span><span>1.0</span><span>1.5</span><span>2.0</span>';

    card.appendChild(labelEl);
    card.appendChild(valWrap);
    card.appendChild(barContainer);
    card.appendChild(scaleMarks);
    return card;
  }

  private createAngleGaugeCard(
    label: string, unit: string, color: string,
    valueEl: HTMLElement, gaugeCanvas: HTMLCanvasElement,
    min: number, max: number
  ): HTMLDivElement {
    const card = document.createElement('div');
    this.setStyle(card, Object.assign({}, glassStyle, {
      padding: '12px 16px 14px',
      textAlign: 'center'
    }));
    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    this.setStyle(labelEl, {
      fontSize: '11px',
      letterSpacing: '2px',
      textTransform: 'uppercase',
      color: 'rgba(180,220,255,0.85)',
      marginBottom: '6px',
      textShadow: '0 0 6px rgba(120,180,255,0.4)'
    });

    const valWrap = document.createElement('div');
    this.setStyle(valWrap, {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'center',
      gap: '5px',
      marginBottom: '4px'
    });
    valueEl.textContent = '0.00';
    this.setStyle(valueEl, {
      fontSize: '26px',
      fontWeight: '700',
      color,
      textShadow: `0 0 14px ${color}aa, 0 0 4px #fff`,
      letterSpacing: '1px',
      transition: 'all 0.15s',
      lineHeight: '1.1'
    });
    const unitEl = document.createElement('div');
    unitEl.textContent = unit;
    this.setStyle(unitEl, {
      fontSize: '11px',
      color: 'rgba(200,220,255,0.75)'
    });
    valWrap.appendChild(valueEl);
    valWrap.appendChild(unitEl);

    const canvasWrap = document.createElement('div');
    this.setStyle(canvasWrap, {
      width: '100%',
      height: '50px',
      margin: '0 auto'
    });
    this.setStyle(gaugeCanvas, {
      display: 'block',
      width: '100%',
      height: '100%'
    });
    canvasWrap.appendChild(gaugeCanvas);
    this.setupCanvasResize(gaugeCanvas, canvasWrap);

    card.appendChild(labelEl);
    card.appendChild(valWrap);
    card.appendChild(canvasWrap);
    return card;
  }

  private drawDistanceGauge(value: number): void {
    const ctx = this.distanceCtx;
    const W = this.distanceGauge.width;
    const H = this.distanceGauge.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H - 8;
    const radius = Math.min(W * 0.42, H * 0.85);
    const startAngle = Math.PI;
    const endAngle = 0;

    const bgGrad = ctx.createLinearGradient(0, 0, W, 0);
    bgGrad.addColorStop(0, '#ff4757');
    bgGrad.addColorStop(0.35, '#ffaa00');
    bgGrad.addColorStop(0.7, '#99ff44');
    bgGrad.addColorStop(1, '#00ff9d');

    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(20,30,60,0.8)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.stroke();

    const norm = Math.max(0, Math.min(1, 1 - value / 60));
    const angleRange = startAngle - endAngle;
    const fillEnd = startAngle - angleRange * norm;

    ctx.strokeStyle = bgGrad;
    ctx.shadowColor = '#7cd8ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, fillEnd, true);
    ctx.stroke();
    ctx.shadowBlur = 0;

    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const ang = startAngle - angleRange * t;
      const x1 = cx + Math.cos(ang) * (radius - 12);
      const y1 = cy + Math.sin(ang) * (radius - 12);
      const x2 = cx + Math.cos(ang) * (radius - 5);
      const y2 = cy + Math.sin(ang) * (radius - 5);
      ctx.strokeStyle = 'rgba(180,210,255,0.45)';
      ctx.lineWidth = i % 5 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const needleAngle = startAngle - angleRange * norm;
    const needleLen = radius - 3;
    const nx = cx + Math.cos(needleAngle) * needleLen;
    const ny = cy + Math.sin(needleAngle) * needleLen;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#7cd8ff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#7cd8ff';
    ctx.shadowColor = '#7cd8ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawAngleGauge(
    ctx: CanvasRenderingContext2D, value: number,
    min: number, max: number, color: string
  ): void {
    const canvas = ctx.canvas;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H - 6;
    const radius = Math.min(W * 0.42, H * 0.9);
    const startAngle = Math.PI;
    const endAngle = 0;
    const angleRange = startAngle - endAngle;

    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(20,30,60,0.8)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.stroke();

    const mid = (min + max) / 2;
    const range = max - min;
    const norm = Math.max(0, Math.min(1, (value - min) / range));
    const centerNorm = 0.5;
    const fillStart = startAngle - angleRange * Math.min(norm, centerNorm);
    const fillEnd = startAngle - angleRange * Math.max(norm, centerNorm);

    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, color);
    grad.addColorStop(0.5, '#fff');
    grad.addColorStop(1, color);

    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, fillStart, fillEnd, true);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const tickCount = 11;
    for (let i = 0; i < tickCount; i++) {
      const t = i / (tickCount - 1);
      const ang = startAngle - angleRange * t;
      const isMajor = i === 0 || i === Math.floor(tickCount / 2) || i === tickCount - 1;
      const x1 = cx + Math.cos(ang) * (radius - 10);
      const y1 = cy + Math.sin(ang) * (radius - 10);
      const x2 = cx + Math.cos(ang) * (radius - 4);
      const y2 = cy + Math.sin(ang) * (radius - 4);
      ctx.strokeStyle = isMajor ? 'rgba(200,225,255,0.7)' : 'rgba(160,190,240,0.35)';
      ctx.lineWidth = isMajor ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const needleAng = startAngle - angleRange * norm;
    const nl = radius - 2;
    ctx.lineTo(
      cx + Math.cos(needleAng) * nl,
      cy + Math.sin(needleAng) * nl
    );
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx, cy, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(180,210,255,0.65)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(min), cx - radius * 0.7, cy - radius * 0.1);
    ctx.fillText('0', cx, cy - radius + 12);
    ctx.fillText(String(max), cx + radius * 0.7, cy - radius * 0.1);
  }

  update(data: HUDData, camera: THREE.Camera, dockingPortWorld: THREE.Vector3): void {
    const animNum = (el: HTMLElement, val: number, decimals = 2) => {
      const cur = parseFloat(el.textContent || '0');
      const next = cur + (val - cur) * 0.3;
      el.textContent = next.toFixed(decimals);
      return next;
    };
    const dVal = animNum(this.distanceEl, data.distance);
    const vVal = animNum(this.velocityEl, data.velocity, 3);
    const aVal = animNum(this.axialEl, data.axialDeviation, 2);
    const rVal = animNum(this.rollEl, data.rollAngle, 2);

    this.drawDistanceGauge(dVal);
    this.drawAngleGauge(this.axialCtx, aVal, -5, 5, '#a9ff8a');
    this.drawAngleGauge(this.rollCtx, rVal, -180, 180, '#ff9cf2');

    const speedPct = Math.max(0, Math.min(100, (vVal / 2.0) * 100));
    this.velocityFill.style.width = speedPct + '%';
    if (vVal > 1.5) {
      this.velocityFill.style.background = 'linear-gradient(90deg, #ff6b6b, #ff4757, #ff2244)';
      (this.velocityFill.style as any).boxShadow = '0 0 14px #ff4757cc';
    } else if (vVal > 0.8) {
      this.velocityFill.style.background = 'linear-gradient(90deg, #ffd16688, #ffd166, #fff)';
      (this.velocityFill.style as any).boxShadow = '0 0 12px #ffd166aa';
    } else {
      this.velocityFill.style.background = 'linear-gradient(90deg, #ffd16666, #ffd166ee, #fff)';
      (this.velocityFill.style as any).boxShadow = '0 0 12px #ffd166aa';
    }

    const screen = dockingPortWorld.clone().project(camera);
    const x = (screen.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screen.y * 0.5 + 0.5) * window.innerHeight;
    const inFront = screen.z < 1;
    const shouldShow = data.distance < 60 && inFront;
    this.frameVisible = shouldShow;
    this.dockingFrame.style.opacity = shouldShow ? '1' : '0';

    if (shouldShow) {
      const scale = Math.max(0.6, Math.min(1.8, 60 / (data.distance + 1)));
      const size = 240 * scale;
      this.dockingFrame.style.left = x + 'px';
      this.dockingFrame.style.top = y + 'px';
      this.dockingFrame.style.width = size + 'px';
      this.dockingFrame.style.height = size + 'px';
      const distLabel = data.distance.toFixed(1) + 'm';
      this.frameScaleLabelTL.textContent = `↖ ${distLabel}`;
      this.frameScaleLabelBR.textContent = `↘ ${distLabel}`;
    }
  }

  setDockingFrameColor(color: FrameColor): void {
    this.currentFrameColor = color;
    const hex = color === 'red' ? '#ff4757' : color === 'yellow' ? '#ffaa00' : '#00ff9d';
    const shadow = color === 'red' ? '#ff4757aa' : color === 'yellow' ? '#ffaa00aa' : '#00ff9daa';
    [this.frameTopLeft, this.frameTopRight, this.frameBottomLeft, this.frameBottomRight].forEach(el => {
      (el.style as any).borderColor = hex;
      (el.style as any).boxShadow = `0 0 14px ${shadow}`;
    });
    this.frameTickMarks.forEach(tick => {
      (tick.style as any).color = hex;
      (tick.style as any).textShadow = `0 0 8px ${shadow}`;
    });
  }

  setGuideVector(dx: number, dy: number, dist: number, cam: THREE.Camera): void {
    if (!this.frameVisible) {
      this.guideLine.style.opacity = '0';
      return;
    }
    const maxLen = 160;
    const len = Math.min(maxLen, dist * 2.0);
    const angle = Math.atan2(dy, dx);
    const angleDeg = (angle * 180) / Math.PI + 90;
    this.guideLine.style.opacity = dist > 1 ? '0.95' : '0';
    this.guideLine.style.height = len + 'px';
    this.guideLine.style.transform = `translate(-50%, 0) rotate(${angleDeg}deg)`;
    this.guideArrow.style.top = (len - 10) + 'px';
    this.guideArrow.style.left = '-6.5px';
  }

  flashWarning(active: boolean): void {
    if (this.warningTimeout) {
      window.clearTimeout(this.warningTimeout);
      this.warningTimeout = null;
    }
    this.warningTimeout = window.setTimeout(() => {
      if (active === this.warningActive) return;
      this.warningActive = active;
      if (active) {
        (this.warningOverlay.style as any).animation = 'warnFlashFast 0.25s ease-in-out infinite';
      } else {
        (this.warningOverlay.style as any).animation = 'none';
        this.warningOverlay.style.opacity = '0';
      }
      this.warningTimeout = null;
    }, 50);
  }

  updateOrbitView(params: OrbitParams | null, pos: OrbitPosition | null): void {
    if (params) this.orbitParams = params;
    if (pos) this.orbitPos = pos;
    if (!this.orbitParams) return;
    Object.entries(this.paramRows).forEach(([key, el]) => {
      const val = (this.orbitParams as any)[key];
      if (val !== undefined) {
        const unitMap: { [k: string]: string } = {
          altitude: 'km', velocity: 'km/s', inclination: '°',
          raan: '°', eccentricity: '', period: 'min'
        };
        const u = unitMap[key] || '';
        const dec = key === 'eccentricity' ? 5 : 2;
        el.textContent = `${Number(val).toFixed(dec)} ${u}`;
      }
    });
    this.drawOrbitView();
  }

  private drawOrbitView(): void {
    const ctx = this.orbitCtx;
    const W = this.orbitCanvas.width;
    const H = this.orbitCanvas.height;
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) * 0.42;

    const bgGlow = ctx.createRadialGradient(cx, cy, 4, cx, cy, R * 0.5);
    bgGlow.addColorStop(0, 'rgba(74,196,255,0.35)');
    bgGlow.addColorStop(0.6, 'rgba(30,80,160,0.15)');
    bgGlow.addColorStop(1, 'rgba(10,20,50,0)');
    ctx.fillStyle = bgGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a6ebf';
    ctx.shadowColor = '#4ac4ff';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#3a94d8';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 2, 14, Math.PI * 0.2, Math.PI * 0.7);
    ctx.fill();

    const path = this.orbitParams!.orbitPath;
    if (path.length > 0) {
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.setLineDash([8, 6]);

      for (let i = 1; i < path.length; i++) {
        const p0 = path[i - 1];
        const p1 = path[i];
        const x1 = cx + p0.x * R;
        const y1 = cy - p0.y * R;
        const x2 = cx + p1.x * R;
        const y2 = cy - p1.y * R;
        const t = i / path.length;

        const r = Math.round(100 + 120 * t);
        const g = Math.round(180 - 30 * t);
        const b = Math.round(255 - 40 * t);
        const a = 0.45 + 0.4 * t;

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${a * 0.8})`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
    }

    if (this.orbitPos) {
      const { stationPosition: s, spacecraftPosition: c } = this.orbitPos;
      const sx = cx + s.x * R;
      const sy = cy - s.y * R;

      const stationOuterGlow = ctx.createRadialGradient(sx, sy, 2, sx, sy, 28);
      stationOuterGlow.addColorStop(0, 'rgba(0,255,157,0.9)');
      stationOuterGlow.addColorStop(0.4, 'rgba(0,255,157,0.35)');
      stationOuterGlow.addColorStop(1, 'rgba(0,255,157,0)');
      ctx.fillStyle = stationOuterGlow;
      ctx.beginPath();
      ctx.arc(sx, sy, 28, 0, Math.PI * 2);
      ctx.fill();

      const stationInnerGlow = ctx.createRadialGradient(sx, sy, 1, sx, sy, 10);
      stationInnerGlow.addColorStop(0, '#ffffff');
      stationInnerGlow.addColorStop(0.3, '#00ff9d');
      stationInnerGlow.addColorStop(1, 'rgba(0,255,157,0.3)');
      ctx.fillStyle = stationInnerGlow;
      ctx.shadowColor = '#00ff9d';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      const cxx = cx + c.x * R;
      const cyy = cy - c.y * R;

      const craftOuterGlow = ctx.createRadialGradient(cxx, cyy, 2, cxx, cyy, 24);
      craftOuterGlow.addColorStop(0, 'rgba(74,196,255,0.9)');
      craftOuterGlow.addColorStop(0.4, 'rgba(74,196,255,0.35)');
      craftOuterGlow.addColorStop(1, 'rgba(74,196,255,0)');
      ctx.fillStyle = craftOuterGlow;
      ctx.beginPath();
      ctx.arc(cxx, cyy, 24, 0, Math.PI * 2);
      ctx.fill();

      const craftInnerGlow = ctx.createRadialGradient(cxx, cyy, 1, cxx, cyy, 8);
      craftInnerGlow.addColorStop(0, '#ffffff');
      craftInnerGlow.addColorStop(0.3, '#4ac4ff');
      craftInnerGlow.addColorStop(1, 'rgba(74,196,255,0.3)');
      ctx.fillStyle = craftInnerGlow;
      ctx.shadowColor = '#4ac4ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cxx, cyy, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(cxx, cyy, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  playSuccessSound(): void {
    try {
      if (!this.audioCtx) {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AC) return;
        this.audioCtx = new AC();
      }
      const ctx = this.audioCtx!;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.28, now + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.55);
      });
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(523.25, now + 0.45);
      osc2.frequency.exponentialRampToValueAtTime(1567.98, now + 1.1);
      gain2.gain.setValueAtTime(0, now + 0.45);
      gain2.gain.linearRampToValueAtTime(0.2, now + 0.6);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(now + 0.45);
      osc2.stop(now + 1.25);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  async showDockingSuccess(
    trajectory: THREE.Vector3[],
    camera: THREE.Camera
  ): Promise<void> {
    this.successBanner.style.opacity = '1';
    this.successBanner.style.transform = 'translate(-50%, -50%) scale(1)';
    this.playSuccessSound();
    const W = this.trajectoryOverlay.width;
    const H = this.trajectoryOverlay.height;
    const ctx = this.trajectoryCtx;
    this.trajectoryOverlay.style.opacity = '1';
    ctx.clearRect(0, 0, W, H);
    const total = trajectory.length;
    for (let i = 1; i <= total; i++) {
      const slice = trajectory.slice(Math.max(0, i - 120), i);
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';
      for (let j = 1; j < slice.length; j++) {
        const p1 = slice[j - 1].clone().project(camera);
        const p2 = slice[j].clone().project(camera);
        const x1 = (p1.x * 0.5 + 0.5) * W;
        const y1 = (-p1.y * 0.5 + 0.5) * H;
        const x2 = (p2.x * 0.5 + 0.5) * W;
        const y2 = (-p2.y * 0.5 + 0.5) * H;
        if (p1.z >= 1 || p2.z >= 1) continue;
        const t = j / slice.length;
        ctx.strokeStyle = `rgba(255, 215, 0, ${t * 0.85})`;
        ctx.lineWidth = 1 + t * 3;
        ctx.shadowColor = '#ffa500';
        ctx.shadowBlur = 10 * t;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      if (slice.length > 0) {
        const p = slice[slice.length - 1].clone().project(camera);
        const x = (p.x * 0.5 + 0.5) * W;
        const y = (-p.y * 0.5 + 0.5) * H;
        const grad = ctx.createRadialGradient(x, y, 1, x, y, 22);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.25, '#ffd700');
        grad.addColorStop(1, 'rgba(255,165,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fill();
      }
      await new Promise(r => setTimeout(r, 16));
    }
    await new Promise(r => setTimeout(r, 2200));
    const fadeStart = performance.now();
    const fadeDur = 800;
    const fade = () => {
      const t = Math.min(1, (performance.now() - fadeStart) / fadeDur);
      this.trajectoryOverlay.style.opacity = String(1 - t);
      this.successBanner.style.opacity = String(1 - t);
      if (t < 1) requestAnimationFrame(fade);
      else {
        ctx.clearRect(0, 0, W, H);
        this.successBanner.style.transform = 'translate(-50%, -50%) scale(0.5)';
      }
    };
    fade();
  }
}
