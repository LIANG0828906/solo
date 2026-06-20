import { MapGrid, Unit, HexCoord } from './MapGrid';
import { PathFinder, PathNode } from './PathFinder';
import { AI, AIDecision } from './AI';
import { Renderer, RenderState } from './Renderer';
import { Animator } from './Animator';

type GamePhase = 'player' | 'enemy' | 'gameover';

export class GameController {
  private canvas: HTMLCanvasElement;
  private grid: MapGrid;
  private pathFinder: PathFinder;
  private ai: AI;
  private renderer: Renderer;
  private animator: Animator;

  private selectedUnit: Unit | null = null;
  private reachableRange: Map<string, PathNode> = new Map();
  private attackRange: HexCoord[] = [];
  private pathPreview: HexCoord[] = [];
  private phase: GamePhase = 'player';
  private turnCount: number = 1;
  private lastTime: number = 0;
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;

  private playerCountEl: HTMLElement | null = null;
  private enemyCountEl: HTMLElement | null = null;
  private turnCountEl: HTMLElement | null = null;
  private phaseEl: HTMLElement | null = null;
  private messageEl: HTMLElement | null = null;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!this.canvas) throw new Error('Canvas element not found');

    this.grid = new MapGrid(10, 10);
    this.pathFinder = new PathFinder(this.grid);
    this.ai = new AI(this.grid, this.pathFinder);
    this.renderer = new Renderer(this.canvas, this.grid);
    this.animator = new Animator(this.renderer);

    this.initUI();
    this.grid.spawnUnits(5, 5);
    this.bindEvents();
    this.updateUI();
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private initUI(): void {
    this.playerCountEl = document.getElementById('player-count');
    this.enemyCountEl = document.getElementById('enemy-count');
    this.turnCountEl = document.getElementById('turn-count');
    this.phaseEl = document.getElementById('phase');
    this.messageEl = document.getElementById('message');
  }

  private bindEvents(): void {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
  }

  private handleClick(e: MouseEvent): void {
    if (this.phase !== 'player' || this.animator.isAnimating()) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hex = this.renderer.pixelToHex(x, y);
    if (!hex) return;

    const clickedUnit = this.grid.getUnitAt(hex.q, hex.r);

    if (clickedUnit && clickedUnit.team === 'player') {
      this.selectUnit(clickedUnit);
      return;
    }

    if (this.selectedUnit) {
      if (clickedUnit && clickedUnit.team === 'enemy') {
        this.tryAttack(clickedUnit);
        return;
      }

      const key = `${hex.q},${hex.r}`;
      if (this.reachableRange.has(key)) {
        this.moveUnit(this.selectedUnit, hex);
        return;
      }
    }

    this.clearSelection();
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.phase !== 'player' || !this.selectedUnit || this.animator.isAnimating()) {
      this.pathPreview = [];
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hex = this.renderer.pixelToHex(x, y);
    if (!hex) {
      this.pathPreview = [];
      return;
    }

    const key = `${hex.q},${hex.r}`;
    if (this.reachableRange.has(key)) {
      const path = this.pathFinder.findPath(
        { q: this.selectedUnit.q, r: this.selectedUnit.r },
        hex,
        this.selectedUnit.moveRange
      );
      this.pathPreview = path || [];
    } else {
      this.pathPreview = [];
    }
  }

  private selectUnit(unit: Unit): void {
    if (unit.hasMoved && unit.hasActed) {
      this.showMessage('该单位本回合已行动完毕', 1000);
      return;
    }

    this.selectedUnit = unit;
    
    if (!unit.hasMoved) {
      this.reachableRange = this.pathFinder.getReachableRange(unit);
    } else {
      this.reachableRange = new Map();
    }

    if (!unit.hasActed) {
      this.attackRange = this.pathFinder.getAttackRange(unit);
    } else {
      this.attackRange = [];
    }

    this.pathPreview = [];
  }

  private clearSelection(): void {
    this.selectedUnit = null;
    this.reachableRange = new Map();
    this.attackRange = [];
    this.pathPreview = [];
  }

  private moveUnit(unit: Unit, target: HexCoord): void {
    const path = this.pathFinder.findPath(
      { q: unit.q, r: unit.r },
      target,
      unit.moveRange
    );

    if (!path || path.length < 2) return;

    this.reachableRange = new Map();
    this.pathPreview = [];

    this.animator.animateMove(unit, path, () => {
      unit.hasMoved = true;
      this.afterUnitAction(unit);
    });
  }

  private tryAttack(target: Unit): void {
    if (!this.selectedUnit || this.selectedUnit.hasActed) return;

    const enemiesInRange = this.pathFinder.getEnemiesInRange(this.selectedUnit, 'enemy');
    if (!enemiesInRange.includes(target)) {
      this.showMessage('目标不在攻击范围内', 1000);
      return;
    }

    this.executeAttack(this.selectedUnit, target);
  }

  private executeAttack(attacker: Unit, target: Unit): void {
    const damage = attacker.attack;
    
    this.animator.animateAttack(attacker, target, damage, () => {
      target.hp -= damage;
      attacker.hasActed = true;

      if (target.hp <= 0) {
        this.grid.removeUnit(target.id);
        this.showMessage('消灭敌人!', 1000);
      }

      this.attackRange = [];
      this.afterUnitAction(attacker);
      this.checkGameOver();
    });
  }

  private afterUnitAction(unit: Unit): void {
    this.updateUI();

    if (unit.hasActed && unit.hasMoved) {
      this.clearSelection();
    } else if (unit.hasMoved && !unit.hasActed) {
      this.attackRange = this.pathFinder.getAttackRange(unit);
      const enemiesInRange = this.pathFinder.getEnemiesInRange(unit, 'enemy');
      if (enemiesInRange.length === 0) {
        unit.hasActed = true;
        this.clearSelection();
        this.checkPlayerTurnEnd();
      }
    } else {
      this.reachableRange = new Map();
    }

    this.checkPlayerTurnEnd();
  }

  private checkPlayerTurnEnd(): void {
    const players = this.grid.getUnitsByTeam('player');
    const allActed = players.every(p => p.hasActed && p.hasMoved);
    
    if (allActed) {
      setTimeout(() => this.startEnemyTurn(), 500);
    }
  }

  private startEnemyTurn(): void {
    this.clearSelection();
    this.phase = 'enemy';
    this.updateUI();
    this.showMessage('敌方回合', 800);
    
    setTimeout(() => this.processEnemyAI(), 1000);
  }

  private async processEnemyAI(): Promise<void> {
    const enemies = this.grid.getUnitsByTeam('enemy');
    
    for (const enemy of enemies) {
      if (this.phase === 'gameover') break;
      if (enemy.hp <= 0) continue;

      let decision: AIDecision;
      do {
        decision = this.ai.makeDecision(enemy);
        
        if (decision.type === 'move' && decision.path) {
          await this.enemyMove(enemy, decision.path);
        } else if (decision.type === 'attack' && decision.target) {
          await this.enemyAttack(enemy, decision.target);
        } else {
          this.ai.executeDecision(enemy, decision);
        }

        this.updateUI();
      } while (decision.type !== 'wait' && !(enemy.hasActed && enemy.hasMoved));

      await this.delay(200);
    }

    if (this.phase !== 'gameover') {
      this.endTurn();
    }
  }

  private async enemyMove(unit: Unit, path: HexCoord[]): Promise<void> {
    return new Promise((resolve) => {
      this.animator.animateMove(unit, path, () => {
        unit.hasMoved = true;
        resolve();
      });
    });
  }

  private async enemyAttack(attacker: Unit, target: Unit): Promise<void> {
    return new Promise((resolve) => {
      const damage = attacker.attack;
      this.animator.animateAttack(attacker, target, damage, () => {
        target.hp -= damage;
        attacker.hasActed = true;

        if (target.hp <= 0) {
          this.grid.removeUnit(target.id);
        }

        this.checkGameOver();
        resolve();
      });
    });
  }

  private endTurn(): void {
    this.turnCount++;
    this.grid.resetUnitActions();
    this.phase = 'player';
    this.updateUI();
    this.showMessage(`第 ${this.turnCount} 回合`, 800);
  }

  private checkGameOver(): void {
    const players = this.grid.getUnitsByTeam('player');
    const enemies = this.grid.getUnitsByTeam('enemy');

    if (players.length === 0) {
      this.phase = 'gameover';
      this.showMessage('战斗失败!', 3000);
    } else if (enemies.length === 0) {
      this.phase = 'gameover';
      this.showMessage('战斗胜利!', 3000);
    }
  }

  private updateUI(): void {
    const players = this.grid.getUnitsByTeam('player');
    const enemies = this.grid.getUnitsByTeam('enemy');

    if (this.playerCountEl) this.playerCountEl.textContent = String(players.length);
    if (this.enemyCountEl) this.enemyCountEl.textContent = String(enemies.length);
    if (this.turnCountEl) this.turnCountEl.textContent = String(this.turnCount);
    if (this.phaseEl) {
      this.phaseEl.textContent = this.phase === 'player' ? '玩家' : 
                                  this.phase === 'enemy' ? '敌方' : '结束';
    }
  }

  private showMessage(text: string, duration: number): void {
    if (!this.messageEl) return;
    this.messageEl.textContent = text;
    this.messageEl.classList.add('show');
    
    setTimeout(() => {
      if (this.messageEl) {
        this.messageEl.classList.remove('show');
      }
    }, duration);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private gameLoop(): void {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    this.frameCount++;
    if (now - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }

    this.animator.update(deltaTime);

    const renderState: RenderState = {
      selectedUnit: this.selectedUnit,
      reachableRange: this.reachableRange,
      attackRange: this.attackRange,
      pathPreview: this.pathPreview,
      animatingUnits: this.animator.getAnimatingUnits(),
      damageNumbers: this.animator.getDamageNumbers(),
      time: now,
    };

    this.renderer.render(renderState);

    requestAnimationFrame(() => this.gameLoop());
  }
}

new GameController();
