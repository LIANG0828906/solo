import { v4 as uuidv4 } from 'uuid';

export type SystemType = 'shield' | 'weapon' | 'engine' | 'lifeSupport';

export interface EnergyAllocation {
  shield: number;
  weapon: number;
  engine: number;
  lifeSupport: number;
}

export interface SystemStatus {
  shield: number;
  weapon: number;
  engine: number;
  lifeSupport: number;
}

export type ThreatType = 'asteroid' | 'enemy' | 'leak' | 'pirate' | 'solarFlare';

export interface ThreatEvent {
  id: string;
  type: ThreatType;
  name: string;
  description: string;
  damage: Partial<Record<SystemType, number>>;
  hp: number;
  timestamp: number;
}

export type LogType = 'threat' | 'effect' | 'system' | 'warning' | 'victory' | 'defeat';

export interface LogEntry {
  id: string;
  type: LogType;
  message: string;
  timestamp: number;
}

export type GamePhase = 'playing' | 'victory' | 'defeat';

interface ThreatTemplate {
  type: ThreatType;
  name: string;
  descriptions: string[];
  damageRange: Partial<Record<SystemType, [number, number]>>;
  hpRange: [number, number];
}

const THREAT_TEMPLATES: ThreatTemplate[] = [
  {
    type: 'asteroid',
    name: '小行星带',
    descriptions: [
      '发现密集小行星带 - 护盾受到冲击',
      '小行星群逼近 - 全舰注意防护',
      '陨石撞击警告 - 启动护盾协议',
    ],
    damageRange: { shield: [15, 30], engine: [5, 12] },
    hpRange: [20, 40],
  },
  {
    type: 'enemy',
    name: '敌方巡洋舰',
    descriptions: [
      '敌方巡洋舰锁定本舰 - 武器系统准备',
      '检测到敌对目标 - 进入战斗状态',
      '敌军战舰出现 - 建议提升武器能量',
    ],
    damageRange: { shield: [10, 25], weapon: [8, 18], engine: [3, 8] },
    hpRange: [35, 60],
  },
  {
    type: 'leak',
    name: '能源泄漏',
    descriptions: [
      '主能源管道泄漏 - 生命维持告急',
      '辐射泄漏警报 - 船员区域受损',
      '舱室破损 - 氧气流失中',
    ],
    damageRange: { lifeSupport: [18, 35], shield: [5, 12] },
    hpRange: [15, 30],
  },
  {
    type: 'pirate',
    name: '太空海盗',
    descriptions: [
      '太空海盗突袭 - 全舰戒备',
      '海盗舰队包围本舰 - 准备战斗',
      '检测到掠夺者信号 - 防御系统启动',
    ],
    damageRange: { weapon: [12, 25], shield: [10, 20], lifeSupport: [5, 10] },
    hpRange: [25, 45],
  },
  {
    type: 'solarFlare',
    name: '太阳耀斑',
    descriptions: [
      '强烈太阳耀斑来袭 - 电子系统受损',
      '电磁风暴警告 - 引擎效率下降',
      '高能粒子流冲击 - 全系统过载',
    ],
    damageRange: { engine: [15, 28], weapon: [8, 18], shield: [6, 15] },
    hpRange: [30, 50],
  },
];

export class GameEngine {
  private status: SystemStatus = { shield: 100, weapon: 100, engine: 100, lifeSupport: 100 };
  private phase: GamePhase = 'playing';
  private activeThreat: ThreatEvent | null = null;
  private threatTimer: ReturnType<typeof setTimeout> | null = null;
  private threatsSurvived = 0;
  private threatsDefeated = 0;
  private readonly victoryThreshold = 10;
  private readonly defeatThreshold = 0;

  onStatusChange: ((status: SystemStatus) => void) | null = null;
  onLogEntry: ((entry: LogEntry) => void) | null = null;
  onPhaseChange: ((phase: GamePhase) => void) | null = null;
  onThreatGenerated: ((threat: ThreatEvent) => void) | null = null;
  onActiveThreatChange: ((threat: ThreatEvent | null) => void) | null = null;

  start(): void {
    this.status = { shield: 100, weapon: 100, engine: 100, lifeSupport: 100 };
    this.phase = 'playing';
    this.activeThreat = null;
    this.threatsSurvived = 0;
    this.threatsDefeated = 0;
    this.notifyStatus();
    this.notifyPhase();
    this.addLog('system', '星舰系统启动完毕，能量分配就绪。祝好运，舰长。');
    this.scheduleNextThreat();
  }

  stop(): void {
    if (this.threatTimer) {
      clearTimeout(this.threatTimer);
      this.threatTimer = null;
    }
  }

  getCurrentStatus(): SystemStatus {
    return { ...this.status };
  }

  getActiveThreat(): ThreatEvent | null {
    return this.activeThreat;
  }

  getPhase(): GamePhase {
    return this.phase;
  }

  getStats() {
    return { survived: this.threatsSurvived, defeated: this.threatsDefeated };
  }

  executeTurn(allocation: EnergyAllocation): void {
    if (this.phase !== 'playing') return;

    setTimeout(() => {
      this.processTurn(allocation);
    }, 1000);
  }

