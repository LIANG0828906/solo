import { SeatRenderer, Student, AttendanceStatus } from './seatRenderer';
import { RankRenderer, RankedStudent, AlertData } from './rankRenderer';
import { io, Socket } from 'socket.io-client';

class App {
  private socket: Socket;
  private seatRenderer: SeatRenderer;
  private rankRenderer: RankRenderer;
  private selectedStudent: Student | null = null;
  private selectedStatus: AttendanceStatus | null = null;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.socket = io();
    this.initRenderers();
    this.initEventListeners();
    this.initSocketListeners();
    this.displayDate();
  }

  private initRenderers(): void {
    const seatCanvas = document.getElementById('seatCanvas') as HTMLCanvasElement;
    const rankCanvas = document.getElementById('rankCanvas') as HTMLCanvasElement;
    const alertList = document.getElementById('alertList') as HTMLUListElement;

    this.seatRenderer = new SeatRenderer(seatCanvas, (student, x, y) => {
      this.openAttendanceModal(student);
    });

    this.rankRenderer = new RankRenderer(rankCanvas, alertList, (studentId) => {
      this.socket.emit('dismissAlert', { studentId });
    });
  }

  private initEventListeners(): void {
    document.querySelectorAll('.status-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        this.selectedStatus = target.dataset.status as AttendanceStatus;
        document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('selected'));
        target.classList.add('selected');
      });
    });

    document.getElementById('cancelAttendance')?.addEventListener('click', () => {
      this.closeAttendanceModal();
    });

    document.getElementById('confirmAttendance')?.addEventListener('click', () => {
      if (this.selectedStudent && this.selectedStatus) {
        this.socket.emit('markAttendance', {
          studentId: this.selectedStudent.id,
          status: this.selectedStatus
        });
        this.playBellSound();
      }
      this.closeAttendanceModal();
    });

    document.getElementById('scoreFab')?.addEventListener('click', () => {
      this.openScoreModal();
    });

    document.getElementById('cancelScore')?.addEventListener('click', () => {
      this.closeScoreModal();
    });

    document.getElementById('confirmScore')?.addEventListener('click', () => {
      this.submitScores();
      this.closeScoreModal();
    });

    document.addEventListener('seatSwap', (e: CustomEvent) => {
      this.socket.emit('swapSeats', {
        fromId: e.detail.fromId,
        toId: e.detail.toId
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });
  }

  private initSocketListeners(): void {
    this.socket.on('initialData', (data: { students: Student[]; rankings: RankedStudent[] }) => {
      this.seatRenderer.init(data.students);
      this.rankRenderer.init(data.rankings);
    });

    this.socket.on('attendanceUpdate', (data: { studentId: string; status: AttendanceStatus; absentStreak: number }) => {
      this.seatRenderer.updateStudent(data.studentId, data.status);
    });

    this.socket.on('rankUpdate', (rankings: RankedStudent[]) => {
      this.rankRenderer.update(rankings);
    });

    this.socket.on('alertTriggered', (alert: AlertData) => {
      this.rankRenderer.addAlert(alert);
    });

    this.socket.on('alertDismissed', (data: { studentId: string }) => {
      this.rankRenderer.removeAlert(data.studentId);
    });

    this.socket.on('seatSwap', (data: { students: Student[] }) => {
      this.seatRenderer.updateAll(data.students);
    });
  }

  private openAttendanceModal(student: Student): void {
    this.selectedStudent = student;
    this.selectedStatus = null;
    document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('selected'));
    (document.getElementById('modalStudentName') as HTMLElement).textContent = `${student.name} (${student.id}) - 选择考勤状态`;
    document.getElementById('attendanceModal')?.classList.add('active');
  }

  private closeAttendanceModal(): void {
    this.selectedStudent = null;
    this.selectedStatus = null;
    document.getElementById('attendanceModal')?.classList.remove('active');
  }

  private openScoreModal(): void {
    (document.getElementById('singleScoreId') as HTMLInputElement).value = '';
    (document.getElementById('singleScoreValue') as HTMLInputElement).value = '';
    (document.getElementById('batchScores') as HTMLTextAreaElement).value = '';
    document.getElementById('scoreModal')?.classList.add('active');
  }

  private closeScoreModal(): void {
    document.getElementById('scoreModal')?.classList.remove('active');
  }

  private submitScores(): void {
    const singleId = (document.getElementById('singleScoreId') as HTMLInputElement).value.trim();
    const singleValue = (document.getElementById('singleScoreValue') as HTMLInputElement).value.trim();
    const batchText = (document.getElementById('batchScores') as HTMLTextAreaElement).value.trim();

    if (batchText) {
      const pairs = batchText.split(/[,，\s]+/).filter(p => p.includes(':'));
      const batch = pairs.map(p => {
        const [id, score] = p.split(':');
        return { studentId: id.trim(), score: parseInt(score.trim(), 10) };
      }).filter(item => !isNaN(item.score) && item.score >= 0 && item.score <= 100);
      
      if (batch.length > 0) {
        this.socket.emit('upgradeScore', { batch });
        return;
      }
    }

    if (singleId && singleValue) {
      const score = parseInt(singleValue, 10);
      if (!isNaN(score) && score >= 0 && score <= 100) {
        this.socket.emit('upgradeScore', { studentId: singleId, score });
      }
    }
  }

  private playBellSound(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }

  private displayDate(): void {
    const now = new Date();
    const lunar = this.toLunarDate(now);
    const display = document.getElementById('dateDisplay');
    if (display) {
      display.textContent = `${lunar}·西元${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    }
  }

  private toLunarDate(date: Date): string {
    const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
    const lunarDays = [
      '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
      '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
    ];
    
    const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    
    const year = date.getFullYear();
    const stemIndex = (year - 4) % 10;
    const branchIndex = (year - 4) % 12;
    
    const month = Math.min(date.getMonth(), 11);
    const day = Math.min(date.getDate() - 1, 29);
    
    return `${heavenlyStems[stemIndex]}${earthlyBranches[branchIndex]}年${lunarMonths[month]}月${lunarDays[day]}`;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
