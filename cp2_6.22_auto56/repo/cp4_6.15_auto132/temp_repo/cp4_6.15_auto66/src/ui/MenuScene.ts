import { SONGS } from '../types';
import type { ISongConfig } from '../types';

interface VinylShard {
  element: Element;
  vx: number;
  vy: number;
  vr: number;
  x: number;
  y: number;
  rotation: number;
}

export class MenuScene {
  private container: HTMLElement;
  private onStart: (songId: string, difficulty: 'normal' | 'hard') => void;
  private vinylAngle: number = 0;
  private rotationSpeed: number = 2.13;
  private isTransitioning: boolean = false;
  private loadingProgress: number = 0;
  private selectedSong: ISongConfig = SONGS[0];
  private difficulty: 'normal' | 'hard' = 'normal';

  private vinylEl: SVGSVGElement | null = null;
  private progressBar: HTMLElement | null = null;
  private startBtn: HTMLElement | null = null;
  private animationFrameId: number = 0;
  private shards: VinylShard[] = [];

  constructor(container: HTMLElement, onStart: (songId: string, difficulty: 'normal' | 'hard') => void) {
    this.container = container;
    this.onStart = onStart;
    this.rotationSpeed = (this.selectedSong.bpm / 60) * 3;
    this.render();
    this.startAnimationLoop();
  }

