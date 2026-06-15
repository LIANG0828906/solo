export interface StepTiming {
  stepId: number;
  elapsedSeconds: number;
  completed: boolean;
}

export interface TimingResult {
  totalSeconds: number;
  completedSteps: number;
  totalSteps: number;
  completionRate: number;
  score: number;
  encouragement: string;
  formattedTime: string;
  stepDetails: StepTiming[];
}

const encouragements: string[] = [
  '匠心独运，手作之美，你的作品值得被珍藏！',
  '一针一线皆修行，每一件手作都是独一无二的艺术品。',
  '慢工出细活，耐心是最好的匠人。',
  '时间沉淀品质，你的坚持终将美好。',
  '指尖的温度，让皮革有了生命。',
  '传统工艺的传承，从你手中的这一针开始。',
  '每一次打磨，都是与时间的对话。',
  '手工的温度，是机器永远无法复制的。',
];

export class TimingService {
  private stepTimings: Map<number, StepTiming> = new Map();

  recordStep(stepId: number, elapsedSeconds: number, completed: boolean = true): void {
    this.stepTimings.set(stepId, {
      stepId,
      elapsedSeconds,
      completed,
    });
  }

  getStepTiming(stepId: number): StepTiming | undefined {
    return this.stepTimings.get(stepId);
  }

  getAllTimings(): StepTiming[] {
    return Array.from(this.stepTimings.values());
  }

  clear(): void {
    this.stepTimings.clear();
  }

  calculateResult(totalSteps: number, estimatedTotalSeconds?: number): TimingResult {
    const timings = this.getAllTimings();
    const totalSeconds = timings.reduce((sum, t) => sum + t.elapsedSeconds, 0);
    const completedSteps = timings.filter((t) => t.completed).length;
    const completionRate = totalSteps > 0 ? completedSteps / totalSteps : 0;

    let score = 0;
    if (estimatedTotalSeconds && estimatedTotalSeconds > 0) {
      const timeRatio = totalSeconds / estimatedTotalSeconds;
      let timeScore = 0;
      if (timeRatio <= 1) {
        timeScore = 40;
      } else if (timeRatio <= 1.3) {
        timeScore = 40 - (timeRatio - 1) * 50;
      } else if (timeRatio <= 2) {
        timeScore = 25 - (timeRatio - 1.3) * 20;
      } else {
        timeScore = 10;
      }
      const completionScore = completionRate * 50;
      const consistencyScore =
        completedSteps === totalSteps ? 10 : Math.min(10, completedSteps * 1.5);
      score = Math.round(Math.min(100, Math.max(0, timeScore + completionScore + consistencyScore)));
    } else {
      score = Math.round(completionRate * 100);
    }

    const encouragementIndex = Math.min(
      Math.floor(score / 15),
      encouragements.length - 1
    );

    return {
      totalSeconds,
      completedSteps,
      totalSteps,
      completionRate,
      score,
      encouragement: encouragements[encouragementIndex],
      formattedTime: this.formatTime(totalSeconds),
      stepDetails: timings,
    };
  }

  formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}小时${minutes}分${seconds}秒`;
    }
    if (minutes > 0) {
      return `${minutes}分${seconds}秒`;
    }
    return `${seconds}秒`;
  }

  formatTimer(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  saveToStorage(key: string = 'leather_timing'): void {
    localStorage.setItem(
      key,
      JSON.stringify(Array.from(this.stepTimings.entries()))
    );
  }

  loadFromStorage(key: string = 'leather_timing'): void {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const entries = JSON.parse(data) as [number, StepTiming][];
        this.stepTimings = new Map(entries);
      } catch {
        this.stepTimings.clear();
      }
    }
  }
}

export const timingService = new TimingService();
