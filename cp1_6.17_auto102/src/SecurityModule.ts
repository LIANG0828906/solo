import { BandParams, eventBus, EventType, spectrumEngine } from './SpectrumEngine';

export interface SecurityStatus {
  firewall: {
    breached: boolean;
    progress: number;
    threshold: { min: number; max: number; duration: number };
    holdTime: number;
  };
  ids: {
    breached: boolean;
    progress: number;
    threshold: { min: number; max: number; phaseDiff: number; duration: number };
    holdTime: number;
  };
  encryption: {
    breached: boolean;
    progress: number;
    threshold: { duration: number };
    holdTime: number;
  };
  alertActive: boolean;
  alertLogs: string[];
}

export type DefenseLayer = 'firewall' | 'ids' | 'encryption';

class SecurityModule {
  private status: SecurityStatus;
  private lastAlertTime: number = 0;
  private readonly alertInterval: number = 3000;
  private readonly alertDuration: number = 1000;
  private readonly deltaTime: number = 16;

  constructor() {
    this.status = {
      firewall: {
        breached: false,
        progress: 0,
        threshold: { min: 3, max: 7, duration: 2000 },
        holdTime: 0,
      },
      ids: {
        breached: false,
        progress: 0,
        threshold: { min: 20, max: 40, phaseDiff: 45, duration: 1500 },
        holdTime: 0,
      },
      encryption: {
        breached: false,
        progress: 0,
        threshold: { duration: 3000 },
        holdTime: 0,
      },
      alertActive: false,
      alertLogs: [],
    };

    eventBus.on(EventType.PARAMS_CHANGED, this.onParamsChanged.bind(this));
  }

  private onParamsChanged(data: unknown): void {
    const params = data as BandParams;
    this.checkDefenseLayers(params);
    this.checkAlerts();
  }

  private checkDefenseLayers(params: BandParams): void {
    this.checkFirewall(params);
    this.checkIds(params);
    this.checkEncryption(params);
    this.checkGameWon();
  }

  private checkFirewall(params: BandParams): void {
    if (this.status.firewall.breached) return;

    const { low } = params;
    const inRange = low.frequency >= 3 && low.frequency <= 7 && low.intensity > 30;

    if (inRange) {
      this.status.firewall.holdTime += this.deltaTime;
      this.status.firewall.progress = Math.min(
        100,
        (this.status.firewall.holdTime / this.status.firewall.threshold.duration) * 100
      );

      if (this.status.firewall.holdTime >= this.status.firewall.threshold.duration) {
        this.breachDefense('firewall');
      }
    } else {
      this.status.firewall.holdTime = Math.max(0, this.status.firewall.holdTime - this.deltaTime * 2);
      this.status.firewall.progress = Math.max(
        0,
        (this.status.firewall.holdTime / this.status.firewall.threshold.duration) * 100
      );
    }
  }

  private checkIds(params: BandParams): void {
    if (this.status.ids.breached) return;

    const { mid, low } = params;
    const phaseDiff = Math.abs(mid.phase - low.phase);
    const inRange =
      mid.frequency >= 20 &&
      mid.frequency <= 40 &&
      mid.intensity > 40 &&
      Math.abs(phaseDiff - 45) < 10;

    if (inRange) {
      this.status.ids.holdTime += this.deltaTime;
      this.status.ids.progress = Math.min(
        100,
        (this.status.ids.holdTime / this.status.ids.threshold.duration) * 100
      );

      if (this.status.ids.holdTime >= this.status.ids.threshold.duration) {
        this.breachDefense('ids');
      }
    } else {
      this.status.ids.holdTime = Math.max(0, this.status.ids.holdTime - this.deltaTime * 2);
      this.status.ids.progress = Math.max(
        0,
        (this.status.ids.holdTime / this.status.ids.threshold.duration) * 100
      );
    }
  }

  private checkEncryption(params: BandParams): void {
    if (this.status.encryption.breached) return;

    const { low, mid, high } = params;
    const allActive =
      low.intensity > 50 &&
      mid.intensity > 50 &&
      high.intensity > 50 &&
      low.frequency >= 4 &&
      low.frequency <= 6 &&
      mid.frequency >= 28 &&
      mid.frequency <= 32 &&
      high.frequency >= 70 &&
      high.frequency <= 80;

    if (allActive) {
      this.status.encryption.holdTime += this.deltaTime;
      this.status.encryption.progress = Math.min(
        100,
        (this.status.encryption.holdTime / this.status.encryption.threshold.duration) * 100
      );

      if (this.status.encryption.holdTime >= this.status.encryption.threshold.duration) {
        this.breachDefense('encryption');
      }
    } else {
      this.status.encryption.holdTime = Math.max(0, this.status.encryption.holdTime - this.deltaTime * 2);
      this.status.encryption.progress = Math.max(
        0,
        (this.status.encryption.holdTime / this.status.encryption.threshold.duration) * 100
      );
    }
  }

  private breachDefense(layer: DefenseLayer): void {
    this.status[layer].breached = true;
    this.status[layer].progress = 100;

    const messages: Record<DefenseLayer, string> = {
      firewall: '防火墙已渗透',
      ids: '入侵检测已绕过',
      encryption: '数据加密已解密',
    };

    eventBus.emit(EventType.DEFENSE_BREACHED, {
      layer,
      message: messages[layer],
    });

    this.addLog(`[SUCCESS] ${messages[layer]}`);
  }

  private checkAlerts(): void {
    const now = Date.now();

    if (!this.status.alertActive && now - this.lastAlertTime > this.alertInterval) {
      if (Math.random() < 0.3) {
        this.triggerAlert();
      }
    }

    if (this.status.alertActive && now - this.lastAlertTime > this.alertDuration) {
      this.status.alertActive = false;
    }
  }

  private triggerAlert(): void {
    this.status.alertActive = true;
    this.lastAlertTime = Date.now();

    spectrumEngine.resetEnergy(50);

    eventBus.emit(EventType.SECURITY_ALERT, {
      message: '安全警报：异常能量波动检测',
      timestamp: new Date().toLocaleTimeString(),
    });

    this.addLog(`[ALERT] 安全警报：异常能量波动检测 - ${new Date().toLocaleTimeString()}`);
  }

  private addLog(message: string): void {
    this.status.alertLogs.unshift(message);
    if (this.status.alertLogs.length > 50) {
      this.status.alertLogs.pop();
    }
  }

  private checkGameWon(): void {
    if (
      this.status.firewall.breached &&
      this.status.ids.breached &&
      this.status.encryption.breached
    ) {
      eventBus.emit(EventType.GAME_WON, null);
    }
  }

  getStatus(): SecurityStatus {
    return JSON.parse(JSON.stringify(this.status));
  }

  reset(): void {
    this.status = {
      firewall: {
        breached: false,
        progress: 0,
        threshold: { min: 3, max: 7, duration: 2000 },
        holdTime: 0,
      },
      ids: {
        breached: false,
        progress: 0,
        threshold: { min: 20, max: 40, phaseDiff: 45, duration: 1500 },
        holdTime: 0,
      },
      encryption: {
        breached: false,
        progress: 0,
        threshold: { duration: 3000 },
        holdTime: 0,
      },
      alertActive: false,
      alertLogs: [],
    };
    this.lastAlertTime = 0;
  }
}

export const securityModule = new SecurityModule();