  private render(): void {
    this.container.innerHTML = '';
    this.shards = [];

    const wrapper = document.createElement('div');
    wrapper.id = 'menu-wrapper';
    wrapper.style.cssText = `
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      width: 100%; height: 100%; position: relative;
    `;

    const title = document.createElement('h1');
    title.textContent = 'RHYTHM RUNNER';
    title.style.cssText = `
      font-family: 'Orbitron', monospace; font-size: clamp(28px, 5vw, 56px); font-weight: 900;
      color: #bf40ff; text-shadow: 0 0 20px #bf40ff, 0 0 40px #bf40ff55, 0 0 80px #bf40ff33;
      margin-bottom: 8px; letter-spacing: 4px; text-align: center;
    `;
    wrapper.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.textContent = '节奏跑酷';
    subtitle.style.cssText = `
      font-family: 'Orbitron', monospace; font-size: clamp(12px, 2vw, 18px);
      color: #00e5ff; text-shadow: 0 0 10px #00e5ff88; margin-bottom: 40px; letter-spacing: 6px;
    `;
    wrapper.appendChild(subtitle);

    const vinylContainer = document.createElement('div');
    vinylContainer.id = 'vinyl-container';
    vinylContainer.style.cssText = `
      position: relative; width: clamp(200px, 30vw, 300px); height: clamp(200px, 30vw, 300px); margin-bottom: 30px;
      transform-style: preserve-3d; perspective: 1000px;
    `;

    this.vinylEl = this.createVinylSVG();
    vinylContainer.appendChild(this.vinylEl);

    const cover = document.createElement('div');
    cover.id = 'song-cover';
    cover.style.cssText = `
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 40%; height: 40%; border-radius: 50%;
      background: radial-gradient(circle, ${this.selectedSong.color}44, ${this.selectedSong.color}22);
      border: 2px solid ${this.selectedSong.color}; display: flex;
      align-items: center; justify-content: center; font-family: 'Orbitron', monospace;
      font-size: 10px; color: ${this.selectedSong.color}; text-align: center; padding: 8px;
      box-shadow: 0 0 15px ${this.selectedSong.color}66; z-index: 2;
    `;
    cover.innerHTML = this.selectedSong.title;
    vinylContainer.appendChild(cover);

    wrapper.appendChild(vinylContainer);

    const bpmInfo = document.createElement('div');
    bpmInfo.style.cssText = `
      font-family: 'Orbitron', monospace; font-size: 10px; color: #ffffff44;
      margin-bottom: 18px; letter-spacing: 2px;
    `;
    bpmInfo.textContent = `${this.selectedSong.artist.toUpperCase()}  •  ${this.selectedSong.bpm} BPM  •  ${this.selectedSong.style.toUpperCase()}`;
    wrapper.appendChild(bpmInfo);

    const songSelector = document.createElement('div');
    songSelector.style.cssText = `
      display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; justify-content: center;
    `;

    for (const song of SONGS) {
      const btn = document.createElement('button');
      btn.textContent = song.title;
      btn.dataset.songId = song.id;
      btn.style.cssText = `
        font-family: 'Orbitron', monospace; font-size: 12px; padding: 8px 16px;
        background: ${song.id === this.selectedSong.id ? song.color + '33' : '#1a1a2e'};
        border: 1px solid ${song.color}; color: ${song.color}; cursor: pointer;
        transition: all 0.3s; text-shadow: 0 0 5px ${song.color}88;
        ${song.id === this.selectedSong.id ? `box-shadow: 0 0 15px ${song.color}44;` : ''}
      `;
      btn.addEventListener('mouseenter', () => {
        btn.style.boxShadow = `0 0 20px ${song.color}66`;
        btn.style.background = song.color + '44';
      });
      btn.addEventListener('mouseleave', () => {
        if (song.id !== this.selectedSong.id) {
          btn.style.boxShadow = 'none';
          btn.style.background = '#1a1a2e';
        }
      });
      btn.addEventListener('click', () => {
        this.selectedSong = song;
        this.rotationSpeed = (song.bpm / 60) * 3;
        this.render();
      });
      songSelector.appendChild(btn);
    }
    wrapper.appendChild(songSelector);

    const difficultyRow = document.createElement('div');
    difficultyRow.style.cssText = `display: flex; gap: 12px; margin-bottom: 30px;`;

    const diffBtnStyle = (active: boolean, color: string) => `
      font-family: 'Orbitron', monospace; font-size: 11px; padding: 6px 18px;
      background: ${active ? color + '33' : '#1a1a2e'};
      border: 1px solid ${color}; color: ${color}; cursor: pointer;
      text-shadow: 0 0 5px ${color}88; transition: all 0.3s;
      ${active ? `box-shadow: 0 0 10px ${color}44;` : ''}
    `;

    const normalBtn = document.createElement('button');
    normalBtn.textContent = 'NORMAL';
    normalBtn.style.cssText = diffBtnStyle(true, '#00e5ff');
    const hardBtn = document.createElement('button');
    hardBtn.textContent = 'HARD';
    hardBtn.style.cssText = diffBtnStyle(this.difficulty === 'hard', '#ff4081');

    normalBtn.addEventListener('click', () => {
      this.difficulty = 'normal';
      normalBtn.style.cssText = diffBtnStyle(true, '#00e5ff');
      hardBtn.style.cssText = diffBtnStyle(false, '#ff4081');
    });
    hardBtn.addEventListener('click', () => {
      this.difficulty = 'hard';
      hardBtn.style.cssText = diffBtnStyle(true, '#ff4081');
      normalBtn.style.cssText = diffBtnStyle(false, '#00e5ff');
    });

    difficultyRow.appendChild(normalBtn);
    difficultyRow.appendChild(hardBtn);
    wrapper.appendChild(difficultyRow);

    const progressContainer = document.createElement('div');
    progressContainer.id = 'progress-container';
    progressContainer.style.cssText = `
      width: clamp(250px, 40vw, 400px); height: 6px; background: #1a1a2e;
      border-radius: 3px; margin-bottom: 20px; overflow: hidden; opacity: 0; transition: opacity 0.3s;
    `;

    this.progressBar = document.createElement('div');
    this.progressBar.style.cssText = `
      width: 0%; height: 100%;
      background: linear-gradient(90deg, #bf40ff, #00e5ff);
      border-radius: 3px; transition: width 0.3s;
    `;
    progressContainer.appendChild(this.progressBar);
    wrapper.appendChild(progressContainer);

    this.startBtn = document.createElement('button');
    this.startBtn.textContent = '开始挑战';
    this.startBtn.style.cssText = `
      font-family: 'Orbitron', monospace; font-size: clamp(14px, 2vw, 20px); font-weight: 700;
      padding: 14px 40px; background: transparent;
      border: 2px solid #bf40ff; color: #bf40ff; cursor: pointer;
      text-shadow: 0 0 10px #bf40ff88, 0 0 20px #bf40ff44;
      box-shadow: 0 0 15px #bf40ff33, inset 0 0 15px #bf40ff11;
      transition: all 0.3s; letter-spacing: 3px; position: relative; overflow: hidden;
    `;
    this.startBtn.addEventListener('mouseenter', () => {
      if (this.startBtn) {
        this.startBtn.style.boxShadow = '0 0 30px #bf40ff66, inset 0 0 30px #bf40ff22';
        this.startBtn.style.background = '#bf40ff11';
      }
    });
    this.startBtn.addEventListener('mouseleave', () => {
      if (this.startBtn) {
        this.startBtn.style.boxShadow = '0 0 15px #bf40ff33, inset 0 0 15px #bf40ff11';
        this.startBtn.style.background = 'transparent';
      }
    });
    this.startBtn.addEventListener('click', () => this.handleStart());
    wrapper.appendChild(this.startBtn);

    const controls = document.createElement('div');
    controls.style.cssText = `
      position: absolute; bottom: 30px; font-family: 'Orbitron', monospace; font-size: 10px;
      color: #555; text-align: center; line-height: 1.8; letter-spacing: 1px;
    `;
    controls.innerHTML = 'A/D or ←/→ : MOVE &nbsp;|&nbsp; SPACE : JUMP &nbsp;|&nbsp; S or ↓ : SLIDE';
    wrapper.appendChild(controls);

    this.container.appendChild(wrapper);
  }

