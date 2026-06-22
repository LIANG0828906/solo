import { useGameStore } from './store/gameStore';
import { generateMap, getPlayerStartPosition } from './maps/MapGenerator';
import type { Position, Item, Monster } from './types';
import {
  calculatePlayerDamage,
  calculateMonsterDamage,
  useSkill as executeSkill,
  processBuffDamage,
  generateLoot,
} from './combat/CombatSystem';

export function initGame(seed?: number, floor?: number): void {
  const state = useGameStore.getState();
  const currentSeed = seed ?? Math.floor(Math.random() * 1000000);
  const currentFloor = floor ?? state.currentFloor;

  const mapData = generateMap(currentSeed, currentFloor);
  const startPos = getPlayerStartPosition(mapData);

  useGameStore.setState({
    mapData,
    phase: 'exploring',
  });

  state.setPlayer({
    ...state.player,
    position: startPos,
  });

  state.updateTileVisibility(startPos);
}

export function tryMovePlayer(direction: 'up' | 'down' | 'left' | 'right'): void {
  const state = useGameStore.getState();
  if (state.phase !== 'exploring' || !state.mapData) return;

  const { x, y } = state.player.position;
  let newPos: Position = { x, y };

  switch (direction) {
    case 'up':
      newPos = { x, y: y - 1 };
      break;
    case 'down':
      newPos = { x, y: y + 1 };
      break;
    case 'left':
      newPos = { x: x - 1, y };
      break;
    case 'right':
      newPos = { x: x + 1, y };
      break;
  }

  if (
    newPos.x < 0 ||
    newPos.x >= state.mapData.width ||
    newPos.y < 0 ||
    newPos.y >= state.mapData.height
  ) {
    return;
  }

  const targetTile = state.mapData.tiles[newPos.y][newPos.x];
  if (targetTile.type === 'wall') {
    return;
  }

  const monsterAtPos = state.mapData.monsters.find(
    (m) => m.position.x === newPos.x && m.position.y === newPos.y
  );

  if (monsterAtPos) {
    state.startCombat(monsterAtPos);
    return;
  }

  const itemAtPos = state.mapData.items.find(
    (i) => i.position.x === newPos.x && i.position.y === newPos.y
  );

  state.movePlayer(newPos);
  state.updateTileVisibility(newPos);

  if (itemAtPos) {
    state.addItem(itemAtPos.item);
    state.removeMapItem(itemAtPos.id);
    state.addCombatLog({
      message: `✨ 你拾取了 ${getRarityColor(itemAtPos.item.rarity)}${itemAtPos.item.name}！`,
      type: 'loot',
    });
  }
}

function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: '',
    uncommon: '【精良】',
    rare: '【稀有】',
    epic: '【史诗】',
    legendary: '【传说】',
  };
  return colors[rarity] || '';
}

export function playerAutoAttack(): void {
  const state = useGameStore.getState();
  if (!state.combat.isInCombat || !state.combat.currentMonster) return;

  const monster = state.combat.currentMonster;
  const result = calculatePlayerDamage(state.player.stats, monster);

  if (result.isDodged) {
    state.addCombatLog({ message: result.message, type: 'player_attack' });
  } else {
    const newHp = Math.max(0, monster.hp - result.damage);
    state.updateMonsterHp(newHp);
    state.addCombatLog({ message: result.message, type: 'player_attack' });

    if (newHp <= 0) {
      handleMonsterDefeated(monster);
      return;
    }
  }
}

export function useSkill(skillIndex: number): void {
  const state = useGameStore.getState();
  if (!state.combat.isInCombat || !state.combat.currentMonster) return;
  if (skillIndex < 0 || skillIndex >= state.player.skills.length) return;

  const skill = state.player.skills[skillIndex];
  const monster = state.combat.currentMonster;
  const result = executeSkill(skill, state.player.stats, monster);

  if (!result.success) {
    state.addCombatLog({ message: result.message, type: 'system' });
    return;
  }

  if (skill.currentCooldown === 0) {
    state.updateSkillCooldown(skill.id, skill.cooldown);
  }

  state.updatePlayerStats({
    mp: Math.max(0, state.player.stats.mp - result.manaCost),
  });

  if (result.damage !== undefined && monster) {
    const newHp = Math.max(0, monster.hp - result.damage);
    state.updateMonsterHp(newHp);
    state.addCombatLog({ message: result.message, type: 'player_attack' });

    if (newHp <= 0) {
      handleMonsterDefeated(monster);
      return;
    }
  }

  if (result.heal !== undefined) {
    const newHp = Math.min(state.player.stats.maxHp, state.player.stats.hp + result.heal);
    state.updatePlayerStats({ hp: newHp });
    state.addCombatLog({ message: result.message, type: 'skill' });
  }

  if (result.damage !== undefined && result.heal === undefined && !result.isCrit && monster.hp - result.damage > 0) {
    state.addCombatLog({ message: result.message, type: 'skill' });
  }
}

export function monsterAttack(): void {
  const state = useGameStore.getState();
  if (!state.combat.isInCombat || !state.combat.currentMonster) return;

  const monster = state.combat.currentMonster;

  const { totalDamage: buffDamage, messages: buffMessages } = processBuffDamage(state.player.buffs);
  for (const msg of buffMessages) {
    state.addCombatLog({ message: msg, type: 'player_attack' });
  }
  if (buffDamage > 0 && monster) {
    const newMonsterHp = Math.max(0, monster.hp - buffDamage);
    state.updateMonsterHp(newMonsterHp);
    if (newMonsterHp <= 0) {
      handleMonsterDefeated(monster);
      return;
    }
  }

  const result = calculateMonsterDamage(monster, state.player.stats);

  if (result.isDodged) {
    state.addCombatLog({ message: result.message, type: 'monster_attack' });
  } else {
    const newHp = Math.max(0, state.player.stats.hp - result.damage);
    state.updatePlayerStats({ hp: newHp });
    state.addCombatLog({ message: result.message, type: 'monster_attack' });

    if (newHp <= 0) {
      state.endCombat(false);
      state.addCombatLog({ message: '💀 你被击败了...', type: 'system' });
      return;
    }
  }

  state.reduceAllSkillCooldowns();
  state.updateBuffs();
}

function handleMonsterDefeated(monster: Monster): void {
  const state = useGameStore.getState();
  const loot = generateLoot(monster, state.currentFloor);

  state.addCombatLog({
    message: `🎉 你击败了 ${monster.name}！获得 ${monster.expReward} 点经验`,
    type: 'level_up',
  });

  state.addExp(monster.expReward);

  if (loot.gold > 0) {
    state.updatePlayerStats({ gold: state.player.stats.gold + loot.gold });
    state.addCombatLog({
      message: `💰 获得 ${loot.gold} 金币`,
      type: 'loot',
    });
  }

  for (const item of loot.items) {
    state.addItem(item as Item);
    state.addCombatLog({
      message: `✨ 获得装备: ${getRarityColor(item.rarity)}${item.name}`,
      type: 'loot',
    });
  }

  state.removeMapMonster(monster.id);
  state.endCombat(true);

  if (monster.isBoss) {
    useGameStore.setState({ phase: 'victory' });
  }
}

export function useInventoryItem(itemId: string): void {
  useGameStore.getState().useItem(itemId);
}

export function equipInventoryItem(item: Item): void {
  useGameStore.getState().equipItem(item);
}
