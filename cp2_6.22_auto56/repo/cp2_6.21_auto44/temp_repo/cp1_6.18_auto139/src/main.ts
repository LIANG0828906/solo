import { GameEngine } from './engine/gameEngine';
import { HexRenderer } from './renderer/hexRenderer';
import { AIPlayer } from './ai/aiPlayer';
import { NetworkService } from './network/networkService';
import { AxialCoord, PlayerType, ActionType, NetworkMessage, HeroUnit } from './types';
import { isHexInBounds, hexToPixel } from './map/mapGenerator';

class GameApp {
  private engine: GameEngine;
  private renderer: HexRenderer;
  private aiPlayer: AIPlayer;
  private networkService: NetworkService;
  private isAITurn: boolean = false;
  private lastMoveFrom: Map<string, AxialCoord> = new Map();
  private statusUpdateTimer: number | null = null;

  constructor() {
    this.engine = new GameEngine();
    this.networkService = new NetworkService(true);

    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas not found');
    }
    this.renderer = new HexRenderer(canvas);

    this.aiPlayer = new AIPlayer(this.engine, PlayerType.RED);

    this.bindEvents();
    this.setupNetworkHandlers();
    this.updateUI();
    this.renderer.setState(this.engine.getState());

    this.statusUpdateTimer = window.setInterval(() => {
      this.updateNetworkStatus();
    }, 500);
  }

  private bindEvents(): void {
    this.renderer.onHexClick(this.handleHexClick.bind(this));

    this.engine.onStateChange(() => {
      this.renderer.setState(this.engine.getState());
      this.updateUI();
    });

    this.engine.onGameOver(this.handleGameOver.bind(this));

    const endTurnBtn = document.getElementById('end-turn-btn');
    if (endTurnBtn) {
      endTurnBtn.addEventListener('click', () => this.handleEndTurn());
    }

    const undoMoveBtn = document.getElementById('undo-move-btn');
    if (undoMoveBtn) {
      undoMoveBtn.addEventListener('click', () => this.handleUndoMove());
    }

    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.handleRestart());
    }
  }

  private setupNetworkHandlers(): void {
    this.networkService.onMessage((message: NetworkMessage) => {
      this.handleNetworkMessage(message);
    });
  }

  private handleNetworkMessage(message: NetworkMessage): void {
    switch (message.type) {
      case ActionType.MOVE:
        if (message.unitId && message.target) {
          const unit = this.engine.getUnitById(message.unitId);
          if (unit) {
            this.lastMoveFrom.set(message.unitId, { ...unit.position });
          }
          this.engine.moveUnit(message.unitId, message.target);
          if (unit && message.target) {
            this.renderer.playMoveAnimation(message.unitId, this.lastMoveFrom.get(message.unitId)!, message.target);
          }
        }
        break;
      case ActionType.ATTACK:
        if (message.unitId && message.targetUnitId) {
          this.engine.attackUnit(message.unitId, message.targetUnitId);
          this.renderer.playAttackAnimation(message.unitId);
        }
        break;
      case ActionType.END_TURN:
        this.engine.endTurn();
        break;
    }
  }

  private handleHexClick(coord: AxialCoord): void {
    if (!isHexInBounds(coord)) return;
    if (this.isAITurn) return;
    if (this.engine.getCurrentPlayer() !== this.networkService.getLocalPlayer()) return;
    if (this.engine.getState().gameOver) return;

    const currentPlayer = this.engine.getCurrentPlayer();
    const clickedUnit = this.engine.getUnitAtPosition(coord);
    const selectedUnit = this.engine.getSelectedUnit();

    if (selectedUnit) {
      if (clickedUnit && clickedUnit.player !== currentPlayer) {
        const enemies = this.engine.getAdjacentEnemyUnits(selectedUnit);
        const canAttack = enemies.some(e => e.id === clickedUnit.id);

        if (canAttack) {
          this.networkService.sendAttackAction(
            currentPlayer,
            selectedUnit.id,
            clickedUnit.id
          );
          return;
        }
      }

      if (!clickedUnit || clickedUnit.id === selectedUnit.id) {
        const highlightedHexes = this.engine.getState().highlightedHexes;
        const isHighlighted = highlightedHexes.some(
          h => h.q === coord.q && h.r === coord.r
        );

        if (isHighlighted) {
          this.lastMoveFrom.set(selectedUnit.id, { ...selectedUnit.position });
          this.networkService.sendMoveAction(
            currentPlayer,
            selectedUnit.id,
            coord
          );
          return;
        }
      }
    }

    if (clickedUnit && clickedUnit.player === currentPlayer) {
      this.engine.selectUnit(clickedUnit.id);
    } else {
      this.engine.selectUnit(null);
    }
  }

  private handleEndTurn(): void {
    if (this.isAITurn) return;
    if (this.engine.getCurrentPlayer() !== this.networkService.getLocalPlayer()) return;
    if (this.engine.getState().gameOver) return;

    this.networkService.sendEndTurnAction(this.engine.getCurrentPlayer());
  }

  private handleUndoMove(): void {
    if (this.isAITurn) return;
    if (this.engine.getCurrentPlayer() !== this.networkService.getLocalPlayer()) return;

    const selectedUnit = this.engine.getSelectedUnit();
    if (selectedUnit && this.engine.canUndoMove(selectedUnit.id)) {
      this.engine.undoMove(selectedUnit.id);
    }
  }

  private handleRestart(): void {
    this.isAITurn = false;
    this.engine.reset();
    this.lastMoveFrom.clear();

    const overlay = document.getElementById('game-over-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }

    this.updateUI();
  }

  private handleGameOver(winner: PlayerType): void {
    const overlay = document.getElementById('game-over-overlay');
    const winnerText = document.getElementById('winner-text');

    if (overlay && winnerText) {
      overlay.classList.remove('hidden');
      winnerText.textContent = winner === PlayerType.BLUE ? '蓝方获胜!' : '红方获胜!';
      winnerText.className = winner === PlayerType.RED ? 'red-winner' : '';
    }
  }

  private updateUI(): void {
    const state = this.engine.getState();

    const turnNumber = document.getElementById('turn-number');
    const currentPlayer = document.getElementById('current-player');
    const turnBanner = document.getElementById('turn-banner');

    if (turnNumber) {
      turnNumber.textContent = `回合 ${state.turnNumber}`;
    }

    if (currentPlayer) {
      currentPlayer.textContent = state.currentPlayer === PlayerType.BLUE ? '蓝方回合' : '红方回合';
    }

    if (turnBanner) {
      turnBanner.className = state.currentPlayer === PlayerType.RED ? 'red-turn' : '';
    }

    this.updateUnitInfo();
    this.updateActionButtons();
    this.updateNetworkStatus();
    this.checkAITurn();
  }

  private updateUnitInfo(): void {
    const selectedUnit = this.engine.getSelectedUnit();

    const unitName = document.getElementById('unit-name');
    const unitAvatar = document.getElementById('unit-avatar');
    const hpBar = document.getElementById('hp-bar') as HTMLDivElement;
    const hpText = document.getElementById('hp-text');
    const atkBar = document.getElementById('atk-bar') as HTMLDivElement;
    const atkText = document.getElementById('atk-text');
    const defBar = document.getElementById('def-bar') as HTMLDivElement;
    const defText = document.getElementById('def-text');
    const moveBar = document.getElementById('move-bar') as HTMLDivElement;
    const moveText = document.getElementById('move-text');

    if (!selectedUnit) {
      if (unitName) unitName.textContent = '选择一个单位';
      if (unitAvatar) {
        unitAvatar.textContent = '';
        unitAvatar.style.background = '#2D2D44';
        unitAvatar.style.borderColor = '#3D3D5C';
      }
      if (hpBar) hpBar.style.width = '0%';
      if (hpText) hpText.textContent = '0/0';
      if (atkBar) atkBar.style.width = '0%';
      if (atkText) atkText.textContent = '0';
      if (defBar) defBar.style.width = '0%';
      if (defText) defText.textContent = '0';
      if (moveBar) moveBar.style.width = '0%';
      if (moveText) moveText.textContent = '0/0';
      return;
    }

    if (unitName) {
      unitName.textContent = `${selectedUnit.name} (${selectedUnit.player === PlayerType.BLUE ? '蓝方' : '红方'})`;
    }

    if (unitAvatar) {
      unitAvatar.textContent = selectedUnit.initials;
      unitAvatar.style.background = selectedUnit.player === PlayerType.BLUE ? '#4169E1' : '#DC143C';
      unitAvatar.style.borderColor = selectedUnit.hasActed ? '#666' : '#fff';
    }

    if (hpBar) {
      const hpPercent = (selectedUnit.hp / selectedUnit.maxHp) * 100;
      hpBar.style.width = `${hpPercent}%`;
    }
    if (hpText) hpText.textContent = `${selectedUnit.hp}/${selectedUnit.maxHp}`;

    if (atkBar) {
      const atkPercent = ((selectedUnit.attack - 8) / 7) * 100;
      atkBar.style.width = `${Math.min(100, Math.max(0, atkPercent))}%`;
    }
    if (atkText) atkText.textContent = selectedUnit.attack.toString();

    if (defBar) {
      const defPercent = ((selectedUnit.defense - 5) / 5) * 100;
      defBar.style.width = `${Math.min(100, Math.max(0, defPercent))}%`;
    }
    if (defText) defText.textContent = selectedUnit.defense.toString();

    if (moveBar) {
      const movePercent = (selectedUnit.moveSteps / selectedUnit.maxMoveSteps) * 100;
      moveBar.style.width = `${movePercent}%`;
    }
    if (moveText) moveText.textContent = `${selectedUnit.moveSteps}/${selectedUnit.maxMoveSteps}`;
  }

  private updateActionButtons(): void {
    const endTurnBtn = document.getElementById('end-turn-btn') as HTMLButtonElement;
    const undoMoveBtn = document.getElementById('undo-move-btn') as HTMLButtonElement;

    const isLocalPlayer = this.engine.getCurrentPlayer() === this.networkService.getLocalPlayer();
    const gameOver = this.engine.getState().gameOver;

    if (endTurnBtn) {
      endTurnBtn.disabled = !isLocalPlayer || gameOver || this.isAITurn;
    }

    if (undoMoveBtn) {
      const selectedUnit = this.engine.getSelectedUnit();
      const canUndo = selectedUnit ? this.engine.canUndoMove(selectedUnit.id) : false;
      undoMoveBtn.disabled = !isLocalPlayer || gameOver || this.isAITurn || !canUndo;
    }
  }

  private updateNetworkStatus(): void {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const latency = document.getElementById('latency');

    if (statusDot) {
      statusDot.className = `status-dot ${this.networkService.getConnectionStatus() ? 'connected' : 'disconnected'}`;
    }

    if (statusText) {
      statusText.textContent = this.networkService.getConnectionStatus() ? '已连接' : '未连接';
    }

    if (latency) {
      latency.textContent = `延迟: ${this.networkService.getLatency()}ms`;
    }
  }

  private checkAITurn(): void {
    if (this.engine.getState().gameOver) return;
    if (this.isAITurn) return;

    const currentPlayer = this.engine.getCurrentPlayer();
    if (currentPlayer === PlayerType.RED) {
      this.isAITurn = true;
      this.updateActionButtons();

      setTimeout(async () => {
        await this.aiPlayer.takeTurn();
        this.isAITurn = false;
        this.updateUI();
      }, 500);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
