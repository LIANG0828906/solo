import { PoseEditor } from './pose-editor.js';
import { AnimationPlayer } from './animation-player.js';
import { buildAnimationFrames } from './interpolator.js';
import { GifExporter } from './gif-exporter.js';
import { Pose, Frame, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './types.js';

class App {
  private poseEditor: PoseEditor;
  private animationPlayer: AnimationPlayer;
  private poses: Pose[] = [];
  private frames: Frame[] = [];
  private currentPoseIndex: number = -1;
  private isEditingPose: boolean = false;
  private editingPoseIndex: number = -1;
  private dragFrameIndex: number = -1;
  private dragStartX: number = 0;
  private dragIndicator: HTMLDivElement | null = null;

  private poseCanvas: HTMLCanvasElement;
  private animCanvas: HTMLCanvasElement;
  private timelineContainer: HTMLDivElement;
  private timelineFrames: HTMLDivElement;
  private undoBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private addPoseBtn: HTMLButtonElement;
  private generateBtn: HTMLButtonElement;
  private playPauseBtn: HTMLButtonElement;
  private exportBtn: HTMLButtonElement;
  private poseCounter: HTMLDivElement;
  private editorStatus: HTMLDivElement;
  private animStatus: HTMLDivElement;
  private progressContainer: HTMLDivElement;
  private progressBar: HTMLDivElement;
  private progressText: HTMLSpanElement;

  constructor() {
    this.poseCanvas = document.getElementById('poseCanvas') as HTMLCanvasElement;
    this.animCanvas = document.getElementById('animCanvas') as HTMLCanvasElement;
    this.timelineContainer = document.getElementById('timelineContainer') as HTMLDivElement;
    this.timelineFrames = document.getElementById('timelineFrames') as HTMLDivElement;
    this.undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
    this.resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
    this.addPoseBtn = document.getElementById('addPoseBtn') as HTMLButtonElement;
    this.generateBtn = document.getElementById('generateBtn') as HTMLButtonElement;
    this.playPauseBtn = document.getElementById('playPauseBtn') as HTMLButtonElement;
    this.exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
    this.poseCounter = document.getElementById('poseCounter') as HTMLDivElement;
    this.editorStatus = document.getElementById('editorStatus') as HTMLDivElement;
    this.animStatus = document.getElementById('animStatus') as HTMLDivElement;
    this.progressContainer = document.getElementById('progressContainer') as HTMLDivElement;
    this.progressBar = document.getElementById('progressBar') as HTMLDivElement;
    this.progressText = document.getElementById('progressText') as HTMLSpanElement;

    this.poseEditor = new PoseEditor(this.poseCanvas);
    this.animationPlayer = new AnimationPlayer(this.animCanvas);

    this.bindEvents();
    this.updateUI();
    this.updateTimeline();
  }

  private bindEvents(): void {
    this.poseEditor.setOnChange(() => {
      this.updateEditorStatus();
      this.updateUndoButton();
    });

    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const color = target.dataset.color!;
        this.setColor(color);
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        target.classList.add('active');
      });
    });

    this.undoBtn.addEventListener('click', () => {
      this.poseEditor.undo();
    });

    this.resetBtn.addEventListener('click', () => {
      this.poseEditor.reset();
    });

    this.addPoseBtn.addEventListener('click', () => {
      this.addCurrentPose();
    });

    this.generateBtn.addEventListener('click', () => {
      this.generateAnimation();
    });

    this.playPauseBtn.addEventListener('click', () => {
      const isPlaying = this.animationPlayer.toggle();
      this.playPauseBtn.textContent = isPlaying ? '暂停' : '播放';
    });

    this.exportBtn.addEventListener('click', () => {
      this.exportGif();
    });

    this.timelineContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.timelineContainer.scrollLeft += e.deltaY;
    }, { passive: false });
  }

  private setColor(color: string): void {
    this.poseEditor.setColor(color);
  }

  private addCurrentPose(): void {
    const pose = this.poseEditor.getPose();
    if (pose.joints.length < 6) {
      alert('请至少添加6个关节点（头、肩、肘、腕、髋、膝）');
      return;
    }

    if (this.poses.length >= 4) {
      alert('最多只能添加4个关键姿势');
      return;
    }

    if (this.isEditingPose) {
      this.poses[this.editingPoseIndex] = pose;
      this.isEditingPose = false;
      this.editingPoseIndex = -1;
      this.addPoseBtn.textContent = '添加姿势';
      this.editorStatus.textContent = '姿势已更新，点击"生成动画"查看效果';
    } else {
      this.poses.push(pose);
      this.editorStatus.textContent = `已添加姿势 ${this.poses.length}/4`;
    }

    this.poseEditor.reset();
    this.updatePoseCounter();
    this.updateGenerateButton();
    this.updateTimeline();
  }

  private generateAnimation(): void {
    if (this.poses.length < 2) {
      alert('请至少添加2个关键姿势');
      return;
    }

    const startTime = performance.now();

    this.frames = buildAnimationFrames(this.poses);

    const endTime = performance.now();
    const duration = endTime - startTime;

    const jointCount = this.poses[0].joints.length;
    const color = this.poses[0].color;
    this.animationPlayer.setFrames(this.frames, jointCount, color);
    this.animationPlayer.play();
    this.playPauseBtn.textContent = '暂停';

    this.animStatus.textContent = `动画生成完成，共 ${this.frames.length} 帧 (${duration.toFixed(1)}ms)`;
    this.updateTimeline();
    this.updateExportButton();
  }

  private exportGif(): void {
    if (this.frames.length === 0) {
      alert('请先生成动画');
      return;
    }

    this.progressContainer.classList.add('active');
    this.progressText.classList.add('active');
    this.exportBtn.disabled = true;

    const bones: { from: number; to: number }[] = [];
    const jointCount = this.poses[0].joints.length;
    for (let i = 0; i < jointCount - 1; i++) {
      bones.push({ from: i, to: i + 1 });
    }

    GifExporter.export({
      frames: this.frames,
      bones,
      color: this.poses[0].color,
      onProgress: (progress: number) => {
        this.progressBar.style.width = `${progress}%`;
        this.progressText.textContent = `${progress}%`;
      },
      onComplete: (blob: Blob) => {
        GifExporter.downloadBlob(blob, 'skeleton-animation.gif');
        this.progressBar.style.width = '100%';
        this.progressText.textContent = '完成!';
        setTimeout(() => {
          this.progressContainer.classList.remove('active');
          this.progressText.classList.remove('active');
          this.progressBar.style.width = '0%';
          this.progressText.textContent = '0%';
          this.exportBtn.disabled = false;
        }, 1500);
      },
      onError: (err: Error) => {
        console.error('GIF导出失败:', err);
        alert('GIF导出失败: ' + err.message);
        this.progressContainer.classList.remove('active');
        this.progressText.classList.remove('active');
        this.exportBtn.disabled = false;
      }
    });
  }

  private updatePoseCounter(): void {
    this.poseCounter.innerHTML = '';
    for (let i = 0; i < this.poses.length; i++) {
      const badge = document.createElement('span');
      badge.className = 'pose-badge';
      if (i === this.currentPoseIndex) {
        badge.classList.add('current');
      }
      badge.textContent = `姿势 ${i + 1}`;
      this.poseCounter.appendChild(badge);
    }
  }

  private updateEditorStatus(): void {
    const count = this.poseEditor.getJointCount();
    if (this.isEditingPose) {
      this.editorStatus.textContent = `正在编辑姿势 ${this.editingPoseIndex + 1}，关节数: ${count}/10`;
    } else {
      if (count < 6) {
        this.editorStatus.textContent = `点击画布添加关节点，已添加 ${count}/6 (最少6个)`;
      } else {
        this.editorStatus.textContent = `关节数: ${count}/10，点击"添加姿势"保存`;
      }
    }
  }

  private updateUndoButton(): void {
    this.undoBtn.disabled = !this.poseEditor.canUndo();
  }

  private updateGenerateButton(): void {
    this.generateBtn.disabled = this.poses.length < 2;
  }

  private updateExportButton(): void {
    this.exportBtn.disabled = this.frames.length === 0;
  }

  private updateTimeline(): void {
    this.timelineFrames.innerHTML = '';

    if (this.poses.length === 0 && this.frames.length === 0) {
      const hint = document.createElement('div');
      hint.style.cssText = 'color: #666; font-size: 12px; padding: 20px;';
      hint.textContent = '添加姿势后将在此显示时间轴...';
      this.timelineFrames.appendChild(hint);
      return;
    }

    if (this.frames.length > 0) {
      for (let i = 0; i < this.frames.length; i++) {
        const frame = this.frames[i];
        const thumb = this.createFrameThumbnail(frame, i);
        this.timelineFrames.appendChild(thumb);
      }
    } else {
      for (let i = 0; i < this.poses.length; i++) {
        const thumb = this.createPoseThumbnail(this.poses[i], i);
        this.timelineFrames.appendChild(thumb);
      }
    }
  }

  private createFrameThumbnail(frame: Frame, index: number): HTMLDivElement {
    const div = document.createElement('div');
    div.className = 'frame-thumb';
    if (frame.isKeyFrame) {
      div.classList.add('key-frame');
    }
    div.dataset.index = String(index);

    const canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 40;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, 50, 40);

    if (frame.joints.length > 0) {
      const scaleX = 50 / CANVAS_WIDTH;
      const scaleY = 40 / CANVAS_HEIGHT;
      const scale = Math.min(scaleX, scaleY);
      const offsetX = (50 - CANVAS_WIDTH * scale) / 2;
      const offsetY = (40 - CANVAS_HEIGHT * scale) / 2;

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      const color = frame.isKeyFrame && frame.keyFrameIndex !== undefined
        ? this.poses[frame.keyFrameIndex]?.color || '#000000'
        : '#888888';

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      for (let i = 0; i < frame.joints.length - 1; i++) {
        const from = frame.joints[i];
        const to = frame.joints[i + 1];
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }

      for (const joint of frame.joints) {
        ctx.beginPath();
        ctx.arc(joint.x, joint.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.restore();
    }

    div.appendChild(canvas);

    const label = document.createElement('span');
    label.className = 'frame-label';
    if (frame.isKeyFrame && frame.keyFrameIndex !== undefined) {
      label.textContent = `K${frame.keyFrameIndex + 1}`;
    } else {
      label.textContent = `T${index}`;
    }
    div.appendChild(label);

    if (frame.isKeyFrame && frame.keyFrameIndex !== undefined) {
      div.draggable = true;
      div.addEventListener('dragstart', (e) => this.onDragStart(e, frame.keyFrameIndex!));
      div.addEventListener('dragend', () => this.onDragEnd());
      div.addEventListener('dblclick', () => this.editPose(frame.keyFrameIndex!));
      div.title = `关键帧 ${frame.keyFrameIndex + 1} - 双击编辑`;
    }

    div.addEventListener('click', () => {
      if (this.frames.length > 0) {
        this.animationPlayer.setFrameIndex(index);
        if (this.animationPlayer.getIsPlaying()) {
          this.animationPlayer.pause();
          this.playPauseBtn.textContent = '播放';
        }
      }
    });

    return div;
  }

  private createPoseThumbnail(pose: Pose, index: number): HTMLDivElement {
    const div = document.createElement('div');
    div.className = 'frame-thumb key-frame';
    div.draggable = true;

    const canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 40;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, 50, 40);

    if (pose.joints.length > 0) {
      const scaleX = 50 / CANVAS_WIDTH;
      const scaleY = 40 / CANVAS_HEIGHT;
      const scale = Math.min(scaleX, scaleY);
      const offsetX = (50 - CANVAS_WIDTH * scale) / 2;
      const offsetY = (40 - CANVAS_HEIGHT * scale) / 2;

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      ctx.strokeStyle = pose.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      for (const bone of pose.bones) {
        const from = pose.joints.find(j => j.id === bone.from);
        const to = pose.joints.find(j => j.id === bone.to);
        if (from && to) {
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        }
      }

      for (const joint of pose.joints) {
        ctx.beginPath();
        ctx.arc(joint.x, joint.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = pose.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.restore();
    }

    div.appendChild(canvas);

    const label = document.createElement('span');
    label.className = 'frame-label';
    label.textContent = `姿势 ${index + 1}`;
    div.appendChild(label);

    div.addEventListener('dragstart', (e) => this.onDragStart(e, index));
    div.addEventListener('dragend', () => this.onDragEnd());
    div.addEventListener('dblclick', () => this.editPose(index));
    div.title = `姿势 ${index + 1} - 双击编辑，拖拽排序`;

    return div;
  }

  private onDragStart(e: DragEvent, poseIndex: number): void {
    this.dragFrameIndex = poseIndex;
    const target = e.currentTarget as HTMLElement;
    target.classList.add('dragging');

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(poseIndex));
    }

    this.dragIndicator = document.createElement('div');
    this.dragIndicator.className = 'drag-indicator';
    this.dragIndicator.textContent = `姿势 ${poseIndex + 1}`;
    document.body.appendChild(this.dragIndicator);

    document.addEventListener('dragover', this.onDragOver.bind(this));
    document.addEventListener('drop', this.onDrop.bind(this));
  }

  private onDragOver(e: DragEvent): void {
    e.preventDefault();
    if (this.dragIndicator) {
      this.dragIndicator.style.left = `${e.clientX + 10}px`;
      this.dragIndicator.style.top = `${e.clientY + 10}px`;
    }
  }

  private onDragEnd(): void {
    document.querySelectorAll('.frame-thumb').forEach(el => el.classList.remove('dragging'));
    if (this.dragIndicator) {
      document.body.removeChild(this.dragIndicator);
      this.dragIndicator = null;
    }
    document.removeEventListener('dragover', this.onDragOver.bind(this));
    document.removeEventListener('drop', this.onDrop.bind(this));
    this.dragFrameIndex = -1;
  }

  private onDrop(e: DragEvent): void {
    e.preventDefault();

    const target = e.target as HTMLElement;
    const thumb = target.closest('.frame-thumb') as HTMLElement;

    if (thumb && thumb.dataset.index !== undefined) {
      const targetIndex = parseInt(thumb.dataset.index, 10);
      this.reorderKeyFrames(this.dragFrameIndex, targetIndex);
    }

    this.onDragEnd();
  }

  private reorderKeyFrames(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    if (fromIndex >= this.poses.length || toIndex >= this.poses.length) return;

    const [removed] = this.poses.splice(fromIndex, 1);
    this.poses.splice(toIndex, 0, removed);

    if (this.frames.length > 0) {
      this.generateAnimation();
    }

    this.updateTimeline();
    this.updatePoseCounter();
  }

  private editPose(poseIndex: number): void {
    const pose = this.poses[poseIndex];
    if (!pose) return;

    this.isEditingPose = true;
    this.editingPoseIndex = poseIndex;
    this.poseEditor.setPose(pose);
    this.addPoseBtn.textContent = '更新姿势';
    this.currentPoseIndex = poseIndex;
    this.updatePoseCounter();
    this.updateEditorStatus();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private updateUI(): void {
    this.updateEditorStatus();
    this.updateUndoButton();
    this.updateGenerateButton();
    this.updateExportButton();
    this.updatePoseCounter();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
