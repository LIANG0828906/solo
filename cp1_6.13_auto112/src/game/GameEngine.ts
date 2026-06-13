import { GameState, Player, Spell, SpellEffect, ElementType } from '../types';
import { SpellDeck } from './SpellDeck';
import { v4 as uuidv4 } from 'uuid';

export class GameEngine {
  private state: GameState;
  private deck: SpellDeck;

  constructor() {
    this.deck = new SpellDeck();
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    const player1: Player = {
      id: 0,
      name: '玩家一',
      hp: 100,
      maxHp: 100,
      status: 'none',
      hand: this.deck.drawCards(4),
    };
    const player2: Player = {
      id: 1,
      name: '玩家二',
      hp: 100,
      maxHp: 100,
      status: 'none',
      hand: this.deck.drawCards(4),
    };
    return {
      gameId: uuidv4(),
      round: 1,
      players: [player1, player2],
      currentPlayer: 0,
      deckRemaining: this.deck.getRemainingCount(),
      selectedSpell: null,
      gameOver: false,
      winner: null,
      phase: 'selecting',
      actionLog: ['游戏开始！玩家一先手。'],
      spellDamageRanges: this.deck.getDamageRanges(),
    };
  }

  public getState(): GameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public reset(): GameState {
    this.deck = new SpellDeck();
    this.state = this.createInitialState();
    return this.getState();
  }

  private calculateSpellEffect(spell: Spell, targetPlayer: Player): SpellEffect {
    const effect: SpellEffect = {
      damage: spell.damage,
      freeze: false,
      combo: false,
      blowback: false,
      element: spell.element,
    };
    switch (spell.element) {
      case 'fire':
        break;
      case 'ice':
        effect.freeze = true;
        break;
      case 'thunder':
        if (Math.random() < 0.3) {
          effect.combo = true;
          effect.damage += Math.floor(spell.damage * 0.7);
        }
        break;
      case 'wind':
        effect.blowback = targetPlayer.hand.length > 0;
        break;
    }
    return effect;
  }

  public playSpell(playerId: number, spellId: string): { state: GameState; effect: SpellEffect | null } {
    if (this.state.gameOver || this.state.phase !== 'selecting') {
      return { state: this.getState(), effect: null };
    }
    if (this.state.currentPlayer !== playerId) {
      return { state: this.getState(), effect: null };
    }
    const player = this.state.players[playerId];
    if (player.status === 'frozen') {
      return { state: this.getState(), effect: null };
    }
    const spellIndex = player.hand.findIndex((s) => s.id === spellId);
    if (spellIndex === -1) {
      return { state: this.getState(), effect: null };
    }
    const spell = player.hand[spellIndex];
    const targetId = playerId === 0 ? 1 : 0;
    const target = this.state.players[targetId];
    const effect = this.calculateSpellEffect(spell, target);
    this.state.selectedSpell = spell;
    this.state.phase = 'animating';
    return { state: this.getState(), effect };
  }

  public resolveSpell(playerId: number, spellId: string): GameState {
    const player = this.state.players[playerId];
    const targetId = playerId === 0 ? 1 : 0;
    const target = this.state.players[targetId];
    const spellIndex = player.hand.findIndex((s) => s.id === spellId);
    if (spellIndex === -1) return this.getState();
    const spell = player.hand[spellIndex];
    const effect = this.calculateSpellEffect(spell, target);
    player.hand.splice(spellIndex, 1);
    let logMessage = `${player.name} 使用了 ${spell.name}${spell.emoji}`;
    target.hp = Math.max(0, target.hp - effect.damage);
    if (effect.damage > 0) {
      logMessage += `，对 ${target.name} 造成 ${effect.damage} 点伤害`;
    }
    if (effect.combo) {
      logMessage += '（连击！）';
      target.status = 'combo';
    }
    if (effect.freeze && target.status !== 'frozen') {
      target.status = 'frozen';
      logMessage += `，${target.name} 被冰冻`;
    }
    if (effect.blowback && target.hand.length > 0) {
      const blowIndex = Math.floor(Math.random() * target.hand.length);
      const blownCard = target.hand.splice(blowIndex, 1)[0];
      this.deck.addCard(blownCard);
      logMessage += `，${target.name} 的 ${blownCard.name} 被吹回牌组`;
    }
    this.state.actionLog.push(logMessage);
    this.state.selectedSpell = null;
    this.state.phase = 'resolving';
    return this.getState();
  }

  public nextRound(): GameState {
    const current = this.state.currentPlayer;
    const currentPlayer = this.state.players[current];
    const otherId = current === 0 ? 1 : 0;
    const otherPlayer = this.state.players[otherId];
    if (currentPlayer.status === 'combo') currentPlayer.status = 'none';
    this.refillHand(currentPlayer);
    if (current === 1) {
      this.state.round++;
      this.handleFrozenTurns();
    }
    this.checkGameOver();
    if (!this.state.gameOver) {
      this.state.currentPlayer = otherId;
      this.state.phase = 'selecting';
    }
    this.state.deckRemaining = this.deck.getRemainingCount();
    return this.getState();
  }

  private handleFrozenTurns(): void {
    const p1 = this.state.players[0];
    const p2 = this.state.players[1];
    if (p1.status === 'frozen' && p2.status === 'frozen') {
      p1.hp = Math.max(0, p1.hp - 5);
      p2.hp = Math.max(0, p2.hp - 5);
      this.state.actionLog.push('双方同时冻结！各承受5点剧痛伤害！');
      p1.status = 'none';
      p2.status = 'none';
    } else if (p1.status === 'frozen') {
      this.state.actionLog.push(`${p1.name} 被冻结，跳过回合`);
    } else if (p2.status === 'frozen') {
      this.state.actionLog.push(`${p2.name} 被冻结，跳过回合`);
    }
  }

  private refillHand(player: Player): void {
    while (player.hand.length < 4) {
      const card = this.deck.drawOne();
      if (!card) break;
      player.hand.push(card);
    }
  }

  private checkGameOver(): void {
    const p1 = this.state.players[0];
    const p2 = this.state.players[1];
    if (p1.hp <= 0 && p2.hp <= 0) {
      this.state.gameOver = true;
      this.state.winner = p1.hp > p2.hp ? 0 : p2.hp > p1.hp ? 1 : null;
      this.state.actionLog.push(this.state.winner === null ? '平局！' : `${this.state.players[this.state.winner].name} 获胜！`);
    } else if (p1.hp <= 0) {
      this.state.gameOver = true;
      this.state.winner = 1;
      this.state.actionLog.push(`${p2.name} 获胜！`);
    } else if (p2.hp <= 0) {
      this.state.gameOver = true;
      this.state.winner = 0;
      this.state.actionLog.push(`${p1.name} 获胜！`);
    } else if (this.deck.isEmpty() && p1.hand.length === 0 && p2.hand.length === 0) {
      this.state.gameOver = true;
      this.state.winner = p1.hp > p2.hp ? 0 : p2.hp > p1.hp ? 1 : null;
      this.state.actionLog.push('牌组耗尽！' + (this.state.winner === null ? '平局！' : `${this.state.players[this.state.winner].name} 以更高生命获胜！`));
    }
  }

  public skipFrozenTurn(playerId: number): GameState {
    const player = this.state.players[playerId];
    if (player.status !== 'frozen') return this.getState();
    this.state.actionLog.push(`${player.name} 因冻结跳过行动`);
    player.status = 'none';
    return this.nextRound();
  }
}
