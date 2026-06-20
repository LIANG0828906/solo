import {
  Star,
  StarFragment,
  generateStars,
  generateFragments,
  checkSnap,
  isAllFragmentsLocked,
  findStarAtPoint,
  updateFragmentAnimation,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STAR_MAP_CENTER_X,
  STAR_MAP_CENTER_Y,
} from './starMap';
import {
  NavigationState,
  getTimeFromHours,
  formatRecord,
} from './navigation';
import { StarMapRenderer, VisualEffect } from './renderer';

type AppMode = 'puzzle' | 'navigation';

class StarMapApp {
  private canvas: HTMLCanvasElement;
  private renderer: StarMapRenderer;
  private nav: NavigationState;
  private stars: Star[] = [];
  private fragments: StarFragment[] = [];
  private mode: AppMode = 'puzzle';
  private effects: VisualEffect[] = [];
  private draggingFragment: StarFragment | null = null;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private lastFrameTime: number = 0;
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private showCompleteText: boolean = false;
  private completeTextTime: number = 0;

  private resetBtn: HTMLButtonElement;
  private clearBtn: HTMLButtonElement;
  private timeSliderContainer: HTMLDivElement;
  private timeSlider: HTMLInputElement;
  private timeValue: HTMLSpanElement;
  private recordList: HTMLUListElement;

  constructor() {
    this.canvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
    if (!this.canvas) throw new Error('Canvas元素未找到');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    this.renderer = new StarMapRenderer(this.canvas);
    this.nav = new NavigationState();

    this.resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
    this.clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
    this.timeSliderContainer = document.getElementById('timeSliderContainer') as HTMLDivElement;
    this.timeSlider = document.getElementById('timeSlider') as HTMLInputElement;
    this.timeValue = document.getElementById('timeValue') as HTMLSpanElement;
    this.recordList = document.getElementById('recordList') as HTMLUListElement;

    this.init();
  }

  private init(): void {
    this.initializeData();
    this.bindEvents();
    this.lastFrameTime = performance.now();
    this.loop(this.lastFrameTime);
  }

