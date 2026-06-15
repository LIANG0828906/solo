import type { Race, Unit, UnitTemplate, BattleState } from './types.js';
import { ArmyManager } from './armyManager.js';
import { BattleManager } from './battleManager.js';
import { BattleRenderer } from './renderer.js';

class GameController {
  private armyManager: ArmyManager;
  private battleManager: BattleManager;
  private renderer: BattleRenderer | null = null;

  private currentRace: Race = 'human';
  private draggedUnit: { instanceId?: string; templateId?: string } | null = null;

  private elements: Record<string, HTMLElement> = {};
  private animationFrame: number | null = null;
  private lastTime: number = 0;

  constructor() {
    this.armyManager = new ArmyManager();
    this.battleManager = new BattleManager(this.armyManager);
    this.cacheElements();
    this.bindEvents();
    this.armyManager.subscribe(() => this.renderFormationScreen());
    this.battleManager.setCallbacks(
      (state) => this.onBattleUpdate(state),
      (winner) => this.onBattleComplete(winner)
    );
  }

  private cacheElements(): void {
    this.elements = {
      formationScreen: document.getElementById('formation-screen')!,
      battleScreen: document.getElementById('battle-screen')!,
      unitList: document.getElementById('unit-list')!,
      battleGrid: document.getElementById('battle-grid')!,
      teamInfo: document.getElementById('team-info')!,
      goldDisplay: document.getElementById('gold-display')!,
      manaDisplay: document.getElementById('mana-display')!,
      roundCounter: document.getElementById('round-counter')!,
      playerTotalHp: document.getElementById('player-total-hp')!,
      enemyTotalHp: document.getElementById('enemy-total-hp')!,
      playerHpText: document.getElementById('player-hp-text')!,
      enemyHpText: document.getElementById('enemy-hp-text')!,
      battleLog: document.getElementById('battle-log')!,
      battleCanvas: document.getElementById('battle-canvas') as HTMLCanvasElement,
      startBattleBtn: document.getElementById('start-battle-btn')!,
      clearFormationBtn: document.getElementById('clear-formation-btn')!,
      endBattleBtn: document.getElementById('end-battle-btn')!,
    };
  }