  private createVinylSVG(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.setAttribute('id', 'vinyl-svg');
    svg.style.cssText = 'width: 100%; height: 100%; transform-origin: 50% 50%;';

    svg.innerHTML = `
      <defs>
        <radialGradient id="vinylGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1a1a2e"/>
          <stop offset="30%" stop-color="#111122"/>
          <stop offset="100%" stop-color="#0a0a0f"/>
        </radialGradient>
        <filter id="vinylGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="100" cy="100" r="95" fill="url(#vinylGrad)" stroke="${this.selectedSong.color}55" stroke-width="1" filter="url(#vinylGlow)"/>
      ${this.generateGrooves()}
      <circle cx="100" cy="100" r="22" fill="#1a0a2e" stroke="${this.selectedSong.color}44" stroke-width="1"/>
      <circle cx="100" cy="100" r="3.5" fill="${this.selectedSong.color}" filter="url(#vinylGlow)"/>
    `;
    return svg;
  }

  private generateGrooves(): string {
    let grooves = '';
    for (let r = 28; r < 92; r += 3.5) {
      const opacity = (0.04 + Math.random() * 0.07).toFixed(2);
      grooves += `<circle cx="100" cy="100" r="${r}" fill="none" stroke="#ffffff" stroke-width="0.3" opacity="${opacity}"/>`;
    }
    for (let i = 0; i < 8; i++) {
      const angle = (i * 45 + Math.random() * 25) * (Math.PI / 180);
      const r1 = 28, r2 = 92;
      grooves += `<line x1="${100 + Math.cos(angle) * r1}" y1="${100 + Math.sin(angle) * r1}" x2="${100 + Math.cos(angle) * r2}" y2="${100 + Math.sin(angle) * r2}" stroke="#ffffff05" stroke-width="0.25"/>`;
    }
    return grooves;
  }

