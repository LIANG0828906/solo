export interface RankedStudent {
  id: string;
  name: string;
  seatRow: number;
  seatCol: number;
  attendance: string;
  attendanceHistory: { date: string; status: string }[];
  scores: number[];
  totalScore: number;
  lateCount: number;
  absentStreak: number;
  attendanceRate: number;
  weightedScore: number;
  rank: number;
}

export interface AlertData {
  studentId: string;
  studentName: string;
  alerts: string[];
  totalScore: number;
  absentStreak: number;
}

interface RowAnimation {
  studentId: string;
  startTime: number;
  duration: number;
}

const ROW_HEIGHT = 36;
const RANK_COL_WIDTH = 36;
const NAME_COL_WIDTH = 70;
const BAR_PADDING = 8;
const BAR_HEIGHT = 20;

export class RankRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rankings: RankedStudent[] = [];
  private previousRanks: Map<string, number> = new Map();
  private flashAnimations: RowAnimation[] = [];
  private alertList: HTMLUListElement;
  private activeAlerts: Map<string, AlertData> = new Map();
  private onDismissAlert: (studentId: string) => void;

  constructor(canvas: HTMLCanvasElement, alertList: HTMLUListElement, onDismissAlert: (studentId: string) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.alertList = alertList;
    this.onDismissAlert = onDismissAlert;
    this.startRenderLoop();
  }

  init(rankings: RankedStudent[]): void {
    this.rankings = rankings;
    rankings.forEach(r => this.previousRanks.set(r.id, r.rank));
  }

  update(rankings: RankedStudent[]): void {
    const startTime = performance.now();
    
    rankings.forEach(newRank => {
      const oldRank = this.previousRanks.get(newRank.id);
      if (oldRank !== undefined && Math.abs(oldRank - newRank.rank) === 1) {
        this.flashAnimations.push({
          studentId: newRank.id,
          startTime,
          duration: 600
        });
      }
      this.previousRanks.set(newRank.id, newRank.rank);
    });
    
    this.rankings = rankings;
    
    const elapsed = performance.now() - startTime;
    if (elapsed > 80) {
      console.warn(`排名计算耗时: ${elapsed}ms, 超过80ms阈值`);
    }
  }

  addAlert(alert: AlertData): void {
    this.activeAlerts.set(alert.studentId, alert);
    this.renderAlerts();
  }

  removeAlert(studentId: string): void {
    this.activeAlerts.delete(studentId);
    this.renderAlerts();
  }

  private renderAlerts(): void {
    this.alertList.innerHTML = '';
    
    if (this.activeAlerts.size === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-alert';
      empty.textContent = '暂无学规警示';
      this.alertList.appendChild(empty);
      return;
    }
    
    this.activeAlerts.forEach(alert => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${alert.studentName} - ${alert.alerts.join('、')}</span>
        <span class="alert-badge">已触发学规</span>
      `;
      li.addEventListener('click', () => {
        this.onDismissAlert(alert.studentId);
      });
      this.alertList.appendChild(li);
    });
  }

  private startRenderLoop(): void {
    const render = () => {
      this.render();
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  private interpolateColor(t: number): string {
    const clampedT = Math.max(0, Math.min(1, t));
    const r = Math.round(244 + (76 - 244) * clampedT);
    const g = Math.round(67 + (175 - 67) * clampedT);
    const b = Math.round(54 + (80 - 54) * clampedT);
    return `rgb(${r},${g},${b})`;
  }

  private render(): void {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const displayCount = Math.min(this.rankings.length, 8);
    
    this.canvas.height = displayCount * ROW_HEIGHT + 10;
    
    ctx.clearRect(0, 0, width, this.canvas.height);
    
    this.flashAnimations = this.flashAnimations.filter(a => {
      return performance.now() - a.startTime < a.duration;
    });
    
    for (let i = 0; i < displayCount; i++) {
      const student = this.rankings[i];
      if (!student) continue;
      
      const y = i * ROW_HEIGHT + 5;
      
      const flashAnim = this.flashAnimations.find(a => a.studentId === student.id);
      if (flashAnim) {
        const t = (performance.now() - flashAnim.startTime) / flashAnim.duration;
        const flashAlpha = Math.sin(t * Math.PI) * 0.6;
        ctx.fillStyle = `rgba(255, 249, 196, ${flashAlpha})`;
        ctx.fillRect(0, y, width, ROW_HEIGHT - 4);
      }
      
      ctx.fillStyle = this.getRankColor(student.rank);
      ctx.font = 'bold 14px KaiTi, STKaiti, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        student.rank <= 3 ? ['状元', '榜眼', '探花'][student.rank - 1] : String(student.rank),
        RANK_COL_WIDTH / 2,
        y + ROW_HEIGHT / 2 - 2
      );
      
      ctx.fillStyle = '#3E2723';
      ctx.font = '14px KaiTi, STKaiti, serif';
      ctx.textAlign = 'left';
      ctx.fillText(student.name, RANK_COL_WIDTH + 8, y + ROW_HEIGHT / 2 - 2);
      
      const barX = RANK_COL_WIDTH + NAME_COL_WIDTH + 4;
      const barWidth = width - barX - BAR_PADDING;
      const barY = y + (ROW_HEIGHT - BAR_HEIGHT) / 2;
      
      ctx.fillStyle = '#D7CCC8';
      ctx.beginPath();
      this.roundRect(ctx, barX, barY, barWidth, BAR_HEIGHT, 4);
      ctx.fill();
      
      const scoreRatio = student.totalScore / 100;
      const fillWidth = Math.max(barWidth * scoreRatio, 4);
      ctx.fillStyle = this.interpolateColor(scoreRatio);
      ctx.beginPath();
      this.roundRect(ctx, barX, barY, fillWidth, BAR_HEIGHT, 4);
      ctx.fill();
      
      ctx.fillStyle = scoreRatio > 0.5 ? '#FFF' : '#3E2723';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(
        `${student.totalScore}分`,
        barX + fillWidth - 4,
        barY + BAR_HEIGHT / 2
      );
      
      ctx.fillStyle = '#6D4C41';
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(
        `出勤${Math.round(student.attendanceRate * 100)}%`,
        barX + 4,
        barY + BAR_HEIGHT / 2
      );
    }
  }

  private getRankColor(rank: number): string {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#8B7355';
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