  private processTurn(allocation: EnergyAllocation): void {
    const total = allocation.shield + allocation.weapon + allocation.engine + allocation.lifeSupport;
    if (total !== 100) {
      this.addLog('warning', `能量分配异常：总计 ${total} 单位，应为 100 单位`);
      return;
    }

    const threat = this.activeThreat;
    if (!threat) {
      this.applyLifeSupportRecovery(allocation);
      this.notifyStatus();
      this.addLog('system', '空闲扫描中，全系统状态良好。');
      return;
    }

    const dodgeChance = Math.min(allocation.engine * 0.005, 0.35);
    if (Math.random() < dodgeChance) {
      this.addLog('effect', `引擎机动成功！闪避了 ${threat.name} 的攻击。`);
      this.removeThreat(true);
      this.threatsDefeated++;
      this.applyLifeSupportRecovery(allocation);
      this.checkVictory();
      this.notifyStatus();
      return;
    }

    const weaponDamage = allocation.weapon * 1.2;
    threat.hp -= weaponDamage;
    this.addLog('effect', `武器系统输出 ${weaponDamage.toFixed(0)} 点反击伤害。`);

    if (threat.hp <= 0) {
      this.addLog('effect', `成功摧毁 ${threat.name}！`);
      this.removeThreat(true);
      this.threatsDefeated++;
      this.applyLifeSupportRecovery(allocation);
      this.checkVictory();
      this.notifyStatus();
      return;
    }

    this.applyDamage(threat.damage, allocation);
    this.addLog('effect', `${threat.name} 剩余强度 ${Math.max(0, threat.hp).toFixed(0)}，继续分配能量应对！`);
    this.applyLifeSupportRecovery(allocation);
    this.checkDefeat();
    this.notifyStatus();
  }

  private applyDamage(damage: Partial<Record<SystemType, number>>, allocation: EnergyAllocation): void {
    const damageReduction = Math.min(allocation.shield * 0.01, 0.7);

    for (const sys of Object.keys(damage) as SystemType[]) {
      const rawDamage = damage[sys] || 0;
      const reducedDamage = sys === 'shield'
        ? rawDamage * (1 - damageReduction * 0.6)
        : rawDamage * (1 - damageReduction);

      const actualDamage = Math.max(0, reducedDamage);
      this.status[sys] = Math.max(0, this.status[sys] - actualDamage);
      this.addLog('effect', `${this.systemName(sys)} 受到 ${actualDamage.toFixed(1)} 点损伤。`);

      if (this.status[sys] <= 20) {
        this.addLog('warning', `警告：${this.systemName(sys)} 能量低于 20%！`);
      }
    }
  }

  private applyLifeSupportRecovery(allocation: EnergyAllocation): void {
    const recovery = allocation.lifeSupport * 0.3;
    if (recovery <= 0) return;

    for (const sys of Object.keys(this.status) as SystemType[]) {
      if (this.status[sys] < 100) {
        const before = this.status[sys];
        this.status[sys] = Math.min(100, this.status[sys] + recovery);
        const healed = this.status[sys] - before;
        if (healed > 0 && sys === 'lifeSupport') {
          this.addLog('effect', `生命维持系统恢复 ${healed.toFixed(1)} 点能量。`);
        }
      }
    }
  }

  private removeThreat(notify: boolean): void {
    this.activeThreat = null;
    if (notify && this.onActiveThreatChange) {
      this.onActiveThreatChange(null);
    }
    this.scheduleNextThreat();
  }

  private scheduleNextThreat(): void {
    if (this.threatTimer) clearTimeout(this.threatTimer);
    const delay = 3000 + Math.random() * 5000;
    this.threatTimer = setTimeout(() => this.generateThreat(), delay);
  }

  private generateThreat(): void {
    if (this.phase !== 'playing') return;
    if (this.activeThreat) {
      this.threatsSurvived++;
      this.checkVictory();
    }

    const template = THREAT_TEMPLATES[Math.floor(Math.random() * THREAT_TEMPLATES.length)];
    const damage: Partial<Record<SystemType, number>> = {};

    for (const sys of Object.keys(template.damageRange) as SystemType[]) {
      const range = template.damageRange[sys]!;
      damage[sys] = range[0] + Math.random() * (range[1] - range[0]);
    }

    const [hpMin, hpMax] = template.hpRange;
    const hp = hpMin + Math.random() * (hpMax - hpMin);
    const desc = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];

    const threat: ThreatEvent = {
      id: uuidv4(),
      type: template.type,
      name: template.name,
      description: desc,
      damage,
      hp,
      timestamp: Date.now(),
    };

    this.activeThreat = threat;
    this.addLog('threat', `⚠ ${desc}`);

    if (this.onThreatGenerated) this.onThreatGenerated(threat);
    if (this.onActiveThreatChange) this.onActiveThreatChange(threat);
  }

  private checkVictory(): void {
    if (this.threatsSurvived >= this.victoryThreshold || this.threatsDefeated >= 5) {
      this.phase = 'victory';
      this.addLog('victory', `🏆 任务完成！存活威胁 ${this.threatsSurvived} 次，击退 ${this.threatsDefeated} 个威胁。`);
      this.notifyPhase();
      this.stop();
    }
  }

  private checkDefeat(): void {
    for (const sys of Object.keys(this.status) as SystemType[]) {
      if (this.status[sys] <= this.defeatThreshold) {
        this.phase = 'defeat';
        this.addLog('defeat', `💥 任务失败：${this.systemName(sys)} 系统完全崩溃！`);
        this.notifyPhase();
        this.stop();
        return;
      }
    }
  }

  private notifyStatus(): void {
    if (this.onStatusChange) this.onStatusChange({ ...this.status });
  }

  private notifyPhase(): void {
    if (this.onPhaseChange) this.onPhaseChange(this.phase);
  }

  private addLog(type: LogType, message: string): void {
    if (!this.onLogEntry) return;
    this.onLogEntry({
      id: uuidv4(),
      type,
      message,
      timestamp: Date.now(),
    });
  }

  private systemName(sys: SystemType): string {
    const map: Record<SystemType, string> = {
      shield: '护盾',
      weapon: '武器',
      engine: '引擎',
      lifeSupport: '生命维持',
    };
    return map[sys];
  }
}
