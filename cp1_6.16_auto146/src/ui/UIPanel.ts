import { create } from 'zustand';
import { RuneEngine, Difficulty, DIFFICULTY_CONFIG, RuneShape, RuneNode } from '../core/RuneEngine';

interface GameState {
  score: number;
  chainCount: number;
  drawForce: number;
  difficulty: Difficulty;
  activatedNodes: RuneNode[];
  setScore: (score: number) => void;
  setChainCount: (count: number) => void;
  setDrawForce: (force: number) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setActivatedNodes: (nodes: RuneNode[]) => void;
}

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  chainCount: 0,
  drawForce: 0,
  difficulty: 'normal',
  activatedNodes: [],
  setScore: (score) => set({ score }),
  setChainCount: (count) => set({ chainCount: count }),
  setDrawForce: (force) => set({ drawForce: force }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setActivatedNodes: (nodes) => set({ activatedNodes: nodes })
}));

const SHAPE_LABELS: Record<RuneShape, string> = {
  triangle: '三角符文',
  circle: '圆环符文',
  square: '方形符文',
  diamond: '棱晶符文',
  hexagon: '六芒符文',
  spiral: '螺旋符文',
  lightning: '闪电符文'
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: '#2ECC71',
  normal: '#3498DB',
  hard: '#E74C3C'
};

export class UIPanel {
  private container: HTMLDivElement;
  private engine: RuneEngine;
  private panelEl!: HTMLDivElement;
  private forceFillEl!: HTMLDivElement;
  private scoreEl!: HTMLDivElement;
  private chainEl!: HTMLDivElement;
  private nodeListEl!: HTMLDivElement;
  private difficultyEls: HTMLButtonElement[] = [];
  private resetBtnEl!: HTMLButtonElement;
  private animFrame = 0;
  private lastScore = 0;
  private scoreFlashTimer: number | null = null;

  constructor(container: HTMLDivElement, engine: RuneEngine) {
    this.container = container;
    this.engine = engine;
    this.createPanel();
    this.bindEngineEvents();
    this.startUpdateLoop();
  }

