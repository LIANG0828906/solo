import { PetInstance, PetTemplate, PET_TEMPLATES, RARITY_WEIGHTS, Rarity, calculatePower, BLIND_BOX_COST, TOTAL_SLOTS } from '@/data/petData';
import { useUserStore } from '@/stores/userStore';

function pickRarity(): Rarity {
  const r = Math.random();
  if (r < RARITY_WEIGHTS.legendary) return 'legendary';
  if (r < RARITY_WEIGHTS.legendary + RARITY_WEIGHTS.rare) return 'rare';
  return 'common';
}

function pickTemplate(rarity: Rarity): PetTemplate {
  const pool = PET_TEMPLATES.filter((t) => t.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

function randomizeStat(base: number): number {
  const factor = 0.9 + Math.random() * 0.2;
  return Math.round(base * factor);
}

let uidCounter = Date.now();
function generateUid(): string {
  return `pet_${++uidCounter}`;
}

export function canOpenBlindBox(): boolean {
  return useUserStore.getState().points >= BLIND_BOX_COST;
}

export function openBlindBox(): PetInstance | null {
  const store = useUserStore.getState();
  if (store.points < BLIND_BOX_COST) return null;

  const nextSlot = store.getNextSlot();
  if (nextSlot < 0) return null;

  const rarity = pickRarity();
  const template = pickTemplate(rarity);
  const hp = randomizeStat(template.baseHp);
  const attack = randomizeStat(template.baseAttack);
  const speed = randomizeStat(template.baseSpeed);

  const pet: PetInstance = {
    uid: generateUid(),
    templateId: template.id,
    name: template.name,
    rarity,
    hp,
    attack,
    speed,
    power: calculatePower(hp, attack, speed),
    slotIndex: nextSlot,
  };

  store.deductPoints(BLIND_BOX_COST);
  store.addPet(pet);

  return pet;
}

export function getSlotsWithPets(): (PetInstance | null)[] {
  const pets = useUserStore.getState().pets;
  const slots: (PetInstance | null)[] = new Array(TOTAL_SLOTS).fill(null);
  for (const pet of pets) {
    if (pet.slotIndex >= 0 && pet.slotIndex < TOTAL_SLOTS) {
      slots[pet.slotIndex] = pet;
    }
  }
  return slots;
}