  private startAnimationLoop(): void {
    const tick = () => {
      if (!this.isTransitioning && this.vinylEl) {
        this.vinylAngle += this.rotationSpeed;
        this.vinylEl.style.transform = `rotate(${this.vinylAngle}deg)`;
      }

      if (this.shards.length > 0) {
        for (const s of this.shards) {
          s.vy += 0.15;
          s.x += s.vx;
          s.y += s.vy;
          s.rotation += s.vr;
          s.element.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.rotation}deg)`;
          const curOp = parseFloat((s.element as HTMLElement | SVGElement).style.opacity || '1');
          (s.element as HTMLElement | SVGElement).style.opacity = String(Math.max(0, curOp - 0.008));
        }
        this.shards = this.shards.filter(s => parseFloat((s.element as HTMLElement | SVGElement).style.opacity || '0') > 0);
      }

      this.animationFrameId = requestAnimationFrame(tick);
    };
    tick();
  }

  private async handleStart(): Promise<void> {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const progressContainer = document.getElementById('progress-container') as HTMLElement;
    if (progressContainer) progressContainer.style.opacity = '1';

    this.loadingProgress = 0;
    await new Promise<void>(resolve => {
      const loadInterval = setInterval(() => {
        this.loadingProgress = Math.min(100, this.loadingProgress + Math.random() * 18 + 6);
        if (this.progressBar) this.progressBar.style.width = this.loadingProgress + '%';
        if (this.loadingProgress >= 100) {
          clearInterval(loadInterval);
          resolve();
        }
      }, 100);
    });

    this.shatterVinyl();
  }

  private shatterVinyl(): void {
    const vinylContainer = document.getElementById('vinyl-container') as HTMLElement;
    const vinylSvg = document.getElementById('vinyl-svg') as unknown as SVGSVGElement;
    const songCover = document.getElementById('song-cover') as HTMLElement;
    if (!vinylContainer || !vinylSvg) {
      this.fadeOutAndStart();
      return;
    }

    const rect = vinylSvg.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) / 2;
    const containerRect = vinylContainer.getBoundingClientRect();

    if (songCover) songCover.style.display = 'none';

    const shardCount = 18;
    const colors = [this.selectedSong.color, '#bf40ff', '#00e5ff', '#ff4081'];

    for (let i = 0; i < shardCount; i++) {
      const angle1 = (i / shardCount) * Math.PI * 2;
      const angle2 = ((i + 1) / shardCount) * Math.PI * 2 + 0.05;

      const innerR = radius * (0.22 + Math.random() * 0.1);
      const outerR = radius * (0.92 + Math.random() * 0.05);

      const p1x = cx + Math.cos(angle1) * innerR;
      const p1y = cy + Math.sin(angle1) * innerR;
      const p2x = cx + Math.cos(angle1) * outerR;
      const p2y = cy + Math.sin(angle1) * outerR;
      const p3x = cx + Math.cos(angle2) * outerR;
      const p3y = cy + Math.sin(angle2) * outerR;
      const p4x = cx + Math.cos(angle2) * innerR;
      const p4y = cy + Math.sin(angle2) * innerR;

      const shard = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      shard.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
      shard.style.cssText = `
        position: absolute;
        top: 0; left: 0;
        width: ${rect.width}px; height: ${rect.height}px;
        pointer-events: none;
        opacity: 1;
        overflow: visible;
      `;

      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('points', `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}`);
      poly.setAttribute('fill', `rgba(15, 15, 30, 0.95)`);
      poly.setAttribute('stroke', colors[i % colors.length]);
      poly.setAttribute('stroke-width', '1');
      poly.setAttribute('stroke-opacity', '0.6');
      shard.appendChild(poly);

      const centroidAngle = (angle1 + angle2) / 2;
      const dirX = Math.cos(centroidAngle);
      const dirY = Math.sin(centroidAngle);

      const distance = 2 + Math.random() * 3;
      const vx = dirX * distance + (Math.random() - 0.5) * 2;
      const vy = dirY * distance - Math.random() * 4 - 2;
      const vr = (Math.random() - 0.5) * 18;

      vinylContainer.appendChild(shard);

      this.shards.push({
        element: shard,
        vx, vy, vr,
        x: 0, y: 0,
        rotation: 0,
      });
    }

    vinylSvg.style.display = 'none';

    setTimeout(() => {
      this.fadeOutAndStart();
    }, 600);
  }

  private fadeOutAndStart(): void {
    const wrapper = document.getElementById('menu-wrapper') as HTMLElement;
    if (wrapper) {
      wrapper.style.transition = 'opacity 0.7s ease-out, transform 0.7s ease-out';
      wrapper.style.opacity = '0';
      wrapper.style.transform = 'scale(1.05)';
    }

    setTimeout(() => {
      this.onStart(this.selectedSong.id, this.difficulty);
      this.hide();
    }, 700);
  }

  hide(): void {
    this.container.classList.add('hidden');
  }

  show(): void {
    this.container.classList.remove('hidden');
    this.container.style.opacity = '1';
    this.isTransitioning = false;
    this.loadingProgress = 0;
    cancelAnimationFrame(this.animationFrameId);
    for (const s of this.shards) {
      s.element.remove();
    }
    this.shards = [];
    this.render();
  }
}
