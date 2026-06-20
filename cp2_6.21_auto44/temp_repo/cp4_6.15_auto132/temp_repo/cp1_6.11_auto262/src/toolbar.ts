import { Tablet, RankConfig, MemorialLog } from './tablet';
import { animateClickBounce, animateBorderGlow } from './animation';

export class Toolbar {
  private tablet: Tablet;
  private rankSelect: HTMLSelectElement;
  private presentBtn: HTMLButtonElement;
  private clearBtn: HTMLButtonElement;
  private reviseBtn: HTMLButtonElement;
  private logList: HTMLElement;
  private rankInfo: HTMLElement;
  private tabletMini: HTMLElement;
  private statusToast: HTMLElement;
  private logPanel: HTMLElement;
  private logToggleBtn: HTMLButtonElement;

  private stopGlowPresent: (() => void) | null = null;
  private stopGlowClear: (() => void) | null = null;
  private stopGlowRevise: (() => void) | null = null;

  constructor(tablet: Tablet) {
    this.tablet = tablet;

    this.rankSelect = document.getElementById('rankSelect') as HTMLSelectElement;
    this.presentBtn = document.getElementById('presentBtn') as HTMLButtonElement;
    this.clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
    this.reviseBtn = document.getElementById('reviseBtn') as HTMLButtonElement;
    this.logList = document.getElementById('logList') as HTMLElement;
    this.rankInfo = document.getElementById('rankInfo') as HTMLElement;
    this.tabletMini = document.getElementById('tabletMini') as HTMLElement;
    this.statusToast = document.getElementById('statusToast') as HTMLElement;
    this.logPanel = document.getElementById('logPanel') as HTMLElement;
    this.logToggleBtn = document.getElementById('logToggleBtn') as HTMLButtonElement;

    this.bindEvents();
    this.updateRankInfo(tablet.getRankConfig());
    this.updateButtons();
  }

  private bindEvents(): void {
    this.rankSelect.addEventListener('change', (e) => {
      const rank = parseInt((e.target as HTMLSelectElement).value, 10);
      this.tablet.setRank(rank);
      this.updateRankInfo(this.tablet.getRankConfig());
      this.updateButtons();
    });

    this.presentBtn.addEventListener('click', () => this.handlePresent());
    this.clearBtn.addEventListener('click', () => this.handleClear());
    this.reviseBtn.addEventListener('click', () => this.handleRevise());

    this.presentBtn.addEventListener('mousedown', () => {
      animateClickBounce(this.presentBtn);
    });
    this.clearBtn.addEventListener('mousedown', () => {
      animateClickBounce(this.clearBtn);
    });
    this.reviseBtn.addEventListener('mousedown', () => {
      animateClickBounce(this.reviseBtn);
    });

    this.presentBtn.addEventListener('mouseenter', () => {
      if (!this.presentBtn.disabled) {
        this.stopGlowPresent = animateBorderGlow(this.presentBtn, '#FFD700');
      }
    });
    this.presentBtn.addEventListener('mouseleave', () => {
      if (this.stopGlowPresent) {
        this.stopGlowPresent();
        this.stopGlowPresent = null;
      }
    });

    this.clearBtn.addEventListener('mouseenter', () => {
      if (!this.clearBtn.disabled) {
        this.stopGlowClear = animateBorderGlow(this.clearBtn, '#FFD700');
      }
    });
    this.clearBtn.addEventListener('mouseleave', () => {
      if (this.stopGlowClear) {
        this.stopGlowClear();
        this.stopGlowClear = null;
      }
    });

    this.reviseBtn.addEventListener('mouseenter', () => {
      if (!this.reviseBtn.disabled) {
        this.stopGlowRevise = animateBorderGlow(this.reviseBtn, '#FFD700');
      }
    });
    this.reviseBtn.addEventListener('mouseleave', () => {
      if (this.stopGlowRevise) {
        this.stopGlowRevise();
        this.stopGlowRevise = null;
      }
    });

    this.logToggleBtn.addEventListener('click', () => {
      this.logPanel.classList.toggle('open');
    });

    this.tablet.setOnLogUpdate((logs) => {
      this.renderLogList(logs);
    });

    this.tablet.setOnPresentComplete((annotation) => {
      this.showToast(`朱批：${annotation}`);
      this.updateButtons();
    });

    this.tablet.setOnShatter(() => {
      this.showToast('修改次数已用完，牙笏碎裂！');
      this.updateButtons();
    });

    window.addEventListener('resize', () => {
      this.checkResponsive();
    });
    this.checkResponsive();
  }