  private initializeData(): void {
    this.stars = generateStars();
    this.fragments = generateFragments(this.stars);
    this.renderer.setAllStars(this.stars);
    this.mode = 'puzzle';
    this.effects = [];
    this.showCompleteText = false;
    this.draggingFragment = null;
    this.timeSliderContainer.classList.remove('visible');
    this.timeSlider.value = '0';
    this.timeValue.textContent = '0:00';
    this.nav.reset();
    this.updateRecordList();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.onMouseUp());

    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));

    this.resetBtn.addEventListener('click', () => this.onReset());
    this.clearBtn.addEventListener('click', () => this.onClearRecords());

    this.timeSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.onTimeChange(value);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'F2') {
        this.forceCompletePuzzle();
      } else if (e.key === 'F3') {
        this.switchToRandomStar();
      }
    });
  }

  private forceCompletePuzzle(): void {
    for (const frag of this.fragments) {
      frag.isLocked = true;
      frag.currentX = frag.correctX;
      frag.currentY = frag.correctY;
      frag.currentRotation = frag.correctRotation;
    }
    this.onPuzzleComplete();
  }

  private switchToRandomStar(): void {
    if (this.mode !== 'navigation' || this.stars.length === 0) return;
    let idx = Math.floor(Math.random() * this.stars.length);
    let tries = 0;
    while (this.stars[idx].id === this.nav.selectedStar?.id && tries < 10 && this.stars.length > 1) {
      idx = Math.floor(Math.random() * this.stars.length);
      tries++;
    }
    const star = this.stars[idx];
    const isNew = this.nav.setSelectedStar(star);
    if (isNew) {
      this.renderer.triggerStarSelectionFade(star.id);
      this.updateRecordList();
    }
  }

  private getCanvasPos(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  private findFragmentAt(x: number, y: number): StarFragment | null {
    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const f = this.fragments[i];
      if (f.isLocked || f.animation) continue;
      const dx = x - f.currentX;
      const dy = y - f.currentY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 180) return f;
    }
    return null;
  }

  private onMouseDown(e: MouseEvent): void {
    const pos = this.getCanvasPos(e.clientX, e.clientY);

    if (this.mode === 'puzzle') {
      const frag = this.findFragmentAt(pos.x, pos.y);
      if (frag) {
        this.draggingFragment = frag;
        this.dragOffsetX = pos.x - frag.currentX;
        this.dragOffsetY = pos.y - frag.currentY;
        const idx = this.fragments.indexOf(frag);
        if (idx > -1) {
          this.fragments.splice(idx, 1);
          this.fragments.push(frag);
        }
        this.canvas.style.cursor = 'grabbing';
      }
    } else if (this.mode === 'navigation') {
      const star = findStarAtPoint(this.stars, pos.x, pos.y, this.nav.currentRotation);
      if (star) {
        const isNew = this.nav.setSelectedStar(star);
        if (isNew) {
          this.renderer.triggerStarSelectionFade(star.id);
          this.updateRecordList();
        }
      }
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const pos = this.getCanvasPos(e.clientX, e.clientY);

    if (this.draggingFragment) {
      this.draggingFragment.currentX = pos.x - this.dragOffsetX;
      this.draggingFragment.currentY = pos.y - this.dragOffsetY;
    } else if (this.mode === 'puzzle') {
      const frag = this.findFragmentAt(pos.x, pos.y);
      this.canvas.style.cursor = frag ? 'grab' : 'default';
    }
  }

  private onMouseUp(e?: MouseEvent): void {
    if (!this.draggingFragment) return;

    const frag = this.draggingFragment;
    this.draggingFragment = null;
    this.canvas.style.cursor = 'default';

    const currentTime = performance.now();
    if (checkSnap(frag)) {
      frag.animation = {
        type: 'snap',
        startTime: currentTime,
        duration: 400,
        startX: frag.currentX,
        startY: frag.currentY,
        startRotation: frag.currentRotation,
        targetX: frag.correctX,
        targetY: frag.correctY,
        targetRotation: frag.correctRotation,
        startScale: 1,
        targetScale: 1.05,
      };
    } else {
      frag.animation = {
        type: 'spring',
        startTime: currentTime,
        duration: 300,
        startX: frag.currentX,
        startY: frag.currentY,
        startRotation: frag.currentRotation,
        targetX: frag.initialX,
        targetY: frag.initialY,
        targetRotation: frag.initialRotation,
        startScale: 1,
        targetScale: 1,
      };
    }

    setTimeout(() => {
      if (isAllFragmentsLocked(this.fragments) && this.mode === 'puzzle') {
        this.onPuzzleComplete();
      }
    }, 450);
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 0) return;
    const t = e.touches[0];
    const fakeEvent = { clientX: t.clientX, clientY: t.clientY } as MouseEvent;
    this.onMouseDown(fakeEvent);
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 0) return;
    const t = e.touches[0];
    const fakeEvent = { clientX: t.clientX, clientY: t.clientY } as MouseEvent;
    this.onMouseMove(fakeEvent);
  }

  private onTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    this.onMouseUp();
  }

  private onPuzzleComplete(): void {
    this.mode = 'navigation';
    this.showCompleteText = true;
    this.completeTextTime = performance.now();

    this.effects.push({
      type: 'pulse',
      startTime: performance.now(),
      duration: 1200,
      x: STAR_MAP_CENTER_X,
      y: STAR_MAP_CENTER_Y,
      color: '#FFD700',
      maxRadius: 320,
    });

    if (this.stars.length > 0) {
      this.nav.setSelectedStar(this.stars[0]);
      this.renderer.triggerStarSelectionFade(this.stars[0].id);
      this.updateRecordList();
    }

    setTimeout(() => {
      this.timeSliderContainer.classList.add('visible');
    }, 600);
  }

  private onReset(): void {
    this.effects.push({
      type: 'ripple',
      startTime: performance.now(),
      duration: 600,
      x: STAR_MAP_CENTER_X,
      y: STAR_MAP_CENTER_Y,
      color: '#8B7355',
      maxRadius: 450,
    });

    setTimeout(() => {
      this.initializeData();
    }, 300);
  }

  private onClearRecords(): void {
    this.recordList.classList.add('erasing');
    setTimeout(() => {
      this.nav.clearRecords();
      this.recordList.classList.remove('erasing');
      this.updateRecordList();
    }, 500);
  }

  private onTimeChange(hours: number): void {
    this.nav.updateTime(hours);
    this.timeValue.textContent = getTimeFromHours(hours);
  }

  private updateRecordList(): void {
    this.recordList.innerHTML = '';
    const startIdx = Math.max(0, this.nav.records.length - 20);
    const visibleRecords = this.nav.records.slice(startIdx);

    visibleRecords.forEach((rec, i) => {
      const li = document.createElement('li');
      li.className = 'record-item';
      const displayIdx = startIdx + i + 1;
      li.textContent = formatRecord(displayIdx, rec.direction, rec.targetName);
      this.recordList.appendChild(li);
    });

    this.recordList.scrollTop = this.recordList.scrollHeight;
  }

  private loop = (currentTime: number): void => {
    requestAnimationFrame(this.loop);

    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }

    this.update(currentTime);
    this.render(currentTime);
  };

  private update(currentTime: number): void {
    for (const frag of this.fragments) {
      if (frag.animation) {
        updateFragmentAnimation(frag, currentTime);
      }
    }
  }

  private render(currentTime: number): void {
    this.renderer.clear();

    if (this.mode === 'navigation') {
      this.renderer.drawStarMapBackground(this.nav.currentRotation);
      this.renderer.drawAllStarsNavMode(this.nav, currentTime);

      if (this.nav.selectedStar) {
        this.renderer.drawNavigationLine(this.nav.selectedStar, this.nav.currentRotation);
      }

      const compassX = STAR_MAP_CENTER_X + 280;
      const compassY = STAR_MAP_CENTER_Y - 200;
      this.renderer.drawCompass(
        compassX,
        compassY,
        this.nav.getCompassAngle(),
        this.nav.getCurrentDirection()
      );
    } else {
      this.renderer.drawStarMapBackground();

      for (const frag of this.fragments) {
        this.renderer.drawFragment(frag, currentTime);
      }
    }

    if (this.showCompleteText) {
      this.renderer.drawCompleteText();
    }

    this.effects = this.renderer.drawVisualEffects(this.effects, currentTime);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    new StarMapApp();
  } catch (err) {
    console.error('应用初始化失败:', err);
  }
});
