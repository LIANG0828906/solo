export interface StepTiming {
  stepId: number;
  elapsedSeconds: number;
  completed: boolean;
  startedAt?: number;
  pausedAccumulated?: number;
}

export interface ScoreResult {
  grade: 'A' | 'B' | 'C' | 'D';
  score: number;
  gradeColor: string;
  gradeDescription: string;
}

export interface TimingResult {
  totalSeconds: number;
  estimatedTotalSeconds: number;
  completedSteps: number;
  totalSteps: number;
  completionRate: number;
  timeRatio: number;
  score: ScoreResult;
  encouragement: string;
  formattedTime: string;
  formattedEstimatedTime: string;
  stepDetails: StepTiming[];
}

const encouragementsByGrade: Record<'A' | 'B' | 'C' | 'D', string[]> = {
  A: [
    '⚡ 神速完成！你简直是天生的皮匠大师！',
    '🏆 效率惊人，精工出细活，太棒了！',
    '🌟 手速与质量并存，你是手工界的传说！',
    '🔥 A级匠人！这个速度太令人惊叹了！',
  ],
  B: [
    '👏 节奏完美，时间把握得恰到好处！',
    '💎 不疾不徐，每一步都精益求精，真优秀！',
    '✨ B级品质！稳扎稳打，作品一定很棒！',
    '🎯 精准控制，看来你已经掌握了制作的精髓！',
  ],
  C: [
    '🧵 慢工出细活，耐心是最好的匠人！',
    '🍂 时间沉淀品质，用心之作，令人敬佩！',
    '🌿 按自己的节奏来，手作的意义在于过程！',
    '📚 第一次尝试已经很棒了，下次一定更顺手！',
  ],
  D: [
    '💪 坚持到底就是胜利！每一件作品都是进步的见证！',
    '🌱 没关系，熟能生巧，下次一定会更快更好！',
    '❤️ 手工的温度，是时间无法衡量的，你做得很好！',
    '🎁 享受过程，完成本身就是最大的收获！',
  ],
};

export class TimingService {
  private stepTimings: Map<number, StepTiming> = new Map();
  private activeStepId: number | null = null;

  startStep(stepId: number): number {
    const existing = this.stepTimings.get(stepId);
    const accumulated = existing?.pausedAccumulated ?? existing?.elapsedSeconds ?? 0;
    const startTime = Date.now();

    this.stepTimings.set(stepId, {
      stepId,
      elapsedSeconds: accumulated,
      completed: existing?.completed ?? false,
      startedAt: startTime,
      pausedAccumulated: accumulated,
    });

    this.activeStepId = stepId;
    return startTime;
  }

  pauseStep(stepId: number): number {
    const timing = this.stepTimings.get(stepId);
    if (!timing || !timing.startedAt) {
      return timing?.elapsedSeconds ?? 0;
    }

    const sessionTime = Math.floor((Date.now() - timing.startedAt) / 1000);
    const totalSeconds = (timing.pausedAccumulated ?? 0) + sessionTime;

    this.stepTimings.set(stepId, {
      ...timing,
      elapsedSeconds: totalSeconds,
      startedAt: undefined,
      pausedAccumulated: totalSeconds,
    });

    if (this.activeStepId === stepId) {
      this.activeStepId = null;
    }

    this.saveToStorage();
    return totalSeconds;
  }

  getElapsedSeconds(stepId: number): number {
    const timing = this.stepTimings.get(stepId);
    if (!timing) return 0;

    if (timing.startedAt) {
      const sessionTime = Math.floor((Date.now() - timing.startedAt) / 1000);
      return (timing.pausedAccumulated ?? 0) + sessionTime;
    }

    return timing.elapsedSeconds;
  }

  isStepRunning(stepId: number): boolean {
    const timing = this.stepTimings.get(stepId);
    return !!timing?.startedAt;
  }

  completeStep(stepId: number): number {
    const totalSeconds = this.pauseStep(stepId);

    this.stepTimings.set(stepId, {
      stepId,
      elapsedSeconds: totalSeconds,
      completed: true,
      pausedAccumulated: totalSeconds,
    });

    if (this.activeStepId === stepId) {
      this.activeStepId = null;
    }

    this.saveToStorage();
    return totalSeconds;
  }

  resetStep(stepId: number): void {
    if (this.activeStepId === stepId) {
      this.activeStepId = null;
    }
    this.stepTimings.delete(stepId);
    this.saveToStorage();
  }

  recordStep(stepId: number, elapsedSeconds: number, completed: boolean = true): void {
    this.stepTimings.set(stepId, {
      stepId,
      elapsedSeconds,
      completed,
      pausedAccumulated: elapsedSeconds,
    });
  }

