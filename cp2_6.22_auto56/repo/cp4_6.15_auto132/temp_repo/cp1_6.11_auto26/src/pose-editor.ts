import { Joint, Bone, Pose, GRID_SIZE, JOINT_RADIUS, MAX_UNDO, CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_JOINT_NAMES } from './types.js';

export class PoseEditor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private joints: Joint[] = [];
  private bones: Bone[] = [];
  private color: string = '#000000';
  private undoStack: Pose[] = [];
  private selectedJointId: string | null = null;
  private isDragging: boolean = false;
  private dragOffset = { x: 0, y: 0 };
  private onChangeCallback: (() => void) | null = null;
  private pendingRender = false;
  private nextJointIndex = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.bindEvents();
    this.render();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
  }

  private getMousePos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  private findJointAt(x: number, y: number): Joint | null {
    for (let i = this.joints.length - 1; i >= 0; i--) {
      const j = this.joints[i];
      const dx = j.x - x;
      const dy = j.y - y;
      if (Math.sqrt(dx * dx + dy * dy) <= JOINT_RADIUS + 4) {
        return j;
      }
    }
    return null;
  }

  private onMouseDown(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    const joint = this.findJointAt(pos.x, pos.y);

    if (joint) {
      this.selectedJointId = joint.id;
      this.isDragging = true;
      this.dragOffset.x = pos.x - joint.x;
      this.dragOffset.y = pos.y - joint.y;
      this.saveUndoState();
    } else {
      this.addJoint(pos.x, pos.y);
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging || !this.selectedJointId) return;

    const pos = this.getMousePos(e);
    const joint = this.joints.find(j => j.id === this.selectedJointId);
    if (joint) {
      joint.x = Math.max(0, Math.min(CANVAS_WIDTH, pos.x - this.dragOffset.x));
      joint.y = Math.max(0, Math.min(CANVAS_HEIGHT, pos.y - this.dragOffset.y));
      this.scheduleRender();
      this.notifyChange();
    }
  }

  private onMouseUp(): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.selectedJointId = null;
    }
  }

  private addJoint(x: number, y: number): void {
    if (this.joints.length >= DEFAULT_JOINT_NAMES.length) {
      return;
    }

    this.saveUndoState();

    const nameIndex = this.nextJointIndex % DEFAULT_JOINT_NAMES.length;
    const joint: Joint = {
      id: `joint_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: DEFAULT_JOINT_NAMES[nameIndex],
      x,
      y
    };

    this.joints.push(joint);
    this.nextJointIndex++;

    if (this.joints.length >= 2) {
      const prevJoint = this.joints[this.joints.length - 2];
      this.bones.push({ from: prevJoint.id, to: joint.id });
    }

    this.scheduleRender();
    this.notifyChange();
  }

  private saveUndoState(): void {
    const snapshot: Pose = {
      joints: JSON.parse(JSON.stringify(this.joints)),
      bones: JSON.parse(JSON.stringify(this.bones)),
      color: this.color
    };
    this.undoStack.push(snapshot);
    if (this.undoStack.length > MAX_UNDO) {
      this.undoStack.shift();
    }
  }

  undo(): void {
    if (this.undoStack.length === 0) return;
    const prev = this.undoStack.pop()!;
    this.joints = prev.joints;
    this.bones = prev.bones;
    this.color = prev.color;
    this.scheduleRender();
    this.notifyChange();
  }

  reset(): void {
    this.saveUndoState();
    this.joints = [];
    this.bones = [];
    this.nextJointIndex = 0;
    this.scheduleRender();
    this.notifyChange();
  }

  getPose(): Pose {
    return {
      joints: JSON.parse(JSON.stringify(this.joints)),
      bones: JSON.parse(JSON.stringify(this.bones)),
      color: this.color
    };
  }

  setPose(pose: Pose): void {
    this.joints = JSON.parse(JSON.stringify(pose.joints));
    this.bones = JSON.parse(JSON.stringify(pose.bones));
    this.color = pose.color;
    this.nextJointIndex = this.joints.length;
    this.undoStack = [];
    this.scheduleRender();
    this.notifyChange();
  }

  setColor(color: string): void {
    if (this.color === color) return;
    this.color = color;
    this.scheduleRender();
    this.notifyChange();
  }

  getColor(): string {
    return this.color;
  }

  getJointCount(): number {
    return this.joints.length;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  setOnChange(callback: () => void): void {
    this.onChangeCallback = callback;
  }

  private notifyChange(): void {
    if (this.onChangeCallback) {
      this.onChangeCallback();
    }
  }

  private scheduleRender(): void {
    if (this.pendingRender) return;
    this.pendingRender = true;
    requestAnimationFrame(() => {
      this.pendingRender = false;
      this.render();
    });
  }

  render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid();

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const bone of this.bones) {
      const from = this.joints.find(j => j.id === bone.from);
      const to = this.joints.find(j => j.id === bone.to);
      if (from && to) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    }

    for (let i = 0; i < this.joints.length; i++) {
      const joint = this.joints[i];
      const isSelected = joint.id === this.selectedJointId;

      ctx.beginPath();
      ctx.arc(joint.x, joint.y, JOINT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#e94560' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = this.color;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(joint.name, joint.x, joint.y - JOINT_RADIUS - 6);

      ctx.fillStyle = '#eaeaea';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), joint.x, joint.y);
    }
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(42, 42, 78, 0.3)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= this.canvas.width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= this.canvas.height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
  }

  drawToContext(ctx: CanvasRenderingContext2D, scale: number = 1): void {
    ctx.save();
    ctx.scale(scale, scale);

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const bone of this.bones) {
      const from = this.joints.find(j => j.id === bone.from);
      const to = this.joints.find(j => j.id === bone.to);
      if (from && to) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    }

    for (const joint of this.joints) {
      ctx.beginPath();
      ctx.arc(joint.x, joint.y, JOINT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }
}
