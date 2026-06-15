import type {
  Creature,
  EventBus,
  LogEntry,
  SkillType,
} from '../types';
import { SKILLS, SPECIES_INFO } from '../types';

export class InfoPanel {
  private container: HTMLElement;
  private eventBus: EventBus;
  private panel: HTMLElement;
  private header: HTMLElement;
  private content: HTMLElement;
  private selectedCreature: Creature | null = null;
  private logs: LogEntry[] = [];
  private isCollapsed = false;

  private headerTitle: HTMLElement;
  private hpBar: HTMLElement;
  private hpText: HTMLElement;
  private attackBar: HTMLElement;
  private attackText: HTMLElement;
  private speedBar: HTMLElement;
  private speedText: HTMLElement;
  private skillsContainer: HTMLElement;
  private logsContainer: HTMLElement;
  private coordinates: HTMLElement;

  private boundOnCreatureSelected: (payload: { creatureId: string | null }) => void;
  private boundOnLogAdded: (payload: { message: string; timestamp: number }) => void;
  private boundOnCreatureMoved: (payload: { creatureId: string; from: { x: number; y: number }; to: { x: number; y: number } }) => void;
  private boundOnCombatEnded: (payload: { winnerId: string; loserId: string; damage: number }) => void;
  private boundOnCreatureEvolved: (payload: { creatureId: string; newSkill: SkillType }) => void;

  private resizeHandler: (() => void) | null = null;
  private clickHandler: (() => void) | null = null;

  constructor(container: HTMLElement, eventBus: EventBus) {
    this.container = container;
    this.eventBus = eventBus;

    this.boundOnCreatureSelected = this.onCreatureSelected.bind(this);
    this.boundOnLogAdded = this.onLogAdded.bind(this);
    this.boundOnCreatureMoved = this.onCreatureMoved.bind(this);
    this.boundOnCombatEnded = this.onCombatEnded.bind(this);
    this.boundOnCreatureEvolved = this.onCreatureEvolved.bind(this);

    this.panel = document.createElement('div');
    this.header = document.createElement('div');
    this.content = document.createElement('div');
    this.headerTitle = document.createElement('div');
    this.hpBar = this.createProgressBar('hp');
    this.hpText = this.createTextElement();
    this.attackBar = this.createProgressBar('attack');
    this.attackText = this.createTextElement();
    this.speedBar = this.createProgressBar('speed');
    this.speedText = this.createTextElement();
    this.skillsContainer = document.createElement('div');
    this.logsContainer = document.createElement('div');
    this.coordinates = document.createElement('div');

    this.init();
  }

  private init(): void {
    this.injectStyles();
    this.buildPanel();
    this.attachEventListeners();
    this.container.appendChild(this.panel);
    this.checkResponsive();
  }

  private injectStyles(): void {
    const styleId = 'info-panel-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .info-panel {
        position: fixed;
        background: #16213e;
        border: 1px solid rgba(233, 69, 96, 0.3);
        color: #ffffff;
        font-family: 'Courier New', monospace;
        overflow: hidden;
        z-index: 100;
        box-sizing: border-box;
      }

      .info-panel.desktop {
        top: 0;
        right: 0;
        width: 25%;
        height: 100vh;
        border-left: 1px solid rgba(233, 69, 96, 0.3);
      }

      .info-panel.mobile {
        top: 0;
        left: 0;
        width: 100%;
        max-height: 60px;
        border-bottom: 1px solid rgba(233, 69, 96, 0.3);
        transition: max-height 0.3s ease;
      }

      .info-panel.mobile.expanded {
        max-height: 80vh;
      }