  getStepTiming(stepId: number): StepTiming | undefined {
    return this.stepTimings.get(stepId);
  }

  getAllTimings(): StepTiming[] {
    return Array.from(this.stepTimings.values());
  }

  getActiveStepId(): number | null {
    return this.activeStepId;
  }

  clear(): void {
    this.stepTimings.clear();
    this.activeStepId = null;
  }

  calculateScore(
    totalSeconds: number,
    estimatedTotalSeconds: number,
    completedSteps: number,
    totalSteps: number
  ): ScoreResult {
    const completionRate = totalSteps > 0 ? completedSteps / totalSteps : 0;

    let grade: 'A' | 'B' | 'C' | 'D';
    let numericScore: number;

    if (estimatedTotalSeconds > 0 && totalSeconds > 0) {
      const timeRatio = totalSeconds / estimatedTotalSeconds;

      if (timeRatio < 0.8 && completionRate >= 1) {
        grade = 'A';
        numericScore = Math.round(95 + Math.random() * 5);
      } else if (timeRatio <= 1.0 && completionRate >= 0.9) {
        grade = 'B';
        numericScore = Math.round(80 + Math.random() * 14);
      } else if (timeRatio <= 1.5 && completionRate >= 0.7) {
        grade = 'C';
        numericScore = Math.round(65 + Math.random() * 14);
      } else {
        grade = 'D';
        numericScore = Math.round(50 + Math.min(14, completionRate * 10));
      }
    } else {
      if (completionRate >= 1) {
        grade = 'B';
        numericScore = 85;
      } else if (completionRate >= 0.7) {
        grade = 'C';
        numericScore = 70;
      } else {
        grade = 'D';
        numericScore = Math.round(50 + completionRate * 15);
      }
    }

    const gradeDescriptions: Record<'A' | 'B' | 'C' | 'D', string> = {
      A: '卓越匠人',
      B: '优秀皮友',
      C: '合格工匠',
      D: '努力学徒',
    };

    const gradeColors: Record<'A' | 'B' | 'C' | 'D', string> = {
      A: '#C9A961',
      B: '#8B5E3C',
      C: '#6B4423',
      D: '#A67C52',
    };

    return {
      grade,
      score: numericScore,
      gradeColor: gradeColors[grade],
      gradeDescription: gradeDescriptions[grade],
    };
  }

  getEncouragement(grade: 'A' | 'B' | 'C' | 'D'): string {
    const list = encouragementsByGrade[grade];
    return list[Math.floor(Math.random() * list.length)];
  }

  calculateResult(totalSteps: number, estimatedTotalSeconds?: number): TimingResult {
    const timings = this.getAllTimings();
    const totalSeconds = timings.reduce((sum, t) => sum + t.elapsedSeconds, 0);
    const completedSteps = timings.filter((t) => t.completed).length;
    const completionRate = totalSteps > 0 ? completedSteps / totalSteps : 0;
    const estimated = estimatedTotalSeconds ?? 0;
    const timeRatio = estimated > 0 ? totalSeconds / estimated : 0;

    const scoreResult = this.calculateScore(
      totalSeconds,
      estimated,
      completedSteps,
      totalSteps
    );

    return {
      totalSeconds,
      estimatedTotalSeconds: estimated,
      completedSteps,
      totalSteps,
      completionRate,
      timeRatio,
      score: scoreResult,
      encouragement: this.getEncouragement(scoreResult.grade),
      formattedTime: this.formatTime(totalSeconds),
      formattedEstimatedTime: this.formatTime(estimated),
      stepDetails: timings,
    };
  }

  formatTime(totalSeconds: number): string {
    if (totalSeconds <= 0) return '0秒';
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
    const serializable: [number, StepTiming][] = Array.from(
      this.stepTimings.entries()
    ).map(([id, timing]) => [
      id,
      {
        ...timing,
        startedAt: undefined,
      },
    ]);
    localStorage.setItem(key, JSON.stringify(serializable));
  }

  loadFromStorage(key: string = 'leather_timing'): void {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const entries = JSON.parse(data) as [number, StepTiming][];
        this.stepTimings = new Map(
          entries.map(([id, timing]) => [
            id,
            {
              ...timing,
              pausedAccumulated: timing.pausedAccumulated ?? timing.elapsedSeconds,
            },
          ])
        );
        this.activeStepId = null;
      } catch {
        this.stepTimings.clear();
        this.activeStepId = null;
      }
    }
  }
}

export const timingService = new TimingService();
