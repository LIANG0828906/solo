import { eventBus, Events } from '../utils/EventBus';
import { animationController } from '../animation/AnimationController';
import { drawEngine } from '../draw/DrawEngine';
import { PRESET_COLORS } from '../types';

class UIManager {
  private container!: HTMLElement;
  private toolbar!: HTMLElement;
  private timeline!: HTMLElement;
  private playControls!: HTMLElement;
  private draggedFrameIndex: number | null = null;
  private editModeFrameId: string | null = null;

  init(container: HTMLElement): void {
    this.container = container;
    
    this.createStyles();
    this.createToolbar();
    this.createTimeline();
    this.createPlayControls();
    
    this.setupEventListeners();
  }

  private createStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .ui-panel {
        position: absolute;
        z-index: 100;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        user-select: none;
      }
      
      .toolbar {
        left: 20px;
        top: 20px;
        width: 240px;
        background: rgba(26, 26, 46, 0.85);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      
      .toolbar-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .section-title {
        color: rgba(255, 255, 255, 0.6);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .color-palette {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }
      
      .color-swatch {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 2px solid transparent;
      }
      
      .color-swatch:hover {
        transform: scale(1.1);
      }
      
      .color-swatch.active {
        border-color: #fff;
        box-shadow: 0 0 15px currentColor;
      }
      
      .slider-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .slider-value {
        color: #fff;
        font-size: 11px;
        text-align: right;
      }
      
      input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: #4A4A6A;
        outline: none;
        cursor: pointer;
      }
      
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #6C63FF;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(108, 99, 255, 0.8);
        transition: all 0.2s ease;
      }
      