      .info-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: rgba(233, 69, 96, 0.1);
        border-bottom: 1px solid rgba(233, 69, 96, 0.3);
        cursor: default;
      }

      .info-panel.mobile .info-panel-header {
        cursor: pointer;
      }

      .info-panel-header-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
        font-weight: bold;
        color: #e94560;
      }

      .info-panel-header-icon {
        font-size: 24px;
      }

      .info-panel-toggle {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        display: none;
      }

      .info-panel.mobile .info-panel-toggle {
        display: block;
      }

      .info-panel-content {
        padding: 16px;
        overflow-y: auto;
        height: calc(100% - 49px);
        box-sizing: border-box;
      }

      .info-panel.mobile .info-panel-content {
        display: none;
      }

      .info-panel.mobile.expanded .info-panel-content {
        display: block;
      }

      .section {
        margin-bottom: 20px;
      }

      .section-title {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        margin-bottom: 8px;
        letter-spacing: 1px;
      }

      .stat-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .stat-label {
        width: 60px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
      }

      .progress-bar-container {
        flex: 1;
        height: 12px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 6px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .progress-bar {
        height: 100%;
        border-radius: 6px;
        transition: width 0.3s ease;
      }

      .progress-bar.hp {
        background: linear-gradient(90deg, #ff6b7a, #ff4757);
      }

      .progress-bar.attack {
        background: linear-gradient(90deg, #ffbe76, #ffa502);
      }

      .progress-bar.speed {
        background: linear-gradient(90deg, #5352ed, #3742fa);
      }

      .stat-text {
        width: 70px;
        text-align: right;
        font-size: 12px;
        color: #ffffff;
      }

      .skills-container {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .skill-icon {
        position: relative;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        background: rgba(233, 69, 96, 0.1);
        border: 1px solid rgba(233, 69, 96, 0.3);
        border-radius: 8px;
        cursor: help;
        transition: transform 0.2s, background 0.2s;
      }

      .skill-icon:hover {
        transform: scale(1.1);
        background: rgba(233, 69, 96, 0.2);
      }

      .skill-icon.locked {
        opacity: 0.4;
        filter: grayscale(100%);
        cursor: not-allowed;
      }

      .skill-icon.locked:hover {
        transform: none;
        background: rgba(233, 69, 96, 0.1);
      }

      .skill-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 16px;
        height: 16px;
        background: #e94560;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: #ffffff;
      }

      .skill-tooltip {
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        background: #0f0f23;
        border: 1px solid rgba(233, 69, 96, 0.5);
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 11px;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s, visibility 0.2s;
        pointer-events: none;
        z-index: 10;
      }

      .skill-icon:hover .skill-tooltip {
        opacity: 1;
        visibility: visible;
      }

      .skill-tooltip-name {
        color: #e94560;
        font-weight: bold;
        margin-bottom: 4px;
      }

      .skill-tooltip-desc {
        color: rgba(255, 255, 255, 0.8);
      }

      .logs-container {
        max-height: 150px;
        overflow-y: auto;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
        padding: 8px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .log-entry {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.7);
        padding: 4px 6px;
        margin-bottom: 2px;
        border-radius: 4px;
        opacity: 0;
        animation: fadeIn 0.2s ease forwards;
        line-height: 1.4;
      }

      .log-entry:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .coordinates {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.8);
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .coordinates-label {
        color: rgba(255, 255, 255, 0.5);
        margin-right: 8px;
      }

      .coordinates-value {
        color: #e94560;
        font-weight: bold;
      }

      .empty-state {
        color: rgba(255, 255, 255, 0.4);
        font-size: 12px;
        text-align: center;
        padding: 20px;
        font-style: italic;
      }

      .logs-container::-webkit-scrollbar,
      .info-panel-content::-webkit-scrollbar {
        width: 6px;
      }

      .logs-container::-webkit-scrollbar-track,
      .info-panel-content::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
      }

      .logs-container::-webkit-scrollbar-thumb,
      .info-panel-content::-webkit-scrollbar-thumb {
        background: rgba(233, 69, 96, 0.5);
        border-radius: 3px;
      }

      .logs-container::-webkit-scrollbar-thumb:hover,
      .info-panel-content::-webkit-scrollbar-thumb:hover {
        background: rgba(233, 69, 96, 0.7);
      }

      .section-content {
        min-height: 20px;
      }
    `;
    document.head.appendChild(style);
  }

  private buildPanel(): void {
    this.panel.className = 'info-panel';

    this.header.className = 'info-panel-header';

    const titleWrapper = document.createElement('div');
    titleWrapper.className = 'info-panel-header-title';

    const headerIcon = document.createElement('span');
    headerIcon.className = 'info-panel-header-icon';
    headerIcon.textContent = '📊';

    this.headerTitle.textContent = '信息面板';

    titleWrapper.appendChild(headerIcon);
    titleWrapper.appendChild(this.headerTitle);

    const toggleBtn = document.createElement('div');
    toggleBtn.className = 'info-panel-toggle';
    toggleBtn.textContent = '▼';
    toggleBtn.dataset.toggleIcon = 'true';

    this.header.appendChild(titleWrapper);
    this.header.appendChild(toggleBtn);

    this.content.className = 'info-panel-content';

    const statsSection = document.createElement('div');
    statsSection.className = 'section';

    const statsTitle = document.createElement('div');
    statsTitle.className = 'section-title';
    statsTitle.textContent = '属性';
    statsSection.appendChild(statsTitle);

    const statsContent = document.createElement('div');
    statsContent.className = 'section-content';

    const hpRow = document.createElement('div');
    hpRow.className = 'stat-row';
    const hpLabel = document.createElement('div');
    hpLabel.className = 'stat-label';
    hpLabel.textContent = '生命';
    hpRow.appendChild(hpLabel);
    hpRow.appendChild(this.hpBar);
    hpRow.appendChild(this.hpText);
    statsContent.appendChild(hpRow);

    const attackRow = document.createElement('div');
    attackRow.className = 'stat-row';
    const attackLabel = document.createElement('div');
    attackLabel.className = 'stat-label';
    attackLabel.textContent = '攻击';
    attackRow.appendChild(attackLabel);
    attackRow.appendChild(this.attackBar);
    attackRow.appendChild(this.attackText);
    statsContent.appendChild(attackRow);

    const speedRow = document.createElement('div');
    speedRow.className = 'stat-row';
    const speedLabel = document.createElement('div');
    speedLabel.className = 'stat-label';
    speedLabel.textContent = '速度';
    speedRow.appendChild(speedLabel);
    speedRow.appendChild(this.speedBar);
    speedRow.appendChild(this.speedText);
    statsContent.appendChild(speedRow);

    statsSection.appendChild(statsContent);
    this.content.appendChild(statsSection);

    const skillsSection = document.createElement('div');
    skillsSection.className = 'section';

    const skillsTitle = document.createElement('div');
    skillsTitle.className = 'section-title';
    skillsTitle.textContent = '技能';
    skillsSection.appendChild(skillsTitle);

    this.skillsContainer.className = 'skills-container';
    skillsSection.appendChild(this.skillsContainer);
    this.content.appendChild(skillsSection);

    const coordsSection = document.createElement('div');
    coordsSection.className = 'section';

    const coordsTitle = document.createElement('div');
    coordsTitle.className = 'section-title';
    coordsTitle.textContent = '坐标';
    coordsSection.appendChild(coordsTitle);

    this.coordinates.className = 'coordinates';
    coordsSection.appendChild(this.coordinates);
    this.content.appendChild(coordsSection);

    const logsSection = document.createElement('div');
    logsSection.className = 'section';

    const logsTitle = document.createElement('div');
    logsTitle.className = 'section-title';
    logsTitle.textContent = '日志';
    logsSection.appendChild(logsTitle);

    this.logsContainer.className = 'logs-container';
    logsSection.appendChild(this.logsContainer);
    this.content.appendChild(logsSection);

    this.panel.appendChild(this.header);
    this.panel.appendChild(this.content);

    this.updateSkills();
    this.updateStats();
    this.coordinates.innerHTML = '<span class="coordinates-label">位置:</span><span class="coordinates-value">--, --</span>';

    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = '选择一个单位查看详情';
    this.content.insertBefore(emptyState, statsSection);
    emptyState.style.display = 'block';
  }

  private createProgressBar(type: 'hp' | 'attack' | 'speed'): HTMLElement {
    const container = document.createElement('div');
    container.className = 'progress-bar-container';

    const bar = document.createElement('div');
    bar.className = `progress-bar ${type}`;
    bar.style.width = '0%';

    container.appendChild(bar);
    return container;
  }

  private createTextElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'stat-text';
    el.textContent = '--';
    return el;
  }

  private attachEventListeners(): void {
    this.eventBus.on('CREATURE_SELECTED', this.boundOnCreatureSelected);
    this.eventBus.on('LOG_ADDED', this.boundOnLogAdded);
    this.eventBus.on('CREATURE_MOVED', this.boundOnCreatureMoved);
    this.eventBus.on('COMBAT_ENDED', this.boundOnCombatEnded);
    this.eventBus.on('CREATURE_EVOLVED', this.boundOnCreatureEvolved);

    this.resizeHandler = this.checkResponsive.bind(this);
    window.addEventListener('resize', this.resizeHandler);

    this.clickHandler = this.toggleMobilePanel.bind(this);
    this.header.addEventListener('click', this.clickHandler);
  }

  private onCreatureSelected(payload: { creatureId: string | null }): void {
    const { creatureId } = payload;

    if (!creatureId) {
      this.selectedCreature = null;
      this.headerTitle.textContent = '信息面板';
      this.updateStats();
      this.updateSkills();
      this.coordinates.innerHTML = '<span class="coordinates-label">位置:</span><span class="coordinates-value">--, --</span>';

      const emptyState = this.content.querySelector('.empty-state');
      if (emptyState) {
        (emptyState as HTMLElement).style.display = 'block';
      }
      return;
    }

    const creatures = (this as any).getCreatures?.() || [];
    const creature = creatures.find((c: Creature) => c.id === creatureId);

    if (creature) {
      this.selectedCreature = creature;
      const speciesInfo = SPECIES_INFO[creature.species];
      this.headerTitle.textContent = `${speciesInfo.icon} ${speciesInfo.name}`;
      this.updateStats();
      this.updateSkills();
      this.coordinates.innerHTML = `<span class="coordinates-label">位置:</span><span class="coordinates-value">${creature.position.x}, ${creature.position.y}</span>`;

      const emptyState = this.content.querySelector('.empty-state');
      if (emptyState) {
        (emptyState as HTMLElement).style.display = 'none';
      }
    }
  }

  private onLogAdded(payload: { message: string; timestamp: number }): void {
    this.addLog(payload.message, payload.timestamp);
  }

  private onCreatureMoved(payload: { creatureId: string; from: { x: number; y: number }; to: { x: number; y: number } }): void {
    if (this.selectedCreature && this.selectedCreature.id === payload.creature) {
      this.selectedCreature.position = { ...payload.to };
      this.coordinates.innerHTML = `<span class="coordinates-label">位置:</span><span class="coordinates-value">${payload.to.x}, ${payload.to.y}</span>`;
    }
  }

  private onCombatEnded(payload: { winnerId: string; loserId: string; damage: number }): void {
    if (this.selectedCreature) {
      if (this.selectedCreature.id === payload.winnerId || this.selectedCreature.id === payload.loserId) {
        this.updateStats();
      }
    }
  }

  private onCreatureEvolved(payload: { creatureId: string; newSkill: SkillType }): void {
    if (this.selectedCreature && this.selectedCreature.id === payload.creature) {
      if (!this.selectedCreature.skills.includes(payload.newSkill)) {
        this.selectedCreature.skills.push(payload.newSkill);
      }
      this.updateSkills();
    }
  }

  private updateStats(): void {
    if (!this.selectedCreature) {
      const hpBarInner = this.hpBar.querySelector('.progress-bar');
      if (hpBarInner) hpBarInner.style.width = '0%';
      const attackBarInner = this.attackBar.querySelector('.progress-bar');
      if (attackBarInner) attackBarInner.style.width = '0%';
      const speedBarInner = this.speedBar.querySelector('.progress-bar');
      if (speedBarInner) speedBarInner.style.width = '0%';

      this.hpText.textContent = '--';
      this.attackText.textContent = '--';
      this.speedText.textContent = '--';
      return;
    }

    const { hp, maxHp, attack, speed } = this.selectedCreature;

    const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
    const hpBarInner = this.hpBar.querySelector('.progress-bar');
    if (hpBarInner) hpBarInner.style.width = `${hpPercent}%`;
    this.hpText.textContent = `${Math.floor(hp)}/${maxHp}`;

    const attackPercent = Math.max(0, Math.min(100, (attack / 100) * 100));
    const attackBarInner = this.attackBar.querySelector('.progress-bar');
    if (attackBarInner) attackBarInner.style.width = `${attackPercent}%`;
    this.attackText.textContent = `${attack}`;

    const speedPercent = Math.max(0, Math.min(100, (speed / 10) * 100));
    const speedBarInner = this.speedBar.querySelector('.progress-bar');
    if (speedBarInner) speedBarInner.style.width = `${speedPercent}%`;
    this.speedText.textContent = `${speed}`;
  }

  private updateSkills(): void {
    this.skillsContainer.innerHTML = '';

    const skillTypes = Object.keys(SKILLS) as SkillType[];

    for (const skillType of skillTypes) {
      const skill = SKILLS[skillType];
      const hasSkill = this.selectedCreature ? this.selectedCreature.skills.includes(skillType) : false;

      const skillIcon = document.createElement('div');
      skillIcon.className = `skill-icon${hasSkill ? '' : ' locked'}`;
      skillIcon.textContent = skill.icon;

      if (hasSkill) {
        const badge = document.createElement('div');
        badge.className = 'skill-badge';
        badge.textContent = '✓';
        skillIcon.appendChild(badge);
      }

      const tooltip = document.createElement('div');
      tooltip.className = 'skill-tooltip';

      const tooltipName = document.createElement('div');
      tooltipName.className = 'skill-tooltip-name';
      tooltipName.textContent = skill.name;

      const tooltipDesc = document.createElement('div');
      tooltipDesc.className = 'skill-tooltip-desc';
      tooltipDesc.textContent = skill.description;

      tooltip.appendChild(tooltipName);
      tooltip.appendChild(tooltipDesc);

      skillIcon.appendChild(tooltip);
      this.skillsContainer.appendChild(skillIcon);
    }
  }

  private addLog(message: string, timestamp: number): void {
    const logEntry: LogEntry = { message, timestamp };
    this.logs.push(logEntry);

    if (this.logs.length > 10) {
      this.logs.shift();
    }

    this.renderLogs();
  }

  private renderLogs(): void {
    this.logsContainer.innerHTML = '';

    for (const log of this.logs) {
      const logEl = document.createElement('div');
      logEl.className = 'log-entry';
      logEl.textContent = log.message;
      this.logsContainer.appendChild(logEl);
    }

    this.logsContainer.scrollTop = this.logsContainer.scrollHeight;
  }

  private checkResponsive(): void {
    if (window.innerWidth >= 768) {
      this.panel.classList.remove('mobile', 'expanded');
      this.panel.classList.add('desktop');
      this.isCollapsed = false;
    } else {
      this.panel.classList.remove('desktop');
      this.panel.classList.add('mobile');
      if (this.isCollapsed) {
        this.panel.classList.remove('expanded');
      }
    }
  }

  private toggleMobilePanel(): void {
    if (this.panel.classList.contains('mobile')) {
      this.isCollapsed = !this.isCollapsed;
      this.panel.classList.toggle('expanded');

      const toggleIcon = this.header.querySelector('[data-toggle-icon="true"]');
      if (toggleIcon) {
        toggleIcon.textContent = this.isCollapsed ? '▲' : '▼';
      }
    }
  }

  destroy(): void {
    this.eventBus.off('CREATURE_SELECTED', this.boundOnCreatureSelected);
    this.eventBus.off('LOG_ADDED', this.boundOnLogAdded);
    this.eventBus.off('CREATURE_MOVED', this.boundOnCreatureMoved);
    this.eventBus.off('COMBAT_ENDED', this.boundOnCombatEnded);
    this.eventBus.off('CREATURE_EVOLVED', this.boundOnCreatureEvolved);

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    if (this.clickHandler) {
      this.header.removeEventListener('click', this.clickHandler);
      this.clickHandler = null;
    }

    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
  }
}