  private createPanel(): void {
    this.panelEl = document.createElement('div');
    this.panelEl.style.cssText = `
      position: absolute;
      top: 50%;
      right: 24px;
      transform: translateY(-50%);
      width: 220px;
      background: rgba(26, 26, 46, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 12px;
      border: 1px solid rgba(197, 165, 90, 0.25);
      padding: 20px;
      color: #E8E8F0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      user-select: none;
      transition: box-shadow 0.3s ease;
      z-index: 10;
    `;

    this.panelEl.innerHTML = `
      <div style="font-size: 14px; color: #C5A55A; margin-bottom: 16px; letter-spacing: 2px; text-align: center; font-weight: 600;">
        ⚡ 魔法符文控制台
      </div>

      <div style="margin-bottom: 18px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; color: #A0A0B8;">
          <span>绘制力度</span>
          <span id="forceValue" style="color: #C5A55A;">0%</span>
        </div>
        <div id="forceBar" style="height: 8px; background: rgba(197, 165, 90, 0.15); border-radius: 4px; overflow: hidden;">
          <div id="forceFill" style="height: 100%; width: 0%; background: linear-gradient(90deg, #6A5ACD, #FFD700); border-radius: 4px; transition: width 0.05s linear;"></div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 18px; padding: 10px 0; border-top: 1px solid rgba(197, 165, 90, 0.15); border-bottom: 1px solid rgba(197, 165, 90, 0.15);">
        <div style="text-align: center;">
          <div style="font-size: 11px; color: #A0A0B8; margin-bottom: 4px;">得分</div>
          <div id="scoreValue" style="font-size: 22px; font-weight: bold; color: #FFD700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);">0</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 11px; color: #A0A0B8; margin-bottom: 4px;">连锁</div>
          <div id="chainValue" style="font-size: 22px; font-weight: bold; color: #9B59B6; text-shadow: 0 0 10px rgba(155, 89, 182, 0.5);">0</div>
        </div>
      </div>

      <div style="margin-bottom: 18px;">
        <div style="font-size: 12px; color: #A0A0B8; margin-bottom: 8px;">已激活符文</div>
        <div id="nodeList" style="display: flex; flex-direction: column; gap: 6px; min-height: 80px;">
          <div style="font-size: 11px; color: #606078; text-align: center; padding: 12px 0; font-style: italic;">暂无激活符文</div>
        </div>
      </div>

      <div style="margin-bottom: 18px;">
        <div style="font-size: 12px; color: #A0A0B8; margin-bottom: 8px;">难度模式</div>
        <div style="display: flex; gap: 6px;">
          <button data-diff="easy" style="flex: 1; padding: 6px 4px; border: none; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: 600; transition: all 0.2s; background: rgba(46, 204, 113, 0.15); color: #2ECC71; border: 1px solid transparent;">简单</button>
          <button data-diff="normal" style="flex: 1; padding: 6px 4px; border: none; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: 600; transition: all 0.2s; background: rgba(52, 152, 219, 0.3); color: #3498DB; border: 1px solid #3498DB;">普通</button>
          <button data-diff="hard" style="flex: 1; padding: 6px 4px; border: none; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: 600; transition: all 0.2s; background: rgba(231, 76, 60, 0.15); color: #E74C3C; border: 1px solid transparent;">困难</button>
        </div>
        <div style="font-size: 10px; color: #606078; margin-top: 6px; text-align: center;">
          匹配度 ≥ <span id="diffThreshold">80</span>%
        </div>
      </div>

      <button id="resetBtn" style="width: 100%; padding: 10px; border: 1px solid rgba(197, 165, 90, 0.4); background: rgba(197, 165, 90, 0.1); color: #C5A55A; border-radius: 8px; font-size: 12px; cursor: pointer; font-weight: 600; letter-spacing: 1px; transition: all 0.2s;">
        🔄 重置符文
      </button>
    `;

    this.container.appendChild(this.panelEl);

    this.forceFillEl = this.panelEl.querySelector('#forceFill') as HTMLDivElement;
    this.scoreEl = this.panelEl.querySelector('#scoreValue') as HTMLDivElement;
    this.chainEl = this.panelEl.querySelector('#chainValue') as HTMLDivElement;
    this.nodeListEl = this.panelEl.querySelector('#nodeList') as HTMLDivElement;
    this.resetBtnEl = this.panelEl.querySelector('#resetBtn') as HTMLButtonElement;

    this.difficultyEls = Array.from(this.panelEl.querySelectorAll('button[data-diff]')) as HTMLButtonElement[];

    this.bindUIEvents();
  }

  private bindUIEvents(): void {
    this.difficultyEls.forEach(btn => {
      btn.addEventListener('click', () => {
        const diff = btn.dataset.diff as Difficulty;
        if (diff && diff !== this.engine.getDifficulty()) {
          this.engine.setDifficulty(diff);
        }
      });
    });

    this.resetBtnEl.addEventListener('click', () => {
      this.engine.resetNodes();
      useGameStore.getState().setActivatedNodes([]);
      this.updateNodeList();
    });

    this.resetBtnEl.addEventListener('mouseenter', () => {
      this.resetBtnEl.style.background = 'rgba(197, 165, 90, 0.25)';
    });
    this.resetBtnEl.addEventListener('mouseleave', () => {
      this.resetBtnEl.style.background = 'rgba(197, 165, 90, 0.1)';
    });
  }

  private bindEngineEvents(): void {
    this.engine.on((event) => {
      const state = useGameStore.getState();

      switch (event.type) {
        case 'scoreUpdated':
          if (Math.floor(event.score / 100) > Math.floor(this.lastScore / 100)) {
            this.triggerScoreFlash();
          }
          this.lastScore = event.score;
          state.setScore(event.score);
          this.scoreEl.textContent = String(event.score);
          break;

        case 'chainTriggered':
          state.setChainCount(this.engine.getChainCount());
          this.chainEl.textContent = String(this.engine.getChainCount());
          this.chainEl.style.transform = 'scale(1.3)';
          setTimeout(() => { this.chainEl.style.transform = 'scale(1)'; }, 200);
          break;

        case 'nodeActivated':
          const nodes = this.engine.getNodes().filter(n => n.activated);
          state.setActivatedNodes(nodes);
          this.updateNodeList();
          break;

        case 'difficultyChanged':
          state.setDifficulty(event.difficulty);
          this.updateDifficultyButtons(event.difficulty);
          break;
      }
    });
  }