      input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 15px rgba(108, 99, 255, 1);
      }
      
      input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #6C63FF;
        cursor: pointer;
        border: none;
        box-shadow: 0 0 10px rgba(108, 99, 255, 0.8);
      }
      
      .frame-controls {
        display: flex;
        gap: 8px;
      }
      
      .btn {
        flex: 1;
        padding: 10px;
        background: #6C63FF;
        color: #fff;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      
      .btn:hover {
        filter: brightness(1.2);
      }
      
      .btn:active {
        transform: scale(0.98);
      }
      
      .btn-icon {
        font-size: 16px;
      }
      
      .timeline {
        right: 20px;
        top: 20px;
        width: 320px;
        max-height: calc(100vh - 40px);
        background: rgba(45, 45, 68, 0.9);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .timeline-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .timeline-title {
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
        font-weight: 500;
      }
      
      .btn-add-frame {
        width: 32px;
        height: 32px;
        padding: 0;
        font-size: 18px;
        flex: none;
      }
      
      .frames-container {
        display: flex;
        gap: 4px;
        overflow-x: auto;
        padding: 4px;
        scrollbar-width: thin;
        scrollbar-color: #4A4A6A transparent;
      }
      
      .frames-container::-webkit-scrollbar {
        height: 6px;
      }
      
      .frames-container::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .frames-container::-webkit-scrollbar-thumb {
        background: #4A4A6A;
        border-radius: 3px;
      }
      
      .frame-thumb {
        flex: 0 0 80px;
        height: 50px;
        border-radius: 4px;
        overflow: hidden;
        cursor: pointer;
        position: relative;
        border: 2px solid transparent;
        transition: all 0.2s ease;
        background: #1A1A2E;
      }
      
      .frame-thumb:hover {
        transform: translateY(-2px);
      }
      
      .frame-thumb.current {
        border-color: #FFD700;
        box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
      }
      
      .frame-thumb.edit-mode {
        border-color: #FF6B6B;
        box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
      }
      
      .frame-thumb.dragging {
        opacity: 0.5;
      }
      
      .frame-thumb.drag-over {
        border-color: #6C63FF;
      }
      
      .frame-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .frame-thumb-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.3);
        font-size: 10px;
      }
      
      .frame-index {
        position: absolute;
        bottom: 2px;
        left: 4px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 9px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
      }
      
      .play-controls {
        left: 20px;
        bottom: 20px;
        display: flex;
        gap: 10px;
        background: rgba(26, 26, 46, 0.85);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 12px 16px;
      }
      
      .play-btn {
        width: 44px;
        height: 44px;
        padding: 0;
        flex: none;
      }
      
      .play-btn.active {
        background: #FF6B6B;
      }
      
      .edit-controls {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .btn-delete {
        background: #FF6B6B;
      }
      
      .btn-secondary {
        background: #4A4A6A;
      }
      
      .btn-small {
        padding: 6px 12px;
        font-size: 12px;
      }
      
      .edit-hint {
        color: rgba(255, 255, 255, 0.5);
        font-size: 11px;
        margin-top: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  private createToolbar(): void {
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'ui-panel toolbar';
    
    const colorSection = document.createElement('div');
    colorSection.className = 'toolbar-section';
    colorSection.innerHTML = '<div class="section-title">光笔颜色</div>';
    
    const palette = document.createElement('div');
    palette.className = 'color-palette';
    
    PRESET_COLORS.forEach((color, index) => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch' + (index === 0 ? ' active' : '');
      swatch.style.background = color;
      swatch.style.color = color;
      swatch.dataset.color = color;
      swatch.addEventListener('click', () => this.selectColor(color));
      palette.appendChild(swatch);
    });
    
    colorSection.appendChild(palette);
    
    const thicknessSection = document.createElement('div');
    thicknessSection.className = 'toolbar-section';
    thicknessSection.innerHTML = `
      <div class="section-title">笔刷粗细</div>
      <div class="slider-container">
        <input type="range" id="thickness-slider" min="0.05" max="0.3" step="0.01" value="0.1">
        <div class="slider-value"><span id="thickness-value">0.10</span> 单位</div>
      </div>
    `;
    
    const frameSection = document.createElement('div');
    frameSection.className = 'toolbar-section';
    frameSection.innerHTML = `
      <div class="section-title">帧控制</div>
      <div class="frame-controls">
        <button class="btn" id="btn-prev-frame" title="上一帧">
          <span class="btn-icon">⏮</span>
        </button>
        <button class="btn" id="btn-play-pause" title="播放/暂停">
          <span class="btn-icon" id="play-icon">▶</span>
        </button>
        <button class="btn" id="btn-next-frame" title="下一帧">
          <span class="btn-icon">⏭</span>
        </button>
      </div>
      <div class="edit-controls" id="edit-controls" style="display: none;">
        <button class="btn btn-delete btn-small" id="btn-delete-trace">删除选中</button>
        <button class="btn btn-secondary btn-small" id="btn-exit-edit">退出编辑</button>
      </div>
      <div class="edit-hint" id="edit-hint" style="display: none;">
        点击选择光迹，拖动可移动，双击时间轴帧退出编辑
      </div>
    `;
    
    this.toolbar.appendChild(colorSection);
    this.toolbar.appendChild(thicknessSection);
    this.toolbar.appendChild(frameSection);
    this.container.appendChild(this.toolbar);
    
    const slider = thicknessSection.querySelector('#thickness-slider') as HTMLInputElement;
    slider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.selectThickness(value);
    });
  }

  private createTimeline(): void {
    this.timeline = document.createElement('div');
    this.timeline.className = 'ui-panel timeline';
    
    this.timeline.innerHTML = `
      <div class="timeline-header">
        <div class="timeline-title">光痕时间轴</div>
        <button class="btn btn-add-frame" id="btn-add-frame" title="添加空白帧">+</button>
      </div>
      <div class="frames-container" id="frames-container"></div>
    `;
    
    this.container.appendChild(this.timeline);
    
    const addBtn = this.timeline.querySelector('#btn-add-frame') as HTMLButtonElement;
    addBtn.addEventListener('click', () => {
      animationController.addEmptyFrame();
      this.updateTimelineFrames();
      animationController.goToFrame(animationController.getFrames().length - 1);
    });
  }

  private createPlayControls(): void {
    this.playControls = document.createElement('div');
    this.playControls.className = 'ui-panel play-controls';
    
    this.playControls.innerHTML = `
      <button class="btn play-btn" id="btn-loop" title="循环播放">
        <span class="btn-icon">🔁</span>
      </button>
      <button class="btn play-btn" id="btn-once" title="单次播放">
        <span class="btn-icon">▶</span>
      </button>
      <button class="btn play-btn" id="btn-export" title="导出GIF">
        <span class="btn-icon">📥</span>
      </button>
      <button class="btn play-btn" id="btn-clear" title="清空场景">
        <span class="btn-icon">🗑</span>
      </button>
    `;
    
    this.container.appendChild(this.playControls);
  }

  private setupEventListeners(): void {
    document.getElementById('btn-prev-frame')?.addEventListener('click', () => {
      if (!animationController.isPlaying()) {
        animationController.prevFrame();
      }
    });
    
    document.getElementById('btn-next-frame')?.addEventListener('click', () => {
      if (!animationController.isPlaying()) {
        animationController.nextFrame();
      }
    });
    
    document.getElementById('btn-play-pause')?.addEventListener('click', () => {
      if (animationController.isPlaying()) {
        animationController.pause();
      } else {
        animationController.play('loop');
      }
    });
    
    document.getElementById('btn-loop')?.addEventListener('click', (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      if (animationController.isPlaying()) {
        animationController.stop();
        btn.classList.remove('active');
      } else {
        animationController.play('loop');
        btn.classList.add('active');
      }
    });
    
    document.getElementById('btn-once')?.addEventListener('click', (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      if (animationController.isPlaying()) {
        animationController.stop();
        btn.classList.remove('active');
      } else {
        animationController.play('once');
        btn.classList.add('active');
      }
    });
    
    document.getElementById('btn-export')?.addEventListener('click', () => {
      alert('导出GIF功能需要额外的GIF编码库支持，此处为演示');
    });
    
    document.getElementById('btn-clear')?.addEventListener('click', () => {
      if (confirm('确定要清空所有光迹和帧吗？此操作不可撤销。')) {
        animationController.clearAll();
        this.updateTimelineFrames();
      }
    });
    
    document.getElementById('btn-delete-trace')?.addEventListener('click', () => {
      const traceId = drawEngine.getSelectedTraceId();
      if (traceId) {
        eventBus.emit(Events.TRACE_DELETED, traceId);
      }
    });
    
    document.getElementById('btn-exit-edit')?.addEventListener('click', () => {
      this.exitEditMode();
    });
    
    eventBus.on(Events.FRAME_ADDED, () => {
      this.updateTimelineFrames();
    });
    
    eventBus.on(Events.FRAME_REMOVED, () => {
      this.updateTimelineFrames();
    });
    
    eventBus.on(Events.FRAME_REORDERED, () => {
      this.updateTimelineFrames();
    });
    
    eventBus.on(Events.FRAME_CHANGED, () => {
      this.highlightCurrentFrame();
    });
    
    eventBus.on(Events.PLAY_START, () => {
      this.updatePlayState(true);
    });
    
    eventBus.on(Events.PLAY_PAUSE, () => {
      this.updatePlayState(false);
    });
    
    eventBus.on(Events.PLAY_STOP, () => {
      this.updatePlayState(false);
      document.getElementById('btn-loop')?.classList.remove('active');
      document.getElementById('btn-once')?.classList.remove('active');
    });
    
    eventBus.on(Events.DRAW_END, (trace: any) => {
      if (trace) {
        const currentFrame = animationController.getCurrentFrame();
        if (currentFrame) {
          setTimeout(() => {
            animationController.updateFrameThumbnail(currentFrame.id);
            this.updateTimelineFrames();
          }, 100);
        }
      }
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (drawEngine.isInEditMode() && drawEngine.getSelectedTraceId()) {
          eventBus.emit(Events.TRACE_DELETED, drawEngine.getSelectedTraceId());
          animationController.updateCurrentFrameThumbnail();
          this.updateTimelineFrames();
        }
      }
      if (e.key === 'Escape') {
        if (drawEngine.isInEditMode()) {
          this.exitEditMode();
        }
      }
    });
  }

  private selectColor(color: string): void {
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      const htmlSwatch = swatch as HTMLElement;
      htmlSwatch.classList.toggle('active', htmlSwatch.dataset.color === color);
    });
    
    eventBus.emit(Events.COLOR_CHANGED, color);
  }

  private selectThickness(thickness: number): void {
    const valueEl = document.getElementById('thickness-value');
    if (valueEl) {
      valueEl.textContent = thickness.toFixed(2);
    }
    
    eventBus.emit(Events.THICKNESS_CHANGED, thickness);
  }

  updateTimelineFrames(): void {
    const container = document.getElementById('frames-container');
    if (!container) return;
    
    const frames = animationController.getFrames();
    container.innerHTML = '';
    
    frames.forEach((frame, index) => {
      const thumb = document.createElement('div');
      thumb.className = 'frame-thumb';
      thumb.dataset.index = String(index);
      thumb.draggable = true;
      
      if (index === animationController.getCurrentFrameIndex()) {
        thumb.classList.add('current');
      }
      
      if (this.editModeFrameId === frame.id) {
        thumb.classList.add('edit-mode');
      }
      
      if (frame.thumbnail) {
        const img = document.createElement('img');
        img.src = frame.thumbnail;
        thumb.appendChild(img);
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'frame-thumb-placeholder';
        placeholder.textContent = `帧 ${index + 1}`;
        thumb.appendChild(placeholder);
      }
      
      const frameIndex = document.createElement('div');
      frameIndex.className = 'frame-index';
      frameIndex.textContent = String(index + 1);
      thumb.appendChild(frameIndex);
      
      thumb.addEventListener('click', () => {
        if (!animationController.isPlaying()) {
          animationController.goToFrame(index);
        }
      });
      
      thumb.addEventListener('dblclick', () => {
        if (!animationController.isPlaying()) {
          if (this.editModeFrameId === frame.id) {
            this.exitEditMode();
          } else {
            this.enterEditMode(frame.id);
          }
        }
      });
      
      thumb.addEventListener('dragstart', (e) => {
        this.draggedFrameIndex = index;
        thumb.classList.add('dragging');
        e.dataTransfer!.effectAllowed = 'move';
      });
      
      thumb.addEventListener('dragend', () => {
        thumb.classList.remove('dragging');
        this.draggedFrameIndex = null;
        document.querySelectorAll('.frame-thumb').forEach(t => {
          t.classList.remove('drag-over');
        });
      });
      
      thumb.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'move';
        thumb.classList.add('drag-over');
      });
      
      thumb.addEventListener('dragleave', () => {
        thumb.classList.remove('drag-over');
      });
      
      thumb.addEventListener('drop', (e) => {
        e.preventDefault();
        thumb.classList.remove('drag-over');
        
        if (this.draggedFrameIndex !== null && this.draggedFrameIndex !== index) {
          animationController.reorderFrames(this.draggedFrameIndex, index);
        }
      });
      
      container.appendChild(thumb);
    });
    
    this.scrollToCurrentFrame();
  }

  private scrollToCurrentFrame(): void {
    const container = document.getElementById('frames-container');
    const currentFrame = container?.querySelector('.frame-thumb.current');
    if (currentFrame) {
      currentFrame.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  highlightCurrentFrame(): void {
    const currentIndex = animationController.getCurrentFrameIndex();
    document.querySelectorAll('.frame-thumb').forEach((thumb, index) => {
      thumb.classList.toggle('current', index === currentIndex);
    });
  }

  updatePlayState(isPlaying: boolean): void {
    const playIcon = document.getElementById('play-icon');
    if (playIcon) {
      playIcon.textContent = isPlaying ? '⏸' : '▶';
    }
  }

  private enterEditMode(frameId: string): void {
    this.editModeFrameId = frameId;
    eventBus.emit(Events.EDIT_MODE_ENTER, frameId);
    
    const editControls = document.getElementById('edit-controls');
    const editHint = document.getElementById('edit-hint');
    if (editControls) editControls.style.display = 'flex';
    if (editHint) editHint.style.display = 'block';
    
    this.updateTimelineFrames();
  }

  private exitEditMode(): void {
    this.editModeFrameId = null;
    eventBus.emit(Events.EDIT_MODE_EXIT);
    
    const editControls = document.getElementById('edit-controls');
    const editHint = document.getElementById('edit-hint');
    if (editControls) editControls.style.display = 'none';
    if (editHint) editHint.style.display = 'none';
    
    animationController.updateCurrentFrameThumbnail();
    this.updateTimelineFrames();
  }
}

export const uiManager = new UIManager();
