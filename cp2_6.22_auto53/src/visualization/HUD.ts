import * as THREE from 'three';
import { OrbitParams, OrbitPosition } from '../data-service/orbitCalculator';

export interface HUDData {
  distance: number;
  velocity: number;
  axialDeviation: number;
  rollAngle: number;
}

export type FrameColor = 'red' | 'yellow' | 'green';

const glassStyle = `
  background: rgba(15, 25, 50, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(120, 180, 255, 0.25);
  border-radius: 12px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.06);
`;

export class HUD {
  private container: HTMLElement;
  private hudContainer: HTMLDivElement;
  private distanceEl: HTMLElement;
  private velocityEl: HTMLElement;
  private axialEl: HTMLElement;
  private rollEl: HTMLElement;
  private dockingFrame: HTMLDivElement;
  private frameTopLeft: HTMLDivElement;
  private frameTopRight: HTMLDivElement;
  private frameBottomLeft: HTMLDivElement;
  private frameBottomRight: HTMLDivElement;
  private frameScaleLabelTL: HTMLDivElement;
  private frameScaleLabelBR: HTMLDivElement;
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

  constructor(rootContainer: HTMLElement) {
    this.container = rootContainer;
    this.hudContainer = document.createElement('div');
    Object.assign(this.hudContainer.style, {
      position: 'fixed',
      top: '0', left: '0',
      width: '100%', height: '100%',
      pointerEvents: 'none',
      zIndex: '10',
      color: '#fff',
      fontFamily: `'Consolas', 'Courier New', monospace`
    });

    const topBar = document.createElement('div');
    Object.assign(topBar.style, {
      position: 'absolute',
      top: '20px', left: '50%',
      transform: 'translateX(-50%)',
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      width: 'min(880px, 92vw)',
      pointerEvents: 'none'
    });

    const createCard = (label: string, unit: string, value: HTMLElement, color: string) => {
      const card = document.createElement('div');
      card.style.cssText = glassStyle + `
        padding: 14px 18px;
        text-align: center;
      `;
      const labelEl = document.createElement('div');
      labelEl.textContent = label;
      Object.assign(labelEl.style, {
        fontSize: '12px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: 'rgba(180,220,255,0.85)',
        marginBottom: '8px',
        textShadow: '0 0 6px rgba(120,180,255,0.4)'
      });
      const valWrap = document.createElement('div');
      Object.assign(valWrap.style, {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'center',
        gap: '6px'
      });
      value.textContent = '0.00';
      Object.assign(value.style, {
        fontSize: '28px',
        fontWeight: '700',
        color,
        textShadow: `0 0 12px ${color}88, 0 0 4px #fff`,
        letterSpacing: '1px',
        transition: 'all 0.15s'
      });
      const unitEl = document.createElement('div');
      unitEl.textContent = unit;
      Object.assign(unitEl.style, {
        fontSize: '12px',
        color: 'rgba(200,220,255,0.7)'
      });
      valWrap.appendChild(value);
      valWrap.appendChild(unitEl);
      card.appendChild(labelEl);
      card.appendChild(valWrap);
      return card;
    };

    this.distanceEl = document.createElement('div');
    this.velocityEl = document.createElement('div');
    this.axialEl = document.createElement('div');
    this.rollEl = document.createElement('div');
    topBar.appendChild(createCard('距离 DISTANCE', 'm', this.distanceEl, '#7cd8ff'));
    topBar.appendChild(createCard('相对速度 VELOCITY', 'm/s', this.velocityEl, '#ffd166'));
    topBar.appendChild(createCard('轴向偏差 DEVIATION', '°', this.axialEl, '#a9ff8a'));
    topBar.appendChild(createCard('翻滚角 ROLL', '°', this.rollEl, '#ff9cf2'));
    this.hudContainer.appendChild(topBar);

    this.dockingFrame = document.createElement('div');
    Object.assign(this.dockingFrame.style, {
      position: 'absolute',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '220px', height: '220px',
      opacity: '0',
      transition: 'opacity 0.4s'
    });

    const cornerStyle = (pos: string): React.CSSProperties => ({
      position: 'absolute',
      width: '36px',
      height: '36px',
      border: '3px solid #ff4757',
      transition: 'border-color 0.3s, box-shadow 0.3s, opacity 0.2s',
      ...(() => {
        const s: any = {};
        if (pos.includes('top')) s.top = '0'; else s.bottom = '0';
        if (pos.includes('left')) s.left = '0'; else s.right = '0';
        if (pos === 'topLeft') { s.borderRight = 'none'; s.borderBottom = 'none'; }
        if (pos === 'topRight') { s.borderLeft = 'none'; s.borderBottom = 'none'; }
        if (pos === 'bottomLeft') { s.borderRight = 'none'; s.borderTop = 'none'; }
        if (pos === 'bottomRight') { s.borderLeft = 'none'; s.borderTop = 'none'; }
        return s;
      })()
    } as unknown as string);

    const mkCorner = (pos: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight') => {
      const el = document.createElement('div');
      const s: any = {
        position: 'absolute', width: '36px', height: '36px',
        border: '3px solid #ff4757', transition: 'border-color 0.3s, box-shadow 0.3s',
        borderRadius: '3px'
      };
      if (pos === 'topLeft') { s.top = '0'; s.left = '0'; s.borderRight = 'none'; s.borderBottom = 'none'; }
      if (pos === 'topRight') { s.top = '0'; s.right = '0'; s.borderLeft = 'none'; s.borderBottom = 'none'; }
      if (pos === 'bottomLeft') { s.bottom = '0'; s.left = '0'; s.borderRight = 'none'; s.borderTop = 'none'; }
      if (pos === 'bottomRight') { s.bottom = '0'; s.right = '0'; s.borderLeft = 'none'; s.borderTop = 'none'; }
      Object.assign(el.style, s);
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

    const cornerLabelStyle = {
      position: 'absolute', fontSize: '10px', color: 'rgba(255,255,255,0.75)',
      fontFamily: 'monospace', letterSpacing: '0.5px',
      textShadow: '0 0 4px rgba(0,0,0,0.8)'
    } as const;

    this.frameScaleLabelTL = document.createElement('div');
    Object.assign(this.frameScaleLabelTL.style, cornerLabelStyle, {
      top: '-20px', left: '-4px'
    });
    this.frameScaleLabelTL.textContent = '▼ 0.0m';
    this.frameScaleLabelBR = document.createElement('div');
    Object.assign(this.frameScaleLabelBR.style, cornerLabelStyle, {
      bottom: '-20px', right: '-4px'
    });
    this.frameScaleLabelBR.textContent = '▼ 0.0m';
    this.dockingFrame.appendChild(this.frameScaleLabelTL);
    this.dockingFrame.appendChild(this.frameScaleLabelBR);

    this.guideLine = document.createElement('div');
    Object.assign(this.guideLine.style, {
      position: 'absolute',
      top: '50%', left: '50%',
      width: '2px', height: '0',
      background: 'linear-gradient(to bottom, rgba(0,255,157,0.9), rgba(0,255,157,0.1))',
      transformOrigin: 'top center',
      transition: 'height 0.2s, opacity 0.3s',
      opacity: '0',
      boxShadow: '0 0 8px rgba(0,255,157,0.8)'
    });
    this.guideArrow = document.createElement('div');
    Object.assign(this.guideArrow.style, {
      position: 'absolute',
      width: '0', height: '0',
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent',
      borderTop: '10px solid #00ff9d',
      filter: 'drop-shadow(0 0 4px #00ff9d)'
    });
    this.guideLine.appendChild(this.guideArrow);
    this.dockingFrame.appendChild(this.guideLine);
    this.hudContainer.appendChild(this.dockingFrame);

    this.warningOverlay = document.createElement('div');
    Object.assign(this.warningOverlay.style, {
      position: 'absolute',
      inset: '0',
      border: '6px solid #ff4757',
      boxShadow: 'inset 0 0 80px #ff475766, 0 0 60px #ff475744',
      opacity: '0',
      pointerEvents: 'none',
      animation: 'none',
      borderRadius: '2px'
    });
    this.hudContainer.appendChild(this.warningOverlay);

    this.orbitPanel = document.createElement('div');
    Object.assign(this.orbitPanel.style, {
      position: 'absolute',
      right: '20px', bottom: '80px',
      width: '320px',
      padding: '16px',
      ...glassStyle,
      pointerEvents: 'none'
    });
    const orbitTitle = document.createElement('div');
    orbitTitle.textContent = '◈ 轨道参数 ORBITAL DATA';
    Object.assign(orbitTitle.style, {
      fontSize: '13px',
      letterSpacing: '2px',
      color: '#8fd0ff',
      marginBottom: '12px',
      textShadow: '0 0 6px #4ac4ff88',
      fontWeight: '600'
    });
    this.orbitPanel.appendChild(orbitTitle);

    const paramTable = document.createElement('div');
    Object.assign(paramTable.style, {
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr',
      gap: '6px 10px',
      fontSize: '11px',
      marginBottom: '14px',
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
      l.style.color = 'rgba(200,220,255,0.7)';
      const v = document.createElement('div');
      v.textContent = `-- ${unit}`;
      v.style.color = '#c8e8ff';
      v.style.textAlign = 'right';
      v.style.textShadow = '0 0 4px #8fd0ff66';
      this.paramRows[key] = v;
      paramTable.appendChild(l);
      paramTable.appendChild(v);
    });
    this.orbitPanel.appendChild(paramTable);

    const canvasWrap = document.createElement('div');
    Object.assign(canvasWrap.style, {
      position: 'relative',
      width: '100%',
      aspectRatio: '1',
      background: 'radial-gradient(circle at center, rgba(30,50,100,0.6), rgba(10,15,35,0.9))',
      borderRadius: '8px',
      border: '1px solid rgba(120,180,255,0.2)',
      overflow: 'hidden'
    });
    this.orbitCanvas = document.createElement('canvas');
    this.orbitCanvas.width = 288;
    this.orbitCanvas.height = 288;
    Object.assign(this.orbitCanvas.style, {
      display: 'block',
      width: '100%',
      height: '100%'
    });
    this.orbitCtx = this.orbitCanvas.getContext('2d')!;
    canvasWrap.appendChild(this.orbitCanvas);
    const orbitLegend = document.createElement('div');
    Object.assign(orbitLegend.style, {
      position: 'absolute',
      top: '8px', left: '8px',
      fontSize: '10px',
      fontFamily: 'monospace',
      color: 'rgba(220,235,255,0.85)',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    });
    orbitLegend.innerHTML = `
      <div><span style="color:#00ff9d">●</span> 空间站</div>
      <div><span style="color:#4ac4ff">●</span> 飞船</div>
      <div style="opacity:0.6">俯视图 TOP VIEW</div>
    `;
    canvasWrap.appendChild(orbitLegend);
    this.orbitPanel.appendChild(canvasWrap);
    this.hudContainer.appendChild(this.orbitPanel);

    this.trajectoryOverlay = document.createElement('canvas');
    Object.assign(this.trajectoryOverlay.style, {
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
    Object.assign(this.successBanner.style, {
      position: 'absolute',
      top: '40%', left: '50%',
      transform: 'translate(-50%, -50%) scale(0.5)',
      fontSize: '48px',
      fontWeight: '800',
      color: '#ffd700',
      letterSpacing: '8px',
      textShadow: '0 0 20px #ffd700, 0 0 60px #ffa500, 0 0 3px #fff',
      opacity: '0',
      transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
      fontFamily: `'Segoe UI', sans-serif`,
      textAlign: 'center',
      pointerEvents: 'none'
    });
    this.successBanner.innerHTML = `
      <div>✦ 对接成功 ✦</div>
      <div style="font-size:18px;letter-spacing:4px;margin-top:10px;color:#fff;opacity:0.85;font-weight:400">DOCKING COMPLETE</div>
    `;
    this.hudContainer.appendChild(this.successBanner);

    this.helpBar = document.createElement('div');
    Object.assign(this.helpBar.style, {
      position: 'absolute',
      bottom: '16px', left: '50%',
      transform: 'translateX(-50%)',
      padding: '10px 22px',
      ...glassStyle,
      fontSize: '12px',
      fontFamily: 'monospace',
      letterSpacing: '0.5px',
      color: 'rgba(220,235,255,0.9)',
      display: 'flex',
      gap: '20px',
      pointerEvents: 'none',
      whiteSpace: 'nowrap'
    });
    this.helpBar.innerHTML = `
      <span>📷 <b style="color:#7cd8ff">WASD</b> 平移视角 · 拖拽旋转</span>
      <span>🚀 <b style="color:#ffd166">IJKL</b> 飞船平移</span>
      <span>↕ <b style="color:#a9ff8a">U/O</b> 俯仰</span>
      <span>↔ <b style="color:#ff9cf2">Y/H</b> 偏航</span>
    `;
    this.hudContainer.appendChild(this.helpBar);

    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes warnFlash {
        0%, 100% { opacity: 0; }
        50% { opacity: 0.75; }
      }
    `;
    document.head.appendChild(styleEl);

    this.container.appendChild(this.hudContainer);

    window.addEventListener('resize', () => {
      this.trajectoryOverlay.width = window.innerWidth;
      this.trajectoryOverlay.height = window.innerHeight;
    });
  }

  update(data: HUDData, camera: THREE.Camera, dockingPortWorld: THREE.Vector3): void {
    const animNum = (el: HTMLElement, val: number, decimals = 2) => {
      const cur = parseFloat(el.textContent || '0');
      const next = cur + (val - cur) * 0.25;
      el.textContent = next.toFixed(decimals);
    };
    animNum(this.distanceEl, data.distance);
    animNum(this.velocityEl, data.velocity, 3);
    animNum(this.axialEl, data.axialDeviation, 2);
    animNum(this.rollEl, data.rollAngle, 2);

    const screen = dockingPortWorld.clone().project(camera);
    const x = (screen.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screen.y * 0.5 + 0.5) * window.innerHeight;
    const inFront = screen.z < 1;
    const shouldShow = data.distance < 60 && inFront;
    this.frameVisible = shouldShow;
    this.dockingFrame.style.opacity = shouldShow ? '1' : '0';

    if (shouldShow) {
      const scale = Math.max(0.6, Math.min(1.6, 60 / (data.distance + 1)));
      const size = 220 * scale;
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
    const shadow = color === 'red' ? '#ff475766' : color === 'yellow' ? '#ffaa0066' : '#00ff9d66';
    [this.frameTopLeft, this.frameTopRight, this.frameBottomLeft, this.frameBottomRight].forEach(el => {
      (el.style as any).borderColor = hex;
      (el.style as any).boxShadow = `0 0 10px ${shadow}`;
    });
  }

  setGuideVector(dx: number, dy: number, dist: number, cam: THREE.Camera): void {
    if (!this.frameVisible) {
      this.guideLine.style.opacity = '0';
      return;
    }
    const maxLen = 140;
    const len = Math.min(maxLen, dist * 1.8);
    const angle = Math.atan2(dy, dx);
    const angleDeg = (angle * 180) / Math.PI + 90;
    this.guideLine.style.opacity = dist > 1 ? '0.9' : '0';
    this.guideLine.style.height = len + 'px';
    this.guideLine.style.transform = `translate(-50%, 0) rotate(${angleDeg}deg)`;
    this.guideArrow.style.top = (len - 8) + 'px';
    this.guideArrow.style.left = '-5px';
  }

  flashWarning(active: boolean): void {
    if (active === this.warningActive) return;
    this.warningActive = active;
    if (active) {
      (this.warningOverlay.style as any).animation = 'warnFlash 0.45s ease-in-out infinite';
    } else {
      (this.warningOverlay.style as any).animation = 'none';
      this.warningOverlay.style.opacity = '0';
    }
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
    const earthGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, R * 0.35);
    earthGrad.addColorStop(0, '#4ac4ff');
    earthGrad.addColorStop(0.5, '#1a6ebf');
    earthGrad.addColorStop(1, 'rgba(10,30,60,0)');
    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a6ebf';
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,200,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const path = this.orbitParams!.orbitPath;
    if (path.length > 0) {
      path.forEach((p, i) => {
        const px = cx + p.x * R;
        const py = cy - p.y * R;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.stroke();
    }
    if (this.orbitPos) {
      const { stationPosition: s, spacecraftPosition: c } = this.orbitPos;
      const sx = cx + s.x * R;
      const sy = cy - s.y * R;
      const stationGlow = ctx.createRadialGradient(sx, sy, 1, sx, sy, 14);
      stationGlow.addColorStop(0, '#00ff9d');
      stationGlow.addColorStop(0.5, 'rgba(0,255,157,0.5)');
      stationGlow.addColorStop(1, 'rgba(0,255,157,0)');
      ctx.fillStyle = stationGlow;
      ctx.beginPath();
      ctx.arc(sx, sy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00ff9d';
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fill();
      const cxx = cx + c.x * R;
      const cyy = cy - c.y * R;
      const craftGlow = ctx.createRadialGradient(cxx, cyy, 1, cxx, cyy, 12);
      craftGlow.addColorStop(0, '#4ac4ff');
      craftGlow.addColorStop(0.5, 'rgba(74,196,255,0.5)');
      craftGlow.addColorStop(1, 'rgba(74,196,255,0)');
      ctx.fillStyle = craftGlow;
      ctx.beginPath();
      ctx.arc(cxx, cyy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4ac4ff';
      ctx.beginPath();
      ctx.arc(cxx, cyy, 4, 0, Math.PI * 2);
      ctx.fill();
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
        ctx.shadowBlur = 8 * t;
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
        const grad = ctx.createRadialGradient(x, y, 1, x, y, 18);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.3, '#ffd700');
        grad.addColorStop(1, 'rgba(255,165,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
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
