import { Player, Item, ItemType, PlayerStats, MAP_SIZE } from './types';

function createInitialStats(): PlayerStats {
  return {
    totalMoves: 0,
    totalAttacks: 0,
    chestsCollected: 0
  };
}

export function createPlayer(id: 1 | 2, heroType: 1 | 2): Player {
  const spawnX = id === 1 ? 1 : MAP_SIZE - 2;
  const spawnY = id === 1 ? 1 : MAP_SIZE - 2;
  const color = id === 1 ? '#4A90D9' : '#D94A4A';

  return {
    id,
    x: spawnX,
    y: spawnY,
    renderX: spawnX,
    renderY: spawnY,
    hp: 100,
    maxHp: 100,
    attack: 10,
    baseAttack: 10,
    stealth: false,
    turnsWithoutMoving: 0,
    inventory: [],
    stats: createInitialStats(),
    color,
    heroType,
    extraAction: false,
    alertAction: false,
    revealed: false,
    revealTimer: 0,
    isMoving: false,
    moveProgress: 0,
    isAttacking: false,
    attackProgress: 0,
    attackDirection: { x: 0, y: 0 },
    pickupEffect: null,
    pickupEffectTimer: 0
  };
}

export function resetPlayer(player: Player): void {
  const spawnX = player.id === 1 ? 1 : MAP_SIZE - 2;
  const spawnY = player.id === 1 ? 1 : MAP_SIZE - 2;

  player.x = spawnX;
  player.y = spawnY;
  player.renderX = spawnX;
  player.renderY = spawnY;
  player.hp = player.maxHp;
  player.attack = player.baseAttack;
  player.stealth = false;
  player.turnsWithoutMoving = 0;
  player.inventory = [];
  player.stats = createInitialStats();
  player.extraAction = false;
  player.alertAction = false;
  player.revealed = false;
  player.revealTimer = 0;
  player.isMoving = false;
  player.moveProgress = 0;
  player.isAttacking = false;
  player.attackProgress = 0;
  player.pickupEffect = null;
  player.pickupEffectTimer = 0;
}

export function updateStealthState(player: Player): void {
  if (player.turnsWithoutMoving >= 2) {
    player.stealth = true;
  }
}

export function breakStealth(player: Player): void {
  player.stealth = false;
  player.turnsWithoutMoving = 0;
}

export function addItem(player: Player, item: Item): void {
  player.inventory.push(item);

  switch (item.type) {
    case ItemType.HEAL:
      player.hp = Math.min(player.maxHp, player.hp + 20);
      break;
    case ItemType.ATTACK_BOOST:
      player.attack += 5;
      break;
    case ItemType.EXTRA_ACTION:
      player.extraAction = true;
      break;
  }

  player.stats.chestsCollected++;
  player.pickupEffect = item.type;
  player.pickupEffectTimer = 2000;
}

export function dealDamage(player: Player, damage: number): number {
  const actualDamage = Math.max(0, damage);
  player.hp = Math.max(0, player.hp - actualDamage);
  
  if (player.stealth) {
    player.stealth = false;
    player.turnsWithoutMoving = 0;
  }
  
  return actualDamage;
}

export function isAlive(player: Player): boolean {
  return player.hp > 0;
}

export function getOtherPlayerId(id: 1 | 2): 1 | 2 {
  return id === 1 ? 2 : 1;
}

export function getOtherPlayer(players: [Player, Player], currentId: 1 | 2): Player {
  return players.find(p => p.id !== currentId) as Player;
}

export function updateRevealTimer(player: Player, deltaTime: number): void {
  if (player.revealed && player.revealTimer > 0) {
    player.revealTimer -= deltaTime;
    if (player.revealTimer <= 0) {
      player.revealed = false;
      player.revealTimer = 0;
    }
  }
}

export function updatePickupEffectTimer(player: Player, deltaTime: number): void {
  if (player.pickupEffect !== null && player.pickupEffectTimer > 0) {
    player.pickupEffectTimer -= deltaTime;
    if (player.pickupEffectTimer <= 0) {
      player.pickupEffect = null;
      player.pickupEffectTimer = 0;
    }
  }
}

export function canMove(player: Player, hasActed: boolean): boolean {
  if (player.isMoving || player.isAttacking) return false;
  if (hasActed && !player.extraAction && !player.alertAction) return false;
  return true;
}

export function canAttack(player: Player, hasActed: boolean): boolean {
  if (player.isMoving || player.isAttacking) return false;
  if (hasActed && !player.extraAction && !player.alertAction) return false;
  return true;
}

export function useExtraAction(player: Player): boolean {
  if (player.extraAction) {
    player.extraAction = false;
    return true;
  }
  if (player.alertAction) {
    player.alertAction = false;
    return true;
  }
  return false;
}

export function createRandomItem(): Item {
  const types = [ItemType.HEAL, ItemType.ATTACK_BOOST, ItemType.EXTRA_ACTION];
  const type = types[Math.floor(Math.random() * types.length)];
  
  switch (type) {
    case ItemType.HEAL:
      return { type, name: '治疗药水', icon: '❤️' };
    case ItemType.ATTACK_BOOST:
      return { type, name: '力量符文', icon: '⚔️' };
    case ItemType.EXTRA_ACTION:
      return { type, name: '疾风卷轴', icon: '💨' };
  }
}

export function getItemEmoji(type: ItemType): string {
  switch (type) {
    case ItemType.HEAL: return '❤️';
    case ItemType.ATTACK_BOOST: return '⚔️';
    case ItemType.EXTRA_ACTION: return '💨';
  }
}
