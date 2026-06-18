import type { CharacterClass } from './types';

export class Character {
  id: string;
  name: string;
  className: CharacterClass;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  weapon: string;
  armor: string;
  potionCount: number;

  constructor(characterClass: CharacterClass) {
    this.className = characterClass;
    this.name = characterClass;
    this.id = 'player';
    this.weapon = '';
    this.armor = '';
    this.potionCount = 3;

    switch (characterClass) {
      case 'warrior':
        this.hp = 100;
        this.maxHp = 100;
        this.attack = 15;
        this.defense = 12;
        break;
      case 'mage':
        this.hp = 60;
        this.maxHp = 60;
        this.attack = 22;
        this.defense = 5;
        break;
      case 'rogue':
        this.hp = 80;
        this.maxHp = 80;
        this.attack = 18;
        this.defense = 8;
        break;
    }
  }

  takeDamage(damage: number): number {
    const actualDamage = Math.max(1, damage - Math.floor(this.defense / 2));
    this.hp = Math.max(0, this.hp - actualDamage);
    return actualDamage;
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  isDead(): boolean {
    return this.hp <= 0;
  }

  equipWeapon(attackBonus: number, name: string): void {
    this.attack += attackBonus;
    this.weapon = name;
  }

  equipArmor(defenseBonus: number, name: string): void {
    this.defense += defenseBonus;
    this.armor = name;
  }

  usePotion(): number {
    if (this.potionCount <= 0) return 0;
    this.potionCount--;
    const healAmount = 30;
    this.heal(healAmount);
    return healAmount;
  }

  getHpPercent(): number {
    return (this.hp / this.maxHp) * 100;
  }
}