  private updateDifficultyButtons(difficulty: Difficulty): void {
    this.difficultyEls.forEach(btn => {
      const diff = btn.dataset.diff as Difficulty;
      const color = DIFFICULTY_COLORS[diff];
      if (diff === difficulty) {
        btn.style.background = `${color}33`;
        btn.style.borderColor = color;
        btn.style.boxShadow = `0 0 12px ${color}44`;
      } else {
        btn.style.background = `${color}1A`;
        btn.style.borderColor = 'transparent';
        btn.style.boxShadow = 'none';
      }
    });

    const thresholdEl = this.panelEl.querySelector('#diffThreshold');
    if (thresholdEl) {
      thresholdEl.textContent = String(Math.round(DIFFICULTY_CONFIG[difficulty].matchThreshold * 100));
    }
  }

  private updateNodeList(): void {
    const nodes = this.engine.getNodes().filter(n => n.activated);
    if (nodes.length === 0) {
      this.nodeListEl.innerHTML = `<div style="font-size: 11px; color: #606078; text-align: center; padding: 12px 0; font-style: italic;">暂无激活符文</div>`;
      return;
    }

    this.nodeListEl.innerHTML = nodes.map(node => `
      <div style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: rgba(255, 255, 255, 0.04); border-radius: 6px; border: 1px solid ${node.color}33;">
        <div style="width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          ${this.getNodeIcon(node.shape, node.color)}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 11px; color: #E8E8F0; font-weight: 500;">${SHAPE_LABELS[node.shape]}</div>
          <div style="height: 3px; background: rgba(255, 255, 255, 0.08); border-radius: 2px; margin-top: 3px; overflow: hidden;">
            <div style="height: 100%; width: ${Math.round(node.energy * 100)}%; background: ${node.color}; border-radius: 2px; transition: width 0.1s;"></div>
          </div>
        </div>
      </div>
    `).join('');
  }

  private getNodeIcon(shape: RuneShape, color: string): string {
    const size = 14;
    switch (shape) {
      case 'triangle':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><polygon points="12,2 22,20 2,20"/></svg>`;
      case 'circle':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`;
      case 'square':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><rect x="4" y="4" width="16" height="16"/></svg>`;
      case 'diamond':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><polygon points="12,2 22,12 12,22 2,12"/></svg>`;
      case 'hexagon':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><polygon points="12,2 21,7 21,17 12,22 3,17 3,7"/></svg>`;
      case 'spiral':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M12,12 m0,-8 a8,8 0 1,1 -0.1,0"/></svg>`;
      case 'lightning':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="1"><polygon points="13,2 4,14 11,14 10,22 20,10 13,10"/></svg>`;
      default:
        return '';
    }
  }

  private triggerScoreFlash(): void {
    this.panelEl.style.boxShadow = '0 8px 32px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 215, 0, 0.3)';
    if (this.scoreFlashTimer) clearTimeout(this.scoreFlashTimer);
    this.scoreFlashTimer = window.setTimeout(() => {
      this.panelEl.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
    }, 400);
  }

  private startUpdateLoop(): void {
    const update = () => {
      const force = this.engine.getDrawForce();
      this.forceFillEl.style.width = `${force}%`;
      const forceValueEl = this.panelEl.querySelector('#forceValue');
      if (forceValueEl) forceValueEl.textContent = `${Math.round(force)}%`;

      const nodes = this.engine.getNodes().filter(n => n.activated);
      const storedNodes = useGameStore.getState().activatedNodes;
      if (nodes.length !== storedNodes.length ||
          nodes.some((n, i) => !storedNodes[i] || storedNodes[i].energy !== n.energy)) {
        useGameStore.getState().setActivatedNodes(nodes);
        this.updateNodeList();
      }

      this.animFrame = requestAnimationFrame(update);
    };
    update();
  }

  destroy(): void {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.scoreFlashTimer) clearTimeout(this.scoreFlashTimer);
    if (this.panelEl && this.panelEl.parentNode) {
      this.panelEl.parentNode.removeChild(this.panelEl);
    }
  }
}
