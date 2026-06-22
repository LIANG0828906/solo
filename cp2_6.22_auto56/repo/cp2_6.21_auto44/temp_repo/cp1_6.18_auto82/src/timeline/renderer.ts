import type { LayoutResult, NodeLayout, TimeConfig } from '@/shared/types';
import { BG_PRIMARY, BRANCH_COLOR } from '@/shared/types';
import { getLayout, hitTest, dayOffsetFromX } from './layout';
import { useStore } from '@/store';

type InteractionCallback = (type: 'dblclick' | 'click', x: number, y: number, dayOffset: number, nodeLayout: NodeLayout | null) => void;

export class TimelineRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number = 1;
  private animFrameId: number = 0;
  private layout: LayoutResult | null = null;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartOffsetX: number = 0;
  private onInteraction: InteractionCallback | null = null;
  private unsubscribe: (() => void) | null = null;

  private checkAnimations: Map<string, { startTime: number; type: 'status' | 'check' }> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;
  }

  setInteractionCallback(cb: InteractionCallback) {
    this.onInteraction = cb;
  }

  start() {
    this.unsubscribe = useStore.subscribe(() => {
      this.recalculateAndRender();
    });
    this.recalculateAndRender();
    this.attachEvents();
  }

  stop() {
    if (this.unsubscribe) this.unsubscribe();
    this.detachEvents();
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }

  resize() {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.recalculateAndRender();
  }

  private recalculateAndRender() {
    const state = useStore.getState();
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    const canvasWidth = rect?.width ?? 1200;

    this.layout = getLayout(
      state.nodes,
      state.branches,
      state.filter,
      state.timeConfig.startDate,
      state.timeConfig.zoomLevel,
      canvasWidth,
      state.timeConfig.offsetX
    );
    this.render();
  }

  private render() {
    if (!this.layout) return;
    const ctx = this.ctx;
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;

    ctx.clearRect(0, 0, w, h);

    this.drawBackground(w, h);
    this.drawAxis(this.layout, w);
    this.drawBranches(this.layout);
    this.drawNodes(this.layout);
  }

  private drawBackground(w: number, h: number) {
    const ctx = this.ctx;
    ctx.fillStyle = BG_PRIMARY;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let x = 0; x < w; x += 40) {
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawAxis(layout: LayoutResult, canvasWidth: number) {
    const ctx = this.ctx;
    const state = useStore.getState();
    const zoomLevel = state.timeConfig.zoomLevel;
    const scaledDayWidth = 80 * zoomLevel;

    ctx.beginPath();
    ctx.moveTo(0, layout.axisY);
    ctx.lineTo(canvasWidth, layout.axisY);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const startDay = Math.floor(-state.timeConfig.offsetX / scaledDayWidth) - 1;
    const endDay = startDay + Math.ceil(canvasWidth / scaledDayWidth) + 2;
    const baseDate = new Date(state.timeConfig.startDate);

    for (let day = startDay; day <= endDay; day++) {
      const x = state.timeConfig.offsetX + day * scaledDayWidth;
      if (x < -20 || x > canvasWidth + 20) continue;

      ctx.beginPath();
      ctx.arc(x, layout.axisY, 3, 0, Math.PI * 2);
      ctx.fillStyle = day === 0 ? '#6C63FF' : 'rgba(255,255,255,0.3)';
      ctx.fill();

      if (day % Math.max(1, Math.floor(7 / zoomLevel)) === 0) {
        const date = new Date(baseDate.getTime() + day * 86400000);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        ctx.font = `${11 * Math.min(zoomLevel, 1.5)}px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, layout.axisY + 22);
      }
    }

    const todayX = state.timeConfig.offsetX;
    if (todayX >= 0 && todayX <= canvasWidth) {
      ctx.beginPath();
      ctx.moveTo(todayX, layout.axisY - 30);
      ctx.lineTo(todayX, layout.axisY + 30);
      ctx.strokeStyle = '#6C63FF';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '11px Inter, sans-serif';
      ctx.fillStyle = '#6C63FF';
      ctx.textAlign = 'center';
      ctx.fillText('今天', todayX, layout.axisY - 36);
    }
  }

  private drawBranches(layout: LayoutResult) {
    const ctx = this.ctx;

    layout.branches.forEach((branch) => {
      if (branch.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(branch.points[0].x, branch.points[0].y);

      for (let i = 1; i < branch.points.length; i++) {
        const prev = branch.points[i - 1];
        const curr = branch.points[i];
        const cpx = prev.x;
        const cpy = curr.y;
        ctx.quadraticCurveTo(prev.x, cpy, (prev.x + curr.x) / 2, (cpy + curr.y) / 2);
      }

      const last = branch.points[branch.points.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.strokeStyle = BRANCH_COLOR;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      const first = branch.points[0];
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      ctx.lineTo(first.x, last.y);
      ctx.strokeStyle = BRANCH_COLOR;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  private drawNodes(layout: LayoutResult) {
    const ctx = this.ctx;
    const now = Date.now();
    const state = useStore.getState();

    layout.nodes.forEach((nl) => {
      ctx.save();

      if (nl.filtered) {
        ctx.globalAlpha = 0.2;
      }

      const isHovered = state.selectedNodeId === nl.id;

      if (!nl.filtered && isHovered) {
        ctx.shadowColor = nl.color;
        ctx.shadowBlur = 12;
      }

      if (!nl.filtered && !isNodeFullyFiltered(nl, layout)) {
        ctx.shadowColor = nl.color;
        ctx.shadowBlur = 4;
      }

      ctx.beginPath();
      ctx.arc(nl.x, nl.y, nl.radius, 0, Math.PI * 2);
      ctx.fillStyle = nl.color;
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      if (nl.node.status === 'completed') {
        const anim = this.checkAnimations.get(nl.id);
        let progress = 1;
        if (anim && anim.type === 'check') {
          progress = Math.min(1, (now - anim.startTime) / 400);
        }
        const r = nl.radius * 0.6;
        ctx.beginPath();
        ctx.moveTo(nl.x - r * 0.5, nl.y);
        ctx.lineTo(nl.x - r * 0.1, nl.y + r * 0.4 * progress);
        if (progress > 0.3) {
          ctx.lineTo(nl.x + r * 0.5 * Math.min(1, (progress - 0.3) / 0.7), nl.y - r * 0.3 * Math.min(1, (progress - 0.3) / 0.7));
        }
        ctx.strokeStyle = '#1A1A2E';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      ctx.font = `${Math.max(10, 12 * Math.min(state.timeConfig.zoomLevel, 1.5))}px Inter, sans-serif`;
      ctx.fillStyle = nl.filtered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'center';
      const maxWidth = 100;
      const desc = nl.node.description.length > 10 ? nl.node.description.slice(0, 10) + '…' : nl.node.description;
      ctx.fillText(desc, nl.x, nl.y + nl.radius + 16);

      if (!nl.filtered && nl.node.estimatedDays > 0) {
        ctx.font = `${Math.max(8, 10 * Math.min(state.timeConfig.zoomLevel, 1.2))}px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillText(`${nl.node.estimatedDays}天`, nl.x, nl.y + nl.radius + 30);
      }

      ctx.restore();
    });
  }

  triggerCheckAnimation(nodeId: string) {
    this.checkAnimations.set(nodeId, { startTime: Date.now(), type: 'check' });
    const animate = () => {
      this.render();
      const anim = this.checkAnimations.get(nodeId);
      if (anim && Date.now() - anim.startTime < 400) {
        requestAnimationFrame(animate);
      } else {
        this.checkAnimations.delete(nodeId);
      }
    };
    requestAnimationFrame(animate);
  }

  private attachEvents() {
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('mouseleave', this.onMouseUp);
    this.canvas.addEventListener('dblclick', this.onDblClick);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  private detachEvents() {
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('mouseleave', this.onMouseUp);
    this.canvas.removeEventListener('dblclick', this.onDblClick);
    this.canvas.removeEventListener('wheel', this.onWheel);
  }

  private getCanvasPos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private onMouseDown = (e: MouseEvent) => {
    const pos = this.getCanvasPos(e);
    this.isDragging = true;
    this.dragStartX = pos.x;
    this.dragStartOffsetX = useStore.getState().timeConfig.offsetX;
    this.canvas.style.cursor = 'grabbing';
  };

  private onMouseMove = (e: MouseEvent) => {
    if (this.isDragging) {
      const pos = this.getCanvasPos(e);
      const dx = pos.x - this.dragStartX;
      useStore.getState().setTimeConfig({ offsetX: this.dragStartOffsetX + dx });
    } else {
      const pos = this.getCanvasPos(e);
      if (this.layout) {
        const hit = hitTest(this.layout, pos.x, pos.y);
        this.canvas.style.cursor = hit ? 'pointer' : 'grab';
        useStore.getState().setSelectedNodeId(hit?.id ?? null);
      }
    }
  };

  private onMouseUp = () => {
    this.isDragging = false;
    this.canvas.style.cursor = 'grab';
  };

  private onDblClick = (e: MouseEvent) => {
    const pos = this.getCanvasPos(e);
    if (!this.layout) return;

    const hit = hitTest(this.layout, pos.x, pos.y);
    const state = useStore.getState();
    const dayOffset = dayOffsetFromX(pos.x, state.timeConfig.offsetX, state.timeConfig.zoomLevel);

    if (this.onInteraction) {
      this.onInteraction('dblclick', pos.x, pos.y, dayOffset, hit);
    }
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const state = useStore.getState();
    const pos = this.getCanvasPos(e);
    const oldZoom = state.timeConfig.zoomLevel;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(3, oldZoom + delta));

    const mouseXRatio = pos.x / (this.canvas.width / this.dpr);
    const newOffsetX = pos.x - (pos.x - state.timeConfig.offsetX) * (newZoom / oldZoom);

    useStore.getState().setTimeConfig({
      zoomLevel: newZoom,
      offsetX: newOffsetX,
    });
  };
}

function isNodeFullyFiltered(nl: NodeLayout, layout: LayoutResult): boolean {
  return nl.filtered;
}