  private bindEvents(): void {
    document.querySelectorAll('.race-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const race = target.dataset.race as Race;
        this.switchRace(race);
        this.createSonicClick(e as MouseEvent);
      });
    });

    const slots = this.elements.battleGrid.querySelectorAll('.grid-slot');
    slots.forEach(slot => {
      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        slot.classList.add('drag-over');
      });
      slot.addEventListener('dragleave', () => {
        slot.classList.remove('drag-over');
      });
      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        this.handleDrop(e, parseInt(slot.dataset.slot || '0'));
      });
      slot.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('remove-btn')) {
          const slotIndex = parseInt(slot.dataset.slot || '0');
          this.armyManager.removeUnitFromFormation(slotIndex);
          this.createSonicClick(e);
        }
      });
    });

    this.elements.startBattleBtn.addEventListener('click', (e) => {
      this.createSonicClick(e as MouseEvent);
      this.startBattle();
    });

    this.elements.clearFormationBtn.addEventListener('click', (e) => {
      this.createSonicClick(e as MouseEvent);
      this.armyManager.clearFormation();
    });

    this.elements.endBattleBtn.addEventListener('click', (e) => {
      this.createSonicClick(e as MouseEvent);
      this.exitBattle();
    });

    window.addEventListener('resize', () => this.handleResize());
  }

  init(): void {
    this.renderFormationScreen();
  }

  private switchRace(race: Race): void {
    this.currentRace = race;
    document.querySelectorAll('.race-tab').forEach(tab => {
      const t = tab as HTMLElement;
      t.classList.toggle('active', t.dataset.race === race);
    });
    this.renderUnitList();
  }

  private renderFormationScreen(): void {
    this.updateResourcesDisplay();
    this.renderUnitList();
    this.renderBattleGrid();
    this.renderTeamInfo();
  }

  private updateResourcesDisplay(): void {
    const resources = this.armyManager.getResources();
    this.elements.goldDisplay.textContent = String(resources.gold);
    this.elements.manaDisplay.textContent = String(resources.mana);
  }

  private renderUnitList(): void {
    const templates = this.armyManager.getTemplatesByRace(this.currentRace);
    const recruited = this.armyManager.getRecruitedUnits();

    const html = templates.map(template => {
      const existingUnit = recruited.find(u => u.templateId === template.id);
      const isRecruited = !!existingUnit;

      const recruitCost = this.armyManager.getRecruitCost(template);
      const canRecruit = this.armyManager.canRecruit(template);

      let actionsHtml = '';
      let unitLevelHtml = '';
      let stats = template.baseStats;

      if (isRecruited && existingUnit) {
        const upgradeCost = this.armyManager.getUpgradeCost(existingUnit);
        const canUpgrade = this.armyManager.canUpgrade(existingUnit);
        const isMaxLevel = existingUnit.level >= 5;

        unitLevelHtml = `<div class="unit-level">等级 ${existingUnit.level} / 5</div>`;
        stats = existingUnit.stats;

        actionsHtml = `
          <div class="unit-actions">
            <button class="btn btn-card btn-secondary"
                    data-action="place"
                    data-template-id="${template.id}"
                    data-instance-id="${existingUnit.instanceId}"
                    ${this.armyManager.getFormationCount() >= 6 ? 'disabled' : ''}>
              布置
            </button>
            ${!isMaxLevel ? `
              <button class="btn btn-card btn-primary"
                      data-action="upgrade"
                      data-instance-id="${existingUnit.instanceId}"
                      ${!canUpgrade ? 'disabled' : ''}>
                升级
                <div class="cost-info">
                  <span class="gold">◈${upgradeCost.gold}</span>
                  <span class="mana">✧${upgradeCost.mana}</span>
                </div>
              </button>
            ` : '<div class="cost-info" style="flex:1">已满级</div>'}
          </div>
        `;
      } else {
        actionsHtml = `
          <div class="unit-actions">
            <button class="btn btn-card btn-secondary"
                    data-action="recruit"
                    data-template-id="${template.id}"
                    ${!canRecruit ? 'disabled' : ''}>
              招募
              <div class="cost-info">
                <span class="gold">◈${recruitCost.gold}</span>
                <span class="mana">✧${recruitCost.mana}</span>
              </div>
            </button>
          </div>
        `;
      }

      return `
        <div class="unit-card"
             data-race="${template.race}"
             draggable="true"
             data-template-id="${template.id}"
             ${existingUnit ? `data-instance-id="${existingUnit.instanceId}"` : ''}>
          <div class="unit-card-header">
            <div class="unit-icon" style="background: ${template.color};">${template.icon}</div>
            <div class="unit-info">
              <div class="unit-name">${template.name}</div>
              ${unitLevelHtml}
            </div>
          </div>
          <div class="unit-stats">
            <div class="stat"><span class="stat-label">生命</span><span class="stat-value">${stats.hp}</span></div>
            <div class="stat"><span class="stat-label">攻击</span><span class="stat-value">${stats.attack}</span></div>
            <div class="stat"><span class="stat-label">防御</span><span class="stat-value">${stats.defense}</span></div>
            <div class="stat"><span class="stat-label">速度</span><span class="stat-value">${stats.speed}</span></div>
          </div>
          <div class="unit-skill">【${template.skill.name}】${template.skill.description}</div>
          ${actionsHtml}
        </div>
      `;
    }).join('');

    this.elements.unitList.innerHTML = html;

    this.elements.unitList.querySelectorAll('.unit-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        const el = e.currentTarget as HTMLElement;
        card.classList.add('dragging');
        this.draggedUnit = {
          instanceId: el.dataset.instanceId,
          templateId: el.dataset.templateId
        };
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        this.draggedUnit = null;
      });
    });

    this.elements.unitList.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const el = e.currentTarget as HTMLElement;
        const action = el.dataset.action!;
        const templateId = el.dataset.templateId!;
        const instanceId = el.dataset.instanceId;

        this.createSonicClick(e as MouseEvent);

        switch (action) {
          case 'recruit':
            this.armyManager.recruitUnit(templateId);
            break;
          case 'upgrade':
            if (instanceId) this.armyManager.upgradeUnit(instanceId);
            break;
          case 'place':
            if (instanceId) {
              const formation = this.armyManager.getFormation();
              const emptySlot = formation.findIndex(s => s === null);
              if (emptySlot !== -1) {
                this.armyManager.placeUnit(instanceId, emptySlot);
              }
            }
            break;
        }
      });
    });
  }

  private renderBattleGrid(): void {
    const formation = this.armyManager.getFormation();
    const slots = this.elements.battleGrid.querySelectorAll('.grid-slot');

    slots.forEach((slot, index) => {
      const unit = formation[index];
      slot.classList.remove('occupied');
      slot.removeAttribute('data-race');

      if (unit) {
        slot.classList.add('occupied');
        slot.setAttribute('data-race', unit.race);

        const hpPercent = Math.round((unit.currentHp / unit.stats.hp) * 100);
        slot.innerHTML = `
          <button class="remove-btn" title="移出布阵">×</button>
          <div class="grid-unit" draggable="true" data-instance-id="${unit.instanceId}">
            <div class="grid-unit-icon" style="background: ${unit.color};">${unit.icon}</div>
            <div class="grid-unit-name">${unit.name}</div>
            <div class="grid-unit-level">Lv.${unit.level}</div>
            <div class="hp-bar" style="position: relative;">
              <div class="hp-fill" style="width: ${hpPercent}%;"></div>
            </div>
          </div>
        `;

        const gridUnit = slot.querySelector('.grid-unit') as HTMLElement;
        gridUnit.addEventListener('dragstart', (e) => {
          this.draggedUnit = { instanceId: unit.instanceId };
          (e.currentTarget as HTMLElement).style.opacity = '0.5';
        });
        gridUnit.addEventListener('dragend', (e) => {
          (e.currentTarget as HTMLElement).style.opacity = '1';
          this.draggedUnit = null;
        });
      } else {
        slot.innerHTML = '';
      }
    });
  }

  private renderTeamInfo(): void {
    const formation = this.armyManager.getActiveFormation();
    const formationCount = this.armyManager.getFormationCount();

    const totalStats = formation.reduce((acc, u) => {
      acc.hp += u.stats.hp;
      acc.attack += u.stats.attack;
      acc.defense += u.stats.defense;
      return acc;
    }, { hp: 0, attack: 0, defense: 0 });

    let html = `
      <div class="team-summary">
        <div>已布阵: <strong>${formationCount}/6</strong></div>
        <div>总生命: <strong>${totalStats.hp}</strong></div>
        <div>总攻击: <strong>${totalStats.attack}</strong></div>
        <div>总防御: <strong>${totalStats.defense}</strong></div>
      </div>
    `;

    html += formation.map(unit => `
      <div class="team-unit">
        <div class="team-unit-icon" style="background: ${unit.color};">${unit.icon}</div>
        <div>
          <div><strong>${unit.name}</strong> Lv.${unit.level}</div>
          <div style="font-size:11px; color:var(--text-secondary);">
            HP:${unit.stats.hp} ATK:${unit.stats.attack} DEF:${unit.stats.defense}
          </div>
        </div>
      </div>
    `).join('');

    if (formation.length === 0) {
      html += `<div style="color:var(--text-secondary); text-align:center; padding:20px;">
        尚未布置任何单位<br>
        <span style="font-size:12px;">拖拽兵种卡片或点击"布置"按钮</span>
      </div>`;
    }

    this.elements.teamInfo.innerHTML = html;
  }

  private handleDrop(e: DragEvent, slotIndex: number): void {
    if (!this.draggedUnit) return;

    if (this.draggedUnit.instanceId) {
      const result = this.armyManager.placeUnit(this.draggedUnit.instanceId, slotIndex);
      if (!result.success) {
        this.showToast(result.message);
      }
    } else if (this.draggedUnit.templateId) {
      const result = this.armyManager.recruitUnit(this.draggedUnit.templateId);
      if (result.success && result.unit) {
        const placeResult = this.armyManager.placeUnit(result.unit.instanceId, slotIndex);
        if (!placeResult.success) {
          this.showToast(placeResult.message);
        }
      } else if (!result.success) {
        this.showToast(result.message);
      }
    }
  }

  private startBattle(): void {
    if (!this.renderer) {
      this.renderer = new BattleRenderer(this.elements.battleCanvas as HTMLCanvasElement);
    }

    const canvas = this.elements.battleCanvas as HTMLCanvasElement;
    const result = this.battleManager.startBattle(canvas.width, canvas.height);

    if (!result.success) {
      this.showToast(result.message || '无法开始战斗');
      return;
    }

    this.showScreen('battle');
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private exitBattle(): void {
    this.battleManager.stopBattle();
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.showScreen('formation');
  }

  private showScreen(screen: 'formation' | 'battle'): void {
    this.elements.formationScreen.classList.toggle('hidden', screen === 'battle');
    this.elements.battleScreen.classList.toggle('hidden', screen === 'formation');
  }

  private onBattleUpdate(state: BattleState): void {
    this.elements.roundCounter.textContent = `回合 ${state.round}`;

    const stats = this.battleManager.getTeamStats();
    const playerPercent = stats.playerTotal > 0 ? (stats.playerCurrent / stats.playerTotal) * 100 : 0;
    const enemyPercent = stats.enemyTotal > 0 ? (stats.enemyCurrent / stats.enemyTotal) * 100 : 0;

    this.elements.playerTotalHp.style.width = `${playerPercent}%`;
    this.elements.enemyTotalHp.style.width = `${enemyPercent}%`;
    this.elements.playerHpText.textContent = `${stats.playerCurrent}/${stats.playerTotal}`;
    this.elements.enemyHpText.textContent = `${stats.enemyCurrent}/${stats.enemyTotal}`;

    this.updateBattleLog(state);
  }

  private updateBattleLog(state: BattleState): void {
    const logEl = this.elements.battleLog;
    const existingEntries = logEl.querySelectorAll('.log-entry').length;

    if (state.log.length > existingEntries) {
      const fragment = document.createDocumentFragment();
      for (let i = existingEntries; i < state.log.length; i++) {
        const entry = state.log[i];
        const div = document.createElement('div');
        div.className = `log-entry ${entry.type}`;
        div.textContent = `[R${entry.round}] ${entry.message}`;
        fragment.appendChild(div);
      }
      logEl.appendChild(fragment);
      logEl.scrollTop = logEl.scrollHeight;
    }
  }

  private onBattleComplete(winner: 'player' | 'enemy'): void {
    this.showToast(winner === 'player' ? '战斗胜利！恭喜！' : '战斗失败，再接再厉！');
  }

  private gameLoop(): void {
    const now = performance.now();
    const deltaTime = Math.min(now - this.lastTime, 50);
    this.lastTime = now;

    this.battleManager.updateAnimations(deltaTime);

    const state = this.battleManager.getState();
    if (state && this.renderer) {
      this.renderer.render(state);
    }

    this.animationFrame = requestAnimationFrame(() => this.gameLoop());
  }

  private handleResize(): void {
    const canvas = this.elements.battleCanvas as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && this.renderer) {
      this.renderer.resize(Math.floor(rect.width), Math.floor(rect.height));
    }
  }

  private showToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-panel);
      color: var(--text-primary);
      padding: 14px 28px;
      border-radius: 8px;
      border: 2px solid var(--accent-red);
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      z-index: 10000;
      font-weight: bold;
      font-size: 14px;
      animation: fadeIn 0.3s ease-out;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'all 0.3s ease-in-out';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  private createSonicClick(e: MouseEvent): void {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const sonic = document.createElement('div');
    sonic.className = 'sonic-click';
    sonic.style.left = `${rect.left + rect.width / 2 - 5}px`;
    sonic.style.top = `${rect.top + rect.height / 2 - 5}px`;
    document.body.appendChild(sonic);
    setTimeout(() => sonic.remove(), 400);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const game = new GameController();
  game.init();
});
