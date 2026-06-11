export type AttendanceStatus = 'present' | 'late' | 'leave' | 'absent';

export interface Student {
  id: string;
  name: string;
  seatRow: number;
  seatCol: number;
  attendance: AttendanceStatus;
  attendanceHistory: { date: string; status: AttendanceStatus }[];
  scores: number[];
  totalScore: number;
  lateCount: number;
  absentStreak: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  studentId: string;
}

interface SeatAnimation {
  studentId: string;
  startColor: string;
  endColor: string;
  startTime: number;
  duration: number;
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: '#4CAF50',
  late: '#FFC107',
  leave: '#2196F3',
  absent: '#F44336'
};

const SEAT_WIDTH = 60;
const SEAT_HEIGHT = 40;
const SEAT_PADDING_X = 12;
const SEAT_PADDING_Y = 15;
const COLS = 9;
const ROWS = 7;

export class SeatRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private students: Student[] = [];
  private onSeatClick: (student: Student, clickX: number, clickY: number) => void;
  private ripples: Ripple[] = [];
  private animations: SeatAnimation[] = [];
  private draggedStudent: Student | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private isDragging = false;
  private lastFrameTime = 0;

  constructor(canvas: HTMLCanvasElement, onSeatClick: (student: Student, clickX: number, clickY: number) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onSeatClick = onSeatClick;
    this.bindEvents();
    this.startRenderLoop();
  }

  init(students: Student[]): void {
    this.students = [...students];
  }

  updateStudent(studentId: string, status: AttendanceStatus): void {
    const student = this.students.find(s => s.id === studentId);
    if (student) {
      const oldStatus = student.attendance;
      student.attendance = status;
      
      this.animations.push({
        studentId,
        startColor: STATUS_COLORS[oldStatus],
        endColor: STATUS_COLORS[status],
        startTime: performance.now(),
        duration: 300
      });
    }
  }

  updateAll(students: Student[]): void {
    this.students = [...students];
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
  }

  private getCanvasCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  private getStudentAt(x: number, y: number): Student | null {
    for (const student of this.students) {
      const pos = this.getSeatPosition(student.seatRow, student.seatCol);
      if (x >= pos.x && x <= pos.x + SEAT_WIDTH &&
          y >= pos.y && y <= pos.y + SEAT_HEIGHT) {
        return student;
      }
    }
    return null;
  }

  private getSeatPosition(row: number, col: number): { x: number; y: number } {
    return {
      x: col * (SEAT_WIDTH + SEAT_PADDING_X) + 20,
      y: row * (SEAT_HEIGHT + SEAT_PADDING_Y) + 20
    };
  }

  private handleMouseDown(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e);
    const student = this.getStudentAt(x, y);
    if (student) {
      this.draggedStudent = student;
      const pos = this.getSeatPosition(student.seatRow, student.seatCol);
      this.dragOffsetX = x - pos.x;
      this.dragOffsetY = y - pos.y;
      this.isDragging = false;
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.draggedStudent) return;
    
    const { x, y } = this.getCanvasCoords(e);
    const pos = this.getSeatPosition(this.draggedStudent.seatRow, this.draggedStudent.seatCol);
    
    if (Math.abs(x - pos.x - this.dragOffsetX) > 5 || 
        Math.abs(y - pos.y - this.dragOffsetY) > 5) {
      this.isDragging = true;
    }
  }

  private handleMouseUp(e?: MouseEvent): void {
    if (!this.draggedStudent) return;
    
    if (e && !this.isDragging) {
      const { x, y } = this.getCanvasCoords(e);
      const student = this.getStudentAt(x, y);
      if (student && student.id === this.draggedStudent.id) {
        this.ripples.push({
          x,
          y,
          radius: 0,
          alpha: 0.6,
          studentId: student.id
        });
        this.onSeatClick(student, x, y);
      }
    } else if (this.isDragging && e) {
      const { x, y } = this.getCanvasCoords(e);
      const target = this.getStudentAt(x, y);
      if (target && target.id !== this.draggedStudent.id) {
        this.swapStudents(this.draggedStudent, target);
      }
    }
    
    this.draggedStudent = null;
    this.isDragging = false;
  }

  private swapStudents(s1: Student, s2: Student): void {
    const tempRow = s1.seatRow;
    const tempCol = s1.seatCol;
    s1.seatRow = s2.seatRow;
    s1.seatCol = s2.seatCol;
    s2.seatRow = tempRow;
    s2.seatCol = tempCol;
    
    const event = new CustomEvent('seatSwap', {
      detail: { fromId: s1.id, toId: s2.id }
    });
    document.dispatchEvent(event);
  }

  private interpolateColor(color1: string, color2: string, t: number): string {
    const hex = (c: string) => parseInt(c, 16);
    const r1 = hex(color1.slice(1, 3));
    const g1 = hex(color1.slice(3, 5));
    const b1 = hex(color1.slice(5, 7));
    const r2 = hex(color2.slice(1, 3));
    const g2 = hex(color2.slice(3, 5));
    const b2 = hex(color2.slice(5, 7));
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return `rgb(${r},${g},${b})`;
  }

  private startRenderLoop(): void {
    const render = (time: number) => {
      const deltaTime = time - this.lastFrameTime;
      this.lastFrameTime = time;
      this.render(deltaTime);
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  private render(deltaTime: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.fillStyle = '#F5EDD6';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.animations = this.animations.filter(a => {
      return performance.now() - a.startTime < a.duration;
    });
    
    this.ripples = this.ripples.filter(r => {
      r.radius += deltaTime * 0.15;
      r.alpha -= deltaTime * 0.0015;
      return r.alpha > 0;
    });
    
    for (const student of this.students) {
      this.renderSeat(student);
    }
    
    for (const ripple of this.ripples) {
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(62, 39, 35, ${ripple.alpha})`;
      ctx.fill();
    }
  }

  private renderSeat(student: Student): void {
    const ctx = this.ctx;
    const pos = this.getSeatPosition(student.seatRow, student.seatCol);
    
    const anim = this.animations.find(a => a.studentId === student.id);
    let fillColor = STATUS_COLORS[student.attendance];
    
    if (anim) {
      const t = Math.min((performance.now() - anim.startTime) / anim.duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      fillColor = this.interpolateColor(anim.startColor, anim.endColor, eased);
    }
    
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    this.roundRect(ctx, pos.x, pos.y, SEAT_WIDTH, SEAT_HEIGHT, 6);
    ctx.fill();
    
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.fillStyle = '#3E2723';
    ctx.font = '14px KaiTi, STKaiti, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(student.name, pos.x + SEAT_WIDTH / 2, pos.y + SEAT_HEIGHT / 2);
    
    ctx.fillStyle = '#888';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(student.id, pos.x + SEAT_WIDTH - 4, pos.y + 3);
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
