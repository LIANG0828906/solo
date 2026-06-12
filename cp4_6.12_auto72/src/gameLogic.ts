import type { Pet, PetStats, WildPet, Particle, ElementType } from './types';
import { getPetTemplate, getSkill, SKILLS, getTypeEffectiveness, WILD_PET_POOL } from './petData';

let petIdCounter = 0;

export function createPet(templateId: string, level: number = 5): Pet {
  const template = getPetTemplate(templateId);
  if (!template) throw new Error(`Unknown pet template: ${templateId}`);
  
  const levelMultiplier = 1 + (level - 1) * 0.08;
  const stats: PetStats = {
    hp: Math.floor(template.baseStats.maxHp * levelMultiplier),
    maxHp: Math.floor(template.baseStats.maxHp * levelMultiplier),
    attack: Math.floor(template.baseStats.attack * levelMultiplier),
    defense: Math.floor(template.baseStats.defense * levelMultiplier),
    speed: Math.floor(template.baseStats.speed * levelMultiplier),
  };
  
  const skills = template.skills.slice(0, Math.min(3, Math.floor(level / 3) + 1))
    .map(id => getSkill(id)!)
    .filter(Boolean);
  
  petIdCounter++;
  
  return {
    id: `pet_${petIdCounter}`,
    templateId,
    name: template.name,
    level,
    exp: 0,
    expToNext: level * 100,
    stats,
    skills,
    element: template.element,
    color: template.color,
    spriteData: JSON.parse(JSON.stringify(template.spriteData)),
    x: 0,
    y: 0,
    direction: 1,
    walkFrame: 0,
    walkTimer: 0,
    moveTargetX: 0,
    moveTargetY: 0,
    isMoving: false,
    moveSpeed: 1.5,
  };
}

export function createWildPet(templateId?: string, level?: number): WildPet {
  const poolId = templateId || WILD_PET_POOL[Math.floor(Math.random() * WILD_PET_POOL.length)];
  const petLevel = level ?? Math.floor(Math.random() * 8) + 2;
  const pet = createPet(poolId, petLevel) as WildPet;
  
  pet.wanderTimer = 0;
  pet.wanderCooldown = Math.random() * 2 + 1;
  
  return pet;
}

export function calculateDamage(attacker: Pet, defender: Pet, skillIndex: number): number {
  const skill = attacker.skills[skillIndex];
  if (!skill) return 0;
  
  if (Math.random() * 100 > skill.accuracy) {
    return -1;
  }
  
  const typeEffectiveness = getTypeEffectiveness(skill.element, defender.element);
  const baseDamage = ((2 * attacker.level / 5 + 2) * skill.power * attacker.stats.attack / defender.stats.defense) / 50 + 2;
  const randomFactor = 0.85 + Math.random() * 0.15;
  const stab = skill.element === attacker.element ? 1.2 : 1;
  
  return Math.floor(baseDamage * typeEffectiveness * randomFactor * stab);
}

export function addExp(pet: Pet, exp: number): boolean {
  pet.exp += exp;
  if (pet.exp >= pet.expToNext) {
    return true;
  }
  return false;
}

export function levelUp(pet: Pet): boolean {
  if (pet.exp < pet.expToNext) return false;
  
  pet.exp -= pet.expToNext;
  pet.level++;
  pet.expToNext = pet.level * 100;
  
  const hpGain = Math.floor(Math.random() * 3) + 2;
  const atkGain = Math.floor(Math.random() * 3) + 2;
  const defGain = Math.floor(Math.random() * 3) + 1;
  const spdGain = Math.floor(Math.random() * 2) + 1;
  
  pet.stats.maxHp += hpGain;
  pet.stats.hp = pet.stats.maxHp;
  pet.stats.attack += atkGain;
  pet.stats.defense += defGain;
  pet.stats.speed += spdGain;
  
  return true;
}

export function checkEvolution(pet: Pet): string | null {
  const template = getPetTemplate(pet.templateId);
  if (!template || !template.evolution) return null;
  
  const { to, condition } = template.evolution;
  if (pet.level >= condition.level) {
    return to;
  }
  return null;
}

export function evolvePet(pet: Pet): Pet {
  const evolveTo = checkEvolution(pet);
  if (!evolveTo) return pet;
  
  const newTemplate = getPetTemplate(evolveTo);
  if (!newTemplate) return pet;
  
  pet.templateId = evolveTo;
  pet.name = newTemplate.name;
  pet.element = newTemplate.element;
  pet.color = newTemplate.color;
  pet.spriteData = JSON.parse(JSON.stringify(newTemplate.spriteData));
  
  pet.stats.maxHp = Math.floor(pet.stats.maxHp * 1.3);
  pet.stats.hp = pet.stats.maxHp;
  pet.stats.attack = Math.floor(pet.stats.attack * 1.3);
  pet.stats.defense = Math.floor(pet.stats.defense * 1.3);
  pet.stats.speed = Math.floor(pet.stats.speed * 1.3);
  
  const currentSkillIds = new Set(pet.skills.map(s => s.id));
  for (const skillId of newTemplate.skills) {
    if (!currentSkillIds.has(skillId) && pet.skills.length < 4) {
      const skill = getSkill(skillId);
      if (skill) {
        pet.skills.push(skill);
      }
    }
  }
  
  return pet;
}

export function calculateCatchRate(enemy: Pet, pokeballType: string = 'normal'): number {
  const hpPercent = enemy.stats.hp / enemy.stats.maxHp;
  let catchRate = 0;
  
  if (pokeballType === 'normal') {
    catchRate = ((1 - hpPercent) * 0.5 + 0.1) * (1 / enemy.level * 2);
  }
  
  return Math.min(0.95, Math.max(0.05, catchRate));
}

export function createParticles(
  x: number,
  y: number,
  count: number,
  color: string,
  speed: number = 2
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = Math.random() * speed + 0.5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 1,
      life: 30 + Math.random() * 20,
      maxLife: 50,
      color,
      size: Math.random() * 3 + 2,
    });
  }
  return particles;
}

export function updateParticles(particles: Particle[]): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.1,
      life: p.life - 1,
    }))
    .filter(p => p.life > 0);
}

export function getElementName(element: ElementType): string {
  const names: Record<ElementType, string> = {
    fire: '火',
    water: '水',
    grass: '草',
    normal: '普通',
  };
  return names[element];
}
