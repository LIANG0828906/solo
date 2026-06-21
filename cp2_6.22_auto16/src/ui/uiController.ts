import { Base } from '../core/baseManager';

interface StatsData {
  totalHarvested: { iron: number; crystal: number; gas: number };
  piratesDefeated: number;
  runTime: number;
  fleetCount: number;
  baseCount: number;
}

interface FleetData {
  id: string;
  shipCount: number;
  status: string;
  targetResourceId?: string;
  targetBaseId?: string;
  cargo: { iron: number; crystal: number; gas: number };
  x: number;
  y: number;
}

interface Elements {
  statsPanel: HTMLElement | null;
  baseList: HTMLElement | null;
  fleetList: HTMLElement | null;
  minimap: HTMLCanvasElement | null;
  baseSelect: HTMLSelectElement | null;
  shipCountInput: HTMLInputElement | null;
  targetTypeSelect: HTMLSelectElement | null;
  createFleetBtn: HTMLButtonElement | null;
  mainCanvas: HTMLCanvasElement | null;
  popupContainer: HTMLElement | null;
}

export class UIController {
  elements: Elements;
  lastStats: StatsData;
  animFrame: number;
  private animatingStats: Map<string, { from: number; to: number; startTime: number; element: HTMLElement }>;

  constructor() {
    this.elements = {
      statsPanel: document.getElementById('stats-panel'),
      baseList: document.getElementById('base-list'),
      fleetList: document.getElementById('fleet-list'),
      minimap: document.getElementById('minimap') as HTMLCanvasElement | null,
      baseSelect: document.getElementById('base-select') as HTMLSelectElement | null,
      shipCountInput: document.getElementById('ship-count') as HTMLInputElement | null,
      targetTypeSelect: document.getElementById('target-type') as HTMLSelectElement | null,
      createFleetBtn: document.getElementById('create-fleet-btn') as HTMLButtonElement | null,
      mainCanvas: document.getElementById('main-canvas') as HTMLCanvasElement | null,
      popupContainer: document.getElementById('popup-container') || document.body
    };
    this.lastStats = {
      totalHarvested: { iron: 0, crystal: 0, gas: 0 },
      piratesDefeated: 0,
      runTime: 0,
      fleetCount: 0,
      baseCount: 0
    };
    this.animFrame = 0;
    this.animatingStats = new Map();
  }

  bindEvents(onCreateFleet: () => void): void {
    if (this.elements.createFleetBtn) {
      this.elements.createFleetBtn.addEventListener('click', onCreateFleet);
    }
  }

  getSelectedBaseId(): string {
    return this.elements.baseSelect?.value || '';
  }

  getSelectedShipCount(): number {
    return parseInt(this.elements.shipCountInput?.value || '1', 10);
  }

  getSelectedTargetType(): string {
    return this.elements.targetTypeSelect?.value || 'resource';
  }

  populateBaseSelect(bases: Base[]): void {
    if (!this.elements.baseSelect) return;
    const currentValue = this.elements.baseSelect.value;
    this.elements.baseSelect.innerHTML = '';
    for (const base of bases) {
      const option = document.createElement('option');
      option.value = base.id;
      option.textContent = base.name;
      this.elements.baseSelect.appendChild(option);
    }
    if (currentValue && this.elements.baseSelect.querySelector(`option[value="${currentValue}"]`)) {
      this.elements.baseSelect.value = currentValue;
    }
  }

  updateStats(stats: StatsData): void {
    if (!this.elements.statsPanel) return;

    const statKeys = [
      { key: 'iron', selector: '#stat-iron', value: stats.totalHarvested.iron },
      { key: 'crystal', selector: '#stat-crystal', value: stats.totalHarvested.crystal },
      { key: 'gas', selector: '#stat-gas', value: stats.totalHarvested.gas },
      { key: 'pirates', selector: '#stat-pirates', value: stats.piratesDefeated },
      { key: 'fleets', selector: '#stat-fleets', value: stats.fleetCount },
      { key: 'bases', selector: '#stat-bases', value: stats.baseCount }
    ];

    for (const stat of statKeys) {
      const element = this.elements.statsPanel.querySelector(stat.selector) as HTMLElement | null;
      if (!element) continue;

      const oldValue = this.getLastStatValue(stat.key);
      if (oldValue !== stat.value) {
        this.animatingStats.set(stat.key, {
          from: oldValue,
          to: stat.value,
          startTime: performance.now(),
          element
        });
        element.classList.add('flash');
        setTimeout(() => element.classList.remove('flash'), 400);
      }
    }

    const timeElement = this.elements.statsPanel.querySelector('#stat-time') as HTMLElement | null;
    if (timeElement) {
      timeElement.textContent = this.formatTime(stats.runTime);
    }

    this.lastStats = stats;
    this.animateStats();
  }

