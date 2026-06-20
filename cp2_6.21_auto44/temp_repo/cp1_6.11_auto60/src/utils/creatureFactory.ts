import { Creature, Element, Team, CREATURE_NAMES } from '../types';

let creatureIdCounter = 0;

function generateId(): string {
  return `creature_${++creatureIdCounter}_${Date.now().toString(36)}`;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomName(element: Element, usedNames: Set<string>): string {
  const names = CREATURE_NAMES[element];
  const availableNames = names.filter(name => !usedNames.has(name));
  if (availableNames.length === 0) {
    return `${names[randomInt(0, names.length - 1)]}${randomInt(2, 9)}`;
  }
  const name = availableNames[randomInt(0, availableNames.length - 1)];
  usedNames.add(name);
  return name;
}

export function createCreature(element: Element, team: Team, usedNames: Set<string>): Creature {
  return {
    id: generateId(),
    name: getRandomName(element, usedNames),
    element,
    attack: randomInt(5, 15),
    maxHp: randomInt(20, 50),
    currentHp: randomInt(20, 50),
    speed: randomInt(1, 5),
    team,
    isAlive: true
  };
}

export function createCreatureSet(team: Team): Creature[] {
  const usedNames = new Set<string>();
  const creatures: Creature[] = [];
  
  for (let i = 0; i < 4; i++) {
    creatures.push(createCreature('fire', team, usedNames));
  }
  for (let i = 0; i < 4; i++) {
    creatures.push(createCreature('water', team, usedNames));
  }
  for (let i = 0; i < 4; i++) {
    creatures.push(createCreature('grass', team, usedNames));
  }
  
  return creatures;
}

export function resetCreatureHp(creatures: Creature[]): void {
  for (const creature of creatures) {
    creature.currentHp = creature.maxHp;
    creature.isAlive = true;
  }
}