  private async handlePresent(): Promise<void> {
    if (!this.tablet.canPresent()) return;

    this.presentBtn.disabled = true;
    this.clearBtn.disabled = true;
    this.reviseBtn.disabled = true;

    try {
      await this.tablet.presentMemorial();
    } finally {
      this.updateButtons();
    }
  }

  private handleClear(): void {
    this.tablet.clearTablet();
    this.showToast('牙笏已清空');
    this.updateButtons();
  }

  private handleRevise(): void {
    const success = this.tablet.reviseMemorial();
    if (success) {
      const remaining = this.tablet.getMaxRevisions() - this.tablet.getRevisionCount();
      this.showToast(`开始修改，剩余修改次数：${remaining}`);
    }
    this.updateButtons();
  }

  private updateRankInfo(config: RankConfig): void {
    const materialNames: Record<string, string> = {
      jade: '白玉',
      wood: '檀木',
      bamboo: '竹制',
    };

    const materialClass = config.material === 'jade'
      ? 'jade-tablet'
      : config.material === 'wood'
      ? 'wood-tablet'
      : '';

    this.tabletMini.className = `tablet-mini ${materialClass}`;
    this.tabletMini.style.width = `${config.width * 0.4}px`;
    this.tabletMini.style.height = `${config.height * 0.35}px`;

    this.rankInfo.innerHTML = `
      <h4>${config.name}</h4>
      <p>材质：${materialNames[config.material] || config.material}</p>
      <p>宽度：${config.width}px</p>
      <p>纹饰：${config.decoration}</p>
      <p>格式：${config.format.header}...</p>
    `;
  }

  private updateButtons(): void {
    const canPresent = this.tablet.canPresent();
    const isShattered = this.tablet.isShatteredState();
    const revisionCount = this.tablet.getRevisionCount();
    const maxRevisions = this.tablet.getMaxRevisions();
    const hasLog = this.tablet.getLogs().length > 0;

    this.presentBtn.disabled = !canPresent;
    this.clearBtn.disabled = isShattered;
    this.reviseBtn.disabled =
      isShattered ||
      revisionCount >= maxRevisions ||
      !hasLog;
  }

  private renderLogList(logs: MemorialLog[]): void {
    if (logs.length === 0) {
      this.logList.innerHTML = '<div class="empty-log">暂无奏章记录</div>';
      return;
    }

    this.logList.innerHTML = logs
      .map((log) => {
        const date = new Date(log.timestamp);
        const dateStr = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        const stars = '★'.repeat(log.stars) + '☆'.repeat(5 - log.stars);
        const duration = log.duration.toFixed(1);
        const revisionBadge = log.revisionCount > 0
          ? `<span style="font-size:10px;color:#CC3333;">(第${log.revisionCount}次修改)</span>`
          : '';

        return `
          <div class="log-item" data-id="${log.id}">
            <div class="log-date">${dateStr}</div>
            <div class="log-rank">${log.rankName} ${revisionBadge}</div>
            <div class="log-annotation">朱批：${log.annotation}</div>
            <div class="log-stats">
              <span>${log.wordCount}字 / ${duration}秒</span>
              <span class="log-stars">${stars}</span>
            </div>
          </div>
        `;
      })
      .join('');

    this.logList.querySelectorAll('.log-item').forEach((item) => {
      item.addEventListener('click', () => {
        const logId = item.getAttribute('data-id');
        if (logId) {
          this.showToast('正在回放奏章...');
          this.tablet.replayLog(logId, 1.2).then(() => {
            this.updateButtons();
          });
        }
      });
    });
  }

  private showToast(message: string): void {
    this.statusToast.textContent = message;
    this.statusToast.classList.add('show');

    setTimeout(() => {
      this.statusToast.classList.remove('show');
    }, 2500);
  }

  private checkResponsive(): void {
    if (window.innerWidth <= 1000) {
      this.logToggleBtn.style.display = 'flex';
    } else {
      this.logToggleBtn.style.display = 'none';
      this.logPanel.classList.remove('open');
    }
  }
}