  private getLastStatValue(key: string): number {
    switch (key) {
      case 'iron': return this.lastStats.totalHarvested.iron;
      case 'crystal': return this.lastStats.totalHarvested.crystal;
      case 'gas': return this.lastStats.totalHarvested.gas;
      case 'pirates': return this.lastStats.piratesDefeated;
      case 'fleets': return this.lastStats.fleetCount;
      case 'bases': return this.lastStats.baseCount;
      default: return 0;
    }
  }

  private animateStats(): void {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);

    const animate = () => {
      const now = performance.now();
      const duration = 400;
      let hasActive = false;

      for (const [key, anim] of this.animatingStats) {
        const elapsed = now - anim.startTime;
        if (elapsed >= duration) {
          anim.element.textContent = Math.floor(anim.to).toString();
          this.animatingStats.delete(key);
        } else {
          hasActive = true;
          const progress = elapsed / duration;
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = anim.from + (anim.to - anim.from) * eased;
          anim.element.textContent = Math.floor(current).toString();
        }
      }

      if (hasActive) {
        this.animFrame = requestAnimationFrame(animate);
      }
    };

    this.animFrame = requestAnimationFrame(animate);
  }

  renderBaseList(bases: Base[], getFleetCount: (baseId: string) => number, onUpgrade: (baseId: string) => void): void {
    if (!this.elements.baseList) return;
    this.elements.baseList.innerHTML = '';

    for (const base of bases) {
      const card = document.createElement('div');
      card.className = 'base-card';
      card.dataset.baseId = base.id;

      const header = document.createElement('div');
      header.className = 'base-card-header';

      const name = document.createElement('span');
      name.className = 'base-name';
      name.textContent = base.name;

      const levelTag = document.createElement('span');
      levelTag.className = 'level-tag';
      levelTag.textContent = `Lv.${base.level}`;

      header.appendChild(name);
      header.appendChild(levelTag);

      const resources = document.createElement('div');
      resources.className = 'base-resources';

      const iron = document.createElement('span');
      iron.className = 'resource iron';
      iron.textContent = `铁: ${base.warehouse.iron}`;

      const crystal = document.createElement('span');
      crystal.className = 'resource crystal';
      crystal.textContent = `水晶: ${base.warehouse.crystal}`;

      const gas = document.createElement('span');
      gas.className = 'resource gas';
      gas.textContent = `气: ${base.warehouse.gas}`;

      const capacity = document.createElement('span');
      capacity.className = 'resource capacity';
      capacity.textContent = `容量: ${base.warehouse.iron + base.warehouse.crystal + base.warehouse.gas}/${base.warehouse.capacity}`;

      resources.appendChild(iron);
      resources.appendChild(crystal);
      resources.appendChild(gas);
      resources.appendChild(capacity);

      const fleetCount = document.createElement('div');
      fleetCount.className = 'base-fleet-count';
      fleetCount.textContent = `舰队: ${getFleetCount(base.id)}`;

      const footer = document.createElement('div');
      footer.className = 'base-card-footer';

      const upgradeBtn = document.createElement('button');
      upgradeBtn.className = 'upgrade-btn';
      upgradeBtn.textContent = '升级';

      const cost = base.getUpgradeCost();
      if (!cost || !base.canUpgrade()) {
        upgradeBtn.disabled = true;
        if (!cost) {
          upgradeBtn.textContent = '已满级';
        } else {
          upgradeBtn.textContent = `升级 (铁:${cost.iron} 水晶:${cost.crystal} 气:${cost.gas})`;
        }
      } else {
        upgradeBtn.textContent = `升级 (铁:${cost.iron} 水晶:${cost.crystal} 气:${cost.gas})`;
        upgradeBtn.addEventListener('click', () => onUpgrade(base.id));
      }

      footer.appendChild(upgradeBtn);

      card.appendChild(header);
      card.appendChild(resources);
      card.appendChild(fleetCount);
      card.appendChild(footer);

      this.elements.baseList.appendChild(card);
    }
  }

  renderFleetList(fleets: FleetData[], getResourceById: (id: string) => { type: string } | undefined, getBaseById: (id: string) => { name: string } | undefined): void {
    if (!this.elements.fleetList) return;
    this.elements.fleetList.innerHTML = '';

    for (const fleet of fleets) {
      const card = document.createElement('div');
      card.className = 'fleet-card';
      card.dataset.fleetId = fleet.id;

      const header = document.createElement('div');
      header.className = 'fleet-card-header';

      const idSpan = document.createElement('span');
      idSpan.className = 'fleet-id';
      idSpan.textContent = `舰队 ${fleet.id}`;

      const statusTag = document.createElement('span');
      statusTag.className = `status-tag status-${fleet.status}`;
      statusTag.textContent = fleet.status;

      header.appendChild(idSpan);
      header.appendChild(statusTag);

      const ships = document.createElement('div');
      ships.className = 'fleet-ships';
      ships.textContent = `飞船: ${fleet.shipCount}`;

      const target = document.createElement('div');
      target.className = 'fleet-target';
      if (fleet.targetResourceId) {
        const res = getResourceById(fleet.targetResourceId);
        target.textContent = `目标资源: ${res?.type || fleet.targetResourceId}`;
      } else if (fleet.targetBaseId) {
        const base = getBaseById(fleet.targetBaseId);
        target.textContent = `目标基地: ${base?.name || fleet.targetBaseId}`;
      } else {
        target.textContent = '目标: 无';
      }

      const cargo = document.createElement('div');
      cargo.className = 'fleet-cargo';
      const cargoTotal = fleet.cargo.iron + fleet.cargo.crystal + fleet.cargo.gas;
      cargo.textContent = `货物: 铁${fleet.cargo.iron} 水晶${fleet.cargo.crystal} 气${fleet.cargo.gas} (总${cargoTotal})`;

      card.appendChild(header);
      card.appendChild(ships);
      card.appendChild(target);
      card.appendChild(cargo);

      this.elements.fleetList.appendChild(card);
    }
  }

  renderMinimap(gridManager: any, baseManager: any, fleetManager: any): void {
    const canvas = this.elements.minimap;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    const gridSize = gridManager?.gridSize || 100;
    const cellW = w / gridSize;
    const cellH = h / gridSize;

    if (gridManager?.resourceFields) {
      for (const field of gridManager.resourceFields) {
        const color = field.type === 'iron' ? '#8b4513' : field.type === 'crystal' ? '#4fc3f7' : '#9c27b0';
        ctx.fillStyle = color;
        ctx.fillRect(field.x * cellW - 1, field.y * cellH - 1, 2, 2);
      }
    }

    if (baseManager?.bases) {
      for (const base of baseManager.getAllBases()) {
        ctx.fillStyle = '#4caf50';
        const size = 3 + base.level;
        ctx.fillRect(base.x * cellW - size / 2, base.y * cellH - size / 2, size, size);
      }
    }

    if (fleetManager?.fleets) {
      for (const fleet of fleetManager.getAllFleets()) {
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.moveTo(fleet.x * cellW, fleet.y * cellH - 3);
        ctx.lineTo(fleet.x * cellW - 2, fleet.y * cellH + 2);
        ctx.lineTo(fleet.x * cellW + 2, fleet.y * cellH + 2);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    const viewportX = (gridManager?.viewportX || 0) * cellW;
    const viewportY = (gridManager?.viewportY || 0) * cellH;
    const viewportW = (gridManager?.viewportW || gridSize) * cellW;
    const viewportH = (gridManager?.viewportH || gridSize) * cellH;
    ctx.strokeRect(viewportX, viewportY, viewportW, viewportH);
  }

  showCombatPopup(x: number, y: number, text: string, color: string): void {
    const container = this.elements.popupContainer;
    if (!container) return;

    const popup = document.createElement('div');
    popup.className = 'combat-popup';
    popup.textContent = text;
    popup.style.position = 'absolute';
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.style.color = color;
    popup.style.pointerEvents = 'none';
    popup.style.fontWeight = 'bold';
    popup.style.fontSize = '14px';
    popup.style.textShadow = '0 0 4px rgba(0,0,0,0.8)';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.transition = 'opacity 0.3s, transform 0.3s';
    popup.style.zIndex = '1000';

    container.appendChild(popup);

    requestAnimationFrame(() => {
      popup.style.opacity = '1';
    });

    setTimeout(() => {
      popup.style.opacity = '0';
      popup.style.transform = 'translate(-50%, -80%)';
    }, 900);

    setTimeout(() => {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
    }, 1200);
  }

  showFloatingNumber(x: number, y: number, value: number, color: string): void {
    const container = this.elements.popupContainer;
    if (!container) return;

    const num = document.createElement('div');
    num.className = 'floating-number';
    num.textContent = `+${value}`;
    num.style.position = 'absolute';
    num.style.left = `${x}px`;
    num.style.top = `${y}px`;
    num.style.color = color;
    num.style.pointerEvents = 'none';
    num.style.fontWeight = 'bold';
    num.style.fontSize = '16px';
    num.style.textShadow = '0 0 4px rgba(0,0,0,0.8)';
    num.style.transform = 'translate(-50%, -50%)';
    num.style.transition = 'opacity 0.4s, transform 0.4s';
    num.style.zIndex = '1000';

    container.appendChild(num);

    requestAnimationFrame(() => {
      num.style.opacity = '1';
    });

    setTimeout(() => {
      num.style.opacity = '0';
      num.style.transform = 'translate(-50%, -100%)';
    }, 800);

    setTimeout(() => {
      if (num.parentNode) {
        num.parentNode.removeChild(num);
      }
    }, 1200);
  }

  formatTime(sec: number): string {
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
