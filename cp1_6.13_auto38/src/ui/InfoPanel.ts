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
      .info-panel-content::-webkit-scrollbar-