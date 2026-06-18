import { Character } from './Character';
import type { BattleFrame, BattleState } from './types';
import type { MonsterData } from '@/domain/types';

export class BattleSimulator {
  private character: Character;
  private monster: MonsterData;
  private monsterHp: number;
  private isPlayerTurn: boolean;
  private frames: BattleFrame[];
  private currentFrameIndex: number;

  constructor(character: Character, monster: MonsterData) {
    this.character = character;
    this.monster = monster;
    this.monsterHp = monster.hp;
    this.isPlayerTurn = true;
    this.frames = [];
    this.currentFrameIndex = -1;
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  simulateRound(): BattleFrame {
    let frame: BattleFrame;

    if (this.isPlayerTurn) {
      const baseDamage = this.character.attack - Math.floor(this.monster.defense / 2) + this.randomInt(-2, 3);
      const isCritical = Math.random() < 0.15;
      const damage = Math.max(1, isCritical ? baseDamage * 2 : baseDamage);
      this.monsterHp = Math.max(0, this.monsterHp - damage);

      frame = {
        type: 'attack',
        attacker: this.character.name,
        target: this.monster.name,
        damage,
        isCritical,
        playerHp: this.character.hp,
        playerMaxHp: this.character.maxHp,
        monsterHp: this.monsterHp,
        monsterMaxHp: this.monster.hp,
        message: `${this.character.name} attacks ${this.monster.name} for ${damage} damage${isCritical ? ' (Critical!)' : ''}`
      };
    } else {
      const baseDamage = this.monster.attack - Math.floor(this.character.defense / 2) + this.randomInt(-2, 3);
      const isCritical = Math.random() < 0.15;
      const damage = Math.max(1, isCritical ? baseDamage * 2 : baseDamage);
      this.character.hp = Math.max(0, this.character.hp - damage);

      frame = {
        type: 'attack',
        attacker: this.monster.name,
        target: this.character.name,
        damage,
        isCritical,
        playerHp: this.character.hp,
        playerMaxHp: this.character.maxHp,
        monsterHp: this.monsterHp,
        monsterMaxHp: this.monster.hp,
        message: `${this.monster.name} attacks ${this.character.name} for ${damage} damage${isCritical ? ' (Critical!)' : ''}`
      };
    }

    this.frames.push(frame);
    this.currentFrameIndex = this.frames.length - 1;
    this.isPlayerTurn = !this.isPlayerTurn;

    return frame;
  }

  tryFlee(): boolean {
    return Math.random() < 0.5;
  }

  isOver(): boolean {
    return this.character.isDead() || this.monsterHp <= 0;
  }

  getPlayerHp(): number {
    return this.character.hp;
  }

  getMonsterHp(): number {
    return this.monsterHp;
  }

  getCurrentState(): BattleState {
    return {
      isPlayerTurn: this.isPlayerTurn,
      isBattleOver: this.isOver(),
      playerWon: this.monsterHp <= 0,
      frames: this.frames,
      currentFrameIndex: this.currentFrameIndex
    };
  }
}
