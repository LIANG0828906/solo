import { SONGS } from '../types';
import type { ISongConfig } from '../types';

export class MenuScene {
  private container: HTMLElement;
  private onStart: (songId: string, difficulty: 'normal' | 'hard') => void;
  private vinylAngle: number = 0;
  private rotationSpeed: number = 1;
  private isTransitioning: boolean = false;
  private loadingProgress: number = 0;
  private selectedSong: ISongConfig = SONGS[0];

  private vinylEl: SVGSVGElement | null = null;
  private progressBar: HTMLElement | null = null;
  private startBtn: HTMLElement | null = null;

  constructor(container: HTMLElement, onStart: (songId: string, difficulty: 'normal' | 'hard') => void) {
    this.container = container;
    this.onStart = onStart;
    this.render();
    this.animate();
  }

  private render(): void {
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
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
    vinylContainer.style.cssText = `
      position: relative; width: clamp(200px, 30vw, 300px); height: clamp(200px, 30vw, 300px); margin-bottom: 30px;
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
      box-shadow: 0 0 15px ${this.selectedSong.color}66;
    `;
    cover.innerHTML = this.selectedSong.title;
    vinylContainer.appendChild(cover);

    wrapper.appendChild(vinylContainer);

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
        this.rotationSpeed = song.bpm / 60;
        this.updateSongUI();
        this.render();
      });
      songSelector.appendChild(btn);
    }
    wrapper.appendChild(songSelector);

    const difficultyRow = document.createElement('div');
    difficultyRow.style.cssText = `
      display: flex; gap: 12px; margin-bottom: 30px;
    `;

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
    normalBtn.addEventListener('click', () => {
      this.difficulty = 'normal';
      normalBtn.style.cssText = diffBtnStyle(true, '#00e5ff');
      hardBtn.style.cssText = diffBtnStyle(false, '#ff4081');
    });

    const hardBtn = document.createElement('button');
    hardBtn.textContent = 'HARD';
    hardBtn.style.cssText = diffBtnStyle(false, '#ff4081');
    hardBtn.addEventListener('click', () => {
      this.difficulty = 'hard';
      hardBtn.style.cssText = diffBtnStyle(true, '#ff4081');
      normalBtn.style.cssText = diffBtnStyle(false, '#00e5ff');
    });

    difficultyRow.appendChild(normalBtn);
    difficultyRow.appendChild(hardBtn);
    wrapper.appendChild(difficultyRow);

    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: clamp(250px, 40vw, 400px); height: 6px; background: #1a1a2e;
      border-radius: 3px; margin-bottom: 20px; overflow: hidden; opacity: 0; transition: opacity 0.3s;
    `;
    progressContainer.id = 'progress-container';

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
    this.startBtn.addEventListener('click', () => {
      this.handleStart();
    });
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

  private difficulty: 'normal' | 'hard' = 'normal';

  private createVinylSVG(): SVGSVGElement {
    const size = '100%';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.style.cssText = `width: ${size}; height: ${size};`;

    svg.innerHTML = `
      <defs>
        <radialGradient id="vinylGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1a1a2e"/>
          <stop offset="30%" stop-color="#111122"/>
          <stop offset="100%" stop-color="#0a0a0f"/>
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="100" cy="100" r="95" fill="url(#vinylGrad)" stroke="#bf40ff33" stroke-width="1"/>
      <circle cx="100" cy="100" r="75" fill="none" stroke="#ffffff08" stroke-width="0.5"/>
      <circle cx="100" cy="100" r="55" fill="none" stroke="#ffffff08" stroke-width="0.5"/>
      <circle cx="100" cy="100" r="35" fill="none" stroke="#ffffff08" stroke-width="0.5"/>
      <circle cx="100" cy="100" r="20" fill="#1a0a2e" stroke="#bf40ff44" stroke-width="1" filter="url(#glow)"/>
      <circle cx="100" cy="100" r="3" fill="#bf40ff" filter="url(#glow)"/>
      ${this.generateGrooves()}
    `;

    return svg;
  }

  private generateGrooves(): string {
    let grooves = '';
    for (let r = 25; r < 90; r += 4) {
      const opacity = (0.05 + Math.random() * 0.08).toFixed(2);
      grooves += `<circle cx="100" cy="100" r="${r}" fill="none" stroke="#ffffff" stroke-width="0.3" opacity="${opacity}"/>`;
    }

    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 + Math.random() * 30) * (Math.PI / 180);
      const x1 = 100 + Math.cos(angle) * 25;
      const y1 = 100 + Math.sin(angle) * 25;
      const x2 = 100 + Math.cos(angle) * 90;
      const y2 = 100 + Math.sin(angle) * 90;
      grooves += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffffff06" stroke-width="0.3"/>`;
    }

    return grooves;
  }

  private updateSongUI(): void {
    const cover = document.getElementById('song-cover');
    if (cover) {
      cover.style.background = `radial-gradient(circle, ${this.selectedSong.color}44, ${this.selectedSong.color}22)`;
      cover.style.borderColor = this.selectedSong.color;
      cover.style.color = this.selectedSong.color;
      cover.style.boxShadow = `0 0 15px ${this.selectedSong.color}66`;
      cover.innerHTML = this.selectedSong.title;
    }
  }

  private async handleStart(): Promise<void> {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const progressContainer = document.getElementById('progress-container');
    if (progressContainer) {
      progressContainer.style.opacity = '1';
    }

    this.loadingProgress = 0;
    const loadInterval = setInterval(() => {
      this.loadingProgress = Math.min(100, this.loadingProgress + Math.random() * 15 + 5);
      if (this.progressBar) {
        this.progressBar.style.width = this.loadingProgress + '%';
      }
      if (this.loadingProgress >= 100) {
        clearInterval(loadInterval);
        this.transitionToGame();
      }
    }, 100);
  }

  private transitionToGame(): void {
    const vinylContainer = this.vinylEl?.parentElement;
    if (!vinylContainer) {
      this.onStart(this.selectedSong.id, this.difficulty);
      this.hide();
      return;
    }

    vinylContainer.style.transition = 'transform 0.5s ease-in, opacity 0.5s ease-in';
    vinylContainer.style.transform = 'scale(1.5) rotate(720deg)';
    vinylContainer.style.opacity = '0';

    this.container.style.transition = 'opacity 0.8s ease-out';
    setTimeout(() => {
      this.container.style.opacity = '0';
      setTimeout(() => {
        this.onStart(this.selectedSong.id, this.difficulty);
        this.hide();
      }, 800);
    }, 500);
  }

  private animate(): void {
    const tick = () => {
      if (!this.isTransitioning && this.vinylEl) {
        this.vinylAngle += this.rotationSpeed;
        this.vinylEl.style.transform = `rotate(${this.vinylAngle}deg)`;
      }
      requestAnimationFrame(tick);
    };
    tick();
  }

  hide(): void {
    this.container.classList.add('hidden');
  }

  show(): void {
    this.container.classList.remove('hidden');
    this.container.style.opacity = '1';
    this.isTransitioning = false;
    this.loadingProgress = 0;
    this.render();
  }
}
