import { CardManager } from './CardManager';
import { executeEffect } from './strategies';
import type { BattleCard, Enemy, EnemyTemplate, PlayerState } from './types';

const ENEMY_TEMPLATES: EnemyTemplate[] = [
  { name: '哥布林', hp: 25, attack: 5, weight: 3, skillName: '投掷' },
  { name: '骷髅战士', hp: 35, attack: 7, weight: 2, skillName: '骨刃斩' },
  { name: '暗影狼', hp: 20, attack: 9, weight: 2, skillName: '暗影突袭' },
  { name: '石像鬼', hp: 45, attack: 4, weight: 2, skillName: '石化之击' },
  { name: '暗黑法师', hp: 30, attack: 8, weight: 1, skillName: '暗影弹' },
];

function weightedRandom(templates: EnemyTemplate[]): EnemyTemplate {
  const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const t of templates) {
    roll -= t.weight;
    if (roll <= 0) return t;
  }
  return templates[templates.length - 1];
}

export class BattleEngine {
  private cardManager: CardManager;
  player: PlayerState;
  enemy: Enemy | null = null;
  turn = 0;
  phase: 'player_turn' | 'enemy_turn' | 'victory' | 'defeat' = 'player_turn';
  logs: string[] = [];
  stats = { cardsUsed: 0, totalDamage: 0 };

  constructor() {
    this.cardManager = new CardManager();
    this.player = { hp: 50, maxHp: 50, energy: 3, maxEnergy: 3, shield: 0 };
  }

  initBattle(): void {
    this.cardManager.loadTemplates();
    this.cardManager.initDeck(10);
    this.player = { hp: 50, maxHp: 50, energy: 3, maxEnergy: 3, shield: 0 };
    this.turn = 0;
    this.phase = 'player_turn';
    this.logs = [];
    this.stats = { cardsUsed: 0, totalDamage: 0 };

    const template = weightedRandom(ENEMY_TEMPLATES);
    this.enemy = { ...template, currentHp: template.hp, maxHp: template.hp };

    this.startPlayerTurn();
  }

  private startPlayerTurn(): void {
    this.turn++;
    this.phase = 'player_turn';
    this.player.energy = this.player.maxEnergy;
    this.player.shield = 0;
    const result = this.cardManager.drawCards(2);
    if (result.handFull) {
      this.logs.push('手牌已满，无法继续抽牌');
    }
    this.logs.push(`--- 第${this.turn}回合 ---`);
    this.logs.push(`抽了${result.drawn.length}张牌`);
  }

  playCard(handIndex: number): { success: boolean; log?: string } {
    if (this.phase !== 'player_turn') return { success: false };
    const hand = this.cardManager.hand;
    if (handIndex < 0 || handIndex >= hand.length) return { success: false };

    const card = hand[handIndex];
    if (card.cost > this.player.energy) {
      return { success: false, log: '能量不足' };
    }

    const playedCard = this.cardManager.playCard(handIndex);
    if (!playedCard) return { success: false };

    this.player.energy -= playedCard.cost;
    this.stats.cardsUsed++;

    const ctx = {
      player: this.player,
      enemy: this.enemy!,
      cardValue: playedCard.value,
      cardClass: playedCard.class,
      drawFn: (count: number) => {
        const r = this.cardManager.drawCards(count);
        return r.drawn;
      },
    };

    const result = executeEffect(playedCard.effectType, ctx);

    if (result.damage && this.enemy) {
      this.enemy.currentHp = Math.max(0, this.enemy.currentHp - result.damage);
      this.stats.totalDamage += result.damage;
    }
    if (result.shield) {
      this.player.shield += result.shield;
    }
    if (result.heal) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + result.heal);
    }

    this.logs.push(`使用【${playedCard.name}】：${result.log}`);

    if (this.enemy && this.enemy.currentHp <= 0) {
      this.phase = 'victory';
      this.logs.push('敌人被击败！');
      return { success: true, log: result.log };
    }

    return { success: true, log: result.log };
  }

  endPlayerTurn(): void {
    if (this.phase !== 'player_turn') return;
    this.phase = 'enemy_turn';
    this.enemyTurn();
  }

  private enemyTurn(): void {
    if (!this.enemy) return;

    let damage = this.enemy.attack;
    let isSkill = false;

    if (this.turn % 3 === 0) {
      damage = Math.floor(this.enemy.attack * 1.5);
      isSkill = true;
    }

    const shieldAbsorbed = Math.min(this.player.shield, damage);
    const actualDamage = damage - shieldAbsorbed;
    this.player.shield -= shieldAbsorbed;
    this.player.hp = Math.max(0, this.player.hp - actualDamage);

    if (isSkill) {
      this.logs.push(`${this.enemy.name}使用【${this.enemy.skillName}】！造成${damage}点伤害（护盾吸收${shieldAbsorbed}）`);
    } else {
      this.logs.push(`${this.enemy.name}攻击造成${damage}点伤害（护盾吸收${shieldAbsorbed}）`);
    }

    if (this.player.hp <= 0) {
      this.phase = 'defeat';
      this.logs.push('你被击败了...');
      return;
    }

    this.startPlayerTurn();
  }

  getHand(): BattleCard[] {
    return this.cardManager.hand;
  }

  getDeckSize(): number {
    return this.cardManager.deckSize;
  }
}
