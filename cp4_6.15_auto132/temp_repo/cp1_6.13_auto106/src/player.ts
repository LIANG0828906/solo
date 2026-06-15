import {
  PlayerState, Position, Equipment, EquipmentType, CONFIG, Direction
} from './types';
import { SeededRandom, generateId, generateWeapon, generateArmor } from './utils';

export interface EquipResult {
  equipped: boolean;
  oldEquipment?: Equipment;
  newEquipment: Equipment;
  message: string;
}

export class Player {
  private state: PlayerState;
  private rng: SeededRandom;

  constructor(id: number, name: string, color: string, startPos: Position, seed?: number) {
    this.rng = new SeededRandom(seed ?? Date.now() + id);
    this.state = {
      id,
      name,
      color,
      position: { ...startPos },
      renderPosition: { ...startPos },
      maxHp: CONFIG.PLAYER_MAX_HP,
      hp: CONFIG.PLAYER_MAX_HP,
      baseAttack: CONFIG.PLAYER_BASE_ATTACK,
      baseDefense: CONFIG.PLAYER_BASE_DEFENSE,
      defeatedMonsters: 0,
      isMoving: false,
      moveProgress: 0,
      moveDirection: null,
      attackAnimation: 0
    };
  }

  getState(): Readonly<PlayerState> {
    return this.state;
  }

  getId(): number {
    return this.state.id;
  }

  getName(): string {
    return this.state.name;
  }

  getPosition(): Position {
    return { ...this.state.position };
  }

  getRenderPosition(): Position {
    return { ...this.state.renderPosition };
  }

  setRenderPosition(pos: Position): void {
    this.state.renderPosition = { ...pos };
  }

  getHp(): number {
    return this.state.hp;
  }

  getMaxHp(): number {
    return this.state.maxHp;
  }

  getAttack(): number {
    let total = this.state.baseAttack;
    if (this.state.weapon) {
      total += this.state.weapon.attackBonus;
    }
    return total;
  }

  getDefense(): number {
    let total = this.state.baseDefense;
    if (this.state.armor) {
      total += this.state.armor.defenseBonus;
    }
    return total;
  }

  getWeapon(): Equipment | undefined {
    return this.state.weapon;
  }

  getArmor(): Equipment | undefined {
    return this.state.armor;
  }

  getDefeatedMonsters(): number {
    return this.state.defeatedMonsters;
  }

  getWeaponColor(): string {
    return this.state.weapon?.color ?? '#808080';
  }

  getArmorColor(): string {
    return this.state.armor?.color ?? '#4169E1';
  }

  hasArmor(): boolean {
    return !!this.state.armor;
  }

  setPosition(pos: Position): void {
    this.state.position = { ...pos };
  }

  startMove(direction: Direction): boolean {
    if (this.state.isMoving) return false;

    this.state.isMoving = true;
    this.state.moveProgress = 0;
    this.state.moveDirection = direction;
    return true;
  }

  updateMove(deltaTime: number): boolean {
    if (!this.state.isMoving) return false;

    this.state.moveProgress += deltaTime / CONFIG.MOVE_DURATION;

    if (this.state.moveProgress >= 1) {
      this.state.moveProgress = 1;
      this.finishMove();
      return true;
    }

    return false;
  }

  private finishMove(): void {
    if (!this.state.moveDirection) return;

    const dir = this.state.moveDirection;
    switch (dir) {
      case 'UP': this.state.position.y -= 1; break;
      case 'DOWN': this.state.position.y += 1; break;
      case 'LEFT': this.state.position.x -= 1; break;
      case 'RIGHT': this.state.position.x += 1; break;
    }

    this.state.renderPosition = { ...this.state.position };
    this.state.isMoving = false;
    this.state.moveProgress = 0;
    this.state.moveDirection = null;
  }

  getMoveProgress(): number {
    return this.state.moveProgress;
  }

  isMoving(): boolean {
    return this.state.isMoving;
  }

  getMoveDirection(): Direction | null {
    return this.state.moveDirection;
  }

  takeDamage(amount: number): number {
    const actualDamage = Math.max(1, amount);
    this.state.hp = Math.max(0, this.state.hp - actualDamage);
    return actualDamage;
  }

  heal(amount: number): number {
    const oldHp = this.state.hp;
    this.state.hp = Math.min(this.state.maxHp, this.state.hp + amount);
    return this.state.hp - oldHp;
  }

  isDead(): boolean {
    return this.state.hp <= 0;
  }

  tryEquip(newEquipment: Equipment): EquipResult {
    const type = newEquipment.type;
    const currentEquip = type === 'WEAPON' ? this.state.weapon : this.state.armor;

    if (!currentEquip) {
      this.equipItem(newEquipment);
      return {
        equipped: true,
        newEquipment,
        message: `获得了 ${newEquipment.name}！`
      };
    }

    return {
      equipped: false,
      oldEquipment: currentEquip,
      newEquipment,
      message: `已有 ${currentEquip.name}，是否替换为 ${newEquipment.name}？`
    };
  }

  confirmEquip(newEquipment: Equipment, replace: boolean): boolean {
    if (replace) {
      this.equipItem(newEquipment);
      return true;
    }
    return false;
  }

  private equipItem(equipment: Equipment): void {
    if (equipment.type === 'WEAPON') {
      this.state.weapon = equipment;
    } else {
      this.state.armor = equipment;
    }
  }

  incrementDefeatedMonsters(): void {
    this.state.defeatedMonsters++;
    this.heal(5);
  }

  setAttackAnimation(value: number): void {
    this.state.attackAnimation = value;
  }

  getAttackAnimation(): number {
    return this.state.attackAnimation;
  }

  updateAttackAnimation(deltaTime: number): void {
    if (this.state.attackAnimation > 0) {
      this.state.attackAnimation = Math.max(0, this.state.attackAnimation - deltaTime * 5);
    }
  }

  reset(startPos: Position, seed?: number): void {
    this.rng = new SeededRandom(seed ?? Date.now() + this.state.id);
    this.state.position = { ...startPos };
    this.state.renderPosition = { ...startPos };
    this.state.maxHp = CONFIG.PLAYER_MAX_HP;
    this.state.hp = CONFIG.PLAYER_MAX_HP;
    this.state.baseAttack = CONFIG.PLAYER_BASE_ATTACK;
    this.state.baseDefense = CONFIG.PLAYER_BASE_DEFENSE;
    this.state.weapon = undefined;
    this.state.armor = undefined;
    this.state.defeatedMonsters = 0;
    this.state.isMoving = false;
    this.state.moveProgress = 0;
    this.state.moveDirection = null;
    this.state.attackAnimation = 0;
  }

  generateRandomEquipment(type: EquipmentType): Equipment {
    if (type === 'WEAPON') {
      const data = generateWeapon(this.rng);
      return {
        id: generateId(),
        type: 'WEAPON',
        name: data.name,
        attackBonus: data.bonus,
        defenseBonus: 0,
        color: data.color
      };
    } else {
      const data = generateArmor(this.rng);
      return {
        id: generateId(),
        type: 'ARMOR',
        name: data.name,
        attackBonus: 0,
        defenseBonus: data.bonus,
        color: data.color
      };
    }
  }
}
