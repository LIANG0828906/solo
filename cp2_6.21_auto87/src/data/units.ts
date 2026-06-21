import type { Unit, PlayerSide } from '../types/game';

export function createHero(owner: PlayerSide, position: { x: number; y: number }): Unit {
  return {
    id: `hero_${owner}_${Date.now()}`,
    type: 'hero',
    name: owner === 'player' ? '光明骑士' : '暗影领主',
    hp: 30,
    maxHp: 30,
    attack: 2,
    baseAttack: 2,
    shield: 0,
    position,
    owner,
    effects: [],
  };
}

export function createMinion(
  owner: PlayerSide,
  position: { x: number; y: number },
  index: number,
): Unit {
  const minionNames = owner === 'player'
    ? ['白银战士', '神圣牧师', '风暴法师']
    : ['骷髅战士', '暗影祭司', '火焰术士'];

  const minionStats = [
    { hp: 8, attack: 3 },
    { hp: 6, attack: 2 },
    { hp: 5, attack: 4 },
  ];

  const stats = minionStats[index % 3];
  const name = minionNames[index % 3];

  return {
    id: `minion_${owner}_${index}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'minion',
    name,
    hp: stats.hp,
    maxHp: stats.hp,
    attack: stats.attack,
    baseAttack: stats.attack,
    shield: 0,
    position,
    owner,
    effects: [],
  };
}
